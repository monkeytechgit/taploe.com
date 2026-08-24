-- Taploe ecommerce cart + Stripe checkout support
-- Run in the Supabase SQL Editor.
-- Physical products are stored in ecommerce tables separate from the platform tables.

create extension if not exists pgcrypto;

create table if not exists public.ecommerce_products (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  market text not null check (market in ('mx', 'us')),
  locale text not null,
  name text not null,
  description text,
  product_kind text not null,
  material text,
  is_physical boolean not null default true,
  is_active boolean not null default true,
  stripe_product_id text not null,
  default_stripe_price_id text,
  image_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market, code)
);

create table if not exists public.ecommerce_product_prices (
  id uuid primary key default gen_random_uuid(),
  ecommerce_product_id uuid not null references public.ecommerce_products(id) on delete cascade,
  market text not null check (market in ('mx', 'us')),
  package_key text not null,
  package_label text not null,
  stripe_price_id text not null,
  currency text not null,
  unit_amount numeric not null,
  total_amount numeric not null,
  quantity integer not null default 1,
  is_default boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market, stripe_price_id),
  unique (ecommerce_product_id, package_key)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_email text,
  customer_phone text,
  status text not null default 'draft',
  payment_status text not null default 'pending',
  currency text not null default 'USD',
  subtotal_amount numeric not null default 0,
  total_amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  description text,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists status text not null default 'draft',
  add column if not exists payment_status text not null default 'pending',
  add column if not exists currency text not null default 'USD',
  add column if not exists subtotal_amount numeric not null default 0,
  add column if not exists total_amount numeric not null default 0,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists checkout_client_reference_id text,
  add column if not exists ecommerce_source text not null default 'web_cart',
  add column if not exists market text,
  add column if not exists locale text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.order_items
  add column if not exists order_id uuid references public.orders(id) on delete cascade,
  add column if not exists description text,
  add column if not exists quantity integer not null default 1,
  add column if not exists unit_price numeric not null default 0,
  add column if not exists total_price numeric not null default 0,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists ecommerce_product_id uuid references public.ecommerce_products(id) on delete set null,
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_id text,
  add column if not exists cart_item_id text,
  add column if not exists configuration jsonb not null default '{}'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.order_checkout_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  stripe_checkout_session_id text,
  event_type text not null,
  payment_status text,
  amount_total numeric,
  currency text default 'USD',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ecommerce_products_market_code on public.ecommerce_products(market, code);
create index if not exists idx_ecommerce_products_stripe_product_id on public.ecommerce_products(stripe_product_id);
create index if not exists idx_ecommerce_product_prices_product_id on public.ecommerce_product_prices(ecommerce_product_id);
create index if not exists idx_ecommerce_product_prices_stripe_price_id on public.ecommerce_product_prices(stripe_price_id);
create index if not exists idx_orders_stripe_checkout_session_id on public.orders(stripe_checkout_session_id);
create index if not exists idx_orders_market on public.orders(market);
create index if not exists idx_order_items_ecommerce_product_id on public.order_items(ecommerce_product_id);
create index if not exists idx_order_items_cart_item_id on public.order_items(cart_item_id);
create index if not exists idx_order_items_stripe_price_id on public.order_items(stripe_price_id);
create index if not exists idx_order_checkout_events_order_id on public.order_checkout_events(order_id);
create unique index if not exists ux_orders_stripe_checkout_session_id
  on public.orders(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create unique index if not exists ux_orders_checkout_client_reference_id
  on public.orders(checkout_client_reference_id)
  where checkout_client_reference_id is not null;

insert into public.ecommerce_products
  (code, market, locale, name, description, product_kind, material, stripe_product_id, default_stripe_price_id, image_url, metadata)
values
  ('nfc', 'us', 'en-US', 'NFC Business Card', 'A lightweight, customizable card that opens your digital profile via NFC or QR code.', 'nfc_card', 'PVC', 'prod_V5o0MjNQkWGr8u', 'price_1U5cO2CYqBesDVNn7vyKC7z8', '/assets/images/product-nfc-business-card.webp', '{"ecommerce": true}'::jsonb),
  ('nfc_metalica', 'us', 'en-US', 'Metal NFC Business Card', 'A premium black metal card with built-in NFC and an included digital profile.', 'nfc_card', 'Metal', 'prod_V5nw7Hi1qhMHAT', 'price_1U5cKCCYqBesDVNniGjy9CAa', '/assets/images/product-metal-nfc-business-card.webp', '{"ecommerce": true}'::jsonb),
  ('google_reviews', 'us', 'en-US', 'Google Reviews NFC Card', 'A custom NFC card that opens your business Google review link via NFC or QR code.', 'review_card', 'PVC', 'prod_V5o9lNsKaIyuCf', 'price_1U7mkUCYqBesDVNnd33qMRAm', '/assets/images/product-google-reviews-nfc-card.webp', '{"ecommerce": true}'::jsonb),
  ('instagram', 'us', 'en-US', 'Instagram Profile NFC Card', 'A personalized NFC card that opens your Instagram profile via NFC or QR code.', 'qr_card', 'PVC', 'prod_V5oDgZ9AEISKtq', 'price_1U5cb1CYqBesDVNnnhrx79Qj', '/assets/images/product-instagram-nfc-card.webp', '{"ecommerce": true}'::jsonb),
  ('facebook', 'us', 'en-US', 'Facebook NFC Card', 'A personalized NFC card that opens your Facebook page via NFC or QR code.', 'qr_card', 'PVC', 'prod_V5oBRHsDEGUXL2', 'price_1U5cYsCYqBesDVNnIwX53lOD', '/assets/images/product-facebook-nfc-card.webp', '{"ecommerce": true}'::jsonb),
  ('tripadvisor', 'us', 'en-US', 'TripAdvisor NFC Card', 'A personalized NFC card that opens your TripAdvisor review link via NFC or QR code.', 'review_card', 'PVC', 'prod_V5oFgBe2iIiA06', 'price_1U5cdLCYqBesDVNnsOgoyAtu', '/assets/images/product-tripadvisor-nfc-card.webp', '{"ecommerce": true}'::jsonb)
on conflict (market, code) do update set
  locale = excluded.locale,
  name = excluded.name,
  description = excluded.description,
  product_kind = excluded.product_kind,
  material = excluded.material,
  is_physical = excluded.is_physical,
  is_active = excluded.is_active,
  stripe_product_id = excluded.stripe_product_id,
  default_stripe_price_id = excluded.default_stripe_price_id,
  image_url = excluded.image_url,
  metadata = public.ecommerce_products.metadata || excluded.metadata,
  updated_at = now();

update public.ecommerce_product_prices prices
set package_key = updates.package_key,
    updated_at = now()
from (
  values
    ('price_1U5cO2CYqBesDVNn7vyKC7z8', 'unit'),
    ('price_1U5cKCCYqBesDVNniGjy9CAa', 'unit'),
    ('price_1U7mkUCYqBesDVNnd33qMRAm', 'single'),
    ('price_1U5cWnCYqBesDVNnNApHtHAC', 'double'),
    ('price_1U5cWnCYqBesDVNngDEj99vR', 'pack'),
    ('price_1U5cWnCYqBesDVNnfu5s4jEb', 'mega-pack'),
    ('price_1U5cb1CYqBesDVNnnhrx79Qj', 'single'),
    ('price_1U5cblCYqBesDVNn8RW8zaL5', 'double'),
    ('price_1U5cblCYqBesDVNnQdYtb8XK', 'pack'),
    ('price_1U5cblCYqBesDVNnTaHdtikG', 'mega-pack'),
    ('price_1U5cYsCYqBesDVNnIwX53lOD', 'single'),
    ('price_1U5cZMCYqBesDVNnU7XQNseB', 'double'),
    ('price_1U5cZMCYqBesDVNnEtFlExvM', 'pack'),
    ('price_1U5cZMCYqBesDVNn7gU8HgWK', 'mega-pack'),
    ('price_1U5cdLCYqBesDVNnsOgoyAtu', 'single'),
    ('price_1U5ce6CYqBesDVNnRWAdd9mU', 'double'),
    ('price_1U5ce6CYqBesDVNnpE8vN6Dx', 'pack'),
    ('price_1U5ce5CYqBesDVNnoltXVDB2', 'mega-pack')
) as updates(stripe_price_id, package_key)
where prices.market = 'us'
  and prices.stripe_price_id = updates.stripe_price_id;

insert into public.ecommerce_product_prices
  (ecommerce_product_id, market, package_key, package_label, stripe_price_id, currency, unit_amount, total_amount, quantity, is_default, metadata)
select p.id, v.market, v.package_key, v.package_label, v.stripe_price_id, v.currency, v.unit_amount, v.total_amount, v.quantity, v.is_default, v.metadata
from (
  values
    ('us', 'nfc', 'unit', 'NFC Business Card', 'price_1U5cO2CYqBesDVNn7vyKC7z8', 'USD', 44.99::numeric, 44.99::numeric, 1, true, '{}'::jsonb),
    ('us', 'nfc_metalica', 'unit', 'Metal NFC Business Card', 'price_1U5cKCCYqBesDVNniGjy9CAa', 'USD', 64.99::numeric, 64.99::numeric, 1, true, '{}'::jsonb),
    ('us', 'google_reviews', 'single', 'Single', 'price_1U7mkUCYqBesDVNnd33qMRAm', 'USD', 34.99::numeric, 34.99::numeric, 1, true, '{}'::jsonb),
    ('us', 'google_reviews', 'double', 'Double', 'price_1U5cWnCYqBesDVNnNApHtHAC', 'USD', 25.00::numeric, 49.99::numeric, 2, false, '{"discount": "-29%"}'::jsonb),
    ('us', 'google_reviews', 'pack', 'Pack', 'price_1U5cWnCYqBesDVNngDEj99vR', 'USD', 16.00::numeric, 79.99::numeric, 5, false, '{"discount": "-54%"}'::jsonb),
    ('us', 'google_reviews', 'mega-pack', 'Mega pack', 'price_1U5cWnCYqBesDVNnfu5s4jEb', 'USD', 13.00::numeric, 129.99::numeric, 10, false, '{"discount": "-63%", "badge": "Best value"}'::jsonb),
    ('us', 'instagram', 'single', 'Single', 'price_1U5cb1CYqBesDVNnnhrx79Qj', 'USD', 34.99::numeric, 34.99::numeric, 1, true, '{}'::jsonb),
    ('us', 'instagram', 'double', 'Double', 'price_1U5cblCYqBesDVNn8RW8zaL5', 'USD', 25.00::numeric, 49.99::numeric, 2, false, '{"discount": "-29%"}'::jsonb),
    ('us', 'instagram', 'pack', 'Pack', 'price_1U5cblCYqBesDVNnQdYtb8XK', 'USD', 16.00::numeric, 79.99::numeric, 5, false, '{"discount": "-54%"}'::jsonb),
    ('us', 'instagram', 'mega-pack', 'Mega pack', 'price_1U5cblCYqBesDVNnTaHdtikG', 'USD', 13.00::numeric, 129.99::numeric, 10, false, '{"discount": "-63%", "badge": "Best value"}'::jsonb),
    ('us', 'facebook', 'single', 'Single', 'price_1U5cYsCYqBesDVNnIwX53lOD', 'USD', 34.99::numeric, 34.99::numeric, 1, true, '{}'::jsonb),
    ('us', 'facebook', 'double', 'Double', 'price_1U5cZMCYqBesDVNnU7XQNseB', 'USD', 25.00::numeric, 49.99::numeric, 2, false, '{"discount": "-29%"}'::jsonb),
    ('us', 'facebook', 'pack', 'Pack', 'price_1U5cZMCYqBesDVNnEtFlExvM', 'USD', 16.00::numeric, 79.99::numeric, 5, false, '{"discount": "-54%"}'::jsonb),
    ('us', 'facebook', 'mega-pack', 'Mega pack', 'price_1U5cZMCYqBesDVNn7gU8HgWK', 'USD', 13.00::numeric, 129.99::numeric, 10, false, '{"discount": "-63%", "badge": "Best value"}'::jsonb),
    ('us', 'tripadvisor', 'single', 'Single', 'price_1U5cdLCYqBesDVNnsOgoyAtu', 'USD', 34.99::numeric, 34.99::numeric, 1, true, '{}'::jsonb),
    ('us', 'tripadvisor', 'double', 'Double', 'price_1U5ce6CYqBesDVNnRWAdd9mU', 'USD', 25.00::numeric, 49.99::numeric, 2, false, '{"discount": "-29%"}'::jsonb),
    ('us', 'tripadvisor', 'pack', 'Pack', 'price_1U5ce6CYqBesDVNnpE8vN6Dx', 'USD', 16.00::numeric, 79.99::numeric, 5, false, '{"discount": "-54%"}'::jsonb),
    ('us', 'tripadvisor', 'mega-pack', 'Mega pack', 'price_1U5ce5CYqBesDVNnoltXVDB2', 'USD', 13.00::numeric, 129.99::numeric, 10, false, '{"discount": "-63%", "badge": "Best value"}'::jsonb)
) as v(market, code, package_key, package_label, stripe_price_id, currency, unit_amount, total_amount, quantity, is_default, metadata)
join public.ecommerce_products p
  on p.market = v.market and p.code = v.code
on conflict (ecommerce_product_id, package_key) do update set
  market = excluded.market,
  package_label = excluded.package_label,
  stripe_price_id = excluded.stripe_price_id,
  currency = excluded.currency,
  unit_amount = excluded.unit_amount,
  total_amount = excluded.total_amount,
  quantity = excluded.quantity,
  is_default = excluded.is_default,
  is_active = excluded.is_active,
  metadata = public.ecommerce_product_prices.metadata || excluded.metadata,
  updated_at = now();

update public.ecommerce_product_prices prices
set is_active = false, updated_at = now()
from public.ecommerce_products products
where prices.ecommerce_product_id = products.id
  and products.market = 'us'
  and products.code in ('nfc', 'nfc_metalica', 'google_reviews', 'instagram', 'facebook', 'tripadvisor')
  and prices.stripe_price_id not in (
    'price_1U5cO2CYqBesDVNn7vyKC7z8',
    'price_1U5cKCCYqBesDVNniGjy9CAa',
    'price_1U7mkUCYqBesDVNnd33qMRAm',
    'price_1U5cWnCYqBesDVNnNApHtHAC',
    'price_1U5cWnCYqBesDVNngDEj99vR',
    'price_1U5cWnCYqBesDVNnfu5s4jEb',
    'price_1U5cb1CYqBesDVNnnhrx79Qj',
    'price_1U5cblCYqBesDVNn8RW8zaL5',
    'price_1U5cblCYqBesDVNnQdYtb8XK',
    'price_1U5cblCYqBesDVNnTaHdtikG',
    'price_1U5cYsCYqBesDVNnIwX53lOD',
    'price_1U5cZMCYqBesDVNnU7XQNseB',
    'price_1U5cZMCYqBesDVNnEtFlExvM',
    'price_1U5cZMCYqBesDVNn7gU8HgWK',
    'price_1U5cdLCYqBesDVNnsOgoyAtu',
    'price_1U5ce6CYqBesDVNnRWAdd9mU',
    'price_1U5ce6CYqBesDVNnpE8vN6Dx',
    'price_1U5ce5CYqBesDVNnoltXVDB2'
  );

update public.ecommerce_products
set is_active = false, updated_at = now()
where market <> 'us';

update public.ecommerce_product_prices
set is_active = false, updated_at = now()
where market <> 'us';

insert into storage.buckets (id, name, public)
values ('order-assets', 'order-assets', true)
on conflict (id) do update set public = true;

alter table public.ecommerce_products enable row level security;
alter table public.ecommerce_product_prices enable row level security;
alter table public.order_checkout_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ecommerce_products' and policyname = 'Anyone can read active ecommerce products'
  ) then
    create policy "Anyone can read active ecommerce products"
      on public.ecommerce_products
      for select
      to anon
      using (is_active = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ecommerce_product_prices' and policyname = 'Anyone can read active ecommerce prices'
  ) then
    create policy "Anyone can read active ecommerce prices"
      on public.ecommerce_product_prices
      for select
      to anon
      using (is_active = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'order_checkout_events' and policyname = 'Service role can manage checkout events'
  ) then
    create policy "Service role can manage checkout events"
      on public.order_checkout_events
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- Las órdenes y sus items se crean después del pago desde la Edge Function
-- complete-checkout-order uses the service role. Do not allow direct anonymous
-- inserts into orders/order_items from the cart.
do $$
begin
  drop policy if exists "Web cart can create draft ecommerce orders" on public.orders;
  drop policy if exists "Web cart can create ecommerce order items" on public.order_items;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Web cart can upload order assets'
  ) then
    create policy "Web cart can upload order assets"
      on storage.objects
      for insert
      to anon
      with check (bucket_id = 'order-assets');
  end if;
end $$;

-- Recommended Stripe webhooks:
-- 1. checkout.session.completed -> point it to the existing stripe-webhook Edge Function
--    or to supabase/functions/stripe-checkout-webhook if you use this repo name.
--    The web cart creates sessions with create-web-cart-checkout-session, then the full
--    orders/order_items insert happens in complete-checkout-order after the successful
--    redirect, verifying the session with STRIPE_US_SECRET_KEY.
-- 2. checkout.session.async_payment_succeeded -> optional if async payment methods are enabled.
-- 3. checkout.session.async_payment_failed -> optional for logging failed attempts when
--    async payment methods are enabled.
-- Separate product webhooks are not needed; every product and pack goes through Stripe
-- price_id values in one Checkout session.
