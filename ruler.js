// ruler.js — scroll ruler in the left gutter (wide screens only).
// Ticks map the whole page; long ticks mark sections. A pointer tracks the scroll position, nearby ticks swell like a magnifier, and clicking or
// dragging on the ruler scrubs through the page.
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = root.getAttribute('data-motion') === 'reduced';
  var SECTIONS = [
    ['top', 'intro'], ['about', 'about'], ['stack', 'stack'],
    ['experience', 'experience'], ['education', 'education'], ['contact', 'contact']
  ];
  var COUNT = 64;

  var el = document.createElement('nav');
  el.className = 'ruler';
  el.setAttribute('aria-label', 'Page position');
  el.innerHTML =
    '<div class="ruler__track"></div>' +
    '<div class="ruler__pointer" aria-hidden="true"><span class="ruler__tri"></span><span class="ruler__read mono">00%</span></div>' +
    '<div class="ruler__ghost" aria-hidden="true"></div>';
  document.body.appendChild(el);
  var track = el.querySelector('.ruler__track');
  var pointer = el.querySelector('.ruler__pointer');
  var readout = el.querySelector('.ruler__read');
  var ghost = el.querySelector('.ruler__ghost');

  var ticks = [];
  for (var i = 0; i < COUNT; i++) {
    var t = document.createElement('span');
    t.className = 'ruler__tick';
    t.style.top = (i / (COUNT - 1)) * 100 + '%';
    track.appendChild(t);
    ticks.push(t);
  }

  var labels = [];
  SECTIONS.forEach(function (s, n) {
    var target = document.getElementById(s[0]);
    if (!target) return;
    var a = document.createElement('a');
    a.className = 'ruler__label mono';
    a.href = '#' + s[0];
    a.innerHTML = '<b>' + String(n + 1).padStart(2, '0') + '</b> ' + s[1];
    track.appendChild(a);
    labels.push({ a: a, target: target, f: 0 });
  });

  var H = 0, maxScroll = 1, cur = 0, goal = 0, raf = 0, hoverY = -1;

  function measure() {
    H = track.getBoundingClientRect().height;
    maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    ticks.forEach(function (t) { t.classList.remove('is-major'); });
    labels.forEach(function (l) {
      var y = l.target.getBoundingClientRect().top + scrollY - 70;
      l.f = Math.min(1, Math.max(0, y / maxScroll));
      var idx = Math.round(l.f * (COUNT - 1));
      ticks.forEach(function (t, k) { if (k === idx) t.classList.add('is-major'); });
    });
    // Lay labels out in px with a minimum gap so they never overlap
    var GAP = 22, ys = labels.map(function (l) { return l.f * H; });
    for (var a = 1; a < ys.length; a++) ys[a] = Math.max(ys[a], ys[a - 1] + GAP);
    var over = ys.length ? ys[ys.length - 1] - H : 0;
    if (over > 0) {
      ys[ys.length - 1] = H;
      for (var b = ys.length - 2; b >= 0; b--) ys[b] = Math.min(ys[b], ys[b + 1] - GAP);
    }
    labels.forEach(function (l, n) { l.a.style.top = ys[n] + 'px'; });
  }

  function paint(f) {
    var y = f * H;
    pointer.style.transform = 'translateY(' + y + 'px)';
    readout.textContent = String(Math.round(f * 100)).padStart(2, '0') + '%';
    var py = y;
    for (var k = 0; k < COUNT; k++) {
      var ty = (k / (COUNT - 1)) * H;
      var d = Math.abs(ty - py);
      var mag = Math.max(0, 1 - d / 46);
      if (hoverY >= 0) mag = Math.max(mag, Math.max(0, 1 - Math.abs(ty - hoverY) / 34) * 0.7);
      ticks[k].style.setProperty('--m', mag.toFixed(3));
    }
    var active = null;
    labels.forEach(function (l) { if (f >= l.f - 0.01) active = l; });
    labels.forEach(function (l) { l.a.classList.toggle('is-active', l === active); });
  }

  function loop() {
    raf = 0;
    cur += (goal - cur) * (reduce ? 1 : 0.18);
    if (Math.abs(goal - cur) < 0.0005) cur = goal;
    paint(cur);
    if (cur !== goal) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  function onScroll() { goal = Math.min(1, Math.max(0, scrollY / maxScroll)); kick(); }

  // Scrub: click or drag along the ruler
  var dragging = false;
  function fracFromEvent(e) {
    var r = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
  }
  el.addEventListener('pointermove', function (e) {
    var r = track.getBoundingClientRect();
    hoverY = e.clientY - r.top;
    ghost.style.transform = 'translateY(' + Math.min(H, Math.max(0, hoverY)) + 'px)';
    el.classList.add('is-hover');
    if (dragging) scrollTo({ top: fracFromEvent(e) * maxScroll, behavior: 'auto' });
    kick(); paint(cur);
  });
  el.addEventListener('pointerleave', function () { hoverY = -1; el.classList.remove('is-hover'); paint(cur); });
  track.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.ruler__label')) return;
    dragging = true;
    track.setPointerCapture(e.pointerId);
    scrollTo({ top: fracFromEvent(e) * maxScroll, behavior: reduce ? 'auto' : 'smooth' });
  });
  track.addEventListener('pointerup', function () { dragging = false; });

  measure(); onScroll(); cur = goal; paint(cur);
  addEventListener('scroll', onScroll, { passive: true });
  var rt;
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { measure(); onScroll(); }, 100); });
  addEventListener('load', function () { measure(); onScroll(); });
  // Accordions change page height
  document.querySelectorAll('details').forEach(function (d) {
    d.addEventListener('toggle', function () { setTimeout(function () { measure(); onScroll(); }, 350); });
  });
})();
