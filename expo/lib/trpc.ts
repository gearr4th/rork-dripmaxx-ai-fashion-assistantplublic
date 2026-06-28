import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && envUrl.length > 0) return envUrl;
  throw new Error(
    "EXPO_PUBLIC_RORK_API_BASE_URL is not set. The backend may not be deployed yet."
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        console.log("[tRPC] Request →", url);
        try {
          const response = await fetch(input, init);
          console.log("[tRPC] Response ←", response.status, response.statusText);
          return response;
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error("[tRPC] Network failure:", msg);
          throw error;
        }
      },
    }),
  ],
});
