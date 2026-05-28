import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && envUrl.length > 0) return envUrl;
  if (typeof window !== 'undefined' && window.location?.origin) {
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
          console.log('[tRPC] Response headers:', Object.fromEntries(response.headers.entries()));
          
          const contentType = response.headers.get('content-type') || '';
          
          if (!response.ok) {
            console.error('[tRPC] Non-OK response:', response.status, response.statusText);
            
            try {
              const text = await response.text();
              console.error('[tRPC] Response text (first 500 chars):', text.substring(0, 500));
              
              if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('<HTML')) {
                throw new Error('Backend returned HTML instead of JSON. The API endpoint might be unreachable.');
              }
              
              if (!contentType.includes('application/json')) {
                throw new Error(`Backend returned ${contentType} instead of JSON. The backend might be misconfigured.`);
              }
              
              throw new Error(`Backend error: ${response.status} - ${text.substring(0, 100)}`);
            } catch (textError) {
              console.error('[tRPC] Failed to read error response:', textError);
              throw new Error(`Backend error: ${response.status} ${response.statusText}`);
            }
          }
          
          if (!contentType.includes('application/json')) {
            console.warn('[tRPC] Warning: Response is not JSON:', contentType);
            const text = await response.text();
            console.error('[tRPC] Non-JSON response:', text.substring(0, 500));
            
            if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('<HTML')) {
              throw new Error('Backend returned HTML. The API might be unreachable or misconfigured.');
            }
            
            throw new Error(`Backend returned ${contentType} instead of JSON`);
          }
          
          return response;
        } catch (error) {
          console.error('[tRPC] Fetch error:', error);
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('Network error: Unable to connect to backend. Please check your internet connection.');
          }
          throw error;
        }
      },
    }),
  ],
});
