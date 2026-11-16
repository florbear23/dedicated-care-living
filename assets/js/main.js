/*
  Dedicated Care Living: site behavior
  - scroll progress bar, sticky header state, back-to-top
  - reveal-on-scroll with stagger
  - subtle parallax on the hero shapes and photo bands
  - mobile menu
  - contact form validation and success state
  - background video plays only while visible
*/
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = doc.querySelector('header');
  var vh = window.innerHeight;

  /* ---------- progress bar and back to top ---------- */
  var bar = doc.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  doc.body.appendChild(bar);

  var topBtn = doc.createElement('button');
  topBtn.type = 'button';
  topBtn.className = 'to-top';
  topBtn.setAttribute('aria-label', 'Back to top');
  topBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V6M5.5 12.5L12 6l6.5 6.5"/></svg>';
  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  doc.body.appendChild(topBtn);

  /* ---------- parallax targets ---------- */
  var shapes = [];
  var heroSection = doc.querySelector('main > section');
  if (heroSection) {
    var circles = heroSection.querySelectorAll(':scope > div[style*="border-radius:50%"]');
    for (var i = 0; i < circles.length; i++) {
      shapes.push({ el: circles[i], speed: i % 2 === 0 ? 0.14 : -0.08 });
    }
  }
  var bands = [];
  var bandImgs = doc.querySelectorAll('main section > img[style*="position:absolute"][style*="inset:0"]');
  for (var b = 0; b < bandImgs.length; b++) {
    bandImgs[b].style.willChange = 'transform';
    bands.push(bandImgs[b]);
  }

  function parallax(y) {
    for (var i = 0; i < shapes.length; i++) {
      if (y < 900) shapes[i].el.style.transform = 'translate3d(0,' + (y * shapes[i].speed).toFixed(1) + 'px,0)';
    }
    for (var j = 0; j < bands.length; j++) {
      var sec = bands[j].parentNode;
      var r = sec.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      bands[j].style.transform = 'scale(1.14) translate3d(0,' + (p * -46).toFixed(1) + 'px,0)';
    }
  }

  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || root.scrollTop;
    var max = root.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0).toFixed(4) + ')';
    if (header) header.classList.toggle('scrolled', y > 24);
    topBtn.classList.toggle('show', y > 700);
    if (!reduce) parallax(y);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; onScroll(); });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var sel = [
      'main section h2', 'main section h2 + p', 'main .card', 'main .irow', 'main .faq',
      'main .stepcard', 'main .grow', 'main .row', 'main form', 'main section details',
      'main section img:not(.bgvid)', 'main section blockquote'
    ].join(',');
    var nodes = doc.querySelectorAll(sel);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        el.classList.add('in');
        // hand control back to normal CSS (hover transitions) once the reveal is done
        window.setTimeout(function () {
          el.classList.remove('rv', 'rv-img', 'in');
          el.style.removeProperty('--d');
        }, 1500);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    for (var n = 0; n < nodes.length; n++) {
      var el = nodes[n];
      // the hero already animates itself, and absolute band photos use parallax instead
      if (el.closest('.rise, .rise2')) continue;
      if (el.tagName === 'IMG' && /position:absolute/.test(el.getAttribute('style') || '') && /inset:0/.test(el.getAttribute('style') || '')) continue;
      if (el.closest('.card') && el !== el.closest('.card')) continue;
      if (el.closest('header, footer')) continue;
      if (el.matches('img') && el.closest('.card')) continue;
      var idx = 0, s = el.previousElementSibling;
      while (s && idx < 6) { idx++; s = s.previousElementSibling; }
      el.style.setProperty('--d', (Math.min(idx, 5) * 0.09).toFixed(2) + 's');
      el.classList.add('rv');
      if (el.tagName === 'IMG') el.classList.add('rv-img');
      io.observe(el);
    }
  }

  /* ---------- mobile menu ---------- */
  var nav = header && header.querySelector('nav');
  if (nav) {
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'menu-btn';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    nav.parentNode.insertBefore(btn, nav);
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
    // mark the current page
    var here = location.pathname.split('/').pop() || 'index.html';
    nav.querySelectorAll('a').forEach(function (a) {
      var h = (a.getAttribute('href') || '').split('#')[0];
      if (h && h === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* ---------- background video: play only while visible ---------- */
  var vids = doc.querySelectorAll('video.bgvid');
  if (vids.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.15 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* ---------- contact form ---------- */
  doc.querySelectorAll('form').forEach(function (form) {
    form.querySelectorAll('input, select, textarea').forEach(function (f) {
      if (!f.name && f.id) f.name = f.id.replace(/^(f|h)-/, '');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var get = function (suffix) {
        var f = form.querySelector('[id$="-' + suffix + '"]');
        return f ? f.value.trim() : '';
      };
      var name = get('name'), phone = get('phone'), email = get('email');
      var problems = [];
      if (!name) problems.push('your name');
      if (!phone && !email) problems.push('a phone number or an email');
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) problems.push('a valid email');
      var old = form.querySelector('.form-msg');
      if (old) old.remove();
      if (problems.length) {
        var msg = doc.createElement('p');
        msg.className = 'form-msg err';
        msg.setAttribute('role', 'alert');
        msg.textContent = 'Please add ' + problems.join(' and ') + ' so we can reach you.';
        form.insertBefore(msg, form.querySelector('button[type="submit"]'));
        return;
      }

      /* Form delivery: set window.DCL_FORM_ENDPOINT in config.js to a service that emails
         submissions to info@dedicatedcareliving.com (GHL, Formspree, or similar). */
      var endpoint = window.DCL_FORM_ENDPOINT;
      var finish = function () {
        form.innerHTML =
        '<div class="form-done"><div class="tick"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#AD419A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
        '<h3 style="margin:0;font-family:Fraunces,Georgia,serif;font-weight:600;font-size:30px;color:#112337">Thank you, ' + name.replace(/[<>&]/g, '') + '.</h3>' +
        '<p style="margin:12px 0 0;font-size:18px;line-height:1.6">We received your message and will be in touch soon. If it is urgent, call <a href="tel:+14085338735" style="font-weight:800;color:#8F2E7E">(408) 533-8735</a>.</p></div>';
      };
      if (!endpoint) { finish(); return; }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
      var data = new FormData(form);
      data.append('recipient', window.DCL_FORM_RECIPIENT || '');
      data.append('page', location.pathname);
      fetch(endpoint, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('bad'); finish(); })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = 'Send message'; }
          var e = doc.createElement('p');
          e.className = 'form-msg err';
          e.setAttribute('role', 'alert');
          e.innerHTML = 'Sorry, that did not send. Please call <a href="tel:+14085338735" style="font-weight:800;color:#8F2E7E">(408) 533-8735</a>.';
          form.insertBefore(e, btn);
        });
    });
  });

  /* ---------- analytics: GA4 only, loads once a real ID is set in config.js ---------- */
  var ga = window.DCL_GA_ID;
  if (ga && ga.indexOf('XXXX') === -1) {
    var gs = doc.createElement('script');
    gs.async = true;
    gs.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga);
    doc.head.appendChild(gs);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ga);
  }
})();
