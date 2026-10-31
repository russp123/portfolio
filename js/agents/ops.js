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
    const entry = (j) => {
      const t = H.tech(j.tech);
      const cls = [j.id === b.focus ? "is-focus" : "", j.added ? "is-new" : "", j.moved ? "is-moved" : "", j.emergency ? "is-emergency" : ""].filter(Boolean).join(" ");
      const tag = j.emergency ? "Emergency" : j.moved ? "Moved" : j.added ? "New" : "";
      return `<li class="ag-cal-job ${cls}"><span class="ag-cal-tech">${esc(t.first)}</span><strong>${esc(j.who)}</strong><span>${esc(j.job)}, ${esc(j.suburb)}</span>${tag ? `<em>${tag}</em>` : ""}</li>`;
    };
    // One technician's one day, for the before and after in the story.
    if (b.day) {
      const only = jobs.filter((j) => j.tech === b.tech);
      const slot = (w) => {
        const j = only.find((x) => x.date === b.day && x.win === w);
        return `<div class="ag-cal-win"><span class="ag-cal-winlabel">${H.windows[w].label}</span>${j ? `<ul>${entry(j)}</ul>` : "<p>Free</p>"}</div>`;
      };
      return `<section class="ag-cal-day"><h4>${esc(b.title)}</h4>${slot("am")}${slot("pm")}</section>`;
    }
    const weeks = [H.calendarDays.slice(0, 5), H.calendarDays.slice(5)];
    const shown = weeks.findIndex((w) => w.includes(b.week)) === 1 ? 1 : 0;
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

  function eventSteps(e) {
    const { esc } = hooks;
    const items = flat.filter((x) => x.ev === e);
    return `${e.incoming ? `<blockquote class="ag-ops-incoming">${esc(e.incoming)}</blockquote>` : ""}
      <ol class="ag-ops-steps">${items.map(stepRow).join("")}</ol>`;
  }
  function eventBody(e) {
    const { esc } = hooks;
    return `<div class="ag-ops-evtop"><strong>${esc(e.timeLabel)}</strong><h3>${esc(e.title)}</h3><span>${esc(e.source)}</span></div>${eventSteps(e)}`;
  }

  /* ---------------- Dot-matrix numerals ---------------- */
  const GLYPHS = {
    0: "01110 10001 10001 10001 10001 10001 01110",
    1: "00100 01100 00100 00100 00100 00100 01110",
    2: "01110 10001 00001 00110 01000 10000 11111",
    3: "11110 00001 00001 01110 00001 00001 11110",
    4: "00010 00110 01010 10010 11111 00010 00010",
    5: "11111 10000 11110 00001 00001 10001 01110",
    6: "00110 01000 10000 11110 10001 10001 01110",
    7: "11111 00001 00010 00100 01000 01000 01000",
    8: "01110 10001 10001 01110 10001 10001 01110",
    9: "01110 10001 10001 01111 00001 00010 01100",
    ":": "0 1 0 0 0 1 0",
  };
  // Each pixel of the numeral is a small block of dots; a few evenly spaced
  // dots take the accent colour.
  function dotMatrix(text, accents = 10) {
    const BLOCK = 3;
    const STEP = 5;
    const dots = [];
    let x = 0;
    for (const ch of text) {
      const rows = (GLYPHS[ch] || "").split(" ");
      if (!rows[0]) continue;
      rows.forEach((row, ry) => [...row].forEach((on, rx) => {
        if (on !== "1") return;
        for (let a = 0; a < BLOCK; a++) for (let b = 0; b < BLOCK; b++) dots.push([x + (rx * BLOCK + a) * STEP, (ry * BLOCK + b) * STEP]);
      }));
      x += (rows[0].length * BLOCK + 2) * STEP;
    }
    const every = Math.max(1, Math.floor(dots.length / accents));
    const circles = dots.map(([cx, cy], i) => (i % every === Math.floor(every / 2) ? `<circle class="is-accent" cx="${cx + 2}" cy="${cy + 2}" r="2.6"/>` : `<circle cx="${cx + 2}" cy="${cy + 2}" r="1.5"/>`)).join("");
    return `<svg class="ag-st-dots" viewBox="0 0 ${x - 2 * STEP} ${7 * BLOCK * STEP}" aria-hidden="true">${circles}</svg>`;
  }

  /* ---------------- The story ---------------- */
  const stepById = (id) => (flat.find((x) => x.step.id === id) || {}).step;
  const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

  function section(n, id, label, line, dim, para, body) {
    const { esc } = hooks;
    return `<section class="ag-st-sec" id="ag-st-${id}" data-sec="${esc(label)}">
      <header class="ag-st-head ag-rv">
        <div>
          <p class="ag-st-eye"><span>${n}</span> · ${esc(label)}</p>
          <h2>${esc(line)}<em>${esc(dim)}</em></h2>
        </div>
        <p class="ag-st-para">${esc(para)}</p>
      </header>
      ${body}
    </section>`;
  }

  const openBtn = (step, label = "Open this run") => `<button type="button" class="ag-st-open" data-open-run="${hooks.esc(step.id)}">${hooks.esc(label)} ${icon("arrow", 14)}</button>`;
  const agentHead = (id) => {
    const a = hooks.byId(id);
    return `<div class="ag-st-agent"><span class="ag-card-icon">${icon(a.icon, 16)}</span><strong>${hooks.esc(shortName(id))}</strong></div>`;
  };

  function storyChain() {
    return `<div class="ag-st-stage ag-st-chain ag-rv"><i class="ag-st-rail" aria-hidden="true"><b></b></i>
      ${laneAgents().map((a) => `<a class="ag-st-link" href="#${a.id}" data-ops-open="${a.id}"><span class="ag-card-icon">${icon(a.icon, 20)}</span><strong>${hooks.esc(shortName(a.id))}</strong></a>`).join("")}
    </div>`;
  }

  function storyHandoff() {
    const { esc } = hooks;
    const ev = events[0];
    const lead = stepById("e01-lead");
    const slot = stepById("e01-slot");
    const lo = outputOf(lead);
    const so = outputOf(slot);
    const arrow = `<span class="ag-st-arrow" aria-hidden="true">${icon("arrow", 20)}</span>`;
    return `<div class="ag-st-stage ag-st-flow ag-rv">
      <article class="ag-st-card"><p class="ag-st-kicker">${esc(ev.timeLabel)}, ${esc(ev.source.toLowerCase())}</p><div class="ag-bubble is-in">${esc(ev.incoming)}</div></article>
      ${arrow}
      <article class="ag-st-card">${agentHead(lead.agent)}<span class="ag-ops-tag">${esc(lo.chip)}</span><p>${esc(lo.line)}</p><div class="ag-bubble is-out">${esc(lo.body)}</div>${openBtn(lead)}</article>
      ${arrow}
      <article class="ag-st-card">${agentHead(slot.agent)}<span class="ag-ops-tag">${esc(so.chip)}</span><p>${esc(so.line)}</p><div class="ag-bubble is-out">${esc(so.body)}</div>${openBtn(slot)}</article>
    </div>`;
  }

  function storyCalendar() {
    const H = HARBOURLINE;
    const slot = stepById("e01-slot");
    const r = resultOf(slot);
    return `<div class="ag-st-stage ag-st-compare ag-rv">
      ${hooks.renderBlock({ type: "calendar", day: H.dayOfTheDemo, tech: r.slot.tech, changes: [], title: `${r.slot.techName}, before 7:05am` })}
      <span class="ag-st-arrow" aria-hidden="true">${icon("arrow", 20)}</span>
      ${hooks.renderBlock({ type: "calendar", day: H.dayOfTheDemo, tech: r.slot.tech, changes: r.changes, focus: r.addedId, title: `${r.slot.techName}, after` })}
      <ul class="ag-st-notes">
        <li><strong>Worked out in code.</strong> The free slots, the travel and who moves. The model never does this.</li>
        <li><strong>A window, never a time.</strong> Customers hear morning or afternoon, and the office confirms.</li>
        <li><strong>Nobody forgotten.</strong> ${hooks.esc(r.bump.who)} needs a call, so it goes on the owner's brief.</li>
      </ul>
    </div>`;
  }

  function storyQuote() {
    const step = stepById("e03-quote");
    return `<div class="ag-st-stage ag-st-side ag-rv">
      <ul class="ag-st-notes">
        <li><strong>The model reads the job.</strong> It picks the job type and writes the scope.</li>
        <li><strong>Code does the sums.</strong> Call-out and labour come from the price list.</li>
        <li><strong>Unknown parts stay honest.</strong> Anything not listed reads "Quoted on site".</li>
        <li><strong>A real page.</strong> It prints to one A4 sheet or saves as a PDF.</li>
        <li>${openBtn(step)}</li>
      </ul>
      <div class="ag-st-paper">${hooks.renderBlock({ type: "quoteDoc", result: resultOf(step) })}</div>
    </div>`;
  }

  function storyWrap() {
    const { esc } = hooks;
    const fine = stepById("e04-wrap");
    const rough = stepById("e08-wrap");
    const f = resultOf(fine);
    const o = resultOf(rough);
    return `<div class="ag-st-stage ag-st-three ag-rv">
      <article class="ag-st-card"><p class="ag-st-kicker">Payment reminder</p><div class="ag-bubble is-out">${esc(f.paymentMessage)}</div></article>
      <article class="ag-st-card"><p class="ag-st-kicker">Review request</p><div class="ag-bubble is-out">${esc(f.reviewMessage)}</div>${openBtn(fine)}</article>
      <article class="ag-st-card is-flag"><p class="ag-st-kicker">When a job goes badly</p><p class="ag-st-big">${esc(o.ownerFlag)}</p><p><strong>${esc(o.suggestedAction)}</strong></p><p>The review request ${esc(o.reviewTiming.toLowerCase().replace("renee", HARBOURLINE.owner.first))}.</p>${openBtn(rough)}</article>
    </div>`;
  }

  function storyReview() {
    const { esc } = hooks;
    const step = stepById("e06-review");
    const r = resultOf(step);
    return `<div class="ag-st-stage ag-st-two ag-rv">
      ${hooks.renderBlock({ type: "review", name: step.fields.name, rating: r.rating, text: step.fields.review, reply: r.publicReply })}
      <article class="ag-st-card is-flag"><p class="ag-st-kicker">Only ${esc(HARBOURLINE.owner.first)} sees this</p><p class="ag-st-big">${esc(r.ownerAlert.summary)}</p><p>${esc(r.ownerAlert.jobNoteMatch)}</p><p><strong>${esc(r.ownerAlert.suggestedAction)}</strong></p>${openBtn(step)}</article>
    </div>`;
  }

  function storyDay() {
    const { esc } = hooks;
    return `
      <div class="ag-ops-bar ag-rv">
        <div class="ag-ops-clock" id="ag-ops-clock"></div>
        <div class="ag-ops-barmain">
          <div class="ag-ops-controls">
            <button type="button" class="ag-run ag-ops-go" id="ag-ops-go"></button>
            <button type="button" class="ag-btn" id="ag-ops-restart" hidden>Restart</button>
            <div class="ag-ops-speed" role="group" aria-label="Playback speed">
              ${[1, 2, 4].map((n) => `<button type="button" data-speed="${n}" aria-pressed="${n === 1}">${n}x</button>`).join("")}
            </div>
          </div>
          <p class="ag-ops-now" id="ag-ops-now" role="status" aria-live="polite"></p>
        </div>
      </div>
      <dl class="ag-ops-stats ag-rv" id="ag-ops-stats"></dl>
      <div class="ag-ops-board ag-rv">
        ${gridHtml()}
        <div class="ag-ops-detail" id="ag-ops-detail"></div>
      </div>
      <div class="ag-ops-list">
        <ol>${events
          .map(
            (e) => `<li class="ag-ops-event" data-event-card="${e.id}">
              <button type="button" class="ag-ops-evsum" data-event-toggle="${e.id}" aria-expanded="false">
                <strong>${esc(e.timeLabel)}</strong><span>${esc(e.title)}</span>${icon("right", 16)}
              </button>
              <div class="ag-ops-evbody" hidden>${eventSteps(e)}</div>
            </li>`
          )
          .join("")}</ol>
      </div>
      <div class="ag-ops-livecal ag-rv">
        <h3>The calendar, as the day changes it</h3>
        <div id="ag-ops-cal"></div>
      </div>`;
  }

  function render() {
    const { esc } = hooks;
    const H = HARBOURLINE;
    events = EVENTS();
    flat = [];
    events.forEach((ev, evIndex) => ev.steps.forEach((step) => flat.push({ ev, evIndex, step, i: flat.length })));
    play.selected = events[0] ? events[0].id : null;
    const brief = OPS_DAY.brief ? resultOf(OPS_DAY.brief) : null;
    const needs = brief ? NUMBER_WORDS[brief.needsYou.length] || String(brief.needsYou.length) : "";
    const sections = [
      section("01", "idea", "the idea", "Not eight chatbots.", "One team that hands off.", "Each agent does one job, then passes the work on. They all read the same fact sheet, the same customer list and the same calendar.", storyChain()),
      section("02", "handoff", "the handoff", "A burst pipe at 7:05am.", "On the calendar straight away.", "The lead is read, scored and answered. The emergency goes to the Scheduler without anyone copying details across.", storyHandoff()),
      section("03", "calendar", "the calendar", "Emergencies jump the queue.", "Nobody is promised an exact time.", "The on-call plumber's morning changes hands, and whoever was there moves to the next free window.", storyCalendar()),
      section("04", "quote", "the quote", "Job details in.", "A one-page quote out.", "A customer asks for a price and gets a written, itemised quote. A price can't be made up, because the model never writes one.", storyQuote()),
      section("05", "followthrough", "the follow-through", "The job finishes.", "The paperwork doesn't wait.", "Every customer gets a payment reminder and an honest review request. If the note says it went badly, the owner calls first.", storyWrap()),
      section("06", "reviews", "the reviews", "A 1-star review at noon.", `${H.owner.first} gets the call to make.`, "A calm public reply, never an argument. The private details stay private, and the owner gets one clear next step.", storyReview()),
      section("07", "day", "the day", "Ten events. Eight agents.", "Press play.", "A whole Wednesday, recorded from real runs, with no live calls. Click any step to open that agent's canvas at that exact run.", storyDay()),
      brief ? section("08", "brief", "the brief", "By 5:05pm, one screen.", `${needs} things need ${H.owner.first}.`, "Everything the team did, added up by code. Anything flagged during the day can't be left off.", `<div class="ag-st-stage ag-rv">${hooks.renderBlock({ type: "brief", wide: true, result: brief })}</div>`) : "",
      section("09", "team", "the team", "Meet the team.", "Run any of them yourself.", "Samples replay the day's recordings. Anything you write runs live, under the same limits as the other demos.", `<div class="ag-ops-roster ag-rv">
        ${laneAgents()
          .map(
            (a) => `<a class="ag-ops-member" href="#${a.id}" data-ops-open="${a.id}">
              <span class="ag-card-icon">${icon(a.icon, 20)}</span>
              <span><strong>${esc(shortName(a.id))}</strong><span>${esc(a.role || a.problem)}</span></span>
            </a>`
          )
          .join("")}
      </div>`),
    ];
    root.innerHTML = `
      <nav class="ag-st-nav" aria-label="Ops Team">
        <button type="button" class="ag-icon-btn ag-back" data-ops-back aria-label="Back to all agents">${icon("back", 20)}</button>
        <span class="ag-st-brand"><strong>Ops Team</strong><span>${esc(H.name)}</span></span>
        <button type="button" class="ag-st-cta" data-run-day>Run the day</button>
      </nav>
      <div class="ag-ops-wrap">
        <header class="ag-st-hero">
          <h1><em>Most chatbots answer one question.</em>This team runs the whole day.</h1>
          <p class="ag-st-sub">Eight AI agents run a plumber's day in Sydney: leads, quotes, the calendar, invoices and reviews. Each one hands its work to the next.</p>
          <div class="ag-st-actions">
            <button type="button" class="ag-st-cta is-lg" data-run-day>Run the day</button>
            <button type="button" class="ag-st-ghost" data-scroll="idea">See how it works</button>
          </div>
          <p class="ag-st-mono">A fictional business. Real recorded runs.</p>
          <figure class="ag-st-matrix">${dotMatrix("7:05")}<figcaption>7:05am. A pipe bursts in Marrickville.</figcaption></figure>
        </header>
        ${sections.join("")}
        <section class="ag-cta ag-rv" aria-labelledby="ag-ops-cta-title">
          <div>
            <h2 id="ag-ops-cta-title">Want a team like this for your business?</h2>
            <p>Built around your own facts, prices and hours, and wired into the tools you already use.</p>
          </div>
          <a class="ag-pill" href="mailto:${esc(hooks.email)}">Get in touch</a>
        </section>
      </div>
      <nav class="ag-st-rail-nav" aria-label="Sections">
        ${sections
          .filter(Boolean)
          .map((_, i) => ["idea", "handoff", "calendar", "quote", "followthrough", "reviews", "day", "brief", "team"][i])
          .map((id) => `<button type="button" data-scroll="${id}" aria-label="Go to ${id}"></button>`)
          .join("")}
      </nav>`;
    paint();
    observe();
  }

  // Sections rise in once, and the side dots track where you are.
  let observer = null;
  function observe() {
    if (observer || !("IntersectionObserver" in window)) {
      root.querySelectorAll(".ag-rv").forEach((el) => el.classList.add("is-in"));
      return;
    }
    observer = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        observer.unobserve(en.target);
      }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    root.querySelectorAll(".ag-rv").forEach((el) => observer.observe(el));
    const dots = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = en.target.id.replace("ag-st-", "");
        root.querySelectorAll(".ag-st-rail-nav button").forEach((b) => (b.dataset.on = String(b.dataset.scroll === id)));
      }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    root.querySelectorAll(".ag-st-sec").forEach((el) => dots.observe(el));
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

  function paintClock(cur) {
    const box = document.getElementById("ag-ops-clock");
    const time = (cur && play.phase !== "done" ? cur.ev : events[play.phase === "done" ? events.length - 1 : 0]).timeLabel;
    if (box.dataset.time === time) return;
    box.dataset.time = time;
    box.innerHTML = `${dotMatrix(time.replace(/[a-z]/g, ""), 4)}<span>${time.slice(-2)}</span>`;
  }

  function setEventOpen(card, open) {
    const body = card.querySelector(".ag-ops-evbody");
    body.hidden = !open;
    card.querySelector(".ag-ops-evsum").setAttribute("aria-expanded", String(open));
  }

  function paintDetail() {
    const box = document.getElementById("ag-ops-detail");
    const e = events.find((x) => x.id === play.selected);
    if (e && box.dataset.shown !== e.id) {
      box.dataset.shown = e.id;
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
    const label = { idle: "Run the day", playing: "Pause", paused: "Resume", done: "Run it again" }[play.phase];
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
    paintClock(cur);
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
    if (card) {
      root.querySelectorAll("[data-event-card]").forEach((c) => setEventOpen(c, c === card));
      card.scrollIntoView({ block: "center", behavior: "smooth" });
    }
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

  function scrollToSection(id) {
    const el = document.getElementById(`ag-st-${id}`);
    if (el) el.scrollIntoView({ behavior: hooks.mqReduce.matches ? "auto" : "smooth", block: "start" });
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
    const toRun = e.target.closest("[data-open-run]");
    if (toRun) {
      const it = flat.find((x) => x.step.id === toRun.dataset.openRun);
      if (it) hooks.openRun(it.step);
      return;
    }
    const jump = e.target.closest("[data-scroll]");
    if (jump) return scrollToSection(jump.dataset.scroll);
    if (e.target.closest("[data-run-day]")) {
      scrollToSection("day");
      if (play.phase === "idle" || play.phase === "done") setTimeout(runDay, hooks.mqReduce.matches ? 0 : 500);
      return;
    }
    const sum = e.target.closest("[data-event-toggle]");
    if (sum) {
      const card = sum.closest("[data-event-card]");
      setEventOpen(card, sum.getAttribute("aria-expanded") !== "true");
      return;
    }
    if (e.target.closest("#ag-ops-go")) return toggle();
    if (e.target.closest("#ag-ops-restart")) return restart();
    const speed = e.target.closest("[data-speed]");
    if (speed) {
      play.speed = Number(speed.dataset.speed);
      root.querySelectorAll("[data-speed]").forEach((b) => b.setAttribute("aria-pressed", String(b === speed)));
      return;
    }
    const head = e.target.closest(".ag-ops-evhead");
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
    dotMatrix,
  };
})();

AgentOps.loadSamples();
