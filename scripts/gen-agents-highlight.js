/* Regenerates js/agents-highlight.json for the homepage agents section [2].
   Run after re-recording the Ops Team's day or changing the team:
     node scripts/gen-agents-highlight.js

   Every value comes from the real recording in js/agents/ops-day.js (house
   rule: no invented numbers). The homepage fetches the JSON only when the
   section nears the viewport, so it never loads the much bigger /agents
   scripts.

   It also checks that the copy in js/data.js (agentsHighlight.ops) still
   matches the agent's name and problem line in the registry, and fails if
   they've drifted apart. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const PORTFOLIO = require("../js/data.js");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "js", "agents-highlight.json");

// The /agents scripts are plain browser scripts; run them in one context
// so their top-level consts see each other, like on the page.
const ctx = vm.createContext({});
for (const file of ["js/agents/registry.js", "js/agents/harbourline.js", "js/agents/ops-registry.js", "js/agents/samples.js", "js/agents/ops-day.js", "js/agents/canvas.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), ctx, { filename: file });
}
const { AGENTS, OPS_DAY, OPS_TEAM } = vm.runInContext("({ AGENTS, OPS_DAY, OPS_TEAM })", ctx);
const agentById = (id) => AGENTS.find((a) => a.id === id);
// Copy check: data.js repeats the agent's name and problem line.
const problems = [];
for (const card of [PORTFOLIO.agentsHighlight.ops]) {
  const agent = agentById(card.agent);
  if (!agent) problems.push(`data.js card "${card.agent}" is not an agent id`);
  else {
    if (card.title !== agent.name) problems.push(`${card.agent}: title "${card.title}" vs registry name "${agent.name}"`);
    if (card.body !== agent.problem) problems.push(`${card.agent}: body "${card.body}" vs registry problem "${agent.problem}"`);
  }
}
if (problems.length) {
  console.error("Copy in js/data.js no longer matches js/agents/registry.js:\n  " + problems.join("\n  "));
  process.exit(1);
}

// Ops Team: the recorded day as events by agent, straight from js/agents/ops-day.js.
const dayEvents = OPS_DAY.brief ? [...OPS_DAY.events, { timeLabel: "5:05pm", steps: [OPS_DAY.brief] }] : OPS_DAY.events;
const opsTeam = {
  lanes: OPS_TEAM.map((id) => {
    const a = agentById(id);
    return a.short || (id === "speed-to-lead" ? "New Lead Reply" : a.name);
  }),
  events: dayEvents.map((e) => ({ time: e.timeLabel.replace(":00", ""), lanes: e.steps.map((s) => OPS_TEAM.indexOf(s.agent)) })),
  stats: { events: OPS_DAY.events.length, agents: OPS_TEAM.length, runs: dayEvents.reduce((n, e) => n + e.steps.length, 0) },
};

const data = {
  _generated: "By scripts/gen-agents-highlight.js from js/agents/registry.js and ops-day.js. Don't edit by hand.",
  "ops-team": opsTeam,
};
fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
console.log(`Wrote ${path.relative(ROOT, OUT)} (${fs.statSync(OUT).size} bytes)`);
