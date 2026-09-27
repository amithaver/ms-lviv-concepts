/* Бронювання для всіх концептів Market Square Lviv — єдине місце логіки.
   Форми: form[data-booking] з полями [data-bk-in] [data-bk-out] [data-bk-adults] [data-bk-children] [data-bk-submit].
   Перехід: https://www.bestwestern.com/en_US/book/hotel-rooms.91351.html?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&rooms=1&adults=N&children=N
   rooms завжди 1 (більше Best Western не підхоплює); мовної версії uk_UA немає — лише en_US. */
(function () {
  var BASE = 'https://www.bestwestern.com/en_US/book/hotel-rooms.91351.html';
  var MSG = {
    empty: 'Оберіть дати заїзду та виїзду.',
    past: 'Дата заїзду не може бути в минулому.',
    order: 'Виїзд має бути пізніше за заїзд.'
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return iso(new Date()); }
  function plusDays(s, n) { var p = s.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); d.setDate(d.getDate() + n); return iso(d); }
  function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || ''); }

  function parts(form) {
    return {
      inp: form.querySelector('[data-bk-in]'),
      out: form.querySelector('[data-bk-out]'),
      ad: form.querySelector('[data-bk-adults]'),
      ch: form.querySelector('[data-bk-children]'),
      btn: form.querySelector('[data-bk-submit]'),
      foot: form.querySelector('[data-bk-foot]') ||
        (form.nextElementSibling && form.nextElementSibling.matches('[data-bk-foot]') ? form.nextElementSibling : null)
    };
  }

  function check(p) {
    var a = p.inp && p.inp.value, b = p.out && p.out.value;
    if (!isDate(a) || !isDate(b)) return MSG.empty;
    if (a < today()) return MSG.past;
    if (b <= a) return MSG.order;
    return '';
  }

  function url(p) {
    var q = [
      'checkIn=' + p.inp.value,
      'checkOut=' + p.out.value,
      'rooms=1',
      'adults=' + (p.ad ? p.ad.value : '2'),
      'children=' + (p.ch ? p.ch.value : '0')
    ];
    return BASE + '?' + q.join('&');
  }

  function refresh(p) {
    var msg = check(p);
    if (p.btn) { p.btn.disabled = !!msg; p.btn.setAttribute('aria-disabled', msg ? 'true' : 'false'); }
    var hint = p.foot && p.foot.querySelector('[data-bk-hint]');
    if (hint) { hint.textContent = msg; hint.hidden = !msg; }
    if (p.out && p.inp && isDate(p.inp.value)) p.out.min = plusDays(p.inp.value, 1);
    return msg;
  }

  function open(href) {
    var a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener nofollow';
    a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
  }

  function init(form) {
    if (form.__bk) return; form.__bk = true;
    var p = parts(form);
    if (!p.inp || !p.out) return;
    p.inp.min = today();
    // за замовчуванням виїзд = заїзд + 1 ніч (або якщо виїзд став не пізніше заїзду)
    p.inp.addEventListener('change', function () {
      if (isDate(p.inp.value) && (!isDate(p.out.value) || p.out.value <= p.inp.value)) p.out.value = plusDays(p.inp.value, 1);
      refresh(p);
    });
    ['input', 'change'].forEach(function (ev) {
      p.inp.addEventListener(ev, function () { refresh(p); });
      p.out.addEventListener(ev, function () { refresh(p); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (refresh(p)) return;
      open(url(p));
    });
    refresh(p);
  }

  function all() { document.querySelectorAll('form[data-booking]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
  window.MSBooking = { BASE: BASE, url: function (form) { return url(parts(form)); }, check: function (form) { return check(parts(form)); }, init: all };
})();
