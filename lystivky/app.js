/* «Листівки зі Львова»: перевертання листівки, галерея Terrace Suite, поява листівок під час прокрутки. */
(function () {
  var reduced = window.MS ? window.MS.reduced : false;

  // Листівка на обкладинці: лицьовий бік ↔ зворот
  document.querySelectorAll('[data-action="flip"]').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = !b.classList.contains('is-flipped');
      b.classList.toggle('is-flipped', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });

  // Галерея Terrace Suite: мініатюра → велике фото
  var main = document.querySelector('[data-main]');
  document.querySelectorAll('[data-action="thumb"]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!main) return;
      main.src = b.getAttribute('data-src');
      main.alt = b.getAttribute('data-cap');
      var cap = main.closest('figure') && main.closest('figure').querySelector('figcaption');
      if (cap) cap.textContent = b.getAttribute('data-cap');
      document.querySelectorAll('[data-action="thumb"]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
    });
  });

  // Поява листівок
  if (reduced || !('IntersectionObserver' in window)) return;
  var items = document.querySelectorAll('main .pc:not(.pc--ghost):not(.flip__face), main .stamp, main .pmark');
  document.documentElement.classList.add('js-reveal');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(function (el, i) {
    if (el.getBoundingClientRect().top < innerHeight) return;
    el.classList.add('rv'); el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el);
  });
})();
