// Motion layer: entrance, scroll reveal, count-up, smooth accordions, hover spotlight, progress bar.
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = root.getAttribute('data-motion') === 'reduced';
  root.classList.add('motion');

  // Motion toggle: full motion by default, opt-out is remembered and applied on reload
  var mt = document.getElementById('motionToggle');
  if (mt) {
    mt.setAttribute('aria-pressed', reduce ? 'true' : 'false');
    mt.addEventListener('click', function () {
      try { localStorage.setItem('motion', reduce ? 'full' : 'reduced'); } catch (e) {}
      location.reload();
    });
  }

  // Staggered entrance for the top of the page
  ['.cover', '.profile__avatar', '.profile__id p', '.overview .facts li', '.status', '.social a'].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) { el.classList.add('load'); });
  });
  document.querySelectorAll('.load').forEach(function (el, i) { el.style.setProperty('--i', i); });

  // Name: letter-by-letter
  var h1 = document.querySelector('.profile h1');
  if (h1) {
    var name = h1.textContent;
    h1.setAttribute('aria-label', name);
    h1.textContent = '';
    Array.prototype.forEach.call(name, function (c, i) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = c === ' ' ? ' ' : c;
      s.style.setProperty('--c', i);
      h1.appendChild(s);
    });
  }

  // Pipeline: stages pop in, wire draws, then switches back to dashed
  document.querySelectorAll('.stage').forEach(function (g, i) { g.style.setProperty('--s', i); });
  document.querySelectorAll('.wire').forEach(function (w) {
    w.addEventListener('animationend', function () { w.classList.add('drawn'); });
  });

  // Typed tagline
  var tag = document.querySelector('.profile__id p');
  if (tag && !reduce) {
    var full = tag.textContent;
    tag.textContent = ' ';
    tag.classList.add('typed');
    var k = 0;
    setTimeout(function type() {
      tag.textContent = full.slice(0, ++k);
      if (k < full.length) setTimeout(type, 28);
    }, 1000);
  }

  // Scroll reveal
  var targets = document.querySelectorAll('.block > h2, .prose li, .stack > div, .org, .certs li, .subhead, .lead, .actions, .footer');
  targets.forEach(function (el) {
    el.classList.add('reveal');
    var idx = Array.prototype.indexOf.call(el.parentElement.children, el);
    el.style.setProperty('--i', Math.min(idx, 6));
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }

  // Count-up impact stats
  function countUp(dd) {
    var m = dd.textContent.match(/^(~?)([\d.]+)(.*)$/);
    if (!m || reduce) return;
    var end = parseFloat(m[2]), dec = (m[2].split('.')[1] || '').length, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - p, 3);
      dd.textContent = m[1] + (end * e).toFixed(dec) + m[3];
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.querySelectorAll('dd').forEach(countUp); so.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.stats').forEach(function (s) { so.observe(s); });
  }

  // Smooth open/close for experience & education
  document.querySelectorAll('details.role').forEach(function (d) {
    var sum = d.querySelector('summary'), body = d.querySelector('.role__body');
    sum.addEventListener('click', function (ev) {
      if (reduce || !body.animate) return;
      ev.preventDefault();
      if (d.open) {
        var a = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 260, easing: 'ease' });
        a.onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        body.animate([{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }], { duration: 320, easing: 'ease' });
      }
    });
  });

  // Cursor spotlight on social links
  document.querySelectorAll('.social a').forEach(function (a) {
    a.addEventListener('pointermove', function (e) {
      var r = a.getBoundingClientRect();
      a.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      a.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Scroll progress bar + active nav link
  var bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
    var cur = null;
    links.forEach(function (l) {
      var s = document.querySelector(l.getAttribute('href'));
      if (s && s.getBoundingClientRect().top < 120) cur = l;
    });
    links.forEach(function (l) { l.classList.toggle('active', l === cur); });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
