/* ============================================================
   The Ops Team view on /agents: the ops board, plus the panel
   blocks only the team needs (quote document, print to PDF).
   The canvas, panels and run flow stay in app.js; this file only
   adds a screen and some blocks, through the hooks app.js gives it.
   No em dashes in any visible copy here.
   ============================================================ */
const AgentOps = (function () {
  "use strict";

  let hooks = null;
  let root = null;
  let scroll = 0;
  const icon = (name, size) => agentIcon(name, size);

  /* ---------------- Team samples ---------------- */
  // Every team agent's samples are its own runs from the recorded day
  // (Speed-to-Lead keeps its own list).
  function loadSamples() {
    if (typeof OPS_DAY === "undefined") return;
    for (const ev of OPS_DAY.events) {
      for (const s of ev.steps) {
        if (s.agent === "speed-to-lead" || s.noSample) continue;
        (AGENT_SAMPLES[s.agent] = AGENT_SAMPLES[s.agent] || []).push(s);
      }
    }
    if (OPS_DAY.brief) AGENT_SAMPLES["daily-brief"] = [OPS_DAY.brief];
  }

  /* ---------------- Blocks ---------------- */
  function quoteDoc(b, { esc }) {
    const r = b.result;
    const H = HARBOURLINE;
    const q = r.quote;
    const lines = r.lines
      .map((l) => `<tr><td><strong>${esc(l.item)}</strong>${l.detail && l.detail !== "Part" ? `<span>${esc(l.detail)}</span>` : ""}</td><td>${esc(l.amount)}</td></tr>`)
      .join("");
    return `<div class="ag-qdoc">
      <header class="ag-qdoc-head">
        <div><strong>${esc(H.name)}</strong><span>${esc(H.region)}</span><span>${esc(H.phone)}</span></div>
        <div class="ag-qdoc-num"><span>Quote</span><strong>${esc(q.number)}</strong></div>
      </header>
      <dl class="ag-qdoc-meta">
        <div><dt>For</dt><dd>${esc(q.customer)}</dd></div>
        <div><dt>Suburb</dt><dd>${esc(q.suburb)}</dd></div>
        ${q.mobile ? `<div><dt>Mobile</dt><dd>${esc(q.mobile)}</dd></div>` : ""}
        <div><dt>Date</dt><dd>${esc(q.date)}</dd></div>
        <div><dt>Valid until</dt><dd>${esc(q.validUntil)}</dd></div>
      </dl>
      <h4>Scope of work</h4>
      <p>${esc(r.scope)}</p>
      ${
        r.quotable
          ? `<table class="ag-qdoc-lines"><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>${lines}</tbody>
             <tfoot><tr><td>Estimate, including GST${r.totals.partsOnSite ? ", plus parts quoted on site" : ""}</td><td>${esc(r.totals.label)}</td></tr></tfoot></table>`
          : `<p class="ag-qdoc-flag">${esc(r.notListed || "This job isn't on our services list. The team will confirm whether we can help.")}</p>`
      }
      ${r.assumptions.length ? `<h4>This quote assumes</h4><ul>${r.assumptions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}
      <footer class="ag-qdoc-foot">
        <p>Labour is an estimate; the final amount depends on the hours on site. Parts are quoted on site unless listed. Valid for ${esc(H.quoteValidDays)} days. Invoices are due within ${esc(H.invoiceDays)} days.</p>
        <p>Demo document. ${esc(H.name)} is a fictional business.</p>
      </footer>
    </div>
    <button type="button" class="ag-btn ag-qdoc-print" data-print-quote="${esc(q.number)}">${icon("quote", 16)}<span>Print or save as PDF</span></button>`;
  }

  // The two-week board, a week at a time: day columns on a wide screen, a
  // list of days on a phone or in the side panel. Used by the Scheduler's
  // output and the ops board.
  function calendar(b, { esc, title }) {
    const H = HARBOURLINE;
    const jobs = H.calendarWith(b.changes);
    const weeks = [H.calendarDays.slice(0, 5), H.calendarDays.slice(5)];
    const shown = weeks.findIndex((w) => w.includes(b.week)) === 1 ? 1 : 0;
    const entry = (j) => {
      const t = H.tech(j.tech);
      const cls = [j.id === b.focus ? "is-focus" : "", j.added ? "is-new" : "", j.moved ? "is-moved" : "", j.emergency ? "is-emergency" : ""].filter(Boolean).join(" ");
      const tag = j.emergency ? "Emergency" : j.moved ? "Moved" : j.added ? "New" : "";
      return `<li class="ag-cal-job ${cls}"><span class="ag-cal-tech">${esc(t.first)}</span><strong>${esc(j.who)}</strong><span>${esc(j.job)}, ${esc(j.suburb)}</span>${tag ? `<em>${tag}</em>` : ""}</li>`;
    };
    const win = (date, w) => {
      const list = jobs.filter((j) => j.date === date && j.win === w).sort((x, y) => H.technicians.findIndex((t) => t.id === x.tech) - H.technicians.findIndex((t) => t.id === y.tech));
      return `<div class="ag-cal-win"><span class="ag-cal-winlabel">${H.windows[w].label}</span>${list.length ? `<ul>${list.map(entry).join("")}</ul>` : `<p>Free</p>`}</div>`;
    };
    // In the side panel, the shown week starts at the day this job landed.
    const fromDay = !b.wide && b.week ? b.week : null;
    const week = (days, i) => `<div class="ag-cal-week" data-week="${i}"${i === shown ? "" : " hidden"}>
      ${days
        .filter((d) => i !== shown || !fromDay || d >= fromDay)
        .map((d) => {
          const [name, num, month] = H.dayLabel(d).split(" ");
          return `<section class="ag-cal-day${d === H.dayOfTheDemo ? " is-today" : ""}"><h4>${name.slice(0, 3)} ${num} ${month.slice(0, 3)}</h4>${win(d, "am")}${win(d, "pm")}</section>`;
        })
        .join("")}
    </div>`;
    return `${title(b.title)}<div class="ag-cal${b.wide ? " is-wide" : ""}">
      <div class="ag-cal-tabs" role="group" aria-label="Week">
        ${["Week of 2 Nov", "Week of 9 Nov"].map((l, i) => `<button type="button" data-cal-week="${i}" aria-pressed="${i === shown}">${l}</button>`).join("")}
      </div>
      ${weeks.map(week).join("")}
    </div>`;
  }

  // The owner's day on one screen.
  function brief(b, { esc }) {
    const r = b.result;
    const section = (head, items) => (items.length ? `<h4>${esc(head)}</h4><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");
    return `<div class="ag-brief${b.wide ? " is-wide" : ""}">
      <span class="ag-brief-day">${esc(r.day)}</span>
      <p class="ag-brief-head">${esc(r.headline)}</p>
      <dl class="ag-brief-counts">
        ${r.counts.map((c) => `<div><dd>${esc(c.n)}</dd><dt>${esc(c.label)}</dt></div>`).join("")}
        <div><dd>${esc(r.invoiced)}</dd><dt>Invoiced</dt></div>
      </dl>
      <div class="ag-brief-cols">
        <div class="ag-brief-needs">
          <h4>Needs you</h4>
          ${r.needsYou.length ? `<ol>${r.needsYou.map((n) => `<li><strong>${esc(n.who)}</strong><span>${esc(n.what)}</span><em>${esc(n.action)}</em></li>`).join("")}</ol>` : `<p>Nothing today.</p>`}
        </div>
        <div>${section("Handled", r.done)}${section("Coming up", r.tomorrow)}</div>
      </div>
    </div>`;
  }

  // Printing copies the document into a body-level root, so the print
  // sheet shows that one page and nothing else.
  function printQuote(btn) {
    const doc = btn.parentElement.querySelector(".ag-qdoc");
    if (!doc) return;
    let sheet = document.getElementById("ag-print");
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.id = "ag-print";
      document.body.appendChild(sheet);
    }
    sheet.innerHTML = doc.outerHTML;
    const title = document.title;
    document.body.classList.add("is-printing");
    document.title = `Quote ${btn.dataset.printQuote}`;
    const done = () => {
      document.body.classList.remove("is-printing");
      document.title = title;
      sheet.innerHTML = "";
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  }

  /* ---------------- The board ---------------- */
  const STEP_MS = 1400;
  const laneAgents = () => OPS_TEAM.map((id) => hooks.byId(id)).filter(Boolean);
  const shortName = (id) => {
    const a = hooks.byId(id);
    return id === "speed-to-lead" ? "Speed-to-Lead" : a ? a.short || a.name : id;
  };
  const resultOf = (step) => (step.turns ? step.turns[step.turns.length - 1].recorded.result : step.recorded.result);
  const dayShort = (slot) => {
    const [name, num] = slot.dayLabel.split(" ");
    return `${name.slice(0, 3)} ${num}, ${slot.window.toLowerCase()}`;
  };

  // What each step shows on the board. All of it comes from the run.
  const OUTPUT = {
    "speed-to-lead": (r) => ({ chip: `${cap(r.score)}${r.emergency ? ", emergency" : ""}`, line: `Scored ${r.score}. ${r.emergency ? "Emergency, so the on-call plumber was alerted." : "Reply drafted."}`, body: r.textReply, msgs: 1 }),
    "hb-front-desk": (r, s) => ({ chip: r.emergency ? "Emergency" : r.bookingReady ? "Booking request" : cap(r.intent), line: r.emergency ? "Gave a safety step and alerted the on-call plumber." : r.bookingReady ? "Collected all five details and sent a booking request." : "Answered from the fact sheet.", body: r.reply, msgs: s.turns.length }),
    "quote-builder": (r) => ({ chip: r.totals ? r.totals.label : "Not listed", line: `Quote ${r.quote.number}: ${r.jobLabel}.`, body: r.customerMessage, msgs: 1, quote: 1 }),
    scheduler: (r) => ({ chip: r.emergency ? "Jumped the queue" : r.slot ? dayShort(r.slot) : "With the office", line: r.slot ? `${r.slot.techName}, ${r.slot.dayLabel}, ${r.slot.window.toLowerCase()}.${r.bump ? ` Moved ${r.bump.who} to ${r.bump.label}.` : ""}` : "No free slot, so the office takes it.", body: r.customerMessage, msgs: 1, placed: r.slot ? 1 : 0, emergency: r.emergency ? 1 : 0, flag: r.bump ? 1 : 0 }),
    "job-wrap-up": (r) => ({ chip: r.problem ? `${r.amount}, flagged` : r.amount, line: r.problem ? `Invoice ${r.amount}. ${HARBOURLINE.owner.first} is flagged: ${r.ownerFlag}` : `Invoice ${r.amount}, due ${r.dueLabel}. Review request ready.`, body: r.paymentMessage, msgs: 2, flag: r.problem ? 1 : 0 }),
    "hb-review-guardian": (r) => ({ chip: `${r.rating} star${r.rating === 1 ? "" : "s"}`, line: r.isNegative ? `${HARBOURLINE.owner.first} alerted. ${r.ownerAlert.suggestedAction}` : "Reply drafted, no alert needed.", body: r.publicReply, msgs: 2, flag: r.isNegative ? 1 : 0 }),
    "hb-dead-lead-revival": (r) => {
      const n = r.leads.filter((l) => l.message).length;
      return { chip: `${n} messages`, line: `${r.summary.reEngage} to re-engage, ${r.summary.nurture} to nurture, ${r.summary.dontContact} left alone.`, body: (r.leads.find((l) => l.message) || {}).message || "", msgs: n };
    },
    "daily-brief": (r) => ({ chip: `${r.needsYou.length} for ${HARBOURLINE.owner.first}`, line: r.headline, body: "", msgs: 0 }),
  };
  const outputOf = (step) => OUTPUT[step.agent](resultOf(step), step);

  // The day, flattened into the order it plays.
  const EVENTS = () => {
    if (typeof OPS_DAY === "undefined") return [];
    const list = OPS_DAY.events.slice();
    if (OPS_DAY.brief) list.push({ id: "brief", time: "17:05", timeLabel: "5:05pm", title: "Owner's Daily Brief", short: "The brief", source: "End of day", incoming: "", steps: [OPS_DAY.brief] });
    return list;
  };
  let events = [];
  let flat = [];
  const play = { phase: "idle", cursor: -1, speed: 1, selected: null, timer: null, userScrolled: false, calendarAt: null };
  const stateOf = (i) => (i < play.cursor ? "done" : i === play.cursor ? (play.phase === "done" ? "done" : "running") : "upcoming");

  function chipHtml(item) {
    const { esc } = hooks;
    return `<button type="button" class="ag-ops-chip" data-step="${item.i}" style="grid-column:${item.evIndex + 2};grid-row:${OPS_TEAM.indexOf(item.step.agent) + 2}" title="Open ${esc(shortName(item.step.agent))} at this run">${esc(outputOf(item.step).chip)}</button>`;
  }

  function gridHtml() {
    const { esc } = hooks;
    const heads = events
      .map((e, i) => `<button type="button" class="ag-ops-evhead" data-event="${e.id}" style="grid-column:${i + 2};grid-row:1"><strong>${esc(e.timeLabel)}</strong><span>${esc(e.short)}</span></button>`)
      .join("");
    const lanes = laneAgents()
      .map((a, r) => `<a class="ag-ops-lane" href="#${a.id}" data-ops-open="${a.id}" style="grid-row:${r + 2}"><span>${icon(a.icon, 15)}</span>${esc(shortName(a.id))}</a><i class="ag-ops-rule" style="grid-row:${r + 2}"></i>`)
      .join("");
    const columns = events.map((e, i) => `<i class="ag-ops-col" data-col="${e.id}" style="grid-column:${i + 2}"></i>`).join("");
    return `<div class="ag-ops-grid" style="grid-template-columns:136px repeat(${events.length}, minmax(0, 1fr))">
      ${columns}${lanes}${heads}${flat.map(chipHtml).join("")}
      <svg class="ag-ops-links" aria-hidden="true"><defs><marker id="ag-ops-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 8 4 0 8z" fill="context-stroke"/></marker></defs></svg>
    </div>`;
  }

  function stepRow(item) {
    const { esc } = hooks;
    const out = outputOf(item.step);
    const a = hooks.byId(item.step.agent);
    return `<li class="ag-ops-step" data-step-row="${item.i}">
      <span class="ag-card-icon">${icon(a.icon, 16)}</span>
      <div class="ag-ops-step-main">
        <div class="ag-ops-step-top"><strong>${esc(shortName(item.step.agent))}</strong><span class="ag-ops-tag">${esc(out.chip)}</span></div>
        <p>${esc(out.line)}</p>
        ${out.body ? `<blockquote>${esc(out.body)}</blockquote>` : ""}
        ${item.ev.id === "brief" ? "" : `<p class="ag-ops-hand">${icon("arrow", 14)}<span>Handed to <strong>${esc(shortName(item.step.handoffTo || "daily-brief"))}</strong>: ${esc(item.step.why || "Logged for the owner's end-of-day brief")}</span></p>`}
        <button type="button" class="ag-btn is-quiet" data-step="${item.i}">Open canvas ${icon("arrow", 14)}</button>
      </div>
    </li>`;
  }

  function eventBody(e) {
    const { esc } = hooks;
    const items = flat.filter((x) => x.ev === e);
    return `<div class="ag-ops-evtop"><strong>${esc(e.timeLabel)}</strong><h3>${esc(e.title)}</h3><span>${esc(e.source)}</span></div>
      ${e.incoming ? `<blockquote class="ag-ops-incoming">${esc(e.incoming)}</blockquote>` : ""}
      <ol class="ag-ops-steps">${items.map(stepRow).join("")}</ol>`;
  }

  function render() {
    const { esc } = hooks;
    const H = HARBOURLINE;
    events = EVENTS();
    flat = [];
    events.forEach((ev, evIndex) => ev.steps.forEach((step) => flat.push({ ev, evIndex, step, i: flat.length })));
    play.selected = events[0] ? events[0].id : null;
    root.innerHTML = `
      <div class="ag-ops-wrap">
        <header class="ag-ops-head">
          <button type="button" class="ag-icon-btn ag-back" data-ops-back aria-label="Back to all agents">${icon("back", 20)}</button>
          <div class="ag-ops-title">
            <h1>Ops Team</h1>
            <p>${esc(H.name)}, ${esc(H.region)}. A fictional business.</p>
          </div>
        </header>
        <p class="ag-ops-intro">Eight agents share one fact sheet, one customer list and one calendar, so a lead in one agent is the same customer in the next. Run a recorded day and watch the work pass between them.</p>

        <div class="ag-ops-bar">
          <div class="ag-ops-controls">
            <button type="button" class="ag-run ag-ops-go" id="ag-ops-go"></button>
            <button type="button" class="ag-btn" id="ag-ops-restart" hidden>Restart</button>
            <div class="ag-ops-speed" role="group" aria-label="Playback speed">
              ${[1, 2, 4].map((n) => `<button type="button" data-speed="${n}" aria-pressed="${n === 1}">${n}x</button>`).join("")}
            </div>
          </div>
          <p class="ag-ops-now" id="ag-ops-now" role="status" aria-live="polite"></p>
        </div>
        <dl class="ag-ops-stats" id="ag-ops-stats"></dl>

        <section class="ag-ops-board" aria-label="The day, by agent">
          ${gridHtml()}
          <div class="ag-ops-detail" id="ag-ops-detail"></div>
        </section>
        <section class="ag-ops-list" aria-label="The day, in order">
          <ol>${events.map((e) => `<li class="ag-ops-event" data-event-card="${e.id}">${eventBody(e)}</li>`).join("")}</ol>
        </section>

        <section class="ag-ops-section" aria-labelledby="ag-ops-cal-title">
          <h2 id="ag-ops-cal-title">The technicians' calendar</h2>
          <div id="ag-ops-cal"></div>
        </section>
        <section class="ag-ops-section" aria-labelledby="ag-ops-brief-title">
          <h2 id="ag-ops-brief-title">Owner's Daily Brief</h2>
          <div id="ag-ops-brief"></div>
        </section>
        <section class="ag-ops-section" aria-labelledby="ag-ops-team-title">
          <h2 id="ag-ops-team-title">The team</h2>
          <p class="ag-ops-note">Open any agent to run it yourself. Samples replay the day's recordings. Anything you write runs live, under the same limits as the other demos.</p>
          <div class="ag-ops-roster">
            ${laneAgents()
              .map(
                (a) => `<a class="ag-ops-member" href="#${a.id}" data-ops-open="${a.id}">
                  <span class="ag-card-icon">${icon(a.icon, 20)}</span>
                  <span><strong>${esc(shortName(a.id))}</strong><span>${esc(a.role || a.problem)}</span></span>
                </a>`
              )
              .join("")}
          </div>
        </section>
      </div>`;
    paint();
  }

  /* ---------------- Painting ---------------- */
  function paintStats() {
    const shown = play.phase === "done" ? flat : flat.slice(0, play.cursor + 1);
    const sum = (k) => shown.reduce((n, x) => n + (outputOf(x.step)[k] || 0), 0);
    const dayEvents = new Set(shown.filter((x) => x.ev.id !== "brief").map((x) => x.ev.id)).size;
    const stats = [
      ["Events", `${dayEvents} of ${events.filter((e) => e.id !== "brief").length}`],
      ["Agent runs", shown.length],
      ["Jobs placed", sum("placed")],
      ["Emergencies", sum("emergency")],
      ["Quotes", sum("quote")],
      ["Messages drafted", sum("msgs")],
      ["For the owner", sum("flag")],
    ];
    document.getElementById("ag-ops-stats").innerHTML = stats.map(([k, v]) => `<div><dd>${hooks.esc(v)}</dd><dt>${hooks.esc(k)}</dt></div>`).join("");
  }

  function paintCalendar() {
    const upto = play.phase === "done" ? flat.length : play.cursor + 1;
    const key = `${upto}${play.phase === "done"}`;
    if (play.calendarAt === key) return;
    play.calendarAt = key;
    const placed = flat.slice(0, upto).filter((x) => x.step.agent === "scheduler");
    const changes = placed.flatMap((x) => resultOf(x.step).changes);
    const last = placed.length ? resultOf(placed[placed.length - 1].step) : null;
    // While the day plays, follow the latest job. Once it's over, the week
    // of the day itself, where the emergencies and the moved jobs are.
    const live = play.phase !== "done" && last;
    document.getElementById("ag-ops-cal").innerHTML = hooks.renderBlock({ type: "calendar", wide: true, changes, focus: live ? last.addedId : null, week: live && last.slot ? last.slot.date : HARBOURLINE.dayOfTheDemo });
  }

  function paintBrief() {
    const box = document.getElementById("ag-ops-brief");
    const ready = OPS_DAY.brief && stateOf(flat.length - 1) === "done";
    if (ready === !!box.dataset.ready) return;
    box.dataset.ready = ready ? "1" : "";
    box.innerHTML = ready
      ? hooks.renderBlock({ type: "brief", wide: true, result: resultOf(OPS_DAY.brief) })
      : `<p class="ag-ops-note">It lands at the end of the day. Run the day to get there.</p>`;
  }

  function paintDetail() {
    const box = document.getElementById("ag-ops-detail");
    const e = events.find((x) => x.id === play.selected);
    if (e && box.dataset.event !== e.id) {
      box.dataset.event = e.id;
      box.innerHTML = eventBody(e);
    }
    root.querySelectorAll(".ag-ops-evhead").forEach((h) => {
      const on = h.dataset.event === play.selected;
      h.classList.toggle("is-selected", on);
      h.setAttribute("aria-pressed", String(on));
    });
    root.querySelectorAll(".ag-ops-col").forEach((c) => c.classList.toggle("is-selected", c.dataset.col === play.selected));
  }

  function paint() {
    const go = document.getElementById("ag-ops-go");
    if (!go) return;
    const label = { idle: "Run a day", playing: "Pause", paused: "Resume", done: "Run it again" }[play.phase];
    go.innerHTML = `${icon(play.phase === "playing" ? "pause" : "play", 16)}<span>${label}</span>`;
    go.disabled = !flat.length;
    document.getElementById("ag-ops-restart").hidden = play.phase === "idle" || play.phase === "done";
    root.querySelectorAll("[data-step]").forEach((el) => (el.dataset.state = stateOf(Number(el.dataset.step))));
    root.querySelectorAll("[data-step-row]").forEach((el) => (el.dataset.state = stateOf(Number(el.dataset.stepRow))));
    root.querySelectorAll("[data-link]").forEach((el) => (el.dataset.state = stateOf(Number(el.dataset.link))));
    root.querySelectorAll("[data-event-card]").forEach((el) => {
      const items = flat.filter((x) => x.ev.id === el.dataset.eventCard);
      el.dataset.state = items.some((x) => stateOf(x.i) === "running") ? "running" : items.every((x) => stateOf(x.i) === "done") ? "done" : "upcoming";
    });
    const cur = play.cursor >= 0 ? flat[Math.min(play.cursor, flat.length - 1)] : null;
    const now = document.getElementById("ag-ops-now");
    const text = !flat.length
      ? "The day hasn't been recorded yet."
      : play.phase === "idle"
      ? `${OPS_DAY.dateLabel}. Ten events, from recordings. No live calls.`
      : play.phase === "done"
      ? "Day finished. Click any step to open that agent's canvas at that run."
      : `${cur.ev.timeLabel}: ${cur.ev.title}, ${shortName(cur.step.agent)}`;
    if (now.textContent !== text) now.textContent = text;
    paintStats();
    paintCalendar();
    paintBrief();
    paintDetail();
  }

  // Arrows between the steps of one event, drawn over the grid.
  function layoutLinks() {
    const svg = root.querySelector(".ag-ops-links");
    if (!svg || !svg.getBoundingClientRect().width) return;
    const box = svg.getBoundingClientRect();
    let paths = "";
    flat.forEach((item, n) => {
      const next = flat[n + 1];
      if (!next || next.ev !== item.ev) return;
      const a = root.querySelector(`.ag-ops-chip[data-step="${item.i}"]`).getBoundingClientRect();
      const b = root.querySelector(`.ag-ops-chip[data-step="${next.i}"]`).getBoundingClientRect();
      const down = b.top >= a.top;
      const x = a.left + a.width / 2 - box.left;
      const y1 = (down ? a.bottom : a.top) - box.top;
      const y2 = (down ? b.top : b.bottom) - box.top;
      paths += `<path data-link="${next.i}" d="M${x} ${y1} L${x} ${y2}" marker-end="url(#ag-ops-arrow)"/>`;
    });
    svg.querySelectorAll("path[data-link]").forEach((p) => p.remove());
    svg.insertAdjacentHTML("beforeend", paths);
    root.querySelectorAll("[data-link]").forEach((el) => (el.dataset.state = stateOf(Number(el.dataset.link))));
  }

  /* ---------------- Playback ---------------- */
  function stop() {
    clearTimeout(play.timer);
    play.timer = null;
  }
  function follow(item) {
    play.selected = item.ev.id;
    // On the list view, keep the running event in sight until the visitor scrolls.
    if (play.userScrolled || !window.matchMedia("(max-width: 1099px)").matches) return;
    const card = root.querySelector(`[data-event-card="${item.ev.id}"]`);
    if (card) card.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  function tick() {
    play.cursor++;
    if (play.cursor >= flat.length) {
      play.cursor = flat.length;
      play.phase = "done";
      paint();
      return;
    }
    follow(flat[play.cursor]);
    paint();
    play.timer = setTimeout(tick, STEP_MS / play.speed);
  }
  function runDay() {
    stop();
    if (hooks.mqReduce.matches) {
      play.cursor = flat.length;
      play.phase = "done";
      play.selected = events[events.length - 1].id;
      return paint();
    }
    play.cursor = -1;
    play.phase = "playing";
    play.userScrolled = false;
    tick();
  }
  function toggle() {
    if (play.phase === "playing") {
      stop();
      play.phase = "paused";
      paint();
    } else if (play.phase === "paused") {
      play.phase = "playing";
      play.userScrolled = false;
      tick();
    } else runDay();
  }
  function restart() {
    stop();
    play.phase = "idle";
    play.cursor = -1;
    play.selected = events[0] ? events[0].id : null;
    paint();
  }

  function onClick(e) {
    if (e.target.closest("[data-ops-back]")) {
      if (history.state && history.state.agFrom === "") history.back();
      else hooks.go("");
      return;
    }
    const open = e.target.closest("[data-ops-open]");
    if (open && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      return hooks.go(open.dataset.opsOpen);
    }
    if (e.target.closest("#ag-ops-go")) return toggle();
    if (e.target.closest("#ag-ops-restart")) return restart();
    const speed = e.target.closest("[data-speed]");
    if (speed) {
      play.speed = Number(speed.dataset.speed);
      root.querySelectorAll("[data-speed]").forEach((b) => b.setAttribute("aria-pressed", String(b === speed)));
      return;
    }
    const head = e.target.closest("[data-event]");
    if (head) {
      play.selected = head.dataset.event;
      return paintDetail();
    }
    const step = e.target.closest("[data-step]");
    if (step) hooks.openRun(flat[Number(step.dataset.step)].step);
  }

  return {
    init(h) {
      hooks = h;
      root = document.getElementById("ag-ops");
      root.addEventListener("click", onClick);
      const scrolled = () => (play.userScrolled = true);
      window.addEventListener("wheel", scrolled, { passive: true });
      window.addEventListener("touchmove", scrolled, { passive: true });
      let resizing;
      window.addEventListener("resize", () => {
        clearTimeout(resizing);
        resizing = setTimeout(() => !root.hidden && layoutLinks(), 120);
      });
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-print-quote]");
        if (btn) printQuote(btn);
        const tab = e.target.closest("[data-cal-week]");
        if (tab) {
          const cal = tab.closest(".ag-cal");
          cal.querySelectorAll("[data-cal-week]").forEach((t) => t.setAttribute("aria-pressed", String(t === tab)));
          cal.querySelectorAll(".ag-cal-week").forEach((w) => (w.hidden = w.dataset.week !== tab.dataset.calWeek));
        }
      });
      render();
    },
    show() {
      root.hidden = false;
      paint();
      window.scrollTo(0, scroll);
      requestAnimationFrame(layoutLinks);
    },
    // Leaving the board pauses the day, and it picks up where it stopped.
    hide() {
      if (!root || root.hidden) return;
      scroll = window.scrollY;
      if (play.phase === "playing") {
        stop();
        play.phase = "paused";
      }
      root.hidden = true;
    },
    blocks(helpers) {
      return { quoteDoc: (b) => quoteDoc(b, helpers), calendar: (b) => calendar(b, helpers), brief: (b) => brief(b, helpers) };
    },
    loadSamples,
  };
})();

AgentOps.loadSamples();
