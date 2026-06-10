// MANDATE v2 headless stress fleet: plays full random careers through the
// pure engine (data.js + engine.js, no DOM). node test.js
const fs=require("fs"),vm=require("vm");
const src=fs.readFileSync(__dirname+"/data.js","utf8")+"\n"+fs.readFileSync(__dirname+"/engine.js","utf8");
const ctx={console,Math,Date,JSON};ctx.globalThis=ctx;ctx.module=undefined;
vm.createContext(ctx);vm.runInContext(src,ctx);
const E=ctx.__MANDATE__;
const D=vm.runInContext("({BGS,SCENARIOS,DIFFS,BILLS,REGIONS,FISCAL_META})",ctx);
if(!E){console.error("no engine export");process.exit(1)}

const fin=(x,p)=>{if(typeof x==="number"&&!Number.isFinite(x))throw new Error("NaN at "+p)};
function check(S,w){
  fin(S.pols.approval,w+" app");fin(S.econ.g,w+" g");fin(S.econ.infl,w+" infl");fin(S.econ.debt,w+" debt");
  fin(S.pols.unity,w+" unity");fin(S.econ.trust,w+" trust");fin(S.pols.pollMe,w+" poll");fin(S.fiscalDeficit,w+" def");
  if(S.pols.approval<0||S.pols.approval>100)throw new Error("app bounds");
  if(S.party.seats<0||S.party.seats>650)throw new Error("seats "+S.party.seats);
  for(const k in S.world.regions)fin(S.world.regions[k].rel,w+" rel "+k);
  Object.values(S.svc).forEach(v=>fin(v,w+" svc"));
  S.cabinet.forEach(m=>fin(m.app,w+" minister"));
}
function R(){return Math.random()}

const endings={},counts={events:0,pmqs:0,budgets:0,elections:0,bills:0,regions:0,wars:0,conf:0,phaseSwapsToGov:0,phaseSwapsToOpp:0};
const legacies=[];let errors=0,runs=0;
const parties=["lab","con","lib","ref","grn"],bgs=Object.keys(D.BGS),scens=Object.keys(D.SCENARIOS),diffs=Object.keys(D.DIFFS);

const MATRIX=[];
for(let i=0;i<140;i++){
  let sc=scens[i%scens.length];
  let party=parties[i%parties.length];
  MATRIX.push({party,bg:bgs[i%bgs.length],scenario:sc,difficulty:diffs[i%diffs.length],seed:"fleet-"+i,name:"Bot "+i});
}

for(const cfg of MATRIX){
  try{
    const S=E.newGame(cfg);
    let guard=0,endKind=null;
    while(!S.meta.over&&guard++<200){
      const phaseBefore=S.meta.phase;
      const due=E.tick(S);
      due.forEach(q=>{
        if(q.head==="__BYELECTION_NEAR__")E.runByelection(S,true);
        if(q.head==="__BYELECTION_FAR__")E.runByelection(S,false);
        if(q.head==="__OBYELECTION_BIG__")E.runOppByelection(S,true);
        if(q.head==="__OBYELECTION_SMALL__")E.runOppByelection(S,false);
        if(q.head==="__LOCALS_OWNED__")E.runLocals(S,true);
        if(q.head==="__LOCALS_LOCAL__")E.runLocals(S,false);
        if(q.head==="__INDYREF__")E.runIndyref(S);
      });
      check(S,cfg.seed+" m"+S.meta.month);
      if(S.flags.independence){endKind="independence";break}
      if(S.meta.month>118){endKind="decade";break}
      if(S.pols.sleaze>78){endKind="sleaze";break}
      if(S.world.war&&S.world.war.collapse){S.world.war=null;S.score.warsLost++}
      // random free actions (stress the systems)
      if(S.meta.phase==="government"&&R()<0.25&&S.pols.capital>30){
        const bills=D.BILLS.filter(b=>!S.usedBills.includes(b.id));
        if(bills.length){E.enactBill(S,bills[Math.floor(R()*bills.length)].id,R()<0.3);counts.bills++}}
      if(R()<0.3&&S.pols.capital>20){
        const rids=Object.keys(D.REGIONS);
        const acts=S.meta.phase==="government"?["summit","trade","sanction","aid","covert","deploy","recall","carrier"]:["summit"];
        E.regionAction(S,rids[Math.floor(R()*rids.length)],acts[Math.floor(R()*acts.length)]);counts.regions++}
      if(S.meta.phase==="government"&&!S.world.war&&R()<0.04&&S.pols.capital>40){
        const rids=Object.keys(D.REGIONS).filter(k=>k!=="uk"&&k!=="southatl");
        const r=E.regionAction(S,rids[Math.floor(R()*rids.length)],"invade");
        if(r&&r.hague){endKind="hague";break}
        counts.invasions=(counts.invasions||0)+1}
      if(S.meta.phase==="government"&&R()<0.05&&(S.bench||[]).length&&S.pols.capital>20){
        E.swapMinister(S,Math.floor(R()*S.cabinet.length),Math.floor(R()*S.bench.length));counts.swaps=(counts.swaps||0)+1}
      if(S.meta.phase==="government"&&R()<0.07&&S.pols.capital>10){
        const f=Object.assign({},S.fiscal);f.basic=Math.round(D.FISCAL_META.basic.min+R()*(D.FISCAL_META.basic.max-D.FISCAL_META.basic.min));
        f.nhs=+(D.FISCAL_META.nhs.min+R()*(D.FISCAL_META.nhs.max-D.FISCAL_META.nhs.min)).toFixed(1);
        E.enactFiscal(S,f,false)}
      check(S,cfg.seed+" postact m"+S.meta.month);
      const it=E.nextInteraction(S);
      if(it.type==="end"){endKind="resign";break}
      if(it.type==="confvote"){counts.conf++;if(!E.runConfVote(S)){endKind="ousted";break}continue}
      if(it.type==="budget"){counts.budgets++;
        const f=Object.assign({},S.fiscal);
        f.vat=Math.round(D.FISCAL_META.vat.min+R()*(D.FISCAL_META.vat.max-D.FISCAL_META.vat.min));
        f.welf=+(D.FISCAL_META.welf.min+R()*(D.FISCAL_META.welf.max-D.FISCAL_META.welf.min)).toFixed(1);
        const r=E.enactFiscal(S,f,true);
        if(!r.ok)S.flags["bud"+S.year]=true; // degenerate: identical sliders — skip year
        continue}
      if(it.type==="pmqs"){counts.pmqs++;S.flags["pmq"+S.meta.month]=true;
        const t=E.pmqsTopics(S);const styles=S.meta.phase==="government"?["own","pivot","joke","pledge"]:["forensic","theatrical","statesman"];
        E.pmqsResolve(S,t[Math.floor(R()*t.length)].k,styles[Math.floor(R()*styles.length)]);continue}
      if(it.type==="election"){counts.elections++;delete S.flags._electionNow;
        const res=E.computeElection(S,R()*6-2);
        const mine=res.rows[0].seats,maj=mine*2-650;
        if(maj>0){E.settleElectionWin(S,mine);if(S.meta.phase==="government"&&phaseBefore==="opposition")counts.phaseSwapsToGov++}
        else if(mine>=Math.max(...res.rows.slice(1,-2).map(r=>r.seats))&&R()<0.5){E.settleElectionWin(S,322);S.flags.minority=true}
        else{const out=E.settleElectionLoss(S);
          if(out==="deposed"){endKind="deposed";break}
          counts.phaseSwapsToOpp+= S.meta.phase==="opposition"&&phaseBefore==="government"?1:0;}
        continue}
      // event
      counts.events++;const card=it.card;
      if(!card||!card.opts||!card.opts.length)throw new Error("bad card "+(card&&card.id));
      if(S.world.war)counts.wars++;
      E.resolveOption(S,card,Math.floor(R()*card.opts.length));
      check(S,cfg.seed+" after "+card.id);
      if(S.flags._resign){endKind="resign";break}
      if(S.meta.over){endKind="ousted";break}
    }
    if(guard>=200)throw new Error("no termination (phase "+S.meta.phase+", m"+S.meta.month+")");
    endKind=endKind||"decade";
    endings[endKind]=(endings[endKind]||0)+1;
    const sc=E.legacy(S);fin(sc,"legacy");if(sc<0||sc>100)throw new Error("legacy "+sc);
    legacies.push(sc);runs++;
  }catch(e){errors++;console.error("RUN "+cfg.seed+" ("+cfg.party+"/"+cfg.scenario+"/"+cfg.difficulty+") FAILED:",e.message);
    if(errors>5)break}
}
legacies.sort((a,b)=>a-b);
console.log("\n=== MANDATE v2 fleet ===");
console.log("runs ok:",runs,"/",MATRIX.length,"errors:",errors);
console.log("endings:",JSON.stringify(endings));
console.log("counts:",JSON.stringify(counts));
if(legacies.length)console.log("legacy: min",legacies[0],"p25",legacies[Math.floor(legacies.length*.25)],"med",legacies[Math.floor(legacies.length*.5)],"p75",legacies[Math.floor(legacies.length*.75)],"max",legacies[legacies.length-1]);
process.exit(errors?1:0);
