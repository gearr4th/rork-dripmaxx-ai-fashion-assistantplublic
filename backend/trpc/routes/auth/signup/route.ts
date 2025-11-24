import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";
import { supabase } from "@/lib/supabase";

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
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            age: input.age,
          },
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        console.error("[Backend Auth] Signup failed:", error);
        
        if (error.message.toLowerCase().includes("already registered") || 
            error.message.toLowerCase().includes("already exists")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists. Please sign in instead.",
          });
        }
        
        if (error.message.toLowerCase().includes("email rate limit")) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many signup attempts. Please try again in a few minutes.",
          });
        }
        
        if (error.message.toLowerCase().includes("password")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Password must be at least 6 characters long.",
          });
        }
        
        if (error.message.toLowerCase().includes("invalid email")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please enter a valid email address.",
          });
        }
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to create account. Please try again.",
        });
      }

      if (!data.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Account creation failed. Please try again.",
        });
      }

      console.log("[Backend Auth] Signup successful for:", input.email);
      console.log("[Backend Auth] Email confirmed:", Boolean(data.user.email_confirmed_at));

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || input.email,
          name: input.name,
          age: input.age,
          emailVerified: Boolean(data.user.email_confirmed_at),
        },
        accessToken: data.session?.access_token || null,
        refreshToken: data.session?.refresh_token || null,
        message: data.user.email_confirmed_at 
          ? "Account created successfully!" 
          : "✅ Account created! Please check your email to verify your account before signing in.",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("[Backend Auth] Signup error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create account. Please check your connection and try again.",
      });
    }
  });
