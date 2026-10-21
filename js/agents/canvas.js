/* ============================================================
   Node canvas engine for /agents. Agent-agnostic: it only reads
   the graph from js/agents/registry.js (nodes with col/row, edges
   with optional `when` for branches) and renders it as a GHL-style
   workflow: rounded icon tiles, labels underneath, curved edges
   with a dot at the start and an arrowhead at the end.

   - Pan: drag with mouse, pen or one finger. Zoom: buttons, pinch,
     or ctrl/cmd + wheel (trackpad pinch). Plain wheel pans.
   - Horizontal layout by default; vertical (top to bottom) when the
     app calls setVertical(true) under 700px.
   - Node states: idle | running | done | skipped | error.
   - play(plan): reveals a finished run step by step (one API call
     already returned the whole result; this is presentation only).
   ============================================================ */

const AG_GRID = 22; // dot-grid spacing in world px
const AG_TILE = 64;
const AG_NODE_W = 148;
const AG_COL_W = 200; // horizontal: distance between columns
const AG_ROW_H = 160; // horizontal: distance between rows
const AG_V_ROW_W = 172; // vertical: rows become columns
const AG_V_COL_H = 184; // vertical: columns become rows
const AG_SVG_NS = "http://www.w3.org/2000/svg";

class AgentCanvas {
  constructor(viewport, opts) {
    this.vp = viewport;
    this.opts = opts; // { onNodeClick(id), insets() => {top,right,bottom,left}, reducedMotion() }
    this.world = document.createElement("div");
    this.world.className = "ag-world";
    this.svg = document.createElementNS(AG_SVG_NS, "svg");
    this.svg.setAttribute("class", "ag-edges");
    this.svg.setAttribute("aria-hidden", "true");
    this.world.appendChild(this.svg);
    this.vp.appendChild(this.world);

    this.tx = 0;
    this.ty = 0;
    this.scale = 1;
    this.vertical = false;
    this.nodes = new Map();
    this.edges = new Map();
    this.agent = null;
    this.playToken = 0;
    this.userMoved = false;

    this.pointers = new Map();
    this.gesture = null;
    this.dragged = false;
    this.bindInput();
  }

  /* ---------------- Build ---------------- */
  load(agent) {
    this.playToken++;
    this.agent = agent;
    this.nodes.clear();
    this.edges.clear();
    this.world.querySelectorAll(".ag-node, .ag-edge-label").forEach((el) => el.remove());
    this.svg.innerHTML = "";

    for (const def of agent.nodes) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "ag-node";
      el.dataset.type = def.type;
      el.dataset.state = "idle";
      el.dataset.id = def.id;
      el.setAttribute("aria-label", `${def.label}. Open details`);
      el.innerHTML = `
        <span class="ag-node-tag" hidden>Start here</span>
        <span class="ag-node-tile">${agentIcon(def.icon, 26)}<span class="ag-node-badge" aria-hidden="true"></span></span>
        <span class="ag-node-label">${def.label}</span>
        <span class="ag-node-caption"></span>`;
      // Keyboard activation (Enter/Space) and plain taps both land here.
      // A drag that started on a node captures the pointer, so its
      // release never reaches this handler; `dragged` is a backstop.
      el.addEventListener("click", () => {
        if (this.dragged) return;
        this.opts.onNodeClick(def.id);
      });
      this.world.appendChild(el);
      this.nodes.set(def.id, { def, el, x: 0, y: 0 });
    }

    for (const def of agent.edges) {
      const g = document.createElementNS(AG_SVG_NS, "g");
      g.setAttribute("class", "ag-edge");
      g.dataset.state = "idle";
      const path = document.createElementNS(AG_SVG_NS, "path");
      path.setAttribute("class", "ag-edge-path");
      const arrow = document.createElementNS(AG_SVG_NS, "path");
      arrow.setAttribute("class", "ag-edge-arrow");
      const dot = document.createElementNS(AG_SVG_NS, "circle");
      dot.setAttribute("class", "ag-edge-dot");
      dot.setAttribute("r", "3.5");
      g.append(path, arrow, dot);
      this.svg.appendChild(g);
      let label = null;
      if (def.label) {
        label = document.createElement("span");
        label.className = "ag-edge-label";
        label.dataset.state = "idle";
        label.textContent = def.label;
        this.world.appendChild(label);
      }
      this.edges.set(def.id, { def, g, path, arrow, dot, label });
    }

    this.layout();
  }

  setVertical(vertical) {
    if (this.vertical === vertical && this.agent) return false;
    this.vertical = vertical;
    this.vp.classList.toggle("is-vertical", vertical);
    if (this.agent) this.layout();
    return true;
  }

  layout() {
    for (const n of this.nodes.values()) {
      const { col, row } = n.def;
      // Vertical is the horizontal layout turned 90deg clockwise: columns
      // run top to bottom and a row above the main line moves to its right.
      n.x = this.vertical ? -row * AG_V_ROW_W : col * AG_COL_W;
      n.y = this.vertical ? col * AG_V_COL_H : row * AG_ROW_H;
      n.el.style.left = `${n.x - AG_NODE_W / 2}px`;
      n.el.style.top = `${n.y - AG_TILE / 2}px`;
    }
    this.drawEdges();
  }

  // Edge geometry needs real node heights in vertical mode (the edge
  // leaves from under the label), so it reads offsetHeight. Call again
  // whenever captions change.
  drawEdges() {
    const GAP = 6;
    for (const e of this.edges.values()) {
      const a = this.nodes.get(e.def.from);
      const b = this.nodes.get(e.def.to);
      if (!a || !b) continue;
      let x0, y0, x1, y1, d, arrow, mid;
      if (this.vertical) {
        x0 = a.x;
        y0 = a.y - AG_TILE / 2 + a.el.offsetHeight + GAP;
        x1 = b.x;
        y1 = b.y - AG_TILE / 2 - GAP;
        const dy = Math.max(28, (y1 - y0) / 2);
        d = `M${x0} ${y0} C${x0} ${y0 + dy} ${x1} ${y1 - 6 - dy} ${x1} ${y1 - 6}`;
        arrow = `M${x1} ${y1} L${x1 - 4.5} ${y1 - 7} L${x1 + 4.5} ${y1 - 7} Z`;
        mid = this.bezierMid([x0, y0], [x0, y0 + dy], [x1, y1 - 6 - dy], [x1, y1 - 6]);
      } else {
        x0 = a.x + AG_TILE / 2 + GAP;
        y0 = a.y;
        x1 = b.x - AG_TILE / 2 - GAP;
        y1 = b.y;
        const dx = Math.max(36, (x1 - x0) / 2);
        d = `M${x0} ${y0} C${x0 + dx} ${y0} ${x1 - 6 - dx} ${y1} ${x1 - 6} ${y1}`;
        arrow = `M${x1} ${y1} L${x1 - 7} ${y1 - 4.5} L${x1 - 7} ${y1 + 4.5} Z`;
        mid = this.bezierMid([x0, y0], [x0 + dx, y0], [x1 - 6 - dx, y1], [x1 - 6, y1]);
      }
      e.path.setAttribute("d", d);
      e.arrow.setAttribute("d", arrow);
      e.dot.setAttribute("cx", x0);
      e.dot.setAttribute("cy", y0);
      if (e.label) {
        e.label.style.left = `${mid[0]}px`;
        e.label.style.top = `${mid[1]}px`;
      }
    }
  }

  bezierMid(p0, p1, p2, p3) {
    return [0.125 * p0[0] + 0.375 * p1[0] + 0.375 * p2[0] + 0.125 * p3[0], 0.125 * p0[1] + 0.375 * p1[1] + 0.375 * p2[1] + 0.125 * p3[1]];
  }

  /* ---------------- View transform ---------------- */
  apply() {
    this.world.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;
    const g = AG_GRID * this.scale;
    this.vp.style.backgroundSize = `${g}px ${g}px`;
    this.vp.style.backgroundPosition = `${this.tx}px ${this.ty}px`;
  }

  ease(on) {
    if (this.opts.reducedMotion()) return;
    clearTimeout(this.easeTimer);
    this.vp.classList.toggle("is-easing", on);
    if (on) this.easeTimer = setTimeout(() => this.vp.classList.remove("is-easing"), 420);
  }

  bounds() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of this.nodes.values()) {
      minX = Math.min(minX, n.x - AG_NODE_W / 2);
      maxX = Math.max(maxX, n.x + AG_NODE_W / 2);
      minY = Math.min(minY, n.y - AG_TILE / 2 - 30); // room for the "Start here" tag
      maxY = Math.max(maxY, n.y - AG_TILE / 2 + n.el.offsetHeight);
    }
    const pad = 20;
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }

  // Desktop: whole graph centered in the free area. Vertical: fit the
  // width (labels stay readable) and start at the top; drag to scroll.
  // With minScale, nothing moves (and it returns false) when the graph
  // would have to shrink below that scale to fit.
  fit({ animate = false, minScale = 0 } = {}) {
    if (!this.agent) return false;
    const b = this.bounds();
    const ins = this.opts.insets();
    const aw = Math.max(120, this.vp.clientWidth - ins.left - ins.right);
    const ah = Math.max(120, this.vp.clientHeight - ins.top - ins.bottom);
    let s;
    if (this.vertical) {
      s = Math.min(1, Math.max(0.55, aw / b.w));
      this.tx = ins.left + (aw - b.w * s) / 2 - b.x * s;
      this.ty = ins.top - b.y * s;
    } else {
      s = Math.min(1.1, Math.max(0.3, Math.min(aw / b.w, ah / b.h)));
      if (s < minScale) return false;
      this.tx = ins.left + (aw - b.w * s) / 2 - b.x * s;
      this.ty = ins.top + (ah - b.h * s) / 2 - b.y * s;
    }
    this.scale = s;
    this.userMoved = false;
    if (animate) this.ease(true);
    this.apply();
    return true;
  }

  zoomAt(factor, cx, cy) {
    const next = Math.min(2, Math.max(0.3, this.scale * factor));
    const wx = (cx - this.tx) / this.scale;
    const wy = (cy - this.ty) / this.scale;
    this.scale = next;
    this.tx = cx - wx * next;
    this.ty = cy - wy * next;
    this.userMoved = true;
    this.apply();
  }

  zoomBy(factor) {
    this.ease(true);
    this.zoomAt(factor, this.vp.clientWidth / 2, this.vp.clientHeight / 2);
  }

  // Keep a node on screen: while a run plays (vertical layout, where
  // the graph is taller than the screen) and when its panel opens over
  // the canvas. Vertically it re-centers; horizontally it shifts just
  // enough. A node bigger than the free area is left alone.
  ensureVisible(id, insets) {
    const n = this.nodes.get(id);
    if (!n) return;
    const ins = insets || this.opts.insets();
    const s = this.scale;
    const left = this.tx + (n.x - AG_NODE_W / 2) * s;
    const right = this.tx + (n.x + AG_NODE_W / 2) * s;
    const top = this.ty + (n.y - AG_TILE / 2 - 30) * s;
    const bottom = this.ty + (n.y - AG_TILE / 2 + n.el.offsetHeight + 20) * s;
    const vl = ins.left;
    const vr = this.vp.clientWidth - ins.right;
    const vt = ins.top;
    const vb = this.vp.clientHeight - ins.bottom;
    let dx = 0;
    let dy = 0;
    if (right - left <= vr - vl) {
      if (left < vl) dx = vl - left;
      else if (right > vr) dx = vr - right;
    }
    if (bottom - top <= vb - vt && (top < vt || bottom > vb)) dy = (vt + vb) / 2 - (top + bottom) / 2;
    if (!dx && !dy) return;
    this.tx += dx;
    this.ty += dy;
    this.ease(true);
    this.apply();
  }

  /* ---------------- Input ---------------- */
  bindInput() {
    const vp = this.vp;
    const local = (e) => {
      const r = vp.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    vp.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button > 0) return;
      if (e.target.closest(".ag-canvas-ui")) return; // zoom controls etc.
      this.pointers.set(e.pointerId, local(e));
      if (this.pointers.size === 1) {
        this.dragged = false;
        const p = local(e);
        this.gesture = { type: "pan", x: p.x, y: p.y, tx: this.tx, ty: this.ty, id: e.pointerId, captured: false };
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.gesture = {
          type: "pinch",
          d: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          mx: (a.x + b.x) / 2,
          my: (a.y + b.y) / 2,
          scale: this.scale,
          tx: this.tx,
          ty: this.ty,
        };
        this.dragged = true;
        for (const id of this.pointers.keys()) {
          try { vp.setPointerCapture(id); } catch (err) { /* pointer already gone */ }
        }
      }
    });

    vp.addEventListener("pointermove", (e) => {
      if (!this.pointers.has(e.pointerId) || !this.gesture) return;
      this.pointers.set(e.pointerId, local(e));
      const g = this.gesture;
      if (g.type === "pan" && e.pointerId === g.id) {
        const p = local(e);
        const dx = p.x - g.x;
        const dy = p.y - g.y;
        if (!this.dragged && Math.hypot(dx, dy) > 4) {
          this.dragged = true;
          vp.classList.add("is-panning");
          try { vp.setPointerCapture(e.pointerId); g.captured = true; } catch (err) { /* ignore */ }
        }
        if (this.dragged) {
          this.tx = g.tx + dx;
          this.ty = g.ty + dy;
          this.userMoved = true;
          this.apply();
        }
      } else if (g.type === "pinch" && this.pointers.size >= 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const next = Math.min(2, Math.max(0.3, g.scale * (d / g.d)));
        const wx = (g.mx - g.tx) / g.scale;
        const wy = (g.my - g.ty) / g.scale;
        this.scale = next;
        this.tx = mx - wx * next;
        this.ty = my - wy * next;
        this.userMoved = true;
        this.apply();
      }
    });

    const end = (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      if (this.pointers.size === 0) {
        this.gesture = null;
        vp.classList.remove("is-panning");
        // Let the click that follows a drag see `dragged`, then reset.
        setTimeout(() => (this.dragged = false), 0);
      } else if (this.pointers.size === 1) {
        // Pinch ended with one finger still down: continue as a pan.
        const [id, p] = [...this.pointers.entries()][0];
        this.gesture = { type: "pan", x: p.x, y: p.y, tx: this.tx, ty: this.ty, id, captured: true };
      }
    };
    vp.addEventListener("pointerup", end);
    vp.addEventListener("pointercancel", end);

    vp.addEventListener(
      "wheel",
      (e) => {
        if (e.target.closest(".ag-canvas-ui")) return;
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          const p = local(e);
          this.zoomAt(Math.exp(-e.deltaY * 0.01), p.x, p.y);
        } else {
          this.tx -= e.deltaX;
          this.ty -= e.deltaY;
          this.userMoved = true;
          this.apply();
        }
      },
      { passive: false }
    );
  }

  /* ---------------- States ---------------- */
  setNode(id, state, caption) {
    const n = this.nodes.get(id);
    if (!n) return;
    n.el.dataset.state = state;
    if (caption !== undefined) n.el.querySelector(".ag-node-caption").textContent = caption || "";
    if (this.vertical) this.drawEdges();
  }

  setEdge(id, state) {
    const e = this.edges.get(id);
    if (!e) return;
    e.g.dataset.state = state;
    if (e.label) e.label.dataset.state = state;
  }

  select(id) {
    for (const n of this.nodes.values()) n.el.classList.toggle("is-selected", n.def.id === id);
  }

  markStart(on) {
    const trigger = this.agent && this.agent.nodes.find((n) => n.type === "trigger");
    if (!trigger) return;
    this.nodes.get(trigger.id).el.querySelector(".ag-node-tag").hidden = !on;
  }

  reset() {
    this.playToken++;
    for (const id of this.nodes.keys()) this.setNode(id, "idle", "");
    for (const id of this.edges.keys()) this.setEdge(id, "idle");
  }

  /* ---------------- Runs ---------------- */
  // Walks the graph for a finished result: from the trigger, follow
  // every outgoing edge, except at a branch, where only the edge whose
  // `when` matches decide(result) is taken. Everything not reached is
  // skipped. Fully generic: no agent-specific logic here.
  static plan(agent, run) {
    const result = run.result;
    const order = [...agent.nodes].sort((a, b) => a.col - b.col || a.row - b.row);
    const outgoing = {};
    for (const e of agent.edges) (outgoing[e.from] = outgoing[e.from] || []).push(e);
    const trigger = agent.nodes.find((n) => n.type === "trigger");
    const takenNodes = new Set([trigger.id]);
    const takenEdges = new Set();
    for (const n of order) {
      if (!takenNodes.has(n.id)) continue;
      let outs = outgoing[n.id] || [];
      if (n.type === "branch") {
        let pick = null;
        try { pick = n.decide(result); } catch (err) { pick = null; }
        outs = outs.filter((e) => e.when === pick);
      }
      for (const e of outs) {
        takenEdges.add(e.id);
        takenNodes.add(e.to);
      }
    }
    const steps = order
      .filter((n) => takenNodes.has(n.id))
      .map((n) => {
        let caption = "";
        let error = false;
        try {
          caption = n.caption ? n.caption(result, run) : n.type === "trigger" ? run.triggerCaption || "" : "";
        } catch (err) {
          error = true; // a malformed result shows as an error node, never a crash
        }
        return { id: n.id, caption, error, edgesIn: agent.edges.filter((e) => e.to === n.id && takenEdges.has(e.id)).map((e) => e.id) };
      });
    // Fade each skipped node when the last taken branch before it resolves.
    const takenBranches = order.filter((n) => n.type === "branch" && takenNodes.has(n.id));
    const stepIndex = (id) => steps.findIndex((s) => s.id === id);
    const fades = {};
    const fadeAt = (col) => {
      const b = [...takenBranches].reverse().find((n) => n.col < col);
      return b ? stepIndex(b.id) : steps.length - 1;
    };
    const skippedNodes = agent.nodes.filter((n) => !takenNodes.has(n.id));
    for (const n of skippedNodes) {
      const at = fadeAt(n.col);
      (fades[at] = fades[at] || { nodes: [], edges: [] }).nodes.push(n.id);
    }
    for (const e of agent.edges.filter((e) => !takenEdges.has(e.id))) {
      const from = agent.nodes.find((n) => n.id === e.from);
      const at = takenNodes.has(from.id) ? stepIndex(from.id) : fadeAt(from.col);
      (fades[at] = fades[at] || { nodes: [], edges: [] }).edges.push(e.id);
    }
    return { steps, fades };
  }

  async play(plan, { stepMs = 500, instant = false, onStep = () => {} } = {}) {
    this.reset();
    const token = ++this.playToken;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const applyFades = (i) => {
      const f = plan.fades[i];
      if (!f) return;
      f.nodes.forEach((id) => this.setNode(id, "skipped", ""));
      f.edges.forEach((id) => this.setEdge(id, "skipped"));
    };

    if (instant) {
      plan.steps.forEach((s, i) => {
        s.edgesIn.forEach((id) => this.setEdge(id, "taken"));
        this.setNode(s.id, s.error ? "error" : "done", s.caption);
        applyFades(i);
      });
      plan.steps.forEach((s) => onStep(s.id));
      return true;
    }

    for (let i = 0; i < plan.steps.length; i++) {
      if (token !== this.playToken) return false;
      const s = plan.steps[i];
      s.edgesIn.forEach((id) => this.setEdge(id, "active"));
      this.setNode(s.id, "running");
      if (this.vertical) this.ensureVisible(s.id);
      await wait(i === 0 ? Math.round(stepMs * 0.5) : stepMs);
      if (token !== this.playToken) return false;
      s.edgesIn.forEach((id) => this.setEdge(id, "taken"));
      this.setNode(s.id, s.error ? "error" : "done", s.caption);
      applyFades(i);
      onStep(s.id);
    }
    return true;
  }
}
