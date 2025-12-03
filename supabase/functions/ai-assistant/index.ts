import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Message classification types
type MessageIntent = 'SALES_INTENT' | 'QUESTION' | 'PERSONAL' | 'LOW_EFFORT';

interface RequestBody {
  coach_id: string;
  user_handle: string;
  message: string;
  source_channel?: string;
  contact_id?: string;
  location_id?: string;
  contact_name?: string;
  contact_email?: string;
}

interface AIResponse {
  reply: string;
  question_count: number;
  tracking_link: string | null;
  should_reply?: boolean;
  intent?: MessageIntent;
}

// Classify the incoming message intent
async function classifyMessage(message: string, apiKey: string): Promise<MessageIntent> {
  try {
    const classificationPrompt = `Classify this Instagram DM message into exactly one category. Reply with ONLY the category name, nothing else.

Categories:
- SALES_INTENT: User is asking about purchasing, pricing, enrollment, or showing buying intent
- QUESTION: User is asking a genuine question about content, programs, or seeking information
- PERSONAL: Casual/personal message like "hey bro", "what's up", friendship chat, not business related
- LOW_EFFORT: Emoji-only, single word reactions like "🔥", "lol", "nice", "love this", "😂😂"

Message: "${message}"

Category:`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: classificationPrompt }],
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      console.error('Classification API error:', response.status);
      return 'QUESTION'; // Default to QUESTION on error
    }

    const data = await response.json();
    const classification = data.choices?.[0]?.message?.content?.trim().toUpperCase() || 'QUESTION';
    
    // Validate it's one of our expected values
    if (['SALES_INTENT', 'QUESTION', 'PERSONAL', 'LOW_EFFORT'].includes(classification)) {
      return classification as MessageIntent;
    }
    return 'QUESTION';
  } catch (error) {
    console.error('Error classifying message:', error);
    return 'QUESTION';
  }
}

// Generate a short neutral response for personal/low-effort messages
function getNeutralResponse(intent: MessageIntent, contactName?: string): string {
  const name = contactName ? contactName.split(' ')[0] : '';
  
  if (intent === 'LOW_EFFORT') {
    const responses = [
      '🙌',
      'Thanks! Let me know if you have any questions.',
      '👊',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (intent === 'PERSONAL') {
    const greeting = name ? `Hey ${name}! ` : 'Hey! ';
    return `${greeting}Thanks for reaching out! If you have any questions about the program, I'm here to help. 🙌`;
  }
  
  return '';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body - support both direct JSON and nested GHL payloads
    const rawBody = await req.json();
    
    // Log everything coming from GHL so we can see the real shape
    console.log("RAW GHL BODY:", JSON.stringify(rawBody, null, 2));

    const data = rawBody.customData ?? rawBody.data ?? rawBody;

    // Helper: return first non-empty string
    const pickString = (...cands: any[]) => {
      for (const c of cands) {
        if (typeof c === "string" && c.trim().length > 0) {
          return c.trim();
        }
      }
      return undefined;
    };

    // -------------------------------
    // 1. Coach ID (must be present)
    // -------------------------------
    const coach_id = pickString(
      data.coach_id,
      rawBody.coach_id,
      data.coachId,
      rawBody.coachId,
    );

    // -------------------------------
    // 2. Contact Name / User Handle (safe fallback)
    // -------------------------------
    let contact_name = pickString(
      data.contact_name,
      rawBody.contact_name,
      rawBody.contact?.full_name,
      rawBody.contact?.name,
      rawBody.contact?.first_name,
      rawBody.contact?.last_name,
      data.contactName,
      rawBody.contactName,
    );

    // fallback if GHL gives nothing
    if (!contact_name) {
      contact_name =
        rawBody.contact_id ||
        data.contact_id ||
        "Unknown_User_" + Date.now().toString();
    }

    // User handle for session tracking - prefer explicit handle, fall back to contact_name
    let user_handle = pickString(
      data.user_handle,
      data.userHandle,
      data.instagramHandle,
      rawBody.user_handle,
      rawBody.userHandle,
      rawBody.instagram_username,
      data.contact_id,
      rawBody.contact_id,
    );

    if (!user_handle) {
      user_handle = contact_name;
    }

    // -------------------------------
    // 3. Message (IG → GHL has 8+ shapes)
    // -------------------------------
    let message = pickString(
      data.message,
      data.data?.message,            // GHL sometimes nests this
      rawBody.message,
      rawBody.body,
      rawBody.text,
      rawBody.content,
      rawBody.message?.body,
      rawBody.message?.text,
      rawBody.message?.content,
      rawBody.conversation?.last_message,
      data.last_inbound_message,
      data.lastMessage,
    );

    // Hard fallback if message still empty
    if (!message && typeof rawBody.message === "object") {
      message = pickString(
        rawBody.message.body,
        rawBody.message.text,
        rawBody.message.content,
      );
    }

    // Final safety check
    if (!message) message = "";

    // Debug what we actually parsed
    console.log("PARSED FIELDS:", {
      coach_id,
      user_handle,
      contact_name,
      message,
      message_length: message.length,
      data_keys: Object.keys(data || {}),
      rawBody_keys: Object.keys(rawBody || {}),
    });

    // Only require coach_id and non-empty message
    if (!coach_id || !message) {
      console.error("Missing required fields after parsing:", {
        coach_id,
        user_handle,
        message,
      });

      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: coach_id and message are required. Check GHL webhook mapping.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Default if not explicitly sent
    const source_channel = pickString(
      data.source_channel,
      data.sourceChannel,
      rawBody.source_channel,
      rawBody.sourceChannel,
    ) || "instagram";

    // Optional fields
    const contact_id = pickString(data.contact_id, data.contactId, rawBody.contact_id);
    const location_id = pickString(data.location_id, data.locationId, rawBody.location_id);
    const contact_email = pickString(data.contact_email, data.contactEmail, rawBody.contact_email, rawBody.email);

    console.log('AI Assistant request:', { 
      coach_id, 
      user_handle,
      contact_name,
      source_channel,
      contact_id,
      location_id,
      message_length: message.length 
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Classify the message intent
    const intent = await classifyMessage(message, lovableApiKey);
    console.log('Message classified as:', intent);

    // Handle low-effort or personal messages with neutral responses
    if (intent === 'LOW_EFFORT' || intent === 'PERSONAL') {
      const neutralReply = getNeutralResponse(intent, contact_name);
      
      // Still track the session even for neutral responses
      let { data: session } = await supabase
        .from('dm_sessions')
        .select('*')
        .eq('coach_id', coach_id)
        .eq('user_handle', user_handle)
        .single();

      if (!session) {
        const { data: newSession } = await supabase
          .from('dm_sessions')
          .insert({
            coach_id,
            user_handle,
            question_count: 1,
            last_question_at: new Date().toISOString(),
          })
          .select()
          .single();
        session = newSession;
      } else {
        await supabase
          .from('dm_sessions')
          .update({ 
            question_count: session.question_count + 1,
            last_question_at: new Date().toISOString(),
          })
          .eq('id', session.id);
      }

      const finalPayload = {
        reply: neutralReply,
        message: neutralReply, // Alias for GHL compatibility
        question_count: session?.question_count || 1,
        tracking_link: null,
        should_reply: true,
        intent,
      };

      console.log('FINAL RESPONSE TO GHL (neutral):', JSON.stringify(finalPayload, null, 2));

      return new Response(JSON.stringify(finalPayload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Get or create DM session
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
        console.error('Error creating session:', createError);
        throw new Error('Failed to create DM session');
      }
      session = newSession;
    }

    // Step 3: Increment question count
    const newQuestionCount = (session?.question_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('dm_sessions')
      .update({ 
        question_count: newQuestionCount,
        last_question_at: new Date().toISOString(),
      })
      .eq('id', session!.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    // Step 4: Get coach info
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('name, brand_name')
      .eq('id', coach_id)
      .single();

    if (coachError || !coach) {
      console.error('Error fetching coach:', coachError);
      throw new Error('Coach not found');
    }

    const coachDisplayName = coach.brand_name || coach.name;

    // Step 5: Retrieve relevant embeddings (top 5 chunks)
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('embeddings')
      .select('content_chunk')
      .eq('coach_id', coach_id)
      .limit(5);

    if (embeddingsError) {
      console.error('Error fetching embeddings:', embeddingsError);
    }

    const courseContext = embeddings?.map(e => e.content_chunk).join('\n\n') || '';
    const hasContent = courseContext.length > 0;

    // Step 6: Build system prompt
    const systemPrompt = `You are an AI assistant for ${coachDisplayName}. You help answer questions from potential customers via Instagram DM.

${hasContent ? `Use the following course/program content as your knowledge base:

${courseContext}

` : ''}Guidelines:
- Be helpful, friendly, and conversational — this is a DM, not an email
- Keep responses concise (2-4 sentences max unless more detail is needed)
- Match the coach's tone and style
- Never contradict the course content
- If you don't know something, be honest and offer to connect them with the coach
- Don't be overly salesy in early messages
${intent === 'SALES_INTENT' ? '- The user seems interested in buying/enrolling — be helpful about next steps' : ''}`;

    // Step 7: Generate AI response
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
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    let reply = aiData.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response. Please try again.';

    // Step 8: Add CTA after 3+ questions if offer exists
    let trackingLink: string | null = null;

    if (newQuestionCount >= 3) {
      const { data: offers } = await supabase
        .from('offers')
        .select('*')
        .eq('coach_id', coach_id)
        .eq('is_active', true)
        .limit(1);

      const offer = offers?.[0];

      if (offer) {
        // Build tracking link - derive base URL from SUPABASE_URL
        const baseUrl = supabaseUrl.replace('/rest/v1', '').replace(/\/$/, '');
        trackingLink = `${baseUrl}/functions/v1/track/${offer.tracking_slug}`;

        // Append CTA to reply
        const ctaMessages = [
          `\n\nI cover this in detail in my full program. Ready to dive in? ${trackingLink}`,
          `\n\nWant the complete breakdown? Check out my program here: ${trackingLink}`,
          `\n\nI go much deeper on this in my course. Here's the link if you're ready: ${trackingLink}`,
        ];
        const ctaIndex = newQuestionCount % ctaMessages.length;
        reply += ctaMessages[ctaIndex];
      }
    }

    // Step 9: Build and return response
    const finalPayload = {
      reply,
      message: reply, // Alias for GHL compatibility
      question_count: newQuestionCount,
      tracking_link: trackingLink,
      should_reply: true,
      intent,
    };

    console.log('FINAL RESPONSE TO GHL:', JSON.stringify(finalPayload, null, 2));

    return new Response(JSON.stringify(finalPayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    const errorReply = 'Sorry, something went wrong. Please try again.';
    const errorPayload = { 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      reply: errorReply,
      message: errorReply, // Alias for GHL compatibility
      question_count: 0,
      tracking_link: null,
      should_reply: false,
    };

    console.log('FINAL RESPONSE TO GHL (error):', JSON.stringify(errorPayload, null, 2));

    return new Response(
      JSON.stringify(errorPayload),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
