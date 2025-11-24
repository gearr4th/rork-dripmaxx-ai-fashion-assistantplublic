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
        message: "Authentication service is not configured.",
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
    const timestamp = new Date();

    const averageRating = (
      (input.easeOfUse +
        input.accuracyOfDripRating +
        input.usefulnessOfRecommendations) /
      3
    ).toFixed(1);

    const emailSubject = `Drip App Feedback - ${timestamp.toLocaleDateString()}`;
    const emailBody = `NEW FEEDBACK RECEIVED

OVERALL RATING: ${averageRating}/5 stars

DETAILED RATINGS:
• Ease of Use: ${input.easeOfUse}/5
• Drip Rating Accuracy: ${input.accuracyOfDripRating}/5
• Recommendation Usefulness: ${input.usefulnessOfRecommendations}/5

USER COMMENTS:
${input.additionalComments || "No additional comments provided"}

USER INFO:
• User Email: ${user.email}
• User ID: ${user.id}

TECHNICAL INFO:
• Timestamp: ${timestamp.toLocaleString()}
• App Version: ${input.appVersion}
• Platform: ${input.deviceInfo}

---
This feedback was automatically sent from your Drip App.`;

    const WEB3FORMS_ACCESS_KEY = process.env.WEB3FORMS_ACCESS_KEY || "ae516279-0274-429a-b537-042ed774a7ca";
    const FEEDBACK_TO_EMAIL = "gearr4th@gmail.com";

    console.log("[Feedback] WEB3FORMS_ACCESS_KEY available:", !!WEB3FORMS_ACCESS_KEY);

    if (!WEB3FORMS_ACCESS_KEY) {
      console.error("WEB3FORMS_ACCESS_KEY is not set in environment variables");
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Email service not configured. Please contact support.",
      });
    }

    try {
      const formData = new FormData();
      formData.append("access_key", WEB3FORMS_ACCESS_KEY);
      formData.append("subject", emailSubject);
      formData.append("to", FEEDBACK_TO_EMAIL);
      formData.append("email", user.email);
      formData.append("message", emailBody);
      formData.append("from_name", user.email);
      formData.append("redirect", "false");

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result?.success) {
        console.log(`[Feedback] Email sent successfully to ${FEEDBACK_TO_EMAIL} from user ${user.email}`);
        return {
          success: true,
          message: "Feedback sent successfully",
        };
      } else {
        console.error(`[Feedback] Web3Forms error:`, result);
        throw new Error(result?.message || "Failed to send feedback");
      }
    } catch (error) {
      console.error("[Feedback] Error sending email:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send feedback. Please try again later.",
      });
    }
  });

export default sendFeedbackProcedure;
