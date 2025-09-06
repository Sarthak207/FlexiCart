import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  sessionId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId }: VerifyRequest = await req.json();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    if (!session) {
      throw new Error("Session not found");
    }

    // Use service role to update database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const userId = session.metadata?.user_id;
    if (!userId) {
      throw new Error("User ID not found in session metadata");
    }

    if (session.mode === 'subscription') {
      // Handle subscription
      const subscription = session.subscription as Stripe.Subscription;
      const planType = session.metadata?.plan_type || 'monthly';
      
      if (session.payment_status === 'paid' && subscription) {
        // Upsert subscription record
        const { error: subError } = await supabaseService
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status === 'active' ? 'active' : 'inactive',
            plan_type: planType as 'monthly' | 'yearly',
            amount: planType === 'monthly' ? 999 : 9999,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (subError) {
          console.error('Error updating subscription:', subError);
          throw subError;
        }
      }
    } else {
      // Handle one-time payment - create transaction record
      if (session.payment_status === 'paid') {
        const { error: transactionError } = await supabaseService
          .from('transactions')
          .insert({
            user_id: userId,
            payment_id: session.payment_intent as string,
            payment_method: 'stripe',
            payment_status: 'succeeded',
            status: 'completed',
            total: (session.amount_total || 0) / 100, // Convert from cents
            items: [], // Empty for now, can be populated from cart data
          });

        if (transactionError) {
          console.error('Error creating transaction:', transactionError);
          throw transactionError;
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      paymentStatus: session.payment_status,
      mode: session.mode
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});