import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://rork.app';
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (input, init) => {
        console.log('[tRPC] Fetching:', input);
        try {
          const response = await fetch(input, init);
          console.log('[tRPC] Response status:', response.status);
          
          if (!response.ok) {
            console.error('[tRPC] Non-OK response:', response.status, response.statusText);
            
            const text = await response.text();
            console.error('[tRPC] Response text:', text.substring(0, 200));
            
            if (text.includes('<!DOCTYPE') || text.includes('<html')) {
              throw new Error('Backend returned HTML instead of JSON. Backend might be down or misconfigured.');
            }
            
            throw new Error(`Backend error: ${response.status} ${response.statusText}`);
          }
          
          return response;
        } catch (error) {
          console.error('[tRPC] Fetch error:', error);
          throw error;
        }
      },
    }),
  ],
});
