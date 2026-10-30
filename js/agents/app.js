/* ============================================================
   /agents app shell: theme, dock, hash routing, landing cards,
   top bar, side panel (node details, trigger form, execution
   logs), run flow and the recorded-run fallback.

   Two agent modes share everything here:
   - single run: the trigger form starts one run; the output panel
     opens when it finishes.
   - chat (agent.mode === "chat"): the panel has Chat and Step
     details tabs. Each visitor message is one run of the graph,
     revealed node by node, then the next message starts fresh.

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
  const LIVE_TIMEOUT_MS = 30000;
  // Chat mode. Limits mirror api/agent.js so the visitor is told before
  // the server would refuse.
  const CHAT_STEP_MS = 400;
  const MAX_CHAT_TURNS = 12;
  const MAX_CHAT_MSG = 500;
  const MAX_CHAT_TOTAL = 4000;
  const isChat = (agent) => !!agent && agent.mode === "chat";
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
    send: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
    newChat: '<path d="M20 12V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1.5v3.5L11 17h1.5"/><path d="M18 14.5v6M15 17.5h6"/>',
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
      const validTurn = (t) => t && typeof t.user === "string" && t.result && typeof t.result.reply === "string";
      const valid = (l) => l && byId(l.agent) && (l.kind === "chat" ? Array.isArray(l.turns) && l.turns.length > 0 && l.turns.every(validTurn) : !!l.result);
      return Array.isArray(list) ? list.filter(valid).slice(0, LOG_MAX) : [];
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
    started: new Set(), // agents that have run this visit (hides their "Start here")
    panel: null, // { kind: "node", id } | { kind: "logs" }
    panelOpener: null,
    drafts: {}, // per agent, in memory only: { input, receivedAt }
    logs: loadLogs(),
    landingScroll: 0,
    status: null,
    // Chat mode, in memory only: one conversation per chat agent.
    chats: {},
    chatDrafts: {},
    chatToken: 0, // bumps on New conversation / replay, cancelling the old one
    detailId: null, // last node shown in Step details
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
    reopen: $("#ag-reopen"),
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
    const agentButtons = LIVE.filter((a) => !a.team).map(
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
  // A team agent lights up its team's tile.
  const activeRoute = () => {
    const a = byId(state.route);
    return a && a.team ? a.team : state.route;
  };
  function renderDock() {
    els.dock.querySelectorAll("[data-route]").forEach((b) => {
      const on = b.dataset.route === activeRoute();
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
  // Landing thumbnails: a small static sketch of each agent's OUTPUT,
  // placeholder lines only (no readable copy), grays plus the accent.
  const line = (w) => `<i class="ag-pv-line" style="width:${w}%"></i>`;
  const PREVIEWS = {
    phone: () => `
      <div class="ag-pv ag-pv-phone">
        <div class="ag-pv-bubble is-in">${line(92)}${line(64)}</div>
        <div class="ag-pv-bubble is-reply">${line(94)}${line(88)}${line(52)}</div>
      </div>`,
    chat: () => `
      <div class="ag-pv ag-pv-chat">
        <div class="ag-pv-bubble is-me">${line(84)}</div>
        <div class="ag-pv-bubble is-reply">${line(94)}${line(66)}</div>
        <div class="ag-pv-bubble is-me">${line(58)}</div>
      </div>`,
    review: () => `
      <div class="ag-pv ag-pv-review">
        <div class="ag-pv-stars">${[1, 2, 3, 4, 5].map((n) => `<span class="${n <= 4 ? "is-on" : ""}">${agentIcon("star", 12)}</span>`).join("")}</div>
        ${line(94)}${line(70)}
        <div class="ag-pv-reply">${line(90)}${line(58)}</div>
      </div>`,
    table: () => `
      <div class="ag-pv ag-pv-table">
        ${["accent", "strong", "muted"].map((tone, i) => `<div class="ag-pv-row">${line([54, 46, 50][i])}<span class="ag-pv-tag" data-tone="${tone}"></span></div>`).join("")}
      </div>`,
    board: () => `
      <div class="ag-pv ag-pv-board">
        ${[[0, 1, 0, 0, 1, 0, 0], [1, 0, 1, 0, 0, 0, 1], [0, 0, 1, 1, 0, 1, 0], [0, 1, 0, 0, 1, 0, 0]]
          .map((row) => `<div class="ag-pv-lane">${row.map((on, i) => `<span class="${on ? (i === 2 ? "is-on" : "is-chip") : ""}"></span>`).join("")}</div>`)
          .join("")}
      </div>`,
  };
  const previewHtml = (agent) => `<div class="ag-pv-wrap" aria-hidden="true">${(PREVIEWS[agent.preview] || PREVIEWS.phone)()}</div>`;
  function buildCards() {
    const cards = AGENTS.filter((a) => !a.team).sort((a, b) => (b.flagship ? 1 : 0) - (a.flagship ? 1 : 0));
    els.cards.innerHTML = cards.map((a) => {
      const live = a.status === "live";
      const media = live
        ? `<div class="ag-card-media">${previewHtml(a)}</div>`
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
          ${live ? `<span class="ag-card-cta">${esc(a.cta || "Open agent")} ${agentIcon("arrow", 16)}</span>` : `<span class="ag-card-state">In training</span>`}
        </div>`;
      return live
        ? `<a class="ag-card is-live${a.flagship ? " is-wide" : ""}" href="#${a.id}" data-route="${a.id}">${media}${meta}</a>`
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
    if (isChat(byId(prev))) stopChat(byId(prev));
    closePanel({ restoreFocus: false });
    hideTip();
    AgentOps.hide();
    if (agent && agent.view === "ops") showOps(agent, prev === "");
    else if (agent) showAgent(agent, prev === "");
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

  // The ops board is a page of its own, not a canvas.
  function showOps(agent, fromLanding) {
    if (fromLanding) state.landingScroll = window.scrollY;
    els.landing.hidden = true;
    els.workspace.hidden = true;
    document.body.classList.remove("is-workspace");
    document.title = `${agent.name} | AI Business Agents`;
    AgentOps.show();
  }

  function showAgent(agent, fromLanding) {
    if (fromLanding) state.landingScroll = window.scrollY;
    els.landing.hidden = true;
    els.workspace.hidden = false;
    document.body.classList.add("is-workspace");
    document.title = `${agent.name} | AI Business Agents`;
    els.titleName.textContent = agent.name;
    els.titleBiz.textContent = agent.business;
    els.back.setAttribute("aria-label", agent.team ? "Back to the Ops Team" : "Back to all agents");
    window.scrollTo(0, 0);
    canvas.setVertical(mqMobile.matches);
    if (canvas.agent !== agent) {
      state.agent = agent;
      state.run = null;
      setStatus(null);
      canvas.load(agent);
      canvas.markStart(!state.started.has(agent.id));
      if (isChat(agent)) showChatTurn(agent, chatFor(agent).viewTurn);
    }
    // Chat agents open with the Chat tab, which stays put.
    if (isChat(agent)) openPanel({ kind: "chat", tab: "chat", id: null });
    updateReopen();
    requestAnimationFrame(() => fitCanvas());
  }

  els.back.addEventListener("click", () => {
    // Back to where the visitor came from: the board, or the landing view.
    const from = history.state && history.state.agFrom;
    const parent = state.agent && state.agent.team ? state.agent.team : "";
    if (from === parent || from === "ops-team") history.back();
    else go(parent);
  });
  window.addEventListener("popstate", render);
  window.addEventListener("hashchange", render);

  /* ---------------- Canvas ---------------- */
  const canvas = new AgentCanvas(els.viewport, {
    onNodeClick: (id) => (isChat(state.agent) ? openChatNode(id) : openPanel({ kind: "node", id })),
    reducedMotion: () => mqReduce.matches,
    insets: () => {
      if (mqMobile.matches) {
        const dockTop = els.dock.getBoundingClientRect().top;
        const vpTop = els.viewport.getBoundingClientRect().top;
        // A chat agent's sheet stays open over the canvas: frame above it.
        const sheetTop = isChat(state.agent) && state.panel && !els.panel.hidden ? els.panel.getBoundingClientRect().top : Infinity;
        if (sheetTop < dockTop) return { top: 24, left: 16, right: 16, bottom: els.viewport.clientHeight - Math.max(160, sheetTop - vpTop) + 12 };
        const visible = Math.max(200, dockTop - vpTop);
        return { top: 28, left: 16, right: 16, bottom: els.viewport.clientHeight - visible + 64 };
      }
      const panelOpen = state.panel && !els.panel.hidden;
      return { top: 56, left: 112, right: panelOpen ? els.panel.offsetWidth + 40 : 40, bottom: 88 };
    },
  });

  $("#ag-zoom-in").addEventListener("click", () => canvas.zoomBy(1.2));
  $("#ag-zoom-out").addEventListener("click", () => canvas.zoomBy(1 / 1.2));
  $("#ag-zoom-fit").addEventListener("click", () => fitCanvas(true));
  els.reopen.addEventListener("click", () => openPanel({ kind: "chat", tab: "chat", id: null }));

  // A chat agent's panel stays open on desktop, so its flow keeps a
  // readable scale and lines up from the first node; runs follow the
  // active node. Single-run agents fit the whole flow, as before.
  function fitCanvas(animate = false) {
    const panelOpen = state.panel && !els.panel.hidden;
    if (isChat(state.agent) && panelOpen && !mqMobile.matches) return canvas.fit({ animate, floorScale: 0.8 });
    return canvas.fit({ animate });
  }

  function updateReopen() {
    const panelOpen = state.panel && !els.panel.hidden;
    els.reopen.hidden = !(isChat(state.agent) && !els.workspace.hidden && !panelOpen);
  }

  // A plain click on empty canvas closes the panel (not a chat agent's
  // panel, which holds the conversation).
  els.viewport.addEventListener("click", (e) => {
    if (canvas.dragged || e.target.closest(".ag-node, .ag-canvas-ui")) return;
    if (state.panel && !isChat(state.agent)) closePanel();
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!state.agent || els.workspace.hidden) return;
      const changed = canvas.setVertical(mqMobile.matches);
      if (state.panel) positionPanelMode();
      if (changed || !canvas.userMoved) fitCanvas();
    }, 120);
  });

  /* ---------------- Status chip ---------------- */
  function setStatus(s) {
    if (!s || s.kind !== "pending") stopLiveStatus();
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
  // While a live call runs: the agent's own short lines, one after the
  // other, ending on the last. Reduced motion shows the first line only.
  // Screen readers hear the first line, not every change.
  const LIVE_LINE_MS = 1600;
  let liveTimer = null;
  function startLiveStatus(agent, values) {
    let lines = [];
    try { lines = (agent.liveStatus ? agent.liveStatus(values) : []).filter(Boolean); } catch (e) { lines = []; }
    if (!lines.length) lines = ["Running live…"];
    setStatus({ kind: "pending", text: lines[0] });
    if (mqReduce.matches || lines.length < 2) return;
    let i = 0;
    els.status.setAttribute("aria-live", "off");
    liveTimer = setInterval(() => {
      i++;
      setStatus({ kind: "pending", text: lines[i] });
      if (i >= lines.length - 1) stopLiveStatus();
    }, LIVE_LINE_MS);
  }
  function stopLiveStatus() {
    clearInterval(liveTimer);
    liveTimer = null;
    els.status.setAttribute("aria-live", "polite");
  }

  // The canvas pill only appears while a live call runs and when the
  // resting fallback plays: those tell the visitor something real.
  // Samples, finished live runs and replays show no label.
  function statusFor(run, replay) {
    return run.source === "fallback" && !replay ? { kind: "resting", text: FALLBACK_NOTE } : null;
  }
  const fmtSecs = (ms) => `${(Math.max(0, ms || 0) / 1000).toFixed(1)}s`;

  /* ---------------- Panel ---------------- */
  function positionPanelMode() {
    els.panel.classList.toggle("is-sheet", mqMobile.matches);
  }

  const samePanel = (a, b) => !!a && !!b && a.kind === b.kind && (a.id || null) === (b.id || null) && (a.tab || null) === (b.tab || null);

  function openPanel(p) {
    const wasOpen = !!state.panel && !els.panel.hidden;
    if (wasOpen && samePanel(state.panel, p)) return;
    const prevKind = wasOpen ? state.panel.kind : null;
    if (!state.panel) state.panelOpener = document.activeElement;
    state.panel = p;
    if (p.kind === "chat" && p.tab === "details") state.detailId = p.id || null;
    positionPanelMode();
    els.panel.classList.toggle("is-chat", p.kind === "chat");
    renderPanel();
    els.panel.hidden = false;
    requestAnimationFrame(() => els.panel.classList.add("is-open"));
    const selected = p.kind === "node" || (p.kind === "chat" && p.tab === "details") ? p.id || null : null;
    canvas.select(selected);
    els.logsBtn.setAttribute("aria-expanded", p.kind === "logs" ? "true" : "false");
    updateReopen();
    // Focus the heading when the panel opens or changes kind; switching
    // chat tabs keeps focus on the tabs.
    if (p.kind !== "chat" || prevKind !== "chat") {
      const focusTarget = $(".ag-panel-title", els.panel);
      if (focusTarget) focusTarget.focus({ preventScroll: true });
    } else if (els.panel.contains(document.activeElement) || document.activeElement === document.body) {
      const tab = $('.ag-tab[aria-selected="true"]', els.panel);
      if (tab) tab.focus({ preventScroll: true });
    }
    requestAnimationFrame(() => {
      if (isChat(state.agent)) {
        if (!wasOpen && !mqMobile.matches && !canvas.userMoved) fitCanvas(true);
        else if (selected) canvas.ensureVisible(selected, revealInsets());
        return;
      }
      // Desktop: if the visitor hasn't moved the canvas and the whole flow
      // still reads well beside the panel, refit it there. Otherwise just
      // bring the selected node into view.
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
    updateReopen();
    if (!mqMobile.matches && !canvas.userMoved && !els.workspace.hidden) requestAnimationFrame(() => fitCanvas(true));
    const opener = state.panelOpener;
    state.panelOpener = null;
    if (restoreFocus && hadFocus && opener && document.contains(opener)) {
      try { opener.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  }

  function panelShell({ icon, kind, title, body, footer, tabs = "", footClass = "", actions = "", bodyClass = "" }) {
    return `
      <div class="ag-panel-grip" aria-hidden="true"></div>
      <header class="ag-panel-head">
        ${icon ? `<span class="ag-panel-icon">${agentIcon(icon, 20)}</span>` : ""}
        <div class="ag-panel-heading">
          ${kind ? `<span class="ag-panel-kind">${esc(kind)}</span>` : ""}
          <h2 class="ag-panel-title" id="ag-panel-title" tabindex="-1">${esc(title)}</h2>
        </div>
        ${actions}
        <button type="button" class="ag-icon-btn ag-panel-close" aria-label="Close panel">${agentIcon("close", 20)}</button>
      </header>
      ${tabs}
      <div class="ag-panel-body${bodyClass ? ` ${bodyClass}` : ""}">${body}</div>
      ${footer ? `<footer class="ag-panel-foot${footClass ? ` ${footClass}` : ""}">${footer}</footer>` : ""}`;
  }

  function renderPanel() {
    const p = state.panel;
    if (!p) return;
    const scroll = $(".ag-panel-body", els.panel);
    const key = p.kind === "chat" ? `chat:${p.tab}:${p.id || ""}` : `${p.kind}:${p.id || ""}`;
    const keepScroll = scroll && els.panel.dataset.for === key ? scroll.scrollTop : 0;
    els.panel.dataset.for = key;
    if (p.kind === "logs") els.panel.innerHTML = logsPanel();
    else if (p.kind === "chat") els.panel.innerHTML = chatPanel(state.agent, p);
    else {
      const def = state.agent && state.agent.nodes.find((n) => n.id === p.id);
      if (!def) return closePanel();
      els.panel.innerHTML = def.type === "trigger" ? triggerPanel(state.agent, def) : nodePanel(state.agent, def);
    }
    const body = $(".ag-panel-body", els.panel);
    if (body) body.scrollTop = keepScroll;
    if (p.kind === "node") bindTrigger();
    if (p.kind === "chat" && p.tab === "chat") {
      bindComposer();
      scrollThread(false);
    }
  }

  els.panel.addEventListener("click", (e) => {
    if (e.target.closest(".ag-panel-close")) return dismissPanel();
    const step = e.target.closest("[data-goto]");
    if (step) return openPanelStep(step.dataset.goto);
    const log = e.target.closest("[data-log]");
    if (log) return replayLog(log.dataset.log);
    const tab = e.target.closest("[data-tab]");
    if (tab) return openPanel({ kind: "chat", tab: tab.dataset.tab, id: tab.dataset.tab === "details" ? state.detailId : null });
    if (e.target.closest("#ag-new-chat")) return newConversation();
    const sample = e.target.closest("[data-chat-sample]");
    if (sample) return playChatSample(sample.dataset.chatSample);
    const turn = e.target.closest("[data-view-turn]");
    if (turn) return viewTurn(Number(turn.dataset.viewTurn));
    const bubble = e.target.closest("[data-turn]");
    if (bubble) {
      viewTurn(Number(bubble.dataset.turn));
      return openPanel({ kind: "chat", tab: "details", id: state.detailId });
    }
    if (e.target.closest("#ag-clear-logs")) {
      state.logs = [];
      store.remove(LOG_KEY);
      updateLogsCount();
      renderPanel();
    }
  });
  function openPanelStep(id) {
    const opener = state.panelOpener;
    if (isChat(state.agent)) {
      openChatNode(id);
      state.panelOpener = opener;
      return;
    }
    state.panel = null; // force a re-render even if the same kind
    openPanel({ kind: "node", id });
    state.panelOpener = opener;
  }

  // Chat agents: the trigger is the Chat tab; any other node is Step details.
  function openChatNode(id) {
    const def = state.agent.nodes.find((n) => n.id === id);
    if (!def || def.type === "trigger") return openPanel({ kind: "chat", tab: "chat", id: null });
    openPanel({ kind: "chat", tab: "details", id });
  }

  // x, Esc and the logs toggle: a chat agent goes back to its chat from
  // the logs; everything else closes.
  function dismissPanel() {
    if (state.panel && state.panel.kind === "logs" && isChat(state.agent) && !els.workspace.hidden) {
      return openPanel({ kind: "chat", tab: "chat", id: null });
    }
    closePanel();
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    hideTip();
    if (state.panel) {
      e.preventDefault();
      dismissPanel();
    }
  });

  els.logsBtn.addEventListener("click", () => {
    if (state.panel && state.panel.kind === "logs") dismissPanel();
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
    return panelShell({ icon: def.icon, kind: KIND[def.type] || "Step", title: def.label, body: nodeBody(agent, def), footer: stepNav(agent, def) });
  }

  // What a step did on the run shown on the canvas (shared by the
  // single-run panel and a chat agent's Step details tab).
  function nodeBody(agent, def) {
    const node = canvas.nodes.get(def.id);
    const nodeState = node ? node.el.dataset.state : "idle";
    const trigger = agent.nodes.find((n) => n.type === "trigger");
    let body = `<p class="ag-about">${esc(def.about)}</p>`;
    if (!state.run && !state.busy) {
      body += isChat(agent)
        ? `<div class="ag-empty"><p>Send a message or play a sample to see what this step does.</p><button type="button" class="ag-btn" data-goto="${trigger.id}">Open chat</button></div>`
        : `<div class="ag-empty"><p>Run the agent to see what this step produces.</p><button type="button" class="ag-btn" data-goto="${trigger.id}">Open ${esc(trigger.label)}</button></div>`;
    } else if (nodeState === "error") {
      body += `<div class="ag-empty"><p>This step couldn't finish on this run.</p></div>`;
    } else if (nodeState === "skipped") {
      let own = false;
      try { own = !!(def.skip && state.run && def.skip(state.run.result, state.run)); } catch (e) { own = false; }
      if (own && def.skippedView) {
        let blocks = [];
        try { blocks = def.skippedView(state.run) || []; } catch (e) { blocks = []; }
        body += blocks.map(renderBlock).join("");
      } else {
        body += `<div class="ag-empty"><p>Not used on this run. The decision before it took the other path.</p></div>`;
      }
    } else if (nodeState !== "done" || state.busy) {
      body += `<div class="ag-empty is-working"><span class="ag-spinner" aria-hidden="true"></span><p>Working on it…</p></div>`;
    } else {
      if (def.type === "output" && state.status && state.status.kind === "resting") {
        body += `<div class="ag-run-meta" data-kind="resting">${esc(state.status.text)}</div>`;
      }
      let blocks = [];
      try { blocks = def.view(state.run) || []; } catch (e) { blocks = [{ type: "note", body: "This step has nothing to show for this run." }]; }
      body += blocks.map(renderBlock).join("");
    }
    return body;
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
      const byWords = b.unit === "words";
      const limit = b.limit || 320;
      const len = byWords ? String(b.body || "").trim().split(/\s+/).filter(Boolean).length : (b.body || "").length;
      const pct = Math.min(100, Math.round((len / limit) * 100));
      return `<div class="ag-sms"><div class="ag-bubble is-out">${esc(b.body)}</div></div>
        <div class="ag-meter" ${len > limit ? 'data-over="true"' : ""}><span class="ag-meter-bar"><i style="width:${pct}%"></i></span><span>${len} / ${limit} ${byWords ? "words" : "characters"}</span></div>`;
    },
    // Campaign table: one tappable row per lead (details/summary, so it
    // opens with a tap, Enter or Space), group tags in the sketch tones.
    table: (b) => {
      const rows = (b.rows || [])
        .map(
          (r) => `<details class="ag-trow" data-group="${esc(r.group)}">
          <summary>
            <span class="ag-trow-main"><strong>${esc(r.name)}</strong><span>${esc(r.job)} · ${esc(r.daysSinceQuote)} days${r.quoteExpired ? " · expired" : ""}</span></span>
            <span class="ag-tag" data-tone="${esc(r.tone)}">${esc(r.groupLabel)}</span>
            <span class="ag-trow-chev" aria-hidden="true">${agentIcon("right", 14)}</span>
          </summary>
          <div class="ag-trow-body">
            ${r.message ? `<div class="ag-bubble is-out">${esc(r.message)}</div>` : `<p class="ag-note">No message for this lead.</p>`}
            <dl class="ag-kv is-compact">
              <div><dt>Why</dt><dd>${esc(r.reason)}</dd></div>
              <div><dt>Next</dt><dd>${esc(r.nextAction)}</dd></div>
              <div><dt>Last note</dt><dd>${esc(r.note)}</dd></div>
            </dl>
          </div>
        </details>`
        )
        .join("");
      return `${title(b.title)}<div class="ag-trows"><div class="ag-trows-head" aria-hidden="true"><span>Lead</span><span>Group</span></div>${rows || '<p class="ag-text is-muted">No leads.</p>'}</div>`;
    },
    // A Google-style review with the owner's response underneath (mock).
    review: (b) => {
      const stars = [1, 2, 3, 4, 5].map((n) => `<span class="${n <= b.rating ? "is-on" : ""}">${agentIcon("star", 15)}</span>`).join("");
      return `${title(b.title)}
      <div class="ag-review">
        <div class="ag-review-head">
          <span class="ag-avatar">${esc(initials(b.name))}</span>
          <div><strong>${esc(b.name || "Customer")}</strong><span class="ag-review-stars" role="img" aria-label="${esc(b.rating)} out of 5 stars">${stars}</span></div>
        </div>
        <p class="ag-review-text">${esc(b.text)}</p>
        <div class="ag-review-reply"><span>Response from the owner</span><p>${esc(b.reply)}</p></div>
      </div>`;
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
    request: (b) => `${title(b.title)}
      <div class="ag-crm">
        <div class="ag-crm-head">
          <span class="ag-avatar is-lg">${esc(initials(b.name))}</span>
          <div class="ag-crm-id"><strong>${esc(b.name)}</strong></div>
          <span class="ag-stage">${esc(b.status)}</span>
        </div>
        <dl class="ag-kv is-compact">${b.rows
          .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd${isEmpty(v) ? ' class="is-empty"' : ""}>${esc(isEmpty(v) ? "Not given" : v)}</dd></div>`)
          .join("")}</dl>
        ${b.summary ? `<div class="ag-next"><span>${esc(b.summaryLabel || "For the front desk")}</span><p>${esc(b.summary)}</p></div>` : ""}
      </div>`,
  };
  Object.assign(BLOCKS, AgentOps.blocks({ esc, isEmpty, title }));
  const renderBlock = (b) => `<section class="ag-block" data-block="${esc(b.type)}">${(BLOCKS[b.type] || (() => ""))(b)}</section>`;

  /* ---------------- Trigger panel (the only place a run starts) ---------------- */
  // The form is built from agent.trigger.fields (see registry.js).
  function zonedNowLocal(timeZone) {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: timeZone || "Australia/Sydney",
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

  const fieldsOf = (agent) => (agent.trigger && agent.trigger.fields) || [];
  const primaryField = (agent) => fieldsOf(agent).find((f) => f.primary) || fieldsOf(agent).find((f) => f.type === "textarea") || fieldsOf(agent)[0];
  // A sample's value for a field: in sample.fields, or at the top level
  // (Speed-to-Lead's samples keep input and receivedAt there).
  const sampleValue = (s, f) => (s.fields && f.id in s.fields ? s.fields[f.id] : s[f.id]);
  let rowSeq = 0;
  const newRowId = () => `r${Date.now().toString(36).slice(-5)}${(rowSeq++).toString(36)}`;
  const blankRow = (f) => Object.assign({ id: newRowId() }, ...f.columns.map((c) => ({ [c.id]: "" })));
  const emptyValue = (f) =>
    f.type === "rating"
      ? 0
      : f.type === "time"
      ? zonedNowLocal(f.timeZone)
      : f.type === "select"
      ? f.options && f.options[0]
        ? f.options[0].value
        : ""
      : f.type === "table"
      ? Array.from({ length: f.minRows || 1 }, () => blankRow(f))
      : "";
  // Tables are compared and sent cell by cell; row ids only key the rows.
  const tableRows = (f, v) => (Array.isArray(v) ? v : []).map((r) => Object.assign({ id: r && r.id }, ...f.columns.map((c) => ({ [c.id]: String((r && r[c.id]) || "").trim() }))));
  const norm = (f, v) =>
    f.type === "rating"
      ? Number(v) || 0
      : f.type === "table"
      ? JSON.stringify(tableRows(f, v).map((r) => f.columns.map((c) => r[c.id])))
      : String(v == null ? "" : v).trim();
  // The value sent to the API (and kept in a run).
  const cleanValue = (f, v) => (f.type === "rating" ? Number(v) || 0 : f.type === "time" ? v : f.type === "table" ? tableRows(f, v) : norm(f, v));
  // Plain words for matching a custom input to the closest sample.
  const fieldText = (f, v) => (f && f.type === "table" ? tableRows(f, v).map((r) => f.columns.map((c) => r[c.id]).join(" ")).join(" ") : String(v == null ? "" : v).trim());
  // Copies, so editing a table never edits the sample it came from.
  const copyValue = (v) => (Array.isArray(v) ? v.map((r) => Object.assign({}, r)) : v);

  function draftFor(agent) {
    if (!state.drafts[agent.id]) {
      const first = samplesFor(agent)[0];
      const d = {};
      for (const f of fieldsOf(agent)) d[f.id] = first ? copyValue(sampleValue(first, f)) ?? emptyValue(f) : emptyValue(f);
      state.drafts[agent.id] = d;
    }
    return state.drafts[agent.id];
  }
  const matchSample = (agent, d) =>
    samplesFor(agent).find((s) => fieldsOf(agent).every((f) => norm(f, sampleValue(s, f)) === norm(f, d[f.id]))) || null;

  function fieldHtml(f, value) {
    if (f.type === "hidden") return ""; // carried with the sample, e.g. when it arrived
    const id = `ag-f-${f.id}`;
    const label = `<span class="ag-label"${f.type === "rating" ? ` id="${id}-label"` : ""}>${esc(f.label)}</span>`;
    if (f.type === "time") {
      return `<label class="ag-field">${label}<input type="datetime-local" class="ag-input" id="${id}" data-field="${f.id}" value="${esc(value)}" /></label>`;
    }
    if (f.type === "textarea") {
      return `<label class="ag-field">
        <span class="ag-label-row">${label}${f.maxLength ? `<span class="ag-count" data-count="${f.id}"></span>` : ""}</span>
        <textarea class="ag-input ag-textarea" id="${id}" data-field="${f.id}"${f.maxLength ? ` maxlength="${f.maxLength}"` : ""} rows="${f.rows || 5}" placeholder="${esc(f.placeholder || "")}">${esc(value)}</textarea>
      </label>`;
    }
    if (f.type === "select") {
      const opts = (f.options || []).map((o) => `<option value="${esc(o.value)}"${String(o.value) === String(value) ? " selected" : ""}>${esc(o.label)}</option>`).join("");
      return `<label class="ag-field">${label}<select class="ag-input ag-select" id="${id}" data-field="${f.id}">${opts}</select></label>`;
    }
    if (f.type === "table") {
      const rows = Array.isArray(value) ? value : [];
      const cards = rows
        .map((r, i) => {
          const cells = f.columns
            .map(
              (c) => `<label class="ag-cell${c.wide ? " is-wide" : ""}"><span>${esc(c.label)}</span><input class="ag-input" type="${c.type === "date" ? "date" : "text"}" data-cell="${c.id}"${c.maxLength ? ` maxlength="${c.maxLength}"` : ""} placeholder="${esc(c.placeholder || "")}" value="${esc(r[c.id] || "")}" /></label>`
            )
            .join("");
          return `<fieldset class="ag-rowcard" data-row="${esc(r.id)}">
            <legend class="ag-rowcard-title">${esc(f.rowLabel || "Row")} ${i + 1}</legend>
            <button type="button" class="ag-icon-btn ag-rowremove" data-remove-row="${esc(r.id)}" aria-label="Remove ${esc((f.rowLabel || "row").toLowerCase())} ${i + 1}"${rows.length <= (f.minRows || 1) ? " disabled" : ""}>${agentIcon("close", 16)}</button>
            <div class="ag-rowgrid">${cells}</div>
          </fieldset>`;
        })
        .join("");
      return `<div class="ag-field ag-tablefield" data-table="${f.id}">
        <span class="ag-label-row">${label}<span class="ag-count">${rows.length} of ${f.maxRows} rows</span></span>
        <div class="ag-rowlist">${cards}</div>
        <button type="button" class="ag-btn is-quiet ag-addrow" data-add-row="${f.id}"${rows.length >= f.maxRows ? " disabled" : ""}>${agentIcon("plus", 16)}<span>Add ${esc((f.rowLabel || "row").toLowerCase())}</span></button>
      </div>`;
    }
    if (f.type === "rating") {
      const v = Number(value) || 0;
      const stars = [1, 2, 3, 4, 5]
        .map(
          (n) => `<button type="button" role="radio" class="ag-star${n <= v ? " is-on" : ""}" data-star="${n}" aria-checked="${n === v}" aria-label="${n} star${n === 1 ? "" : "s"}" tabindex="${n === (v || 1) ? 0 : -1}">${agentIcon("star", 22)}</button>`
        )
        .join("");
      return `<div class="ag-field">${label}<div class="ag-stars" role="radiogroup" aria-labelledby="${id}-label" data-field="${f.id}">${stars}</div></div>`;
    }
    return `<label class="ag-field">${label}<input type="text" class="ag-input" id="${id}" data-field="${f.id}"${f.maxLength ? ` maxlength="${f.maxLength}"` : ""} placeholder="${esc(f.placeholder || "")}" value="${esc(value)}" /></label>`;
  }

  function triggerPanel(agent, def) {
    const d = draftFor(agent);
    const active = matchSample(agent, d);
    const chips = samplesFor(agent)
      .map(
        (s) => `<button type="button" class="ag-chip${active && active.id === s.id ? " is-active" : ""}" data-sample="${s.id}" aria-pressed="${active && active.id === s.id}">
          <strong>${esc(s.label)}</strong><span>${esc(s.channel || "")}</span></button>`
      )
      .join("");
    const body = `
      <p class="ag-about">${esc(def.about)}</p>
      <div class="ag-field">
        <span class="ag-label">Samples</span>
        <div class="ag-chips">${chips}</div>
      </div>
      ${fieldsOf(agent).map((f) => fieldHtml(f, d[f.id])).join("\n")}
      <p class="ag-hint" id="ag-hint"></p>
      <p class="ag-error" id="ag-error" role="alert" hidden></p>`;
    const footer = `<button type="button" class="ag-run" id="ag-run"${state.busy ? " disabled" : ""}>${agentIcon("play", 16)}<span>${state.busy ? "Running…" : "Run agent"}</span></button>`;
    return panelShell({ icon: def.icon, kind: KIND.trigger, title: def.label, body, footer });
  }

  function setRating(group, value, focus) {
    group.querySelectorAll(".ag-star").forEach((b) => {
      const n = Number(b.dataset.star);
      b.classList.toggle("is-on", n <= value);
      b.setAttribute("aria-checked", String(n === value));
      b.tabIndex = n === (value || 1) ? 0 : -1;
      if (focus && n === value) b.focus();
    });
  }

  function bindTrigger() {
    const run = $("#ag-run", els.panel);
    if (!run || !state.agent || isChat(state.agent)) return;
    const agent = state.agent;
    const d = draftFor(agent);
    const t = agent.trigger || {};
    const hints = Object.assign(
      { sample: "This sample replays a recorded run, no live call. Edit any field to run it live.", custom: "Custom input runs the agent live.", empty: "Pick a sample or write your own." },
      t.hints || {}
    );
    const sync = () => {
      const active = matchSample(agent, d);
      els.panel.querySelectorAll(".ag-chip").forEach((c) => {
        const on = !!active && c.dataset.sample === active.id;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      els.panel.querySelectorAll("[data-count]").forEach((el) => {
        const f = fieldsOf(agent).find((x) => x.id === el.dataset.count);
        el.textContent = `${String(d[f.id] || "").length.toLocaleString("en-AU")} / ${f.maxLength.toLocaleString("en-AU")}`;
      });
      const primary = primaryField(agent);
      $("#ag-hint", els.panel).textContent = active ? hints.sample : primary && norm(primary, d[primary.id]) ? hints.custom : hints.empty;
      $("#ag-error", els.panel).hidden = true;
    };
    for (const f of fieldsOf(agent)) {
      if (f.type === "table") {
        const box = els.panel.querySelector(`[data-table="${f.id}"]`);
        if (!box) continue;
        box.addEventListener("input", (e) => {
          const cell = e.target.closest("[data-cell]");
          const card = e.target.closest("[data-row]");
          if (!cell || !card) return;
          const row = d[f.id].find((r) => r.id === card.dataset.row);
          const col = f.columns.find((c) => c.id === cell.dataset.cell);
          if (row && col) row[col.id] = col.maxLength ? cell.value.slice(0, col.maxLength) : cell.value;
          sync();
        });
        // Adding or removing a row re-renders the form, then focuses the
        // new row (or the add button).
        box.addEventListener("click", (e) => {
          const add = e.target.closest("[data-add-row]");
          const remove = e.target.closest("[data-remove-row]");
          if (add && d[f.id].length < f.maxRows) {
            const row = blankRow(f);
            d[f.id].push(row);
            renderPanel();
            const first = els.panel.querySelector(`[data-row="${row.id}"] input`);
            if (first) first.focus();
          } else if (remove && d[f.id].length > (f.minRows || 1)) {
            d[f.id] = d[f.id].filter((r) => r.id !== remove.dataset.removeRow);
            renderPanel();
            const btn = els.panel.querySelector(`[data-add-row="${f.id}"]`);
            if (btn) btn.focus();
          }
        });
        continue;
      }
      if (f.type === "rating") {
        const group = els.panel.querySelector(`.ag-stars[data-field="${f.id}"]`);
        group.addEventListener("click", (e) => {
          const b = e.target.closest(".ag-star");
          if (!b) return;
          d[f.id] = Number(b.dataset.star);
          setRating(group, d[f.id], false);
          sync();
        });
        // Radio-group keys: arrows move and select, Home/End jump.
        group.addEventListener("keydown", (e) => {
          const cur = Number(d[f.id]) || 0;
          let next = null;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(5, cur + 1);
          else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(1, cur - 1);
          else if (e.key === "Home") next = 1;
          else if (e.key === "End") next = 5;
          else if (e.key === " " || e.key === "Enter") next = Number(e.target.closest(".ag-star") ? e.target.closest(".ag-star").dataset.star : cur || 1);
          if (next == null) return;
          e.preventDefault();
          d[f.id] = next;
          setRating(group, next, true);
          sync();
        });
        continue;
      }
      const el = els.panel.querySelector(`[data-field="${f.id}"]`);
      if (!el) continue;
      el.addEventListener("input", () => {
        d[f.id] = f.maxLength ? el.value.slice(0, f.maxLength) : el.value;
        sync();
      });
      el.addEventListener("change", () => {
        d[f.id] = el.value;
        sync();
      });
      if (f.type === "textarea") {
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            runTrigger();
          }
        });
      }
    }
    els.panel.querySelectorAll(".ag-chip").forEach((chip) =>
      chip.addEventListener("click", () => {
        const s = samplesFor(agent).find((x) => x.id === chip.dataset.sample);
        if (!s) return;
        let rebuild = false;
        for (const f of fieldsOf(agent)) {
          const v = sampleValue(s, f);
          d[f.id] = v == null ? emptyValue(f) : copyValue(v);
          if (f.type === "table") rebuild = true;
          else if (f.type === "rating") setRating(els.panel.querySelector(`.ag-stars[data-field="${f.id}"]`), Number(d[f.id]) || 0, false);
          else {
            const el = els.panel.querySelector(`[data-field="${f.id}"]`);
            if (el) el.value = d[f.id];
          }
        }
        if (rebuild) {
          renderPanel();
          const again = els.panel.querySelector(`.ag-chip[data-sample="${s.id}"]`);
          if (again) again.focus();
          return;
        }
        sync();
      })
    );
    run.addEventListener("click", runTrigger);
    sync();
  }

  // Client-side checks mirror the server's (required, rating, length).
  function validateFields(agent, d) {
    const t = agent.trigger || {};
    for (const f of fieldsOf(agent)) {
      if (f.type === "table") {
        const rows = tableRows(f, d[f.id]);
        const noun = (f.rowLabel || "row").toLowerCase();
        if (rows.length < (f.minRows || 1) || rows.length > f.maxRows) return `Use ${f.minRows} to ${f.maxRows} ${noun}s.`;
        let total = 0;
        for (const [i, r] of rows.entries()) {
          for (const c of f.columns) {
            const v = r[c.id];
            total += v.length;
            if (c.required && !v) return t.emptyError || `Fill in ${c.label.toLowerCase()} for ${noun} ${i + 1}.`;
            if (c.maxLength && v.length > c.maxLength) return `Keep ${c.label.toLowerCase()} under ${c.maxLength} characters (${noun} ${i + 1}).`;
            if (c.type === "date" && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return `Check the ${c.label.toLowerCase()} for ${noun} ${i + 1}.`;
          }
        }
        if (f.maxTotal && total > f.maxTotal) return `That list is too long for the demo. Trim the notes a little.`;
        continue;
      }
      const v = norm(f, d[f.id]);
      if (f.type === "rating") {
        if ((f.required && !v) || (v && (v < 1 || v > 5))) return t.emptyError || `Choose a ${f.label.toLowerCase()}.`;
        continue;
      }
      if (f.required && !v) return t.emptyError || `Fill in ${f.label.toLowerCase()}.`;
      if (f.maxLength && v.length > f.maxLength) return `Keep ${f.label.toLowerCase()} under ${f.maxLength.toLocaleString("en-AU")} characters.`;
    }
    return null;
  }

  function formError(text) {
    const el = $("#ag-error", els.panel);
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
  }

  /* ---------------- Runs ---------------- */
  function runFromSample(agent, s, source) {
    const primary = primaryField(agent);
    const run = {
      agent: agent.id,
      source,
      sampleId: s.id,
      sampleLabel: s.label,
      channel: s.channel,
      triggerCaption: triggerCaption(agent, s.fields || s, s.channel),
      input: primary ? (primary.type === "table" ? fieldText(primary, sampleValue(s, primary)) : sampleValue(s, primary)) : s.input,
      receivedAt: s.receivedAt,
      result: s.recorded.result,
      received: s.recorded.received,
      ms: s.recorded.ms,
    };
    if (s.fields) run.fields = s.fields;
    return run;
  }
  // The trigger node's caption: the agent's own (e.g. "1 star"), else
  // the sample's channel, else "Custom message".
  function triggerCaption(agent, values, fallback) {
    const t = agent.trigger || {};
    if (typeof t.caption === "function") {
      try { return t.caption(values) || fallback || ""; } catch (e) { /* fall through */ }
    }
    return fallback || t.customCaption || "Custom input";
  }

  const STOP = new Set("the and you your for can could there how much what this that with have our are just any way someone would like hi hello thanks thank please from its it's i'm i've get got need want when will".split(" "));
  const words = (t) => new Set((String(t).toLowerCase().match(/[a-z0-9']{3,}/g) || []).filter((w) => !STOP.has(w)));
  function closestSample(agent, text) {
    const list = samplesFor(agent);
    const a = words(text);
    let best = list[0];
    let bestScore = -1;
    const primary = primaryField(agent);
    for (const s of list) {
      const b = words(primary ? fieldText(primary, sampleValue(s, primary)) : s.input);
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

  async function callLive(agent, payload) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), LIVE_TIMEOUT_MS);
    const t0 = performance.now();
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({ agent: agent.id }, payload)),
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
    const invalid = validateFields(agent, d);
    if (invalid) return formError(invalid);
    const t = agent.trigger || {};
    const primary = primaryField(agent);
    const input = primary ? fieldText(primary, d[primary.id]) : "";
    // Speed-to-Lead's API body stays { input, receivedAt }; agents with
    // payload "fields" send every field.
    const values = {};
    for (const f of fieldsOf(agent)) values[f.id] = cleanValue(f, d[f.id]);
    // A "receivedAt" field also travels as the run time (days since a quote, opening hours).
    const payload = t.payload === "fields" ? Object.assign({ fields: values }, values.receivedAt ? { receivedAt: values.receivedAt } : {}) : { input, receivedAt: d.receivedAt };
    const caption = triggerCaption(agent, values, null);
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
    state.started.add(agent.id);
    closePanel({ restoreFocus: false });
    canvas.reset();
    canvas.markStart(false);
    const trigger = agent.nodes.find((n) => n.type === "trigger");
    canvas.setNode(trigger.id, "running", caption);
    startLiveStatus(agent, values);

    let run;
    try {
      const data = await callLive(agent, payload);
      run = {
        agent: agent.id,
        source: "custom",
        channel: null,
        triggerCaption: caption,
        input,
        receivedAt: d.receivedAt,
        result: data.result,
        received: data.received,
        ms: data.ms,
        clientMs: data.clientMs,
      };
      if (t.payload === "fields") run.fields = values;
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
    state.started.add(agent.id);
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

  // The ops board opening one recorded step on its agent's canvas. A replay:
  // no live call and nothing added to the visitor's execution logs.
  function openRun(step) {
    const agent = byId(step.agent);
    if (!agent) return;
    if (step.turns) return playConversation(agent, sampleTurns(step, "sample"), { source: "sample", sampleId: step.id, sampleLabel: step.label, replay: true });
    playRun(runFromSample(agent, step, "sample"), { replay: true });
  }

  /* ---------------- Chat mode ---------------- */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  function newChat(agent, opts = {}) {
    return {
      id: newId(),
      agent: agent.id,
      startedAt: new Date().toISOString(),
      turns: [], // { user, result, received, ms, clientMs, source, shownNotes, shownReply }
      source: opts.source || "custom",
      sampleId: opts.sampleId || null,
      sampleLabel: opts.sampleLabel || null,
      notice: opts.notice || null, // quiet line at the top of the thread
      limit: null, // set when the demo limits are reached
      pending: null, // the visitor's message while the live call runs
      typing: false,
      busy: false,
      replaying: false,
      viewTurn: -1,
      logId: null,
    };
  }
  const chatFor = (agent) => state.chats[agent.id] || (state.chats[agent.id] = newChat(agent));
  const triggerOf = (agent) => agent.nodes.find((n) => n.type === "trigger");

  function chatRun(agent, chat, i) {
    const t = chat.turns[i];
    return {
      agent: agent.id,
      chat: true,
      source: t.source || chat.source,
      turn: i + 1,
      input: t.user,
      result: t.result,
      received: t.received,
      ms: t.ms,
      clientMs: t.clientMs,
      triggerCaption: `Turn ${i + 1}`,
    };
  }

  // Panel: Chat tab (thread + composer) and Step details tab.
  function chatPanel(agent, p) {
    const chat = chatFor(agent);
    // Header: the business name, New conversation and close. The tab row
    // holds only the two tabs, so nothing in it truncates at 375px.
    const actions = `<button type="button" class="ag-icon-btn ag-new-chat" id="ag-new-chat" aria-label="New conversation" title="New conversation"${chat.turns.length || chat.pending ? "" : " disabled"}>${agentIcon("newChat", 20)}</button>`;
    const tabs = `
      <div class="ag-tabs" role="tablist" aria-label="Panel">
        <button type="button" role="tab" class="ag-tab" data-tab="chat" aria-selected="${p.tab === "chat"}">Chat</button>
        <button type="button" role="tab" class="ag-tab" data-tab="details" aria-selected="${p.tab === "details"}">Step details</button>
      </div>`;
    if (p.tab === "chat") {
      return panelShell({
        title: agent.business,
        actions,
        tabs,
        body: `<div class="ag-thread" id="ag-thread">${threadHtml(agent, chat)}</div>`,
        bodyClass: "is-thread",
        footer: composerHtml(agent),
        footClass: "is-composer",
      });
    }
    const def = p.id ? agent.nodes.find((n) => n.id === p.id) : null;
    const heading = def
      ? `<div class="ag-detail-head"><span class="ag-detail-icon">${agentIcon(def.icon, 18)}</span><div><span class="ag-panel-kind">${esc(KIND[def.type] || "Step")}</span><h3 class="ag-detail-title">${esc(def.label)}</h3></div></div>`
      : "";
    const body = turnSwitcher(chat) + heading + (def ? nodeBody(agent, def) : stepList(agent));
    return panelShell({ title: agent.business, actions, tabs, body, footer: def ? stepNav(agent, def) : "" });
  }


  function msgHtml(role, label, text, turnIndex) {
    const bubble =
      turnIndex != null
        ? `<button type="button" class="ag-bubble is-out" data-turn="${turnIndex}" title="See this turn's steps">${esc(text)}</button>`
        : `<div class="ag-bubble ${role === "user" ? "is-out" : "is-in"}">${esc(text)}</div>`;
    return `<div class="ag-msg" data-role="${role}"><span class="ag-msg-role">${esc(label)}</span>${bubble}</div>`;
  }

  function threadHtml(agent, chat) {
    const roles = agent.chat.roles;
    const out = [];
    if (chat.notice) out.push(`<p class="ag-chat-notice">${esc(chat.notice)}</p>`);
    out.push(msgHtml("assistant", roles.assistant, agent.chat.greeting));
    chat.turns.forEach((t, i) => {
      out.push(msgHtml("user", roles.user, t.user, i));
      if (t.shownNotes !== false) {
        for (const n of agent.chat.notes(t.result) || []) {
          out.push(`<div class="ag-chat-sys" data-tone="${esc(n.tone)}">${agentIcon(n.icon || "stethoscope", 14)}<span>${esc(n.text)}</span></div>`);
        }
      }
      if (t.shownReply !== false) out.push(msgHtml("assistant", roles.assistant, t.result.reply));
    });
    if (chat.pending) out.push(msgHtml("user", roles.user, chat.pending));
    if (chat.typing) {
      out.push(`<div class="ag-msg" data-role="assistant"><span class="ag-msg-role">${esc(roles.assistant)}</span><div class="ag-bubble is-in ag-typing" role="status" aria-label="${esc(roles.assistant)} is typing"><i></i><i></i><i></i></div></div>`);
    }
    if (chat.limit) out.push(`<p class="ag-chat-notice">${esc(chat.limit)}</p>`);
    return out.join("");
  }

  function composerHtml(agent) {
    const chips = samplesFor(agent)
      .map((s) => `<button type="button" class="ag-pill-chip" data-chat-sample="${esc(s.id)}" title="${esc(s.turns[0].user)}">${esc(s.label)}</button>`)
      .join("");
    return `
      <div class="ag-chip-row" role="group" aria-label="Sample conversations"><span class="ag-label">Samples</span>${chips}</div>
      <div class="ag-compose">
        <textarea class="ag-input ag-compose-input" id="ag-chat-input" rows="1" maxlength="${MAX_CHAT_MSG}" placeholder="${esc(agent.chat.placeholder)}" aria-label="Message"></textarea>
        <button type="button" class="ag-send" id="ag-send" aria-label="Send message">${agentIcon("send", 18)}</button>
      </div>
      <p class="ag-compose-hint" id="ag-chat-hint"></p>`;
  }

  function turnSwitcher(chat) {
    if (!chat.turns.length) return "";
    const buttons = chat.turns
      .map((t, i) => `<button type="button" class="ag-turn" data-view-turn="${i}" aria-pressed="${i === chat.viewTurn}"${chat.busy ? " disabled" : ""}>${i + 1}</button>`)
      .join("");
    return `<div class="ag-turns" role="group" aria-label="Turn"><span class="ag-label">Turn</span>${buttons}</div>`;
  }

  function stepList(agent) {
    const items = nodeOrder(agent)
      .filter((n) => n.type !== "trigger")
      .map((n) => {
        const node = canvas.nodes.get(n.id);
        const st = node ? node.el.dataset.state : "idle";
        const caption = node ? node.el.querySelector(".ag-node-caption").textContent : "";
        return `<li><button type="button" class="ag-steplink" data-goto="${n.id}" data-state="${st}">
          <span class="ag-steplink-icon">${agentIcon(n.icon, 16)}</span>
          <span class="ag-steplink-label">${esc(n.label)}</span>
          <span class="ag-steplink-cap">${esc(st === "skipped" ? "Skipped" : caption)}</span>
          ${agentIcon("right", 14)}
        </button></li>`;
      })
      .join("");
    const intro = state.run ? "Pick a step to see what it did on this turn." : "Send a message or play a sample, then pick a step to see what it did.";
    return `<p class="ag-about">${intro}</p><ul class="ag-steplist">${items}</ul>`;
  }

  const detailsOpen = () => state.panel && state.panel.kind === "chat" && state.panel.tab === "details" && !els.panel.hidden;
  const chatTabOpen = () => state.panel && state.panel.kind === "chat" && state.panel.tab === "chat" && !els.panel.hidden;

  function scrollThread(smooth) {
    const body = $(".ag-panel-body", els.panel);
    if (!body) return;
    body.scrollTo({ top: body.scrollHeight, behavior: smooth && !mqReduce.matches ? "smooth" : "auto" });
  }

  // Partial updates while a conversation runs, so the composer keeps
  // its text and focus.
  function renderThread() {
    if (!chatTabOpen()) return;
    const el = $("#ag-thread", els.panel);
    if (!el) return;
    el.innerHTML = threadHtml(state.agent, chatFor(state.agent));
    const fresh = $("#ag-new-chat", els.panel);
    const chat = chatFor(state.agent);
    if (fresh) fresh.disabled = !(chat.turns.length || chat.pending);
    scrollThread(true);
  }
  function refreshDetails() {
    if (detailsOpen()) renderPanel();
  }

  const chatTotal = (chat) => chat.turns.reduce((n, t) => n + t.user.length + t.result.reply.length, 0);
  function limitMessage(chat, text) {
    if (chat.turns.length >= MAX_CHAT_TURNS) return `This demo chat stops at ${MAX_CHAT_TURNS} messages. Start a new conversation to keep going.`;
    if (chatTotal(chat) + text.trim().length > MAX_CHAT_TOTAL) return "This demo chat has reached its length limit. Start a new conversation to keep going.";
    return null;
  }

  function autoGrow(el) {
    el.style.height = "auto";
    const borders = el.offsetHeight - el.clientHeight;
    el.style.height = `${Math.min(el.scrollHeight + borders, 132)}px`;
  }

  function bindComposer() {
    const agent = state.agent;
    const input = $("#ag-chat-input", els.panel);
    if (!input) return;
    input.value = state.chatDrafts[agent.id] || "";
    autoGrow(input);
    input.addEventListener("input", () => {
      state.chatDrafts[agent.id] = input.value.slice(0, MAX_CHAT_MSG);
      autoGrow(input);
      updateComposer();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        submitChat();
      }
    });
    $("#ag-send", els.panel).addEventListener("click", submitChat);
    updateComposer();
  }

  function updateComposer() {
    if (!chatTabOpen()) return;
    const agent = state.agent;
    const chat = chatFor(agent);
    const input = $("#ag-chat-input", els.panel);
    if (!input) return;
    const text = state.chatDrafts[agent.id] || "";
    const limit = limitMessage(chat, text);
    const full = chat.turns.length >= MAX_CHAT_TURNS;
    input.disabled = full;
    $("#ag-send", els.panel).disabled = chat.busy || !text.trim() || !!limit;
    els.panel.querySelectorAll("[data-chat-sample]").forEach((b) => {
      b.disabled = chat.busy;
      b.classList.toggle("is-active", chat.source === "sample" && chat.sampleId === b.dataset.chatSample);
    });
    const hint = $("#ag-chat-hint", els.panel);
    hint.textContent = chat.replaying
      ? "Playing a recorded conversation, no live calls."
      : chat.busy
      ? "The front desk is replying…"
      : limit
      ? limit
      : text.length > MAX_CHAT_MSG - 100
      ? `${text.length} / ${MAX_CHAT_MSG} characters`
      : "Enter to send, Shift+Enter for a new line.";
    hint.dataset.tone = limit && text.trim() ? "warn" : "";
    // The keyboard hint means nothing on a touch screen (hidden there in CSS).
    hint.dataset.kind = !chat.replaying && !chat.busy && !limit && text.length <= MAX_CHAT_MSG - 100 ? "keys" : "";
  }

  function refreshChatPanel() {
    if (chatTabOpen()) {
      renderThread();
      updateComposer();
    }
  }

  async function callLiveChat(agent, messages) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), LIVE_TIMEOUT_MS);
    const t0 = performance.now();
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agent.id, messages }),
        signal: ctrl.signal,
      });
      if (res.status === 400) {
        const d = await res.json().catch(() => ({}));
        if (d.error === "limit" || d.error === "too-long") {
          const err = new Error("limit");
          err.limit = true;
          throw err;
        }
      }
      if (!res.ok) throw new Error("resting");
      const data = await res.json();
      if (!data || !data.result || !data.received) throw new Error("resting");
      return Object.assign(data, { clientMs: Math.round(performance.now() - t0) });
    } finally {
      clearTimeout(timer);
    }
  }

  // Plays one turn on the canvas; the thread shows the hand-off note and
  // the reply as their nodes finish. Then the canvas holds until the
  // next message resets it.
  async function playTurn(agent, chat, i, { replay = false } = {}) {
    const t = chat.turns[i];
    chat.viewTurn = i;
    chat.typing = t.shownReply === false;
    const run = chatRun(agent, chat, i);
    state.run = run;
    state.started.add(agent.id);
    canvas.markStart(false);
    setStatus(statusFor(run, replay));
    renderThread();
    refreshDetails();
    const noteNodes = new Set((agent.chat.notes(t.result) || []).map((n) => n.node));
    state.playing = true;
    const done = await canvas.play(AgentCanvas.plan(agent, run), {
      stepMs: CHAT_STEP_MS,
      instant: mqReduce.matches,
      follow: true,
      onStep: (id) => {
        if (state.chats[agent.id] !== chat) return;
        let changed = false;
        if (noteNodes.has(id) && t.shownNotes === false) {
          t.shownNotes = true;
          changed = true;
        }
        if (id === agent.chat.replyNode) {
          t.shownNotes = true;
          t.shownReply = true;
          chat.typing = false;
          changed = true;
        }
        if (changed) renderThread();
        // Step details follows along: the open step, or the step list.
        if (detailsOpen() && (state.panel.id === id || !state.panel.id)) renderPanel();
      },
    });
    state.playing = false;
    t.shownNotes = true;
    t.shownReply = true;
    chat.typing = false;
    if (state.chats[agent.id] === chat) {
      renderThread();
      refreshDetails();
    }
    return done;
  }

  async function submitChat() {
    const agent = state.agent;
    if (!isChat(agent)) return;
    const chat = chatFor(agent);
    const text = (state.chatDrafts[agent.id] || "").trim();
    if (!text || chat.busy) return;
    if (limitMessage(chat, text)) return updateComposer();
    const input = $("#ag-chat-input", els.panel);
    const hadFocus = input && document.activeElement === input;
    state.chatDrafts[agent.id] = "";
    if (input) {
      input.value = "";
      autoGrow(input);
    }
    const token = state.chatToken;
    // Typing after a sample keeps the conversation going live.
    chat.source = "custom";
    chat.limit = null;
    chat.busy = true;
    chat.pending = text;
    chat.typing = true;
    state.busy = true;
    state.run = null;
    state.started.add(agent.id);
    canvas.markStart(false);
    canvas.reset();
    canvas.setNode(triggerOf(agent).id, "running", `Turn ${chat.turns.length + 1}`);
    startLiveStatus(agent, text);
    refreshChatPanel();
    refreshDetails();

    const messages = [];
    chat.turns.forEach((t) => messages.push({ role: "user", text: t.user }, { role: "assistant", text: t.result.reply }));
    messages.push({ role: "user", text });

    let data = null;
    let failure = null;
    try {
      data = await callLiveChat(agent, messages);
    } catch (e) {
      failure = e;
    }
    state.busy = false;
    if (token !== state.chatToken || state.chats[agent.id] !== chat) return; // a new conversation started meanwhile

    if (!data) {
      chat.pending = null;
      chat.typing = false;
      chat.busy = false;
      if (failure && failure.limit) {
        chat.limit = "This demo chat has reached its limit. Start a new conversation to keep going.";
        canvas.reset();
        setStatus(null);
        refreshChatPanel();
        return;
      }
      // Live demo resting: play the recorded conversation that starts most like this one.
      const sample = closestConversation(agent, chat.turns.length ? chat.turns[0].user : text);
      if (!sample) {
        chat.limit = FALLBACK_NOTE;
        canvas.reset();
        setStatus({ kind: "resting", text: FALLBACK_NOTE });
        refreshChatPanel();
        return;
      }
      return playConversation(agent, sampleTurns(sample, "fallback"), {
        source: "fallback",
        sampleId: sample.id,
        sampleLabel: sample.label,
        notice: FALLBACK_NOTE,
        log: true,
      });
    }

    chat.pending = null;
    chat.turns.push({ user: text, result: data.result, received: data.received, ms: data.ms, clientMs: data.clientMs, source: "custom", shownNotes: false, shownReply: false });
    saveChatLog(agent, chat);
    await playTurn(agent, chat, chat.turns.length - 1);
    if (state.chats[agent.id] !== chat) return;
    chat.busy = false;
    updateComposer();
    const again = $("#ag-chat-input", els.panel);
    if (hadFocus && again) again.focus({ preventScroll: true });
  }

  const sampleTurns = (sample, source) =>
    sample.turns.map((t) => ({ user: t.user, result: t.recorded.result, received: t.recorded.received, ms: t.recorded.ms, source }));

  // Chat fallback: compare the visitor's opening message with each
  // recording's label and patient messages, on rough word stems, so
  // "child dental benefits" still finds "Child's cleaning cover".
  const stem = (w) => (w.length > 4 ? w.replace(/'s$/, "").replace(/(ing|ed|es|s)$/, "") : w.replace(/'s$/, ""));
  const stems = (t) => new Set([...words(t)].map(stem));
  function closestConversation(agent, text) {
    const list = samplesFor(agent);
    const a = stems(text);
    let best = list[0];
    let bestScore = -1;
    for (const s of list) {
      const b = stems(`${s.label} ${s.turns.map((t) => t.user).join(" ")}`);
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

  function playChatSample(id) {
    const agent = state.agent;
    const sample = samplesFor(agent).find((x) => x.id === id);
    if (!sample || chatFor(agent).busy) return;
    playConversation(agent, sampleTurns(sample, "sample"), { source: "sample", sampleId: sample.id, sampleLabel: sample.label, log: true });
  }

  // Replays a whole conversation turn by turn (samples, the resting
  // fallback and log replays). No network calls.
  async function playConversation(agent, turns, opts = {}) {
    if (state.route !== agent.id) go(agent.id);
    const token = ++state.chatToken;
    canvas.reset();
    const chat = newChat(agent, opts);
    chat.busy = true;
    chat.replaying = true;
    state.chats[agent.id] = chat;
    state.run = null;
    if (opts.log) {
      chat.logId = newId();
      logConversation(agent, chat, turns);
    }
    if (chatTabOpen()) renderPanel();
    else openPanel({ kind: "chat", tab: "chat", id: null });
    const instant = mqReduce.matches;
    for (let i = 0; i < turns.length; i++) {
      if (token !== state.chatToken) return;
      chat.turns.push(Object.assign({}, turns[i], { shownNotes: false, shownReply: false }));
      chat.typing = true;
      renderThread();
      await wait(instant ? 0 : 500);
      if (token !== state.chatToken) return;
      const done = await playTurn(agent, chat, i, { replay: !!opts.replay });
      if (!done || token !== state.chatToken) return;
      if (i < turns.length - 1) await wait(instant ? 0 : 900);
    }
    chat.busy = false;
    chat.replaying = false;
    updateComposer();
    refreshDetails();
  }

  // Step details: show any earlier turn on the canvas, instantly.
  function viewTurn(i) {
    const agent = state.agent;
    const chat = chatFor(agent);
    if (chat.busy || !chat.turns[i]) return;
    showChatTurn(agent, i);
    refreshDetails();
  }
  function showChatTurn(agent, i) {
    const chat = chatFor(agent);
    if (chat.busy || !chat.turns.length) return;
    const idx = i >= 0 && i < chat.turns.length ? i : chat.turns.length - 1;
    chat.viewTurn = idx;
    state.run = chatRun(agent, chat, idx);
    setStatus(statusFor(state.run, false));
    canvas.play(AgentCanvas.plan(agent, state.run), { instant: true });
  }

  function newConversation() {
    const agent = state.agent;
    if (!isChat(agent)) return;
    state.chatToken++;
    state.chats[agent.id] = newChat(agent);
    state.run = null;
    state.busy = false;
    canvas.reset();
    canvas.markStart(false);
    setStatus(null);
    if (state.panel && state.panel.kind === "chat") renderPanel();
  }

  // Leaving a chat agent mid-turn: stop it cleanly. A live reply that
  // arrives later is ignored, and the thread keeps what was shown.
  function stopChat(agent) {
    const chat = state.chats[agent.id];
    if (!chat || !chat.busy) return;
    state.chatToken++;
    state.busy = false;
    chat.busy = false;
    chat.replaying = false;
    chat.typing = false;
    chat.pending = null;
    chat.turns.forEach((t) => {
      t.shownNotes = true;
      t.shownReply = true;
    });
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
  // Chat agents: one entry per conversation, updated as turns land.
  const logTurn = ({ user, result, received, ms, clientMs, source }) => ({ user, result, received, ms, clientMs, source });
  function upsertLog(entry) {
    state.logs = [entry, ...state.logs.filter((l) => l.id !== entry.id)].slice(0, LOG_MAX);
    saveLogs();
    updateLogsCount();
    if (state.panel && state.panel.kind === "logs") renderPanel();
  }
  function logConversation(agent, chat, turns) {
    upsertLog({
      id: chat.logId,
      at: chat.startedAt,
      agent: agent.id,
      kind: "chat",
      source: chat.source,
      sampleId: chat.sampleId,
      sampleLabel: chat.sampleLabel,
      turns: turns.map(logTurn),
    });
  }
  function saveChatLog(agent, chat) {
    if (!chat.logId) chat.logId = newId();
    const prior = state.logs.find((l) => l.id === chat.logId);
    upsertLog({
      id: chat.logId,
      at: chat.startedAt,
      agent: agent.id,
      kind: "chat",
      source: "custom",
      sampleId: chat.sampleId,
      sampleLabel: chat.sampleLabel,
      continued: !!(prior && prior.source !== "custom") || !!(prior && prior.continued),
      turns: chat.turns.filter((t) => t.result).map(logTurn),
    });
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
  const sourceLabel = (l) => {
    if (l.kind === "chat") {
      if (l.source === "custom") return l.continued ? `Custom · continued from ${l.sampleLabel || "a recording"}` : "Custom";
      return l.source === "fallback" ? "Custom · recorded fallback" : `Sample · ${l.sampleLabel || ""}`;
    }
    return l.source === "custom" ? `Custom · ${fmtSecs(l.clientMs || l.ms)}` : l.source === "fallback" ? "Custom · recorded fallback" : `Sample · ${l.sampleLabel || ""}`;
  };
  const clip = (t, n) => (t.length > n ? `${t.slice(0, n - 1).trim()}…` : t);

  function chatLogRow(l, agent) {
    let summary = "";
    try { summary = agent.summarizeConversation(l.turns); } catch (e) { summary = ""; }
    const turns = l.turns
      .map((t) => {
        let s2 = "";
        try { s2 = agent.summarize(t.result); } catch (e) { s2 = ""; }
        return `<li><span>${esc(clip(t.user, 90))}</span><em>${esc(s2)}</em></li>`;
      })
      .join("");
    return `<li><div class="ag-log is-chat">
      <span class="ag-log-top"><span class="ag-log-time">${esc(fmtLogTime(l.at))}</span><span class="ag-log-src" data-source="${esc(l.source)}">${esc(sourceLabel(l))}</span></span>
      <span class="ag-log-agent">${esc(agent.name)}</span>
      <span class="ag-log-sum">${esc(summary)}</span>
      <details class="ag-log-turns"><summary>Show ${l.turns.length} turn${l.turns.length === 1 ? "" : "s"}</summary><ol>${turns}</ol></details>
      <button type="button" class="ag-log-replay" data-log="${esc(l.id)}">${agentIcon("play", 14)} Replay conversation</button>
    </div></li>`;
  }

  function logsPanel() {
    const rows = state.logs
      .map((l) => {
        const agent = byId(l.agent);
        if (l.kind === "chat") return chatLogRow(l, agent);
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
    if (!l) return;
    const agent = byId(l.agent);
    if (l.kind === "chat") {
      if (state.route !== agent.id) go(agent.id);
      return playConversation(agent, l.turns, { source: l.source, sampleId: l.sampleId, sampleLabel: l.sampleLabel, replay: true });
    }
    playRun(l, { replay: true });
  }

  /* ---------------- Boot ---------------- */
  document.querySelectorAll("[data-icon]").forEach((el) => el.insertAdjacentHTML("afterbegin", agentIcon(el.dataset.icon, Number(el.dataset.size) || 20)));
  AgentOps.init({ go, openRun, byId, esc, mqReduce, toast });
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
