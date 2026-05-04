# Stripe Payment Integration Setup

This app includes a complete subscription system with Stripe integration. Follow these steps to set up real payments.

## Current Status

✅ **Already Implemented:**
- 3 subscription tiers: Free, Premium ($9.99/month), Pro ($19.99/month)
- Subscription provider with feature gating
- Generation limits for free tier (5 per month)
- Beautiful subscription UI with plan comparison
- Profile integration showing current plan and remaining generations
- Mock payment flow for testing

## Setting Up Stripe (Production)

### 1. Create Stripe Account
1. Go to https://stripe.com and sign up
2. Complete business verification
3. Get your API keys from the Dashboard

### 2. Create Products in Stripe Dashboard
1. Go to Products → Add Product
2. Create two products:
   - **Premium**: $9.99/month recurring
   - **Pro**: $19.99/month recurring
3. Copy the Price IDs for each product

### 3. Configure Environment Variables
Add these to your `.env` file or environment:

\`\`\`bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_...
EXPO_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
\`\`\`

For the backend (if using tRPC/API routes):
\`\`\`bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
\`\`\`

### 4. Install Stripe Dependencies
\`\`\`bash
bun add @stripe/stripe-react-native stripe
\`\`\`

### 5. Backend Implementation

Create a tRPC route for creating checkout sessions:

\`\`\`typescript
// backend/trpc/routes/subscription/create-checkout.ts
import { z } from 'zod';
import { protectedProcedure } from '../../procedures';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const createCheckoutProcedure = protectedProcedure
  .input(
    z.object({
      priceId: z.string(),
      successUrl: z.string(),
      cancelUrl: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const session = await stripe.checkout.sessions.create({
      customer_email: ctx.user.email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: input.priceId,
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        userId: ctx.user.id,
      },
    });

    return { sessionId: session.id, url: session.url };
  });
\`\`\`

### 6. Update Frontend to Use Real Stripe

Update \`app/subscription.tsx\`:

\`\`\`typescript
import { StripeProvider } from '@stripe/stripe-react-native';
import { EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY } from '@/utils/config';

// In handleUpgrade function:
const handleUpgrade = async (targetTier: SubscriptionTier) => {
  const priceId = targetTier === 'premium' 
    ? SUBSCRIPTION_PLANS.premium.stripePriceId 
    : SUBSCRIPTION_PLANS.pro.stripePriceId;

  const { url } = await trpcClient.subscription.createCheckout.mutate({
    priceId,
    successUrl: 'yourapp://subscription/success',
    cancelUrl: 'yourapp://subscription/cancel',
  });

  if (Platform.OS === 'web') {
    window.location.href = url;
  } else {
    // Use in-app browser
    await WebBrowser.openBrowserAsync(url);
  }
};
\`\`\`

### 7. Set Up Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: \`https://yourdomain.com/api/webhooks/stripe\`
3. Listen for these events:
   - \`checkout.session.completed\`
   - \`customer.subscription.updated\`
   - \`customer.subscription.deleted\`
   - \`invoice.payment_succeeded\`
   - \`invoice.payment_failed\`

Create webhook handler:

\`\`\`typescript
// backend/hono.ts
app.post('/webhooks/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  const body = await c.req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return c.json({ error: 'Webhook signature verification failed' }, 400);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // Update user subscription in database
      const session = event.data.object;
      // Update SubscriptionProvider with real data
      break;
    case 'customer.subscription.updated':
      // Handle subscription changes
      break;
    case 'customer.subscription.deleted':
      // Handle cancellations
      break;
  }

  return c.json({ received: true });
});
\`\`\`

## Testing

### Test Mode
Use Stripe test keys for development:
- \`pk_test_...\` for publishable key
- \`sk_test_...\` for secret key

### Test Cards
- Success: \`4242 4242 4242 4242\`
- Decline: \`4000 0000 0000 0002\`
- 3D Secure: \`4000 0027 6000 3184\`

Use any future expiry date and any 3-digit CVC.

## Security Checklist

- [ ] Never commit API keys to git
- [ ] Use environment variables for all keys
- [ ] Verify webhook signatures
- [ ] Use HTTPS in production
- [ ] Store subscription data in secure database
- [ ] Implement proper error handling
- [ ] Add rate limiting to payment endpoints
- [ ] Test subscription cancellation flow
- [ ] Test failed payment handling
- [ ] Set up monitoring for failed payments

## Features Included

✅ Feature gating based on subscription tier
✅ Generation limits for free users
✅ Upgrade prompts when limits reached
✅ Beautiful pricing page
✅ Profile showing current subscription
✅ Cancel/restore subscription support
✅ Local testing without Stripe

## Next Steps

1. Set up Stripe account
2. Configure environment variables
3. Test with Stripe test mode
4. Implement webhook handlers
5. Add to Supabase for persistence
6. Go live with production keys!

## Support

For issues with Stripe integration:
- Stripe Docs: https://stripe.com/docs
- Expo Stripe: https://docs.expo.dev/guides/using-stripe/
