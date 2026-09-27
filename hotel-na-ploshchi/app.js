/* «Готель на площі Ринок»: стрічка номерів зі стрілками й лічильником, вкладки Terrace Suite,
   прорисовка фасадної лінії та поява блоків. prefers-reduced-motion — усе статично. */
(function () {
  // стрічка номерів
  var rail = document.querySelector('[data-rail]');
  if (rail) {
    var cards = rail.children, count = document.querySelector('[data-rail-count] b');
    var step = function () { return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : rail.clientWidth; };
    var go = function (d) { rail.scrollBy({ left: d * step(), behavior: window.MS.reduced ? 'auto' : 'smooth' }); };
    document.querySelectorAll('[data-action="rail-prev"]').forEach(function (b) { b.addEventListener('click', function () { go(-1); }); });
    document.querySelectorAll('[data-action="rail-next"]').forEach(function (b) { b.addEventListener('click', function () { go(1); }); });
    rail.addEventListener('scroll', function () {
      if (!count) return;
      var i = Math.round(rail.scrollLeft / step()) + 1;
      count.textContent = (i < 10 ? '0' : '') + Math.min(i, cards.length);
    }, { passive: true });
  }

  // вкладки
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = list.querySelectorAll('[role="tab"]');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) {
          var on = x === t;
          x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on ? 'true' : 'false');
          var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
        });
      });
    });
  });

  if (window.MS.reduced || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js-reveal');
  var sel = '.section .shead, .rcard, .ocard, .scard, .srow, .orow, .srv, .tl__row, .quote blockquote, .about__t, .about__img, .houses4 li, .gal figure, .trio figure';
  document.querySelectorAll(sel).forEach(function (el) { el.setAttribute('data-reveal', ''); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add(e.target.matches('.facade') ? 'is-drawn' : 'is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal], .facade').forEach(function (el) { io.observe(el); });
})();
