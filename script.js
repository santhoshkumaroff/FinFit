/* ==========================================================================
   FinFit — Architecture Evolution
   Vanilla JS: theme toggle, scroll progress, reveal-on-scroll, plan tabs,
   count-up scores, and the salary-day failure simulator.
   ========================================================================== */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Theme toggle ---------------- */
  (function initTheme() {
    var root = document.documentElement;
    var toggle = document.getElementById('themeToggle');
    var stored = null;
    try { stored = localStorage.getItem('finfit-theme'); } catch (e) { /* storage unavailable */ }

    var systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    var initial = stored || (systemPrefersLight ? 'light' : 'dark');
    applyTheme(initial);

    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      var next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem('finfit-theme', next); } catch (e) { /* ignore */ }
    });

    function applyTheme(mode) {
      if (mode === 'light') {
        root.setAttribute('data-theme', 'light');
        toggle.setAttribute('aria-pressed', 'true');
        toggle.setAttribute('aria-label', 'Switch to dark mode');
      } else {
        root.removeAttribute('data-theme');
        toggle.setAttribute('aria-pressed', 'false');
        toggle.setAttribute('aria-label', 'Switch to light mode');
      }
    }
  })();

  /* ---------------- Scroll progress bar ---------------- */
  (function initScrollProgress() {
    var bar = document.getElementById('navProgress');
    if (!bar) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var doc = document.documentElement;
        var scrollTop = doc.scrollTop || document.body.scrollTop;
        var scrollHeight = (doc.scrollHeight - doc.clientHeight) || 1;
        var pct = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
        bar.style.width = pct + '%';
        ticking = false;
      });
    }, { passive: true });
  })();

  /* ---------------- Reveal on scroll ---------------- */
  (function initReveal() {
    var targets = document.querySelectorAll(
      '.risk-card, .hybrid-callout, .analogy-card, .resp-card, .timeline-item, .flow-col, .score-card, .cost-table-wrap, .compare-table, .plan-toggle'
    );
    targets.forEach(function (el) { el.classList.add('reveal'); });

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    targets.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------- Count-up scores ---------------- */
  (function initCountUp() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;

    function animate(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      if (prefersReducedMotion) { el.textContent = target.toFixed(1); return; }

      var duration = 1100;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = (target * eased).toFixed(1);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(1);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(animate);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------- Plan toggle tabs ---------------- */
  (function initPlanToggle() {
    var buttons = document.querySelectorAll('.plan-toggle-btn');
    var panels = document.querySelectorAll('.plan-panel');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-plan');

        buttons.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        panels.forEach(function (p) {
          p.classList.toggle('is-hidden', p.getAttribute('data-panel') !== target);
        });
      });
    });
  })();

  /* ---------------- Salary-day failure simulator ---------------- */
  (function initSimulator() {
    var trigger = document.getElementById('simTrigger');
    var triggerLabel = document.getElementById('simTriggerLabel');
    if (!trigger) return;

    var existingEvents = document.getElementById('simEventsExisting');
    var newEvents = document.getElementById('simEventsNew');
    var existingStatus = document.getElementById('simStatusExisting');
    var newStatus = document.getElementById('simStatusNew');

    var existingScript = [
      { t: 300, tag: '[10:00:02]', text: '10,000 users open the app within the same window.', kind: '' },
      { t: 900, tag: '[10:00:05]', text: 'Direct DB connections climb — no pooling layer beyond default.', kind: 'warn' },
      { t: 1500, tag: '[10:00:09]', text: 'Postgres connection limit reached. New requests refused.', kind: 'bad' },
      { t: 2100, tag: '[10:00:14]', text: 'AI coaching call hangs on-device — screen freezes for affected users.', kind: 'bad' },
      { t: 2700, tag: '[10:00:21]', text: 'Double-tapped "save" creates duplicate expense rows. No idempotency check.', kind: 'bad' },
      { t: 3300, tag: '[10:00:30]', text: 'No alert fires. Team learns about this from app store reviews.', kind: 'bad' }
    ];

    var newScript = [
      { t: 300, tag: '[10:00:02]', text: '10,000 users open the app within the same window.', kind: '' },
      { t: 900, tag: '[10:00:04]', text: 'Cloudflare absorbs the burst, rate-limits abusive clients.', kind: 'good' },
      { t: 1500, tag: '[10:00:07]', text: 'FastAPI queues writes; Postgres primary stays under connection limit.', kind: 'good' },
      { t: 2100, tag: '[10:00:11]', text: 'AI service times out — FastAPI serves a cached explanation instead. Save unaffected.', kind: 'good' },
      { t: 2700, tag: '[10:00:16]', text: 'Retried "save" tap matches an existing idempotency key. One row, correct balance.', kind: 'good' },
      { t: 3300, tag: '[10:00:19]', text: 'Sentry raises an alert. On-call sees it before a single user complains.', kind: 'good' }
    ];

    var running = false;
    var timers = [];

    trigger.addEventListener('click', function () {
      if (running) return;
      running = true;
      trigger.disabled = true;
      triggerLabel.textContent = 'Running simulation…';

      clearTimers();
      existingEvents.innerHTML = '';
      newEvents.innerHTML = '';

      setStatus(existingStatus, 'Load rising', 'is-warn');
      setStatus(newStatus, 'Load rising', 'is-warn');

      existingScript.forEach(function (item) { scheduleEvent(existingEvents, item); });
      newScript.forEach(function (item) { scheduleEvent(newEvents, item); });

      timers.push(setTimeout(function () {
        setStatus(existingStatus, 'Degraded', 'is-bad');
        setStatus(newStatus, 'Stable', 'is-good');
        trigger.disabled = false;
        running = false;
        triggerLabel.textContent = 'Run it again';
      }, 3700));
    });

    function scheduleEvent(container, item) {
      var id = setTimeout(function () {
        var row = document.createElement('div');
        row.className = 'sim-event' + (item.kind ? ' ev-' + item.kind : '');
        var tag = document.createElement('span');
        tag.className = 'sim-event-tag';
        tag.textContent = item.tag;
        var text = document.createElement('span');
        text.textContent = item.text;
        row.appendChild(tag);
        row.appendChild(text);
        container.appendChild(row);
      }, prefersReducedMotion ? 0 : item.t);
      timers.push(id);
    }

    function setStatus(el, label, cls) {
      el.textContent = label;
      el.className = 'sim-status ' + cls;
    }

    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
    }
  })();

})();
