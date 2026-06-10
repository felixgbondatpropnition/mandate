// Headless stress test for MANDATE: runs full random premierships through the
// pure engine (no DOM) and asserts state stays sane. node test.js
const fs = require("fs"), vm = require("vm");
const html = fs.readFileSync(__dirname + "/index.html", "utf8");
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx = { console, Math, Date, JSON };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(src, ctx);
const M = ctx.__MANDATE__;
if (!M) { console.error("no __MANDATE__ export"); process.exit(1); }

const fin = (x, path) => {
  if (typeof x === "number" && !Number.isFinite(x)) throw new Error("NaN/Inf at " + path);
};
function checkState(S, where) {
  fin(S.pols.approval, where + ".approval"); fin(S.econ.g, where + ".g");
  fin(S.econ.infl, where + ".infl"); fin(S.econ.debt, where + ".debt");
  fin(S.pols.unity, where + ".unity"); fin(S.econ.trust, where + ".trust");
  if (S.pols.approval < 0 || S.pols.approval > 100) throw new Error("approval bounds " + S.pols.approval);
  if (S.econ.infl > 25 || S.econ.infl < -2) throw new Error("infl bounds " + S.econ.infl);
  if (S.party.seats < 0 || S.party.seats > 650) throw new Error("seats bounds " + S.party.seats);
}

const endings = {}, achieved = { elections: 0, wars: 0, confVotes: 0, budgets: 0, events: 0 };
let totalMonths = 0;
const parties = Object.keys(M.PARTIES), bgs = Object.keys(M.BGS);
let runs = 0, errors = 0;

for (let r = 0; r < 120; r++) {
  const party = parties[r % parties.length], bg = bgs[r % bgs.length];
  const S = M.newGame(party, bg, "Test PM " + r, "seed-" + r);
  try {
    let guard = 0;
    while (!S.meta.over && guard++ < 200) {
      const due = M.tickMonth(S);
      due.forEach(q => {
        if (q.head === "__BYELECTION__") M.runByelection(S, true);
        if (q.head === "__BYELECTION_FAR__") M.runByelection(S, false);
        if (q.head === "__INDYREF__") M.runIndyref(S);
      });
      checkState(S, "r" + r + " m" + S.meta.month);
      if (S.meta.month > 118) { endings.decade = (endings.decade || 0) + 1; break; }
      if (S.pols.sleaze > 78) { endings.sleaze = (endings.sleaze || 0) + 1; break; }
      if (S.world.war && S.world.war.collapse) { S.world.war = null; S.score.warsLost++; }
      const it = M.nextInteraction(S);
      if (it.type === "end") { endings.resign = (endings.resign || 0) + 1; break; }
      if (it.type === "confvote") {
        achieved.confVotes++;
        if (!M.runConfVote(S)) { endings.ousted = (endings.ousted || 0) + 1; break; }
        continue;
      }
      if (it.type === "budget") {
        achieved.budgets++;
        S.flags["bud" + S.meta.month] = true;
        M.applyBudget(S, { tax: 36 + Math.random() * 8, nhs: 7 + Math.random() * 3, edu: 4 + Math.random() * 2, def: 4 + Math.random() * 2.5, wel: 6 + Math.random() * 3, inf: 4 + Math.random() * 3, oth: 11.5 });
        continue;
      }
      if (it.type === "election") {
        achieved.elections++;
        delete S.flags._electionNow;
        const rows = M.computeElection(S, Math.random() * 4 - 1);
        const mine = rows[0].seats, newMaj = mine * 2 - 650;
        if (newMaj > 0) { S.party.seats = mine; S.score.electionsWon++; S.meta.termStart = S.meta.month; }
        else { endings.lost = (endings.lost || 0) + 1; break; }
        continue;
      }
      // event card
      achieved.events++;
      const card = it.card;
      if (!card || !card.opts || !card.opts.length) throw new Error("bad card " + (card && card.id));
      const idx = Math.floor(Math.random() * card.opts.length);
      if (S.world.war) achieved.wars++;
      M.resolveOption(S, card, idx);
      checkState(S, "r" + r + " after " + card.id + "/" + idx);
      if (S.flags._resign) { endings.resign = (endings.resign || 0) + 1; break; }
      if (S.meta.over) { endings.ousted = (endings.ousted || 0) + 1; break; }
    }
    if (guard >= 200) throw new Error("no termination in 200 months");
    const score = M.legacy(S);
    fin(score, "legacy");
    if (score < 0 || score > 100) throw new Error("legacy bounds " + score);
    totalMonths += S.score.months;
    runs++;
  } catch (e) {
    errors++;
    console.error("RUN " + r + " (" + party + "/" + bg + ") FAILED:", e.message);
    if (errors > 4) break;
  }
}
console.log("\n=== MANDATE headless test ===");
console.log("runs ok:", runs, "/ 120, errors:", errors);
console.log("avg premiership (months):", (totalMonths / Math.max(runs, 1)).toFixed(1));
console.log("endings:", JSON.stringify(endings));
console.log("interactions:", JSON.stringify(achieved));
process.exit(errors ? 1 : 0);
