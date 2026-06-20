import { Hono } from "hono";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

// Handle tRPC requests manually so we control the URL that fetchRequestHandler sees.
// The Rork platform serves this Hono app at /api, so incoming requests have URLs like
// /api/trpc/stripe.createCheckoutSession. We need fetchRequestHandler to see a URL
// with path /trpc/stripe.createCheckoutSession so it can strip the /trpc endpoint
// and resolve the procedure path correctly.
app.all("/trpc/*", async (c) => {
  const originalUrl = new URL(c.req.raw.url);

  // Rewrite the URL path: strip the /api prefix that Rork adds before Hono routing
  const honoRelativePath = originalUrl.pathname.replace(/^\/api/, "") || "/";
  originalUrl.pathname = honoRelativePath;

  // Reconstruct the body for the modified request
  let body: BodyInit | null = null;
  if (c.req.raw.method !== "GET" && c.req.raw.method !== "HEAD") {
    body = c.req.raw.body;
  }

  const modifiedReq = new Request(originalUrl.toString(), {
    method: c.req.raw.method,
    headers: c.req.raw.headers,
    body,
  });

  return fetchRequestHandler({
    endpoint: "/trpc",
    req: modifiedReq,
    router: appRouter,
    createContext,
  });
});

app.get("/", (c) => {
  return c.json({ status: "ok", message: "DripMaxx API is running" });
});

export default app;
