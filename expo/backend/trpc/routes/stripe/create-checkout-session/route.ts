import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";
import { stripe, getPriceId, getProductDef } from "@/backend/stripe-client";

export default publicProcedure
  .input(
    z.object({
      tier: z.enum(["dripplus", "dripmaxx"]),
      userId: z.string().min(1),
      userEmail: z.string().email().optional(),
      successUrl: z.string().min(1),
      cancelUrl: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    const { tier, userId, userEmail, successUrl, cancelUrl } = input;

    try {
      const priceId = await getPriceId(tier);
      const productDef = getProductDef(tier);

      console.log(`[Stripe] Creating checkout for ${tier} (price: ${priceId}), user: ${userId}`);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            tier,
            userId,
          },
        },
        customer_email: userEmail,
        client_reference_id: userId,
        metadata: {
          tier,
          userId,
        },
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: "auto",
      });

      console.log(`[Stripe] Checkout session created: ${session.id}, URL: ${session.url}`);

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
      };
    } catch (error) {
      console.error("[Stripe] Checkout session error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create checkout session. Please try again.",
      });
    }
  });
