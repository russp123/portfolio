/* ============================================================
   /agents app shell: theme, dock, hash routing, landing cards,
   top bar, side panel (node details, trigger form, execution
   logs), run flow and the recorded-run fallback.

   Everything agent-specific comes from js/agents/registry.js and
   js/agents/samples.js; the graph is drawn by js/agents/canvas.js.
   Adding an agent never touches this file.

   Storage: only localStorage.theme (shared with the portfolio) and
   the visitor's own run history (LOG_KEY). Every access is wrapped
   so the page still works with storage blocked.
   ============================================================ */
(function () {
  "use strict";

  const LIVE = AGENTS.filter((a) => a.status === "live");
  const byId = (id) => LIVE.find((a) => a.id === id) || null;
  const SAMPLES = typeof AGENT_SAMPLES !== "undefined" ? AGENT_SAMPLES : {};
  const samplesFor = (agent) => SAMPLES[agent.id] || [];
  const EMAIL = (typeof PORTFOLIO !== "undefined" && PORTFOLIO.email) || "rsslpnd@gmail.com";

  const LOG_KEY = "agents.logs.v1";
  const LOG_MAX = 20;
  const STEP_MS = 500;
  const MAX_INPUT = 2000;
  const LIVE_TIMEOUT_MS = 30000;
  const FALLBACK_NOTE = "Live demo is resting. Here's a recorded run.";
  const BASE_TITLE = "AI Business Agents | Russel Pineda";

  const mqMobile = matchMedia("(max-width: 699px)");
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");

  const UI = {
    back: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    logs: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    fit: '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    left: '<path d="m14 6-6 6 6 6"/>',
    right: '<path d="m10 6 6 6-6 6"/>',
  };
  Object.assign(AGENT_ICONS, UI);

  const KIND = { trigger: "Trigger", ai: "AI step", branch: "Decision", action: "Action", output: "Output" };

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ---------------- Storage (all guarded) ---------------- */
  const store = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
    },
    remove(key) {
      try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
    },
  };

  function loadLogs() {
    try {
      const list = JSON.parse(store.get(LOG_KEY) || "[]");
      return Array.isArray(list) ? list.filter((l) => l && l.result && byId(l.agent)).slice(0, LOG_MAX) : [];
    } catch (e) {
      return [];
    }
  }
  function saveLogs() {
    try { store.set(LOG_KEY, JSON.stringify(state.logs)); } catch (e) { /* in-memory only */ }
  }

  /* ---------------- State ---------------- */
  const state = {
    route: null, // "" for the landing view, otherwise a live agent id
    agent: null,
    run: null, // the run currently shown on the canvas
    playing: false,
    busy: false, // waiting on a live call
    runToken: 0,
    started: false, // a run has played this visit (hides "Start here")
    panel: null, // { kind: "node", id } | { kind: "logs" }
    panelOpener: null,
    drafts: {}, // per agent, in memory only: { input, receivedAt }
    logs: loadLogs(),
    landingScroll: 0,
    status: null,
  };

  /* ---------------- Elements ---------------- */
  const els = {
    landing: $("#ag-landing"),
    cards: $("#ag-cards"),
    workspace: $("#ag-workspace"),
    back: $("#ag-back"),
    titleName: $("#ag-title-name"),
    titleBiz: $("#ag-title-biz"),
    logsBtn: $("#ag-logs-btn"),
    logsCount: $("#ag-logs-count"),
    viewport: $("#ag-canvas"),
    status: $("#ag-status"),
    dock: $("#ag-dock"),
    tooltip: $("#ag-tooltip"),
    panel: $("#ag-panel"),
    toast: $("#ag-toast"),
  };

  /* ---------------- Theme (shared with the portfolio) ---------------- */
  const currentTheme = () => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
    const btn = $("#ag-theme");
    if (!btn) return;
    const dark = currentTheme() === "dark";
    btn.innerHTML = agentIcon(dark ? "sun" : "moon", 22);
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.dataset.tip = dark ? "Light mode" : "Dark mode";
  }
  function toggleTheme() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    store.set("theme", next);
  }
  window.addEventListener("storage", (e) => {
    if (e.key === "theme") applyTheme(e.newValue || "light");
  });

  /* ---------------- Toast + mailto copy (same behavior as the site) ---------------- */
  function toast(text) {
    els.toast.textContent = text;
    els.toast.classList.add("is-shown");
    clearTimeout(els.toast._t);
    els.toast._t = setTimeout(() => els.toast.classList.remove("is-shown"), 2200);
  }
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="mailto:"]');
    if (!link) return;
    const email = link.getAttribute("href").replace("mailto:", "").split("?")[0];
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(() => toast(`Copied: ${email}`)).catch(() => toast(`Email: ${email}`));
    } else {
      toast(`Email: ${email}`);
    }
  });

  /* ---------------- Dock ---------------- */
  function buildDock() {
    const agentButtons = LIVE.map(
      (a) => `<button type="button" class="ag-dock-btn" data-route="${a.id}" data-tip="${esc(a.name)}" aria-label="${esc(a.name)}">${agentIcon(a.icon, 24)}</button>`
    ).join("");
    els.dock.innerHTML = `
      <button type="button" class="ag-dock-btn" data-route="" data-tip="All agents" aria-label="All agents">${agentIcon("home", 24)}</button>
      <span class="ag-dock-sep" aria-hidden="true"></span>
      ${agentButtons}
      <span class="ag-dock-sep" aria-hidden="true"></span>
      <button type="button" class="ag-dock-btn ag-dock-theme" id="ag-theme"></button>`;
    els.dock.addEventListener("click", (e) => {
      const btn = e.target.closest(".ag-dock-btn");
      if (!btn) return;
      hideTip();
      if (btn.id === "ag-theme") toggleTheme();
      else go(btn.dataset.route);
    });
    applyTheme(currentTheme());
  }
  function renderDock() {
    els.dock.querySelectorAll("[data-route]").forEach((b) => {
      const on = b.dataset.route === state.route;
      b.classList.toggle("is-active", on);
      if (on) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
  }

  // Hover tooltip for the label-less dock tiles: mouse hover and
  // keyboard focus only (touch has no hover, the icons stand alone).
  function showTip(btn) {
    const text = btn.dataset.tip;
    if (!text) return;
    const tip = els.tooltip;
    tip.textContent = text;
    tip.hidden = false;
    const r = btn.getBoundingClientRect();
    const bottom = mqMobile.matches;
    tip.dataset.side = bottom ? "top" : "right";
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let x = bottom ? r.left + r.width / 2 - tw / 2 : r.right + 12;
    let y = bottom ? r.top - th - 10 : r.top + r.height / 2 - th / 2;
    x = Math.max(8, Math.min(window.innerWidth - tw - 8, x));
    tip.style.left = `${Math.round(x)}px`;
    tip.style.top = `${Math.round(y)}px`;
    requestAnimationFrame(() => tip.classList.add("is-shown"));
  }
  function hideTip() {
    els.tooltip.classList.remove("is-shown");
    els.tooltip.hidden = true;
  }
  function bindTips() {
    els.dock.addEventListener("pointerover", (e) => {
      const btn = e.target.closest(".ag-dock-btn");
      if (btn && e.pointerType === "mouse") showTip(btn);
    });
    els.dock.addEventListener("pointerout", (e) => {
      const btn = e.target.closest(".ag-dock-btn");
      if (btn && !btn.contains(e.relatedTarget)) hideTip();
    });
    els.dock.addEventListener("focusin", (e) => {
      const btn = e.target.closest(".ag-dock-btn");
      if (btn && btn.matches(":focus-visible")) showTip(btn);
    });
    els.dock.addEventListener("focusout", hideTip);
  }

  /* ---------------- Landing ---------------- */
  function miniFlow(agent) {
    const main = agent.nodes.filter((n) => n.row === 0).sort((a, b) => a.col - b.col);
    return `<div class="ag-mini" aria-hidden="true">${main
      .map((n, i) => `${i ? '<span class="ag-mini-edge"></span>' : ""}<span class="ag-mini-node" data-type="${n.type}">${agentIcon(n.icon, 16)}</span>`)
      .join("")}</div>`;
  }
  function buildCards() {
    els.cards.innerHTML = AGENTS.map((a) => {
      const live = a.status === "live";
      const media = live
        ? `<div class="ag-card-media">${miniFlow(a)}</div>`
        : `<div class="ag-card-media ag-ph"><span class="ag-ph-text">agent: in training</span></div>`;
      const meta = `
        <div class="ag-card-meta">
          <div class="ag-card-head">
            <span class="ag-card-icon">${agentIcon(a.icon, 22)}</span>
            <div>
              <h3 class="ag-card-name">${esc(a.name)}</h3>
              <p class="ag-card-biz">${esc(a.business)}</p>
            </div>
          </div>
          <p class="ag-card-problem">${esc(a.problem)}</p>
          ${live ? `<span class="ag-card-cta">Open agent ${agentIcon("arrow", 16)}</span>` : `<span class="ag-card-state">In training</span>`}
        </div>`;
      return live
        ? `<a class="ag-card is-live" href="#${a.id}" data-route="${a.id}">${media}${meta}</a>`
        : `<div class="ag-card is-training" aria-disabled="true">${media}${meta}</div>`;
    }).join("");
    els.cards.addEventListener("click", (e) => {
      const link = e.target.closest("a[data-route]");
      if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      go(link.dataset.route);
    });
  }

  /* ---------------- Routing ---------------- */
  const hashRoute = () => {
    try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return ""; }
  };
  const cleanUrl = () => location.pathname + location.search;

  function go(id) {
    id = id || "";
    if (id === state.route) return;
    history.pushState({ agFrom: state.route }, "", id ? `#${id}` : cleanUrl());
    render();
  }

  function render() {
    const id = hashRoute();
    const agent = id ? byId(id) : null;
    if (id && !agent) history.replaceState(null, "", cleanUrl()); // unknown or in-training agent
    const next = agent ? agent.id : "";
    if (next === state.route) return;
    const prev = state.route;
    state.route = next;
    closePanel({ restoreFocus: false });
    hideTip();
    if (agent) showAgent(agent, prev === "");
    else showLanding();
    renderDock();
  }

  function showLanding() {
    els.workspace.hidden = true;
    els.landing.hidden = false;
    document.body.classList.remove("is-workspace");
    document.title = BASE_TITLE;
    window.scrollTo(0, state.landingScroll || 0);
  }

  function showAgent(agent, fromLanding) {
    if (fromLanding) state.landingScroll = window.scrollY;
    els.landing.hidden = true;
    els.workspace.hidden = false;
    document.body.classList.add("is-workspace");
    document.title = `${agent.name} | AI Business Agents`;
    els.titleName.textContent = agent.name;
    els.titleBiz.textContent = agent.business;
    window.scrollTo(0, 0);
    canvas.setVertical(mqMobile.matches);
    if (canvas.agent !== agent) {
      state.agent = agent;
      state.run = null;
      setStatus(null);
      canvas.load(agent);
      canvas.markStart(!state.started);
    }
    requestAnimationFrame(() => canvas.fit());
  }

  els.back.addEventListener("click", () => {
    if (history.state && history.state.agFrom === "") history.back();
    else go("");
  });
  window.addEventListener("popstate", render);
  window.addEventListener("hashchange", render);

  /* ---------------- Canvas ---------------- */
  const canvas = new AgentCanvas(els.viewport, {
    onNodeClick: (id) => openPanel({ kind: "node", id }),
    reducedMotion: () => mqReduce.matches,
    insets: () => {
      if (mqMobile.matches) {
        const dockTop = els.dock.getBoundingClientRect().top;
        const vpTop = els.viewport.getBoundingClientRect().top;
        const visible = Math.max(200, dockTop - vpTop);
        return { top: 28, left: 16, right: 16, bottom: els.viewport.clientHeight - visible + 64 };
      }
      const panelOpen = state.panel && !els.panel.hidden;
      return { top: 56, left: 112, right: panelOpen ? els.panel.offsetWidth + 40 : 40, bottom: 88 };
    },
  });

  $("#ag-zoom-in").addEventListener("click", () => canvas.zoomBy(1.2));
  $("#ag-zoom-out").addEventListener("click", () => canvas.zoomBy(1 / 1.2));
  $("#ag-zoom-fit").addEventListener("click", () => canvas.fit({ animate: true }));

  // A plain click on empty canvas closes the panel.
  els.viewport.addEventListener("click", (e) => {
    if (canvas.dragged || e.target.closest(".ag-node, .ag-canvas-ui")) return;
    if (state.panel) closePanel();
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!state.agent || els.workspace.hidden) return;
      const changed = canvas.setVertical(mqMobile.matches);
      if (changed || !canvas.userMoved) canvas.fit();
      if (state.panel) positionPanelMode();
    }, 120);
  });

  /* ---------------- Status chip ---------------- */
  function setStatus(s) {
    state.status = s;
    const el = els.status;
    if (!s) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.dataset.kind = s.kind;
    el.innerHTML = `<span class="ag-status-dot" aria-hidden="true"></span><span>${esc(s.text)}</span>`;
  }
  function statusFor(run, replay) {
    const pre = replay ? "Replay · " : "";
    if (run.source === "fallback") return { kind: "resting", text: replay ? "Replay · Recorded run (live demo was resting)" : FALLBACK_NOTE };
    if (run.source === "custom") return { kind: "live", text: `${pre}Live run · ${fmtSecs(run.clientMs || run.ms)}` };
    return { kind: "sample", text: `${pre}Recorded sample run` };
  }
  const fmtSecs = (ms) => `${(Math.max(0, ms || 0) / 1000).toFixed(1)}s`;

  /* ---------------- Panel ---------------- */
  function positionPanelMode() {
    els.panel.classList.toggle("is-sheet", mqMobile.matches);
  }

  function openPanel(p) {
    if (state.panel && state.panel.kind === p.kind && state.panel.id === p.id && !els.panel.hidden) return;
    if (!state.panel) state.panelOpener = document.activeElement;
    state.panel = p;
    positionPanelMode();
    renderPanel();
    els.panel.hidden = false;
    requestAnimationFrame(() => els.panel.classList.add("is-open"));
    canvas.select(p.kind === "node" ? p.id : null);
    els.logsBtn.setAttribute("aria-expanded", p.kind === "logs" ? "true" : "false");
    const focusTarget = $(".ag-panel-title", els.panel);
    if (focusTarget) focusTarget.focus({ preventScroll: true });
    // Desktop: if the visitor hasn't moved the canvas and the whole flow
    // still reads well beside the panel, refit it there. Otherwise just
    // bring the selected node into view.
    requestAnimationFrame(() => {
      const refit = !mqMobile.matches && !canvas.userMoved && canvas.fit({ animate: true, minScale: 0.8 });
      if (!refit && p.kind === "node") canvas.ensureVisible(p.id, revealInsets());
    });
  }

  // The canvas area left uncovered by the open panel.
  function revealInsets() {
    const vp = els.viewport.getBoundingClientRect();
    const panel = els.panel.getBoundingClientRect();
    if (mqMobile.matches) return { top: 12, left: 12, right: 12, bottom: Math.max(0, vp.bottom - panel.top) + 12 };
    return { top: 24, left: 112, right: Math.max(0, vp.right - panel.left) + 24, bottom: 24 };
  }

  function closePanel({ restoreFocus = true } = {}) {
    if (!state.panel) return;
    const hadFocus = els.panel.contains(document.activeElement);
    state.panel = null;
    canvas.select(null);
    els.logsBtn.setAttribute("aria-expanded", "false");
    els.panel.classList.remove("is-open");
    els.panel.hidden = true;
    if (!mqMobile.matches && !canvas.userMoved && !els.workspace.hidden) requestAnimationFrame(() => canvas.fit({ animate: true }));
    const opener = state.panelOpener;
    state.panelOpener = null;
    if (restoreFocus && hadFocus && opener && document.contains(opener)) {
      try { opener.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  }

  function panelShell({ icon, kind, title, body, footer }) {
    return `
      <div class="ag-panel-grip" aria-hidden="true"></div>
      <header class="ag-panel-head">
        <span class="ag-panel-icon">${agentIcon(icon, 20)}</span>
        <div class="ag-panel-heading">
          <span class="ag-panel-kind">${esc(kind)}</span>
          <h2 class="ag-panel-title" id="ag-panel-title" tabindex="-1">${esc(title)}</h2>
        </div>
        <button type="button" class="ag-icon-btn ag-panel-close" aria-label="Close panel">${agentIcon("close", 20)}</button>
      </header>
      <div class="ag-panel-body">${body}</div>
      ${footer ? `<footer class="ag-panel-foot">${footer}</footer>` : ""}`;
  }

  function renderPanel() {
    const p = state.panel;
    if (!p) return;
    const scroll = $(".ag-panel-body", els.panel);
    const keepScroll = scroll && els.panel.dataset.for === `${p.kind}:${p.id || ""}` ? scroll.scrollTop : 0;
    els.panel.dataset.for = `${p.kind}:${p.id || ""}`;
    if (p.kind === "logs") els.panel.innerHTML = logsPanel();
    else {
      const def = state.agent && state.agent.nodes.find((n) => n.id === p.id);
      if (!def) return closePanel();
      els.panel.innerHTML = def.type === "trigger" ? triggerPanel(state.agent, def) : nodePanel(state.agent, def);
    }
    const body = $(".ag-panel-body", els.panel);
    if (body) body.scrollTop = keepScroll;
    if (p.kind === "node") bindTrigger();
  }

  els.panel.addEventListener("click", (e) => {
    if (e.target.closest(".ag-panel-close")) return closePanel();
    const step = e.target.closest("[data-goto]");
    if (step) return openPanelStep(step.dataset.goto);
    const log = e.target.closest("[data-log]");
    if (log) return replayLog(log.dataset.log);
    if (e.target.closest("#ag-clear-logs")) {
      state.logs = [];
      store.remove(LOG_KEY);
      updateLogsCount();
      renderPanel();
    }
  });
  function openPanelStep(id) {
    const opener = state.panelOpener;
    state.panel = null; // force a re-render even if the same kind
    openPanel({ kind: "node", id });
    state.panelOpener = opener;
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    hideTip();
    if (state.panel) {
      e.preventDefault();
      closePanel();
    }
  });

  els.logsBtn.addEventListener("click", () => {
    if (state.panel && state.panel.kind === "logs") closePanel();
    else openPanel({ kind: "logs" });
  });

  /* ---------------- Node panels ---------------- */
  const nodeOrder = (agent) => [...agent.nodes].sort((a, b) => a.col - b.col || a.row - b.row);

  function stepNav(agent, def) {
    const order = nodeOrder(agent);
    const i = order.findIndex((n) => n.id === def.id);
    const prev = order[i - 1];
    const next = order[i + 1];
    return `
      <button type="button" class="ag-step-nav" ${prev ? `data-goto="${prev.id}"` : "disabled"}>${agentIcon("left", 16)}<span>${prev ? esc(prev.label) : "Start"}</span></button>
      <span class="ag-step-count">${i + 1} / ${order.length}</span>
      <button type="button" class="ag-step-nav is-next" ${next ? `data-goto="${next.id}"` : "disabled"}><span>${next ? esc(next.label) : "End"}</span>${agentIcon("right", 16)}</button>`;
  }

  function nodePanel(agent, def) {
    const node = canvas.nodes.get(def.id);
    const nodeState = node ? node.el.dataset.state : "idle";
    const trigger = agent.nodes.find((n) => n.type === "trigger");
    let body = `<p class="ag-about">${esc(def.about)}</p>`;
    if (!state.run && !state.busy) {
      body += `<div class="ag-empty"><p>Run the agent to see what this step produces.</p><button type="button" class="ag-btn" data-goto="${trigger.id}">Open ${esc(trigger.label)}</button></div>`;
    } else if (nodeState === "error") {
      body += `<div class="ag-empty"><p>This step couldn't finish on this run.</p></div>`;
    } else if (nodeState === "skipped") {
      body += `<div class="ag-empty"><p>Not used on this run. The decision before it took the other path.</p></div>`;
    } else if (nodeState !== "done" || state.busy) {
      body += `<div class="ag-empty is-working"><span class="ag-spinner" aria-hidden="true"></span><p>Working on it…</p></div>`;
    } else {
      if (def.type === "output") {
        body += `<div class="ag-run-meta" data-kind="${esc(state.status ? state.status.kind : "")}">${esc(state.status ? state.status.text : "")}</div>`;
      }
      let blocks = [];
      try { blocks = def.view(state.run) || []; } catch (e) { blocks = [{ type: "note", body: "This step has nothing to show for this run." }]; }
      body += blocks.map(renderBlock).join("");
    }
    return panelShell({ icon: def.icon, kind: KIND[def.type] || "Step", title: def.label, body, footer: stepNav(agent, def) });
  }

  /* ---------------- Blocks ---------------- */
  const isEmpty = (v) => v == null || v === "" || (Array.isArray(v) && !v.length);
  const title = (t) => (t ? `<h3 class="ag-block-title">${esc(t)}</h3>` : "");
  const initials = (name) =>
    (name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?";

  const BLOCKS = {
    badge: (b) => `<span class="ag-badge" data-tone="${esc(b.tone || "muted")}">${esc(b.label)}</span>`,
    text: (b) => `<p class="ag-text">${esc(b.body)}</p>`,
    note: (b) => `<p class="ag-note">${esc(b.body)}</p>`,
    quote: (b) => `${title(b.title)}<blockquote class="ag-quote">${esc(b.body || "")}</blockquote>`,
    kv: (b) =>
      `${title(b.title)}<dl class="ag-kv">${b.rows
        .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd${isEmpty(v) ? ' class="is-empty"' : ""}>${esc(isEmpty(v) ? b.empty || "Not given" : v)}</dd></div>`)
        .join("")}</dl>`,
    list: (b) =>
      `${title(b.title)}${
        isEmpty(b.items)
          ? `<p class="ag-text is-muted">${esc(b.empty || "None")}</p>`
          : `<ul class="ag-list">${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
      }`,
    sms: (b) => {
      const len = (b.body || "").length;
      const pct = Math.min(100, Math.round((len / (b.limit || 320)) * 100));
      return `<div class="ag-sms"><div class="ag-bubble is-out">${esc(b.body)}</div></div>
        <div class="ag-meter" ${len > (b.limit || 320) ? 'data-over="true"' : ""}><span class="ag-meter-bar"><i style="width:${pct}%"></i></span><span>${len} / ${b.limit || 320} characters</span></div>`;
    },
    thread: (b) => `${title(b.title)}
      <div class="ag-phone">
        <div class="ag-phone-head">
          <span class="ag-avatar">${esc(initials(b.from))}</span>
          <div><strong>${esc(b.from)}</strong><span>Text message</span></div>
        </div>
        <div class="ag-phone-body">
          <span class="ag-phone-label">${esc(b.channel)}</span>
          <div class="ag-bubble is-in">${esc(b.incoming)}</div>
          <span class="ag-phone-label is-out">${esc(b.business)} · auto-reply</span>
          <div class="ag-bubble is-out">${esc(b.outgoing)}</div>
        </div>
      </div>`,
    crm: (b) => `${title(b.title)}
      <div class="ag-crm">
        <div class="ag-crm-head">
          <span class="ag-avatar is-lg">${esc(initials(b.name))}</span>
          <div class="ag-crm-id"><strong${b.name ? "" : ' class="is-empty"'}>${esc(b.name || "Name not given")}</strong><span>${esc(b.score)} lead</span></div>
          <span class="ag-stage">${esc(b.stage)}</span>
        </div>
        <dl class="ag-kv is-compact">${b.rows
          .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd${isEmpty(v) ? ' class="is-empty"' : ""}>${esc(isEmpty(v) ? "Not given" : v)}</dd></div>`)
          .join("")}</dl>
        ${isEmpty(b.tags) ? "" : `<div class="ag-tags">${b.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>`}
        <div class="ag-next"><span>Next action</span><p>${esc(b.nextAction)}</p></div>
      </div>`,
  };
  const renderBlock = (b) => `<section class="ag-block" data-block="${esc(b.type)}">${(BLOCKS[b.type] || (() => ""))(b)}</section>`;

  /* ---------------- Trigger panel (the only place a run starts) ---------------- */
  function sydneyNowLocal() {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Australia/Sydney",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date());
      const g = (t) => (parts.find((p) => p.type === t) || {}).value;
      return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
    } catch (e) {
      return "";
    }
  }

  function draftFor(agent) {
    if (!state.drafts[agent.id]) {
      const first = samplesFor(agent)[0];
      state.drafts[agent.id] = first ? { input: first.input, receivedAt: first.receivedAt } : { input: "", receivedAt: sydneyNowLocal() };
    }
    return state.drafts[agent.id];
  }
  const matchSample = (agent, d) => samplesFor(agent).find((s) => s.input.trim() === d.input.trim() && s.receivedAt === d.receivedAt) || null;

  function triggerPanel(agent, def) {
    const d = draftFor(agent);
    const active = matchSample(agent, d);
    const t = agent.trigger || {};
    const chips = samplesFor(agent)
      .map(
        (s) => `<button type="button" class="ag-chip${active && active.id === s.id ? " is-active" : ""}" data-sample="${s.id}" aria-pressed="${active && active.id === s.id}">
          <strong>${esc(s.label)}</strong><span>${esc(s.channel)}</span></button>`
      )
      .join("");
    const body = `
      <p class="ag-about">${esc(def.about)}</p>
      <div class="ag-field">
        <span class="ag-label">Samples</span>
        <div class="ag-chips">${chips}</div>
      </div>
      <label class="ag-field">
        <span class="ag-label">${esc(t.timeLabel || "Received")}</span>
        <input type="datetime-local" class="ag-input" id="ag-time" value="${esc(d.receivedAt)}" />
      </label>
      <label class="ag-field">
        <span class="ag-label-row"><span class="ag-label">${esc(t.inputLabel || "Input")}</span><span class="ag-count" id="ag-count"></span></span>
        <textarea class="ag-input ag-textarea" id="ag-input" maxlength="${MAX_INPUT}" rows="7" placeholder="${esc(t.placeholder || "")}">${esc(d.input)}</textarea>
      </label>
      <p class="ag-hint" id="ag-hint"></p>
      <p class="ag-error" id="ag-error" role="alert" hidden></p>`;
    const footer = `<button type="button" class="ag-run" id="ag-run"${state.busy ? " disabled" : ""}>${agentIcon("play", 16)}<span>${state.busy ? "Running…" : "Run agent"}</span></button>`;
    return panelShell({ icon: def.icon, kind: KIND.trigger, title: def.label, body, footer });
  }

  function bindTrigger() {
    const input = $("#ag-input", els.panel);
    if (!input) return;
    const agent = state.agent;
    const d = draftFor(agent);
    const time = $("#ag-time", els.panel);
    const sync = () => {
      const active = matchSample(agent, d);
      els.panel.querySelectorAll(".ag-chip").forEach((c) => {
        const on = !!active && c.dataset.sample === active.id;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      $("#ag-count", els.panel).textContent = `${d.input.length.toLocaleString("en-AU")} / ${MAX_INPUT.toLocaleString("en-AU")}`;
      $("#ag-hint", els.panel).textContent = active
        ? "This sample replays a recorded run, no live call. Edit the text or time to run it live."
        : d.input.trim()
        ? "Custom input runs the agent live."
        : "Pick a sample or write your own lead.";
      $("#ag-error", els.panel).hidden = true;
    };
    input.addEventListener("input", () => {
      d.input = input.value.slice(0, MAX_INPUT);
      sync();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        runTrigger();
      }
    });
    time.addEventListener("input", () => {
      d.receivedAt = time.value;
      sync();
    });
    els.panel.querySelectorAll(".ag-chip").forEach((chip) =>
      chip.addEventListener("click", () => {
        const s = samplesFor(agent).find((x) => x.id === chip.dataset.sample);
        if (!s) return;
        d.input = s.input;
        d.receivedAt = s.receivedAt;
        input.value = s.input;
        time.value = s.receivedAt;
        sync();
      })
    );
    $("#ag-run", els.panel).addEventListener("click", runTrigger);
    sync();
  }

  function formError(text) {
    const el = $("#ag-error", els.panel);
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
  }

  /* ---------------- Runs ---------------- */
  function runFromSample(agent, s, source) {
    return {
      agent: agent.id,
      source,
      sampleId: s.id,
      sampleLabel: s.label,
      channel: s.channel,
      triggerCaption: s.channel,
      input: s.input,
      receivedAt: s.receivedAt,
      result: s.recorded.result,
      received: s.recorded.received,
      ms: s.recorded.ms,
    };
  }

  const STOP = new Set("the and you your for can could there how much what this that with have our are just any way someone would like hi hello thanks thank please from its it's i'm i've get got need want when will".split(" "));
  const words = (t) => new Set((String(t).toLowerCase().match(/[a-z0-9']{3,}/g) || []).filter((w) => !STOP.has(w)));
  function closestSample(agent, text) {
    const list = samplesFor(agent);
    const a = words(text);
    let best = list[0];
    let bestScore = -1;
    for (const s of list) {
      const b = words(s.input);
      let common = 0;
      for (const w of a) if (b.has(w)) common++;
      const score = a.size && b.size ? common / Math.sqrt(a.size * b.size) : 0;
      if (score > bestScore) {
        best = s;
        bestScore = score;
      }
    }
    return best;
  }

  async function callLive(agent, input, receivedAt) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), LIVE_TIMEOUT_MS);
    const t0 = performance.now();
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agent.id, input, receivedAt }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("resting");
      const data = await res.json();
      if (!data || !data.result || !data.received) throw new Error("resting");
      return Object.assign(data, { clientMs: Math.round(performance.now() - t0) });
    } finally {
      clearTimeout(timer);
    }
  }

  async function runTrigger() {
    const agent = state.agent;
    if (!agent || state.busy) return;
    const d = draftFor(agent);
    const input = d.input.trim();
    if (!input) return formError("Pick a sample or type a lead message first.");
    if (input.length > MAX_INPUT) return formError(`Keep it under ${MAX_INPUT.toLocaleString("en-AU")} characters.`);
    const token = ++state.runToken;

    const sample = matchSample(agent, d);
    if (sample) {
      const run = runFromSample(agent, sample, "sample");
      addLog(run);
      playRun(run);
      return;
    }

    // Live call: one request returns the whole result, then the nodes reveal.
    state.busy = true;
    state.run = null;
    state.started = true;
    closePanel({ restoreFocus: false });
    canvas.reset();
    canvas.markStart(false);
    const trigger = agent.nodes.find((n) => n.type === "trigger");
    canvas.setNode(trigger.id, "running", "Custom message");
    setStatus({ kind: "pending", text: "Running live…" });

    let run;
    try {
      const data = await callLive(agent, input, d.receivedAt);
      run = {
        agent: agent.id,
        source: "custom",
        channel: null,
        triggerCaption: "Custom message",
        input,
        receivedAt: d.receivedAt,
        result: data.result,
        received: data.received,
        ms: data.ms,
        clientMs: data.clientMs,
      };
    } catch (e) {
      run = runFromSample(agent, closestSample(agent, input), "fallback");
    }
    state.busy = false;
    if (token !== state.runToken) return;
    addLog(run);
    if (state.route === agent.id) playRun(run);
  }

  async function playRun(run, { replay = false } = {}) {
    const agent = byId(run.agent);
    if (!agent) return;
    if (state.route !== agent.id) go(agent.id);
    state.run = run;
    state.started = true;
    canvas.markStart(false);
    closePanel({ restoreFocus: false });
    const plan = AgentCanvas.plan(agent, run);
    setStatus(statusFor(run, replay));
    state.playing = true;
    const done = await canvas.play(plan, {
      stepMs: STEP_MS,
      instant: mqReduce.matches,
      onStep: (id) => {
        if (state.panel && state.panel.kind === "node" && state.panel.id === id) renderPanel();
      },
    });
    state.playing = false;
    if (!done || state.run !== run) return;
    const output = agent.nodes.find((n) => n.type === "output");
    if (output) openPanel({ kind: "node", id: output.id });
  }

  /* ---------------- Execution logs ---------------- */
  function addLog(run) {
    const entry = Object.assign({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString() }, run);
    state.logs.unshift(entry);
    state.logs = state.logs.slice(0, LOG_MAX);
    saveLogs();
    updateLogsCount();
    if (state.panel && state.panel.kind === "logs") renderPanel();
  }
  function updateLogsCount() {
    const n = state.logs.length;
    els.logsCount.textContent = n ? String(n) : "";
    els.logsCount.hidden = !n;
  }
  function fmtLogTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return d.toDateString() === new Date().toDateString() ? `Today, ${time}` : `${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`;
  }
  const sourceLabel = (l) =>
    l.source === "custom" ? `Custom · ${fmtSecs(l.clientMs || l.ms)}` : l.source === "fallback" ? "Custom · recorded fallback" : `Sample · ${l.sampleLabel || ""}`;

  function logsPanel() {
    const rows = state.logs
      .map((l) => {
        const agent = byId(l.agent);
        let summary = "";
        try { summary = agent.summarize(l.result); } catch (e) { summary = ""; }
        return `<li><button type="button" class="ag-log" data-log="${esc(l.id)}">
          <span class="ag-log-top"><span class="ag-log-time">${esc(fmtLogTime(l.at))}</span><span class="ag-log-src" data-source="${esc(l.source)}">${esc(sourceLabel(l))}</span></span>
          <span class="ag-log-agent">${esc(agent ? agent.name : l.agent)}</span>
          <span class="ag-log-sum">${esc(summary)}</span>
          <span class="ag-log-replay">${agentIcon("play", 14)} Replay</span>
        </button></li>`;
      })
      .join("");
    const body = state.logs.length
      ? `<p class="ag-about">Your runs in this browser, newest first. Click one to replay it. Nothing here leaves your device.</p><ul class="ag-logs">${rows}</ul>`
      : `<div class="ag-empty"><p>No runs yet. Open the first step on the canvas and run a sample.</p></div>`;
    const footer = state.logs.length ? `<button type="button" class="ag-btn is-quiet" id="ag-clear-logs">Clear history</button>` : "";
    return panelShell({ icon: "logs", kind: `${state.logs.length} of ${LOG_MAX} kept`, title: "Execution logs", body, footer });
  }
  function replayLog(id) {
    const l = state.logs.find((x) => x.id === id);
    if (l) playRun(l, { replay: true });
  }

  /* ---------------- Boot ---------------- */
  document.querySelectorAll("[data-icon]").forEach((el) => el.insertAdjacentHTML("afterbegin", agentIcon(el.dataset.icon, Number(el.dataset.size) || 20)));
  buildDock();
  bindTips();
  buildCards();
  updateLogsCount();
  const mail = $("#ag-mail");
  if (mail) mail.href = `mailto:${EMAIL}`;
  mqMobile.addEventListener("change", () => {
    hideTip();
    if (state.panel) positionPanelMode();
  });
  render();
})();
