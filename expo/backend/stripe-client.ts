import Stripe from "stripe";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_KEY) {
  console.error("[Stripe] ❌ STRIPE_SECRET_KEY not set. Stripe features will throw.");
} else {
  console.log(`[Stripe] ✅ Key loaded (${STRIPE_KEY.substring(0, 7)}...${STRIPE_KEY.slice(-4)})`);
}

export const stripe = new Stripe(STRIPE_KEY ?? "sk_test_missing", {
  apiVersion: "2026-05-27.dahlia",
});

/** Price IDs cached after first lookup/creation */
const priceIdCache: Record<string, string> = {};

interface ProductDef {
  id: string;
  name: string;
  description: string;
  price: number; // in dollars
}

const PRODUCTS: Record<string, ProductDef> = {
  dripplus: {
    id: "dripplus",
    name: "Drip+",
    description: "20 closet items, 2 outfits/day, weather suggestions, cost-per-wear tracking",
    price: 4.99,
  },
  dripmaxx: {
    id: "dripmaxx",
    name: "DripMaxx",
    description: "Unlimited items, 10 outfits/day, event planning, trend analysis, priority generation",
    price: 9.99,
  },
};

/** Ensure a product + monthly price exist; return the price ID */
async function ensurePriceId(tier: string): Promise<string> {
  if (priceIdCache[tier]) return priceIdCache[tier];
  if (!STRIPE_KEY || STRIPE_KEY === "sk_test_missing") {
    throw new Error("STRIPE_SECRET_KEY is not configured. Stripe payments are unavailable.");
  }

  const def = PRODUCTS[tier];
  if (!def) throw new Error(`Unknown tier: ${tier}`);

  // 1. Look for existing product in Stripe by lookup_key
  const existingProducts = await stripe.products.search({
    query: `lookup_key:"${def.id}" AND active:"true"`,
    limit: 1,
  });

  let product: Stripe.Product;

  if (existingProducts.data.length > 0) {
    product = existingProducts.data[0];
    console.log(`[Stripe] Found existing product: ${product.name} (${product.id})`);
  } else {
    // Create product
    product = await stripe.products.create({
      name: def.name,
      description: def.description,
      active: true,
      metadata: { tier: def.id, lookup_key: def.id },
    });
    console.log(`[Stripe] Created product: ${product.name} (${product.id})`);
  }

  // 2. Look for existing monthly price on this product
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    recurring: { interval: "month" },
    limit: 1,
  });

  if (prices.data.length > 0) {
    const priceId = prices.data[0].id;
    priceIdCache[tier] = priceId;
    console.log(`[Stripe] Found existing price: ${priceId} for ${def.name}`);
    return priceId;
  }

  // 3. Create monthly price
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: Math.round(def.price * 100), // cents
    recurring: { interval: "month" },
    lookup_key: `${def.id}-monthly`,
    metadata: { tier: def.id },
  });

  priceIdCache[tier] = price.id;
  console.log(`[Stripe] Created price: ${price.id} for ${def.name} ($${def.price}/mo)`);
  return price.id;
}

/** Get or create a Stripe price ID for a given tier */
export async function getPriceId(tier: string): Promise<string> {
  return ensurePriceId(tier);
}

/** Get product definitions */
export function getProductDef(tier: string): ProductDef | undefined {
  return PRODUCTS[tier];
}
