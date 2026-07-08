/* ============================================================
   PAINTSPACE — motion system
   1. Heading / copy reveals (IntersectionObserver)
   2. Scroll-linked parallax on environment imagery
   3. Process journey: measured line draws as the method advances
   4. Signature: pigment disperses, then settles into the commission
   Atmospheric drift shapes run in CSS. Everything degrades to a
   calm, complete static page under prefers-reduced-motion.
   ============================================================ */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- masthead state ---------------- */

  var masthead = document.getElementById('masthead');
  function mastheadState() {
    masthead.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', mastheadState, { passive: true });
  mastheadState();

  /* ---------------- mobile navigation ---------------- */

  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  toggle.addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });

  /* ---------------- active section in the frame ---------------- */

  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var watched = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);
  var hero = document.getElementById('hero');
  if (hero) watched.push(hero);

  if ('IntersectionObserver' in window && watched.length) {
    var sectionSpy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    watched.forEach(function (el) { sectionSpy.observe(el); });
  }

  /* ---------------- reveals: headings and copy ---------------- */

  var revealables = document.querySelectorAll('.reveal, .hero-title, .arch-type, .env-intro-title, .env-name, .process-title, .commission-title, .practice-title, .enquiry-title, .strip-line');

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    revealables.forEach(function (el) { revealer.observe(el); });
  }

  /* ---------------- parallax: layered depth on environments ---------------- */

  if (!reducedMotion) {
    var layers = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'))
      .map(function (el) {
        return { el: el, factor: parseFloat(el.getAttribute('data-parallax')) || 0.15 };
      });

    var ticking = false;
    function parallax() {
      ticking = false;
      var vh = window.innerHeight;
      layers.forEach(function (l) {
        var host = l.el.parentElement;
        var rect = host.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var progress = (rect.top + rect.height / 2 - vh / 2) / (vh + rect.height);
        l.el.style.transform = 'translate3d(0,' + (progress * l.factor * -2 * vh).toFixed(1) + 'px,0)';
      });
    }
    function requestParallax() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(parallax);
      }
    }
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax);
    parallax();
  }

  /* ---------------- process: the method advances ---------------- */

  var track = document.getElementById('process-track');
  var lineFill = document.getElementById('process-line-fill');
  var steps = document.querySelectorAll('.step');

  if (!reducedMotion && track && lineFill) {
    var lineTicking = false;
    function drawLine() {
      lineTicking = false;
      var rect = track.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh * 0.72 - rect.top) / rect.height;
      progress = Math.max(0, Math.min(1, progress));
      lineFill.style.transform = 'scaleY(' + progress.toFixed(3) + ')';
    }
    window.addEventListener('scroll', function () {
      if (!lineTicking) {
        lineTicking = true;
        window.requestAnimationFrame(drawLine);
      }
    }, { passive: true });
    drawLine();

    var stepSpy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          stepSpy.unobserve(entry.target);
        }
      });
    }, { threshold: 0.55 });
    steps.forEach(function (s) { stepSpy.observe(s); });
  } else {
    steps.forEach(function (s) { s.classList.add('on'); });
    if (lineFill) lineFill.style.transform = 'scaleY(1)';
  }

  /* ---------------- signature: pigment settles into a painted line ----------------
     Decorative layer behind the evidence section head, never a block of its
     own. Governed rule: pigment begins dispersed across the ground (the
     unresolved room), each grain is drawn toward its place in one horizontal
     painted stroke beneath the copy — the moment the commission exists — and
     damps to rest. Runs once, when the section is reached. Under reduced
     motion the settled stroke is painted immediately. */

  var canvas = document.getElementById('pigment');

  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var palette = ['#d8451f', '#dfa32e', '#1e8a5b', '#dfa1a8', '#9ac7d8', '#ece4d4', '#b03514'];
    var grains = [];
    var settled = false;
    var running = false;
    var band = null;

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      /* the settled stroke: one painted line low in the section head */
      band = { x: w * 0.03, y: h - 128, w: w * 0.94, h: 34 };
    }

    function seedGrains() {
      grains = [];
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      var count = Math.min(420, Math.round(w / 3));
      for (var i = 0; i < count; i++) {
        /* target: a settled position along the painted stroke; density
           thins toward the stroke's ragged right end, like a brush lifting */
        var t = Math.pow(Math.random(), 0.8);
        var tx = band.x + t * band.w;
        var ty = band.y + (Math.random() + Math.random()) * 0.5 * band.h;
        grains.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 1.6,
          vy: (Math.random() - 0.5) * 1.6,
          tx: tx,
          ty: ty,
          r: 0.6 + Math.random() * 1.6,
          c: palette[Math.floor(Math.random() * palette.length)]
        });
      }
    }

    function paintSettled() {
      sizeCanvas();
      seedGrains();
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      grains.forEach(function (g) {
        ctx.fillStyle = g.c;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(g.tx, g.ty, g.r * 2, g.r * 2);
      });
      ctx.globalAlpha = 1;
      settled = true;
    }

    function tick() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      var kinetic = 0;

      grains.forEach(function (g) {
        /* spring toward the settled position, damped: disperse → settle */
        g.vx += (g.tx - g.x) * 0.0075;
        g.vy += (g.ty - g.y) * 0.0075;
        g.vx *= 0.94;
        g.vy *= 0.94;
        g.x += g.vx;
        g.y += g.vy;
        kinetic += Math.abs(g.vx) + Math.abs(g.vy);

        ctx.fillStyle = g.c;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(g.x, g.y, g.r * 2, g.r * 2);
      });
      ctx.globalAlpha = 1;

      if (kinetic / grains.length < 0.035) {
        /* rest state reached: the stroke holds */
        grains.forEach(function (g) {
          ctx.fillStyle = g.c;
          ctx.globalAlpha = 0.7;
          ctx.fillRect(g.tx, g.ty, g.r * 2, g.r * 2);
        });
        ctx.globalAlpha = 1;
        settled = true;
        running = false;
        return;
      }
      window.requestAnimationFrame(tick);
    }

    function begin() {
      if (running || settled) return;
      running = true;
      sizeCanvas();
      seedGrains();
      window.requestAnimationFrame(tick);
    }

    if (reducedMotion || !('IntersectionObserver' in window)) {
      paintSettled();
    } else {
      var pigmentSpy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            begin();
            pigmentSpy.unobserve(canvas);
          }
        });
      }, { threshold: 0.35 });
      pigmentSpy.observe(canvas);
    }

    window.addEventListener('resize', function () {
      if (settled) paintSettled();
    });
  }

})();
