(() => {
  const market = document.documentElement.dataset.market || window.TaploeEcommerce?.market || 'us';
  const locale = document.documentElement.dataset.locale || window.TaploeEcommerce?.locale || 'en-US';
  const labels = { viewCart: 'Open cart' };
  const cartKey = window.TaploeEcommerce?.cartStorageKey || `taploeCart:${market}`;
  const appLoginUrl = window.TaploeEcommerce?.appLoginUrl || `https://app.taploe.com/login?locale=${locale}`;

  document.querySelectorAll('a[href="iniciar-sesion.html"], a[href="login.html"]').forEach((link) => {
    link.href = appLoginUrl;
  });

  const readCartCount = () => {
    try {
      return JSON.parse(localStorage.getItem(cartKey) || '[]').reduce((sum, item) => sum + Number(item.quantity || 1), 0);
    } catch {
      return 0;
    }
  };
  const updateCartBadges = () => {
    const count = readCartCount();
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });
  };
  const cartButton = () => {
    const button = document.createElement('button');
    button.className = 'cart-nav-button';
    button.type = 'button';
    button.setAttribute('aria-label', labels.viewCart);
    button.setAttribute('data-cart-open', '');
    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.2 6h15l-1.9 8.2a2 2 0 0 1-2 1.6H8.1a2 2 0 0 1-2-1.7L4.7 3.8H2.8"/>
        <path d="M9.2 20.2h.1M17.4 20.2h.1"/>
      </svg>
      <span class="sr-only">${labels.viewCart}</span>
      <b data-cart-count hidden>0</b>
    `;
    return button;
  };
  const headerActions = document.querySelector('.header-actions');
  if (headerActions && !headerActions.querySelector('.cart-nav-button')) {
    const menuButton = headerActions.querySelector('.menu-toggle');
    headerActions.insertBefore(cartButton(), menuButton || null);
  }
  const mobileNavInner = document.querySelector('.mobile-nav__inner');
  if (mobileNavInner && !mobileNavInner.querySelector('.cart-nav-button--mobile')) {
    const link = cartButton();
    link.classList.add('cart-nav-button--mobile');
    const loginLink = mobileNavInner.querySelector(`a[href="${appLoginUrl}"], a[href="iniciar-sesion.html"], a[href="login.html"]`);
    mobileNavInner.insertBefore(link, loginLink || null);
  }
  updateCartBadges();
  window.addEventListener('storage', updateCartBadges);
  window.addEventListener('taploe:cart-updated', updateCartBadges);

  const muteAutoplayVideo = (video) => {
    if (!(video instanceof HTMLVideoElement)) return;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    if (!video.hasAttribute('preload') || video.preload === 'auto') {
      video.preload = 'metadata';
    }
    if (!video.autoplay && !video.hasAttribute('data-autoplay-video')) return;
    const playAttempt = video.play();
    if (playAttempt) {
      playAttempt.catch(() => {});
    }
  };

  document.querySelectorAll('video').forEach(muteAutoplayVideo);

  const videoObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLVideoElement) {
          muteAutoplayVideo(node);
          return;
        }
        if (node instanceof Element) {
          node.querySelectorAll('video').forEach(muteAutoplayVideo);
        }
      });
    });
  });

  videoObserver.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      document.body.classList.add('is-keyboard-navigation');
    }
  });

  document.addEventListener('pointerdown', () => {
    document.body.classList.remove('is-keyboard-navigation');
  });

  document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
    const trigger = dropdown.querySelector('.nav-trigger');
    if (!trigger) return;
    trigger.setAttribute('aria-expanded', 'false');

    dropdown.addEventListener('mouseenter', () => {
      trigger.setAttribute('aria-expanded', 'true');
    });

    dropdown.addEventListener('mouseleave', () => {
      trigger.setAttribute('aria-expanded', 'false');
    });

    dropdown.addEventListener('focusin', () => {
      if (document.body.classList.contains('is-keyboard-navigation')) {
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    dropdown.addEventListener('focusout', (event) => {
      if (!dropdown.contains(event.relatedTarget)) {
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setupScrollReveal = () => {
    const blockedTags = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT']);
    const blockedSelectors = '.site-header, .mobile-nav, .dropdown-menu, .quote-dialog, .cart-drawer, .cart-loading';
    let revealOrder = 0;

    document.documentElement.classList.add('taploe-motion-ready');

    const shouldPrepare = (element) => (
      element instanceof Element
      && !blockedTags.has(element.tagName)
      && !element.closest(blockedSelectors)
      && !element.hasAttribute('data-taploe-reveal')
    );

    const prepareElement = (element, observer) => {
      element.dataset.taploeReveal = '';
      element.style.setProperty('--taploe-reveal-delay', `${Math.min(revealOrder * 8, 220)}ms`);
      revealOrder += 1;
      if (observer) {
        observer.observe(element);
      } else {
        element.classList.add('is-revealed');
      }
    };

    const elements = Array.from(document.body.querySelectorAll('*')).filter(shouldPrepare);

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => prepareElement(element, null));
      return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -6% 0px',
      threshold: 0.01
    });

    elements.forEach((element) => prepareElement(element, revealObserver));

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          [node, ...node.querySelectorAll('*')]
            .filter(shouldPrepare)
            .forEach((element) => prepareElement(element, revealObserver));
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
  };

  const setupPageTransitions = () => {
    window.addEventListener('pageshow', () => {
      document.body.classList.remove('is-page-leaving');
    });

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target && link.target !== '_self') return;
      if (link.hasAttribute('download')) return;

      const url = new URL(link.href, window.location.href);
      const samePageHash = url.pathname === window.location.pathname && url.search === window.location.search && url.hash;
      const sameOrigin = url.origin === window.location.origin || (window.location.protocol === 'file:' && url.protocol === 'file:');
      const isHttpNavigation = url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'file:';
      if (!sameOrigin || !isHttpNavigation || samePageHash) return;

      event.preventDefault();
      document.body.classList.add('is-page-leaving');
      window.setTimeout(() => {
        window.location.href = url.href;
      }, 190);
    });
  };

  if (!reduceMotion) {
    setupScrollReveal();
    setupPageTransitions();
  }

  const menuButton = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector("#mobile-navigation, .mobile-nav");

  if (!menuButton || !mobileNav) return;

  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("is-open");
    document.body.classList.remove("menu-is-open");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    mobileNav.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-is-open", !isOpen);
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      document.querySelectorAll('.nav-dropdown .nav-trigger').forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
    }
  });
})();
