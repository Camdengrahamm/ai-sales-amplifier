import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coach_id, user_handle, message, source_channel = "instagram" } = await req.json();
    
    console.log("AI Assistant request:", { coach_id, user_handle, source_channel });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get or create DM session
    let { data: session, error: sessionError } = await supabase
      .from('dm_sessions')
      .select('*')
      .eq('coach_id', coach_id)
      .eq('user_handle', user_handle)
      .single();

    if (sessionError || !session) {
      const { data: newSession, error: createError } = await supabase
        .from('dm_sessions')
        .insert({
          coach_id,
          user_handle,
          question_count: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating session:", createError);
        throw createError;
      }
      session = newSession;
    }

    // Increment question count
    const newQuestionCount = session.question_count + 1;
    await supabase
      .from('dm_sessions')
      .update({ 
        question_count: newQuestionCount,
        last_question_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    // Get coach info
    const { data: coach } = await supabase
      .from('coaches')
      .select('name, brand_name')
      .eq('id', coach_id)
      .single();

    // Retrieve relevant course content (embeddings)
    const { data: embeddings } = await supabase
      .from('embeddings')
      .select('content_chunk')
      .eq('coach_id', coach_id)
      .limit(3);

    const courseContext = embeddings?.map(e => e.content_chunk).join('\n\n') || '';

    // Build system prompt
    const systemPrompt = `You are an AI assistant for ${coach?.brand_name || coach?.name || 'a coach'}. 
You help answer questions about their program using the following course content:

${courseContext}

Be helpful, friendly, and professional. Keep responses concise but valuable.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    let reply = aiData.choices[0].message.content;

    // Get active offer for CTA
    const { data: offers } = await supabase
      .from('offers')
      .select('*')
      .eq('coach_id', coach_id)
      .eq('is_active', true)
      .limit(1);

    const offer = offers?.[0];
    let trackingLink = null;

    // Add CTA after 3+ questions
    if (newQuestionCount >= 3 && offer) {
      trackingLink = `${supabaseUrl.replace('/rest/v1', '')}/functions/v1/track/${offer.tracking_slug}`;
      reply += `\n\nI break this down step-by-step in my full program. Here's the link to join:\n${trackingLink}`;
    }

    return new Response(
      JSON.stringify({
        reply,
        question_count: newQuestionCount,
        tracking_link: trackingLink,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
