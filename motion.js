// Taploe motion system: scroll reveals, headline entrances, shared-element page
// transitions, smooth accordions, header on scroll, micro-interactions.
// Everything is skipped when the visitor prefers reduced motion.
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- Header: compact + shadow once the page scrolls ----------
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (backTop) {
      backTop.classList.toggle('is-visible', y > 600);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      backTop.style.setProperty('--progress', String(max > 0 ? Math.min(1, y / max) : 0));
    }
  };

  // ---------- Back-to-top button with scroll progress ring ----------
  const backTop = document.querySelector('.site-footer') ? document.createElement('button') : null;
  if (backTop) {
    backTop.type = 'button';
    backTop.className = 'back-top';
    backTop.setAttribute('aria-label', 'Back to top');
    backTop.innerHTML = '<svg class="back-top__ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22"/></svg><svg class="back-top__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
    document.body.appendChild(backTop);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Smooth accordions (FAQ, product details) ----------
  const animateDetails = (details) => {
    const summary = details.querySelector(':scope > summary');
    if (!summary || details.dataset.motionAccordion) return;
    details.dataset.motionAccordion = '';
    summary.addEventListener('click', (event) => {
      if (reduceMotion) return;
      event.preventDefault();
      if (details.dataset.animating) return;
      details.dataset.animating = '1';
      const startHeight = details.offsetHeight;
      const opening = !details.open;
      if (opening) details.open = true;
      const endHeight = opening ? details.scrollHeight : summary.offsetHeight;
      details.style.overflow = 'hidden';
      const animation = details.animate(
        [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
        { duration: 340, easing: 'cubic-bezier(.2,.72,.18,1)' }
      );
      const body = [...details.children].filter((child) => child !== summary);
      if (opening) body.forEach((el) => el.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' }));
      animation.onfinish = () => {
        if (!opening) details.open = false;
        details.style.overflow = '';
        delete details.dataset.animating;
      };
    });
  };
  document.querySelectorAll('details').forEach(animateDetails);

  // ---------- Ripple on buttons ----------
  document.addEventListener('pointerdown', (event) => {
    if (reduceMotion) return;
    const target = event.target.closest('.button, .product-submit, .pdp-buy-now, .blog-chip, .catalog-filter, .pdp-custom__find');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'motion-ripple';
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - rect.left - size / 2}px;top:${event.clientY - rect.top - size / 2}px`;
    if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
    target.style.overflow = 'hidden';
    target.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });

  // ---------- Bump animation when a price or badge changes ----------
  const bump = (el) => {
    if (reduceMotion || !el) return;
    el.classList.remove('motion-bump');
    void el.offsetWidth;
    el.classList.add('motion-bump');
  };
  document.querySelectorAll('[data-product-price-display], [data-submit-price], [data-product-save-display], [data-cart-count], [data-blog-count]').forEach((el) => {
    new MutationObserver(() => bump(el)).observe(el, { childList: true, characterData: true, subtree: true });
  });
  // Cart badge is injected by site.js; watch for it too.
  new MutationObserver(() => {
    document.querySelectorAll('[data-cart-count]:not([data-motion-watch])').forEach((el) => {
      el.dataset.motionWatch = '';
      new MutationObserver(() => bump(el)).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }).observe(document.body, { childList: true, subtree: true });

  if (reduceMotion) return;
  root.classList.add('motion-on');

  // ---------- Shared-element page transitions (product + blog images) ----------
  // Chrome/Edge/Safari morph the clicked image into the next page's hero image.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const card = link.closest('.shop-tile, .blog-tile, .blog-feature, .blog-trending__item, .dropdown-menu a');
    const img = card?.querySelector('img');
    if (!img) return;
    const name = card.matches('.shop-tile, .dropdown-menu a') ? 'product-hero' : 'blog-cover';
    // Names must be unique: release the current page's hero before claiming it.
    document.querySelectorAll('.pdp-gallery [data-gallery-main], .blog-article__cover img').forEach((el) => {
      if (getComputedStyle(el).viewTransitionName === name) el.style.viewTransitionName = 'none';
    });
    img.style.viewTransitionName = name;
  }, true);
  window.addEventListener('pageshow', () => {
    document.querySelectorAll('[style*="view-transition-name"]').forEach((el) => { el.style.viewTransitionName = ''; });
  });

  // ---------- Headline word-by-word entrance ----------
  const splitWords = (el) => {
    if (el.dataset.motionSplit) return;
    el.dataset.motionSplit = '';
    let index = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const word = document.createElement('span');
            word.className = 'motion-word';
            word.style.setProperty('--w', String(index++));
            word.textContent = part;
            frag.appendChild(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          if (child.classList.contains('accent')) {
            child.classList.add('motion-word');
            child.style.setProperty('--w', String(index++));
          } else {
            walk(child);
          }
        }
      });
    };
    walk(el);
    el.classList.add('motion-split');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
  };
  document.querySelectorAll('.hero h1, .blog-hero h1, .blog-article h1, .pdp-buy h1, .page-intro h1, .catalog-heading h1, .pricing-hero h1, .teams-hero h1, .digital-hero h1').forEach(splitWords);

  // ---------- Scroll reveals ----------
  const reveal = (el, type, delay = 0) => {
    if (!el || el.dataset.motion || el.closest('.site-header, .mobile-nav, .cart-drawer, .announce-bar, .pdp-lightbox')) return;
    // Never animate a block whose children animate, or a child inside an animated block.
    if (el.querySelector('[data-motion]') || el.parentElement?.closest('[data-motion]')) return;
    el.dataset.motion = type;
    el.style.setProperty('--motion-delay', `${delay}ms`);
    observer.observe(el);
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-shown');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  const stagger = (selector, type = 'up', step = 70, max = 8) => {
    document.querySelectorAll(selector).forEach((parent) => {
      [...parent.children].forEach((child, i) => reveal(child, type, Math.min(i, max) * step));
    });
  };

  // Media zooms in gently.
  document.querySelectorAll('.hero-media, .blog-feature, .blog-article__cover, .pdp-gallery .product-gallery__stage, .video-showcase video, .teams-hero img, .digital-hero img, .final-cta img')
    .forEach((el) => reveal(el, 'zoom'));
  // Product gallery and buy box slide in from opposite sides.
  reveal(document.querySelector('.pdp-buy .pdp-ship'), 'right');
  // Grids: children appear one after another.
  stagger('.shop-grid, .steps-grid, .product-included__grid, .digital-products__grid, .related-products__grid, .pricing-grid, .pricing-cards, .faq-grid, .blog-trending, .trust-logos, .footer-grid, .pdp-trust, .pdp-checks, .pdp-packs, .pdp-accordions, .pdp-ideal ul, .blog-related .blog-tiles, .article__faq, .blog-faq, .teams-benefit-strip .container > div, .digital-process .container > div');
  stagger('.blog-chips, .catalog-filters', 'pop', 45, 10);
  stagger('.section-heading, .blog-hero__copy, .hero-copy, .page-intro, .catalog-heading, .pdp-guide__inner, .blog-library__head', 'up', 90);
  // Article body paragraphs rise in as you read.
  document.querySelectorAll('.blog-prose > *, .blog-sources, .blog-cta, .blog-toc, .blog-side-promo').forEach((el) => reveal(el, 'up'));
  // Anything else that is a direct block inside a section container.
  document.querySelectorAll('main section > .container > *, main section > .container > * > article, main > section > div > *').forEach((el) => reveal(el, 'up'));

  // ---------- Parallax on hero images ----------
  const parallax = [...document.querySelectorAll('.hero-product-image, .blog-feature__media img, .blog-article__cover img')];
  if (parallax.length) {
    let ticking = false;
    const update = () => {
      ticking = false;
      parallax.forEach((img) => {
        const rect = img.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
        img.style.setProperty('--parallax', `${(offset * -26).toFixed(1)}px`);
      });
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // ---------- 3D tilt on product and blog cards (mouse only) ----------
  if (finePointer) {
    document.querySelectorAll('.shop-tile__media, .pdp-gallery .product-gallery__stage, .blog-cta img, .pricing-card').forEach((card) => {
      card.classList.add('motion-tilt');
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`);
        card.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // ---------- Product gallery: crossfade when the main image changes ----------
  const stage = document.querySelector('[data-gallery-stage]');
  if (stage) {
    new MutationObserver((mutations) => {
      mutations.forEach((m) => m.addedNodes.forEach((node) => {
        if (node instanceof Element && node.matches('[data-gallery-main]')) {
          node.animate([{ opacity: 0, transform: 'scale(.96)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 420, easing: 'cubic-bezier(.2,.72,.18,1)' });
        }
      }));
    }).observe(stage, { childList: true });
  }

  // ---------- Count-up numbers when they scroll into view ----------
  const counters = [...document.querySelectorAll('.blog-count, .pdp-rating strong, .shop-tile__rating strong')];
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countObserver.unobserve(entry.target);
      const el = entry.target;
      const match = el.textContent.match(/[\d.]+/);
      if (!match) return;
      const final = el.textContent;
      const target = parseFloat(match[0]);
      const decimals = (match[0].split('.')[1] || '').length;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / 900);
        const eased = 1 - Math.pow(1 - t, 3);
        const from = decimals ? target * 0.8 : 0;
        el.textContent = final.replace(match[0], (from + (target - from) * eased).toFixed(decimals));
        if (t < 1) requestAnimationFrame(tick); else el.textContent = final;
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => countObserver.observe(el));
})();
