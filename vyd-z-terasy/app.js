/* «Вид з тераси»: панорама опускається від Ратуші до площі при прокрутці, мітки прорисовуються лінією,
   цитата з'являється по словах. prefers-reduced-motion — усе статично. */
(function () {
  // мобільна панорама відкривається на вежі Ратуші (працює і без анімацій)
  var sw = document.querySelector('.pano--swipe .pano__scroll');
  function centerPano() { if (!sw || sw.scrollWidth <= sw.clientWidth) return; var t = sw.querySelector('.pin'); var x = t ? t.offsetLeft : sw.scrollWidth / 2; sw.scrollLeft = Math.max(0, x - sw.clientWidth / 2); }
  // підписи міток не виходять за край екрана (лінія й точка лишаються на об'єкті)
  function clampPins() {
    var W = document.documentElement.clientWidth;
    document.querySelectorAll('.pin__label').forEach(function (l) {
      l.style.position = 'relative'; l.style.left = '0px';
      var r = l.getBoundingClientRect(), box = l.closest('.pano').getBoundingClientRect();
      var left = Math.max(8, box.left + 8), right = Math.min(W - 8, box.right - 8), dx = 0;
      if (r.left < left) dx = left - r.left; else if (r.right > right) dx = right - r.right;
      if (dx) l.style.left = Math.round(dx) + 'px';
    });
  }
  function layoutPins() { centerPano(); clampPins(); }
  layoutPins(); window.addEventListener('load', layoutPins); window.addEventListener('resize', layoutPins);
  if (sw) sw.addEventListener('scroll', clampPins, { passive: true });

  if (window.MS.reduced || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('js-motion');

  // мітки: лінія росте від підпису до точки, потім з'являється точка
  function drawPins(scope, delay) {
    scope.querySelectorAll('.pin').forEach(function (pin, i) {
      var tl = gsap.timeline({ delay: (delay || 0) + i * 0.35 });
      tl.from(pin.querySelector('.pin__label'), { opacity: 0, y: -8, duration: 0.5, ease: 'power2.out' })
        .from(pin.querySelector('.pin__line'), { scaleY: 0, duration: 0.6, ease: 'power2.out' }, '-=0.2')
        .from(pin.querySelector('.pin__dot'), { scale: 0, duration: 0.3, ease: 'power2.out' }, '-=0.1');
    });
  }

  var mm = gsap.matchMedia();
  // головна: камера «опускається» від вежі Ратуші до площі (desktop і планшет)
  mm.add('(min-width: 768px)', function () {
    var hero = document.querySelector('[data-pano-pan]');
    if (!hero) return;
    var track = hero.querySelector('.pano__track');
    var dist = function () { return Math.max(0, track.offsetHeight - hero.offsetHeight); };
    gsap.to(track, {
      y: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: function () { return '+=' + Math.round(dist() * 1.4); }, scrub: 0.6, pin: true, invalidateOnRefresh: true }
    });
  });

  document.querySelectorAll('.pano').forEach(function (p, i) { drawPins(p, i === 0 ? 0.3 : 0.2); });

  // сторінкові кропи: легкий наїзд при прокрутці
  document.querySelectorAll('.pano--page .pano__img').forEach(function (img) {
    gsap.fromTo(img, { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.closest('.pano'), start: 'top top', end: 'bottom top', scrub: true } });
  });

  // лінійка відстаней: точки з'являються по черзі
  document.querySelectorAll('.ruler').forEach(function (r) {
    gsap.from(r, { scaleX: 0, transformOrigin: 'left center', duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: r, start: 'top 80%' } });
    gsap.from(r.querySelectorAll('.ruler__pt'), { opacity: 0, y: 10, stagger: 0.25, duration: 0.5, delay: 0.4, scrollTrigger: { trigger: r, start: 'top 80%' } });
  });

  // цитата по словах
  document.querySelectorAll('[data-words]').forEach(function (q) {
    var words = q.textContent.trim().split(/\s+/);
    q.innerHTML = words.map(function (w) { return '<span class="q-word">' + w + '</span>'; }).join(' ');
    gsap.from(q.querySelectorAll('.q-word'), { opacity: 0, y: 12, stagger: 0.06, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: q, start: 'top 80%' } });
  });

  // фото номерів у сітці: розкриття clip-path при вході
  gsap.utils.toArray('.rcard__img, .orow__img, .terraces__photo').forEach(function (el) {
    gsap.from(el, { clipPath: 'inset(12% 12% 12% 12%)', duration: 1, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
})();
