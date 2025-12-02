import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const trackingSlug = url.pathname.split('/').pop();
    
    console.log("Tracking click for:", trackingSlug);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the offer
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*')
      .eq('tracking_slug', trackingSlug)
      .single();

    if (offerError || !offer) {
      return new Response('Offer not found', { status: 404 });
    }

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Get request info
    const userAgent = req.headers.get('user-agent') || '';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || '';
    
    // Hash IP for privacy
    const ipHash = ip ? await hashString(ip) : null;

    // Record the click
    await supabase
      .from('clicks')
      .insert({
        offer_id: offer.id,
        coach_id: offer.coach_id,
        session_id: sessionId,
        source_channel: 'link',
        user_agent: userAgent,
        ip_hash: ipHash,
      });

    console.log("Click recorded, redirecting to:", offer.target_url);

    // Redirect to target URL
    return new Response(null, {
      status: 302,
      headers: {
        Location: offer.target_url,
      },
    });
  } catch (error) {
    console.error('Error in track function:', error);
    return new Response('Error processing request', { status: 500 });
  }
});

async function hashString(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
