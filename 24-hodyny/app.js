/* «24 години на площі Ринок»: логіка з прототипу Claude, перенесена на багатосторінковий сайт.
   Головна: годинник і фон змінюються за главами (07:30 → 23:00), логотип-«площа» прорисовується лінією,
   номери — горизонтальний скрол у закріпленій секції, історія — роки змінюються у закріпленій колонці.
   Між сторінками — шторка (clip-path). prefers-reduced-motion: усе статично, контент одразу видно. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement, body = document.body;
  var RM = window.MS.reduced;
  var G = !RM && window.gsap && window.ScrollTrigger;
  if (G) gsap.registerPlugin(ScrollTrigger);
  var page = $('.page'); if (!page) return;
  var isHome = page.id === 'p-home';

  var TH = { stone: ['#E9E6E0', '#1C2B39', 0], white: ['#FFFFFF', '#1C2B39', 0], green: ['#1F4034', '#FFFFFF', 1], navy: ['#1C2B39', '#FFFFFF', 1], night: ['#0E151C', '#FFFFFF', 1] };
  function theme(k) {
    var t = TH[k] || TH.white;
    body.style.setProperty('--bg', t[0]); body.style.setProperty('--fg', t[1]);
    root.style.setProperty('--bg', t[0]); root.style.setProperty('--fg', t[1]);
    root.classList.toggle('dk', !!t[2]);
    window.MS.setLogos(!!t[2] && !$('#hdr').classList.contains('solid-light'));
  }

  function setBp() {
    var w = window.innerWidth;
    root.classList.remove('m', 't', 'd'); root.classList.add(w < 760 ? 'm' : (w < 1180 ? 't' : 'd'));
    root.style.setProperty('--vh', window.innerHeight + 'px');
  }
  setBp();
  var isM = function () { return root.classList.contains('m'); };

  // годинник
  var toMin = function (t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; };
  function setClock(min) {
    min = Math.round(min / 5) * 5; var h = Math.floor(min / 60), m = min % 60;
    $('#clockT').textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    $('#hH').setAttribute('transform', 'rotate(' + ((h % 12) * 30 + m / 2) + ' 9 9)');
    $('#hM').setAttribute('transform', 'rotate(' + (m * 6) + ' 9 9)');
  }

  // reveal фото (clip-path)
  function reveals() {
    var els = $$('[data-rv]', page);
    if (RM || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (e) { if (e.closest('#track')) return; e.classList.add('js-rv'); io.observe(e); });
  }

  // головна: глави
  var CH = $$('#p-home .ch'), lastTh = '';
  function tick() {
    var y = window.scrollY; $('#hdr').classList.toggle('solid', y > 20);
    if (!isHome) return;
    var mid = window.innerHeight * 0.5, i = 0;
    CH.forEach(function (c, k) { if (c.getBoundingClientRect().top <= mid) i = k; });
    var c = CH[i], r = c.getBoundingClientRect();
    var f = r.top > 0 ? 0 : Math.min(1, Math.max(0, -r.top / r.height));
    var a = toMin(c.dataset.t), b = CH[i + 1] ? toMin(CH[i + 1].dataset.t) : a;
    setClock(a + (b - a) * f);
    if (c.dataset.th !== lastTh) { lastTh = c.dataset.th; theme(lastTh); }
    var bk = $('#heroBk').getBoundingClientRect();
    var bkVis = bk.bottom > 10 && bk.top < window.innerHeight;
    $('#mbar').classList.toggle('off', bkVis); $('#clock').classList.toggle('low', bkVis);
  }
  var rq = false;
  window.addEventListener('scroll', function () { if (!rq) { rq = true; requestAnimationFrame(function () { rq = false; tick(); }); } }, { passive: true });

  function housesSVG() {
    var svg = $('#housesSvg'); if (!svg) return;
    var W = 1280, H = 150, n = 4, w = W / n, out = '';
    var cfg = [[.30, 'step'], [.36, 'gable'], [.33, 'attic'], [.40, 'hip']];
    for (var i = 0; i < n; i++) {
      var x = i * w, top = H * cfg[i][0], t = cfg[i][1], cx = x + w / 2, ap = top * .12, o = 'M' + x + ' ' + H + 'V' + top;
      if (t === 'gable') o += 'L' + cx + ' ' + ap + 'L' + (x + w) + ' ' + top;
      else if (t === 'hip') o += 'L' + (x + w * .18) + ' ' + (ap + top * .35) + 'H' + (x + w * .82) + 'L' + (x + w) + ' ' + top;
      else if (t === 'step') { var px = x, py = top, dx = w * .11, dy = (top - ap) / 3, k; for (k = 0; k < 3; k++) { py -= dy; o += 'V' + py; px += dx; o += 'H' + px; } px = x + w - w * .33; o += 'H' + px; for (k = 0; k < 3; k++) { py += dy; o += 'V' + py; px += dx; o += 'H' + px; } o += 'V' + top; }
      else { o += 'H' + (cx - w * .14) + 'V' + (top * .55) + 'L' + cx + ' ' + (ap + 4) + 'L' + (cx + w * .14) + ' ' + (top * .55) + 'V' + top + 'H' + (x + w); }
      o += 'V' + H + 'M' + x + ' ' + top + 'H' + (x + w);
      var cols = 4, ww = 9, wh = 16, gap = (w - cols * ww) / (cols + 1), fh = (H - top) / 3.4;
      for (var fl = 0; fl < 3; fl++) { var yy = top + fh * (fl + .5); for (var cc = 0; cc < cols; cc++) { var wx = x + gap + cc * (ww + gap); if (fl === 2 && cc === 1 && i % 2 === 0) { o += 'M' + wx + ' ' + H + 'V' + (H - wh * 1.4) + 'H' + (wx + ww * 1.6) + 'V' + H; continue; } o += 'M' + wx + ' ' + (yy + wh) + 'V' + yy + 'H' + (wx + ww) + 'V' + (yy + wh) + 'Z'; } }
      out += '<path pathLength="1" d="' + o + '"/>';
    }
    svg.innerHTML = out;
  }

  var ctx = null;
  function buildHome() {
    var hs = $('#c3'), hi = $('#c4'), m = isM();
    var track = $('#track'); track.style.transform = '';
    var cardsRv = $$('#track [data-rv]');
    if (!G || m) { hs.classList.add('static'); hs.style.height = ''; }
    else {
      hs.classList.remove('static');
      var cw = Math.round(Math.min(320, (window.innerHeight - 460) * .8)); track.style.setProperty('--cw', Math.max(220, cw) + 'px');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      hs.style.height = (window.innerHeight + dist()) + 'px';
      cardsRv.forEach(function (e) { e.classList.add('js-rv'); e.classList.remove('in'); });
      var reveal = function () { cardsRv.forEach(function (e) { if (e.getBoundingClientRect().left < window.innerWidth * .92) e.classList.add('in'); }); };
      gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: hs, start: 'top top', end: function () { return '+=' + dist(); }, scrub: .4, invalidateOnRefresh: true, onUpdate: function (s) { $('#prog').style.transform = 'scaleX(' + s.progress + ')'; reveal(); }, onEnter: reveal } });
    }
    var items = $$('#hiR .hi-it'), yrs = $$('#yrs .yr'), dots = $$('#hiDots i');
    var setH = function (k) { [items, yrs, dots].forEach(function (list) { list.forEach(function (e, j) { e.classList.toggle('on', j === k); }); }); };
    if (!G || m) { hi.classList.add('static'); hi.style.height = ''; }
    else {
      hi.classList.remove('static'); hi.style.height = (window.innerHeight * items.length * .8 + window.innerHeight * .2) + 'px'; setH(0);
      ScrollTrigger.create({ trigger: hi, start: 'top top', end: 'bottom bottom', onUpdate: function (s) { setH(Math.min(items.length - 1, Math.floor(s.progress * items.length))); } });
    }
    if (!G) return;
    gsap.fromTo('#c2ph img', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '#c2ph', start: 'top bottom', end: 'bottom top', scrub: true } });
    var hp = $$('#housesSvg path'); gsap.set(hp, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.to(hp, { strokeDashoffset: 0, ease: 'none', stagger: .15, scrollTrigger: { trigger: '#houses', start: 'top 85%', end: 'bottom 60%', scrub: .5 } });
    gsap.from('#houses li', { opacity: 0, stagger: .12, duration: .6, scrollTrigger: { trigger: '#houses ol', start: 'top 90%' } });
    gsap.fromTo('#c6ph', { clipPath: 'inset(8% 8% 8% 8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '#c6ph', start: 'top 90%', end: 'top 10%', scrub: .4 } });
    gsap.from('#qt .w', { opacity: 0, y: 8, stagger: .09, duration: .6, ease: 'power2.out', scrollTrigger: { trigger: '#qt', start: 'top 80%' } });
  }
  function intro() {
    var mk = $('#mark'), ph = $('#heroPh');
    if (!G) { if (mk) mk.style.display = 'none'; return; }
    var els = $$('#mark *');
    gsap.set(els, { strokeDasharray: 1, strokeDashoffset: 1, attr: { pathLength: 1 } });
    gsap.set(mk, { opacity: 1 }); gsap.set(ph, { clipPath: 'inset(50% 50% 50% 50%)' });
    gsap.set('#h1,#c1 .lead,#c1 .chap-l', { opacity: 0 }); gsap.set('#heroBk', { opacity: 0, y: 40 });
    gsap.timeline({ defaults: { ease: 'power2.inOut' } })
      .to(els, { strokeDashoffset: 0, duration: 1.6, stagger: .02 })
      .to(ph, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' }, '-=.2')
      .to(mk, { opacity: 0, duration: .4 }, '<.2')
      .to('#heroBk', { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, 1.1)
      .to('#c1 .chap-l,#h1,#c1 .lead', { opacity: 1, duration: .7, stagger: .12, ease: 'power1.out' }, 1.4);
  }

  function mount() {
    if (ctx) { ctx.revert(); ctx = null; }
    if (isHome) {
      lastTh = '';
      var qt = $('#qt'); if (qt && !qt.querySelector('.w')) qt.innerHTML = qt.textContent.split(' ').map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
      housesSVG();
      if (G) ctx = gsap.context(function () { buildHome(); intro(); }); else { buildHome(); intro(); }
    } else {
      theme(page.dataset.th || 'white'); setClock(toMin(page.dataset.t || '12:00'));
    }
    if (G) ScrollTrigger.refresh();
    tick();
  }

  reveals();
  mount();
  if (!isHome) $('#mbar').classList.remove('off');

  var lastBp = root.className, rT;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { var before = root.classList.contains('m') + '' + root.classList.contains('t'); setBp(); var after = root.classList.contains('m') + '' + root.classList.contains('t'); if (before !== after && isHome) { mount(); } }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (G) ScrollTrigger.refresh(); });

  // шторка між сторінками
  var wipe = $('#wipe');
  if (G && wipe) {
    gsap.fromTo(wipe, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: .45, ease: 'power2.out', delay: .05 });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      var href = a.getAttribute('href') || ''; if (!/\.html(#.*)?$/.test(href) || /^https?:/.test(href)) return;
      e.preventDefault();
      gsap.fromTo(wipe, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .35, ease: 'power2.in', onComplete: function () { location.href = href; } });
    });
    window.addEventListener('pageshow', function (ev) { if (ev.persisted) gsap.set(wipe, { clipPath: 'inset(0% 0% 100% 0%)' }); });
  }
})();
