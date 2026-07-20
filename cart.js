(() => {
  const config = window.TaploeEcommerce || {};
  const pathname = window.location.pathname.toLowerCase();
  const market = config.market || document.documentElement.dataset.market || (pathname.includes('/us/') ? 'us' : 'mx');
  const locale = config.locale || document.documentElement.dataset.locale || (market === 'us' ? 'en-US' : 'es-MX');
  const currency = config.currency || (market === 'us' ? 'USD' : 'MXN');
  const cartKey = config.cartStorageKey || `taploeCart:${market}`;
  const pendingCheckoutKey = config.pendingCheckoutStorageKey || `taploePendingCheckout:${market}`;
  const pathPrefix = pathname.includes('/us/') ? '/us' : (pathname.includes('/mx/') ? '/mx' : '');
  const copy = market === 'us'
    ? {
        title: 'Cart',
        close: 'Close cart',
        empty: 'Your cart is empty.',
        total: 'Total',
        buy: 'Buy now',
        continue: 'Continue shopping',
        secure: 'Secure payment. Shipping details are collected in the next step.',
        logoUploadError: (product) => `Could not upload the logo for ${product}.`,
        orderError: 'Could not create the Supabase order.',
        itemsError: 'Could not save the order products.',
        pieces: (quantity) => quantity === 1 ? 'piece' : 'pieces',
        each: 'each',
        remove: 'Remove',
        logo: 'Logo',
        package: 'Pack',
        links: 'Links',
        language: 'Language',
        design: 'Design',
        stripeLoad: 'Payment could not load. Check your connection.',
        supabaseConfig: 'Supabase is not configured correctly in ecommerce-config.js.',
        missingPrice: (product) => `Missing price_id for ${product}.`,
        preparing: 'Preparing payment...'
      }
    : {
        title: 'Carrito',
        close: 'Cerrar carrito',
        empty: 'Tu carrito está vacío.',
        total: 'Total',
        buy: 'Comprar ahora',
        continue: 'Seguir comprando',
        secure: 'Pago seguro. Los datos de envío se solicitan en el siguiente paso.',
        logoUploadError: (product) => `No se pudo subir el logo de ${product}.`,
        orderError: 'No se pudo crear la orden en Supabase.',
        itemsError: 'No se pudieron guardar los productos de la orden.',
        pieces: (quantity) => quantity === 1 ? 'pieza' : 'piezas',
        each: 'c/u',
        remove: 'Quitar',
        logo: 'Logo',
        package: 'Paquete',
        links: 'Enlaces',
        language: 'Idioma',
        design: 'Diseño',
        stripeLoad: 'No se pudo cargar el pago. Revisa tu conexión.',
        supabaseConfig: 'Supabase no está configurado correctamente en ecommerce-config.js.',
        missingPrice: (product) => `Falta price_id para ${product}.`,
        preparing: 'Preparando pago...'
      };
  const money = (value) => new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0
  }).format(Number(value || 0));

  const getCart = () => {
    try {
      return JSON.parse(localStorage.getItem(cartKey) || '[]');
    } catch {
      return [];
    }
  };
  const setCart = (cart) => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('taploe:cart-updated'));
  };
  const cartCount = (cart = getCart()) => cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const cartTotal = (cart = getCart()) => cart.reduce((sum, item) => sum + Number(item.totalPrice || item.unitPrice * item.quantity), 0);

  const supabaseReady = () => config.supabaseUrl && config.supabaseAnonKey && !config.supabaseUrl.includes('REEMPLAZA_') && !config.supabaseAnonKey.includes('REEMPLAZA_');
  const supabaseBaseUrl = () => (config.supabaseUrl || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

  const buildDrawer = () => {
    if (document.querySelector('[data-cart-drawer]')) return;
    const drawer = document.createElement('div');
    drawer.className = 'cart-drawer';
    drawer.setAttribute('data-cart-drawer', '');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `
      <button class="cart-drawer__backdrop" type="button" data-cart-close tabindex="-1" aria-label="${copy.close}"></button>
      <aside class="cart-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
        <div class="cart-drawer__header">
          <h2 id="cart-drawer-title">${copy.title}</h2>
          <button class="cart-drawer__close" type="button" data-cart-close aria-label="${copy.close}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <p class="cart-empty" data-cart-empty>${copy.empty}</p>
        <div class="cart-list cart-drawer__list" data-cart-items></div>
        <div class="cart-drawer__footer">
          <div class="cart-summary__total"><span>${copy.total}</span><strong data-cart-total>${money(0)}</strong></div>
          <button class="product-submit" type="button" data-cart-checkout>${copy.buy}</button>
          <button class="cart-drawer__continue" type="button" data-cart-close>${copy.continue}</button>
          <p class="product-form__status" role="status" aria-live="polite" data-cart-status></p>
          <p class="cart-summary__note">${copy.secure}</p>
        </div>
      </aside>
    `;
    document.body.appendChild(drawer);
  };

  const drawer = () => document.querySelector('[data-cart-drawer]');
  const openCart = () => {
    buildDrawer();
    render();
    drawer()?.classList.add('is-open');
    drawer()?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-is-open');
    drawer()?.querySelector('[data-cart-close]')?.focus({ preventScroll: true });
  };
  const closeCart = () => {
    drawer()?.classList.remove('is-open');
    drawer()?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-is-open');
  };

  const syncBadges = () => {
    const count = cartCount();
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });
  };

  const render = () => {
    buildDrawer();
    const cart = getCart();
    const root = drawer();
    const list = root.querySelector('[data-cart-items]');
    const empty = root.querySelector('[data-cart-empty]');
    const total = root.querySelector('[data-cart-total]');
    const checkout = root.querySelector('[data-cart-checkout]');
    const status = root.querySelector('[data-cart-status]');
    list.innerHTML = '';
    empty.hidden = cart.length > 0;
    checkout.disabled = cart.length === 0;
    total.textContent = money(cartTotal(cart));
    if (status) status.textContent = '';

    cart.forEach((item, index) => {
      const itemTotal = Number(item.totalPrice || item.unitPrice * item.quantity);
      const imageUrl = (item.imageUrl || 'assets/images/taploe-logo.png')
        .replace(/^\.\.\/assets\//, 'assets/')
        .replace(/^\/assets\//, 'assets/');
      const links = (item.reviewLinks || []).filter(Boolean);
      const logo = item.logo?.name ? `<span>${copy.logo}: ${item.logo.name}</span>` : '';
      const packageText = item.package ? `<span>${copy.package}: ${item.package}</span>` : '';
      const linksText = links.length ? `<span>${copy.links}: ${links.join(', ')}</span>` : '';
      const language = item.language ? `<span>${copy.language}: ${item.language.toUpperCase()}</span>` : '';
      const design = item.design && item.design !== 'profile' ? `<span>${copy.design}: ${item.design}</span>` : '';
      const article = document.createElement('article');
      article.className = 'cart-item';
      article.innerHTML = `
        <img src="${imageUrl}" alt="">
        <div class="cart-item__body">
          <div class="cart-item__top">
            <h3>${item.product}</h3>
            <strong>${money(itemTotal)}</strong>
          </div>
          <p>${item.quantity} ${copy.pieces(item.quantity)} · ${money(item.unitPrice)} ${copy.each}</p>
          <div class="cart-item__meta">${packageText}${language}${linksText}${logo}${design}</div>
          <button class="cart-item__remove" type="button" data-remove-index="${index}">${copy.remove}</button>
        </div>
      `;
      list.appendChild(article);
    });
    syncBadges();
  };

  const checkout = async () => {
    const cart = getCart();
    if (!cart.length) return;
    const root = drawer();
    const status = root.querySelector('[data-cart-status]');
    const checkoutButton = root.querySelector('[data-cart-checkout]');
    if (!supabaseReady()) {
      status.textContent = copy.supabaseConfig;
      return;
    }
    const missingPrice = cart.find((item) => !item.stripePriceId);
    if (missingPrice) {
      status.textContent = copy.missingPrice(missingPrice.product);
      return;
    }

    checkoutButton.disabled = true;
    status.textContent = copy.preparing;
    try {
      const checkoutRef = window.crypto?.randomUUID ? window.crypto.randomUUID() : `taploe-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(pendingCheckoutKey, JSON.stringify({
        checkoutRef,
        market,
        locale,
        currency,
        cart,
        createdAt: new Date().toISOString(),
        sourceUrl: window.location.href
      }));
      const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'https://taploe.com';
      const response = await fetch(`${supabaseBaseUrl()}/functions/v1/${config.webCartCheckoutFunction || 'create-web-cart-checkout-session'}`, {
        method: 'POST',
        headers: {
          apikey: config.supabaseAnonKey,
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          checkout_ref: checkoutRef,
          market,
          locale,
          currency,
          page_url: `${origin}${pathPrefix}/cart.html`,
          cart: cart.map((item) => ({
            id: item.id,
            product: item.product,
            productCode: item.productCode,
            stripePriceId: item.stripePriceId,
            quantity: item.quantity,
            packageKey: item.packageKey
          }))
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || copy.stripeLoad);
      window.location.href = result.url;
    } catch (error) {
      checkoutButton.disabled = false;
      status.textContent = error.message || copy.stripeLoad;
    }
  };

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-cart-open]')) {
      openCart();
      return;
    }
    if (event.target.closest('[data-cart-close]')) {
      closeCart();
      return;
    }
    const remove = event.target.closest('[data-remove-index]');
    if (remove) {
      const cart = getCart();
      cart.splice(Number(remove.dataset.removeIndex), 1);
      setCart(cart);
      render();
      return;
    }
    if (event.target.closest('[data-cart-checkout]')) {
      checkout();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCart();
  });
  window.addEventListener('storage', () => {
    syncBadges();
    if (drawer()?.classList.contains('is-open')) render();
  });
  window.addEventListener('taploe:cart-updated', (event) => {
    syncBadges();
    if (drawer()?.classList.contains('is-open')) render();
    if (event.detail?.open) openCart();
  });
  window.addEventListener('taploe:cart-open', openCart);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      buildDrawer();
      render();
      if (document.querySelector('[data-cart-page]')) openCart();
    });
  } else {
    buildDrawer();
    render();
    if (document.querySelector('[data-cart-page]')) openCart();
  }
})();
