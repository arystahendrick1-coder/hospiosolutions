(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var nav = $('.nav'), burger = $('.burger');

  // Menu mobile
  if (burger && nav) burger.addEventListener('click', function () {
    var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
  });

  // Slider properti
  var sl = $('.slider'), nx = $('.slider-next'), pv = $('.slider-prev');
  if (sl && nx && pv) {
    var step = function () { var li = sl.querySelector('li'); return li.offsetWidth + (parseFloat(getComputedStyle(sl).columnGap) || 24); };
    nx.addEventListener('click', function () {
      var end = sl.scrollLeft + sl.clientWidth >= sl.scrollWidth - 4;
      end ? sl.scrollTo({ left: 0, behavior: 'smooth' }) : sl.scrollBy({ left: step(), behavior: 'smooth' });
    });
    pv.addEventListener('click', function () {
      sl.scrollLeft <= 4 ? sl.scrollTo({ left: sl.scrollWidth, behavior: 'smooth' }) : sl.scrollBy({ left: -step(), behavior: 'smooth' });
    });
  }

  // Tahun di footer
  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });

  // Form (Formspree)
  $$('form[data-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = f.querySelector('button'), msg = f.querySelector('.form-msg');
      btn.disabled = true; msg.hidden = true; msg.className = 'form-msg';
      var fail = function () { msg.textContent = 'Message not sent. Please try again or email info@hospiosolutions.com.'; msg.classList.add('err'); };
      fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) { if (r.ok) { f.reset(); msg.textContent = 'Thank you. We have received your message and will reply by email.'; } else fail(); })
        .catch(fail)
        .then(function () { msg.hidden = false; btn.disabled = false; });
    });
  });

  // Tombol salin link di artikel
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var ok = function () {
        b.setAttribute('aria-label', 'Link copied'); b.classList.add('done');
        setTimeout(function () { b.setAttribute('aria-label', 'Copy link'); b.classList.remove('done'); }, 2000);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(ok, function () {});
    });
  });
})();
