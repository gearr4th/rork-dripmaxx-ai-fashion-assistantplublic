import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, WEB3FORMS_ACCESS_KEY } from "@/utils/config";

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

    console.log("[Feedback] Checking WEB3FORMS_ACCESS_KEY...");
    console.log("[Feedback] Key value:", WEB3FORMS_ACCESS_KEY);
    console.log("[Feedback] Key length:", WEB3FORMS_ACCESS_KEY?.length);
    console.log("[Feedback] Key type:", typeof WEB3FORMS_ACCESS_KEY);

    const accessKey = String(WEB3FORMS_ACCESS_KEY);
    
    if (!accessKey || accessKey === '' || accessKey === 'undefined') {
      console.error("[Feedback] ❌ WEB3FORMS_ACCESS_KEY is not properly configured:", { 
        value: WEB3FORMS_ACCESS_KEY,
        type: typeof WEB3FORMS_ACCESS_KEY 
      });
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Email service not configured. Please contact support.",
      });
    }

    console.log("[Feedback] ✅ WEB3FORMS_ACCESS_KEY is configured:", `${WEB3FORMS_ACCESS_KEY.substring(0, 8)}...`);

    try {
      const payload = {
        access_key: String(WEB3FORMS_ACCESS_KEY),
        subject: emailSubject,
        name: user.email || 'Anonymous User',
        email: user.email || 'noreply@dripapp.com',
        message: emailBody,
        from_name: "Drip App Feedback",
        replyto: user.email || undefined,
      };

      console.log("[Feedback] Sending feedback with payload:", {
        access_key_length: WEB3FORMS_ACCESS_KEY?.length,
        from: user.email,
        subject: emailSubject,
      });

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log("[Feedback] Raw response:", responseText);
      console.log("[Feedback] Response status:", response.status);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error("[Feedback] Failed to parse response as JSON");
        throw new Error(`Invalid response from email service: ${responseText}`);
      }

      console.log("[Feedback] Web3Forms parsed response:", JSON.stringify(result, null, 2));

      if (result?.success === true) {
        console.log(`[Feedback] ✅ Email sent successfully from user ${user.email}`);
        return {
          success: true,
          message: "Feedback sent successfully",
        };
      } else {
        console.error(`[Feedback] ❌ Web3Forms error:`, result);
        
        let errorMessage = "Failed to send feedback. ";
        
        if (result?.message) {
          errorMessage += result.message;
          console.error("[Feedback] Error message from Web3Forms:", result.message);
        }
        
        if (response.status === 403) {
          errorMessage = "Web3Forms access key is invalid or not activated. Please verify at https://web3forms.com";
        }
        
        if (response.status === 422) {
          errorMessage = "Web3Forms validation error: " + (result?.message || "Invalid request format");
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error("[Feedback] Error sending email:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to send feedback. Please try again later.",
      });
    }
  });

export default sendFeedbackProcedure;
