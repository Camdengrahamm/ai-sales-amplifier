import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Message classification types
type MessageIntent = 'SALES_INTENT' | 'QUESTION' | 'PERSONAL' | 'LOW_EFFORT';

// ManyChat webhook payload type
type WebhookPayload = {
  source?: string;
  platform?: string;
  source_channel?: string;
  coach_id?: string;
  coachId?: string;
  user_handle?: string;
  userHandle?: string;
  instagramHandle?: string;
  contact_id?: string;
  contactId?: string;
  contact_name?: string;
  contactName?: string;
  contact_email?: string;
  contactEmail?: string;
  message?: string | { body?: string; text?: string; content?: string };
  last_inbound_message?: string;
  lastMessage?: string;
  location_id?: string;
  locationId?: string;
  // Nested data support
  customData?: WebhookPayload;
  data?: WebhookPayload;
};

interface AIResponse {
  reply: string;
  question_count: number;
  tracking_link: string | null;
  should_reply?: boolean;
  intent?: MessageIntent;
}

// Default coach ID fallback when invalid UUID is provided
const DEFAULT_COACH_ID = "6abbc19a-ef88-4359-9dde-169d247f696f";

// UUID validator
const isUuid = (value: string | undefined): boolean =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

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
    // Parse and validate request body - support both ManyChat and generic payloads
    const rawBody = await req.json() as WebhookPayload;
    
    // Log incoming payload for debugging
    console.log("RAW WEBHOOK BODY:", JSON.stringify(rawBody, null, 2));

    // Support nested data structures (customData or data)
    const data = rawBody.customData ?? rawBody.data ?? rawBody;

    // Helper: return first non-empty string
    const pickString = (...cands: unknown[]): string | undefined => {
      for (const c of cands) {
        if (typeof c === "string" && c.trim().length > 0) {
          return c.trim();
        }
      }
      return undefined;
    };

    // -------------------------------
    // 1. Coach ID - validate UUID, fallback to default
    // -------------------------------
    const rawCoachId = pickString(
      data.coach_id,
      rawBody.coach_id,
      data.coachId,
      rawBody.coachId,
    );
    
    // Use valid UUID or fall back to default
    const coachId = isUuid(rawCoachId) ? rawCoachId! : DEFAULT_COACH_ID;
    
    if (!isUuid(rawCoachId)) {
      console.warn('Invalid or missing coach_id, using default:', {
        received: rawCoachId,
        using: DEFAULT_COACH_ID,
      });
    }

    // -------------------------------
    // 2. Contact Name / User Handle
    // -------------------------------
    let contactName = pickString(
      data.contact_name,
      rawBody.contact_name,
      data.contactName,
      rawBody.contactName,
    );

    // Fallback if nothing provided
    if (!contactName) {
      contactName = pickString(
        rawBody.contact_id,
        data.contact_id,
      ) || "Unknown_User_" + Date.now().toString();
    }

    // User handle for session tracking
    let userHandle = pickString(
      data.user_handle,
      data.userHandle,
      data.instagramHandle,
      rawBody.user_handle,
      rawBody.userHandle,
      data.contact_id,
      rawBody.contact_id,
    );

    if (!userHandle) {
      userHandle = contactName;
    }

    // -------------------------------
    // 3. Message - handle multiple formats
    // -------------------------------
    let message = pickString(
      typeof data.message === 'string' ? data.message : undefined,
      typeof rawBody.message === 'string' ? rawBody.message : undefined,
      data.last_inbound_message,
      data.lastMessage,
    );

    // Handle message as object (e.g., { body: "text" })
    if (!message && typeof rawBody.message === "object" && rawBody.message) {
      message = pickString(
        rawBody.message.body,
        rawBody.message.text,
        rawBody.message.content,
      );
    }

    // Final safety check
    if (!message) message = "";

    // -------------------------------
    // 4. Source / Platform
    // -------------------------------
    const source = pickString(
      data.source,
      rawBody.source,
      data.source_channel,
      rawBody.source_channel,
      data.platform,
      rawBody.platform,
    ) || "manychat";

    // -------------------------------
    // 5. Optional fields
    // -------------------------------
    const contactId = pickString(data.contact_id, data.contactId, rawBody.contact_id) ?? "";
    const contactEmail = pickString(data.contact_email, data.contactEmail, rawBody.contact_email);

    // Debug what we actually parsed
    console.log("PARSED FIELDS:", {
      coachId,
      userHandle,
      contactName,
      contactId,
      source,
      message,
      message_length: message.length,
    });

    // Validate required fields
    if (!message) {
      console.error("Missing required field: message");

      return new Response(
        JSON.stringify({
          error: "Missing required field: message is required",
          reply: "Sorry, I couldn't process your message.",
          message: "Sorry, I couldn't process your message.",
          question_count: 0,
          tracking_link: null,
          should_reply: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('AI Assistant request:', { 
      coachId, 
      userHandle,
      contactName,
      source,
      contactId,
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
      const neutralReply = getNeutralResponse(intent, contactName);
      
      // Still track the session even for neutral responses
      let { data: session } = await supabase
        .from('dm_sessions')
        .select('*')
        .eq('coach_id', coachId)
        .eq('user_handle', userHandle)
        .single();

      if (!session) {
        const { data: newSession } = await supabase
          .from('dm_sessions')
          .insert({
            coach_id: coachId,
            user_handle: userHandle,
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
        message: neutralReply,
        question_count: session?.question_count || 1,
        tracking_link: null,
        should_reply: true,
        intent,
      };

      console.log('FINAL RESPONSE (neutral):', JSON.stringify(finalPayload, null, 2));

      return new Response(JSON.stringify(finalPayload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Upsert contact from ManyChat
    const platform = source.toLowerCase().includes('instagram') ? 'instagram' : source;
    if (contactId && userHandle) {
      const { error: contactError } = await supabase
        .from('contacts')
        .upsert({
          coach_id: coachId,
          platform,
          contact_id: contactId,
          user_handle: userHandle,
          first_name: contactName?.split(' ')[0] || null,
          last_name: contactName?.split(' ').slice(1).join(' ') || null,
          email: contactEmail || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'coach_id,platform,contact_id',
        });

      if (contactError) {
        console.warn('Error upserting contact:', contactError);
      } else {
        console.log('Contact upserted successfully:', { contactId, userHandle });
      }
    }

    // Step 3: Get or create DM session
    let { data: session, error: sessionError } = await supabase
      .from('dm_sessions')
      .select('*')
      .eq('coach_id', coachId)
      .eq('user_handle', userHandle)
      .single();

    if (sessionError || !session) {
      const { data: newSession, error: createError } = await supabase
        .from('dm_sessions')
        .insert({
          coach_id: coachId,
          user_handle: userHandle,
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

    // Step 4: Get coach info with customization settings
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('name, brand_name, plan, system_prompt, tone, response_style, brand_voice, escalation_email, max_questions_before_cta')
      .eq('id', coachId)
      .single();

    if (coachError || !coach) {
      console.error('Error fetching coach:', coachError);
      throw new Error('Coach not found');
    }

    const coachDisplayName = coach.brand_name || coach.name;
    const maxQuestionsBeforeCta = coach.max_questions_before_cta || 3;
    const coachTone = coach.tone || 'friendly';
    const responseStyle = coach.response_style || 'concise';
    const isPremium = coach.plan === 'premium';
    const isStandardOrHigher = coach.plan === 'standard' || coach.plan === 'premium';

    // Step 5: Retrieve ALL training content for this coach
    // The uploaded content contains the actual bot training/behavior instructions
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('embeddings')
      .select('content_chunk')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: true });
    
    if (embeddingsError) {
      console.error('Error fetching embeddings:', embeddingsError);
    }
    
    console.log(`Found ${embeddings?.length || 0} training content chunks for coach`);

    // Combine all training content - this IS the bot's training
    const trainingContent = embeddings?.map(e => e.content_chunk).join('\n\n') || '';
    const hasTrainingContent = trainingContent.length > 0;
    
    console.log(`Training content length: ${trainingContent.length} chars`);
    if (hasTrainingContent) {
      console.log('Training content preview (first 500 chars):', trainingContent.substring(0, 500));
    }

    // Step 6: Build system prompt - training content IS the behavior instructions
    let systemPrompt = '';
    
    if (hasTrainingContent) {
      // The uploaded content contains the bot's actual training/personality/behavior instructions
      // Use it AS the system prompt, not just as context
      systemPrompt = `${trainingContent}

---
CURRENT CONTEXT:
- You are responding to a DM on behalf of ${coachDisplayName}
- This is question #${newQuestionCount} from this user
- Platform: Instagram DM
- Keep responses DM-appropriate (short, direct, conversational)
${intent === 'SALES_INTENT' ? '- This user seems interested in buying/enrolling' : ''}
${intent === 'QUESTION' ? '- This user has a question - answer helpfully then guide toward next step' : ''}`;
    } else if (isPremium && coach.system_prompt) {
      // Premium users with custom system prompt but no uploaded training
      systemPrompt = coach.system_prompt;
    } else {
      // Fallback for coaches without training content
      const toneInstructions: Record<string, string> = {
        friendly: 'Be warm, approachable, and conversational',
        professional: 'Be polished, articulate, and business-like',
        casual: 'Be relaxed, informal, and use casual language',
        motivational: 'Be energetic, encouraging, and inspiring',
      };

      const styleInstructions: Record<string, string> = {
        concise: 'Keep responses brief (2-3 sentences max)',
        detailed: 'Provide thorough, comprehensive answers',
        conversational: 'Write like you\'re having a natural conversation',
      };

      systemPrompt = `You are an AI assistant for ${coachDisplayName}. You help answer questions from potential customers via Instagram DM.

Guidelines:
- ${isStandardOrHigher ? toneInstructions[coachTone] : 'Be helpful, friendly, and conversational'} — this is a DM, not an email
- ${isStandardOrHigher ? styleInstructions[responseStyle] : 'Keep responses concise (2-4 sentences max unless more detail is needed)'}
- Match the coach's tone and style
- If you don't know something, be honest${isPremium && coach.escalation_email ? ` and mention they can email ${coach.escalation_email}` : ' and offer to connect them with the coach'}
- Don't be overly salesy in early messages
${isPremium && coach.brand_voice ? `- Brand voice: ${coach.brand_voice}` : ''}
${intent === 'SALES_INTENT' ? '- The user seems interested in buying/enrolling — be helpful about next steps' : ''}`;
    }

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
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again later.',
            reply: 'Sorry, I\'m a bit busy right now. Please try again in a moment.',
            message: 'Sorry, I\'m a bit busy right now. Please try again in a moment.',
            question_count: newQuestionCount,
            tracking_link: null,
            should_reply: false,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'AI service credits exhausted.',
            reply: 'Sorry, something went wrong. Please try again later.',
            message: 'Sorry, something went wrong. Please try again later.',
            question_count: newQuestionCount,
            tracking_link: null,
            should_reply: false,
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    let reply = aiData.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response. Please try again.';

    // Step 8: Add CTA after configured questions threshold if offer exists
    let trackingLink: string | null = null;

    if (newQuestionCount >= maxQuestionsBeforeCta) {
      const { data: offers } = await supabase
        .from('offers')
        .select('*')
        .eq('coach_id', coachId)
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
      message: reply,
      question_count: newQuestionCount,
      tracking_link: trackingLink,
      should_reply: true,
      intent,
    };

    console.log('FINAL RESPONSE:', JSON.stringify(finalPayload, null, 2));

    return new Response(JSON.stringify(finalPayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    const errorReply = 'Sorry, something went wrong. Please try again.';
    const errorPayload = { 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      reply: errorReply,
      message: errorReply,
      question_count: 0,
      tracking_link: null,
      should_reply: false,
    };

    console.log('FINAL RESPONSE (error):', JSON.stringify(errorPayload, null, 2));

    return new Response(
      JSON.stringify(errorPayload),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
