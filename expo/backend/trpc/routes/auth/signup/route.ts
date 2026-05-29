import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";
import { supabaseServer as supabase } from "@/backend/supabase-server";

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

    try {
      const signUpOptions = {
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            age: input.age,
          },
        },
      };

      console.log("[Backend Auth] Attempting signup with options:", {
        email: input.email,
        hasPassword: Boolean(input.password),
        metadata: signUpOptions.options.data,
      });

      const response = await supabase.auth.signUp(signUpOptions);

      console.log("[Backend Auth] Supabase response:", {
        hasData: Boolean(response.data),
        hasUser: Boolean(response.data?.user),
        hasSession: Boolean(response.data?.session),
        hasError: Boolean(response.error),
        errorMessage: response.error?.message,
        errorStatus: response.error?.status,
      });

      if (response.error) {
        console.error("[Backend Auth] Signup error from Supabase:", response.error);
        const errorMsg = response.error.message.toLowerCase();
        
        if (errorMsg.includes("already registered") || 
            errorMsg.includes("already exists") ||
            errorMsg.includes("user already registered")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists. Please sign in instead.",
          });
        }
        
        if (errorMsg.includes("email rate limit") ||
            errorMsg.includes("rate limit")) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many signup attempts. Please try again in a few minutes.",
          });
        }
        
        if (errorMsg.includes("password")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Password must be at least 6 characters long.",
          });
        }
        
        if (errorMsg.includes("invalid email")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please enter a valid email address.",
          });
        }
        
        if (errorMsg.includes("sending confirmation") ||
            errorMsg.includes("error sending") ||
            errorMsg.includes("smtp") ||
            errorMsg.includes("email service") ||
            errorMsg.includes("mail service")) {
          
          console.log("[Backend Auth] Email error detected. Checking if user was created...");
          console.log("[Backend Auth] Response data:", JSON.stringify(response.data, null, 2));
          
          if (response.data?.user) {
            console.log("[Backend Auth] User was created despite email error!");
            const userData: any = response.data;
            const user = userData.user;
            const session = userData.session;
            
            return {
              success: true,
              user: {
                id: user.id,
                email: user.email || input.email,
                name: input.name,
                age: input.age,
                emailVerified: Boolean(user.email_confirmed_at),
              },
              accessToken: session?.access_token || null,
              refreshToken: session?.refresh_token || null,
              message: "✅ Account created successfully! Email verification is temporarily unavailable, but you can log in now.",
            };
          }
          
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to send confirmation email. Please contact support or try again later.",
          });
        }
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: response.error.message || "Failed to create account. Please try again.",
        });
      }

      if (!response.data || !response.data.user) {
        console.error("[Backend Auth] No user data returned from Supabase");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Account creation failed. Please try again.",
        });
      }

      const user = response.data.user;
      const session = response.data.session;

      console.log("[Backend Auth] Signup successful for:", input.email);
      console.log("[Backend Auth] User ID:", user.id);
      console.log("[Backend Auth] Email confirmed:", Boolean(user.email_confirmed_at));
      console.log("[Backend Auth] Has session:", Boolean(session));

      const hasSession = Boolean(session);
      const isEmailConfirmed = Boolean(user.email_confirmed_at);

      let message = "Account created successfully!";
      if (!isEmailConfirmed && hasSession) {
        message = "✅ Account created! You can start using the app now.";
      } else if (!isEmailConfirmed && !hasSession) {
        message = "✅ Account created! Please check your email to verify your account before signing in.";
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email || input.email,
          name: input.name,
          age: input.age,
          emailVerified: isEmailConfirmed,
        },
        accessToken: session?.access_token || null,
        refreshToken: session?.refresh_token || null,
        message,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("[Backend Auth] Unexpected signup error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create account. Please check your connection and try again.",
      });
    }
  });
