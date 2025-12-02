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
    const { 
      offer_slug, 
      contact_email, 
      amount, 
      currency = 'USD',
      external_sale_id,
      purchased_at = new Date().toISOString(),
    } = await req.json();

    console.log("Sales webhook received:", { offer_slug, contact_email, amount });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the offer
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*, coaches(*)')
      .eq('tracking_slug', offer_slug)
      .single();

    if (offerError || !offer) {
      console.error("Offer not found:", offer_slug);
      throw new Error('Offer not found');
    }

    // Try to match to a recent click (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentClick } = await supabase
      .from('clicks')
      .select('*')
      .eq('offer_id', offer.id)
      .eq('contact_email', contact_email)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate commission
    const commissionRate = offer.commission_rate || offer.coaches.default_commission_rate || 10.00;
    const commissionDue = (Number(amount) * Number(commissionRate)) / 100;

    // Insert sale
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        offer_id: offer.id,
        coach_id: offer.coach_id,
        click_id: recentClick?.id || null,
        external_sale_id,
        contact_email,
        amount,
        currency,
        commission_rate_used: commissionRate,
        commission_due: commissionDue,
        source: 'webhook',
        purchased_at,
      })
      .select()
      .single();

    if (saleError) {
      console.error("Error creating sale:", saleError);
      throw saleError;
    }

    console.log("Sale recorded successfully:", sale.id);

    return new Response(
      JSON.stringify({
        success: true,
        sale_id: sale.id,
        commission_due: commissionDue,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in sales-webhook function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
