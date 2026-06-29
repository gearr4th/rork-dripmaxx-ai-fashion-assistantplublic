import { Hono } from "hono/tiny";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// Hono app — mounted at /api by the Rork platform
const app = new Hono();

// CORS for all routes
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"] }));

// Health check
app.get("/", (c) => c.json({ status: "ok" }));
app.get("/test", (c) => c.json({ hello: "world" }));

// tRPC — mounted at /trpc, endpoint must include /api prefix
// because c.req.raw.url carries the full platform URL
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

export default app;
