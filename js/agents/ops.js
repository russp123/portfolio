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
  const laneAgents = () => OPS_TEAM.map((id) => hooks.byId(id)).filter(Boolean);

  function render() {
    const { esc } = hooks;
    const H = HARBOURLINE;
    root.innerHTML = `
      <div class="ag-ops-wrap">
        <header class="ag-ops-head">
          <button type="button" class="ag-icon-btn ag-back" data-ops-back aria-label="Back to all agents">${icon("back", 20)}</button>
          <div class="ag-ops-title">
            <h1>Ops Team</h1>
            <p>${esc(H.name)}, ${esc(H.region)}</p>
          </div>
        </header>
        <p class="ag-ops-intro">The agents share one fact sheet, one customer list and one calendar, so a lead in one agent is the same customer in the next.</p>
        <section class="ag-ops-roster" aria-label="The team">
          ${laneAgents()
            .map(
              (a) => `<a class="ag-ops-member" href="#${a.id}" data-ops-open="${a.id}">
                <span class="ag-card-icon">${icon(a.icon, 20)}</span>
                <span><strong>${esc(a.short || a.name)}</strong><span>${esc(a.role || a.problem)}</span></span>
              </a>`
            )
            .join("")}
        </section>
      </div>`;
  }

  function onClick(e) {
    if (e.target.closest("[data-ops-back]")) return hooks.go("");
    const open = e.target.closest("[data-ops-open]");
    if (open && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      hooks.go(open.dataset.opsOpen);
    }
  }

  return {
    init(h) {
      hooks = h;
      root = document.getElementById("ag-ops");
      root.addEventListener("click", onClick);
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-print-quote]");
        if (btn) printQuote(btn);
      });
      render();
    },
    show() {
      root.hidden = false;
      window.scrollTo(0, scroll);
    },
    hide() {
      if (!root || root.hidden) return;
      scroll = window.scrollY;
      root.hidden = true;
    },
    blocks(helpers) {
      return { quoteDoc: (b) => quoteDoc(b, helpers) };
    },
    loadSamples,
  };
})();

AgentOps.loadSamples();
