import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

const stripeSecretKey = Deno.env.get('STRIPE_US_SECRET_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const readSupabaseSecretKey = () => {
  try {
    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
    return secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  } catch {
    return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  }
};
const supabaseSecretKey = readSupabaseSecretKey();

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
});

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
type TaploeCheckoutSessionCreateParams = Stripe.Checkout.SessionCreateParams & {
  managed_payments?: {
    enabled: boolean;
  };
};

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, ...extraHeaders, 'Content-Type': 'application/json' },
});
const checkoutUnavailable = (status = 500, code = 'checkout_unavailable', extraHeaders: Record<string, string> = {}) => json({
  error: 'We could not start checkout right now.',
  code,
}, status, { 'x-taploe-checkout-code': code, ...extraHeaders });
const redactInternalIds = (value: string) => value
  .replace(/price_[A-Za-z0-9]+/g, 'price_[redacted]')
  .replace(/prod_[A-Za-z0-9]+/g, 'prod_[redacted]')
  .replace(/[ps]k_(live|test)_[A-Za-z0-9]+/g, '$1_key_[redacted]');
const safeHeaderValue = (value: unknown) => redactInternalIds(String(value || ''))
  .replace(/[^A-Za-z0-9_.-]/g, '_')
  .slice(0, 220);
const stripeErrorHeaders = (error: unknown) => {
  const stripeError = error as { type?: string; code?: string; statusCode?: number; param?: string; message?: string };
  const headers: Record<string, string> = {};
  if (stripeError.type) headers['x-taploe-stripe-type'] = safeHeaderValue(stripeError.type);
  if (stripeError.code) headers['x-taploe-stripe-code'] = safeHeaderValue(stripeError.code);
  if (stripeError.statusCode) headers['x-taploe-stripe-status'] = safeHeaderValue(stripeError.statusCode);
  if (stripeError.param) headers['x-taploe-stripe-param'] = safeHeaderValue(stripeError.param);
  if (stripeError.message) headers['x-taploe-stripe-message'] = safeHeaderValue(stripeError.message);
  return headers;
};
const logCheckoutError = (code: string, error?: unknown) => {
  const stripeError = error as { type?: string; code?: string; statusCode?: number; param?: string };
  const details = error instanceof Error
    ? {
        name: error.name,
        message: redactInternalIds(error.message),
        type: stripeError.type || undefined,
        stripe_code: stripeError.code || undefined,
        status: stripeError.statusCode || undefined,
        param: stripeError.param || undefined,
      }
    : { message: redactInternalIds(String(error || '')) };
  console.error('taploe_checkout_error', { code, ...details });
};
const classifyStripeError = (error: unknown) => {
  const stripeError = error as { type?: string; code?: string; statusCode?: number };
  if (stripeError.code === 'resource_missing') return 'stripe_price_not_found_for_key';
  if (stripeError.code === 'api_key_expired') return 'stripe_secret_key_invalid';
  if (stripeError.code === 'parameter_unknown') return 'stripe_checkout_parameter_invalid';
  if (stripeError.code === 'parameter_invalid_empty') return 'stripe_checkout_parameter_invalid';
  if (stripeError.code === 'parameter_invalid_integer') return 'stripe_checkout_parameter_invalid';
  if (stripeError.code === 'url_invalid') return 'stripe_return_url_invalid';
  if (stripeError.type === 'StripePermissionError') return 'stripe_key_permission_missing';
  if (stripeError.type === 'StripeAuthenticationError') return 'stripe_secret_key_invalid';
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase();
  if (message.includes('you did not provide an api key')) return 'stripe_secret_key_invalid';
  if (message.includes('publishable key')) return 'stripe_secret_key_is_publishable';
  if (message.includes('invalid api key') || message.includes('expired api key')) return 'stripe_secret_key_invalid';
  if (message.includes('no such price') || message.includes('no such plan')) return 'stripe_price_not_found_for_key';
  if (message.includes('price specified is inactive') || message.includes('price is inactive')) return 'stripe_price_inactive';
  if (message.includes('product is inactive')) return 'stripe_product_inactive';
  if (message.includes('does not support payment mode')) return 'stripe_price_mode_mismatch';
  if (message.includes('recurring price') || message.includes('one-time price')) return 'stripe_price_mode_mismatch';
  if (message.includes('managed payments')) return 'stripe_managed_payments_conflict';
  if (message.includes('payment_method_type') || message.includes('payment method settings')) return 'stripe_checkout_parameter_invalid';
  if (message.includes('cannot currently make live charges')) return 'stripe_account_not_ready';
  if (message.includes('charges are disabled')) return 'stripe_account_not_ready';
  if (message.includes('account is not fully set up')) return 'stripe_account_not_ready';
  if (message.includes('requirements')) return 'stripe_account_not_ready';
  if (message.includes('similar object exists in live mode') || message.includes('similar object exists in test mode')) return 'stripe_mode_mismatch';
  if (message.includes('permission') || message.includes('restricted')) return 'stripe_key_permission_missing';
  if (message.includes('invalid url')) return 'stripe_return_url_invalid';
  return 'payment_provider_unavailable';
};

const cleanUrl = (value: string) => {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return `${url.origin}${url.pathname.replace(/\/[^/]*$/, '')}`;
  } catch {
    return '';
  }
};
const supabaseRestHeaders = () => {
  const headers: Record<string, string> = {
    apikey: supabaseSecretKey,
    'Content-Type': 'application/json',
  };
  if (supabaseSecretKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${supabaseSecretKey}`;
  }
  return headers;
};
const loadValidPrices = async (requestedPrices: string[]) => {
  const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/ecommerce_product_prices`);
  url.searchParams.set('select', 'stripe_price_id,market,is_active');
  url.searchParams.set('market', 'eq.us');
  url.searchParams.set('is_active', 'eq.true');
  url.searchParams.set('stripe_price_id', `in.(${requestedPrices.join(',')})`);

  const response = await fetch(url, {
    method: 'GET',
    headers: supabaseRestHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Supabase price validation failed with ${response.status}`);
  }
  return await response.json() as Array<{ stripe_price_id: string; market: string; is_active: boolean }>;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    if (!stripeSecretKey || !supabaseUrl || !supabaseSecretKey) {
      logCheckoutError('checkout_config_unavailable');
      return checkoutUnavailable(503, 'checkout_config_unavailable');
    }

    const payload = await request.json();
    const market = 'us';
    const locale = String(payload.locale || 'en-US');
    const checkoutRef = String(payload.checkout_ref || '');
    const cart = Array.isArray(payload.cart) ? payload.cart as CartItem[] : [];
    const pageBase = cleanUrl(String(payload.page_url || '')) || 'https://www.taploe.com';

    if (!checkoutRef || !cart.length) {
      return json(
        { error: 'Checkout is temporarily unavailable.', code: 'checkout_payload_invalid' },
        400,
        { 'x-taploe-checkout-code': 'checkout_payload_invalid' },
      );
    }

    const requestedPrices = [...new Set(cart.map((item) => item.stripePriceId).filter(Boolean))] as string[];
    if (!requestedPrices.length) {
      return json(
        { error: 'Checkout is temporarily unavailable.', code: 'checkout_prices_missing' },
        400,
        { 'x-taploe-checkout-code': 'checkout_prices_missing' },
      );
    }

    let validPrices: Array<{ stripe_price_id: string; market: string; is_active: boolean }>;
    try {
      validPrices = await loadValidPrices(requestedPrices);
    } catch (error) {
      logCheckoutError('price_validation_unavailable', error);
      return checkoutUnavailable(503, 'price_validation_unavailable');
    }

    const validPriceIds = new Set((validPrices || []).map((price) => price.stripe_price_id));
    const invalidPrice = requestedPrices.find((priceId) => !validPriceIds.has(priceId));
    const invalidCartItem = cart.find((item) => !item.stripePriceId || !validPriceIds.has(item.stripePriceId));
    if (invalidPrice || invalidCartItem) {
      logCheckoutError('price_not_available_for_market');
      return json(
        { error: 'This product is temporarily unavailable.', code: 'price_not_available_for_market' },
        400,
        { 'x-taploe-checkout-code': 'price_not_available_for_market' },
      );
    }

    const lineItems = cart.map((item) => ({
      price: item.stripePriceId,
      quantity: Math.max(1, Math.min(99, Number(item.packageKey ? item.cartUnits || 1 : item.quantity || 1))),
    }));

    try {
      const stripePrices = await Promise.all(requestedPrices.map((priceId) => stripe.prices.retrieve(priceId, {
        expand: ['product'],
      })));
      const inactivePrice = stripePrices.find((price) => !price.active);
      if (inactivePrice) {
        logCheckoutError('stripe_price_inactive');
        return checkoutUnavailable(503, 'stripe_price_inactive');
      }
      const recurringPrice = stripePrices.find((price) => price.recurring);
      if (recurringPrice) {
        logCheckoutError('stripe_price_mode_mismatch');
        return checkoutUnavailable(503, 'stripe_price_mode_mismatch');
      }
      const inactiveProduct = stripePrices.find((price) => {
        const product = price.product;
        return typeof product === 'object' && product !== null && 'active' in product && product.active === false;
      });
      if (inactiveProduct) {
        logCheckoutError('stripe_product_inactive');
        return checkoutUnavailable(503, 'stripe_product_inactive');
      }
    } catch (error) {
      const code = classifyStripeError(error);
      logCheckoutError(code, error);
      return checkoutUnavailable(503, code, stripeErrorHeaders(error));
    }

    let session: Stripe.Checkout.Session;
    try {
      const sessionParams: TaploeCheckoutSessionCreateParams = {
        mode: 'payment',
        managed_payments: { enabled: false },
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
      };
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (error) {
      const code = classifyStripeError(error);
      logCheckoutError(code, error);
      return checkoutUnavailable(503, code, stripeErrorHeaders(error));
    }

    return json({ id: session.id, url: session.url });
  } catch (error) {
    logCheckoutError('checkout_unexpected_error', error);
    return checkoutUnavailable(503, 'checkout_unexpected_error');
  }
});
