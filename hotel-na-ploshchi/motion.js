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
    var n = s.count, frames = new Array(n), cur = 0, want = 0, raf = 0;
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    cv.className = 'sv__cv'; cv.setAttribute('aria-hidden', 'true');
    function src(i) { return base + 'scroll/' + s.path + ('000' + (i + 1)).slice(-4) + '.' + (s.ext || 'webp'); }
    function load(i) {
      if (frames[i]) return frames[i];
      var im = new Image(); im.decoding = 'async'; frames[i] = im;
      im.onload = function () { im._ok = true; if (i === want || Math.abs(i - want) < Math.abs(cur - want)) paint(); };
      im.src = src(i); return im;
    }
    function nearest(i) {                                           // найближчий уже завантажений кадр — без порожніх кадрів
      for (var d = 0; d < n; d++) { if (frames[i - d] && frames[i - d]._ok) return i - d; if (frames[i + d] && frames[i + d]._ok) return i + d; }
      return -1;
    }
    function draw(i) {
      var im = frames[i]; if (!im || !im._ok) return;
      var cw = cv.width, ch = cv.height, k = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
      var w = im.naturalWidth * k, h = im.naturalHeight * k;
      ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h); cur = i; box.setAttribute('data-frame', i);
    }
    function paint() { raf = 0; var i = nearest(want); if (i >= 0) draw(i); }
    function size() {
      var r = box.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); paint();
    }
    // постер: перший кадр; фото ховається лише коли кадр готовий
    var poster = load(0);
    var ready = function () { box.appendChild(cv); box.classList.add('sv--on'); size(); };
    if (poster._ok) ready(); else poster.addEventListener('load', ready);
    window.addEventListener('resize', size);
    if (!animate || slow) return;                                   // reduced motion / повільна мережа — лише перший кадр

    // ліниве завантаження решти кадрів, коли секція наближається
    var started = false;
    var go = function () {
      if (started) return; started = true;
      var i = 1; (function next() { var end = Math.min(n, i + 12); for (; i < end; i++) load(i); if (i < n) setTimeout(next, 60); })();
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { go(); io.disconnect(); } }, { rootMargin: '1200px 0px' });
      io.observe(box);
    } else go();

    var target = box.closest('[data-sv-pin-target]') || box;
    var pin = !mobile && desktop && box.hasAttribute('data-sv-pin');
    var atTop = target.getBoundingClientRect().top + window.scrollY < window.innerHeight * .5;   // блок у першому екрані (герой)
    ST.create({
      trigger: target, start: pin || atTop ? 'top top' : 'top bottom', end: pin ? (target.classList.contains('hero-pin') ? '+=90%' : '+=120%') : 'bottom top',
      pin: pin ? target : false, pinSpacing: true, scrub: pin ? .6 : .4, anticipatePin: 1,
      onUpdate: function (st) { want = Math.min(n - 1, Math.round(st.progress * (n - 1))); if (!raf) raf = requestAnimationFrame(paint); }
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
