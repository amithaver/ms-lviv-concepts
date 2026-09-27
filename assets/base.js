/* Спільна поведінка: шапка над фото (перемикання пари логотипів), мобільне меню, фільтри, форма бронювання. */
(function () {
  var BOOK = 'https://www.bestwestern.com/en_US/book/hotel-rooms.91351.html';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.MS = { reduced: reduced, BOOK: BOOK };
  document.documentElement.classList.toggle('reduced-motion', reduced);

  var body = document.body, mode = body.getAttribute('data-header') || 'light';
  var header = document.querySelector('[data-site-header]');
  function setLogos(dark) {
    document.querySelectorAll('[data-site-header] [data-logo-pair] img').forEach(function (img) {
      var want = img.getAttribute(dark ? 'data-dark' : 'data-light');
      if (want && img.getAttribute('src') !== want) img.setAttribute('src', want);
    });
  }
  function onScroll() {
    var scrolled = window.scrollY > 60;
    if (header) header.classList.toggle('is-scrolled', scrolled);
    body.classList.toggle('is-scrolled', scrolled);
    var menuOpen = body.classList.contains('menu-open');
    if (mode === 'manual') return; // концепт сам керує логотипами (MS.setLogos)
    var dark = mode === 'dark-fixed' || (mode === 'dark' && !scrolled) || (menuOpen && body.hasAttribute('data-menu-dark'));
    setLogos(dark);
  }
  window.MS.setLogos = setLogos;
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Мобільне меню
  var menu = document.getElementById('site-menu');
  function toggleMenu(open) {
    if (!menu) return;
    open = typeof open === 'boolean' ? open : !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    body.classList.toggle('menu-open', open);
    document.querySelectorAll('[data-menu-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) { var f = menu.querySelector('a,button'); if (f) f.focus({ preventScroll: true }); }
    onScroll();
  }
  document.querySelectorAll('[data-menu-toggle]').forEach(function (b) { b.addEventListener('click', function () { toggleMenu(); }); });
  if (menu) {
    menu.setAttribute('aria-hidden', 'true');
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggleMenu(false); });

  // Фільтри: [data-filter-group] > [data-filter], елементи [data-tags]
  document.querySelectorAll('[data-filter-group]').forEach(function (g) {
    var scope = document.querySelector(g.getAttribute('data-filter-group')) || document;
    g.querySelectorAll('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        g.querySelectorAll('[data-filter]').forEach(function (b) { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        scope.querySelectorAll('[data-tags]').forEach(function (it) {
          var show = f === 'all' || (' ' + it.getAttribute('data-tags') + ' ').indexOf(' ' + f + ' ') > -1;
          it.hidden = !show;
        });
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      });
    });
  });

  // Форма бронювання: відкриває систему бронювання Best Western у новій вкладці
  document.querySelectorAll('form[data-booking]').forEach(function (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); window.open(BOOK, '_blank', 'noopener'); });
  });
  // Інші форми-заглушки (зворотний дзвінок): показують повідомлення, нічого не відправляють
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = form.querySelector('[data-demo-msg]'); if (m) m.hidden = false;
    });
  });
  // Кнопки-перемикачі мови в концепті: лише візуальний стан
  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-lang]').forEach(function (x) { x.classList.toggle('is-active', x.getAttribute('data-lang') === b.getAttribute('data-lang')); });
      var n = document.querySelector('[data-lang-note]'); if (n) { n.hidden = false; setTimeout(function () { n.hidden = true; }, 2600); }
    });
  });
})();
