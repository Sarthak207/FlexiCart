import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Razorpay from "https://esm.sh/razorpay@2.9.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { payment_id, order_id, signature } = await req.json();

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: Deno.env.get("RAZORPAY_KEY_ID") || "",
      key_secret: Deno.env.get("RAZORPAY_KEY_SECRET") || "",
    });

    // Verify payment signature
    const expectedSignature = require("crypto")
      .createHmac("sha256", Deno.env.get("RAZORPAY_KEY_SECRET"))
      .update(order_id + "|" + payment_id)
      .digest("hex");

    if (expectedSignature === signature) {
      // Update transaction status
      const { error } = await supabaseClient
        .from("transactions")
        .update({
          status: "completed",
          payment_id: payment_id,
        })
        .eq("payment_id", order_id);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, message: "Payment verified successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Payment verification failed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});