import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const stripe = new Stripe(Deno.env.get('STRIPE_US_SECRET_KEY') || '', {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type CartItem = {
  id?: string;
  product?: string;
  productCode?: string;
  stripePriceId?: string;
  quantity?: number;
  cartUnits?: number;
  packageKey?: string;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const cleanUrl = (value: string) => {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return `${url.origin}${url.pathname.replace(/\/[^/]*$/, '')}`;
  } catch {
    return '';
  }
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const payload = await request.json();
    const market = 'us';
    const locale = String(payload.locale || 'en-US');
    const checkoutRef = String(payload.checkout_ref || '');
    const cart = Array.isArray(payload.cart) ? payload.cart as CartItem[] : [];
    const pageBase = cleanUrl(String(payload.page_url || '')) || 'https://taploe.com';

    if (!checkoutRef || !cart.length) {
      return json({ error: 'Checkout is temporarily unavailable.' }, 400);
    }

    const requestedPrices = [...new Set(cart.map((item) => item.stripePriceId).filter(Boolean))] as string[];
    if (!requestedPrices.length) {
      return json({ error: 'Checkout is temporarily unavailable.' }, 400);
    }

    const { data: validPrices, error: priceError } = await supabase
      .from('ecommerce_product_prices')
      .select('stripe_price_id,market,is_active')
      .eq('market', market)
      .eq('is_active', true)
      .in('stripe_price_id', requestedPrices);

    if (priceError) throw priceError;

    const validPriceIds = new Set((validPrices || []).map((price) => price.stripe_price_id));
    const invalidPrice = requestedPrices.find((priceId) => !validPriceIds.has(priceId));
    if (invalidPrice) {
      return json({ error: 'This product is temporarily unavailable.' }, 400);
    }

    const lineItems = cart.map((item) => ({
      price: item.stripePriceId,
      quantity: Math.max(1, Math.min(99, Number(item.packageKey ? item.cartUnits || 1 : item.quantity || 1))),
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      client_reference_id: checkoutRef,
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['US'] },
      success_url: `${pageBase}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}&ref=${encodeURIComponent(checkoutRef)}`,
      cancel_url: `${pageBase}/checkout-canceled.html`,
      metadata: {
        source: 'taploe_web_cart',
        checkout_ref: checkoutRef,
        market,
        locale,
        item_count: String(cart.length),
        product_codes: cart.map((item) => item.productCode).filter(Boolean).join(',').slice(0, 500),
      },
    });

    return json({ id: session.id, url: session.url });
  } catch {
    return json({ error: 'We could not start checkout right now.' }, 500);
  }
});
