/* «Lemberg 1900»: плакатна поява героя, «друк» великих цифр і пластин каталогу при прокрутці. */
(function () {
  if (!window.gsap || (window.MS && window.MS.reduced)) return;
  var g = window.gsap;
  if (window.ScrollTrigger) g.registerPlugin(window.ScrollTrigger);
  // герой: червоний блок і вертикальне слово
  var word = document.querySelector('.lm-hero__word');
  if (word) g.from(word, { yPercent: 12, opacity: 0, duration: 1.1, ease: 'power3.out' });
  var txt = document.querySelectorAll('.lm-hero__txt > *');
  if (txt.length) g.from(txt, { y: 18, opacity: 0, duration: .8, stagger: .08, delay: .25, ease: 'power2.out' });
  var ph = document.querySelector('.lm-hero__ph img');
  if (ph) g.from(ph, { scale: 1.06, duration: 1.6, ease: 'power2.out' });
  if (!window.ScrollTrigger) return;
  function reveal(sel, opts) {
    document.querySelectorAll(sel).forEach(function (el) {
      g.from(el, Object.assign({ y: 28, opacity: 0, duration: .8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } }, opts || {}));
    });
  }
  reveal('.lm-num__v', { y: 40 });
  reveal('.lm-plate, .lm-label, .lm-reg, .lm-route, .lm-svc');
  reveal('.lm-chr__num', { y: 36 });
  reveal('.lm-quote blockquote');
})();
