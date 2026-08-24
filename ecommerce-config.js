(() => {
  const market = 'us';
  const locale = 'en-US';

  const productsByMarket = {
    us: {
      nfc: {
        productId: 'prod_V5o0MjNQkWGr8u',
        priceId: 'price_1U5cO2CYqBesDVNn7vyKC7z8',
        unitPrice: 44.99,
        quantityMode: 'manual'
      },
      nfc_metalica: {
        productId: 'prod_V5nw7Hi1qhMHAT',
        priceId: 'price_1U5cKCCYqBesDVNniGjy9CAa',
        unitPrice: 64.99,
        quantityMode: 'manual'
      },
      google_reviews: {
        productId: 'prod_V5o9lNsKaIyuCf',
        quantityMode: 'package',
        packages: {
          single: { priceId: 'price_1U5cWnCYqBesDVNnEfju1Nez', totalPrice: 34.99, unitPrice: 34.99, quantity: 1 },
          double: { priceId: 'price_1U5cWnCYqBesDVNnNApHtHAC', totalPrice: 49.99, unitPrice: 25.00, quantity: 2 },
          pack: { priceId: 'price_1U5cWnCYqBesDVNngDEj99vR', totalPrice: 79.99, unitPrice: 16.00, quantity: 5 },
          'mega-pack': { priceId: 'price_1U5cWnCYqBesDVNnfu5s4jEb', totalPrice: 129.99, unitPrice: 13.00, quantity: 10 }
        }
      },
      facebook: {
        productId: 'prod_V5oBRHsDEGUXL2',
        quantityMode: 'package',
        packages: {
          single: { priceId: 'price_1U5cYsCYqBesDVNnIwX53lOD', totalPrice: 34.99, unitPrice: 34.99, quantity: 1 },
          double: { priceId: 'price_1U5cZMCYqBesDVNnU7XQNseB', totalPrice: 49.99, unitPrice: 25.00, quantity: 2 },
          pack: { priceId: 'price_1U5cZMCYqBesDVNnEtFlExvM', totalPrice: 79.99, unitPrice: 16.00, quantity: 5 },
          'mega-pack': { priceId: 'price_1U5cZMCYqBesDVNn7gU8HgWK', totalPrice: 129.99, unitPrice: 13.00, quantity: 10 }
        }
      },
      instagram: {
        productId: 'prod_V5oDgZ9AEISKtq',
        quantityMode: 'package',
        packages: {
          single: { priceId: 'price_1U5cb1CYqBesDVNnnhrx79Qj', totalPrice: 34.99, unitPrice: 34.99, quantity: 1 },
          double: { priceId: 'price_1U5cblCYqBesDVNn8RW8zaL5', totalPrice: 49.99, unitPrice: 25.00, quantity: 2 },
          pack: { priceId: 'price_1U5cblCYqBesDVNnQdYtb8XK', totalPrice: 79.99, unitPrice: 16.00, quantity: 5 },
          'mega-pack': { priceId: 'price_1U5cblCYqBesDVNnTaHdtikG', totalPrice: 129.99, unitPrice: 13.00, quantity: 10 }
        }
      },
      tripadvisor: {
        productId: 'prod_V5oFgBe2iIiA06',
        quantityMode: 'package',
        packages: {
          single: { priceId: 'price_1U5cdLCYqBesDVNnsOgoyAtu', totalPrice: 34.99, unitPrice: 34.99, quantity: 1 },
          double: { priceId: 'price_1U5ce6CYqBesDVNnRWAdd9mU', totalPrice: 49.99, unitPrice: 25.00, quantity: 2 },
          pack: { priceId: 'price_1U5ce6CYqBesDVNnpE8vN6Dx', totalPrice: 79.99, unitPrice: 16.00, quantity: 5 },
          'mega-pack': { priceId: 'price_1U5ce5CYqBesDVNnoltXVDB2', totalPrice: 129.99, unitPrice: 13.00, quantity: 10 }
        }
      }
    }
  };

  window.TaploeEcommerce = {
    stripePublishableKey: 'pk_live_51U5WzpCYqBesDVNnAUgyv2VdrbB03erkKrp0Ly72WqXLvvO5sRis4GL9ifX8dexot95ChJg7EjlZFNPQKhYu2cXz00Ve41uvrD',
    siteUrl: 'https://www.taploe.com',
    supabaseUrl: 'https://gmpiygcnzlxllnablxmk.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcGl5Z2Nuemx4bGxuYWJseG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTE1NjUsImV4cCI6MjA5OTE4NzU2NX0.3xYOvjvjuoNJW5DXemn0VaNUnC1IifluBjHVSa_uKBs',
    market,
    locale,
    currency: 'USD',
    cartStorageKey: 'taploeCart:us',
    orderStorageKey: 'taploeCheckoutOrderId:us',
    pendingCheckoutStorageKey: 'taploePendingCheckout:us',
    webCartCheckoutFunction: 'create-web-cart-checkout-session',
    webCartCompleteFunction: 'complete-checkout-order',
    checkoutMode: 'payment',
    appLoginUrl: 'https://app.taploe.com/login?locale=en-US',
    productsByMarket,
    products: productsByMarket.us
  };
})();
