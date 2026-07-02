// ============================================================
// FinFit Architecture Review — behavior + generated content
// ============================================================
(function(){
  "use strict";

  /* ---------- Theme toggle ---------- */
  var themeToggle = document.getElementById('themeToggle');
  var stored = null;
  try { stored = localStorage.getItem('finfit-theme'); } catch(e) {}
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (!stored && prefersDark)) {
    document.body.classList.add('dark-mode');
    themeToggle.setAttribute('aria-pressed', 'true');
  }
  themeToggle.addEventListener('click', function(){
    var isDark = document.body.classList.toggle('dark-mode');
    themeToggle.setAttribute('aria-pressed', String(isDark));
    try { localStorage.setItem('finfit-theme', isDark ? 'dark' : 'light'); } catch(e) {}
  });

  /* ---------- Ledger progress rail ---------- */
  var ledgerFill = document.getElementById('ledgerFill');
  function updateRail(){
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    ledgerFill.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateRail, { passive: true });
  updateRail();

  /* ---------- Scroll reveal ---------- */
  var revealTargets = document.querySelectorAll(
    '.summary-card, .callout, .diagram-card, .analogy-card, .flow-col, .roadmap-phase, .final-reason, .diff-table, .cost-table-wrap, .scenario-col'
  );
  revealTargets.forEach(function(el){ el.classList.add('reveal'); });
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealTargets.forEach(function(el){ io.observe(el); });

  /* ============================================================
     DATA
     ============================================================ */

  var COMPARISON = [
    { label: 'Development Speed', legacy: ['green', 'Days to first build'], prod: ['amber', 'Weeks, more moving parts'] },
    { label: 'MVP Delivery', legacy: ['green', 'Ships almost immediately'], prod: ['amber', 'Slower first release'] },
    { label: 'Cost (early stage)', legacy: ['green', 'Near-zero infra spend'], prod: ['amber', 'Higher baseline cost'] },
    { label: 'Security', legacy: ['red', 'Client holds financial logic'], prod: ['green', 'Server-validated, WAF-protected'] },
    { label: 'Scalability', legacy: ['red', 'Breaks under concurrent load'], prod: ['green', 'Built for 10,000+ users'] },
    { label: 'Multi-user Handling', legacy: ['red', 'No queueing or isolation'], prod: ['green', 'Workers absorb spikes'] },
    { label: 'Maintainability', legacy: ['amber', 'Logic scattered in app'], prod: ['green', 'Centralized in one service'] },
    { label: 'Monitoring', legacy: ['red', 'Minimal observability'], prod: ['green', 'Sentry + PostHog end-to-end'] },
    { label: 'Testing', legacy: ['amber', 'Hard to test client math'], prod: ['green', 'Server logic is unit-testable'] },
    { label: 'AI Reliability', legacy: ['amber', 'AI mixed into core flows'], prod: ['green', 'AI isolated from ledger logic'] },
    { label: 'Deployment Safety', legacy: ['red', 'No safe rollback path'], prod: ['green', 'Zero-downtime deploys'] },
    { label: 'Future Growth', legacy: ['red', 'Rewrite likely required'], prod: ['green', 'Scales without re-architecture'] }
  ];

  var LEGACY_DIAGRAM = [
    { id: 'mobile', label: 'Mobile App', sub: 'React Native + Expo' },
    { id: 'supabase', label: 'Supabase', sub: 'Auth + Postgres + RLS' },
    { id: 'ai', label: 'Claude AI', sub: 'Coaching, in-flow' },
    { id: 'push', label: 'Push', sub: 'Notifications' }
  ];

  var PROD_DIAGRAM = [
    { id: 'mobile', label: 'Mobile App', sub: 'React Native + Expo' },
    { id: 'cf', label: 'Cloudflare', sub: 'WAF · Rate limit · CDN' },
    { id: 'api', label: 'FastAPI', sub: 'Server-side logic' },
    { id: 'pg', label: 'Postgres', sub: 'Supabase managed' },
    { id: 'worker', label: 'Trigger.dev', sub: 'Background workers' },
    { id: 'ai', label: 'AI Service', sub: 'Fully isolated' }
  ];

  var SCENARIO_LEGACY = [
    ['0:00', 'Salary lands. <strong>10,000 users</strong> open FinFit within the same minute.'],
    ['0:04', 'Every phone computes its own balance and totals — no shared source of truth.'],
    ['0:09', '<strong>Database pressure spikes.</strong> Thousands of direct writes hit Postgres with no queue.'],
    ['0:14', 'Two taps on a slow connection double-submit. <strong>Duplicate transactions</strong> land unnoticed.'],
    ['0:21', 'Claude AI coaching calls fire inline with the save — a slow AI response <strong>blocks the save itself.</strong>'],
    ['0:30', 'A hotfix is needed. With no safe rollback path, <strong>deployment risk is highest exactly when load is highest.</strong>']
  ];

  var SCENARIO_PROD = [
    ['0:00', 'Salary lands. <strong>10,000 users</strong> open FinFit within the same minute.'],
    ['0:03', 'Cloudflare absorbs the burst and <strong>rate-limits</strong> abusive or accidental retry storms.'],
    ['0:07', 'FastAPI validates every request server-side before it becomes a write.'],
    ['0:11', 'An <strong>idempotency key</strong> on each request makes duplicate taps harmless.'],
    ['0:16', 'Heavy work — AI coaching, notifications — is handed to <strong>Trigger.dev workers</strong>, off the request path.'],
    ['0:25', 'If a service degrades, it <strong>degrades gracefully</strong> — the balance stays correct even if coaching is delayed.']
  ];

  var FLOW_LEGACY = [
    ['User Login', 'Supabase Auth verifies the session.'],
    ['Expense Entry', 'User types an expense into the app.'],
    ['Client Calculation', 'Balance and score are computed on-device.'],
    ['Database Save', 'The client writes the result straight to Postgres.'],
    ['AI Response', 'Claude returns coaching based on the unverified number.']
  ];

  var FLOW_PROD = [
    ['User Login', 'Supabase Auth verifies the session.'],
    ['API Validation', 'FastAPI checks the request shape and permissions.'],
    ['Idempotency Check', 'A duplicate submission is detected and ignored safely.'],
    ['Database Transaction', 'The balance is calculated and committed atomically.'],
    ['Background Worker', 'Trigger.dev picks up follow-on work asynchronously.'],
    ['AI Service', 'Coaching runs against the verified, committed balance.'],
    ['Notification Delivery', 'The user is notified once everything is confirmed.']
  ];

  var ROADMAP = [
    { phase: 'Phase 1', title: 'React Native + Supabase', body: 'Ship the MVP fast. Auth, Postgres, and RLS handle the basics while the product finds its first users.' },
    { phase: 'Phase 2', title: 'Move financial calculations to FastAPI', body: 'The highest-risk logic — balances, scoring, goal math — moves server-side first, before anything else changes.' },
    { phase: 'Phase 3', title: 'Add Trigger.dev', body: 'AI coaching and notifications move to background workers, off the critical request path.' },
    { phase: 'Phase 4', title: 'Add Sentry and PostHog', body: 'Errors and usage become visible before users have to report them.' },
    { phase: 'Phase 5', title: 'Read replica and blue-green deployments', body: 'Read load is offloaded and deploys stop being a moment of risk.' }
  ];

  var COST = {
    head: ['Monthly Users', 'Existing Plan', 'Production Plan', 'Difference'],
    rows: [
      ['1,000', '$25 / mo', '$180 / mo', 'Production is overkill here'],
      ['10,000', '$95 / mo', '$420 / mo', 'Production earns its cost'],
      ['100,000', '$650+ / mo, unstable', '$1,900 / mo, stable', 'Existing plan cannot survive this tier']
    ]
  };

  var FINAL_DIAGRAM = [
    { id: 'mobile', label: 'React Native', sub: 'Client' },
    { id: 'cf', label: 'Cloudflare', sub: 'Edge protection' },
    { id: 'api', label: 'FastAPI', sub: 'Business logic' },
    { id: 'pg', label: 'Supabase Postgres', sub: 'System of record' },
    { id: 'worker', label: 'Trigger.dev', sub: 'Background work' },
    { id: 'ai', label: 'AI Service', sub: 'Isolated coaching' },
    { id: 'obs', label: 'Sentry + PostHog', sub: 'Observability' }
  ];

  /* ============================================================
     RENDERERS
     ============================================================ */

  function statusWord(s){ return s === 'green' ? 'Winner' : s === 'amber' ? 'Acceptable' : 'Weakness'; }

  function renderDiffTable(){
    var table = document.getElementById('diffTable');
    COMPARISON.forEach(function(row){
      var r = document.createElement('div');
      r.className = 'diff-row';
      r.innerHTML =
        '<div class="diff-cell diff-cell--label">' + row.label + '</div>' +
        '<div class="diff-cell diff-cell--plan diff-status-' + row.legacy[0] + '">' +
          '<span class="diff-mark"></span><span>' + row.legacy[1] + ' <span class="sr-only">(' + statusWord(row.legacy[0]) + ')</span></span>' +
        '</div>' +
        '<div class="diff-cell diff-cell--plan diff-status-' + row.prod[0] + '">' +
          '<span class="diff-mark"></span><span>' + row.prod[1] + ' <span class="sr-only">(' + statusWord(row.prod[0]) + ')</span></span>' +
        '</div>';
      table.appendChild(r);
    });
  }

  // Builds a simple vertical SVG chain diagram of nodes connected by animated edges.
  function buildDiagram(nodes, opts){
    opts = opts || {};
    var width = 320, nodeH = 56, gap = 40, padTop = 14;
    var height = padTop * 2 + nodes.length * nodeH + (nodes.length - 1) * gap;
    var cx = width / 2;
    var svg = '<svg viewBox="0 0 ' + width + ' ' + height + '" width="100%" role="img" aria-label="' + (opts.ariaLabel || 'Architecture diagram') + '">';

    // edges first (so nodes sit above them)
    nodes.forEach(function(n, i){
      if (i === nodes.length - 1) return;
      var y1 = padTop + i * (nodeH + gap) + nodeH;
      var y2 = y1 + gap;
      svg += '<path class="edge" d="M' + cx + ' ' + y1 + ' L' + cx + ' ' + y2 + '"/>';
      svg += '<path class="edge-pulse" d="M' + cx + ' ' + y1 + ' L' + cx + ' ' + y2 + '"/>';
      // arrowhead
      svg += '<path d="M' + (cx - 5) + ' ' + (y2 - 7) + ' L' + cx + ' ' + y2 + ' L' + (cx + 5) + ' ' + (y2 - 7) + '" fill="none" stroke="var(--line-strong)" stroke-width="1.4"/>';
    });

    nodes.forEach(function(n, i){
      var y = padTop + i * (nodeH + gap);
      var boxW = 220, boxX = cx - boxW / 2;
      svg += '<g class="node" tabindex="0">' +
        '<rect class="node-box" x="' + boxX + '" y="' + y + '" width="' + boxW + '" height="' + nodeH + '" rx="12"/>' +
        '<text class="node-label" x="' + cx + '" y="' + (y + 24) + '" text-anchor="middle">' + n.label + '</text>' +
        '<text class="node-sub" x="' + cx + '" y="' + (y + 40) + '" text-anchor="middle">' + n.sub + '</text>' +
        '<title>' + n.label + ' — ' + n.sub + '</title>' +
        '</g>';
    });

    svg += '</svg>';
    return svg;
  }

  function renderDiagrams(){
    document.getElementById('diagramLegacy').innerHTML = buildDiagram(LEGACY_DIAGRAM, { ariaLabel: 'Existing plan architecture' });
    document.getElementById('diagramProd').innerHTML = buildDiagram(PROD_DIAGRAM, { ariaLabel: 'Production plan architecture' });
    document.getElementById('finalDiagram').innerHTML = buildDiagram(FINAL_DIAGRAM, { ariaLabel: 'Recommended architecture' })
      .replace('viewBox', 'class="final-diagram-svg" viewBox');
  }

  function renderScenario(){
    var legacyEl = document.getElementById('scenarioLegacy');
    var prodEl = document.getElementById('scenarioProd');
    SCENARIO_LEGACY.forEach(function(item){
      var li = document.createElement('li');
      li.innerHTML = '<span class="t">' + item[0] + '</span>' + item[1];
      legacyEl.appendChild(li);
    });
    SCENARIO_PROD.forEach(function(item){
      var li = document.createElement('li');
      li.innerHTML = '<span class="t">' + item[0] + '</span>' + item[1];
      prodEl.appendChild(li);
    });
  }

  function renderFlows(){
    var legacyEl = document.getElementById('flowLegacy');
    var prodEl = document.getElementById('flowProd');
    FLOW_LEGACY.forEach(function(step){
      var li = document.createElement('li');
      li.innerHTML = '<strong>' + step[0] + '</strong><span>' + step[1] + '</span>';
      legacyEl.appendChild(li);
    });
    FLOW_PROD.forEach(function(step){
      var li = document.createElement('li');
      li.innerHTML = '<strong>' + step[0] + '</strong><span>' + step[1] + '</span>';
      prodEl.appendChild(li);
    });
  }

  function renderRoadmap(){
    var rail = document.getElementById('roadmapRail');
    ROADMAP.forEach(function(p){
      var div = document.createElement('div');
      div.className = 'roadmap-phase';
      div.innerHTML =
        '<div class="roadmap-phase-head"><span class="roadmap-phase-num">' + p.phase + '</span><h3>' + p.title + '</h3></div>' +
        '<p>' + p.body + '</p>';
      rail.appendChild(div);
    });
  }

  function renderCostTable(){
    var table = document.getElementById('costTable');
    var thead = '<thead><tr>' + COST.head.map(function(h){ return '<th>' + h + '</th>'; }).join('') + '</tr></thead>';
    var tbody = '<tbody>' + COST.rows.map(function(row){
      return '<tr><td class="label">' + row[0] + ' users</td><td class="num">' + row[1] + '</td><td class="num">' + row[2] + '</td><td>' + row[3] + '</td></tr>';
    }).join('') + '</tbody>';
    table.innerHTML = thead + tbody;
  }

  renderDiffTable();
  renderDiagrams();
  renderScenario();
  renderFlows();
  renderRoadmap();
  renderCostTable();

  // Re-observe dynamically injected reveal targets that were added after initial query.
  document.querySelectorAll('.roadmap-phase, .scenario-col, .diagram-card').forEach(function(el){
    if (!el.classList.contains('reveal')) { el.classList.add('reveal'); io.observe(el); }
  });

})();
