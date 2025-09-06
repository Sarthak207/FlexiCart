import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Use service role to update database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        
        if (!userId) {
          console.error("User ID not found in session metadata");
          break;
        }

        if (session.mode === "subscription") {
          // Handle subscription
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const planType = session.metadata?.plan_type || "monthly";
          
          const { error: subError } = await supabaseService
            .from("subscriptions")
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              status: subscription.status === "active" ? "active" : "inactive",
              plan_type: planType as "monthly" | "yearly",
              amount: planType === "monthly" ? 999 : 9999,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }, {
              onConflict: "user_id"
            });

          if (subError) {
            console.error("Error updating subscription:", subError);
            throw subError;
          }
        } else {
          // Handle one-time payment
          const { error: transactionError } = await supabaseService
            .from("transactions")
            .insert({
              user_id: userId,
              payment_id: session.payment_intent as string,
              payment_method: "stripe",
              payment_status: "succeeded",
              status: "completed",
              total: (session.amount_total || 0) / 100,
              items: [], // Can be populated from cart data
            });

          if (transactionError) {
            console.error("Error creating transaction:", transactionError);
            throw transactionError;
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Handle successful subscription payments
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          const { error } = await supabaseService
            .from("subscriptions")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          if (error) {
            console.error("Error updating subscription status:", error);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        // Handle failed subscription payments
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          const { error } = await supabaseService
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          if (error) {
            console.error("Error updating subscription status:", error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
