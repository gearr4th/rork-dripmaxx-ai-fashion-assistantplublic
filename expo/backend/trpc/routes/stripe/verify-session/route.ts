import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";
import { stripe } from "@/backend/stripe-client";

const SUBSCRIPTION_TIER_MAP: Record<string, "dripplus" | "dripmaxx"> = {
  dripplus: "dripplus",
  dripmaxx: "dripmaxx",
};

export default publicProcedure
  .input(
    z.object({
      sessionId: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    const { sessionId } = input;

    try {
      console.log(`[Stripe] Verifying session: ${sessionId}`);

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found.",
        });
      }

      console.log(`[Stripe] Session status: ${session.payment_status}, subscription: ${session.subscription}`);

      if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
        return {
          success: false,
          status: session.payment_status as string,
          tier: null,
          subscriptionId: null,
        };
      }

      // Get tier from metadata
      const tier = session.metadata?.tier;
      const normalizedTier = tier && SUBSCRIPTION_TIER_MAP[tier]
        ? SUBSCRIPTION_TIER_MAP[tier]
        : null;

      return {
        success: true,
        status: session.payment_status as string,
        tier: normalizedTier,
        subscriptionId: typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null,
        customerId: typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[Stripe] Verify session error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to verify payment. Please try again.",
      });
    }
  });
