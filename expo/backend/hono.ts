import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => c.json({ status: "ok" }));

app.get("/test", (c) => c.json({ hello: "world" }));

export default app;
