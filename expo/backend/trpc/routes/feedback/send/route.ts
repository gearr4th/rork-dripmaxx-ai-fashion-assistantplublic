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

    const FEEDBACK_RECIPIENT = "nmam.amnm@gmail.com"; // must match FEEDBACK_TO_EMAIL in utils/config.ts
    const overall = (
      (input.easeOfUse + input.accuracyOfDripRating + input.usefulnessOfRecommendations) /
      3
    ).toFixed(2);

    const sendEmail = async (): Promise<boolean> => {
      try {
        const subject = `Drip App Feedback — ${user.email || "anonymous"} (${overall}/5)`;
        const message = [
          `From user: ${user.email || "unknown"} (id: ${user.id || "unknown"})`,
          ``,
          `Overall: ${overall}/5`,
          `• Ease of use: ${input.easeOfUse}/5`,
          `• Accuracy of drip rating: ${input.accuracyOfDripRating}/5`,
          `• Usefulness of recommendations: ${input.usefulnessOfRecommendations}/5`,
          ``,
          `Comments:`,
          input.additionalComments?.trim() || "(none)",
          ``,
          `App version: ${input.appVersion}`,
          `Device: ${input.deviceInfo}`,
          `Sent: ${new Date().toISOString()}`,
        ].join("\n");

        const emailRes = await fetch(
          `https://formsubmit.co/ajax/${encodeURIComponent(FEEDBACK_RECIPIENT)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              _subject: subject,
              _template: "box",
              _captcha: "false",
              name: user.email || "Drip user",
              email: user.email || "noreply@dripapp.local",
              message,
            }),
          }
        );

        if (!emailRes.ok) {
          const errText = await emailRes.text();
          console.error("[Feedback] Email send failed:", emailRes.status, errText);
          return false;
        }
        const emailJson = await emailRes.json().catch(() => ({}));
        console.log(`[Feedback] ✉️  Email dispatched to ${FEEDBACK_RECIPIENT}`, emailJson);
        return true;
      } catch (err) {
        console.error("[Feedback] Email send error:", err);
        return false;
      }
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

      const [supabaseResponse, emailSent] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${input.accessToken}`,
            "Prefer": "return=representation",
          },
          body: JSON.stringify(feedbackData),
        }),
        sendEmail(),
      ]);

      if (!supabaseResponse.ok) {
        const errorText = await supabaseResponse.text();
        console.error("[Feedback] Supabase error:", errorText);
        if (!emailSent) {
          throw new Error(`Failed to save feedback: ${errorText}`);
        }
        return {
          success: true,
          message: "Feedback emailed (db save failed)",
          emailSent,
          data: null,
        };
      }

      const result = await supabaseResponse.json();
      console.log(
        `[Feedback] ✅ Saved for ${user.email} (email sent: ${emailSent})`
      );

      return {
        success: true,
        message: emailSent ? "Feedback saved and emailed" : "Feedback saved",
        emailSent,
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
