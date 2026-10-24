/* Regenerates js/agents-highlight.json for the homepage agents section [2].
   Run after re-recording an /agents sample or changing an agent's graph:
     node scripts/gen-agents-highlight.js

   Every widget value comes from a real recorded run in js/agents/samples.js
   (house rule: no invented numbers):
     - AI Front Desk: the first sample conversation's opening exchange
     - Speed-to-Lead: the burst pipe run, with its steps worked out by the
       /agents canvas engine's own plan(), so the strip matches the canvas
     - Dead Lead Revival: days since quote and group for each lead in the
       first list
   The homepage fetches the JSON only when the section nears the viewport,
   so it never loads the much bigger /agents scripts.

   It also checks that the card copy in js/data.js (agentsHighlight.cards)
   still matches each agent's name and problem line in the registry, and
   fails if they've drifted apart. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const PORTFOLIO = require("../js/data.js");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "js", "agents-highlight.json");

// The /agents scripts are plain browser scripts; run them in one context
// so their top-level consts see each other, like on the page.
const ctx = vm.createContext({});
for (const file of ["js/agents/registry.js", "js/agents/samples.js", "js/agents/canvas.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), ctx, { filename: file });
}
const { AGENTS, AGENT_SAMPLES, AgentCanvas } = vm.runInContext("({ AGENTS, AGENT_SAMPLES, AgentCanvas })", ctx);
const agentById = (id) => AGENTS.find((a) => a.id === id);
const sampleById = (agent, id) => {
  const s = (AGENT_SAMPLES[agent] || []).find((x) => x.id === id);
  if (!s) throw new Error(`No sample "${id}" for ${agent}`);
  return s;
};

// Shortens text for a small chat bubble: whole sentences when they fit,
// else whole words with an ellipsis.
function clip(text, max) {
  const t = String(text).trim();
  if (t.length <= max) return t;
  const sentences = t.match(/[^.!?]+[.!?]+/g) || [];
  let out = "";
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  if (out.trim()) return out.trim();
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

// Card copy check: data.js repeats each agent's name and problem line.
const problems = [];
for (const card of (PORTFOLIO.agentsHighlight || {}).cards || []) {
  const agent = agentById(card.agent);
  if (!agent) problems.push(`data.js card "${card.agent}" is not an agent id`);
  else {
    if (card.title !== agent.name) problems.push(`${card.agent}: title "${card.title}" vs registry name "${agent.name}"`);
    if (card.body !== agent.problem) problems.push(`${card.agent}: body "${card.body}" vs registry problem "${agent.problem}"`);
  }
}
if (problems.length) {
  console.error("Card copy in js/data.js no longer matches js/agents/registry.js:\n  " + problems.join("\n  "));
  process.exit(1);
}

// AI Front Desk: the opening exchange of the first sample conversation.
const desk = AGENT_SAMPLES["front-desk"][0];
const frontDesk = {
  sample: desk.label,
  business: agentById("front-desk").business,
  messages: [
    { from: "patient", text: clip(desk.turns[0].user, 70) },
    { from: "agent", text: clip(desk.turns[0].recorded.result.reply, 90) },
  ],
};

// Speed-to-Lead: the burst pipe run, steps from the engine's plan().
const lead = sampleById("speed-to-lead", "burst-pipe");
const leadAgent = agentById("speed-to-lead");
const leadResult = lead.recorded.result;
const { steps } = AgentCanvas.plan(leadAgent, { result: leadResult, received: lead.recorded.received, triggerCaption: lead.channel });
const emergencyEdge = leadAgent.edges.find((e) => e.from === "emergency" && e.when === "yes");
const speedToLead = {
  sample: lead.label,
  score: leadResult.score,
  emergency: leadResult.emergency,
  steps: steps.map((s) => {
    const step = { label: leadAgent.nodes.find((n) => n.id === s.id).label };
    if (s.edgesIn.includes(emergencyEdge.id)) step.emergency = true;
    return step;
  }),
};

// Dead Lead Revival: one bar per lead in the first list, in list order.
const list = AGENT_SAMPLES["dead-lead-revival"][0];
const deadLead = {
  sample: list.label,
  leads: list.recorded.result.leads.map((l) => ({ days: l.daysSinceQuote, group: l.group })),
};

const data = {
  _generated: "By scripts/gen-agents-highlight.js from js/agents/registry.js and samples.js. Don't edit by hand.",
  "front-desk": frontDesk,
  "speed-to-lead": speedToLead,
  "dead-lead-revival": deadLead,
};
fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
console.log(`Wrote ${path.relative(ROOT, OUT)} (${fs.statSync(OUT).size} bytes)`);
