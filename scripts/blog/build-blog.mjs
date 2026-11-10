// Builds /blog/index.html and every /blog/<slug>.html from the data in this folder.
// Usage: node scripts/blog/build-blog.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import newsReviews from './posts-news-reviews.mjs';
import guides from './posts-guides.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const SITE = 'https://www.taploe.com';
const read = (p) => fs.readFileSync(path.join(here, p), 'utf8');
const header = read('partials/header.html');
const footer = read('partials/footer.html');
const legacy = JSON.parse(read('legacy-posts.json'));

export const CATEGORIES = {
  news: 'Industry News',
  reviews: 'Reviews & Reputation',
  'local-seo': 'Google Maps & Local SEO',
  nfc: 'NFC & QR Tech',
  cards: 'Digital Business Cards',
  social: 'Social Media',
  growth: 'Business Ideas'
};

// Category + cover photo for the original 17 posts.
const legacyOverrides = {
  'are-nfc-business-cards-safe': { category: 'nfc', image: '/assets/images/nfc-card-custom-logo.webp' },
  'digital-business-cards-vs-paper-business-cards': { category: 'cards', image: 'businessman' },
  'google-business-profile-checklist': { category: 'local-seo', image: 'coffee-shop' },
  'google-review-link-and-qr-code': { category: 'reviews', image: '/assets/images/google-reviews-step-1.webp' },
  'how-do-nfc-business-cards-work': { category: 'nfc', image: '/assets/images/nfc-card-sample.webp' },
  'how-to-create-a-digital-business-card': { category: 'cards', image: '/assets/images/digital-profile-2.webp' },
  'how-to-get-more-google-reviews': { category: 'reviews', image: '/assets/images/product-google-reviews-nfc-card.webp' },
  'how-to-get-more-tripadvisor-reviews': { category: 'reviews', image: 'hotel-pool' },
  'how-to-respond-to-negative-google-reviews': { category: 'reviews', image: 'typing-laptop' },
  'instagram-nfc-card-how-to-grow-followers': { category: 'social', image: '/assets/images/instagram-step-1.webp' },
  'metal-vs-pvc-nfc-business-cards': { category: 'nfc', image: '/assets/images/product-metal-nfc-business-card.webp' },
  'nfc-business-cards-for-networking-events': { category: 'cards', image: 'networking-crowd' },
  'nfc-business-cards-for-real-estate-agents': { category: 'cards', image: 'house-keys' },
  'nfc-business-cards-for-sales-teams': { category: 'cards', image: 'high-five' },
  'nfc-review-cards-for-restaurants': { category: 'reviews', image: 'restaurant-dinner' },
  'nfc-vs-qr-code-business-cards': { category: 'nfc', image: '/assets/images/connection-methods.webp' },
  'what-to-put-on-a-digital-business-card': { category: 'cards', image: '/assets/images/digital-profile-3.webp' }
};

const promos = {
  reviews: { href: '/google-reviews-nfc-card.html', img: '/assets/images/product-google-reviews-nfc-card.webp', name: 'Google Reviews NFC Card', copy: 'Customers tap or scan and land right on your review form.' },
  social: { href: '/instagram-nfc-card.html', img: '/assets/images/product-instagram-nfc-card.webp', name: 'Instagram NFC Card', copy: 'Turn in-store visitors into followers with one tap.' },
  cards: { href: '/nfc-card.html', img: '/assets/images/product-nfc-business-card.webp', name: 'NFC Business Card', copy: 'Share your contact, links and socials with one tap.' },
  tripadvisor: { href: '/tripadvisor-nfc-card.html', img: '/assets/images/product-tripadvisor-nfc-card.webp', name: 'TripAdvisor NFC Card', copy: 'Make leaving a TripAdvisor review effortless for guests.' }
};
const promoFor = (post) => {
  if (post.slug.includes('tripadvisor') || post.slug.includes('hotel')) return promos.tripadvisor;
  if (['reviews', 'news', 'local-seo'].includes(post.category)) return promos.reviews;
  if (post.category === 'social') return promos.social;
  return promos.cards;
};

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const strip = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n))}…`);
const slugify = (s) => strip(s).toLowerCase().replace(/&[a-z]+;/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const imageUrl = (img) => (img.startsWith('/') ? img : `/assets/images/blog/${img}.webp`);
const fmtDate = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const json = (o) => JSON.stringify(o, null, 2).replace(/</g, '\\u003c');

// ---------- assemble posts ----------
const posts = [
  ...legacy.map((p) => ({
    ...p,
    ...legacyOverrides[p.slug],
    date: '2026-09-21',
    imageAlt: strip(p.title),
    body: read(`content/${p.slug}.html`)
  })),
  ...newsReviews,
  ...guides
].map((p) => {
  const ids = new Set();
  const toc = [];
  const body = p.body.trim().replace(/<h2(\s+id="([^"]*)")?>([\s\S]*?)<\/h2>/g, (_m, _a, id, text) => {
    let finalId = id || slugify(text);
    while (ids.has(finalId)) finalId += '-2';
    ids.add(finalId);
    toc.push({ id: finalId, text: strip(text) });
    return `<h2 id="${finalId}">${text}</h2>`;
  });
  return { ...p, body, toc, img: imageUrl(p.image), excerpt: clip(strip(p.intro), 150), categoryLabel: CATEGORIES[p.category] };
}).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

const slugs = new Set();
for (const p of posts) {
  if (slugs.has(p.slug)) throw new Error(`Duplicate slug ${p.slug}`);
  if (!p.categoryLabel) throw new Error(`Unknown category for ${p.slug}`);
  if (!fs.existsSync(path.join(root, p.img))) throw new Error(`Missing image ${p.img} for ${p.slug}`);
  slugs.add(p.slug);
}
// Internal blog links must point at real posts.
for (const p of posts) {
  for (const [, target] of p.body.matchAll(/href="\/blog\/([^"#]+)\.html/g)) {
    if (!slugs.has(target)) throw new Error(`${p.slug} links to missing post ${target}`);
  }
}

// ---------- shared pieces ----------
const icon = {
  bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4 4 20"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h3v11H4zM5.5 4a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6ZM10 9h3v1.6c.5-.9 1.7-1.8 3.4-1.8 3 0 3.6 2 3.6 4.6V20h-3v-5.8c0-1.4 0-3-1.9-3s-2.1 1.4-2.1 2.9V20h-3z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v8h4v-8h3l.5-4H14V8.6c0-.4.3-.6.6-.6Z"/></svg>',
  gift: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h16v10H4zM3 7h18v4H3zM12 7v14"/><path d="M12 7c-1.5-3-5-3.5-5-1.2C7 7 9.5 7 12 7Zm0 0c1.5-3 5-3.5 5-1.2C17 7 14.5 7 12 7Z"/></svg>'
};

const head = ({ title, description, url, image, type, ld }) => `<!DOCTYPE html>
<html lang="en" data-market="us" data-locale="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="author" content="Taploe">
  <meta name="theme-color" content="#ffffff">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="en-US" href="${url}">
  <link rel="alternate" hreflang="x-default" href="${url}">
  <link rel="icon" type="image/webp" href="/assets/images/favicon.webp">
  <link rel="apple-touch-icon" href="/assets/images/favicon.webp">
  <meta property="og:locale" content="en_US">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="Taploe">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}${image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}${image}">
  <script type="application/ld+json">
${json(ld)}
  </script>
  <link rel="stylesheet" href="/style.css">
</head>
<body class="blog-page">
  <a class="skip-link" href="#contenido">Skip to content</a>
${header.replace('<a href="/blog/">Blog</a>', '<a href="/blog/" aria-current="page">Blog</a>')}`;

const tail = (extraScripts = '') => `
${footer}
  <script src="/ecommerce-config.js"></script>
  <script src="/cart.js"></script>
  <script src="/quote-requests.js"></script>
  <script src="/site.js"></script>
  <script src="/blog/blog.js"></script>${extraScripts}
</body>
</html>
`;

const org = { '@type': 'Organization', '@id': `${SITE}/#organization`, name: 'Taploe', url: `${SITE}/`, logo: { '@type': 'ImageObject', url: `${SITE}/assets/images/taploe-logo.webp` } };

const card = (p, { lazy = true } = {}) => `<article class="blog-tile" data-category="${p.category}" data-search="${esc(`${strip(p.title)} ${p.excerpt} ${p.categoryLabel}`.toLowerCase())}">
          <a class="blog-tile__media" href="/blog/${p.slug}.html" tabindex="-1" aria-hidden="true"><img src="${p.img}" alt="" ${lazy ? 'loading="lazy" ' : ''}width="700" height="438"></a>
          <div class="blog-tile__body">
            <span class="blog-eyebrow">${esc(p.categoryLabel)}</span>
            <h3><a href="/blog/${p.slug}.html">${p.title}</a></h3>
            <p>${esc(p.excerpt)}</p>
            <span class="blog-meta">${icon.bolt}${p.readTime} min read<span aria-hidden="true">·</span><time datetime="${p.date}">${fmtDate(p.date)}</time></span>
          </div>
        </article>`;

const giftBand = `<section class="blog-gift" aria-label="2026 promotion">
      <div class="container blog-gift__inner">
        <span class="blog-gift__icon">${icon.gift}</span>
        <div><strong>+1 free card on every order through 2026.</strong><span>Order any Taploe card and we’ll ship an extra one at no cost, set up and ready to use.</span></div>
        <a class="button button-primary" href="/catalog.html">Shop cards <span aria-hidden="true">→</span></a>
      </div>
    </section>`;

// ---------- index ----------
const buildIndex = () => {
  const [featured, ...rest] = posts;
  const trending = rest.slice(0, 3);
  const counts = Object.fromEntries(Object.keys(CATEGORIES).map((k) => [k, posts.filter((p) => p.category === k).length]));
  const url = `${SITE}/blog/`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      org,
      { '@type': 'Blog', '@id': `${url}#blog`, url, name: 'The Taploe Blog', description: 'News and guides on Google reviews, local SEO, NFC business cards and social media for small businesses.', publisher: { '@id': `${SITE}/#organization` }, inLanguage: 'en-US',
        blogPost: posts.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: strip(p.title), url: `${SITE}/blog/${p.slug}.html`, datePublished: p.date, image: `${SITE}${p.img}` })) },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Blog', item: url }] }
    ]
  };
  const html = `${head({ title: 'Taploe Blog | Reviews, Local SEO and NFC Business Card Guides', description: 'News and practical guides for small businesses: get more Google reviews, rank on Google Maps, grow on social media and share your contact with NFC.', url, image: featured.img, type: 'website', ld })}
  <main id="contenido">
    <section class="blog-hero">
      <div class="container">
        <div class="blog-hero__copy">
          <span class="blog-kicker">The Taploe Blog</span>
          <h1>News and guides to grow your local business<span class="accent">.</span></h1>
          <p>Reviews, Google Maps, social media and smart business cards, explained in plain English. New articles every week.</p>
        </div>
        <a class="blog-feature" href="/blog/${featured.slug}.html">
          <span class="blog-feature__media"><img src="${featured.img}" alt="${esc(featured.imageAlt)}" width="1400" height="875" fetchpriority="high"></span>
          <span class="blog-feature__body">
            <span class="blog-feature__tags"><span class="blog-eyebrow">${esc(featured.categoryLabel)}</span><span class="blog-badge">Latest</span></span>
            <strong>${featured.title}</strong>
            <span class="blog-feature__excerpt">${esc(clip(strip(featured.intro), 210))}</span>
            <span class="blog-meta">${icon.bolt}${featured.readTime} min read<span aria-hidden="true">·</span><time datetime="${featured.date}">${fmtDate(featured.date)}</time></span>
          </span>
        </a>
        <div class="blog-trending" aria-label="Trending articles">
${trending.map((p, i) => `          <a class="blog-trending__item" href="/blog/${p.slug}.html">
            <span class="blog-trending__num">0${i + 1}</span>
            <img src="${p.img}" alt="" width="160" height="100">
            <span><span class="blog-eyebrow">${esc(p.categoryLabel)}</span><strong>${p.title}</strong></span>
          </a>`).join('\n')}
        </div>
      </div>
    </section>

    <section class="blog-library" id="articles">
      <div class="container">
        <div class="blog-library__head">
          <h2>All articles <span class="blog-count" data-blog-count>${posts.length}</span></h2>
          <label class="blog-search">${icon.search}<span class="sr-only">Search articles</span><input type="search" placeholder="Search articles…" data-blog-search></label>
        </div>
        <div class="blog-chips" role="toolbar" aria-label="Filter by topic">
          <button type="button" class="blog-chip is-active" data-blog-filter="all" aria-pressed="true">All</button>
${Object.entries(CATEGORIES).map(([k, v]) => `          <button type="button" class="blog-chip" data-blog-filter="${k}" aria-pressed="false">${esc(v)} <small>${counts[k]}</small></button>`).join('\n')}
        </div>
        <div class="blog-tiles" data-blog-grid>
        ${posts.map((p) => card(p)).join('\n        ')}
        </div>
        <p class="blog-empty" data-blog-empty hidden>No articles match your search. Try another word or topic.</p>
        <div class="blog-more"><button type="button" class="button button-secondary" data-blog-more>Load more articles</button></div>
      </div>
    </section>
    ${giftBand}
  </main>${tail()}`;
  fs.writeFileSync(path.join(root, 'blog/index.html'), html);
};

// ---------- post ----------
const related = (p) => {
  const same = posts.filter((o) => o.slug !== p.slug && o.category === p.category);
  const other = posts.filter((o) => o.slug !== p.slug && o.category !== p.category);
  return [...same, ...other].slice(0, 3);
};

const buildPost = (p) => {
  const url = `${SITE}/blog/${p.slug}.html`;
  const promo = promoFor(p);
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      org,
      { '@type': 'BlogPosting', '@id': `${url}#article`, headline: strip(p.title), description: p.description, image: `${SITE}${p.img}`, datePublished: p.date, dateModified: p.date, author: { '@id': `${SITE}/#organization` }, publisher: { '@id': `${SITE}/#organization` }, mainEntityOfPage: url, articleSection: p.categoryLabel, inLanguage: 'en-US' },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
        { '@type': 'ListItem', position: 3, name: strip(p.title), item: url }
      ] },
      ...(p.faq?.length ? [{ '@type': 'FAQPage', mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: strip(f.q), acceptedAnswer: { '@type': 'Answer', text: strip(f.a) } })) }] : [])
    ]
  };
  const shareText = encodeURIComponent(strip(p.title));
  const shareUrl = encodeURIComponent(url);
  const html = `${head({ title: p.metaTitle, description: p.description, url, image: p.img, type: 'article', ld })}
  <div class="blog-progress" aria-hidden="true"><span data-blog-progress></span></div>
  <main id="contenido">
    <article class="blog-article">
      <header class="container blog-article__header">
        <nav class="blog-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog/">Blog</a><span aria-hidden="true">/</span><a href="/blog/?topic=${p.category}#articles">${esc(p.categoryLabel)}</a></nav>
        <span class="blog-eyebrow">${esc(p.categoryLabel)}</span>
        <h1>${p.title}</h1>
        <p class="blog-article__intro">${p.intro}</p>
        <div class="blog-article__byline">
          <span class="blog-author"><img src="/assets/images/favicon.webp" alt="" width="36" height="36"><span><strong>Taploe Team</strong><small><time datetime="${p.date}">${fmtDate(p.date)}</time> · ${p.readTime} min read</small></span></span>
          <span class="blog-share" aria-label="Share this article">
            <button type="button" data-copy-link aria-label="Copy link">${icon.link}<span data-copy-label>Copy link</span></button>
            <a href="https://x.com/intent/post?text=${shareText}&amp;url=${shareUrl}" target="_blank" rel="noopener" aria-label="Share on X">${icon.x}</a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" rel="noopener" aria-label="Share on LinkedIn">${icon.linkedin}</a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener" aria-label="Share on Facebook">${icon.facebook}</a>
          </span>
        </div>
      </header>
      <figure class="container blog-article__cover"><img src="${p.img}" alt="${esc(p.imageAlt)}" width="1400" height="875" fetchpriority="high"></figure>
      <div class="container blog-article__layout">
        <div class="blog-article__main">
          <div class="blog-prose">
${p.body}
          </div>
${p.sources?.length ? `          <aside class="blog-sources"><h2>Sources</h2><ul>${p.sources.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul></aside>\n` : ''}${p.faq?.length ? `          <section class="blog-faq"><h2>Frequently asked questions</h2>${p.faq.map((f) => `<details class="faq-item"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('')}</section>\n` : ''}          <aside class="blog-cta">
            <img src="${promo.img}" alt="${esc(promo.name)}" width="200" height="200" loading="lazy">
            <div><span class="blog-eyebrow">Put this into practice</span><h2>${esc(promo.name)}</h2><p>${esc(promo.copy)} One-time payment, free shipping, and <strong>+1 free card on every order through 2026</strong>.</p><a class="button button-primary" href="${promo.href}">View product <span aria-hidden="true">→</span></a></div>
          </aside>
        </div>
        <aside class="blog-article__side">
          ${p.toc.length > 1 ? `<nav class="blog-toc" aria-label="Table of contents"><strong>In this article</strong><ol>${p.toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol></nav>` : ''}
          <a class="blog-side-promo" href="${promo.href}">
            <img src="${promo.img}" alt="" width="240" height="240" loading="lazy">
            <span class="blog-badge">+1 free in 2026</span>
            <strong>${esc(promo.name)}</strong>
            <span>${esc(promo.copy)}</span>
            <span class="blog-side-promo__link">Shop now ${icon.arrow}</span>
          </a>
        </aside>
      </div>
    </article>
    <section class="blog-related">
      <div class="container">
        <div class="blog-library__head"><h2>Keep reading</h2><a class="blog-link" href="/blog/">All articles ${icon.arrow}</a></div>
        <div class="blog-tiles">
        ${related(p).map((r) => card(r)).join('\n        ')}
        </div>
      </div>
    </section>
  </main>${tail()}`;
  fs.writeFileSync(path.join(root, `blog/${p.slug}.html`), html);
};

// ---------- sitemap ----------
const updateSitemap = () => {
  const file = path.join(root, 'sitemap.xml');
  let xml = fs.readFileSync(file, 'utf8');
  xml = xml.replace(/\s*<url>\s*<loc>https:\/\/www\.taploe\.com\/blog\/[^<]+\.html<\/loc>[\s\S]*?<\/url>/g, '');
  const entries = posts.map((p) => `
  <url>
    <loc>${SITE}/blog/${p.slug}.html</loc>
    <lastmod>${p.date}</lastmod>
    <xhtml:link rel="alternate" hreflang="en-US" href="${SITE}/blog/${p.slug}.html" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/blog/${p.slug}.html" />
  </url>`).join('');
  xml = xml.replace(/(<loc>https:\/\/www\.taploe\.com\/blog\/<\/loc>[\s\S]*?<\/url>)/, `$1${entries}`);
  fs.writeFileSync(file, xml);
};

buildIndex();
posts.forEach(buildPost);
updateSitemap();
console.log(`Built blog index + ${posts.length} posts.`);
