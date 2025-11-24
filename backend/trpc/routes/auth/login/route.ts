import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/utils/config";

export default publicProcedure
  .input(
    z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required"),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Backend Auth] Login request for:", input.email);

    if (input.email === "demo@dripmaxx.ai" && input.password === "password") {
      console.log("[Backend Auth] Demo login successful");
      return {
        success: true,
        user: {
          id: "demo-user-id",
          email: "demo@dripmaxx.ai",
          name: "Demo User",
          age: 25,
          emailVerified: true,
        },
        accessToken: null,
        refreshToken: null,
        isDemo: true,
      };
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Authentication service is not configured. Please use demo account: demo@dripmaxx.ai / password",
      });
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: input.email,
            password: input.password,
          }),
        }
      );

      const responseText = await response.text();
      console.log("[Backend Auth] Login response status:", response.status);

      if (!response.ok) {
        console.error("[Backend Auth] Login failed:", responseText);
        
        let errorMessage = "Failed to sign in";
        
        try {
          const errorData = JSON.parse(responseText);
          
          if (errorData.error_code === "invalid_credentials" ||
              errorData.msg?.toLowerCase().includes("invalid login credentials") ||
              errorData.message?.toLowerCase().includes("invalid login credentials")) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid email or password. Please try again.",
            });
          }
          
          if (errorData.msg?.toLowerCase().includes("email not confirmed") ||
              errorData.message?.toLowerCase().includes("email not confirmed")) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Please verify your email address before signing in. Check your inbox for the verification link.",
            });
          }
          
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.msg) {
            errorMessage = errorData.msg;
          } else if (errorData.error_description) {
            errorMessage = errorData.error_description;
          }
        } catch (parseError) {
          if (parseError instanceof TRPCError) {
            throw parseError;
          }
          
          if (responseText.includes("invalid login credentials")) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid email or password. Please try again.",
            });
          }
          
          if (responseText.includes("email not confirmed")) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Please verify your email address before signing in. Check your inbox for the verification link.",
            });
          }
        }

        if (response.status >= 500) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server error. Please try again in a moment.",
          });
        }
        
        if (response.status === 429) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many login attempts. Please try again later.",
          });
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: errorMessage,
        });
      }

      const data = JSON.parse(responseText);
      console.log("[Backend Auth] Login successful for:", input.email);

      if (!data.user?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Login failed: invalid user payload",
        });
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || input.email,
          name: data.user.user_metadata?.name,
          age: data.user.user_metadata?.age,
          emailVerified: Boolean(data.user.email_confirmed_at),
        },
        accessToken: data.access_token || null,
        refreshToken: data.refresh_token || null,
        isDemo: false,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("[Backend Auth] Login error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to connect to authentication server. Please check:\n\n1. Your internet connection\n2. Try the demo account: demo@dripmaxx.ai / password\n3. Contact support if issue persists",
      });
    }
  });
