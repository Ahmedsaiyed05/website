// fx.js — CI/CD conveyor belt cover, brand logos on skill chips, animated footer wordmark.
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = root.getAttribute('data-motion') === 'reduced';

  /* ------------------------------------------------------------------
     1. Brand logos beside skills (local Simple Icons SVGs, CC0)
     ------------------------------------------------------------------ */
  var ICONS = {
    'AWS': ['amazonaws', '#FF9900'], 'GCP': ['googlecloud', '#4285F4'], 'Cloud Run': ['googlecloud', '#4285F4'],
    'Hetzner': ['hetzner', '#D50C2D'], 'DigitalOcean': ['digitalocean', '#0080FF'], 'Cloudflare': ['cloudflare', '#F38020'],
    'Cloudflare Workers': ['cloudflare', '#F38020'], 'Vercel': ['vercel', null], 'Render': ['render', '#46E3B7'],
    'Railway': ['railway', null], 'GitHub Actions': ['githubactions', '#2088FF'], 'GitLab CI': ['gitlab', '#FC6D26'],
    'Jenkins': ['jenkins', '#D24939'], 'Terraform': ['terraform', '#844FBA'], 'Ansible': ['ansible', '#EE0000'],
    'Docker': ['docker', '#2496ED'], 'PM2': ['pm2', null], 'IAM': ['amazoniam', '#DD344C'],
    'GuardDuty': ['amazonaws', '#FF9900'], 'CloudTrail': ['amazonaws', '#FF9900'], 'KMS': ['amazonaws', '#FF9900'],
    'Inspector': ['amazonaws', '#FF9900'], 'Trivy': ['trivy', '#5B8CFF'], 'Snyk': ['snyk', null],
    'SonarQube': ['sonarqube', '#4E9BCD'], 'Linux': ['linux', '#FCC624'], 'Nginx': ['nginx', '#009639'],
    'Apache': ['apache', '#D22128'], 'IIS': ['microsoft', null], 'Route 53': ['amazonroute53', '#8C4FFF'],
    'Bash': ['gnubash', '#4EAA25'], 'Python': ['python', '#3776AB'], 'Node.js': ['nodedotjs', '#339933'],
    'Git': ['git', '#F05032'], 'n8n': ['n8n', '#EA4B71'], 'Zapier': ['zapier', '#FF4F00'],
    'AWS EC2': ['amazonec2', '#FF9900'], 'EC2': ['amazonec2', '#FF9900']
  };
  document.querySelectorAll('.chip').forEach(function (chip) {
    var hit = ICONS[chip.textContent.trim()];
    if (!hit) return;
    var i = document.createElement('span');
    i.className = 'ico';
    i.setAttribute('aria-hidden', 'true');
    i.style.setProperty('--src', 'url("assets/icons/' + hit[0] + '.svg")');
    if (hit[1]) i.style.setProperty('--c', hit[1]);
    chip.insertBefore(i, chip.firstChild);
    chip.classList.add('chip--logo');
  });

  /* ------------------------------------------------------------------
     2. CI/CD conveyor belt
     ------------------------------------------------------------------ */
  var canvas = document.getElementById('belt');
  if (canvas && canvas.getContext) belt(canvas);

  function belt(cv) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1, small = false;
    var C = {};
    function readColors() {
      var s = getComputedStyle(root);
      ['--bg', '--fg', '--muted', '--line', '--chip', '--ok'].forEach(function (k) { C[k.slice(2)] = s.getPropertyValue(k).trim(); });
      C.bad = root.getAttribute('data-theme') === 'light' ? '#dc2626' : '#f87171';
    }
    readColors();
    new MutationObserver(function () { readColors(); if (reduce) draw(0); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    var MONO = '"Geist Mono", ui-monospace, monospace';
    var COMMITS = [
      'feat(infra): terraform vpc module', 'fix(nginx): raise proxy timeout', 'ci: cache docker layers',
      'chore(deps): bump base image', 'feat: cloud run autoscaling', 'fix(iam): least-privilege role',
      'perf: gzip static assets', 'feat: n8n alert webhook', 'fix(pm2): restart on oom',
      'ci: add sonarqube quality gate', 'feat: cloudflare waf rules', 'refactor: ansible roles'
    ];
    var FAILS = {
      test: ['2 failing tests', 'lint errors', 'test timeout'],
      scan: ['trivy: 1 HIGH CVE', 'secret detected', 'snyk: vulnerable dep']
    };
    var GATES = [
      { key: 'build', label: 'build', f: 0.27 },
      { key: 'test', label: 'test', f: 0.46 },
      { key: 'scan', label: 'scan', f: 0.64 },
      { key: 'deploy', label: 'deploy', f: 0.82 }
    ];
    GATES.forEach(function (g) { g.flash = 0; g.ok = true; });

    var pkgs = [], logs = [], deployed = 0, rejected = 0, spawnT = 0, tread = 0, prodPulse = 0, nextHash = 0;

    function hash() {
      nextHash = (nextHash + 0x9e3779b1) >>> 0;
      return ('000000' + ((nextHash ^ (Date.now() & 0xffffff)) >>> 0).toString(16)).slice(-6);
    }
    function log(icon, text, kind) {
      logs.unshift({ icon: icon, text: text, kind: kind, age: 0 });
      if (logs.length > 4) logs.length = 4;
    }
    function makePkg(x) {
      var r = Math.random();
      var p = {
        id: hash(), msg: COMMITS[Math.floor(Math.random() * COMMITS.length)],
        x: x, y: 0, vy: 0, rot: 0, vr: 0, alpha: 1,
        failAt: r < 0.2 ? 'test' : r < 0.32 ? 'scan' : null,
        passed: {}, state: 'ride', scale: 1
      };
      return p;
    }

    function layout() {
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height; small = W < 560;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    var beltY = function () { return Math.round(H * 0.58); };
    var pw = function () { return small ? 44 : 58; };
    var ph = function () { return small ? 16 : 18; };
    var startX = function () { return W * 0.09; };
    var endX = function () { return W * 0.955; };
    var speed = function () { return Math.max(46, W / 13); };

    function seed() {
      pkgs = [];
      var xs = [0.18, 0.38, 0.56, 0.74];
      xs.forEach(function (f) {
        var p = makePkg(W * f);
        p.failAt = null;
        GATES.forEach(function (g) { if (W * g.f < p.x) p.passed[g.key] = true; });
        pkgs.push(p);
      });
      log('→', 'watching main · ' + (small ? '' : 'ahmedsaiyed/infra'), 'info');
    }

    function update(dt) {
      var v = speed();
      tread = (tread + v * dt) % 14;
      spawnT -= dt;
      var crowded = pkgs.some(function (q) { return q.state === 'ride' && q.x < startX() + pw() + 14; });
      if (spawnT <= 0 && !crowded) {
        spawnT = (small ? 2.0 : 1.55) + Math.random() * 0.6;
        var p = makePkg(startX());
        pkgs.push(p);
        log('→', p.id + ' ' + (small ? p.msg.split(':')[0] : p.msg), 'info');
      }
      GATES.forEach(function (g) { g.flash = Math.max(0, g.flash - dt * 2.2); });
      prodPulse = Math.max(0, prodPulse - dt * 2);
      logs.forEach(function (l) { l.age += dt; });

      for (var i = pkgs.length - 1; i >= 0; i--) {
        var p = pkgs[i];
        if (p.state === 'ride') {
          p.x += v * dt;
          for (var k = 0; k < GATES.length; k++) {
            var g = GATES[k], gx = W * g.f;
            if (!p.passed[g.key] && p.x >= gx) {
              p.passed[g.key] = true;
              g.flash = 1;
              if (p.failAt === g.key) {
                g.ok = false;
                p.state = 'reject'; p.vy = -60; p.vr = (Math.random() - 0.5) * 6; rejected++;
                var why = FAILS[g.key][Math.floor(Math.random() * FAILS[g.key].length)];
                log('✗', p.id + ' rejected · ' + why, 'bad');
              } else {
                g.ok = true;
                if (g.key === 'test') log('✓', p.id + ' tests ' + (40 + (p.id.charCodeAt(0) % 9)) + '/' + (40 + (p.id.charCodeAt(0) % 9)) + ' passed', 'ok');
                else if (g.key === 'scan') log('✓', p.id + ' scan clean · 0 vulns', 'ok');
                else if (g.key === 'deploy') log('↑', p.id + ' deployed → prod', 'ok');
              }
              break;
            }
          }
          if (p.x >= endX() - 6) { p.state = 'ship'; }
        } else if (p.state === 'reject') {
          p.vy += 520 * dt; p.y += p.vy * dt; p.x += v * 0.25 * dt; p.rot += p.vr * dt;
          p.alpha -= dt * 0.9;
          if (p.alpha <= 0) pkgs.splice(i, 1);
        } else if (p.state === 'ship') {
          p.scale -= dt * 3; p.x += v * 0.3 * dt;
          if (p.scale <= 0.1) { pkgs.splice(i, 1); deployed++; prodPulse = 1; }
        }
      }
    }

    function rr(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function mix(a, b, t) { return t <= 0 ? a : t >= 1 ? b : null; }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var by = beltY(), bh = small ? 12 : 14, x0 = startX() - 26, x1 = endX() + 4;

      // belt body + moving tread
      ctx.lineWidth = 1;
      rr(x0, by, x1 - x0, bh, bh / 2);
      ctx.fillStyle = C.chip; ctx.fill(); ctx.strokeStyle = C.muted; ctx.globalAlpha = 0.6; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.save(); rr(x0, by, x1 - x0, bh, bh / 2); ctx.clip();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.5;
      for (var tx = x0 - 14 + tread; tx < x1; tx += 14) { ctx.beginPath(); ctx.moveTo(tx, by + 2); ctx.lineTo(tx - 5, by + bh - 2); ctx.stroke(); }
      ctx.restore();
      // rollers
      [x0 + bh / 2, x1 - bh / 2].forEach(function (cx) {
        ctx.beginPath(); ctx.arc(cx, by + bh / 2, bh / 2 - 2, 0, Math.PI * 2); ctx.strokeStyle = C.muted; ctx.stroke();
        ctx.beginPath(); var a = (tread / 14) * Math.PI * 2;
        ctx.moveTo(cx, by + bh / 2); ctx.lineTo(cx + Math.cos(a) * (bh / 2 - 2), by + bh / 2 + Math.sin(a) * (bh / 2 - 2)); ctx.stroke();
      });

      // source repo
      ctx.font = '500 ' + (small ? 9 : 10) + 'px ' + MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = C.muted;
      ctx.fillText('git push', startX() - 4, by + bh + 14);

      // gates
      GATES.forEach(function (g) {
        var gx = Math.round(W * g.f) + 0.5, top = by - (small ? 30 : 36), gw = small ? 28 : 36;
        var col = g.flash > 0 ? (g.ok ? C.ok : C.bad) : C.muted;
        ctx.strokeStyle = col; ctx.lineWidth = g.flash > 0 ? 1.5 : 1; ctx.globalAlpha = g.flash > 0 ? 1 : 0.75;
        ctx.beginPath();
        ctx.moveTo(gx - gw / 2, by + bh + 3); ctx.lineTo(gx - gw / 2, top); ctx.lineTo(gx + gw / 2, top); ctx.lineTo(gx + gw / 2, by + bh + 3);
        ctx.stroke();
        // scanning beam
        if (g.flash > 0) {
          ctx.globalAlpha = g.flash * 0.18; ctx.fillStyle = col;
          ctx.fillRect(gx - gw / 2, top, gw, by - top);
        }
        ctx.globalAlpha = 1;
        // light
        ctx.beginPath(); ctx.arc(gx, top, 3, 0, Math.PI * 2);
        ctx.fillStyle = g.flash > 0 ? col : C.bg; ctx.fill(); ctx.strokeStyle = col; ctx.stroke();
        ctx.fillStyle = g.flash > 0 ? col : C.fg;
        ctx.fillText(g.label, gx, top - 12);
      });

      // prod
      var px = endX() + (small ? 6 : 10), pyc = by + bh / 2;
      ctx.textAlign = 'left';
      ctx.fillStyle = C.ok; ctx.globalAlpha = 0.25 + prodPulse * 0.75;
      ctx.beginPath(); ctx.arc(px + 4, pyc - 16, 3 + prodPulse * 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      if (!small) { ctx.fillStyle = C.ok; ctx.fillText('prod', px - 8, pyc - 30); }

      // packages
      var w = pw(), h = ph();
      pkgs.forEach(function (p) {
        ctx.save();
        var cx = p.x, cy = by - h / 2 - 1 + p.y;
        ctx.translate(cx, cy); ctx.rotate(p.rot); ctx.scale(p.scale, p.scale);
        ctx.globalAlpha = Math.max(0, p.alpha);
        var tested = p.passed.test && p.state !== 'reject';
        var deployedish = p.passed.deploy && p.state !== 'reject';
        rr(-w / 2, -h / 2, w, h, 3);
        ctx.fillStyle = p.state === 'reject' ? C.bad : deployedish ? C.ok : C.bg;
        ctx.globalAlpha *= p.state === 'reject' ? 0.2 : deployedish ? 0.22 : 1;
        ctx.fill();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.strokeStyle = p.state === 'reject' ? C.bad : tested ? C.ok : C.fg;
        ctx.lineWidth = 1; ctx.stroke();
        // little code lines inside the parcel
        ctx.fillStyle = ctx.strokeStyle;
        ctx.font = '500 ' + (small ? 8 : 9) + 'px ' + MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.state === 'reject' ? '✗ ' + p.id.slice(0, small ? 4 : 5) : p.id, 0, 0.5);
        ctx.restore();
      });

      // log console (top-left)
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.font = '400 ' + (small ? 9.5 : 11) + 'px ' + MONO;
      var lx = small ? 12 : 18, ly = small ? 20 : 24, lh = small ? 13 : 15, maxL = small ? 3 : 4;
      logs.slice(0, maxL).forEach(function (l, i) {
        ctx.globalAlpha = i === 0 ? 1 : Math.max(0.25, 0.75 - i * 0.2);
        ctx.fillStyle = l.kind === 'bad' ? C.bad : l.kind === 'ok' ? C.ok : C.muted;
        ctx.fillText(l.icon, lx, ly + i * lh);
        ctx.fillStyle = i === 0 ? C.fg : C.muted;
        ctx.fillText(l.text, lx + (small ? 12 : 14), ly + i * lh);
      });
      ctx.globalAlpha = 1;

      // counters (top-right)
      ctx.textAlign = 'right';
      ctx.font = '400 ' + (small ? 9.5 : 11) + 'px ' + MONO;
      ctx.fillStyle = C.ok; ctx.fillText('● ' + deployed + ' shipped', W - (small ? 12 : 18), small ? 20 : 24);
      ctx.fillStyle = C.bad; ctx.fillText('✗ ' + rejected + ' rejected', W - (small ? 12 : 18), (small ? 20 : 24) + lh);
      ctx.fillStyle = C.muted; ctx.globalAlpha = 0.8;
      ctx.font = '400 10px ' + MONO;
      ctx.fillText('PIPELINE_01 · main', W - (small ? 12 : 18), H - 12);
      ctx.globalAlpha = 1;
    }

    layout(); seed();
    var visible = true, last = 0, raf = 0;
    function frame(t) {
      raf = 0;
      if (!visible) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } }

    if (reduce) {
      log('✓', pkgs[2].id + ' tests passed', 'ok'); log('↑', pkgs[3].id + ' deployed → prod', 'ok');
      draw();
    } else {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(cv);
      }
      start();
    }
    var rt;
    addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { var oldW = W; layout(); if (Math.abs(oldW - W) > 40) seed(); draw(); }, 120);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(); });
  }

  /* ------------------------------------------------------------------
     3. Footer wordmark: light that follows the cursor, wanders when idle
     ------------------------------------------------------------------ */
  var wm = document.querySelector('.wordmark');
  var spot = document.getElementById('wmSpot');
  if (wm && spot) {
    var tx = 300, ty = 120, cx = 300, cy = 120, idle = true, t0 = performance.now(), wmVisible = false, wraf = 0;
    function toSvg(e) {
      var r = wm.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 1000;
      ty = ((e.clientY - r.top) / r.height) * 220;
    }
    wm.addEventListener('pointermove', function (e) { idle = false; toSvg(e); });
    wm.addEventListener('pointerleave', function () { idle = true; });
    function loop(t) {
      wraf = 0;
      if (!wmVisible) return;
      if (idle) {
        var s = (t - t0) / 1000;
        tx = 500 + Math.sin(s * 0.55) * 420;
        ty = 120 + Math.sin(s * 1.1) * 50;
      }
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      spot.setAttribute('cx', cx.toFixed(1)); spot.setAttribute('cy', cy.toFixed(1));
      wraf = requestAnimationFrame(loop);
    }
    if (reduce) { spot.setAttribute('cx', 500); spot.setAttribute('cy', 120); }
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        wmVisible = es[0].isIntersecting;
        if (wmVisible && !wraf) wraf = requestAnimationFrame(loop);
      }).observe(wm);
    }
  }
})();
