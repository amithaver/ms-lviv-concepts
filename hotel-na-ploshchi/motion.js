/* Рух «Готель на площі Ринок» — помірно, рівень європейського готельного сайту.
   Lenis (плавна прокрутка, лише десктоп) · GSAP ScrollTrigger: шторка на фото, м'яка поява блоків, легкий паралакс героя.
   Scroll-відео: кадри WebP на canvas, кадр прив'язаний до прокрутки (scrub), на десктопі секція закріплена (pin) на час
   програвання, прокрутка вгору — ролик назад. Перший кадр — одразу як постер, решта — ліниво; до завантаження — фото.
   prefers-reduced-motion і повільне з'єднання — лише статичний перший кадр. Мобільний — вертикальні кадри 9:16, без pin. */
(function () {
  // ?motion=on — примусово ввімкнути рух для показу (ігнорує reduced motion і повільну мережу)
  var force = /[?&]motion=on/.test(location.search);
  try { if (force) sessionStorage.setItem('hpMotion', '1'); else force = sessionStorage.getItem('hpMotion') === '1'; } catch (e) {}
  var reduced = !force && window.MS && window.MS.reduced;
  var mobile = window.matchMedia('(max-width: 760px)').matches;
  var desktop = window.matchMedia('(min-width: 1025px) and (pointer: fine)').matches;
  var conn = navigator.connection || {};
  var slow = !force && (!!conn.saveData || /2g/.test(conn.effectiveType || ''));   // лише економія трафіку або 2g: «3g» Chrome часто показує помилково
  var G = window.gsap, ST = window.ScrollTrigger;
  var animate = !reduced && G && ST;
  if (animate) { G.registerPlugin(ST); document.documentElement.classList.add('js-motion'); }

  // ---------- scroll-відео ----------
  var svs = document.querySelectorAll('[data-sv]');
  var base = (document.querySelector('meta[name="hp-assets"]') || {}).content || '../assets/hp/';
  if (svs.length) fetch(base + 'scroll/manifest.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    .then(function (man) { svs.forEach(function (box) { setup(box, man[box.getAttribute('data-sv')]); }); if (animate) ST.refresh(); });

  function setup(box, seq) {
    if (!seq) return;                                              // роліка немає — лишається фото
    var s = (mobile && seq['9x16']) || seq['16x9'];
    if (!s || !s.count) return;
    var n = s.count, bm = new Array(n), cur = -1, want = 0, shown = 0, raf = 0, isReady = false;
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    cv.className = 'sv__cv'; cv.setAttribute('aria-hidden', 'true');
    function src(i) { return base + 'scroll/' + s.path + ('000' + (i + 1)).slice(-4) + '.' + (s.ext || 'webp'); }
    // кадр декодується заздалегідь (ImageBitmap) — на телефоні відмальовка без ривків через декодування «на льоту»
    function load(i, done) {
      if (bm[i] !== undefined) { if (done) done(); return; }
      bm[i] = null;
      var im = new Image(); im.src = src(i);
      var dec = im.decode ? im.decode() : new Promise(function (res, rej) { im.onload = res; im.onerror = rej; });
      dec.then(function () { return window.createImageBitmap ? window.createImageBitmap(im) : im; })
        .then(function (b) { bm[i] = b; if (i === 0) ready(); kick(); })
        .catch(function () {})
        .then(function () { if (done) done(); });
    }
    function nearest(i) {                                           // найближчий уже готовий кадр — без порожніх кадрів
      for (var d = 0; d < n; d++) { if (bm[i - d]) return i - d; if (bm[i + d]) return i + d; }
      return -1;
    }
    function draw(i) {
      var b = bm[i]; if (!b) return;
      var bw = b.width || b.naturalWidth, bh = b.height || b.naturalHeight;
      var cw = cv.width, ch = cv.height, k = Math.max(cw / bw, ch / bh), w = bw * k, h = bh * k;
      ctx.drawImage(b, (cw - w) / 2, (ch - h) / 2, w, h); cur = i; box.setAttribute('data-frame', i);
    }
    // плавне «доганяння»: при різкому стрибку прокрутки кадри програються послідовно за кілька кадрів анімації
    function tick() {
      raf = 0;
      var d = want - shown;
      if (d) shown += (d > 0 ? 1 : -1) * Math.min(3, Math.max(1, Math.round(Math.abs(d) * .22)));   // не більше 3 кадрів за такт
      var i = nearest(shown); if (i >= 0 && i !== cur) draw(i);
      if (shown !== want) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && isReady) raf = requestAnimationFrame(tick); }
    function size() {
      var r = box.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); var c = cur; cur = -1; draw(c < 0 ? 0 : c);
    }
    // постер: перший кадр; фото ховається лише коли кадр готовий
    function ready() { if (isReady) return; isReady = true; box.appendChild(cv); box.classList.add('sv--on'); size(); }
    load(0);
    window.addEventListener('resize', size);
    if (!animate || slow) return;                                   // reduced motion / повільна мережа — лише перший кадр

    // решта кадрів — послідовно від початку ролика (до 6 паралельно), коли секція наближається
    var started = false, q = 1, inflight = 0;
    function pump() { while (inflight < 6 && q < n) { inflight++; load(q++, function () { inflight--; pump(); }); } }
    var go = function () { if (!started) { started = true; pump(); } };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { go(); io.disconnect(); } }, { rootMargin: '1500px 0px' });
      io.observe(box);
    } else go();

    var target = box.closest('[data-sv-pin-target]') || box;
    var pin = !mobile && desktop && box.hasAttribute('data-sv-pin');
    var atTop = target.getBoundingClientRect().top + window.scrollY < window.innerHeight * .5;   // блок у першому екрані (герой)
    ST.create({
      trigger: target, start: pin || atTop ? 'top top' : 'top bottom', end: pin ? (target.classList.contains('hero-pin') ? '+=90%' : '+=120%') : 'bottom top',
      pin: pin ? target : false, pinSpacing: true, scrub: pin ? .6 : true, anticipatePin: 1,
      onUpdate: function (st) { want = Math.min(n - 1, Math.round(st.progress * (n - 1))); kick(); }
    });
  }

  if (!animate) return;

  // плавна прокрутка
  if (desktop && window.Lenis) {
    var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    window.HP_LENIS = lenis;
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var el = document.querySelector(id); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: -96 });
      });
    });
    new MutationObserver(function () {
      document.documentElement.classList.contains('modal-open') ? lenis.stop() : lenis.start();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  // шторка: фото розкривається знизу вгору
  G.utils.toArray('[data-curtain]').forEach(function (el) {
    G.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, {
      clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
    var img = el.querySelector('img');
    if (img) G.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  // м'яка поява блоків (без «виїзду» кожного заголовка)
  G.utils.toArray('[data-fade]').forEach(function (el) {
    G.fromTo(el, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // легкий паралакс фото в герої (там, де немає scroll-відео)
  if (desktop) G.utils.toArray('[data-parallax]').forEach(function (img) {
    if (img.closest('[data-sv]')) return;              // під scroll-відео паралакс не потрібен
    G.fromTo(img, { yPercent: -4 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top top', end: 'bottom top', scrub: true } });
  });
})();
