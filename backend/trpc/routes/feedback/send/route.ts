import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/utils/config";

const feedbackSchema = z.object({
  accessToken: z.string(),
  easeOfUse: z.number().min(1).max(5),
  accuracyOfDripRating: z.number().min(1).max(5),
  usefulnessOfRecommendations: z.number().min(1).max(5),
  additionalComments: z.string().optional(),
  appVersion: z.string(),
  deviceInfo: z.string(),
});

export const sendFeedbackProcedure = publicProcedure
  .input(feedbackSchema)
  .mutation(async ({ input }) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Database service is not configured.",
      });
    }

    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (!userResponse.ok) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Please log in to send feedback",
      });
    }

    const userData = await userResponse.json();
    const user = {
      id: userData.id || "",
      email: userData.email || "",
    };

    try {
      const feedbackData = {
        user_id: user.id,
        user_email: user.email,
        ease_of_use: input.easeOfUse,
        accuracy_of_drip_rating: input.accuracyOfDripRating,
        usefulness_of_recommendations: input.usefulnessOfRecommendations,
        additional_comments: input.additionalComments || null,
        app_version: input.appVersion,
        device_info: input.deviceInfo,
      };

      console.log("[Feedback] Saving to Supabase:", { user_id: user.id, email: user.email });

      const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${input.accessToken}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Feedback] Supabase error:", errorText);
        throw new Error(`Failed to save feedback: ${errorText}`);
      }

      const result = await response.json();
      console.log(`[Feedback] ✅ Feedback saved successfully for user ${user.email}`);

      return {
        success: true,
        message: "Feedback saved successfully",
        data: result,
      };
    } catch (error) {
      console.error("[Feedback] Error saving feedback:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to save feedback. Please try again later.",
      });
    }
  });

export default sendFeedbackProcedure;
