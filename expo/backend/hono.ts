import { createRequire } from "node:module";

// Use CJS require to bypass the hono package.json "exports" field
const honoRequire = createRequire(import.meta.url);
const { Hono } = honoRequire("hono");
const { cors } = honoRequire("hono/cors");

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// Hono app — mounted at /api by the Rork platform
const app = new Hono();

// CORS for all routes
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"] }));

// Health check
app.get("/", (c: any) => c.json({ status: "ok" }));
app.get("/test", (c: any) => c.json({ hello: "world" }));

// Debug: test if Hono can parse JSON bodies
app.post("/echo", async (c: any) => {
  try {
    const body = await c.req.json();
    return c.json({ ok: true, body });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 400);
  }
});

// tRPC handler — Hono buffers the raw body internally, so c.req.raw's
// body stream is already consumed by the time tRPC tries to call .json().
// We read the body via Hono's cached c.req.text() and build a fresh Request
// with the body as a string. This lets tRPC's fetchRequestHandler call
// .json() on a fresh body stream.
app.all("/trpc/*", async (c: any) => {
  const url = c.req.url;
  const method = c.req.method;
  const headers = new Headers();
  
  // Copy relevant headers from the original request
  const originalHeaders = c.req.raw.headers;
  originalHeaders.forEach((value: string, key: string) => {
    headers.set(key, value);
  });

  // Read body via Hono's cached parser (works even after the raw stream is consumed)
  let body: string | null = null;
  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await c.req.text();
    } catch {
      body = null;
    }
  }

  // Construct a fresh Request with the body as a replayable string
  const req = new Request(url, {
    method,
    headers,
    body: body,
  });

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

  return c.body(response.body, response);
});

export default app;
