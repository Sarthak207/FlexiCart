import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Razorpay from "https://esm.sh/razorpay@2.9.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from request
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { amount, cartItems, currency = 'INR' } = await req.json();

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: Deno.env.get("RAZORPAY_KEY_ID") || "",
      key_secret: Deno.env.get("RAZORPAY_KEY_SECRET") || "",
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: `order_${Date.now()}`,
    });

    // Save transaction to database
    const { data: transaction, error } = await supabaseClient
      .from("transactions")
      .insert([
        {
          user_id: user.id,
          items: cartItems,
          total: amount,
          payment_method: "razorpay",
          payment_id: order.id,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error saving transaction:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        transaction_id: transaction.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});