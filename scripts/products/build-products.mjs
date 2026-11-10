// Rebuilds the product detail layout on every product page and the product tiles
// on the home page, catalog, digital card page and "You may also like" sections.
// Stripe IDs, prices and package inputs are read from the existing pages, so checkout is untouched.
// Usage: node scripts/products/build-products.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readPage = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const writePage = (f, s) => fs.writeFileSync(path.join(root, f), s);
const usd = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
const pct = (price, compare) => Math.round((1 - price / compare) * 100);

const ICON = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7.5 12.2 3 3 6-6.4"/></svg>',
  truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v10H3Z"/><path d="M14 11h4l3 3v3h-7Z"/><path d="M5 17a2 2 0 1 0 4 0M16 17a2 2 0 1 0 4 0"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6Z"/><path d="m9 12 2 2 4-4"/></svg>',
  tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8Z"/><circle cx="7.5" cy="8.5" r="1.3"/></svg>',
  cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 6h15l-1.9 8.2a2 2 0 0 1-2 1.6H8.1a2 2 0 0 1-2-1.7L4.7 3.8H2.8"/><path d="M9.2 20.2h.1M17.4 20.2h.1"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
  gift: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h16v10H4zM3 7h18v4H3zM12 7v14"/><path d="M12 7c-1.5-3-5-3.5-5-1.2C7 7 9.5 7 12 7Zm0 0c1.5-3 5-3.5 5-1.2C17 7 14.5 7 12 7Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};

const RATING = '4.9';
const GIFT_TITLE = '+1 free card with every order in 2026';
const GIFT_COPY = 'Through December 31, 2026 we add one extra card to every order at no cost. Same design, ready to use.';

const products = {
  nfc: {
    file: 'nfc-card.html', name: 'NFC Business Card', category: 'cards', categoryLabel: 'NFC cards',
    image: 'product-nfc-business-card.webp', alt: 'NFC Business Card with digital profile',
    price: 44.99, compare: 59.99, note: 'Digital profile included · Free shipping',
    checks: ['Share your contact <strong>with one tap</strong>', 'One-time payment, <strong>no subscriptions</strong>', 'Card size: <strong>85.6 mm × 54 mm</strong> (standard)'],
    ideal: ['Sales reps, realtors and consultants', 'Founders and freelancers', 'Networking events and trade shows', 'Anyone tired of reprinting paper cards'],
    howItWorks: 'Choose the Taploe design or upload your logo. We produce and ship your card, you connect it to your free Taploe profile, and from then on anyone can tap their phone on it (or scan the QR code) to open your contact, links and socials.',
    specs: ['Premium PVC, matte finish', 'NFC chip + printed dynamic QR code', '85.6 × 54 mm, 0.8 mm thick', 'No battery or charging needed'],
    guide: {
      title: 'NFC business cards: the last business card you’ll need to order',
      body: `<p>Paper business cards have a short life. They get lost in pockets, go out of date the moment your phone number or job title changes, and most of them end up in a drawer. An NFC business card fixes all three problems at once: you keep the card, the other person gets your details on their phone, and you can update those details whenever you want.</p>
<p>Every Taploe card includes an editable digital profile. Add your phone, email, WhatsApp, website, booking link and social profiles. When someone taps, their phone opens your profile with a button to save your contact. Nothing to install, on iPhone or Android.</p>
<h3>Why a QR code too?</h3>
<p>Most modern phones read NFC, but not everyone knows where to tap. The printed QR code gives people a second, familiar option, so no connection is ever lost.</p>
<p>Want to go deeper? Read <a href="blog/how-do-nfc-business-cards-work.html">how NFC business cards work</a> or <a href="blog/what-to-put-on-a-digital-business-card.html">what to put on a digital business card</a>.</p>`
    }
  },
  nfc_metalica: {
    file: 'metal-nfc-card.html', name: 'Metal NFC Business Card', category: 'cards', categoryLabel: 'NFC cards',
    image: 'product-metal-nfc-business-card.webp', alt: 'Metal NFC Business Card with digital profile',
    price: 64.99, compare: 89.99, note: 'Digital profile included · Free shipping',
    checks: ['A premium first impression, <strong>every time</strong>', 'One-time payment, <strong>no subscriptions</strong>', 'Card size: <strong>85.6 mm × 54 mm</strong> (standard)'],
    ideal: ['Executives and business owners', 'Real estate and luxury sales', 'Lawyers, consultants and advisors', 'Gifts for clients and partners'],
    howItWorks: 'Choose the Taploe design or upload your logo. We engrave and ship your card, you connect it to your free Taploe profile, and anyone can tap it (or scan the QR code) to open your contact, links and socials.',
    specs: ['Matte black metal with metallic gray engraving', 'NFC chip engineered to work with metal + engraved QR code', '85.6 × 54 mm', 'No battery or charging needed'],
    guide: {
      title: 'Metal NFC cards: built to be remembered',
      body: `<p>There’s a moment when you hand someone a metal card and they feel the weight. It starts a conversation before you’ve said a word. That’s the point of a metal NFC business card: it’s a statement piece that also happens to be incredibly practical.</p>
<p>Under the matte black finish sits an NFC chip connected to your editable Taploe profile. Tap it to a phone and your contact, website and socials open instantly. Change jobs or numbers? Edit your profile, keep your card.</p>
<p>Not sure if metal is right for you? Compare both options in <a href="blog/metal-vs-pvc-nfc-business-cards.html">metal vs PVC NFC business cards</a>.</p>`
    }
  },
  google_reviews: {
    file: 'google-reviews-nfc-card.html', name: 'Google Reviews NFC Card', category: 'reviews', categoryLabel: 'Reviews',
    image: 'product-google-reviews-nfc-card.webp', alt: 'NFC card for collecting Google reviews',
    note: 'Tap or scan · Free shipping',
    checks: ['Get more reviews <strong>in seconds</strong>', 'One-time payment, <strong>no subscriptions</strong>', 'Card size: <strong>85.6 mm × 54 mm</strong>'],
    ideal: ['Restaurants, cafés and bars', 'Dental offices, clinics and spas', 'Salons, barbershops and studios', 'Shops, auto repair and home services'],
    link: { label: 'Your Google review link', help: 'Paste the direct link to your Google review form. Have more than one location? Separate links with a comma (,).', helpUrl: 'https://support.google.com/business/answer/16816815', helpLabel: 'How do I find my review link?', guide: 'blog/google-review-link-and-qr-code.html' },
    howItWorks: 'Paste your Google review link when you order. We configure and ship your card. Place it on the counter, table or reception desk: customers tap their phone or scan the QR code and Google’s review form opens right away.',
    specs: ['Premium PVC, matte finish', 'NFC chip + printed QR code', '85.6 × 54 mm, 0.8 mm thick', 'Configured with your link before shipping'],
    guide: {
      title: 'Google review cards: the fastest way to collect more stars',
      body: `<p>Almost every new customer looks you up on Google before visiting. In BrightLocal’s 2026 survey, 41% of consumers said they <em>always</em> read reviews, and 74% look for reviews from the last three months. The businesses that win aren’t the ones with the most reviews ever; they’re the ones collecting fresh reviews every week.</p>
<p>The problem is friction. Most happy customers would gladly leave a review, but searching for your business, finding the right button and logging in loses them. A Google review card removes every step: tap, and the review form is open.</p>
<h3>Stay inside the rules</h3>
<p>Ask every customer, never offer rewards for reviews and never buy them. Google’s 2026 protections make fake engagement riskier than ever. A review card is simply a faster way to ask honestly.</p>
<p>Learn more: <a href="blog/how-to-get-more-google-reviews.html">how to get more Google reviews</a> and <a href="blog/google-maps-2026-fake-review-protections.html">Google Maps’ 2026 review protections</a>.</p>`
    }
  },
  instagram: {
    file: 'instagram-nfc-card.html', name: 'Instagram NFC Card', category: 'social', categoryLabel: 'Social networks',
    image: 'product-instagram-nfc-card.webp', alt: 'NFC card that opens an Instagram profile',
    note: 'Tap or scan · Free shipping',
    checks: ['Gain followers <strong>in seconds</strong>', 'One-time payment, <strong>no subscriptions</strong>', 'Card size: <strong>85.6 mm × 54 mm</strong>'],
    ideal: ['Cafés, restaurants and bakeries', 'Boutiques and concept stores', 'Salons, tattoo and beauty studios', 'Events, pop-ups and creators'],
    link: { label: 'Your Instagram profile link', help: 'Paste the link to your Instagram profile. More than one account? Separate links with a comma (,).', helpUrl: 'https://help.instagram.com/372819389498306', helpLabel: 'How do I find my profile link?', guide: 'blog/instagram-nfc-card-how-to-grow-followers.html' },
    howItWorks: 'Paste your Instagram link when you order. We configure and ship your card. Customers tap or scan it and your profile opens, ready to follow.',
    specs: ['Premium PVC, matte finish', 'NFC chip + printed QR code', '85.6 × 54 mm, 0.8 mm thick', 'Configured with your link before shipping'],
    guide: {
      title: 'Turn the people in your store into followers',
      body: `<p>Your best potential followers aren’t scrolling past an ad. They’re standing at your counter, phone in hand, right after a great experience. An Instagram NFC card catches that moment: one tap and your profile is open.</p>
<p>No spelling out your handle, no searching. Place it next to the register, by a photo-worthy display or on tables. Read <a href="blog/instagram-for-local-businesses-in-store.html">9 ideas to turn visitors into followers</a>.</p>`
    }
  },
  facebook: {
    file: 'facebook-nfc-card.html', name: 'Facebook NFC Card', category: 'social', categoryLabel: 'Social networks',
    image: 'product-facebook-nfc-card.webp', alt: 'NFC card that opens a Facebook page',
    note: 'Tap or scan · Free shipping',
    checks: ['More page likes <strong>in seconds</strong>', 'One-time payment, <strong>no subscriptions</strong>', 'Card size: <strong>85.6 mm × 54 mm</strong>'],
    ideal: ['Restaurants and family businesses', 'Gyms, studios and clubs', 'Community and event venues', 'Local services and shops'],
    link: { label: 'Your Facebook page link', help: 'Paste the link to your Facebook page. More than one page? Separate links with a comma (,).', helpUrl: 'https://www.facebook.com/help/104002523024878', helpLabel: 'How do I find my page link?', guide: 'blog/is-a-facebook-page-worth-it-2026.html' },
    howItWorks: 'Paste your Facebook page link when you order. We configure and ship your card. Customers tap or scan it and your page opens, ready to like and follow.',
    specs: ['Premium PVC, matte finish', 'NFC chip + printed QR code', '85.6 × 54 mm, 0.8 mm thick', 'Configured with your link before shipping'],
    guide: {
      title: 'Keep your local community one tap away',
      body: `<p>Facebook is still where many local customers check hours, events and recommendations. A Facebook NFC card makes it effortless for visitors to like your page so they see your next event, special or announcement.</p>
<p>Is a page still worth it in 2026? Read <a href="blog/is-a-facebook-page-worth-it-2026.html">our take</a>.</p>`
    }
  },
  tripadvisor: {
    file: 'tripadvisor-nfc-card.html', name: 'TripAdvisor NFC Card', category: 'reviews', categoryLabel: 'Reviews',
    image: 'product-tripadvisor-nfc-card.webp', alt: 'NFC card for collecting TripAdvisor reviews',
    note: 'Tap or scan · Free shipping',
    checks: ['More guest reviews <strong>in seconds</strong>', 'One-time payment, <strong>no subscriptions</strong>', 'Card size: <strong>85.6 mm × 54 mm</strong>'],
    ideal: ['Hotels, B&amp;Bs and vacation rentals', 'Restaurants and bars', 'Tours and experiences', 'Attractions and museums'],
    link: { label: 'Your TripAdvisor review link', help: 'Paste the link to your TripAdvisor review page. More than one listing? Separate links with a comma (,).', helpUrl: 'https://www.tripadvisor.com/Owners', helpLabel: 'How do I find my review link?', guide: 'blog/how-to-get-more-tripadvisor-reviews.html' },
    howItWorks: 'Paste your TripAdvisor link when you order. We configure and ship your card. Place it at the front desk, in rooms or with the check: guests tap or scan and your review page opens.',
    specs: ['Premium PVC, matte finish', 'NFC chip + printed QR code', '85.6 × 54 mm, 0.8 mm thick', 'Configured with your link before shipping'],
    guide: {
      title: 'Make every great stay show up on TripAdvisor',
      body: `<p>Travelers read TripAdvisor long before they book. Your happiest guests are the ones most likely to forget to review once they’re home. A TripAdvisor card at checkout or in the room catches them while the memory is fresh.</p>
<p>See <a href="blog/hotel-checkout-review-strategy.html">how hotels turn checkout into their best review moment</a>.</p>`
    }
  }
};
const order = ['nfc', 'nfc_metalica', 'google_reviews', 'instagram', 'facebook', 'tripadvisor'];

// ---------- product tiles ----------
const pagePrice = {}; // filled while reading product pages
const tile = (key, { prefix = '', headingTag = 'h3' } = {}) => {
  const p = products[key];
  const { price, compare } = pagePrice[key];
  return `<article class="shop-tile" data-category="${p.category}" data-search="${p.name.toLowerCase()} ${p.categoryLabel.toLowerCase()} nfc qr">
            <a class="shop-tile__media" href="${prefix}${p.file}" aria-label="View ${p.name}">
              <span class="shop-tile__save">Save ${pct(price, compare)}%</span>
              <span class="shop-tile__gift">${ICON.gift}+1 free</span>
              <img src="${prefix}assets/images/${p.image}" alt="${p.alt}" loading="lazy" width="600" height="600">
              <span class="shop-tile__cta">View product ${ICON.arrow}</span>
            </a>
            <div class="shop-tile__body">
              <span class="shop-tile__cat">${p.categoryLabel}</span>
              <${headingTag} class="shop-tile__name"><a href="${prefix}${p.file}">${p.name}</a></${headingTag}>
              <div class="shop-tile__rating" aria-label="Rated ${RATING} out of 5 by verified customers"><span class="stars" aria-hidden="true">★★★★★</span><strong>${RATING}</strong><span>· Verified customers</span></div>
              <div class="shop-tile__price"><strong>${usd(price)}</strong><del>${usd(compare)}</del></div>
              <p class="shop-tile__note">${p.note}</p>
            </div>
          </article>`;
};

// ---------- product detail ----------
const pick = (html, re, label, file) => {
  const m = html.match(re);
  if (!m) throw new Error(`${file}: could not find ${label}`);
  return m;
};

const buildDetail = (key) => {
  const p = products[key];
  let html = readPage(p.file);
  const asideOpen = pick(html, /<aside class="product-configurator[^"]*"[^>]*>/, 'configurator', p.file)[0]
    .replace(/class="product-configurator[^"]*"/, 'class="product-configurator pdp-buy"');
  const thumbs = pick(html, /<div class="product-gallery__thumbs">[\s\S]*?<\/button><\/div>/, 'thumbs', p.file)[0];
  const isPack = /name="review-package"/.test(html);

  // Prices: manual products read the configurator; package products read the single pack.
  let price; let compare;
  let packRows = '';
  if (isPack) {
    const inputs = [...html.matchAll(/<input type="radio" name="review-package"[^>]*>/g)].map((m) => m[0]);
    if (inputs.length !== 4) throw new Error(`${p.file}: expected 4 packages`);
    const attr = (tag, name) => (tag.match(new RegExp(`${name}="([^"]*)"`)) || [])[1];
    const single = inputs.find((t) => attr(t, 'value') === 'single');
    price = Number(attr(single, 'data-package-price'));
    compare = Number((html.match(/<del(?: data-product-compare-display)?>\$([\d.,]+) USD<\/del>/) || [])[1]?.replace(',', '') || 49.99);
    const flags = { pack: '🔥 Most popular', 'mega-pack': 'Best value' };
    packRows = inputs.map((raw) => {
      const value = attr(raw, 'value');
      const qty = Number(attr(raw, 'data-package-quantity'));
      const total = Number(attr(raw, 'data-package-price'));
      const unit = Number(attr(raw, 'data-package-unit-price'));
      const packCompare = qty === 1 ? compare : +(price * qty).toFixed(2);
      const input = raw
        .replace(/\s*data-package-compare="[^"]*"/, '')
        .replace(/\s*data-package-flag="[^"]*"/, '')
        .replace('data-package-option', `data-package-option data-package-compare="${packCompare.toFixed(2)}"`);
      const off = qty === 1 ? '' : `<span class="pdp-pack__off">${pct(total, packCompare)}% off</span>`;
      return `<label class="pdp-pack${flags[value] ? ' pdp-pack--flag' : ''}">
                  ${input}
                  ${flags[value] ? `<span class="pdp-pack__flag${value === 'mega-pack' ? ' pdp-pack__flag--best' : ''}">${flags[value]}</span>` : ''}
                  <span class="pdp-pack__radio" aria-hidden="true"></span>
                  <span class="pdp-pack__info"><strong>${qty} ${qty === 1 ? 'card' : 'cards'} ${off}</strong><small>${qty === 1 ? 'Free shipping included' : `${usd(unit)} each`}</small></span>
                  <span class="pdp-pack__price"><strong>${usd(total)}</strong><del>${usd(packCompare)}</del></span>
                </label>`;
    }).join('\n                ');
  } else {
    price = Number(pick(html, /data-product-price="([\d.]+)"/, 'price', p.file)[1]);
    compare = Number(pick(html, /<del(?: data-product-compare-display)?>\$([\d.,]+) USD<\/del>/, 'compare', p.file)[1].replace(',', ''));
  }
  pagePrice[key] = { price, compare };

  const design = isPack ? '' : pick(html, /<fieldset class="config-group" data-design-group>[\s\S]*?<\/fieldset>/, 'design group', p.file)[0];
  const upload = isPack ? '' : pick(html, /<div class="config-group logo-upload-panel" data-upload-panel>[\s\S]*?data-upload-remove[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/, 'upload panel', p.file)[0];
  const thumbImg = `assets/images/${p.image}`;

  const customize = isPack
    ? `<div class="pdp-custom">
                <div class="pdp-custom__field">
                  <img src="${thumbImg}" alt="" width="44" height="44">
                  <label class="sr-only" for="review-link">${p.link.label}</label>
                  <input class="product-text-input" id="review-link" name="review-link" type="text" placeholder="${key === 'instagram' ? 'https://instagram.com/yourusername' : key === 'facebook' ? 'https://facebook.com/yourbusiness' : key === 'tripadvisor' ? 'https://www.tripadvisor.com/...' : 'https://g.page/r/...'}" required data-review-link>
                </div>
                <p class="pdp-custom__help"><strong>${p.link.label}.</strong> ${p.link.help}</p>
                <a class="pdp-custom__find" href="${p.link.helpUrl}" target="_blank" rel="noopener">${ICON.search}${p.link.helpLabel}</a>
                <a class="pdp-custom__guide" href="${p.link.guide}">Read our step-by-step guide</a>
              </div>`
    : `<div class="pdp-custom">
                ${design}
                ${upload}
              </div>`;

  const quantity = isPack
    ? ''
    : `<div class="quantity-control pdp-qty"><button type="button" data-quantity-minus aria-label="Decrease quantity">−</button><input id="quantity" name="quantity" type="number" value="1" min="1" max="99" inputmode="numeric" aria-label="Quantity" data-quantity><button type="button" data-quantity-plus aria-label="Increase quantity">+</button></div>`;

  const section = `<section class="product-detail pdp">
      <div class="container">
        <nav class="pdp-breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="catalog.html">${p.categoryLabel}</a><span aria-hidden="true">/</span><span>${p.name}</span></nav>
        <div class="product-detail__grid pdp-grid">
          <div class="product-gallery pdp-gallery" data-gallery>
            <div class="product-gallery__stage" data-gallery-stage>
              <img class="product-gallery__main" data-gallery-main src="${thumbImg}" alt="${p.alt}">
              <button class="pdp-gallery__nav pdp-gallery__nav--prev" type="button" data-gallery-prev aria-label="Previous image">${ICON.prev}</button>
              <button class="pdp-gallery__nav pdp-gallery__nav--next" type="button" data-gallery-next aria-label="Next image">${ICON.next}</button>
              <button class="pdp-gallery__zoom" type="button" data-gallery-zoom aria-label="View image full screen">${ICON.expand}</button>
              <span class="pdp-gallery__gift">${ICON.gift}+1 free card in 2026</span>
            </div>
            ${thumbs}
          </div>

          ${asideOpen}
            <p class="pdp-ship">${ICON.truck}<span>Free shipping across the USA 🇺🇸</span></p>
            <h1>${p.name}</h1>
            <div class="pdp-rating" aria-label="Rated ${RATING} out of 5 by verified customers"><span class="stars" aria-hidden="true">★★★★★</span><strong>${RATING}/5</strong><span>· Verified customers</span></div>
            <div class="pdp-price">
              <strong data-product-price-display>${usd(price)}</strong>
              <del data-product-compare-display>${usd(compare)}</del>
              <span class="pdp-price__save">${ICON.tag}<span data-product-save-display>Save ${pct(price, compare)}%</span></span>
            </div>
            <p class="pdp-price__note">One-time payment · Free shipping included</p>
            <ul class="pdp-checks">
              ${p.checks.map((c) => `<li>${ICON.check}<span>${c}</span></li>`).join('\n              ')}
            </ul>
            <div class="pdp-gift">${ICON.gift}<div><strong>${GIFT_TITLE}</strong><span>${GIFT_COPY}</span></div></div>

            <form class="product-form" data-product-form>
${isPack ? `              <div class="pdp-divider"><span>Buy more, save more</span></div>
              <fieldset class="pdp-packs">
                <legend class="sr-only">Choose your pack</legend>
                ${packRows}
              </fieldset>
` : ''}              <div class="pdp-divider pdp-divider--plain"><span>Customize your card 👇</span></div>
              ${customize}

              <div class="pdp-actions">
                ${quantity}
                <button class="product-submit pdp-add" type="submit">${ICON.cart}<span>Add to cart · <span data-submit-price>${usd(price)}</span></span></button>
              </div>
              <button class="pdp-buy-now" type="submit" data-buy-now>${ICON.lock}<span>Buy now · secure checkout</span></button>
              <p class="product-form__status" role="status" aria-live="polite" data-form-status></p>

              <div class="pdp-trust">
                <span>${ICON.truck}Free shipping across the USA</span>
                <span>${ICON.bolt}Set up and ready to use</span>
                <span>${ICON.shield}No apps or subscriptions</span>
              </div>

              <div class="pdp-ideal">
                <strong>Ideal for:</strong>
                <ul>${p.ideal.map((i) => `<li>${i}</li>`).join('')}</ul>
              </div>

              <div class="pdp-accordions">
                <details class="pdp-accordion"><summary>How does it work?</summary><p>${p.howItWorks}</p></details>
                <details class="pdp-accordion"><summary>Compatibility</summary><p>Works with iPhone XR and newer and virtually every Android phone with NFC. Phones that can’t tap simply scan the printed QR code with the camera. No app required.</p></details>
                <details class="pdp-accordion"><summary>Specifications</summary><ul>${p.specs.map((s) => `<li>${s}</li>`).join('')}</ul></details>
                <details class="pdp-accordion"><summary>Shipping and delivery</summary><p>Free shipping across the United States. Estimated delivery is 5-7 business days after your order is confirmed, with tracking details by email. Through 2026, every order includes one extra card at no cost.</p></details>
              </div>
            </form>
          </aside>
        </div>
      </div>
    </section>

    <section class="pdp-guide">
      <div class="container pdp-guide__inner">
        <span class="pdp-guide__kicker">Complete guide</span>
        <h2>${p.guide.title}</h2>
        ${p.guide.body}
      </div>
    </section>

    `;

  html = html.replace(/<section class="product-detail[^"]*">[\s\S]*?(?=<section class="section section-bordered product-steps)/, section);
  if (!html.includes('class="product-detail pdp"')) throw new Error(`${p.file}: replace failed`);
  html = html.replace(/<body class="product-page([^"]*)">/, (m, rest) => (rest.includes('pdp-page') ? m : `<body class="product-page pdp-page${rest}">`));
  return html;
};

const relatedSection = (key) => {
  const others = order.filter((k) => k !== key).slice(0, 4);
  return `<!-- related:start -->
    <section class="section section-bordered shop-related">
      <div class="container">
        <div class="section-heading"><h2>You may also like</h2><p>More ways to connect with customers in one tap.</p></div>
        <div class="shop-grid shop-grid--four">
          ${others.map((k) => tile(k)).join('\n          ')}
        </div>
      </div>
    </section>
    <!-- related:end -->`;
};

// Pass 1: product pages (also collects prices for tiles).
const built = {};
for (const key of order) built[key] = buildDetail(key);
for (const key of order) {
  let html = built[key];
  html = html.replace(/\s*<section class="section section-bordered related-products">[\s\S]*?<\/section>/, '');
  if (html.includes('<!-- related:start -->')) {
    html = html.replace(/<!-- related:start -->[\s\S]*?<!-- related:end -->/, relatedSection(key));
  } else {
    html = html.replace(/(\s*)<\/main>/, `\n    ${relatedSection(key)}\n  </main>`);
  }
  writePage(products[key].file, html);
}

// Pass 2: home page product grid.
{
  let html = readPage('index.html');
  const grid = `<div class="shop-grid" data-shop-grid>
          ${order.map((k) => tile(k)).join('\n          ')}
        </div>`;
  html = html.replace(/<div class="(?:product-grid|shop-grid)"[^>]*>[\s\S]*?<\/article>\s*<\/div>/, grid);
  if (!html.includes('data-shop-grid')) throw new Error('index.html: product grid not replaced');
  writePage('index.html', html);
}

// Pass 3: catalog grid.
{
  let html = readPage('catalog.html');
  const grid = `<div class="catalog-grid shop-grid" id="catalog-grid">
          ${order.map((k) => tile(k, { headingTag: 'h2' })).join('\n\n          ')}
        </div>`;
  html = html.replace(/<div class="catalog-grid[^"]*" id="catalog-grid">[\s\S]*?<\/article>\s*<\/div>/, grid);
  html = html.replace(/\s*<button class="catalog-filter" type="button" data-filter="profile">Digital profiles<\/button>/, '');
  html = html.replace('document.querySelectorAll(".catalog-card")', 'document.querySelectorAll(".shop-tile")');
  writePage('catalog.html', html);
}

// Pass 4: digital card page add-ons.
{
  let html = readPage('digital-card.html');
  html = html.replace(/<div class="(?:digital-products__grid|shop-grid shop-grid--two)">[\s\S]*?<\/article>\s*<\/div>/, `<div class="shop-grid shop-grid--two">
          ${['nfc', 'nfc_metalica'].map((k) => tile(k)).join('\n          ')}
        </div>`);
  writePage('digital-card.html', html);
}

console.log('Products rebuilt:', order.map((k) => `${k} ${usd(pagePrice[k].price)} (was ${usd(pagePrice[k].compare)})`).join(', '));
