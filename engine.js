/* =====================================================================
   MANDATE 2.0 — ENGINE (pure, headless-safe; DOM lives in ui.js)
   ===================================================================== */
"use strict";

/* ---------- seeded RNG carried inside state (serialisable) ---------- */
function _mul32(a){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function attachRng(S){S.rng=function(){S.meta.rngState=(S.meta.rngState+0x9E3779B9)|0;return _mul32(S.meta.rngState)};return S}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const sig=x=>1/(1+Math.exp(-x));
function pickR(S,arr){return arr[Math.floor(S.rng()*arr.length)]}
function riR(S,a,b){return a+Math.floor(S.rng()*(b-a+1))}

/* ---------- fiscal model ---------- */
function lafferTop(t){return 1-Math.max(0,t-47)*0.06}
function lafferCorp(c){return 1-Math.max(0,c-27)*0.05}
function revenueOf(f){
  return 11.4+f.basic*0.42+(f.top-40)*0.05*lafferTop(f.top)+f.corp*0.13*lafferCorp(f.corp)
    +f.vat*0.46+f.ni*0.42+f.fuel*0.016+f.windfall*0.35;
}
function spendOf(f){return f.nhs+f.edu+f.def+f.welf+f.infra+f.police+f.local+f.green+6.3+(f.triple?0.25:0)}
function taxDrag(f){return (f.corp-25)*0.02+(f.top-45)*0.008+(f.basic-20)*0.015+(f.ni-12)*0.012}

/* ---------- state factory ---------- */
function newGame(cfg){
  const P=PARTIES[cfg.party], DF=DIFFS[cfg.difficulty||"standard"];
  let SC;
  if(cfg.scenario==="gen"&&cfg.gen){
    const g=cfg.gen;
    SC={name:g.name,phase:"auto",setup:S2=>{
      GEN_POL[g.p][2](S2);GEN_ECON[g.e][1](S2);GEN_WORLD[g.w][1](S2);GEN_PRESS[g.pr][1](S2);GEN_WILD[g.wi][1](S2);}};
  } else SC=SCENARIOS[cfg.scenario||"real"]||SCENARIOS.real;
  const PHASE=(SC.phase==="auto"||!SC.phase)?(cfg.party==="lab"?"government":"opposition"):SC.phase;
  const seed=hashStr(cfg.seed||String((Date.now()%1e9)+Math.floor(Math.random()*1e6)));
  const S={
    meta:{pm:cfg.name||"The Leader",party:cfg.party,bg:cfg.bg,scenario:cfg.scenario,difficulty:cfg.difficulty||"standard",
      month:0,termStart:(cfg.party==="lab"?-(58-MONTHS_TO_GE):0),over:false,phase:PHASE,startYear:2026,startMon:6,seed:cfg.seed||String(seed),rngState:seed,oppMonths:0,govMonths:0,becamePM:PHASE==="government"},
    pols:{approval:P.app+DF.base,unity:P.unity,capital:50,sleaze:10,pollMe:0,oppName:null,oppStr:50},
    econ:{g:1.4,infl:3.1,unemp:4.3,debt:98,rates:4.25,trust:P.trust,energy:0,invest:0,gdpIdx:100,spendBump:0,revBump:0},
    fiscal:Object.assign({},FISCAL_DEFAULT),
    svc:{nhsWait:6.2,mig:560,crime:100,housing:180,schools:100,energy:55},
    media:{outlets:OUTLETS.map(o=>({id:o.id,n:o.n,kind:o.kind,lean:o.lean,reach:o.reach,stance:o.lean*4}))},
    world:{standing:55,scot:42,war:null,regions:{}},
    mil:{brig:4,car:1,sq:3,cap:0,dep:{}},
    party:{seats:(typeof REAL_HOUSE!=="undefined"&&REAL_HOUSE.seats[cfg.party]!==undefined)?REAL_HOUSE.seats[cfg.party]:(PHASE==="government"?P.govSeats:P.oppSeats),
      factions:P.factions.map(f=>({name:f[0],w:f[1],ideal:f[2],leader:f[3],happy:60}))},
    cabinet:[],opp:null,
    flags:{},promises:[],queue:[],cooldowns:{},usedBills:[],pendingBill:null,
    hist:{app:[],gdp:[],pollMe:[],pollGov:[]},log:[],ticker:[],
    score:{months:0,electionsWon:0,warsWon:0,warsLost:0,scandals:0,crisesResolved:0,kept:0,broken:0,peakApp:P.app,billsPassed:0},
    paper:{mh:"THE WESTMINSTER TIMES",head:"A NEW LEADER TAKES THE STAGE",sub:"The country waits. The markets price. Somewhere a junior researcher is already plotting.",lean:"centre"},
  };
  for(const[k,v]of Object.entries(REGIONS))S.world.regions[k]={rel:v.rel,trade:v.trade};
  attachRng(S);
  const roles=["Chancellor","Foreign Sec.","Home Sec.","Health Sec.","Defence Sec.","Education Sec.","Energy Sec.","Chief Whip"];
  const pool=(typeof REAL_POLS!=="undefined"&&REAL_POLS[cfg.party])?REAL_POLS[cfg.party].slice():[];
  S.cabinet=roles.map(r=>{let i=pool.findIndex(p=>p[5]===r);if(i<0)i=0;
    const p=pool.length?pool.splice(i,1)[0]:[pickR(S,D_FN)+" "+pickR(S,D_LN),35,riR(S,40,80),riR(S,40,80),riR(S,30,60),r];
    return{role:r,name:p[0],app:p[1],base:p[1],comp:p[2],loyal:p[3],cha:p[4]}});
  S.bench=pool.map(p=>({name:p[0],app:p[1],base:p[1],comp:p[2],loyal:p[3],cha:p[4],fav:p[5]}));
  S.pols.oppName=(typeof REAL_LEADERS!=="undefined"&&REAL_LEADERS[PARTIES[cfg.party].rival])||pickR(S,D_FN)+" "+pickR(S,D_LN);
  if(PHASE==="opposition"){
    S.opp={gov:{party:REAL_GOV.party,pm:REAL_GOV.pm,approval:REAL_GOV.approval,poll:0,fatigue:REAL_GOV.fatigue,lastBlunder:null,monthsIn:REAL_GOV.monthsIn},
      electionDue:MONTHS_TO_GE,warchest:4};
    S.pols.pollMe=REAL_POLLS_NOW[cfg.party]||10;S.opp.gov.poll=REAL_POLLS_NOW.lab;
  } else {
    S.pols.pollMe=REAL_POLLS_NOW[cfg.party]||30;
  }
  BGS[cfg.bg].fx(S);
  SC.setup(S);
  recomputeUnity(S);
  Object.defineProperty(S,"majority",{get(){return this.party.seats*2-650},configurable:true});
  Object.defineProperty(S,"moy",{get(){return (this.meta.startMon+this.meta.month)%12},configurable:true});
  Object.defineProperty(S,"year",{get(){return this.meta.startYear+Math.floor((this.meta.startMon+this.meta.month)/12)},configurable:true});
  Object.defineProperty(S,"mediaIndex",{get(){const o=this.media.outlets;return o.reduce((a,x)=>a+x.stance*x.reach,0)/o.reduce((a,x)=>a+x.reach,0)},configurable:true});
  Object.defineProperty(S,"fiscalDeficit",{get(){return spendOf(this.fiscal)+this.econ.spendBump-revenueOf(this.fiscal)-this.econ.revBump},configurable:true});
  initStances(S);
  initPolls(S);
  makeInitialHouse(S);
  S.hist.app.push(S.pols.approval);S.hist.gdp.push(100);S.hist.pollMe.push(S.pols.pollMe);S.hist.pollGov.push(S.opp?S.opp.gov.poll:40);
  return S;
}
function rehydrate(S){ // after JSON load
  attachRng(S);
  if(!S.stance)try{initStances(S)}catch(_e){}
  if(!S.polls){S.hist=S.hist||{};initPolls(S)}
  if(!S.partyRel)S.partyRel={};
  if(!S.pollDrift){S.pollBase={...REAL_POLLS_NOW};S.pollDrift={};S.pollVol={};for(const k of POLL_PARTIES){S.pollDrift[k]=(S.rng()*2-1)*0.22;S.pollVol[k]=0.3+S.rng()*0.5;}}
  Object.defineProperty(S,"majority",{get(){return this.party.seats*2-650},configurable:true});
  Object.defineProperty(S,"moy",{get(){return (this.meta.startMon+this.meta.month)%12},configurable:true});
  Object.defineProperty(S,"year",{get(){return this.meta.startYear+Math.floor((this.meta.startMon+this.meta.month)/12)},configurable:true});
  Object.defineProperty(S,"mediaIndex",{get(){const o=this.media.outlets;return o.reduce((a,x)=>a+x.stance*x.reach,0)/o.reduce((a,x)=>a+x.reach,0)},configurable:true});
  Object.defineProperty(S,"fiscalDeficit",{get(){return spendOf(this.fiscal)+this.econ.spendBump-revenueOf(this.fiscal)-this.econ.revBump},configurable:true});
  return S;
}
function basePoll(S){return (typeof REAL_POLLS_NOW!=="undefined"&&REAL_POLLS_NOW[S.meta.party])||15}
function dateStr(S){return ["January","February","March","April","May","June","July","August","September","October","November","December"][S.moy]+" "+S.year}



/* ---------- manifesto stances & public opinion ---------- */
const ISSUE_AXIS={mig:["s",1],crime:["s",1],culture:["s",1],eu:["s",1],defence:["s",1],nhs:["e",1],housing:["e",-1],climate:["e",1],econ:["e",1]};
function initStances(S){
  S.pubop={};S.stance={};
  for(const k in ISSUES){S.pubop[k]=ISSUES[k].pub;
    const[ax,sign]=ISSUE_AXIS[k];
    S.stance[k]=clamp(Math.round(PARTIES[S.meta.party].ideal[ax==="s"?"s":"e"]*sign*10)/10,-2,2);}
}
function setStance(S,k,v){
  const old=S.stance[k];S.stance[k]=clamp(v,-2,2);
  const[ax]=ISSUE_AXIS[k];const d=S.stance[k]-old;
  applyIdeo(S,ax==="s"?{e:0,s:d*0.35}:{e:d*0.35,s:0});
}
function stanceBonus(S){
  if(!S.stance)return 0;
  let b=0;for(const k in ISSUES)b+=(1-Math.min(2,Math.abs(S.stance[k]-S.pubop[k]))/2);
  return (b/Object.keys(ISSUES).length-0.62)*2.4; // roughly ±0.9pp on polls
}
function tickOpinion(S){
  if(!S.pubop)return;
  for(const k in S.pubop)S.pubop[k]=clamp(S.pubop[k]+(S.rng()-.5)*0.05,-1.6,1.6);
  if(S.svc.mig>650)S.pubop.mig=clamp(S.pubop.mig+0.02,-1.6,1.6);
  if(S.econ.infl>6)S.pubop.climate=clamp(S.pubop.climate-0.02,-1.6,1.6);
  if(S.world.war)S.pubop.defence=clamp(S.pubop.defence+0.02,-1.6,1.6);
}

/* ---------- national polls: one machine feeds HUD, charts and elections ---------- */
const POLL_PARTIES=["lab","con","lib","ref","grn","res","snp"];
function initPolls(S){
  const mine=S.meta.party;
  const polls={...REAL_POLLS_NOW}; // the country as it actually polls today
  S.pollBase={...REAL_POLLS_NOW};
  S.pollDrift={};S.pollVol={};
  for(const k of POLL_PARTIES){S.pollDrift[k]=(S.rng()*2-1)*0.22;S.pollVol[k]=0.3+S.rng()*0.5;}
  const t=Object.values(polls).reduce((a,b)=>a+b,0);
  for(const k in polls)polls[k]=polls[k]/t*96;
  S.polls=polls;
  S.hist.polls={};
  for(const k of POLL_PARTIES)S.hist.polls[k]=[polls[k],polls[k]+(_mul32(S.meta.rngState+1)-.5),polls[k]];
  S.pols.pollMe=polls[mine];
  if(S.opp)S.opp.gov.poll=polls[S.opp.gov.party];
}
function tickPolls(S){
  const mine=S.meta.party;
  // every career writes its own rival storylines: bases drift on seeded walks
  for(const k of POLL_PARTIES){
    S.pollDrift[k]=clamp(S.pollDrift[k]+(S.rng()-.5)*0.04,-0.3,0.3);
    S.pollBase[k]=clamp(S.pollBase[k]+S.pollDrift[k]+(S.rng()-.5)*S.pollVol[k],3,34);}
  const base=S.pollBase;
  const tgt={};
  if(S.meta.phase==="government"){
    tgt[mine]=clamp(24+0.42*S.pols.approval+stanceBonus(S),16,50);
    const riv=PARTIES[mine].rival;
    tgt[riv]=clamp(27+(46-tgt[mine])*0.55+(S.pols.oppStr-50)*0.25,14,46);
    for(const k of POLL_PARTIES)if(tgt[k]===undefined&&k!=="snp")tgt[k]=base[k]||8;
  }else{
    const G=S.opp.gov;
    tgt[G.party]=clamp(24+0.30*G.approval-G.fatigue*0.5,12,48);
    tgt[mine]=clamp(basePoll(S)+(42-G.approval)*0.5+(S.pols.approval-42)*0.35+S.mediaIndex/9+stanceBonus(S),8,52);
    for(const k of POLL_PARTIES)if(tgt[k]===undefined&&k!=="snp")tgt[k]=base[k]||8;
  }
  // Restore Britain feeds on Reform's flank and migration anger
  const refNow=S.polls.ref||14;
  const shift=clamp((refNow-13)*0.25,0,5)+(S.svc.mig>600?1.2:0)+(S.flags.migSalient?0.8:0);
  tgt.res=clamp((S.pollBase&&S.pollBase.res||3)+shift,2,15);
  if(tgt.ref!==undefined)tgt.ref=clamp(tgt.ref-shift*0.7,6,50);
  tgt.snp=clamp(3+(S.world.scot-42)/25,1.5,6);
  for(const k of POLL_PARTIES)S.polls[k]=clamp(S.polls[k]+0.22*((tgt[k]??S.polls[k])-S.polls[k])+(S.rng()-.5)*0.9,1,55);
  const t=Object.values(S.polls).reduce((a,b)=>a+b,0);
  for(const k of POLL_PARTIES){S.polls[k]=S.polls[k]/t*96;S.hist.polls[k].push(S.polls[k]);if(S.hist.polls[k].length>180)S.hist.polls[k].shift();}
  S.pols.pollMe=S.polls[mine];
  if(S.opp)S.opp.gov.poll=S.polls[S.opp.gov.party];
}
function projectElection(S){
  const keep=S.meta.rngState;
  const r=computeElection(S,0,{projection:true});
  S.meta.rngState=keep;
  return r;
}

/* ---------- unity / ideology ---------- */
function recomputeUnity(S){S.pols.unity=clamp(S.party.factions.reduce((a,f)=>a+f.w*f.happy,0),0,100)}
function applyIdeo(S,ideo){if(!ideo)return;
  S.party.factions.forEach(f=>{const d=Math.abs(ideo.e-f.ideal.e)*0.7+Math.abs((ideo.s||0)-f.ideal.s)*0.5;
    f.happy=clamp(f.happy+(2-d)*2.2,0,100)});recomputeUnity(S)}

/* ---------- effects ---------- */
function applyEffects(S,eff){if(!eff)return;
  const DF=DIFFS[S.meta.difficulty];
  const sh=x=>x<0?x*DF.shock:x;
  if(eff.app)S.pols.approval=clamp(S.pols.approval+sh(eff.app),3,88);
  if(eff.poll)S.pols.pollMe=clamp(S.pols.pollMe+eff.poll,4,60);
  if(eff.unity){S.party.factions.forEach(f=>f.happy=clamp(f.happy+eff.unity,0,100));recomputeUnity(S)}
  if(eff.faction)for(const[k,v]of Object.entries(eff.faction)){const f=S.party.factions.find(x=>x.name===k);if(f){f.happy=clamp(f.happy+v,0,100);recomputeUnity(S)}}
  if(eff.media)S.media.outlets.forEach(o=>o.stance=clamp(o.stance+eff.media*(o.lean*0+1)*0.8,-50,50));
  if(eff.outlet)for(const[k,v]of Object.entries(eff.outlet)){const o=S.media.outlets.find(x=>x.id===k);if(o)o.stance=clamp(o.stance+v,-50,50)}
  if(eff.capital)S.pols.capital=clamp(S.pols.capital+eff.capital,0,100);
  if(eff.sleaze)S.pols.sleaze=clamp(S.pols.sleaze+eff.sleaze,0,100);
  if(eff.standing)S.world.standing=clamp(S.world.standing+sh(eff.standing),0,100);
  if(eff.trustM)S.econ.trust=clamp(S.econ.trust+sh(eff.trustM)*DIFFS[S.meta.difficulty].mkt,0,100);
  if(eff.oppHit)S.pols.oppStr=clamp(S.pols.oppStr+eff.oppHit,25,75);
  if(eff.scot)S.world.scot=clamp(S.world.scot+eff.scot,0,100);
  if(eff.seats){if(eff.seats<0&&S.house){const r=biggestRival(S);if(r)houseSeatTransfer(S,r.key,S.meta.party,-eff.seats)}
    else if(eff.seats>0&&S.house){const from=S.meta.phase==="opposition"?(S.opp?S.opp.gov.party:null):(biggestRival(S)||{}).key;
      if(from)houseSeatTransfer(S,S.meta.party,from,eff.seats)}
    else S.party.seats=clamp(S.party.seats+eff.seats,1,640);}
  if(eff.chest&&S.opp)S.opp.warchest=clamp(S.opp.warchest+eff.chest,0,30);
  if(eff.gov&&S.opp&&eff.gov.app)S.opp.gov.approval=clamp(S.opp.gov.approval+eff.gov.app,5,80);
  if(eff.rel)for(const[k,v]of Object.entries(eff.rel)){const r=S.world.regions[k];if(r)r.rel=clamp(r.rel+v,-100,100)}
  if(eff.econ){const e=eff.econ;
    if(e.g)S.econ.invest=clamp(S.econ.invest+e.g,-2,3);
    if(e.infl)S.econ.infl=clamp(S.econ.infl+e.infl,-1,19);
    if(e.energy)S.econ.energy=clamp(S.econ.energy+e.energy,0,6);
    if(e.spendBump)S.econ.spendBump=clamp(S.econ.spendBump+e.spendBump,-3,4);
    if(e.revBump)S.econ.revBump=clamp(S.econ.revBump+e.revBump,-2,3);}
  if(eff.svc){const v=eff.svc;
    if(v.nhs)S.svc.nhsWait=clamp(S.svc.nhsWait+v.nhs,2,12);
    if(v.mig)S.svc.mig=clamp(S.svc.mig+v.mig,80,1100);
    if(v.crime)S.svc.crime=clamp(S.svc.crime+v.crime,60,150);
    if(v.housing)S.svc.housing=clamp(S.svc.housing+v.housing,80,400);
    if(v.schools)S.svc.schools=clamp(S.svc.schools+v.schools,60,140);
    if(v.energy)S.svc.energy=clamp(S.svc.energy+v.energy,10,100);}
  if(eff.flagSet)S.flags[eff.flagSet]=true;
  if(eff.flagClear)delete S.flags[eff.flagClear];
  if(eff.flag_)S.flags[eff.flag_+S.meta.month]=true;
  if(eff.promise)S.promises.push({text:eff.promise,status:"pending"});
  if(eff.keep){const p=S.promises.find(p=>p.status==="pending"&&p.text===eff.keep);if(p){p.status="kept";S.score.kept++}}
  if(eff.breakP){const p=S.promises.find(p=>p.status==="pending"&&p.text===eff.breakP);if(p){p.status="broken";S.score.broken++}}
  if(eff.queue)eff.queue.forEach(q=>S.queue.push({m:S.meta.month+q.m,eff:q.eff,head:q.head}));
  if(eff.scandal)S.score.scandals+=eff.scandal;
  if(eff.crisisWin)S.score.crisesResolved+=eff.crisisWin;
  if(eff.war){S.world.war=eff.war;
    S.world.war.ww=S.world.war.ww||(typeof MAJORS!=="undefined"&&MAJORS.includes(S.world.war.theatre));
    if(S.world.war.ww&&!(S.world.doom>0))S.world.doom=20;}
  if(eff.warEnd)S.world.war=null;
  if(eff.ideo)applyIdeo(S,eff.ideo);
}
function log(S,t){S.log.unshift({m:dateStr(S),t});S.log=S.log.slice(0,50)}
function tick_news(S,t){S.ticker.unshift(t);S.ticker=S.ticker.slice(0,12)}

/* ---------- newspaper ---------- */
function frontPage(S,head,sub){
  const o=pickR(S,S.media.outlets.filter(x=>x.kind!=="broadcaster"));
  S.paper={mh:o.n.toUpperCase(),lean:o.lean>0?"right":o.lean<0?"left":"centre",head:head.toUpperCase(),sub,
    mkts:`FTSE ${(7900*(S.econ.gdpIdx/100)*(0.9+S.econ.trust/500)).toFixed(0)} · £ $${(1.18+S.econ.trust/500-S.econ.infl/100).toFixed(2)} · GILTS ${(S.econ.rates+(60-S.econ.trust)/25).toFixed(1)}% · CPI ${S.econ.infl.toFixed(1)}%`};
}

/* ---------- monthly tick ---------- */
function tick(S){
  S.meta.month++;S.score.months++;
  if(S.meta.phase==="government")S.meta.govMonths++;else S.meta.oppMonths++;
  const E=S.econ,F=S.fiscal,DF=DIFFS[S.meta.difficulty];
  // ----- macro -----
  const defc=S.fiscalDeficit;
  const target=1.55+0.5*E.invest-0.9*E.energy-0.45*(E.rates-3.25)-taxDrag(F)
    +(F.infra-2.5)*0.12+(S.flags.tradeBoost?0.3:0)+(S.flags.tradeDrag?-0.4:0)+(F.immig-50)*0.004;
  E.g+=0.18*(target-E.g)+(S.rng()-.5)*0.22*DF.shock;E.g=clamp(E.g,-5,6);
  const piStar=2+Math.max(0,defc-3.5)*0.32+E.energy*1.6-(E.rates-3.25)*0.32+(F.minwage-62)*0.02;
  E.infl+=0.1*(piStar-E.infl)+(S.rng()-.5)*0.18*DF.shock;E.infl=clamp(E.infl,-0.5,19);
  if(S.flags.leanedOnBank&&E.infl>3){E.infl+=0.05}
  const hawk=S.flags.govHawk?0.4:0, dove=S.flags.govDove?0.4:0;
  if(E.infl>3.4-hawk&&S.meta.month%2===0)E.rates=clamp(E.rates+0.25,0.5,8);
  else if(E.infl<2+dove&&E.g<1.2+dove&&S.meta.month%2===0)E.rates=clamp(E.rates-0.25,0.5,8);
  E.unemp+=(-0.22*(E.g-1.1))/12+(F.minwage>68?0.02:0)+(S.rng()-.5)*0.05;E.unemp=clamp(E.unemp,2.8,13);
  E.debt+=(defc-E.g*E.debt/100)/12;E.debt=clamp(E.debt,55,180);
  E.trust+=0.12*((60-(E.debt-95)*0.5-Math.max(0,defc-4)*4)-E.trust);E.trust=clamp(E.trust,0,100);
  E.energy=Math.max(0,E.energy*0.94-0.01);
  E.spendBump*=0.93;E.revBump*=0.93;
  E.gdpIdx*=(1+E.g/1200);
  // ----- services -----
  S.svc.nhsWait=clamp(S.svc.nhsWait+(8.0-F.nhs)*0.05+(S.rng()-.5)*0.06,2,12);
  S.svc.crime=clamp(S.svc.crime+(2.1-F.police)*0.5+(E.unemp-4.3)*0.06+(S.rng()-.5)*0.5,60,150);
  S.svc.mig+= (150+F.immig*7-S.svc.mig)*0.05;
  S.svc.housing=clamp(S.svc.housing+(F.infra-2.5)*1.2+(S.rng()-.5)*2,80,400);
  S.svc.schools=clamp(S.svc.schools+(F.edu-4.6)*0.5+(S.rng()-.5)*0.4,60,140);
  S.svc.energy=clamp(S.svc.energy+(F.green-1)*0.5-E.energy*1.5+(S.rng()-.5),10,100);
  // ----- politics -----
  if(S.meta.phase==="government"){
    const honey=12*Math.exp(-Math.max(0,S.meta.month-S.meta.termStart)/7);
    let warMood=S.world.war?(S.world.war.mood||0):0;
    const expect=S.flags.expectations?-3:0;
    const tgt=38.5+DF.base-1.3*(E.unemp-4.2)-1.8*Math.max(0,E.infl-2)+2.1*E.g
      +S.mediaIndex/8+(S.world.standing-50)/22+honey+warMood+expect
      -(S.pols.sleaze>55?(S.pols.sleaze-55)/6:0)
      -0.55*Math.max(0,S.svc.nhsWait-5.5)-(S.svc.crime-100)/25
      -(S.flags.migSalient?Math.max(0,(S.svc.mig-450))/120:Math.max(0,(S.svc.mig-600))/200);
    S.pols.approval=clamp(S.pols.approval+0.27*(tgt-S.pols.approval)+(S.rng()-.5)*2.8*DF.shock,3,88);
    S.pols.oppStr=clamp(S.pols.oppStr+(S.rng()-.5)*3,25,75);
  } else {
    // AI government simulates
    const G=S.opp.gov;G.monthsIn++;G.fatigue+=0.06;
    const gtgt=40-1.3*(E.unemp-4.2)-1.8*Math.max(0,E.infl-2)+2.1*E.g-G.fatigue
      -0.5*Math.max(0,S.svc.nhsWait-5.5);
    G.approval=clamp(G.approval+0.25*(gtgt-G.approval)+(S.rng()-.5)*2.6,5,80);
    // gov news
    if(S.rng()<0.5){const n=pickR(S,GOV_NEWS);G.approval=clamp(G.approval+n[1]*0.8,5,80);
      if(n[1]<0){G.lastBlunder=n[0];tick_news(S,"GOV: "+n[0])}else tick_news(S,"GOV: "+n[0]);}
    // AI annual budget: crude self-correction
    if(S.moy===2){if(S.fiscalDeficit>4.5){S.fiscal.nhs=clamp(S.fiscal.nhs-0.1,6.5,11);S.fiscal.welf=clamp(S.fiscal.welf-0.15,9,14)}
      else if(E.g<0.8){S.fiscal.infra=clamp(S.fiscal.infra+0.2,1.5,5)}}
    // my favourability + polls
    const myTgt=42+(S.pols.unity-55)/8+S.mediaIndex/9+(S.flags.platformSet?2:0);
    S.pols.approval=clamp(S.pols.approval+0.2*(myTgt-S.pols.approval)+(S.rng()-.5)*2.4,3,88);
    S.opp.electionDue--;
  }
  tickOpinion(S);tickPolls(S);
  S.score.peakApp=Math.max(S.score.peakApp,S.pols.approval);
  // ministers' public approval drifts; stars breed leadership chatter
  S.cabinet.forEach(m=>{m.app=clamp(m.app+0.1*((m.base??m.app)-m.app)+(S.rng()-.5)*2,5,80)});
  (S.bench||[]).forEach(m=>{m.app=clamp(m.app+0.08*((m.base??m.app)-m.app)+(S.rng()-.5)*1.6,5,80)});
  const star=S.cabinet.reduce((a,b)=>a.app>b.app?a:b,S.cabinet[0]);
  if(star&&star.app>S.pols.approval+16&&S.meta.month%3===0){
    tick_news(S,"Leadership chatter around "+star.name);
    S.party.factions.forEach(f=>f.happy=clamp(f.happy-0.7,0,100));recomputeUnity(S)}
  // occupations cost money every month they persist
  const occN=Object.values(S.world.regions).filter(r=>r.occupied).length;
  if(occN)S.econ.spendBump=clamp(S.econ.spendBump+0.045*occN,-3,4);
  S.pols.capital=clamp(S.pols.capital+4,0,100);
  S.pols.sleaze=clamp(S.pols.sleaze-0.6,0,100);
  const uTgt=46+(S.pols.approval-45)*0.55;
  S.party.factions.forEach(f=>f.happy=clamp(f.happy+0.04*(uTgt-f.happy)+(S.rng()-.5)*1.4,0,100));recomputeUnity(S);
  S.media.outlets.forEach(o=>{o.stance+=0.06*((o.lean*(S.meta.phase==="government"?(PARTIES[S.meta.party].ideal.e):(PARTIES[S.meta.party].ideal.e))*8)-o.stance)+(S.rng()-.5)*1.2;o.stance=clamp(o.stance,-50,50)});
  // war attrition
  if(S.world.war&&S.world.war.ww){S.world.doom=clamp((S.world.doom||0)+2.4+(S.world.war.intensity||1),0,100);}
  if(S.world.war&&S.world.war.phase==="fighting"){const w=S.world.war;
    w.months++;w.cas+=riR(S,15,70)*w.intensity;w.support-=2.6+w.cas/900;w.mood=clamp((w.support-45)/6,-6,4);
    if(w.support<22)w.collapse=true;}
  // delayed effects
  const due=S.queue.filter(q=>q.m<=S.meta.month);S.queue=S.queue.filter(q=>q.m>S.meta.month);
  due.forEach(q=>{applyEffects(S,q.eff);if(q.head&&!q.head.startsWith("__")){log(S,q.head);tick_news(S,q.head)}});
  maybeShock(S);
  // history
  S.hist.app.push(S.pols.approval);S.hist.gdp.push(E.gdpIdx);
  S.hist.infl=S.hist.infl||[];S.hist.rates=S.hist.rates||[];S.hist.unemp=S.hist.unemp||[];S.hist.debt=S.hist.debt||[];S.hist.trust=S.hist.trust||[];
  S.hist.infl.push(E.infl);S.hist.rates.push(E.rates);S.hist.unemp.push(E.unemp);S.hist.debt.push(E.debt);S.hist.trust.push(E.trust);
  ["infl","rates","unemp","debt","trust"].forEach(k2=>{if(S.hist[k2].length>180)S.hist[k2].shift()});
  S.hist.pollMe.push(S.pols.pollMe);S.hist.pollGov.push(S.meta.phase==="government"?(100-S.pols.pollMe-28):S.opp.gov.poll);
  if(S.hist.app.length>180){["app","gdp","pollMe","pollGov"].forEach(k=>S.hist[k].shift())}
  return due;
}


/* ---------- the incident engine: generated month-to-month situations ---------- */
function genEvent(S){
  const fams=GE_FAMILIES.filter(f=>!f.phase||f.phase===S.meta.phase);
  S.recentGen=S.recentGen||[];
  for(let attempt=0;attempt<14;attempt++){
    const fam=fams[Math.floor(S.rng()*fams.length)];
    const pick=arr=>arr[Math.floor(S.rng()*arr.length)];
    const sevSrc={dept:Math.max(0.6,(S.svc.nhsWait-5)/2+0.6),local:1,petition:0.8+S.rng(),intl:0.8,storm:0.7+S.pols.sleaze/60,celeb:0.8,faction:0.7+(60-S.pols.unity)/40,oppgift:0.8+(45-(S.opp?S.opp.gov.approval:40))/20}[fam.id]||1;
    const sev=clamp(sevSrc,0.5,2);
    const built=fam.mk(S,pick,Math.round(sev*10)/10);
    const sig=fam.id+"|"+built.t2;
    if(S.recentGen.includes(sig))continue;
    S.recentGen.push(sig);if(S.recentGen.length>48)S.recentGen.shift();
    return{id:"gen_"+fam.id,et:fam.et,t:built.t2,b:built.b,gen:true,
      opts:built.opts.map(o=>({l:o.l,s:o.s,ideo:o.ideo,eff:o.eff,q:(built.t2||"").toUpperCase()}))};
  }
  return null;
}
function genComboCount(){
  // honest lower bound on distinct situations the incident engine can produce
  const dept=GE_DEPTS.length*GE_PLACES.length*GE_FAILS.length;       // 14*48*6
  const local=GE_PLACES.length*GE_LOCALS.length*GE_EMPLOYERS.length; // 48*8*12 (employer varies the jobs line)
  const pet=GE_PETS.length*380;                                      // signature counts
  const intl=(Object.keys(REGIONS).length-2)*GE_INTL.length;
  const storm=GE_STORMS.length*OUTLETS.length;
  const celeb=GE_CELEB.length;
  const fac=3*8*15;
  const opp=GE_DEPTS.length*GE_PLACES.length*GE_FAILS.length;
  return dept+local+pet+intl+storm+celeb+fac+opp;
}


/* leaders rapport store */
function rapport(S,rid){S.world.leadersR=S.world.leadersR||{};return S.world.leadersR[rid]||0}
function bumpRapport(S,rid,v){S.world.leadersR=S.world.leadersR||{};S.world.leadersR[rid]=clamp((S.world.leadersR[rid]||0)+v,-30,30)}

/* ---------- great-power escalation ---------- */
function declareWar(S,rid){
  if(S.meta.phase!=="government")return{ok:false,msg:"Only the government commands the armed forces."};
  if(S.world.war)return{ok:false,msg:"One war at a time."};
  const R=S.world.regions[rid];
  if(!R)return{ok:false};
  if(S.pols.capital<20)return{ok:false,msg:"Not enough capital (need 20)."};
  applyEffects(S,{capital:-20});
  const justified=R.rel<-50;
  const ww=MAJORS.includes(rid);
  applyEffects(S,{standing:justified?-4:-20,trustM:ww?-18:-10,econ:{spendBump:.8}});
  for(const k of Object.keys(S.world.regions)){if(k!==rid)S.world.regions[k].rel=clamp(S.world.regions[k].rel-(justified?4:12),-100,100)}
  S.world.regions[rid].rel=-95;
  applyEffects(S,{war:{name:"War with "+REGIONS[rid].n,theatre:rid,phase:"fighting",support:justified?56:32,cas:0,months:0,intensity:1.3,mood:justified?1:-4,ww}});
  if(ww)S.world.doom=25;
  frontPage(S,"BRITAIN DECLARES WAR ON "+REGIONS[rid].n.toUpperCase(),ww?"Against a nuclear power. The Cabinet Secretary asks, formally, whether you have considered what the word 'win' means here.":"The Commons sits in emergency session; the country watches recruiting offices reopen.");
  log(S,"DECLARED WAR: "+REGIONS[rid].n);
  return{ok:true};
}
function nukeStrike(S,rid){
  S.flags.nuked=true;
  const major=MAJORS.includes(rid);
  if(major&&S.rng()<0.6){S.flags.mad=true;S.meta.over=true;
    frontPage(S,"—","There is no edition tomorrow.");
    log(S,"NUCLEAR EXCHANGE");return"mad";}
  // unanswered first use: you 'win' and lose everything else
  S.world.war=null;S.score.warsWon++;S.world.doom=0;
  for(const k of Object.keys(S.world.regions))S.world.regions[k].rel=-90;
  S.econ.trust=5;S.world.standing=0;
  applyEffects(S,{app:-25,unity:-20,sleaze:30});
  frontPage(S,"THE DAY BRITAIN USED IT","The war is over. So is Britain's place among nations. Embassies empty by nightfall; the markets do not reopen so much as flee.");
  log(S,"FIRST USE — pariah");return"pariah";
}

/* ---------- shock roll: rare, loud ---------- */
function maybeShock(S){
  if((S.flags._shockCool||0)>S.meta.month)return null;
  if(S.rng()>=0.075)return null;
  const pool=SHOCKS.filter(s=>(!s.phase||s.phase===S.meta.phase)&&(!s.cond||s.cond(S)));
  if(!pool.length)return null;
  let tw=0;const ws=pool.map(s=>{tw+=s.w;return s.w});
  let x=S.rng()*tw,sh=pool[0];
  for(let i=0;i<pool.length;i++){x-=ws[i];if(x<=0){sh=pool[i];break}}
  const pick=arr=>arr[Math.floor(S.rng()*arr.length)];
  const[head,sub]=sh.fx(S,pick);
  frontPage(S,head,sub);log(S,"SHOCK: "+head);tick_news(S,"⚡ "+head);
  S.flags._shockCool=S.meta.month+3;
  return head;
}

/* ---------- card draw ---------- */
function drawCard(S){
  const deck=S.meta.phase==="government"?GOV_DECK:OPP_DECK;
  const forced=deck.find(c=>c.forced&&c.forced(S));
  if(forced)return forced;
  const pool=deck.filter(c=>{
    if(c.forced)return false;
    if(c.once&&S.flags["used_"+c.id])return false;
    if(S.cooldowns[c.id]&&S.cooldowns[c.id]>S.meta.month)return false;
    if(c.cond&&!c.cond(S))return false;return true});
  let tw=0;const ws=pool.map(c=>{let w=c.w;
    if(c.id.startsWith("strike")&&S.econ.infl>5)w*=1.6;
    if(c.id==="smallboats"&&[5,6,7,8].includes(S.moy))w*=1.5;
    if(S.flags.fluSoon&&c.id==="new_flu")w*=8;
    if(S.flags.donorBomb&&(c.id==="peerages"||c.id==="scandal_money"))w*=3;
    if(S.flags.byCurse&&(c.id==="byelection"||c.id==="o_byelect"))w*=2.5;
    if(S.flags.royalMoment&&c.id==="honours_row")w*=4;
    tw+=w;return w});
  if(S.rng()<0.45){const g=genEvent(S);if(g)return g}
  let x=S.rng()*tw;
  for(let i=0;i<pool.length;i++){x-=ws[i];if(x<=0)return pool[i]}
  return genEvent(S)||pool[pool.length-1]||deck.find(c=>c.id==="quiet"||c.id==="o_quiet");
}
function adviceFor(S,card){
  if(!card.opts||card.opts.length<2)return null;
  let best=0,bv=-1e9;
  card.opts.forEach((o,i)=>{let v=(o.eff&&o.eff.app||0)+(o.eff&&o.eff.poll||0)*1.5+(o.eff&&o.eff.unity||0)*.5+(o.eff&&o.eff.trustM||0)*.3;if(o.special)v=1;if(v>bv){bv=v;best=i}});
  if(S.rng()<0.25)best=Math.floor(S.rng()*card.opts.length);
  const a=pickR(S,ADVISERS)[0];
  const lines=["the numbers point to","I'd swallow hard and go with","everything we model says","grit your teeth and take","the focus group screamed, but the answer is","if you want a future, take"];
  return{a,line:pickR(S,lines),best};
}

/* ---------- option resolution ---------- */
function resolveOption(S,card,idx){
  const o=card.opts[idx];
  if(!card.gen){S.flags["used_"+card.id]=true;S.cooldowns[card.id]=S.meta.month+16;}
  if(card.fx)card.fx(S);
  if(o.special==="offensive"){S.flags["wp"+S.meta.month]=true;return warOffensive(S)}
  if(o.special==="hold"){const w=S.world.war;w.support-=1;S.flags["wp"+S.meta.month]=true;
    frontPage(S,"THE LONG WATCH",`Month ${w.months+1} of ${w.name}. Lines hold. Letters arrive. Support ${Math.round(w.support)}%.`);return"held"}
  if(o.special==="negotiate"){S.flags["wp"+S.meta.month]=true;return warNegotiate(S)}
  if(o.special==="brink_stand"){S.flags["brink"+S.meta.month]=true;
    const w=S.world.war;S.world.war=null;S.world.doom=0;S.score.crisesResolved++;
    applyEffects(S,{standing:-8,app:-5,trustM:8});
    frontPage(S,"THE WORLD EXHALES","You stood the forces down. History will call it weakness or wisdom depending on who writes it — but everyone is alive to argue.");
    return"stood_down";}
  if(o.special==="brink_hold"){S.flags["brink"+S.meta.month]=true;
    S.world.doom=clamp(S.world.doom-12,0,100);applyEffects(S,{standing:3,app:1});
    frontPage(S,"NERVE, HELD","No first move, no retreat. The launchers stay dispersed; the hotline stays warm; the world ages a year in a week.");
    return"held_brink";}
  if(o.special==="brink_nuke"){S.flags["brink"+S.meta.month]=true;return nukeStrike(S,S.world.war.theatre);}
  if(o.special&&o.special.indexOf("occ_")===0){const rid=S.flags._occT,R2=S.world.regions[rid],nm=REGIONS[rid].n;
    if(o.special==="occ_withdraw"){R2.occupied=false;applyEffects(S,{standing:-5,app:-3});
      frontPage(S,"THE LONG RETREAT FROM "+nm.toUpperCase(),"Flags folded, lessons allegedly learned, inquiry pre-ordered.")}
    if(o.special==="occ_puppet"){R2.occupied=false;R2.rel=clamp(R2.rel+75,-100,100);
      applyEffects(S,{capital:-8,standing:2,queue:[{m:6,eff:{standing:-3},head:"The friendly government in "+nm+" looks less friendly by the month."}]});
      frontPage(S,"A FRIENDLY GOVERNMENT IN "+nm.toUpperCase(),"Sovereign, independent, and curiously agreeable.")}
    if(o.special==="occ_fist"){applyEffects(S,{standing:-8,sleaze:6,app:-2,rel:{usa:-4,germany:-4,eunorth:-4}});
      frontPage(S,"CRACKDOWN IN "+nm.toUpperCase(),"Order, of a kind. The cameras find the other kind.")}
    return"occ"}
  applyEffects(S,o.eff);
  if(card.gen){S.recentTopics=S.recentTopics||[];
    S.recentTopics.push({label:card.t.toLowerCase(),k:{dept:"nhs",local:"jobs",petition:"sleaze",intl:"war",storm:"sleaze",celeb:"sleaze",faction:"sleaze",oppgift:"jobs"}[card.id.replace("gen_","")]||"jobs",bad:2.2});
    if(S.recentTopics.length>8)S.recentTopics.shift();}
  let head=o.q,sub="";
  if(head==="__JOKE__"){const hit=S.rng()<0.5+S.mediaIndex/120;
    if(hit){applyEffects(S,{app:3,media:4});head="THE ZINGER LANDS";sub="The clip does 11m views. The other side is, briefly, a meme."}
    else{applyEffects(S,{app:-3,media:-4});head="JOKE DIES AT DESPATCH BOX";sub="Silence with a texture. Your own benches study their order papers like scripture."}}
  sub=sub||pickSub(S);
  frontPage(S,head,sub);log(S,card.t+" → "+o.l);tick_news(S,head);
  return"ok";
}
function pickSub(S){
  return pickR(S,[
   `No. 10 calls it 'decisive leadership'; opponents call it '${pickR(S,["chaos with a podium","government by horoscope","a hostage video with better lighting","panic in a good suit"])}'.`,
   `Approval ${S.pols.approval.toFixed(0)}%, and ${S.pols.approval>50?"the sun, briefly, on the front bench":"the weather closing in"}.`,
   `Insiders say the decision was '${pickR(S,["finely balanced","taken before breakfast","screamed about for six hours","settled by the grid"])}'.`,
   `Markets ${S.econ.trust>55?"shrug, approvingly":"twitch like a sleeping dog"}; sterling ${S.econ.trust>55?"steadies":"sags"} on the news.`]);
}

/* ---------- interludes ---------- */
function runByelection(S,near){
  const p=sig((S.pols.approval-43)/7+(near?0.15:0));
  const win=S.rng()<p;
  if(win){applyEffects(S,{app:2,unity:4,capital:4});frontPage(S,"MIDDLEWICH HOLDS","The pollsters retreat to lick their models. No. 10 allows itself one (1) glass.")}
  else{S.party.seats-=1;houseByelection(S,false);applyEffects(S,{app:-3,unity:-6});frontPage(S,"MIDDLEWICH FALLS","A 14% swing against. The graphic is a wedge of doom.")}
  log(S,"By-election "+(win?"held":"lost"));return win;
}
function runOppByelection(S,big){
  const p=sig((S.pols.pollMe-S.opp.gov.poll)/6+(big?0.2:-0.1));
  const win=S.rng()<p;
  if(win){S.party.seats+=1;houseByelection(S,true);applyEffects(S,{poll:1.2,unity:5,gov:{app:-2}});frontPage(S,"CRANDLEFORD FALLS TO "+PARTIES[S.meta.party].name.toUpperCase(),"A "+riR(S,9,18)+"% swing. Government MPs check their own majorities and feel unwell.")}
  else{applyEffects(S,{poll:-1,unity:-5});frontPage(S,"CRANDLEFORD STAYS PUT","All that mileage for a hold. Your activists deserve a bath and an apology.")}
  log(S,"By-election "+(win?"GAINED":"missed"));return win;
}
function runLocals(S,owned){
  const lead=S.pols.pollMe-S.opp.gov.poll;
  const good=lead+((S.rng()-.5)*4)>1;
  if(good){applyEffects(S,{poll:owned?1:.5,unity:6,capital:6});frontPage(S,"A GOOD NIGHT FOR "+PARTIES[S.meta.party].name.toUpperCase(),"Projected national share has you ahead. The arrow points up and so do the plotters' eyebrows.")}
  else{applyEffects(S,{poll:owned?-1.2:-.5,unity:-7});frontPage(S,"LOCALS BITE LOTO","Gains: modest. Spin: heroic. The 'private concerns' of MPs are in three papers by Sunday.")}
  log(S,"Local elections: "+(good?"good night":"bad night"));return good;
}
function runIndyref(S){
  const yes=28+S.world.scot/3.4+(S.rng()*6-3);
  if(yes>50){S.flags.scotGone=true;applyEffects(S,{app:-15,standing:-15});
    frontPage(S,"YES: "+yes.toFixed(1)+"%","The Union ends on your watch. The flag comes down the pole politely, which is somehow worse.");
    log(S,"Scotland votes YES")}
  else{S.world.scot=clamp(S.world.scot-20,0,100);applyEffects(S,{app:6,standing:4,capital:8,crisisWin:1});
    frontPage(S,"NO — THE UNION HOLDS","Yes "+yes.toFixed(1)+"%. 'Settled for a generation', a phrase with a five-year warranty.");log(S,"Scotland votes No")}
}
function warOffensive(S){
  const w=S.world.war,dep=S.mil.dep[w.theatre]||{};
  const p=0.34+(S.mil.cap||0)*0.04+(dep.brig||0)*0.04+(dep.car?0.06:0)+S.world.regions.usa.rel/300+rapport(S,"usa")/200+(w.intensity>0.7?0.06:0);
  if(S.rng()<p){S.score.warsWon++;S.world.war=null;
    if(w.invasion){const R2=S.world.regions[w.theatre];R2.occupied=true;
      applyEffects(S,{app:w.justified?10:4,standing:w.justified?6:-6,unity:4});
      frontPage(S,REGIONS[w.theatre].n.toUpperCase()+" FALLS","The map changes colour. Now the hard part: everything afterward.");
      log(S,"CONQUERED: "+REGIONS[w.theatre].n);return"won"}
    applyEffects(S,{app:14,standing:14,unity:6});
    frontPage(S,"VICTORY",`The ${w.name} campaign ends. Church bells, properly. The map is the shape it was, which was the whole point.`);log(S,"WAR WON: "+w.name);return"won"}
  w.cas+=riR(S,120,300);w.support-=9;w.fails=(w.fails||0)+1;
  frontPage(S,"THE OFFENSIVE STALLS","Gains in metres, losses in names. The MoD briefing says 'recalibration'.");log(S,"Offensive failed");
  if(w.fails>=2||w.support<25){S.score.warsLost++;S.world.war=null;applyEffects(S,{app:-18,standing:-16,unity:-8});
    frontPage(S,"DEFEAT","Withdrawal 'on honourable terms', a phrase that fools no one, least of all the families.");log(S,"WAR LOST: "+w.name);return"lost"}
  return"failed";
}
function warNegotiate(S){const w=S.world.war;S.world.war=null;S.score.crisesResolved++;
  applyEffects(S,{app:-4,standing:-4});
  frontPage(S,"THE GUNS GO QUIET",`A ceasefire over ${w.name}. Nobody calls it victory; everyone's children come home. History will argue.`);
  log(S,"Negotiated end: "+w.name);return"peace"}


function requestQE(S){
  if(S.meta.phase!=="government")return{ok:false,msg:"Only the Chancellor can ask for the printers."};
  if(S.econ.trust>=40)return{ok:false,msg:"The Bank only prints in a crisis (markets under 40)."};
  if(S.pols.capital<6)return{ok:false,msg:"Not enough capital."};
  applyEffects(S,{capital:-6,trustM:9});S.econ.infl+=0.5;
  frontPage(S,"THE PRINTERS HUM","Quantitative easing returns 'temporarily', a word doing heroic work. Markets steady; savers seethe.");
  return{ok:true};
}
function appointGovernor(S,kind){
  if(S.meta.phase!=="government")return{ok:false,msg:"Governors are appointed from No. 11, not from across the aisle."};
  if((S.flags.govAppointedAt||-99)+24>S.meta.month)return{ok:false,msg:"You appointed a Governor recently."};
  if(S.pols.capital<8)return{ok:false,msg:"Not enough capital."};
  applyEffects(S,{capital:-8});
  delete S.flags.govHawk;delete S.flags.govDove;
  if(kind==="hawk"){S.flags.govHawk=true;applyEffects(S,{trustM:6});frontPage(S,"A HAWK AT THE BANK","The new Governor's first speech contains the word 'discipline' nine times. Mortgage holders flinch; gilt traders purr.")}
  else{S.flags.govDove=true;applyEffects(S,{trustM:-4});frontPage(S,"A DOVE AT THE BANK","The new Governor 'sees room for patience on rates'. Borrowers cheer; the currency desk mutters.")}
  S.flags.govAppointedAt=S.meta.month;return{ok:true};
}

/* ---------- cabinet management ---------- */
function swapMinister(S,roleIdx,benchIdx){
  if(S.pols.capital<4)return{ok:false,msg:"Not enough capital."};
  const c=S.cabinet[roleIdx],b=(S.bench||[])[benchIdx];
  if(!c||!b)return{ok:false};
  applyEffects(S,{capital:-4});
  S.bench[benchIdx]={name:c.name,app:c.app,base:c.base,comp:c.comp,loyal:c.loyal,cha:c.cha,fav:c.role};
  S.cabinet[roleIdx]={role:c.role,name:b.name,app:b.app,base:b.base,comp:b.comp,loyal:clamp(b.loyal+8,0,100),cha:b.cha};
  if(c.app>45)applyEffects(S,{unity:-3});
  frontPage(S,(b.name+" IN, "+c.name.split(" ").slice(-1)[0].toUpperCase()+" OUT").toUpperCase(),
    "A "+c.role+" reshuffled. Allies of the departed brief their hurt by nightfall.");
  log(S,"Reshuffle: "+b.name+" → "+c.role);
  return{ok:true};
}


/* ---------- the lords, the whips, the spooks ---------- */
function appointPeers(S){
  if(S.meta.phase!=="government")return{ok:false,msg:"Peerages flow from the Prime Minister. You are not the Prime Minister. Yet."};
  if(S.pols.capital<6)return{ok:false,msg:"Not enough capital."};
  applyEffects(S,{capital:-6,sleaze:2});
  S.lords=S.lords||{peers:0};S.lords.peers+=riR(S,2,4);
  frontPage(S,"NEW ERMINE","A batch of working peers takes the oath. The other side calls it packing; you call it 'restoring balance'. Both are right.");
  return{ok:true,peers:S.lords.peers};
}
function whipAction(S,kind,fi){
  const f=S.party.factions[fi];
  if(kind==="riot"){if(S.pols.capital<5)return{ok:false,msg:"Not enough capital."};
    applyEffects(S,{capital:-5});
    if(S.rng()<0.2){f.happy=clamp(f.happy-4,0,100);recomputeUnity(S);
      frontPage(S,"THE TELLING-OFF LEAKS","Your riot-act reading to "+f.name+" appears verbatim in a Sunday paper. They are not chastened. They are organising.");return{ok:true,backfired:true}}
    f.happy=clamp(f.happy+7,0,100);S.party.factions.forEach(o=>{if(o!==f)o.happy=clamp(o.happy-1,0,100)});recomputeUnity(S);
    log(S,"Whips leaned on "+f.name);return{ok:true}}
  if(kind==="honours"){if(S.meta.phase!=="government")return{ok:false,msg:"You have no honours to give. Try promises."};
    if(S.pols.capital<8)return{ok:false,msg:"Not enough capital."};
    applyEffects(S,{capital:-8,sleaze:3,unity:5});
    frontPage(S,"GONGS FOR THE LOYAL","An honours list with a suspiciously high correlation to recent division lists. It works. It always works.");
    return{ok:true}}
  return{ok:false};
}
function intelOp(S,kind){
  if(kind==="dossier"){if(S.pols.capital<6)return{ok:false,msg:"Not enough capital."};
    applyEffects(S,{capital:-6});
    if(S.meta.phase==="government")applyEffects(S,{oppHit:-5});else applyEffects(S,{gov:{app:-1.5}});
    log(S,"Intel: rival playbook obtained");return{ok:true,msg:"Their grid for next month is on your desk."}}
  if(kind==="sweep"){if(S.meta.phase!=="government")return{ok:false,msg:"The agencies answer to the government of the day."};
    if(S.pols.capital<5)return{ok:false,msg:"Not enough capital."};
    applyEffects(S,{capital:-5,standing:2});
    if(S.rng()<0.18){applyEffects(S,{sleaze:-5});frontPage(S,"A MOLE, QUIETLY REMOVED","Counter-espionage finds a leak two desks from the centre of government. The story you'll never tell is the best one you have.");return{ok:true,found:true}}
    return{ok:true,msg:"The sweep comes back clean. Probably."}}
  if(kind==="kompromat"){if(S.pols.capital<9)return{ok:false,msg:"Not enough capital (need 9)."};
    applyEffects(S,{capital:-9});
    const r=S.rng();
    if(r<0.5){if(S.meta.phase==="government")applyEffects(S,{oppHit:-9});else applyEffects(S,{gov:{app:-3},poll:1});
      frontPage(S,"A RIVAL'S VERY BAD WEEK","A devastating story about your opponent surfaces with no fingerprints on it. None. Obviously none.");return{ok:true,win:true}}
    if(r<0.85){return{ok:true,msg:"The file is thinner than promised. Nothing usable."}}
    applyEffects(S,{sleaze:11,media:-4});
    frontPage(S,"DIRTY TRICKS EXPOSED","The operation leaks. The story is no longer about them.");
    return{ok:true,backfired:true}}
  return{ok:false};
}


function whipJobs(S){ // opposition: promise frontbench jobs
  if(S.meta.phase==="government")return{ok:false,msg:"In government you have actual honours. Use those."};
  if(S.pols.capital<8)return{ok:false,msg:"Not enough capital."};
  applyEffects(S,{capital:-8,unity:5});
  frontPage(S,"JOBS FOR THE LOYAL","A quiet round of promises about who sits where after the victory. Cheaper than honours, and everyone keeps the receipt.");
  return{ok:true};
}
function lordsObstruct(S){
  if(S.meta.phase==="government")return{ok:false,msg:"You don't ambush your own bills."};
  if(S.pols.capital<4)return{ok:false,msg:"Not enough capital."};
  applyEffects(S,{capital:-4,gov:{app:-1.2},poll:0.4});
  frontPage(S,"AMBUSH IN THE LORDS","Your peers shred the government's flagship bill at committee, politely, for six hours. Ping-pong begins; the grid collapses.");
  log(S,"Lords ambush");return{ok:true};
}
function fiscalPledge(S){
  if(S.meta.phase==="government")return{ok:false,msg:"You ARE the fiscal framework."};
  if(S.flags.fiscalRule)return{ok:false,msg:"You've already made the pledge. Markets remember."};
  if(S.pols.capital<3)return{ok:false,msg:"Not enough capital."};
  applyEffects(S,{capital:-3,trustM:4,poll:0.5});S.flags.fiscalRule=true;
  frontPage(S,"THE IRON PLEDGE","Every spending plan independently audited before polling day, you announce. The markets nod; your own activists groan.");
  return{ok:true};
}

/* ---------- treasury ---------- */
function enactFiscal(S,nf,isBudgetDay){
  const old=S.fiscal,deltas=[];
  for(const k of Object.keys(FISCAL_META)){if(Math.abs((nf[k]??old[k])-old[k])>1e-9)deltas.push(k)}
  if(!deltas.length)return{ok:false,msg:"No changes to enact."};
  const cost=isBudgetDay?0:4;
  if(S.pols.capital<cost)return{ok:false,msg:"Not enough capital."};
  applyEffects(S,{capital:-cost});
  // political reactions
  let ideoE=0,appD=0,trustD=0;
  const d=(k)=>((nf[k]??old[k])-old[k]);
  ideoE+= d("basic")*0.12+d("top")*0.05+d("corp")*0.06+d("vat")*0.08+d("ni")*0.08 - d("welf")*0.25 - d("nhs")*0.18 + d("def")*0.1 - d("green")*0.2;
  appD += -d("basic")*0.9 - d("vat")*0.8 - d("ni")*0.7 - d("fuel")*0.06 + d("nhs")*1.4 + d("edu")*0.7 + d("police")*0.6 + d("welf")*0.5 - (d("top")<0?Math.abs(d("top"))*0.15:0);
  if(d("triple")<0){appD-=7;applyEffects(S,{faction:{"Red Wall Populists":-6}});}
  if(d("immig")<-15)applyEffects(S,{faction:{"Social Liberals":-6,"The Activists":-6,"The Left":-5}});
  if(d("immig")>15)applyEffects(S,{faction:{"National Right":-8,"Red Wall Populists":-7,"The Leader's Circle":-7}});
  S.fiscal=Object.assign({},old,nf);
  const defc=S.fiscalDeficit;
  trustD = defc>5?-10:defc>3.5?-3:6;
  if(d("triple")<0)trustD+=8;
  applyEffects(S,{app:clamp(appD,-12,12),trustM:trustD,ideo:{e:clamp(ideoE,-2,2),s:0}});
  const head=defc>5?"A BUDGET ON BORROWED TIME":defc<2.5?"THE IRON STATEMENT":"A BUDGET OF SMALL FONTS";
  frontPage(S,isBudgetDay?head:"FISCAL STATEMENT: "+head,`Tax ${revenueOf(S.fiscal).toFixed(1)}% of GDP, spend ${spendOf(S.fiscal).toFixed(1)}%, deficit ${defc.toFixed(1)}%. ${defc>5?"Gilt traders sharpen pencils.":"The OBR exhales."}`);
  log(S,(isBudgetDay?"Budget":"Fiscal statement")+": deficit "+defc.toFixed(1)+"%");
  S.flags["bud"+S.year]=isBudgetDay?true:S.flags["bud"+S.year];
  return{ok:true,deficit:defc};
}
function leanOnBank(S){
  if(S.meta.phase!=="government")return{ok:false,msg:"The Bank takes calls from the government, not the opposition."};
  if(S.pols.capital<8)return{ok:false};
  applyEffects(S,{capital:-8,trustM:-8});S.econ.rates=clamp(S.econ.rates-0.5,0.5,8);S.flags.leanedOnBank=true;
  frontPage(S,"NO. 10 LEANS ON THE BANK","The Governor's statement contains the word 'independent' eleven times, which tells you everything.");
  return{ok:true};
}

/* ---------- parliament: bills ---------- */
function computeDivision(S,bill,whipped){
  const F=S.party.factions;
  let rebels=0;const rebelNames=[];
  F.forEach(f=>{
    const d=Math.abs(bill.ideo.e-f.ideal.e)*0.7+Math.abs((bill.ideo.s||0)-f.ideal.s)*0.5;
    let rr=clamp((d-1.1)*0.22-(f.happy-50)/300-(whipped?0.08:0),0,0.5);
    const n=Math.round(S.party.seats*f.w*rr);
    rebels+=n;if(n>3)rebelNames.push(f.leader+" + "+(n-1)+" of "+f.name);
  });
  const partner=(S.flags.coalitionSeats?S.flags.coalitionSeats:(S.flags.minority?Math.round(8*(S.rng()<0.7?1:0)):0))+Math.min(12,((S.lords&&S.lords.peers)||0))*0;
  const ayes=S.party.seats-rebels+partner+Math.round(Math.min(12,((S.lords&&S.lords.peers)||0))*0.4);
  const oppFor=bill.ideo.e<-1?0:0;
  const noes=650-S.party.seats-18-(S.flags.minority?partner:0)+rebels*0+oppFor;
  return{ayes,noes:clamp(noes,0,640),rebels,rebelNames,pass:ayes>noes};
}
function enactBill(S,billId,whipped){
  const bill=BILLS.find(b=>b.id===billId);
  if(!bill||S.usedBills.includes(billId))return{ok:false};
  const cost=bill.cost+(whipped?8:0);
  if(S.pols.capital<cost)return{ok:false,msg:"Not enough capital."};
  applyEffects(S,{capital:-cost});
  const div=computeDivision(S,bill,whipped);
  S.usedBills.push(billId);
  if(div.pass){S.score.billsPassed++;applyEffects(S,bill.fx);applyIdeo(S,bill.ideo);
    frontPage(S,bill.quip,`${bill.n} passes ${div.ayes}–${div.noes}${div.rebels?` despite ${div.rebels} rebels`:""}. ${bill.desc}`);
    log(S,"PASSED: "+bill.n+" ("+div.ayes+"–"+div.noes+")");}
  else{applyEffects(S,{app:-3,unity:-5,capital:-4});
    frontPage(S,"DEFEATED IN THE HOUSE",`${bill.n} falls ${div.ayes}–${div.noes}. The whips' office lights stay on all night, recriminating.`);
    log(S,"DEFEATED: "+bill.n);}
  return{ok:true,div,bill};
}

/* ---------- world / map ops ---------- */
function regionAction(S,rid,act){
  const R=S.world.regions[rid],meta=REGIONS[rid];
  if(!R)return{ok:false};
  const out={ok:true,msg:""};
  const need=c=>{if(S.pols.capital<c){out.ok=false;out.msg="Not enough capital.";return false}applyEffects(S,{capital:-c});return true};
  switch(act){
    case"summit":if(!need(5))break;applyEffects(S,{rel:{[rid]:7},standing:2});bumpRapport(S,rid,6);
      frontPage(S,"SUMMIT IN "+meta.cap.toUpperCase(),"Handshakes calibrated to the millimetre. Communiqué adjectives: 'frank', 'productive', 'warm' — pick two.");break;
    case"trade":if(!need(5))break;
      if(R.rel>35&&S.rng()<0.65){applyEffects(S,{rel:{[rid]:5},econ:{g:.15}});S.flags.tradeBoost=true;
        frontPage(S,"TRADE DEAL WITH "+meta.n.toUpperCase(),"Tariff lines fall; a lobster-export anecdote is deployed at every interview for a month.")}
      else{applyEffects(S,{rel:{[rid]:2}});frontPage(S,"TRADE TALKS 'CONSTRUCTIVE'","Which is diplomat for 'nothing signed'. The lobsters wait.")}break;
    case"sanction":if(!need(4))break;applyEffects(S,{rel:{[rid]:-15},standing:R.rel<-30?4:-3,econ:{g:-.05}});
      frontPage(S,"SANCTIONS ON "+meta.n.toUpperCase(),R.rel<-30?"Allies applaud the spine.":"Allies blink: sanctions on a partner? Bold.");break;
    case"aid":if(!need(4))break;applyEffects(S,{rel:{[rid]:8},standing:3,econ:{spendBump:.1}});
      frontPage(S,"AID PACKAGE FOR "+meta.n.toUpperCase(),"Soft power, hard cash. A school will bear a name nobody local can pronounce.");break;
    case"covert":if(!need(7))break;
      if(S.rng()<0.55){applyEffects(S,{standing:4,rel:{[rid]:R.rel<0?-4:2}});frontPage(S,"(NOTHING HAPPENED IN "+meta.cap.toUpperCase()+")","A story you will never be able to tell. The PM seems quietly pleased this week.")}
      else{applyEffects(S,{standing:-6,sleaze:6,rel:{[rid]:-10}});frontPage(S,"OPERATION BLOWBACK","A passport, a wig and a receipt — all British, all on the news. The Foreign Office 'does not comment'.")}break;
    case"deploy":{const dep=S.mil.dep[rid]=S.mil.dep[rid]||{brig:0,car:0,sq:0};
      if(S.mil.brig<1){out.ok=false;out.msg="No brigades available.";break}
      S.mil.brig--;dep.brig=(dep.brig||0)+1;applyEffects(S,{econ:{spendBump:.08},standing:2});
      if(rid==="eunorth"||rid==="ukraine")applyEffects(S,{rel:{russia:-6}});
      frontPage(S,"BRITISH FORCES TO "+meta.n.toUpperCase(),"Deterrence in hi-vis. Moscow notices; so does the Treasury.");break}
    case"recall":{const dep=S.mil.dep[rid];if(!dep||!dep.brig){out.ok=false;out.msg="Nothing deployed.";break}
      dep.brig--;S.mil.brig++;applyEffects(S,{econ:{spendBump:-.05}});
      frontPage(S,"FORCES HOME FROM "+meta.n.toUpperCase(),"Quiet planes, quieter announcements.");break}
    case"invade":{
      if(meta.home){out.ok=false;out.msg="That is Britain.";break}
      if(S.world.war){out.ok=false;out.msg="One war at a time.";break}
      if(rid==="france"){S.flags.hague=true;out.hague=true;
        frontPage(S,"…FRANCE?","The Cabinet resigns en masse before you finish the sentence. The Palace calls. The call is brief.");break}
      if(!need(15))break;
      const justified=R.rel<-40;
      const code="Operation "+pickR(S,["Lionheart","Trident Dawn","Grey Channel","Iron Sceptre","Albion Reach"]);
      applyEffects(S,{standing:justified?-2:-16,trustM:justified?-4:-12,econ:{spendBump:.5}});
      for(const k of Object.keys(S.world.regions)){if(k!==rid)S.world.regions[k].rel=clamp(S.world.regions[k].rel-(justified?3:9),-100,100)}
      S.world.regions[rid].rel=-90;
      if(!justified)S.flags.tradeDrag=true;
      applyEffects(S,{war:{name:code,theatre:rid,phase:"fighting",support:justified?60:36,cas:0,months:0,intensity:1,mood:justified?1:-3,invasion:true,justified}});
      frontPage(S,"BRITAIN INVADES "+meta.n.toUpperCase(),justified?"The case was made; the die is cast; the Atlantic holds its breath.":"No mandate, no allies, no plan past Tuesday — but plenty of confidence. The Security Council convenes in fury.");
      log(S,"INVASION: "+meta.n);break}
    case"carrier":{if(S.mil.car<1){out.ok=false;out.msg="Carrier unavailable.";break}
      const dep=S.mil.dep[rid]=S.mil.dep[rid]||{brig:0,car:0,sq:0};S.mil.car--;dep.car=1;applyEffects(S,{standing:4,econ:{spendBump:.12}});
      if(rid==="china"||rid==="eastasia")applyEffects(S,{rel:{china:-8,usa:6}});
      frontPage(S,"THE CARRIER SAILS","Forty thousand tonnes of message. Replenishment ships trail like punctuation.");break}
  }
  return out;
}

/* ---------- PMQs ---------- */
function pmqsTopics(S){
  const e2=S.econ,v=S.svc;
  const ph=(k,i)=>PMQ_PHR[k][(S.meta.month+i)%PMQ_PHR[k].length];
  const cands=[
    {k:"infl",label:ph("infl",0),bad:Math.max(0,e2.infl-2)*2},
    {k:"nhs",label:ph("nhs",1),bad:Math.max(0,v.nhsWait-5)*2.2},
    {k:"mig",label:ph("mig",2),bad:Math.max(0,v.mig-420)/60},
    {k:"crime",label:ph("crime",0),bad:Math.max(0,v.crime-98)/4},
    {k:"jobs",label:ph("jobs",1),bad:Math.max(0,4.8-e2.g)+Math.max(0,e2.unemp-4.5)*2},
    {k:"sleaze",label:ph("sleaze",2),bad:Math.max(0,(S.meta.phase==="government"?S.pols.sleaze:30)-30)/5},
  ];
  if(S.world.war)cands.push({k:"war",label:ph("war",0),bad:Math.max(0,(60-S.world.war.support))/8});
  // recent generated incidents become ammunition
  (S.recentTopics||[]).slice(-5).forEach(t=>cands.push({k:t.k||"jobs",label:t.label,bad:t.bad||2.2}));
  // a rotating static issue or two
  const iss=Object.keys(ISSUES);
  for(let i=0;i<2;i++){const k2=iss[(S.meta.month*3+i*4)%iss.length];
    cands.push({k:PMQ_STATIC_K[k2]||"jobs",label:"the record on "+ISSUES[k2].n.toLowerCase(),bad:1.4+S.rng()});}
  const pet=GE_PETS[(S.meta.month*7)%GE_PETS.length];
  cands.push({k:"sleaze",label:"the petition on "+pet,bad:1+S.rng()});
  // anti-repeat memory, then: the most damaging + two varied picks
  S.recentPMQ=S.recentPMQ||[];
  const fresh=cands.filter(c=>!S.recentPMQ.includes(c.label));
  const pool=(fresh.length>=3?fresh:cands).sort((a,b)=>b.bad-a.bad);
  const picks=[pool[0]];
  const rest2=pool.slice(1);
  while(picks.length<3&&rest2.length){
    const idx=Math.floor(S.rng()*Math.min(rest2.length,5));
    picks.push(rest2.splice(idx,1)[0]);}
  picks.forEach(p=>{S.recentPMQ.push(p.label);if(S.recentPMQ.length>9)S.recentPMQ.shift()});
  return picks;
}
function pmqPoolCount(){
  let n=0;for(const k in PMQ_PHR)n+=PMQ_PHR[k].length;
  n+=Object.keys(ISSUES).length+GE_PETS.length;
  n+=GE_PLACES.length*2; // incident-fed topics: dept + local per place
  return n;
}
function pmqsResolve(S,topicK,style){
  let t;
  if(topicK&&typeof topicK==="object")t=topicK;
  else{const topics=pmqsTopics(S);t=topics.find(x=>x.k===topicK)||topics[0];}
  const sev=t.bad;
  let roll=S.rng();
  if(S.meta.phase==="government"){
    // you answer
    const base={own:0.55+(S.pols.capital/300),pivot:0.5+S.mediaIndex/150,joke:0.5+S.mediaIndex/120,pledge:0.7}[style]??0.5;
    const win=roll<base;
    if(style==="pledge"){applyEffects(S,{app:1,promise:"PMQs pledge on "+t.label});frontPage(S,"A PLEDGE AT THE DESPATCH BOX","Made under fire on "+t.label+". The grid did not approve this. The grid will cope.");return{win:true,t}}
    if(win){applyEffects(S,{app:1.5,media:2,oppHit:-1});frontPage(S,"PM WINS THE EXCHANGES","On "+t.label+", to the visible relief of the front bench.")}
    else{applyEffects(S,{app:-1.5-sev*0.15,media:-2});frontPage(S,"SIX QUESTIONS, NO ANSWERS","The clip on "+t.label+" is brutal and loopable.")}
    return{win,t};
  } else {
    const base={forensic:0.6,theatrical:0.5+S.mediaIndex/140,statesman:0.55}[style]??0.5;
    const win=roll<base+sev*0.02;
    if(win){applyEffects(S,{poll:0.7+sev*0.06,media:2,gov:{app:-1.2},capital:2});frontPage(S,"LOTO DRAWS BLOOD","Six questions on "+t.label+"; the PM visibly checks the clock.")}
    else{applyEffects(S,{poll:-0.5,media:-2});frontPage(S,"PM SWATS THE ATTACK","Your "+t.label+" gambit dies; their benches do the comedy 'more!' wave.")}
    return{win,t};
  }
}



/* ---------- the spectrum engine: answers move votes between parties ---------- */
function partyIssuePos(k,iss){const a2=ISSUE_AXIS[iss];if(!a2)return 0;
  return clamp(PARTIES[k].ideal[a2[0]==="s"?"s":"e"]*a2[1],-2,2)}
function answerShift(S,iss,pos){
  if(!iss||!ISSUE_AXIS[iss])return 0;
  const me=S.meta.party,old=(S.stance&&S.stance[iss])??0;
  const nw=clamp(old*0.65+pos*0.5,-2,2);
  const a2=ISSUE_AXIS[iss];
  applyIdeo(S,a2[0]==="s"?{e:0,s:(nw-old)*0.5}:{e:(nw-old)*0.5,s:0});
  S.stance[iss]=nw;
  let gain=0;const moves=[];
  for(const p of POLL_PARTIES){if(p===me)continue;
    const tp=partyIssuePos(p,iss);
    const before=Math.max(0,1.6-Math.abs(old-tp));
    const after=Math.max(0,1.6-Math.abs(nw-tp));
    const steal=clamp((after-before)*0.55*((S.polls[p]||5)/16),-1.2,1.2);
    S.polls[p]=clamp((S.polls[p]||5)-steal,1,55);gain+=steal;
    if(Math.abs(steal)>=0.12)moves.push([p,steal]);}
  S.polls[me]=clamp((S.polls[me]||20)+gain,1,57);
  const t=Object.values(S.polls).reduce((x,y)=>x+y,0);
  for(const k2 of POLL_PARTIES)S.polls[k2]=S.polls[k2]/t*96;
  S.pols.pollMe=S.polls[me];if(S.opp)S.opp.gov.poll=S.polls[S.opp.gov.party];
  answerShift._last=moves.sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
  return gain;
}

/* ---------- the interview engine ---------- */
function interviewBuild(S,fmtKey){
  const fmt=INTERVIEW_FORMATS[fmtKey];
  const sev=pmqsTopics(S).map(t=>t.k);
  const pool=QBANK.filter(q=>!q.cond||q.cond(S));
  const topical=pool.filter(q=>sev.includes(q.k));
  const rest=pool.filter(q=>!sev.includes(q.k));
  for(let i=rest.length-1;i>0;i--){const j=Math.floor(S.rng()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]]}
  const qs=[...topical,...rest].slice(0,fmt.n).map(q=>({
    k:q.k,
    q:q.q.replace("%MIG%",String(Math.round(S.svc.mig))).replace("%WEAK%",S.pols.unity<40?"finished":"untested"),
    opts:q.opts}));
  return{fmt:fmtKey,qs};
}
function interviewAnswer(S,opt,reach,issueK){
  const pos=opt[1]||0;
  const gain=answerShift(S,issueK,pos)*reach;
  const pub=issueK&&S.pubop?(S.pubop[issueK]||0):0;
  let score=(1.1-Math.min(2.2,Math.abs(pos*0.8-pub)))+gain*2;
  if(Math.abs(pos)===2&&S.rng()<0.18){ // strong meat sometimes gets clipped out of context
    applyEffects(S,{media:-1.6,app:-0.6});score-=1.4;}
  if(pos===0&&S.rng()<0.10){ // and fence-sitting sometimes reads as evasive
    applyEffects(S,{media:-0.8});score-=0.6;}
  return score+(S.rng()-.5)*1.2;
}
function interviewFinish(S,fmtKey,score,n){
  const fmt=INTERVIEW_FORMATS[fmtKey];const avg=score/Math.max(n,1);
  if(avg>0.85){applyEffects(S,{poll:1.1*fmt.reach,media:2.2,app:1.2});
    frontPage(S,"A COMMANDING PERFORMANCE","The clips are good. The enemy's group chats are quiet. A rare clean win on television.");
    log(S,"Interview: triumph");return"triumph"}
  if(avg>0.1){applyEffects(S,{media:0.8});
    frontPage(S,"A STEADY OUTING","No wounds taken, none inflicted. In this business, that's a draw that feels like a win.");
    log(S,"Interview: fine");return"fine"}
  applyEffects(S,{poll:-0.9*fmt.reach,media:-2,app:-1});
  frontPage(S,"A CAR-CRASH INTERVIEW","One answer chases you out of the studio and around the internet. The grid is cancelled; the apology is drafted.");
  log(S,"Interview: car crash");return"crash";
}
/* ---------- opposition bills ---------- */
function enactOppBill(S,billId){
  const bill=BILLS.find(b=>b.id===billId);
  if(!bill||S.usedBills.includes(billId))return{ok:false};
  if(S.pols.capital<6)return{ok:false,msg:"Not enough capital (need 6)."};
  applyEffects(S,{capital:-6});
  S.usedBills.push(billId);
  const G=S.opp.gov;
  const ide=k=>PARTIES[k]?PARTIES[k].ideal.e:0;
  let symp=0;
  for(const k of Object.keys(PARTIES)){if(k===S.meta.party||k===G.party)continue;
    const dist=Math.abs(ide(k)-((bill.ideo&&bill.ideo.e)||0));
    if(dist<=1.0)symp+=Math.round((S.house?(S.house.rows.find(r=>r.key===k)||{seats:0}).seats:10)*0.7);}
  const rebels=Math.round((S.house?(S.house.rows.find(r=>r.key===G.party)||{seats:340}).seats:340)*clamp((42-G.approval)/140,0,0.12));
  const ayes=S.party.seats+symp+rebels;
  const noes=650-18-ayes;
  const pass=ayes>noes;
  if(pass){S.score.billsPassed++;applyEffects(S,bill.fx);applyIdeo(S,bill.ideo);
    applyEffects(S,{poll:2.2,capital:10,gov:{app:-3}});
    frontPage(S,"THE OPPOSITION WRITES THE LAW",`${bill.n} passes ${ayes}–${noes} over the government's dead body — ${rebels} of their own MPs rebelled. Humiliation is too small a word.`);
    log(S,"PMB PASSED: "+bill.n)}
  else{applyEffects(S,{poll:0.6,gov:{app:-0.8}});
    frontPage(S,"FORCED TO VOTE IT DOWN",`${bill.n} falls ${ayes}–${noes}, but every government MP is now on the record against it. The leaflets write themselves.`);
    log(S,"PMB defeated: "+bill.n)}
  return{ok:true,pass,ayes,noes,bill};
}
/* ---------- cross-party statecraft ---------- */
function relOf(S,k){S.partyRel=S.partyRel||{};return S.partyRel[k]||0}
function bumpRel(S,k,v){S.partyRel=S.partyRel||{};S.partyRel[k]=clamp((S.partyRel[k]||0)+v,-40,40)}
function partySummit(S,k){
  if(S.pols.capital<4)return{ok:false,msg:"Not enough capital."};
  applyEffects(S,{capital:-4});bumpRel(S,k,8);
  frontPage(S,"TEA WITH "+(REAL_LEADERS[k]||PARTIES[k].name).toUpperCase(),"Ninety minutes, two communiqués, one careful photograph. Westminster reads the body language like scripture.");
  log(S,"Summit with "+PARTIES[k].name);return{ok:true};
}
function poachMP(S,k){
  if(S.pols.capital<8)return{ok:false,msg:"Not enough capital (need 8)."};
  applyEffects(S,{capital:-8});
  const ide=x=>PARTIES[x].ideal.e;
  const p=sig((S.polls[S.meta.party]-S.polls[k])/8+relOf(S,k)/40-Math.abs(ide(S.meta.party)-ide(k))*0.5-0.2);
  if(S.rng()<p){
    if(!houseSeatTransfer(S,S.meta.party,k,1)){applyEffects(S,{capital:4});return{ok:true,win:false}}
    applyEffects(S,{poll:0.4,unity:2});S.polls[k]=clamp(S.polls[k]-0.4,1,55);
    frontPage(S,"DEFECTION","A sitting "+PARTIES[k].name+" MP crosses to you, live on the evening news. "+(REAL_LEADERS[k]||"Their leader")+" calls it 'a betrayal'; you call it 'a homecoming'.");
    log(S,"Poached an MP from "+PARTIES[k].name);return{ok:true,win:true}}
  bumpRel(S,k,-8);applyEffects(S,{sleaze:2});
  frontPage(S,"THE POACH THAT FAILED","Your overture leaks. "+(REAL_LEADERS[k]||"Their leader")+" reads your texts out at their conference, to sustained laughter.");
  log(S,"Failed poach from "+PARTIES[k].name);return{ok:true,win:false};
}
function proposePact(S,k){
  if(S.meta.phase!=="opposition")return{ok:false,msg:"Pacts are an opposition game."};
  if(k===S.opp.gov.party)return{ok:false,msg:"They are the government."};
  if(S.pols.capital<6)return{ok:false,msg:"Not enough capital (need 6)."};
  applyEffects(S,{capital:-6});
  const ide=x=>PARTIES[x].ideal.e;
  const dist=Math.abs(ide(S.meta.party)-ide(k));
  if(dist>1.3){frontPage(S,(REAL_LEADERS[k]||PARTIES[k].name).toUpperCase()+" SAYS NO","Politely, publicly, and within the hour. Some bridges are oceans.");bumpRel(S,k,-4);return{ok:true,win:false}}
  const p=sig(relOf(S,k)/22+((S.polls[k]<(({lab:31,con:28,lib:13,ref:16,grn:7,res:5})[k]||8))?0.5:-0.4)-dist*0.5);
  if(S.rng()<p){S.flags.pactWith=k;
    frontPage(S,"THE PACT","You and "+(REAL_LEADERS[k]||PARTIES[k].name)+" agree to stand aside for each other in the marginals. The government calls it a stitch-up, nervously.");
    log(S,"Electoral pact with "+PARTIES[k].name);return{ok:true,win:true}}
  bumpRel(S,k,-6);
  frontPage(S,"PACT TALKS COLLAPSE","Hours of secret talks end with a frosty two-line statement and mutual briefing. So it goes.");
  return{ok:true,win:false};
}
function proposeMerger(S,k){
  if(S.pols.capital<12)return{ok:false,msg:"Not enough capital (need 12)."};
  const ide=x=>PARTIES[x].ideal.e;
  if(relOf(S,k)<20)return{ok:false,msg:"They barely take your calls. Build the relationship first (summits)."};
  if(S.polls[k]>=7)return{ok:false,msg:"They're polling too well to fold themselves into you."};
  if(Math.abs(ide(S.meta.party)-ide(k))>0.9)return{ok:false,msg:"Ideologically it's a non-starter."};
  applyEffects(S,{capital:-12});
  const p=sig(relOf(S,k)/16-1.0);
  if(S.rng()<p){
    const their=S.house?(S.house.rows.find(r=>r.key===k)||{seats:0}).seats:0;
    const gain=Math.max(0,their);
    houseSeatTransfer(S,S.meta.party,k,gain);
    S.polls[S.meta.party]=clamp(S.polls[S.meta.party]+S.polls[k]*0.65,1,57);
    S.polls[k]=1.2;S.flags["merged_"+k]=true;
    applyEffects(S,{unity:-12,poll:0});
    frontPage(S,"TWO PARTIES BECOME ONE","The "+PARTIES[k].name+" name retires after one last conference singalong. Their members are yours now — and so are their feuds.");
    log(S,"MERGED with "+PARTIES[k].name);return{ok:true,win:true,gain}}
  bumpRel(S,k,-10);
  frontPage(S,"MERGER TALKS IMPLODE","'They wanted a takeover, not a marriage,' their negotiator briefs. Months of trust, spent in an afternoon.");
  return{ok:true,win:false};
}

/* ---------- confidence votes ---------- */
function runConfVote(S){
  const p=sig((S.pols.unity-33)/8+S.pols.capital/55-0.2);
  delete S.flags._confVote;delete S.flags._oconfVote;S.flags._confCool=true;S.flags._oconfCool=true;
  if(S.rng()<p){applyEffects(S,{unity:12,app:2});frontPage(S,"THE LEADER SURVIVES","The ballot: closer than the smiles suggest. The rebels return to the long grass to reload.");log(S,"WON confidence vote");return true}
  S.meta.over=true;frontPage(S,"DEFENESTRATED","The party that giveth taketh away, by secret ballot, before tea.");log(S,"LOST confidence vote");return false;
}

/* ---------- elections ---------- */
function computeElection(S,boost,opts){
  const P=PARTIES[S.meta.party];
  const isGov=S.meta.phase==="government";
  const econMood=1.4*S.econ.g-1.1*Math.max(0,S.econ.infl-2)-0.8*(S.econ.unemp-4.2);
  const rivalKey=isGov?P.rival:S.opp.gov.party;
  const me=clamp((S.polls?S.polls[S.meta.party]:30)+(boost||0)+econMood*0.15,10,57);
  const rows=[{n:P.name+" (you)",key:S.meta.party,v:me,c:P.col,you:true},
    {n:PARTIES[rivalKey].name+(isGov?"":" (gov)"),key:rivalKey,
     v:clamp((S.polls?S.polls[rivalKey]:28)+(S.rng()*3-1.5),8,52),c:PARTIES[rivalKey].col}];
  for(const k of Object.keys(PARTIES)){if(k===S.meta.party||k===rivalKey||k==="snp")continue;
    rows.push({n:PARTIES[k].name,key:k,v:Math.max(2,(S.polls?S.polls[k]:8)+(S.rng()*2-1)),c:PARTIES[k].col})}
  rows.push({n:"SNP",key:"snp",v:Math.max(1.5,S.polls?S.polls.snp:3),c:PARTIES.snp.col});
  let pollErr=0;
  if(opts&&opts.shock){pollErr=(S.rng()*2-1)*2.4;
    rows[0].v=Math.max(6,rows[0].v+pollErr);rows[1].v=Math.max(6,rows[1].v-pollErr*0.6);}
  if(S.flags.pactWith&&!(opts&&opts.projection)){const pr=rows.find(r=>r.key===S.flags.pactWith);
    rows[0].v+=1.2;if(pr)pr.v+=0.4;rows[1].v=Math.max(6,rows[1].v-0.9);}
  const tot=rows.reduce((a,r)=>a+r.v,0);rows.forEach(r=>{r.v=r.v/tot*96;r.seats=0});
  const youIdx=0;
  const regions=ELECT_REGIONS.map(([key,label,seats])=>{
    const ws=rows.map(r=>{
      let w=(PARTIES[r.key]&&PARTIES[r.key].region)?(PARTIES[r.key].region[key]??1):1;
      let s=r.v*w;
      return Math.pow(Math.max(s,0.01),3)});
    const sum=ws.reduce((a,b)=>a+b,0);
    const alloc=rows.map((r,i)=>Math.floor(seats*ws[i]/sum));
    let used=alloc.reduce((a,b)=>a+b,0);
    while(used<seats){const fr=rows.map((r,i)=>seats*ws[i]/sum-alloc[i]);alloc[fr.indexOf(Math.max(...fr))]++;used++}
    alloc.forEach((s,i)=>rows[i].seats+=s);
    let wi=0;alloc.forEach((s,i)=>{if(s>alloc[wi])wi=i});
    return{key,label,seats,winner:rows[wi].n,col:rows[wi].c,mine:alloc[youIdx],breakdown:alloc.slice()};
  });
  rows.push({n:"NI & others",key:"ni",v:1.8,c:"#777",seats:18});
  return{rows,regions,pollErr};
}
function settleElectionWin(S,mySeats){
  S.party.seats=mySeats;S.score.electionsWon++;S.meta.termStart=S.meta.month;
  if(S.meta.phase==="opposition"){
    S.meta.phase="government";S.meta.becamePM=true;
    S.pols.oppName=(typeof REAL_LEADERS!=="undefined"&&REAL_LEADERS[PARTIES[S.meta.party].rival])||pickR(S,D_FN)+" "+pickR(S,D_LN);S.pols.oppStr=45;
    S.opp=null;applyEffects(S,{capital:25,unity:10,app:4});
    frontPage(S,"THE KEYS TO NUMBER TEN","From the wilderness to the front door. The civil service has already changed the photos; the in-tray has not changed at all.");
    log(S,"WON POWER — now Prime Minister");
  } else {
    applyEffects(S,{capital:20,unity:8});
    frontPage(S,"FIVE MORE YEARS",`Majority ${S.majority}. The honeymoon starts now and lasts, by convention, eleven days.`);
    log(S,"Re-elected: majority "+S.majority);
  }
}
function settleElectionLoss(S){
  if(S.meta.phase==="government"){
    // fall to opposition — career continues
    const newGov=PARTIES[S.meta.party].rival;
    S.meta.phase="opposition";S.party.seats=Math.max(150,Math.round(S.party.seats*0.62));delete S.flags.minority;
    S.opp={gov:{party:newGov,pm:S.pols.oppName,approval:50,poll:36,fatigue:0,lastBlunder:null,monthsIn:0},
      electionDue:58,warchest:3};
    S.pols.pollMe=basePoll(S)-4;applyEffects(S,{unity:-10,capital:-10});
    frontPage(S,"THE REMOVAL VAN","It was, it turns out, idling for a reason. "+S.opp.gov.pm+" is Prime Minister by lunchtime; you are Leader of the Opposition by teatime, pending the plotters.");
    log(S,"LOST POWER — now Leader of the Opposition");
    return"survive";
  }
  // lost AS opposition: party patience depends on gains
  const gained=S.pols.pollMe>basePoll(S)+1.5;
  if(gained){S.opp.electionDue=58;applyEffects(S,{unity:-6,poll:-1});frontPage(S,"CLOSE, BUT","Gains, momentum, a hung-ish parliament — and yet the other side of the door. The party, narrowly, lets you stay.");log(S,"Lost the election; survived as leader");return"survive"}
  S.meta.over=true;frontPage(S,"THE PARTY MOVES ON","Defeat without progress is a verdict. The shadow cabinet's tributes are warm enough to be insulting.");log(S,"Deposed after election defeat");return"deposed";
}

/* ---------- TV debate ---------- */
function debateResolve(S,topicK,style){
  if(style==="safe")return{d:0.8,txt:"Solid, unspectacular, nothing for the enemy's clip factory."};
  if(style==="attack"){const hit=S.rng()<0.55+S.mediaIndex/150;
    return{d:hit?2.2:-1.6,txt:hit?"The line lands; their candidate blinks on camera.":"Too hot — the snap polls call you 'aggressive'."}}
  const hit=S.rng()<0.5+(S.pols.approval-42)/100;
  return{d:hit?2.8:-1,txt:hit?"For ninety seconds the country imagines it. Gold.":"Big words, few numbers; the fact-checkers feast."};
}


/* ---------- coalition arithmetic & the sitting House ---------- */
function coalitionAnalysis(rows){
  const gb=rows.filter(r=>r.key!=="ni");
  const sorted=[...gb].sort((a,b)=>b.seats-a.seats);
  const top=sorted[0];
  if(top.seats>325)return{majority:true,top,combo:[],total:top.seats,
    text:`<b>${top.n.replace(" (you)","")}</b> majority of ${top.seats*2-650}`};
  const ide=k=>PARTIES[k]?PARTIES[k].ideal.e:0;
  const second=sorted[1];
  const partners=sorted.slice(1).filter(r=>r.seats>0&&r!==second&&Math.abs(ide(r.key)-ide(top.key))<=1.35)
    .sort((a,b)=>Math.abs(ide(a.key)-ide(top.key))-Math.abs(ide(b.key)-ide(top.key)));
  const combo=[];let tot=top.seats;
  for(const p of partners){if(tot>325)break;combo.push(p);tot+=p.seats;}
  const viable=tot>325;
  const tn=top.n.replace(" (you)","").replace(" (gov)","");
  const names=combo.map(c=>c.n.replace(" (you)","").replace(" (gov)",""));
  let text;
  if(viable)text=`<b>HUNG</b> — likeliest deal: <b>${tn}</b> + ${names.join(" + ")} (${tot} seats → majority ${tot*2-650})`;
  else if(combo.length)text=`<b>HUNG</b> — best on offer: <b>${tn}</b> + ${names.join(" + ")} reaches only ${tot} — ${326-tot} short. A wobbly minority, or another election`;
  else text=`<b>HUNG</b> — <b>${tn}</b> has no plausible partners. Minority rule, vote by vote`;
  return{majority:false,top,combo,total:tot,viable,text};
}
function setHouse(S,R){S.house={rows:JSON.parse(JSON.stringify(R.rows)),regions:JSON.parse(JSON.stringify(R.regions||[])),when:dateStr(S)}}
function makeInitialHouse(S){
  if(typeof REAL_HOUSE!=="undefined"){
    const order=[...REAL_HOUSE.order];
    const rows=order.map(k=>({n:PARTIES[k].name+(k===S.meta.party?" (you)":(k===REAL_GOV.party&&S.meta.party!==REAL_GOV.party?" (gov)":"")),
      key:k,c:PARTIES[k].col,seats:REAL_HOUSE.seats[k],you:k===S.meta.party}));
    rows.push({n:REAL_HOUSE.othLabel,key:"ni",c:"#777",seats:REAL_HOUSE.seats.oth});
    const regions=ELECT_REGIONS.map(([key,label,seats])=>{
      const br=REAL_HOUSE.regions[key].slice();
      let wi=0;br.forEach((s2,i)=>{if(s2>br[wi])wi=i});
      const youIdx=order.indexOf(S.meta.party);
      return{key,label,seats,winner:rows[wi].n,col:rows[wi].c,mine:youIdx>=0?br[youIdx]:0,breakdown:br};});
    setHouse(S,{rows,regions});
    return;
  }
  const R=projectElection(S);
  const youIdx=0;
  let diff=S.party.seats-R.rows[youIdx].seats;
  R.rows[youIdx].seats=S.party.seats;
  // take/give the difference from the largest other parties (never below zero)
  const others=R.rows.filter(r=>!r.you&&r.key!=="ni");
  let guard=0;
  while(diff>0&&guard++<2000){const o=others.filter(x=>x.seats>0).sort((a,b)=>b.seats-a.seats)[0];if(!o)break;o.seats--;diff--;}
  while(diff<0&&guard++<4000){const o=others.sort((a,b)=>b.seats-a.seats)[0];o.seats++;diff++;}
  // rebuild regional breakdowns proportionally from the adjusted national rows
  if(R.regions){const tots=R.rows.map(r=>r.seats);
    R.regions.forEach(rg=>{
      if(!rg.breakdown)return;
      const gb=rg.seats;
      const weights=rg.breakdown.map((b,i)=>b+0.15*(tots[i]||0)/650*gb);
      const wsum=weights.reduce((a,b)=>a+b,0)||1;
      const alloc=weights.map(w=>Math.floor(gb*w/wsum));
      let used=alloc.reduce((a,b)=>a+b,0);
      while(used<gb){const fr=weights.map((w,i)=>gb*w/wsum-alloc[i]);alloc[fr.indexOf(Math.max(...fr))]++;used++;}
      rg.breakdown=alloc;rg.mine=alloc[0];
      let wi=0;alloc.forEach((s2,i)=>{if(s2>alloc[wi])wi=i});
      rg.winner=R.rows[wi].n;rg.col=R.rows[wi].c;
    });}
  setHouse(S,R);
}
function houseSeatTransfer(S,toKey,fromKey,n){
  if(!S.house)return false;n=n||1;
  const rows=S.house.rows;
  const to=rows.find(r=>r.key===toKey),from=rows.find(r=>r.key===fromKey);
  if(!to||!from)return false;
  let moved=0;
  const ti=rows.indexOf(to),fi=rows.indexOf(from);
  for(let i=0;i<n&&from.seats>0;i++){
    from.seats--;to.seats++;moved++;
    const rg=(S.house.regions||[]).filter(r=>r.breakdown&&r.breakdown[fi]>0)
      .sort((a,b)=>b.breakdown[fi]-a.breakdown[fi])[0];
    if(rg){rg.breakdown[fi]--;rg.breakdown[ti]++;
      if(to.you)rg.mine++;if(from.you)rg.mine=Math.max(0,rg.mine-1);
      let wi=0;rg.breakdown.forEach((s2,j)=>{if(s2>rg.breakdown[wi])wi=j});
      rg.winner=rows[wi].n;rg.col=rows[wi].c;}}
  const yr=rows.find(r=>r.you);if(yr)S.party.seats=yr.seats;
  return moved>0;
}
function biggestRival(S){
  return S.house.rows.filter(r=>!r.you&&r.key!=="ni"&&r.seats>0).sort((a,b)=>b.seats-a.seats)[0];
}
function houseByelection(S,gain){
  if(!S.house)return;
  const me=S.meta.party;
  if(gain){const from=S.meta.phase==="opposition"?S.opp.gov.party:(biggestRival(S)||{}).key;
    if(from)houseSeatTransfer(S,me,from,1);}
  else{const to=(biggestRival(S)||{}).key;if(to)houseSeatTransfer(S,to,me,1);}
}

/* ---------- legacy ---------- */
function legacy(S){
  if(S.flags.mad)return 0;
  const avgApp=S.hist.app.reduce((a,b)=>a+b,0)/S.hist.app.length;
  const econD=(S.econ.gdpIdx-100)*0.5-Math.max(0,S.econ.infl-3)*1.1-(S.econ.unemp-4.3)*1.4;
  let sc=8+S.meta.govMonths*0.28+S.meta.oppMonths*0.10+S.score.electionsWon*8+(S.meta.becamePM?6:0)
    +(avgApp-42)*0.85+econD+S.score.warsWon*7-S.score.warsLost*11-S.score.scandals*2.2
    +S.score.kept*2-S.score.broken*2.5+(S.world.standing-55)/4+Math.min(S.score.crisesResolved,6)*2.5
    +Math.min(S.score.billsPassed,8)*1.2+(S.flags.scotGone&&S.meta.party!=="snp"?-16:0)+(S.flags.hague?-40:0)+(S.flags.nuked&&!S.flags.mad?-45:0);
  return clamp(Math.round(sc),0,100);
}
function verdictText(sc,S){
  if(S.flags.hague)return"You attempted to invade France. France. The Cabinet resigned before the second sentence of your address. Historians have agreed, unusually, to simply not.";
  if(S.flags.mad)return"Four minutes of leadership, measured properly. The historians, such as remain, do not rank you. The survivors do.";
  if(S.flags.nuked)return"You used it first. The war ended; so did Britain's word, Britain's seat at every table, and the idea of Britain that made the rest worth having.";
  if(sc>=85)return"They will argue about you for a century and name things after you in the meantime — airports, doctrines, a particularly stubborn breed of negotiating position. You changed the weather.";
  if(sc>=70)return"A genuinely consequential career: the graphs bend where you pushed them. History will be kind, mostly because you survived long enough to draft the first version of it.";
  if(sc>=50)return"A solid innings. Several things demonstrably improved; several others were creatively postponed. Statues: regional. Memoirs: respectable airport placement.";
  if(sc>=35)return"The memoirs will do numbers; the legacy won't. You were, in the durable Westminster phrase, 'better than the alternative' — a compliment with the structural integrity of RAAC.";
  if(sc>=15)return"A cautionary tale taught at GCSE. Your name is now a verb in the Treasury, and not a flattering one.";
  return"Out-lasted by perishable groceries. The official portrait was painted from memory, briskly.";
}

/* ---------- interaction router ---------- */
function nextInteraction(S){
  if(S.meta.over)return{type:"over"};
  if(S.flags._resign)return{type:"end",kind:"resign"};
  if(S.flags._confVote||S.flags._oconfVote)return{type:"confvote"};
  if(S.meta.phase==="government"){
    if(S.meta.month-S.meta.termStart>=58&&!S.flags._electionNow)return{type:"election",forced:true};
    if(S.flags._electionNow)return{type:"election",forced:false};
    if(S.moy===2&&!S.flags["bud"+S.year])return{type:"budget"};
  } else {
    if(S.opp.electionDue<=0)return{type:"election",forced:true};
    // AI PM snap election when riding high
    if(S.opp.gov.approval>52&&S.opp.electionDue>10&&S.rng()<0.08){S.opp.electionDue=0;return{type:"election",forced:true,snap:true}}
  }
  if((S.meta.month%2===1)&&!S.flags["pmq"+S.meta.month])return{type:"pmqs"};
  return{type:"event",card:drawCard(S)};
}

/* ---------- exports ---------- */
const ENGINE={newGame,rehydrate,tick,nextInteraction,drawCard,resolveOption,genEvent,genComboCount,answerShift,partyIssuePos,pmqPoolCount,maybeShock,houseSeatTransfer,declareWar,nukeStrike,requestQE,appointGovernor,appointPeers,whipAction,whipJobs,lordsObstruct,fiscalPledge,intelOp,rapport,bumpRapport,adviceFor,applyEffects,swapMinister,debateResolve,projectElection,initPolls,POLL_PARTIES,coalitionAnalysis,setHouse,houseByelection,interviewBuild,interviewAnswer,interviewFinish,enactOppBill,partySummit,poachMP,proposePact,proposeMerger,setStance,stanceBonus,relOf,
  enactFiscal,leanOnBank,enactBill,computeDivision,regionAction,pmqsTopics,pmqsResolve,
  runConfVote,runByelection,runOppByelection,runLocals,runIndyref,warOffensive,warNegotiate,
  computeElection,settleElectionWin,settleElectionLoss,legacy,verdictText,frontPage,log,tick_news,
  revenueOf,spendOf,dateStr,clamp,sig};
globalThis.__MANDATE__=ENGINE;
if(typeof module!=="undefined")module.exports=ENGINE;
