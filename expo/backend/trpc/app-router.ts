import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import signupRoute from "./routes/auth/signup/route";
import loginRoute from "./routes/auth/login/route";
import getUserRoute from "./routes/auth/getUser/route";
import sendFeedbackRoute from "./routes/feedback/send/route";
import createCheckoutSessionRoute from "./routes/stripe/create-checkout-session/route";
import verifySessionRoute from "./routes/stripe/verify-session/route";

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
  stripe: createTRPCRouter({
    createCheckoutSession: createCheckoutSessionRoute,
    verifySession: verifySessionRoute,
  }),
});

export type AppRouter = typeof appRouter;
