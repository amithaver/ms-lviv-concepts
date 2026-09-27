/* Концепт «Дім на площі Ринок»: лінія фасадів, прозора шапка над фото, карусель номерів, лайтбокс, лічильник фільтра.
   Меню, фільтр, мова і форми — у ../assets/base.js. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement, hdr = $('#hdr'), hero = document.body.classList.contains('has-hero');

  /* ---------- лінія фасадів (фірмовий елемент з логотипа) ---------- */
  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function house(x, w, h, top, type, R, big) {
    var wall = top, H = h, cx = x + w / 2, ap = Math.max(1, wall * (big ? 0.08 : 0.12));
    var o = 'M' + x + ' ' + H + 'V' + wall, d = '', i, px, py;
    if (type === 0) { o += 'L' + cx + ' ' + ap + 'L' + (x + w) + ' ' + wall; }
    else if (type === 1) { var st = 3, dx = w * 0.34 / st, dy = (wall - ap) / st; px = x; py = wall; for (i = 0; i < st; i++) { py -= dy; o += 'V' + py; px += dx; o += 'H' + px; } px = x + w - w * 0.34; o += 'H' + px; for (i = 0; i < st; i++) { py += dy; o += 'V' + py; px += dx; o += 'H' + px; } o += 'V' + wall; }
    else if (type === 2) { var a2 = wall - (wall - ap) * 0.55; o += 'L' + (x + w * 0.18) + ' ' + a2 + 'H' + (x + w * 0.82) + 'L' + (x + w) + ' ' + wall; }
    else { var dw = w * 0.3, b2 = wall - (wall - ap) * 0.5, sh = b2 + (wall - b2) * 0.35; o += 'H' + (cx - dw / 2) + 'V' + sh + 'L' + cx + ' ' + b2 + 'L' + (cx + dw / 2) + ' ' + sh + 'V' + wall + 'H' + (x + w); }
    o += 'V' + H + 'Z';
    d += 'M' + x + ' ' + wall + 'H' + (x + w);
    var floors = big ? 3 : Math.max(1, Math.floor((H - wall) / 13));
    var cols = big ? Math.max(3, Math.min(5, Math.round(w / 64))) : Math.max(2, Math.round(w / 17));
    var ww = big ? 7 : 3, wh = big ? 11 : 5, gap = (w - cols * ww) / (cols + 1), fh = (H - wall) / (floors + 0.6);
    for (var f = 0; f < floors; f++) {
      var y = wall + fh * (f + 0.55);
      for (var c = 0; c < cols; c++) {
        var wx = x + gap + c * (ww + gap);
        if (f === floors - 1 && c === Math.floor(cols / 2) && R() < 0.55) { d += 'M' + wx + ' ' + H + 'V' + (H - wh * 1.5) + 'H' + (wx + ww) + 'V' + H; continue; }
        d += 'M' + wx + ' ' + (y + wh) + 'V' + y + 'H' + (wx + ww) + 'V' + (y + wh) + 'Z';
      }
    }
    if (type === 0 || type === 2) d += 'M' + (cx - 1.5) + ' ' + (ap + (wall - ap) * 0.55) + 'h3';
    return { o: o, d: d };
  }
  function facade(el) {
    var w = Math.max(200, Math.round(el.clientWidth || el.parentElement.clientWidth)), h = +el.getAttribute('data-h') || 60;
    var four = el.getAttribute('data-facade') === '4', R = rng(four ? 7 : (w * 13 + h)), O = '', D = '', x = 0, r;
    if (four) { var hw = w / 4, types = [1, 0, 3, 2], tops = [0.3, 0.38, 0.34, 0.42]; for (var i = 0; i < 4; i++) { r = house(x, hw, h, h * tops[i], types[i], R, true); O += r.o; D += r.d; x += hw; } }
    else { var baseW = h < 50 ? 48 : 62; while (x < w - 10) { var ww = Math.round(baseW * (0.8 + R() * 0.7)); if (w - x - ww < baseW * 0.7) ww = w - x; r = house(x, ww, h, h * (0.42 + R() * 0.2), Math.floor(R() * 4), R, false); O += r.o; D += r.d; x += ww; } }
    el.innerHTML = '<svg class="facade" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="fo" d="' + O + '"/><path d="' + D + '"/></svg>';
  }
  function drawFacades() { $$('[data-facade]').forEach(facade); }

  /* ---------- брейкпоінт (класи m / t / d, як у прототипі) ---------- */
  function setBp() {
    var w = window.innerWidth, bp = w < 760 ? 'm' : (w < 1280 ? 't' : 'd');
    root.classList.remove('m', 't', 'd'); root.classList.add(bp);
    root.style.setProperty('--vh', window.innerHeight + 'px');
    drawFacades(); updCar();
  }

  /* ---------- шапка: прозора над фото, біла після прокрутки ---------- */
  /* логотипи перемикаються лише коли обидві пари вже в кеші — жодного перерваного запиту */
  var logoImgs = $$('[data-site-header] [data-logo-pair] img'), logosReady = !hero, pending = 0;
  if (hero) logoImgs.forEach(function (img) {
    var u = img.getAttribute('data-light'); pending++;
    var pre = new Image(); pre.onload = pre.onerror = function () { if (--pending === 0) { logosReady = true; onScroll(); } }; pre.src = u;
  });
  function onScroll() {
    var y = window.scrollY, clear = hero && y <= 60 && !document.body.classList.contains('menu-open');
    hdr.classList.toggle('small', y > 60);
    hdr.classList.toggle('clear', clear);
    if (hero && logosReady && window.MS && MS.setLogos) MS.setLogos(clear);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- карусель номерів ---------- */
  var track = $('#track'), cPrev = $('#carPrev'), cNext = $('#carNext'), cCount = $('#carCount');
  function step() { var c = track.firstElementChild; return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 24) : 300; }
  function updCar() {
    if (!track) return;
    var n = track.children.length, i = Math.round(track.scrollLeft / step());
    cCount.textContent = String(Math.min(i + 1, n)).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    cPrev.disabled = track.scrollLeft < 4; cNext.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  }
  if (track) {
    cPrev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: MS.reduced ? 'auto' : 'smooth' }); });
    cNext.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: MS.reduced ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', function () { requestAnimationFrame(updCar); }, { passive: true });
  }

  /* ---------- лічильник категорій після фільтра ---------- */
  var rcount = $('#rcount');
  if (rcount) $$('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      setTimeout(function () {
        var n = $$('#rgrid .card').filter(function (c) { return !c.hidden; }).length;
        rcount.textContent = n + (n === 1 ? ' категорія' : (n > 1 && n < 5 ? ' категорії' : ' категорій'));
      }, 0);
    });
  });

  /* ---------- лайтбокс Terrace Suite ---------- */
  var lb = $('#lb');
  if (lb) {
    var SET = ['r-terrace-suite', 'ts-terrace', 'ts-view', 'ts-living', 'ts-fireplace', 'ts-bath', 'ts-bath-terrace', 'ts-desk', 'ts-bed-2'];
    var lbImg = $('#lbImg'), lbI = 0, base = lbImg.getAttribute('src').replace(/[^/]+$/, ''), opener = null;
    var show = function () { lbImg.src = base + SET[lbI] + '.jpg'; lbImg.alt = 'Terrace Suite, фото ' + (lbI + 1); $('#lbCount').textContent = (lbI + 1) + ' / ' + SET.length; };
    var close = function () { lb.hidden = true; document.body.classList.remove('lb-open'); if (opener) opener.focus(); };
    $$('[data-action="lightbox"]').forEach(function (b) {
      b.addEventListener('click', function () { opener = b; lbI = +b.getAttribute('data-i') || 0; show(); lb.hidden = false; document.body.classList.add('lb-open'); $('#lbClose').focus(); });
    });
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', function () { lbI = (lbI - 1 + SET.length) % SET.length; show(); });
    $('#lbNext').addEventListener('click', function () { lbI = (lbI + 1) % SET.length; show(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') $('#lbPrev').click(); if (e.key === 'ArrowRight') $('#lbNext').click();
    });
  }

  var rT; window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(setBp, 80); });
  setBp(); onScroll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { drawFacades(); updCar(); });
})();
