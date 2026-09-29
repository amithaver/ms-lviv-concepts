/* Заявки на пропозиції: модальні вікна з формами (розмітка — partials.offer_modals).
   Відправка: Web3Forms (e-mail) і/або Cloudflare Worker (Telegram) — налаштування в window.HP_FORMS (forms-config.js).
   Поки ключів немає — демо-режим: форма перевіряється, показує подяку, нічого не надсилає
   (останній payload — у window.__hpLastPayload для перевірки). */
(function () {
  var CFG = window.HP_FORMS || {};
  var HOTEL = 'Best Western Plus Market Square Lviv';
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var iso = function (d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

  function open(id, opener) {
    var dlg = document.getElementById('offer-' + id);
    if (!dlg) return;
    dlg._opener = opener;
    var form = dlg.querySelector('form');
    if (form && form.hasAttribute('data-sent')) reset(form);
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.documentElement.classList.add('modal-open');
    var f = dlg.querySelector('input:not([type=hidden]):not([tabindex="-1"]),select,textarea');
    if (f) f.focus();
  }
  function close(dlg) {
    if (dlg.open && typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  }
  function reset(form) {
    form.reset(); form.removeAttribute('data-sent');
    form.querySelectorAll('.is-err').forEach(function (x) { x.classList.remove('is-err'); });
    form.querySelectorAll('[data-err]').forEach(function (x) { x.textContent = ''; });
    var ok = form.parentNode.querySelector('[data-ok]'); if (ok) ok.hidden = true;
    form.hidden = false;
  }

  document.querySelectorAll('[data-offer-open]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); open(b.getAttribute('data-offer-open'), b); });
  });
  document.querySelectorAll('dialog.omodal').forEach(function (dlg) {
    dlg.querySelectorAll('[data-offer-close]').forEach(function (b) { b.addEventListener('click', function () { close(dlg); }); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(dlg); });   // клік по підкладці
    dlg.addEventListener('close', function () {
      document.documentElement.classList.remove('modal-open');
      if (dlg._opener) dlg._opener.focus();
    });
    dlg.querySelectorAll('input[type=date]').forEach(function (i) { i.min = iso(today); });
    var form = dlg.querySelector('form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); submit(form, dlg); });
  });

  function err(form, name, msg) {
    var inp = form.elements[name];
    var box = form.querySelector('[data-err="' + name + '"]');
    var wrap = inp && (inp.length && !inp.tagName ? inp[0] : inp).closest('.ff');
    if (wrap) wrap.classList.toggle('is-err', !!msg);
    if (box) box.textContent = msg || '';
    return !msg;
  }
  function val(form, name) { var i = form.elements[name]; return i ? String(i.value || '').trim() : ''; }

  function validate(form) {
    var ok = true, first = null;
    function chk(name, msg) { var r = err(form, name, msg); if (!r && !first) first = name; ok = ok && r; }
    form.querySelectorAll('[data-req]').forEach(function (i) {
      chk(i.name, val(form, i.name) ? '' : 'Вкажіть: ' + (i.getAttribute('data-label') || '').toLowerCase());
    });
    if (form.elements.phone) {
      var digits = val(form, 'phone').replace(/\D/g, '');
      if (val(form, 'phone')) chk('phone', digits.length >= 10 && digits.length <= 13 ? '' : 'Вкажіть телефон у форматі +380 XX XXX XX XX');
    }
    if (form.elements.email && val(form, 'email')) {
      chk('email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val(form, 'email')) ? '' : 'Перевірте e-mail');
    }
    if (form.elements.checkIn && val(form, 'checkIn')) {
      var a = new Date(val(form, 'checkIn') + 'T00:00:00');
      chk('checkIn', a >= today ? '' : 'Дата заїзду — не раніше сьогодні');
      if (val(form, 'checkOut')) {
        var b = new Date(val(form, 'checkOut') + 'T00:00:00');
        chk('checkOut', b > a ? '' : 'Дата виїзду — пізніше заїзду');
      }
    }
    if (form.elements.rooms && val(form, 'rooms')) {
      var n = +val(form, 'rooms'); chk('rooms', n >= 1 && n <= 50 ? '' : 'Від 1 до 50 номерів');
    }
    if (first) { var i = form.elements[first]; (i.length && !i.tagName ? i[0] : i).focus(); }
    return ok;
  }

  function payload(form) {
    var offer = form.getAttribute('data-offer-name');
    var data = { subject: 'Заявка: ' + offer + ' — ' + HOTEL, from_name: HOTEL + ' (сайт)', offer: offer, page: location.href };
    Array.prototype.forEach.call(form.elements, function (i) {
      if (!i.name || i.name === 'botcheck' || i.type === 'submit') return;
      if ((i.type === 'radio' || i.type === 'checkbox') && !i.checked) return;
      var label = i.getAttribute('data-label') || i.name;
      data[label] = String(i.value || '').trim();
    });
    return data;
  }

  function post(url, body) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r; });
  }

  function submit(form, dlg) {
    var hp = form.elements.botcheck;
    if (hp && (hp.type === 'checkbox' ? hp.checked : hp.value)) return;   // honeypot: боти заповнюють приховане поле
    if (!validate(form)) return;
    var data = payload(form);
    window.__hpLastPayload = data;
    var btn = form.querySelector('[type=submit]'), msg = form.querySelector('[data-send-err]');
    var jobs = [];
    if (CFG.web3formsKey) jobs.push(post(CFG.endpoint || 'https://api.web3forms.com/submit', Object.assign({ access_key: CFG.web3formsKey }, data)));
    if (CFG.telegramWorker) jobs.push(post(CFG.telegramWorker, data));
    btn.disabled = true; if (msg) msg.textContent = '';
    (jobs.length ? Promise.all(jobs) : Promise.resolve()).then(function () {
      form.setAttribute('data-sent', ''); form.hidden = true;
      var ok = dlg.querySelector('[data-ok]'); ok.hidden = false;
      var sum = ok.querySelector('[data-sum]');
      if (sum) sum.textContent = 'Пропозиція: ' + data.offer + (data['Заїзд'] ? '. Дати: ' + data['Заїзд'] + (data['Виїзд'] ? ' — ' + data['Виїзд'] : '') : '') + '.';
      var demo = ok.querySelector('[data-demo-note]'); if (demo) demo.hidden = !!jobs.length;
      var c = ok.querySelector('button'); if (c) c.focus();
    }).catch(function () {
      if (msg) msg.textContent = 'Не вдалося надіслати. Зателефонуйте нам: +380 800 335 204.';
    }).then(function () { btn.disabled = false; });
  }
})();
