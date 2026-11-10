(() => {
  // ----- Blog index: topic chips, search, load more -----
  const grid = document.querySelector('[data-blog-grid]');
  if (grid) {
    const PAGE = 12;
    const tiles = [...grid.querySelectorAll('.blog-tile')];
    const chips = [...document.querySelectorAll('[data-blog-filter]')];
    const search = document.querySelector('[data-blog-search]');
    const more = document.querySelector('[data-blog-more]');
    const empty = document.querySelector('[data-blog-empty]');
    const count = document.querySelector('[data-blog-count]');
    let topic = 'all';
    let limit = PAGE;

    const params = new URLSearchParams(window.location.search);
    if (params.get('topic') && chips.some((c) => c.dataset.blogFilter === params.get('topic'))) topic = params.get('topic');

    const render = () => {
      const query = (search?.value || '').trim().toLowerCase();
      const matches = tiles.filter((tile) => (topic === 'all' || tile.dataset.category === topic) && (!query || tile.dataset.search.includes(query)));
      tiles.forEach((tile) => { tile.hidden = true; tile.classList.remove('is-in'); });
      matches.slice(0, limit).forEach((tile, i) => {
        tile.hidden = false;
        tile.style.setProperty('--i', String(i % PAGE));
        requestAnimationFrame(() => tile.classList.add('is-in'));
      });
      chips.forEach((chip) => {
        const active = chip.dataset.blogFilter === topic;
        chip.classList.toggle('is-active', active);
        chip.setAttribute('aria-pressed', String(active));
      });
      if (count) count.textContent = String(matches.length);
      if (empty) empty.hidden = matches.length > 0;
      if (more) more.parentElement.hidden = matches.length <= limit;
    };

    chips.forEach((chip) => chip.addEventListener('click', () => {
      topic = chip.dataset.blogFilter;
      limit = PAGE;
      const url = new URL(window.location.href);
      if (topic === 'all') url.searchParams.delete('topic'); else url.searchParams.set('topic', topic);
      history.replaceState(null, '', url);
      render();
    }));
    search?.addEventListener('input', () => { limit = PAGE; render(); });
    more?.addEventListener('click', () => { limit += PAGE; render(); });
    render();
  }

  // ----- Article: reading progress -----
  const bar = document.querySelector('[data-blog-progress]');
  const article = document.querySelector('.blog-article__main');
  if (bar && article) {
    const update = () => {
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(total, 1)));
      bar.style.transform = `scaleX(${progress})`;
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ----- Article: highlight current section in the table of contents -----
  const tocLinks = [...document.querySelectorAll('.blog-toc a')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((a) => a.classList.remove('is-active'));
        byId.get(entry.target.id)?.classList.add('is-active');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    byId.forEach((_link, id) => {
      const heading = document.getElementById(id);
      if (heading) observer.observe(heading);
    });
  }

  // ----- Article: copy link -----
  document.querySelectorAll('[data-copy-link]').forEach((button) => {
    button.addEventListener('click', async () => {
      const label = button.querySelector('[data-copy-label]');
      try {
        await navigator.clipboard.writeText(window.location.href.split('#')[0]);
        if (label) label.textContent = 'Copied!';
      } catch {
        if (label) label.textContent = 'Copy failed';
      }
      setTimeout(() => { if (label) label.textContent = 'Copy link'; }, 1800);
    });
  });
})();
