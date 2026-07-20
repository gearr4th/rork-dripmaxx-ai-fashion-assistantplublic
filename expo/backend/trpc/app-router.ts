import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import signupRoute from "./routes/auth/signup/route";
import loginRoute from "./routes/auth/login/route";
import getUserRoute from "./routes/auth/getUser/route";
import sendFeedbackRoute from "./routes/feedback/send/route";

// TestFlight / Beta build: Stripe checkout routes are intentionally removed.
// The app ships with all features unlocked and no payments. Stripe routes can
// be re-enabled for the production launch.
export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    signup: signupRoute,
    login: loginRoute,
    getUser: getUserRoute,
  }),
  feedback: createTRPCRouter({
    send: sendFeedbackRoute,
  }),
});

export type AppRouter = typeof appRouter;
