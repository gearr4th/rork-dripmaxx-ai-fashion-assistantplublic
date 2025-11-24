import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/utils/config";

export default publicProcedure
  .input(
    z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      name: z.string().min(1, "Name is required"),
      age: z.number().min(1).max(120),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Backend Auth] Signup request for:", input.email);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Authentication service is not configured. Please contact support.",
      });
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          data: {
            name: input.name,
            age: input.age,
          },
        }),
      });

      const responseText = await response.text();
      console.log("[Backend Auth] Signup response status:", response.status);

      if (!response.ok) {
        console.error("[Backend Auth] Signup failed:", responseText);
        
        let errorMessage = "Failed to create account";
        
        try {
          const errorData = JSON.parse(responseText);
          
          if (errorData.message?.includes("already registered") || 
              errorData.msg?.includes("already registered") ||
              errorData.error_description?.includes("already registered")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "An account with this email already exists. Please sign in instead.",
            });
          }
          
          if (errorData.message?.includes("email rate limit")) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Too many signup attempts. Please try again later.",
            });
          }
          
          if (errorData.message?.includes("password")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Password must be at least 6 characters long.",
            });
          }
          
          if (errorData.message?.includes("invalid email")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Please enter a valid email address.",
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
          
          if (responseText.includes("already registered")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "An account with this email already exists. Please sign in instead.",
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
            message: "Too many attempts. Please try again later.",
          });
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: errorMessage,
        });
      }

      const data = JSON.parse(responseText);
      console.log("[Backend Auth] Signup successful for:", input.email);

      return {
        success: true,
        user: {
          id: data.user?.id || "",
          email: data.user?.email || input.email,
          name: input.name,
          age: input.age,
          emailVerified: Boolean(data.user?.email_confirmed_at),
        },
        accessToken: data.access_token || null,
        refreshToken: data.refresh_token || null,
        message: data.user?.email_confirmed_at 
          ? "Account created successfully!" 
          : "Please check your email to verify your account.",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("[Backend Auth] Signup error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to connect to authentication server. Please check your internet connection and try again.",
      });
    }
  });
