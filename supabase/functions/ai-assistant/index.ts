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
  // Pre-check for affirmative responses - these are engagement signals, not low-effort
  const affirmativePatterns = /^(yes|yea|yeah|yep|yup|sure|ok|okay|definitely|absolutely|please|yes please|yea please|tell me|show me|i'm interested|interested|sounds good|let's do it|let's go|go ahead|for sure|100%|bet|down|i'm down)\.?!?$/i;
  if (affirmativePatterns.test(message.trim())) {
    console.log('Message matched affirmative pattern, classifying as QUESTION');
    return 'QUESTION';
  }
  
  try {
    const classificationPrompt = `Classify this Instagram DM message into exactly one category. Reply with ONLY the category name, nothing else.

Categories:
- SALES_INTENT: User is asking about purchasing, pricing, enrollment, or showing buying intent
- QUESTION: User is asking a genuine question, seeking information, OR responding affirmatively to continue conversation (like "yes", "tell me more", "interested")
- PERSONAL: Casual/personal message like "hey bro", "what's up", friendship chat, not business related
- LOW_EFFORT: ONLY emoji-only messages or meaningless reactions like "🔥", "lol", "😂😂". NOT affirmative responses.

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
// Only use name if it looks like a real name (not a numeric ID)
function getNeutralResponse(intent: MessageIntent, contactName?: string): string {
  // Don't use name if it looks like an ID (all numbers, or contains "Unknown")
  const isRealName = contactName && !/^\d+$/.test(contactName) && !contactName.includes('Unknown');
  const firstName = isRealName ? contactName.split(' ')[0] : '';
  
  if (intent === 'LOW_EFFORT') {
    const responses = [
      '🙌',
      'Thanks! Let me know if you have any questions.',
      '👊',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (intent === 'PERSONAL') {
    const greeting = firstName ? `Hey ${firstName}! ` : 'Hey! ';
    return `${greeting}What's up?`;
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

    // Check if there's an existing session with business intent already established
    const { data: existingSession } = await supabase
      .from('dm_sessions')
      .select('question_count')
      .eq('coach_id', coachId)
      .eq('user_handle', userHandle)
      .single();

    const hasEstablishedBusinessIntent = existingSession && existingSession.question_count > 0;
    
    // Step 1: Classify the message intent - but skip classification if business intent already established
    let intent: MessageIntent;
    
    if (hasEstablishedBusinessIntent) {
      // Once business intent is established, treat all follow-up messages as QUESTION
      // This prevents losing context when user answers qualifying questions
      intent = 'QUESTION';
      console.log('Business intent already established (question_count:', existingSession.question_count, '), treating as QUESTION');
    } else {
      // First message - classify normally
      intent = await classifyMessage(message, lovableApiKey);
      console.log('Message classified as:', intent);
    }

    // Handle low-effort or personal messages with neutral responses ONLY for first message
    if (!hasEstablishedBusinessIntent && (intent === 'LOW_EFFORT' || intent === 'PERSONAL')) {
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
      .select('name, brand_name, plan, system_prompt, tone, response_style, brand_voice, escalation_email, max_questions_before_cta, main_checkout_url')
      .eq('id', coachId)
      .single();

    if (coachError || !coach) {
      console.error('Error fetching coach:', coachError);
      throw new Error('Coach not found');
    }

    const coachDisplayName = coach.brand_name || coach.name;
    const maxQuestionsBeforeCta = coach.max_questions_before_cta || 3; // Default to 3 messages before CTA
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

    // Step 6: Get conversation history from session
    const conversationHistory = Array.isArray(session?.messages) ? session.messages : [];
    console.log(`Conversation history: ${conversationHistory.length} messages`);

    // Step 7: Build system prompt - Universal AgentX Conversational Engine
    // These rules are GENERIC - coach-specific content comes from their uploaded training materials
    const humanBehaviorRules = `
ROLE & PURPOSE
You are a trained DM conversation agent responding inside messaging platforms as if you are part of the user's team.
You use the uploaded content, training material, notes, scripts, and tone samples as your knowledge base.
Your purpose is to:
- Respond like a real human teammate
- Maintain natural, context-aware conversations
- Qualify interest
- Handle objections
- Guide the conversation toward the next logical step (defined by the uploaded content)

You never reveal that you are AI. You speak as a trusted human representative.

CORE GOAL
Turn inbound messages into qualified, ready-to-act prospects and move them toward the next step defined by the training materials (e.g., booking, purchasing, applying, opting in, etc.).

STYLE GUIDELINES
- Short, DM-style replies (1-3 sentences)
- No emojis
- Clear, confident, direct
- Calm and human
- Slightly authoritative and grounded
- No hype or filler
- Always move the conversation forward
- Never send one-word replies
- Never end without a question or CTA

Tone: Precise. Helpful. Human. Expert. Not robotic. Not salesy.

CONVERSATION ENGINE (LOGIC LOOP)
Follow this structure every time:
1. Answer what they said / asked
2. Add helpful context using uploaded content
3. Ask one qualifying or advancement question
4. Repeat the loop

Never break this pattern.

QUALIFICATION BEHAVIOR
Ask simple, relevant questions based on the uploaded training content.
Purpose: understand context, intent, goals, and whether they're suitable for the next step.

Example questions (adapt to persona):
- "Where are you starting from right now?"
- "What are you aiming to improve?"
- "What's been the hardest part so far?"
- "What have you tried already?"
- "What made you reach out today?"

HOW TO USE TRAINING MATERIAL
The uploaded training content is your truth source. Use it for:
- Persona & tone
- Offer details
- FAQ answers
- Objection handling
- Positioning
- How to describe the next step
- Examples, metaphors, and explanations
- The user's worldview or method

Never invent details outside the uploaded content.
If content is missing, ask a clarifying question instead of guessing.

AGENT CHARACTER
You must:
- Lead conversations with clarity
- Stay calm and confident
- Ask concise questions
- Maintain control of the conversation
- Move steadily toward the next step
- Never be pushy
- Never use emojis
- Never sound unsure
- Always act like a real human teammate

OBJECTION HANDLING
When handling objections:
1. Acknowledge the concern: "Makes sense - a lot of people feel that way."
2. Clarify using uploaded content: "From what you shared, here's the key thing to understand..."
3. Redirect with a question or next step: "What part feels most unclear right now?" or "Want me to walk you through how that works?"

Never use pressure. Never argue. Stay grounded and informative.

CLOSING BEHAVIOR
When someone shows interest, curiosity, or intent:
- Ask a few short clarifying questions relevant to the training content
- Transition into the next step using the precise CTA defined by the uploaded materials

Examples:
- "If you want, I can walk you through the next step."
- "Want me to show you how that works?"
- "I can break that down for you - want the quick version?"

Always end with a clear CTA or question.

PRICING GUIDANCE
Do NOT give pricing unless the training content explicitly specifies what to say.
If no pricing details exist, use:
"Pricing depends on your situation and goals. Once I understand that, I can point you in the right direction."
And follow with a CTA defined by the training content.

FOLLOW-UP RULES
- Never end a message without a question
- Never leave a dead-end reply
- Keep the conversation moving
- Match the user's energy level
- Don't over-explain
- Don't send paragraphs
- No emojis
- If someone isn't a fit, politely redirect using the training guidance

OUTPUT FORMAT
- Plain text
- 1-3 sentence messages
- Always end with a question or CTA
- No emojis
- No long paragraphs
`;

    let systemPrompt = '';
    
    if (hasTrainingContent) {
      // Training content defines the bot's personality, business knowledge, and behavior
      systemPrompt = `${trainingContent}

${humanBehaviorRules}

CONTEXT:
- Responding as ${coachDisplayName} on Instagram DM
- Message #${newQuestionCount} from this person
- Their name: ${contactName || 'unknown'}
${intent === 'SALES_INTENT' ? '- They seem interested in buying' : ''}
${intent === 'QUESTION' ? '- They have a question' : ''}
${conversationHistory.length > 0 ? '- IMPORTANT: Review the conversation history below and DO NOT repeat anything you already said' : ''}`;
    } else if (isPremium && coach.system_prompt) {
      // Premium users with custom system prompt but no uploaded training
      systemPrompt = `${coach.system_prompt}\n\n${humanBehaviorRules}`;
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

      systemPrompt = `You are responding to DMs for ${coachDisplayName}. ${humanBehaviorRules}

- ${isStandardOrHigher ? toneInstructions[coachTone] : 'Be helpful and conversational'}
- ${isStandardOrHigher ? styleInstructions[responseStyle] : 'Keep it brief'}
${isPremium && coach.brand_voice ? `- Voice: ${coach.brand_voice}` : ''}`;
    }

    // Step 8: Build messages array with conversation history
    const messagesForAI: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add conversation history so AI knows what was already said
    for (const msg of conversationHistory.slice(-10)) { // Last 10 messages for context
      if (msg && typeof msg === 'object' && 'role' in msg && 'content' in msg) {
        messagesForAI.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: String(msg.content)
        });
      }
    }
    
    // Add current message
    messagesForAI.push({ role: 'user', content: message });

    // Step 9: Generate AI response
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messagesForAI,
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

    // Step 10: Save conversation to session history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: reply }
    ].slice(-20); // Keep last 20 messages

    await supabase
      .from('dm_sessions')
      .update({ messages: updatedHistory })
      .eq('id', session!.id);

    // Step 11: Add CTA after configured questions threshold
    // Uses coach's main_checkout_url OR active offer tracking link
    let trackingLink: string | null = null;
    
    // Default threshold is 3 if not set
    const ctaThreshold = maxQuestionsBeforeCta || 3;

    if (newQuestionCount >= ctaThreshold) {
      // Priority: coach's main_checkout_url > offer tracking link
      let ctaLink = coach.main_checkout_url;
      
      if (!ctaLink) {
        // Fallback to offer tracking link if no main URL set
        const { data: offers } = await supabase
          .from('offers')
          .select('*')
          .eq('coach_id', coachId)
          .eq('is_active', true)
          .limit(1);

        const offer = offers?.[0];
        if (offer) {
          const baseUrl = supabaseUrl.replace('/rest/v1', '').replace(/\/$/, '');
          ctaLink = `${baseUrl}/functions/v1/track/${offer.tracking_slug}`;
        }
      }
      
      if (ctaLink) {
        trackingLink = ctaLink;
        
        // Generic CTAs that work for any business (booking, course, product, etc.)
        const ctaMessages = [
          `\n\nFrom what you've shared, sounds like this could be a good fit. Here's where you can take the next step: ${ctaLink}`,
          `\n\nBased on what you're telling me, I think you'd get a lot out of this. Check it out here: ${ctaLink}`,
          `\n\nHonestly, this sounds like exactly what you need. Here's the link if you want to move forward: ${ctaLink}`,
        ];
        const ctaIndex = newQuestionCount % ctaMessages.length;
        reply += ctaMessages[ctaIndex];
        
        console.log(`Added CTA at message #${newQuestionCount} (threshold: ${ctaThreshold}), link: ${ctaLink}`);
      } else {
        console.log(`No CTA link available for coach ${coachId} - coach should set main_checkout_url or create an offer`);
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
