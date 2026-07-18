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

/**
 * Fetch with one retry on transient network failures.
 * The Rork backend occasionally returns 503 capacity hiccups or the
 * browser fetch throws "Failed to fetch" on a momentary network blip.
 * A single retry with a short backoff recovers the vast majority of these
 * without the user ever noticing.
 */
const fetchWithRetry = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined
): Promise<Response> => {
  const MAX_ATTEMPTS = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(input as RequestInfo, init);
      // Retry on 503 (backend capacity) — these are transient on the platform.
      if (response.status === 503 && attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      return response;
    } catch (error: unknown) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      // "Failed to fetch" is the browser's generic transient failure — retry once.
      if (attempt < MAX_ATTEMPTS) {
        console.warn(`[tRPC] Fetch attempt ${attempt} failed ("${msg}"), retrying…`);
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      // Final failure — warn (not error) so the preview's runtime-error
      // overlay doesn't treat a handled, caller-caught transient failure
      // as a fatal unhandled error. The calling code's try/catch still
      // receives the rejection and shows a user-friendly Alert.
      console.warn(`[tRPC] Network failure after ${attempt} attempts:`, msg);
    }
  }

  throw lastError ?? new Error("[tRPC] Network failure: exhausted retries");
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: fetchWithRetry as typeof fetch,
    }),
  ],
});
