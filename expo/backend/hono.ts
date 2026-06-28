import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => c.json({ status: "ok" }));
app.get("/test", (c) => c.json({ hello: "world" }));

// tRPC — uses @hono/trpc-server middleware.
// The Hono app is mounted at /api by Rork, so the full client-facing
// path is /api/trpc. Endpoint must match so tRPC strips the prefix
// from the raw request URL to extract procedure names.
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

export default app;
