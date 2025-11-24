import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";
import { supabase } from "@/lib/supabase";

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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        console.error("[Backend Auth] Login failed:", error);
        
        if (error.message.toLowerCase().includes("invalid login credentials") ||
            error.message.toLowerCase().includes("invalid credentials")) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password. Please check your credentials and try again.",
          });
        }
        
        if (error.message.toLowerCase().includes("email not confirmed")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "⚠️ Please verify your email address before signing in. Check your inbox for the verification link.",
          });
        }
        
        if (error.message.toLowerCase().includes("too many requests")) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many login attempts. Please try again in a few minutes.",
          });
        }
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to sign in. Please try again.",
        });
      }

      if (!data.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Login failed. Please try again.",
        });
      }

      console.log("[Backend Auth] Login successful for:", input.email);

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || input.email,
          name: data.user.user_metadata?.name,
          age: data.user.user_metadata?.age,
          emailVerified: Boolean(data.user.email_confirmed_at),
        },
        accessToken: data.session?.access_token || null,
        refreshToken: data.session?.refresh_token || null,
        isDemo: false,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("[Backend Auth] Login error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to sign in. Please check your connection and try again.",
      });
    }
  });
