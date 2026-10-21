/* ============================================================
   Agent registry for /agents (client side).
   One entry per agent: identity + copy for the landing card and
   dock, the workflow graph (nodes, edges, layout grid) and what
   each node's side panel shows. The canvas engine and the shell
   read only this, so a new agent is config + a server prompt in
   api/agent.js, with no new UI code.

   Graph rules
   - node.col / node.row: grid position. Horizontal layout uses
     col for x and row for y (negative rows sit above the main line);
     under 700px the grid turns 90deg clockwise (col becomes y, a row
     above the main line moves to its right), so nodes read top to
     bottom.
   - node.type: "trigger" | "ai" | "branch" | "action" | "output".
     Exactly one trigger. A branch node has decide(result) that
     returns the `when` value of the outgoing edge it takes.
   - caption(result): short text shown under the node after a run.
   - view(run): array of panel blocks (see BLOCKS in app.js).
   No em dashes in any visible copy here.
   ============================================================ */

const AGENT_ICONS = {
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>',
  bolt: '<path d="M13 3 5 13.5h6l-1 7.5 8-10.5h-6z"/>',
  chat: '<path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-4 3.5V17H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8.5 10h7M8.5 13h4.5"/>',
  star: '<path d="m12 4 2.4 5 5.4.7-4 3.8 1 5.4L12 16.3 7.2 18.9l1-5.4-4-3.8 5.4-.7z"/>',
  revive: '<path d="M4.5 12a7.5 7.5 0 0 1 13-5.1L19.5 9"/><path d="M19.5 4.5V9H15"/><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1L4.5 15"/><path d="M4.5 19.5V15H9"/>',
  inbox: '<path d="M4 13.5 6.5 5h11l2.5 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 13.5h4.5l1.2 2.5h4.6l1.2-2.5H20"/>',
  gauge: '<path d="M4.5 16a7.5 7.5 0 1 1 15 0"/><path d="m12 16 3.5-4.5"/><path d="M12 16h.01"/>',
  split: '<path d="M5 12h5"/><path d="M10 12c3 0 3-5 6-5h3"/><path d="M10 12c3 0 3 5 6 5h3"/><path d="m17 4.5 2.5 2.5L17 9.5"/><path d="m17 14.5 2.5 2.5-2.5 2.5"/>',
  bell: '<path d="M6.5 16V11a5.5 5.5 0 0 1 11 0v5l1.5 2h-14z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  message: '<path d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1z"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  card: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.5c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M14.5 10h3.5M14.5 13.5h3.5"/>',
};

function agentIcon(name, size = 24) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${AGENT_ICONS[name] || ""}</svg>`;
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

const AGENTS = [
  {
    id: "speed-to-lead",
    status: "live",
    name: "Speed-to-Lead Responder",
    business: "Harbourline Plumbing",
    problem: "Replies to new leads in seconds, not hours.",
    icon: "bolt",
    // Trigger panel copy (the panel itself is built by app.js).
    trigger: {
      inputLabel: "Lead message",
      placeholder: "Paste a web form, a text, or a missed-call voicemail transcript.",
      timeLabel: "Received (Sydney time)",
    },
    summarize(r) {
      return `${cap(r.score)} lead${r.emergency ? " · Emergency" : ""}`;
    },

    nodes: [
      {
        id: "lead",
        type: "trigger",
        col: 0,
        row: 0,
        label: "New lead",
        icon: "inbox",
        about: "A new lead arrives by web form, text or missed-call voicemail. Pick a sample or write your own, then run the agent.",
      },
      {
        id: "qualify",
        type: "ai",
        col: 1,
        row: 0,
        label: "Qualify lead",
        icon: "gauge",
        about: "Pulls out who, where and what, then scores the lead hot, warm or cold.",
        caption: (r) => cap(r.score),
        view: (run) => {
          const r = run.result;
          return [
            { type: "badge", label: cap(r.score), tone: r.score === "hot" ? "accent" : r.score === "warm" ? "strong" : "muted" },
            { type: "text", body: r.scoreReason },
            {
              type: "kv",
              title: "From the message",
              rows: [
                ["Name", r.lead.name],
                ["Contact", r.lead.contact],
                ["Suburb", r.lead.suburb],
                ["Job", r.lead.job],
                ["Timing", r.lead.timing],
              ],
              empty: "Not given",
            },
            { type: "list", title: "Still needed", items: r.missing, empty: "Nothing, ready to book." },
          ];
        },
      },
      {
        id: "emergency",
        type: "branch",
        col: 2,
        row: 0,
        label: "Emergency?",
        icon: "split",
        about: "Decides whether this needs the on-call plumber right now.",
        decide: (r) => (r.emergency ? "yes" : "no"),
        caption: (r) => (r.emergency ? "Yes" : "No"),
        view: (run) => [
          { type: "badge", label: run.result.emergency ? "Emergency" : "Not an emergency", tone: run.result.emergency ? "accent" : "muted" },
          { type: "text", body: run.result.emergencyReason },
        ],
      },
      {
        id: "alert",
        type: "action",
        col: 3,
        row: -1,
        label: "Alert on-call plumber",
        icon: "bell",
        about: "On the emergency path only: writes the internal alert for whoever is on call.",
        caption: () => "Alert drafted",
        view: (run) => [
          { type: "quote", title: "Internal alert", body: run.result.onCallAlert },
          { type: "note", body: "A mock alert. Nothing is sent." },
        ],
      },
      {
        id: "reply",
        type: "ai",
        col: 4,
        row: 0,
        label: "Draft text reply",
        icon: "message",
        about: "Writes the first text back: friendly, signed, and asking only for what's missing.",
        caption: (r) => `${r.textReply.length} chars`,
        view: (run) => [{ type: "sms", body: run.result.textReply, limit: 320 }],
      },
      {
        id: "booking",
        type: "ai",
        col: 5,
        row: 0,
        label: "Suggest booking",
        icon: "calendar",
        about: "Suggests when to book the job, inside business hours unless it's an emergency.",
        caption: (r) => r.booking.window,
        view: (run) => [
          { type: "kv", rows: [["Window", run.result.booking.window], ["Why", run.result.booking.reason]] },
          { type: "kv", title: "When it came in", rows: [["Received", run.received.label], ["Business hours", run.received.inHours ? "Open" : "Closed"]] },
        ],
      },
      {
        id: "crm",
        type: "output",
        col: 6,
        row: 0,
        label: "CRM card",
        icon: "card",
        about: "The deliverable: the text thread and a ready-to-work CRM contact card.",
        caption: (r) => r.crm.stage,
        view: (run) => {
          const r = run.result;
          return [
            { type: "thread", title: "Text thread", channel: run.channel || "New lead", incoming: run.input, outgoing: r.textReply, from: r.lead.name || "New lead", business: "Harbourline Plumbing" },
            {
              type: "crm",
              title: "CRM contact",
              name: r.lead.name,
              rows: [
                ["Contact", r.lead.contact],
                ["Suburb", r.lead.suburb],
                ["Job", r.lead.job],
              ],
              stage: r.crm.stage,
              score: cap(r.score),
              tags: r.crm.tags,
              nextAction: r.crm.nextAction,
            },
            { type: "note", body: "A visual mock. Nothing is sent or saved to a real CRM." },
          ];
        },
      },
    ],

    edges: [
      { id: "e1", from: "lead", to: "qualify" },
      { id: "e2", from: "qualify", to: "emergency" },
      { id: "e3", from: "emergency", to: "alert", when: "yes", label: "Yes" },
      { id: "e4", from: "alert", to: "reply" },
      { id: "e5", from: "emergency", to: "reply", when: "no", label: "No" },
      { id: "e6", from: "reply", to: "booking" },
      { id: "e7", from: "booking", to: "crm" },
    ],
  },

  // In training: landing card only. Not routable, not in the dock.
  { id: "front-desk", status: "training", name: "AI Front Desk", business: "Brightwater Dental", problem: "Answers patient questions around the clock, and knows when to hand off.", icon: "chat" },
  { id: "review-guardian", status: "training", name: "Review Guardian", business: "Torque & Co Auto Service", problem: "Replies to every review and flags the ones the owner must see.", icon: "star" },
  { id: "dead-lead-revival", status: "training", name: "Dead Lead Revival", business: "Stonebridge Bathrooms", problem: "Wins back old quotes sitting in your CRM.", icon: "revive" },
];
