import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/utils/config";

export default publicProcedure
  .input(
    z.object({
      accessToken: z.string(),
    })
  )
  .query(async ({ input }) => {
    console.log("[Backend Auth] Get user request");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Authentication service is not configured.",
      });
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          apikey: SUPABASE_ANON_KEY,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("[Backend Auth] Get user failed:", text);
        
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Failed to fetch user information",
        });
      }

      const data = await response.json();
      console.log("[Backend Auth] Get user successful");

      return {
        success: true,
        user: {
          id: data.id || "",
          email: data.email || "",
          name: data.user_metadata?.name,
          age: data.user_metadata?.age,
          emailVerified: Boolean(data.email_confirmed_at),
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("[Backend Auth] Get user error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user information",
      });
    }
  });
