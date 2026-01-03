import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const handlePaymentIntent = async (event: Stripe.Event) => {
  const paymentIntent = (event.data.object as Stripe.PaymentIntent) || null;
  const cartId = paymentIntent?.metadata?.cartId || null;
  const status = paymentIntent?.status || null;
  console.log("Payment Intent ID:", paymentIntent.id);
  try {
    if (status === "succeeded") {
      const { data, error } = await supabase
        .from("carts")
        .update({ status: "checkedout" })
        .eq("id", cartId)
        .select();
      if (error) throw error;

      console.log("Saved purchase:", data);
      if (!data) {
        console.log("No row found, retrying...");
        await new Promise((r) => setTimeout(r, 1000));

        const { data: retryData, error: retryError } = await supabase
          .from("carts")
          .update({ status: "checkedout" })
          .eq("id", cartId)
          .select();

        if (retryError) throw retryError;
        console.log("Retry saved purchase:", retryData);
      } else {
        console.log("Row found:", data);
      }
    }
  } catch (error) {
    console.error("Error saving purchase:", error);
    return new NextResponse("Database updated failed", { status: 500 });
  }
};

export default handlePaymentIntent;
