/* «Ключ від номера»: двері першого екрана, бирки, поверхи, конверти, цитата, перехід «двері». Анімуються лише transform, opacity, clip-path, stroke-dashoffset. */
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  if (G && ST) G.registerPlugin(ST);
  var anim = !reduced && !!(G && ST);
  if (!anim) root.classList.remove('kv-anim');

  function pct(a, b) { return Math.max(0, Math.min(100, a / b * 100)).toFixed(3) + '%'; }

  // ---------- перший екран: ключ → двері → фото → бронювання ----------
  var hero = document.querySelector('[data-kv-hero]');
  if (hero && anim) {
    var photo = hero.querySelector('.kv-hero__photo');
    var opening = hero.querySelector('.kv-door-open');
    var key = hero.querySelector('[data-kv-key]');
    var over = hero.querySelectorAll('.kv-hero__over, .kv-hero__cue');
    var title = hero.querySelector('.kv-hero__title'), sub = hero.querySelector('.kv-hero__sub'), panel = hero.querySelector('.kv-hero__panel');
    // вирізка фото рахується на кожному кадрі з живих координат проєму: 0 — щілина між стулками, 1 — увесь проєм, 2 — весь екран
    var st = { p: 0 };
    var lerp = function (a, b, t) { return a + (b - a) * t; };
    var paint = function () {
      var s = photo.getBoundingClientRect(), o = opening.getBoundingClientRect();
      var top = o.top - s.top, bot = s.bottom - o.bottom, l = o.left - s.left, r = s.right - o.right;
      var c = o.left + o.width / 2 - s.left, p = st.p, T, R, Bt, L;
      if (p <= 1) { T = top; Bt = bot; L = lerp(c, l, p); R = lerp(s.width - c, r, p); }
      else { var q = p - 1; T = lerp(top, 0, q); Bt = lerp(bot, 0, q); L = lerp(l, 0, q); R = lerp(r, 0, q); }
      photo.style.clipPath = 'inset(' + pct(T, s.height) + ' ' + pct(R, s.width) + ' ' + pct(Bt, s.height) + ' ' + pct(L, s.width) + ')';
    };
    var build = function () {
      var tl = G.timeline({ defaults: { ease: 'none' }, onUpdate: paint });
      tl.to(key, { rotation: 90, svgOrigin: '266 466', duration: 0.22, ease: 'power2.inOut' })
        .to(over, { autoAlpha: 0, duration: 0.12 }, '<0.1')
        .to(st, { p: 1, duration: 0.28, ease: 'power2.inOut' })
        .to(st, { p: 2, duration: 0.3, ease: 'power2.in' })
        .to(title, { y: 0, autoAlpha: 1, duration: 0.16 }, '-=0.08')
        .to(sub, { y: 0, autoAlpha: 1, duration: 0.12 }, '-=0.06');
      if (panel && getComputedStyle(panel).display !== 'none') tl.to(panel, { y: 0, autoAlpha: 1, duration: 0.14 });
      paint(); window.addEventListener('resize', paint);
      return tl;
    };
    var mm = G.matchMedia();
    mm.add('(min-width: 760px)', function () {
      var tl = build();
      ST.create({ trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.6, animation: tl, invalidateOnRefresh: true });
    });
    mm.add('(max-width: 759px)', function () {
      var tl = build().pause(); tl.duration(1.5);
      var go = function () { if (!tl.isActive() && tl.progress() === 0) tl.play(); };
      var onS = function () { if (window.scrollY > 4) { go(); window.removeEventListener('scroll', onS); } };
      window.addEventListener('scroll', onS, { passive: true });
      hero.addEventListener('click', go);
      return function () { window.removeEventListener('scroll', onS); };
    });
  }

  // ---------- бирки на гачках: розгойдування і вибір номера ----------
  function swing(el) {
    if (reduced || !el) return;
    el.classList.remove('is-swing'); void el.offsetWidth; el.classList.add('is-swing');
  }
  document.addEventListener('animationend', function (e) { if (e.target.classList) e.target.classList.remove('is-swing'); });
  var pegs = [].slice.call(document.querySelectorAll('.kv-peg'));
  function pick(btn) {
    pegs.forEach(function (b) {
      var on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var card = document.getElementById(b.getAttribute('aria-controls')); if (card) card.hidden = !on;
    });
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  var hoverable = window.matchMedia('(hover: hover)').matches;
  pegs.forEach(function (b) {
    b.addEventListener('mouseenter', function () { swing(b.querySelector('.kv-tag')); if (hoverable) pick(b); });
    b.addEventListener('focus', function () { swing(b.querySelector('.kv-tag')); });
    b.addEventListener('click', function () { pick(b); swing(b.querySelector('.kv-tag')); });
  });

  // ---------- ключниця: бирка «знімається», потім відкривається сторінка ----------
  document.querySelectorAll('.kv-mtag[href]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (reduced || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      e.preventDefault(); e.stopPropagation();
      a.classList.add('is-taken');
      setTimeout(function () { go(a.href); }, 320);
    });
  });

  // ---------- мобільна панель: лист із полями бронювання ----------
  var sheet = document.getElementById('kv-msheet');
  document.querySelectorAll('[data-action="sheet"]').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = sheet.hidden; sheet.hidden = !open;
      document.querySelectorAll('.kv-mbar__dates').forEach(function (x) { x.setAttribute('aria-expanded', open ? 'true' : 'false'); });
      if (open) { var f = sheet.querySelector('input'); if (f) f.focus({ preventScroll: true }); }
    });
  });

  // ---------- поверхи дому: підсвічування за прокруткою ----------
  var floors = [].slice.call(document.querySelectorAll('.kv-floor[data-floor]'));
  if (floors.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var f = en.target.getAttribute('data-floor');
        floors.forEach(function (x) { x.classList.toggle('is-on', x === en.target); });
        document.querySelectorAll('.kv-house .kv-fl').forEach(function (g) { g.classList.toggle('is-on', g.getAttribute('data-floor') === f); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    floors.forEach(function (f) { io.observe(f); });
  }

  // ---------- конверти ----------
  document.querySelectorAll('[data-env]').forEach(function (env) {
    var btn = env.querySelector('[data-action="envelope"]');
    if (!anim) { env.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    btn.addEventListener('click', function () {
      var open = !env.classList.contains('is-open');
      env.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (window.ScrollTrigger) setTimeout(function () { window.ScrollTrigger.refresh(); }, 650);
    });
  });
  if (anim && location.hash) {
    var t = document.getElementById(location.hash.slice(1));
    if (t && t.hasAttribute('data-env')) { t.classList.add('is-open'); t.querySelector('[data-action]').setAttribute('aria-expanded', 'true'); }
  }

  // ---------- рух: розкриття фото, цитата по словах ----------
  if (anim) {
    document.querySelectorAll('.kv-reveal').forEach(function (f) {
      G.fromTo(f, { clipPath: 'inset(12% 18% 12% 18%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: f, start: 'top 90%', end: 'top 35%', scrub: 0.5 } });
    });
    document.querySelectorAll('[data-words]').forEach(function (q) {
      q.innerHTML = q.textContent.split(/(\s+)/).map(function (w) { return /^\s+$/.test(w) ? w : '<span class="w">' + w + '</span>'; }).join('');
      G.fromTo(q.querySelectorAll('.w'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: 0.09, duration: 0.5, ease: 'power2.out', scrollTrigger: { trigger: q, start: 'top 78%' } });
    });
    document.querySelectorAll('.kv-phero__frame .kv-draw path, .kv-nf__door .kv-draw path').forEach(function (p, i) {
      G.fromTo(p, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, delay: 0.1 + i * 0.05, ease: 'power2.inOut' });
    });
  }

  // ---------- перехід між сторінками: двері зачиняються (0.35 с) і відчиняються (0.35 с) ----------
  var wipe = document.querySelector('.kv-wipe');
  function go(href) {
    if (!anim || !wipe) { location.href = href; return; }
    try { sessionStorage.setItem('kv-door', '1'); } catch (e) {}
    wipe.classList.add('is-shut');
    setTimeout(function () { location.href = href; }, 360);
  }
  if (root.classList.contains('kv-enter') && wipe) {
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      wipe.classList.add('is-shut'); root.classList.remove('kv-enter');
      requestAnimationFrame(function () { wipe.classList.remove('is-shut'); });
    }); });
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted && wipe) wipe.classList.remove('is-shut'); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === '_blank') return;
    var h = a.getAttribute('href');
    if (!/\.html(#.*)?$/.test(h) || /^https?:/.test(h)) return;
    if (a.pathname === location.pathname) return;
    e.preventDefault(); go(a.href);
  });
})();
