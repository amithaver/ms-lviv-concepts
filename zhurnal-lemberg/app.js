/* Концепт «Журнал Lemberg»: шапка над обкладинкою, мастхед на всю ширину, превʼю змісту, каталог номерів, «перегортання» розворотів. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement, hdr = $('#hdr');
  var RM = window.MS ? MS.reduced : matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = !RM && window.gsap;
  var cover = $('#cover');

  function setBp() {
    var w = innerWidth; root.classList.remove('m', 't', 'd');
    root.classList.add(w < 760 ? 'm' : (w < 1180 ? 't' : 'd'));
    root.style.setProperty('--vh', innerHeight + 'px');
  }
  var isM = function () { return root.classList.contains('m'); };

  /* мастхед «MARKET SQUARE» — друкарський заголовок журналу на всю ширину колонки (не логотип) */
  function fit() {
    $$('.masthead [data-fit]').forEach(function (el) {
      if (!el.offsetParent) return;
      el.style.fontSize = '';
      var box = el.parentNode.getBoundingClientRect().width;
      var w = el.getBoundingClientRect().width;
      if (w > 0) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * box / w * 0.995) + 'px';
    });
  }

  /* шапка: прозора над обкладинкою (білі логотипи), біла — далі */
  function hdrState() {
    var on = !!cover && window.scrollY < cover.offsetHeight - 80;
    hdr.classList.toggle('oncover', on);
    hdr.classList.toggle('solid', !on);
    if (window.MS && MS.setLogos) MS.setLogos(on);
  }

  /* зміст: наведення показує фото рубрики */
  $$('.toc').forEach(function (t) {
    var img = $('[data-pv-img]', t); if (!img) return;
    $$('a[data-pv]', t).forEach(function (a) {
      var show = function () {
        var src = a.getAttribute('data-pv'); if (!src || img.getAttribute('src') === src) return;
        if (RM) { img.src = src; return; }
        img.style.opacity = 0; setTimeout(function () { img.onload = function () { img.style.opacity = 1; }; img.src = src; }, 160);
      };
      a.addEventListener('mouseenter', show); a.addEventListener('focus', show);
    });
  });

  /* каталог номерів: фото зліва змінюється за рядком */
  var cat = $('[data-cat]');
  if (cat) {
    var imgs = $$('[data-cat-ph] img'), cap = $('[data-cat-cap]'), rows = $$('li', cat);
    var set = function (i) {
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
      rows.forEach(function (l, k) { l.classList.toggle('on', k === i); });
      if (cap) cap.textContent = $('.nm', rows[i]).textContent;
    };
    rows.forEach(function (l, i) {
      l.addEventListener('mouseenter', function () { set(i); });
      l.addEventListener('focusin', function () { set(i); });
    });
  }

  /* перегортання між розділами: поворот rotateY на десктопі, зсув на мобільному; без анімації при reduced motion */
  if (G && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var el = e.target, f = $('.fold', el);
        if (isM()) { gsap.fromTo(el, { y: 28 }, { y: 0, duration: .6, ease: 'power2.out', clearProps: 'transform' }); return; }
        gsap.fromTo(el, { rotationY: -18, transformPerspective: 2200 }, { rotationY: 0, duration: .8, ease: 'power2.out', clearProps: 'transform' });
        if (f) gsap.fromTo(f, { opacity: .2 }, { opacity: 0, duration: .8, ease: 'power2.out' });
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    $$('.flip').forEach(function (el) { if (el.getBoundingClientRect().top > innerHeight * .9) io.observe(el); });
  }

  setBp(); fit(); hdrState();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('scroll', function () { requestAnimationFrame(hdrState); }, { passive: true });
  var rT; window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { setBp(); fit(); hdrState(); }, 120); });
})();
