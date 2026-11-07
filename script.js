// ahmedsaiyed.site — small progressive enhancements only; the page works without JS.
(function () {
  'use strict';
  var root = document.documentElement;

  // Theme toggle (initial theme is set inline in <head> to avoid a flash)
  var toggle = document.getElementById('themeToggle');
  function syncThemeColor() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', root.getAttribute('data-theme') === 'light' ? '#fafaf9' : '#0a0a0b');
  }
  syncThemeColor();
  if (toggle) toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeColor();
  });

  // Local time in Surat (IST) plus the offset from the visitor's clock
  var timeEl = document.getElementById('localTime');
  var diffEl = document.getElementById('timeDiff');
  function tick() {
    var now = new Date();
    if (timeEl) {
      timeEl.textContent = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
      }).format(now).toUpperCase();
    }
    if (diffEl) {
      var visitorOffset = -now.getTimezoneOffset(); // minutes east of UTC
      var delta = 330 - visitorOffset;               // IST is UTC+5:30
      if (delta === 0) { diffEl.textContent = '// same time'; }
      else {
        var h = Math.abs(delta) / 60;
        var label = (h % 1 === 0 ? h : h.toFixed(1)) + 'h';
        diffEl.textContent = '// ' + label + (delta > 0 ? ' ahead' : ' behind');
      }
    }
  }
  tick();
  setInterval(tick, 30000);

  // Time-of-day greeting (Surat time)
  var greet = document.querySelector('.greeting');
  if (greet) {
    var hr = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()));
    greet.textContent = hr < 5 ? 'Hello, night owl' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  }

  // Role durations, e.g. "1y 2m"
  function months(start, end) {
    var s = start.split('-').map(Number);
    var e = end ? end.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
    return Math.max(1, (e[0] - s[0]) * 12 + (e[1] - s[1]) + 1);
  }
  document.querySelectorAll('.dur[data-start]').forEach(function (el) {
    var m = months(el.dataset.start, el.dataset.end);
    var y = Math.floor(m / 12), r = m % 12;
    el.textContent = (y ? y + 'y ' : '') + (r ? r + 'm' : '').trim();
    el.textContent = el.textContent.trim();
  });

  // Copy email
  var copyBtn = document.getElementById('copyEmail');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var label = copyBtn.querySelector('span');
    var email = copyBtn.dataset.email;
    function done(text) { label.textContent = text; setTimeout(function () { label.textContent = 'Copy address'; }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () { done('Copied'); }, function () { done(email); });
    } else { done(email); }
  });

  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
