/* «Кам'яниця в розрізі»: поверхи на кресленні підсвічуються разом із підписами і списком, клік по поверху веде в розділ;
   креслення промальовується лінією при відкритті; на головній активний поверх змінюється з прокруткою. prefers-reduced-motion — статично. */
(function () {
  function scopeOf(el) { return el.closest('[data-xs]') ? el.closest('.hero__draw, .kr-menu__grid, [data-xs]') : null; }
  function mark(scope, f, on) {
    if (!scope) return;
    scope.querySelectorAll('[data-f]').forEach(function (n) { n.classList.toggle('is-hover', on && n.getAttribute('data-f') === f); });
  }
  // підсвічування: підпис / пункт списку / смуга поверху
  document.querySelectorAll('.hero__draw, .kr-menu__grid').forEach(function (scope) {
    scope.querySelectorAll('[data-f]').forEach(function (n) {
      var f = n.getAttribute('data-f');
      n.addEventListener('mouseenter', function () { mark(scope, f, true); });
      n.addEventListener('mouseleave', function () { mark(scope, f, false); });
      n.addEventListener('focus', function () { if (n.matches && n.matches(':focus-visible')) mark(scope, f, true); });
      n.addEventListener('blur', function () { mark(scope, f, false); });
    });
  });
  // клік по смузі поверху великого креслення
  document.querySelectorAll('.xs--big .xs__band[data-href], .kr-menu .xs__band[data-href]').forEach(function (b) {
    b.addEventListener('click', function () { location.href = b.getAttribute('data-href'); });
  });

  // головна: активний поверх креслення відповідає розділу на екрані
  var sections = document.querySelectorAll('section[data-floor]');
  var hero = document.querySelector('.hero .xs--big');
  if (hero && sections.length && 'IntersectionObserver' in window) {
    var setActive = function (f) {
      hero.querySelectorAll('.xs__band, .xs__lab').forEach(function (n) { n.classList.toggle('is-on', n.getAttribute('data-f') === f); });
    };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive(e.target.getAttribute('data-floor')); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  if (window.MS && window.MS.reduced) return;
  document.documentElement.classList.add('js-draw');
  document.querySelectorAll('.xs--big .xs__lab').forEach(function (l, i) { l.style.animationDelay = (0.9 + i * 0.12) + 's'; });

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('.plate, .spec, .oblock, .rcard, .tl__row, .srow, .st, .vault').forEach(function (el) {
    gsap.from(el, { opacity: 0, y: 24, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  // малі розрізи: активний поверх «наливається» при вході розділу
  gsap.utils.toArray('.sec .mini .xs__band.is-on, .phead .mini .xs__band.is-on').forEach(function (b) {
    gsap.from(b, { opacity: 0, duration: 0.8, delay: 0.2, scrollTrigger: { trigger: b.closest('.mini'), start: 'top 85%', once: true } });
  });
})();
