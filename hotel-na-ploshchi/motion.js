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
  var canST = !!(G && ST);
  var animate = !reduced && canST;   // появи, шторки, паралакс, Lenis — поважають «зменшити рух» у системі
  // scroll-відео — рішення власника 29.09 «Відео грає завжди»: рухається лише від прокрутки самої людини, тож працює і при reduced motion
  // ?debug=1 — рядок діагностики внизу екрана: чому відео не грає
  var dbg = /[?&]debug=1/.test(location.search) ? document.createElement('div') : null;
  function log(m) { if (!dbg) return; dbg.textContent = m; }
  if (dbg) { dbg.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;background:#1C2B39;color:#fff;font:12px/1.4 monospace;padding:6px 8px;max-width:90vw';
    document.body.appendChild(dbg);
    log('reduced: ' + (window.MS && window.MS.reduced ? 'так' : 'ні') + ' | force: ' + (force ? 'так' : 'ні') + ' | mobile: ' + (mobile ? 'так' : 'ні') +
        ' | gsap: ' + (G ? 'так' : 'ні') + ' | st: ' + (ST ? 'так' : 'ні') + ' | мережа: ' + ((navigator.connection || {}).effectiveType || '?') + ' | ' + navigator.userAgent.slice(0, 60));
    window.addEventListener('error', function (e) { dbg.textContent += ' | помилка: ' + e.message; }); }
  if (canST) { G.registerPlugin(ST); ST.config({ ignoreMobileResize: true }); }
  if (animate) document.documentElement.classList.add('js-motion');

  // ---------- scroll-відео ----------
  var svs = document.querySelectorAll('[data-sv]');
  var base = (document.querySelector('meta[name="hp-assets"]') || {}).content || '../assets/hp/';
  if (svs.length) fetch(base + 'video/manifest.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    .then(function (man) { svs.forEach(function (box) { setupVideo(box, man[box.getAttribute('data-sv')]); }); if (canST) ST.refresh(); });

  // Scroll-відео як <video> (рішення власника 29.09): MP4 з частими ключовими кадрами, час ролика прив'язаний до прокрутки.
  // ПК — 1920×1080, телефон — вертикальна версія 608×1080. До завантаження — фото.
  function setupVideo(box, m) {
    if (!m || !m.video) return;
    var v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.className = 'sv__cv sv__vid';
    var url = base + (mobile ? m.video.m.src : m.video.d.src);
    var want = 0, shown = 0, raf = 0, dur = 0, ok = false;
    function show() {
      if (ok) return; ok = true; dur = v.duration || 0; box.classList.add('sv--on');
      // iOS: без одного play() кадри при перемотці можуть не малюватися
      var p = v.play(); if (p && p.then) p.then(function () { v.pause(); v.currentTime = shown; }).catch(function () {}); else v.pause();
    }
    v.addEventListener('loadeddata', show);
    function tick() {
      raf = 0; if (!ok || !dur) return;
      var d = want - shown, step = 3 / 24;
      shown = Math.abs(d) < .005 ? want : shown + Math.max(-step, Math.min(step, d * .25));   // плавно, не більше 3 кадрів за такт
      if (!v.seeking && Math.abs(v.currentTime - shown) > .01) v.currentTime = shown;
      box.setAttribute('data-frame', Math.round(shown * 24));
      if (shown !== want || v.seeking) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }
    v.addEventListener('seeked', kick);
    var load = function () { if (!v.src) { v.src = url; box.appendChild(v); v.load(); } };
    var atTop0 = box.getBoundingClientRect().top < window.innerHeight * 1.5;
    if (atTop0 || !('IntersectionObserver' in window)) load();
    else { var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { load(); io.disconnect(); } }, { rootMargin: '1500px 0px' }); io.observe(box); }
    if (!canST || slow) return;
    var target = box.closest('[data-sv-pin-target]') || box;
    var pin = !mobile && desktop && box.hasAttribute('data-sv-pin');
    var atTop = target.getBoundingClientRect().top + window.scrollY < window.innerHeight * .5;
    ST.create({
      trigger: target, start: pin || atTop ? 'top top' : 'top bottom',
      end: pin ? (target.classList.contains('hero-pin') ? '+=150%' : '+=130%') : function () { return Math.min(ST.maxScroll(window), target.getBoundingClientRect().bottom + window.scrollY); },
      pin: pin ? target : false, pinSpacing: true, scrub: true, anticipatePin: 1,
      onUpdate: function (st) { if (!dur && v.duration) dur = v.duration; want = st.progress * Math.max(0, (dur || 0) - .05); kick(); }
    });
  }

  // (попередній варіант — кадри WebP на canvas; не використовується)
  function setup(box, seq) {
    if (!seq) return;                                              // роліка немає — лишається фото
    var s = (mobile && seq['9x16']) || seq['16x9'];
    if (!s || !s.count) return;
    var n = s.count, bm = new Array(n), cur = -1, want = 0, shown = 0, raf = 0, isReady = false;
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    cv.className = 'sv__cv'; cv.setAttribute('aria-hidden', 'true');
    function src(i) { return base + 'scroll/' + s.path + ('000' + (i + 1)).slice(-4) + '.' + (s.ext || 'webp'); }
    // кадри зберігаються стиснутими (Image, ~50 КБ); розкодовуються лише кілька наступних — без ImageBitmap для всіх кадрів
    // (120 розкодованих кадрів ≈ 160–200 МБ на ролик: реальні пристрої вивантажують пам'ять → ривки або статичний кадр)
    function load(i, done) {
      if (bm[i] !== undefined) { if (done) done(); return; }
      bm[i] = null;
      var im = new Image(); im.decoding = 'async';
      im.onload = function () { bm[i] = im; if (i < 16 && im.decode) { im._w = 1; im.decode().catch(function () {}); } if (i === 0) ready(); kick(); if (done) done(); };   // перші 16 кадрів — розкодовуються одразу
      im.onerror = function () { if (done) done(); };
      im.src = src(i);
    }
    function warm(i) { for (var j = Math.max(0, i - 10); j < i + 10 && j < n; j++) if (bm[j] && bm[j].decode && !bm[j]._w) { bm[j]._w = 1; bm[j].decode().catch(function () {}); } }   // вікно ±10 кадрів
    function nearest(i) {                                           // найближчий уже готовий кадр — без порожніх кадрів
      for (var d = 0; d < n; d++) { if (bm[i - d]) return i - d; if (bm[i + d]) return i + d; }
      return -1;
    }
    function put(b, a) {
      var bw = b.width || b.naturalWidth, bh = b.height || b.naturalHeight;
      var cw = cv.width, ch = cv.height, k = Math.max(cw / bw, ch / bh), w = bw * k, h = bh * k;
      ctx.globalAlpha = a; ctx.drawImage(b, (cw - w) / 2, (ch - h) / 2, w, h); ctx.globalAlpha = 1;
    }
    // x — дробова позиція в ролику: кадр floor(x) і плавне перетікання в наступний (кадрів мало через ліміт 6 МБ — без цього рух «сходинками»)
    function draw(x) {
      var i = nearest(Math.floor(x)); if (i < 0) return;
      put(bm[i], 1);
      var f = x - Math.floor(x), j = Math.floor(x) + 1;
      if (i === Math.floor(x) && f > .02 && bm[j]) put(bm[j], f);
      cur = x; box.setAttribute('data-frame', Math.round(x)); warm(Math.floor(x) + 1);
      if (dbg && box.getAttribute('data-sv') === 'hero') { var k = 0; for (var q2 = 0; q2 < n; q2++) if (bm[q2]) k++; dbg.setAttribute('data-hero', ' | hero кадр ' + Math.round(x) + '/' + (n - 1) + ', завантажено ' + k); dbg.textContent = dbg.textContent.split(' | hero')[0] + dbg.getAttribute('data-hero'); }
    }
    // плавне «доганяння»: при різкому стрибку прокрутки кадри програються послідовно за кілька кадрів анімації
    var top = 0;   // останній кадр, до якого всі попередні вже завантажені
    function tick() {
      raf = 0;
      while (top + 1 < n && bm[top + 1]) top++;
      var goal = Math.min(want, top);          // поки кадри вантажаться — не перескакуємо, а плавно доганяємо
      var d = goal - shown;
      if (Math.abs(d) < .01) shown = goal;
      else shown += Math.max(-3, Math.min(3, d * .2));                // не більше 3 кадрів за такт, з плавним сповільненням
      if (shown !== cur) draw(shown);
      if (shown !== want) raf = requestAnimationFrame(tick);   // крутиться, доки не наздоженемо want (кадри довантажуються)
    }
    function kick() { if (!raf && isReady) raf = requestAnimationFrame(tick); }
    // canvas перевизначається лише при реальній зміні розміру блока: на iPhone адресний рядок під час прокрутки
    // шле resize десятки разів — перевиділення canvas очищує кадр і дає ривки
    var lastW = 0, lastH = 0;
    function size() {
      var r = box.getBoundingClientRect(), d = 1;   // кадри 960/432 px — вища щільність canvas лише множить пікселі без якості
      var w = Math.round(r.width * d), h = Math.round(r.height * d);
      if (Math.abs(w - lastW) < 3 && Math.abs(h - lastH) < 3) return;
      lastW = w; lastH = h; cv.width = w; cv.height = h; var c = cur; cur = -1; draw(c < 0 ? 0 : c);
    }
    // постер: перший кадр; фото ховається лише коли кадр готовий
    function ready() { if (isReady) return; isReady = true; box.appendChild(cv); box.classList.add('sv--on'); size(); }
    load(0);
    window.addEventListener('resize', size);
    if (!canST || slow) { if (dbg) dbg.textContent += ' | ' + box.getAttribute('data-sv') + ': лише перший кадр (' + (!canST ? 'немає GSAP' : 'повільна мережа') + ')'; return; }

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
      // без pin: ролик закінчується, коли блок доходить до верху екрана або (біля кінця сторінки) до низу сторінки
      trigger: target, start: pin || atTop ? 'top top' : 'top bottom', end: pin ? (target.classList.contains('hero-pin') ? '+=90%' : '+=120%') : function () { return Math.min(ST.maxScroll(window), target.getBoundingClientRect().bottom + window.scrollY); },
      pin: pin ? target : false, pinSpacing: true, scrub: pin ? .6 : true, anticipatePin: 1,
      onUpdate: function (st) { want = Math.min(n - 1, st.progress * (n - 1)); kick(); }
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
    if (mobile) {                                                   // мобільний — полегшено: лише м'яка поява, без clip-path і масштабу
      G.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: .6, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
      return;
    }
    G.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, {
      clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
    var img = el.querySelector('img');
    if (img) G.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  // м'яка поява блоків (без «виїзду» кожного заголовка)
  G.utils.toArray('[data-fade]').forEach(function (el) {
    G.fromTo(el, { autoAlpha: 0, y: mobile ? 0 : 16 }, { autoAlpha: 1, y: 0, duration: mobile ? .6 : .9, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // легкий паралакс фото в герої (там, де немає scroll-відео)
  if (desktop) G.utils.toArray('[data-parallax]').forEach(function (img) {
    if (img.closest('[data-sv]')) return;              // під scroll-відео паралакс не потрібен
    G.fromTo(img, { yPercent: -4 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top top', end: 'bottom top', scrub: true } });
  });
})();
