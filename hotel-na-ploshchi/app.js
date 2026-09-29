/* «Готель на площі Ринок»: стрічка номерів, послуги (наведення / акордеон), галерея номера (Swiper + GLightbox),
   галерея готелю. Рух — motion.js, заявки — forms.js. */
(function () {
  var reduced = window.MS && window.MS.reduced;

  // стрічка номерів зі стрілками й лічильником
  var rail = document.querySelector('[data-rail]');
  if (rail) {
    var cards = rail.children, count = document.querySelector('[data-rail-count] b');
    var step = function () { return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : rail.clientWidth; };
    var go = function (d) { rail.scrollBy({ left: d * step(), behavior: reduced ? 'auto' : 'smooth' }); };
    document.querySelectorAll('[data-action="rail-prev"]').forEach(function (b) { b.addEventListener('click', function () { go(-1); }); });
    document.querySelectorAll('[data-action="rail-next"]').forEach(function (b) { b.addEventListener('click', function () { go(1); }); });
    rail.addEventListener('scroll', function () {
      if (!count) return;
      var i = Math.round(rail.scrollLeft / step()) + 1;
      count.textContent = (i < 10 ? '0' : '') + Math.min(i, cards.length);
    }, { passive: true });
  }

  // послуги: десктоп — наведення/фокус міняє фото і текст ліворуч; мобільний — акордеон
  var wide = window.matchMedia('(min-width: 901px)');
  document.querySelectorAll('[data-sx-root]').forEach(function (root) {
    var items = root.querySelectorAll('.sx__it');
    function show(i) {
      root.querySelectorAll('[data-sx]').forEach(function (el) { el.classList.toggle('is-on', el.getAttribute('data-sx') === String(i)); });
      items.forEach(function (it) { it.querySelector('.sx__btn').setAttribute('aria-expanded', it.getAttribute('data-sx') === String(i) ? 'true' : 'false'); });
    }
    items.forEach(function (it) {
      var i = it.getAttribute('data-sx'), btn = it.querySelector('.sx__btn');
      it.addEventListener('mouseenter', function () { if (wide.matches) show(i); });
      btn.addEventListener('focus', function () { if (wide.matches) show(i); });
      btn.addEventListener('click', function () {
        if (wide.matches) return show(i);
        var open = btn.getAttribute('aria-expanded') === 'true';
        it.classList.toggle('is-on', !open); btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
  });

  // повноекранний перегляд (GLightbox): галерея номера і галерея готелю
  var lb = null;
  if (window.GLightbox) lb = window.GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true, openEffect: reduced ? 'none' : 'fade', closeEffect: reduced ? 'none' : 'fade', slideEffect: reduced ? 'none' : 'slide' });
  var all = document.querySelector('[data-gallery-all]');
  if (all) all.addEventListener('click', function () {
    var hidden = document.querySelectorAll('.gl__it[hidden]');
    if (hidden.length) { hidden.forEach(function (a) { a.hidden = false; }); all.textContent = 'Згорнути галерею'; }
    else { var n = +all.getAttribute('data-n') || 8; document.querySelectorAll('.gl__it').forEach(function (a, i) { if (i >= n) a.hidden = true; }); all.textContent = all.getAttribute('data-label'); }
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  });
  if (all) all.setAttribute('data-label', all.textContent);

  // галерея номера: Swiper з листанням
  if (window.Swiper) document.querySelectorAll('[data-swiper]').forEach(function (el) {
    var cnt = el.querySelector('.rgal__count');
    var sw = new window.Swiper(el, {
      slidesPerView: 1.08, spaceBetween: 12, speed: reduced ? 0 : 600, grabCursor: true, keyboard: { enabled: true },
      a11y: { prevSlideMessage: 'Попереднє фото', nextSlideMessage: 'Наступне фото' },
      navigation: { prevEl: el.querySelector('.rgal__prev'), nextEl: el.querySelector('.rgal__next') },
      breakpoints: { 761: { slidesPerView: 1.6, spaceBetween: 16 }, 1200: { slidesPerView: 2.2, spaceBetween: 16 } }
    });
    var upd = function () { if (cnt) cnt.textContent = (sw.realIndex + 1) + ' / ' + el.querySelectorAll('.swiper-slide').length; };
    sw.on('slideChange', upd); upd();
  });
})();
