/* =====================================================================
   MANDATE 2.0 — UI (DOM only; engine stays pure)
   ===================================================================== */
"use strict";
if(typeof document!=="undefined"){(function(){
const E=__MANDATE__;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let S=null,cfg={scenario:"fresh",difficulty:"standard",party:null,bg:null},busy=false;
const LSK="mandate_save_v4",LSA="mandate_ach_v2";

/* ---------- helpers ---------- */
function toast(t){const d=document.createElement("div");d.className="toast";d.innerHTML=t;$("#toasts").appendChild(d);setTimeout(()=>d.remove(),3600)}
function ach(id,label){try{const a=JSON.parse(localStorage.getItem(LSA)||"{}");if(a[id])return;a[id]=1;localStorage.setItem(LSA,JSON.stringify(a));toast("<b>ACHIEVEMENT</b> · "+label)}catch(e){}}
function save(){try{localStorage.setItem(LSK,JSON.stringify(S))}catch(e){}}
function show(id){const cur=document.querySelector(".screen.on");
  if(cur&&("#"+cur.id)===id)return;
  $$(".screen").forEach(s=>s.classList.remove("on"));$(id).classList.add("on");window.scrollTo({top:0})}
function modal(html,locked){$("#modal").innerHTML=html;$("#modal").classList.add("on");$("#shade").classList.add("on");$("#shade").dataset.locked=locked?"1":""}
function closeModal(){$("#modal").classList.remove("on");$("#shade").classList.remove("on")}
$("#shade").addEventListener("click",()=>{if($("#shade").dataset.locked!=="1")closeModal()});
const fmt1=x=>(Math.round(x*10)/10).toFixed(1);
function flash(el){el.classList.remove("bump");void el.offsetWidth;el.classList.add("bump")}

/* ---------- title & setup wizard ---------- */
$("#bt-new").onclick=()=>startWizard();
$("#bt-continue").onclick=openCareers;
try{$("#bt-continue").disabled=false}catch(e){}
$("#bt-method").onclick=()=>{modal(`<div class="lbl gold">The maths</div><h3>What's under the bonnet</h3>
 <div class="body"><p>A monthly macro model: growth mean-reverts to potential set by investment, tax drag, energy shocks, Bank rate and migration-driven labour supply; inflation anchors at 2% but is pushed by deficits, energy and minimum-wage settings; the Bank reacts mechanically (unless you lean on it, which the gilt market notices); debt compounds at deficit − g·debt. Market trust below 25 staples you to an emergency budget.</p>
 <p>Public services are stocks: NHS waiting lists, crime, migration, housing and school indices respond to departmental spending with lags, and feed approval. Your party is factions with ideal points on a two-axis plane; every act has an ideology vector. Divisions in the Commons are computed rebel-by-rebel. Elections: cube-law seats with a Scotland block; in opposition an AI government runs the country while you stalk it.</p>
 <p class="dim">Everything compounds. Nothing is free. New here? Pick GENTLE and a fresh majority.</p></div>
 <div class="menu"><button class="btn ghost" onclick="document.getElementById('modal').classList.remove('on');document.getElementById('shade').classList.remove('on')">Close</button></div>`)};
try{if(localStorage.getItem(LSK))$("#bt-continue").disabled=false}catch(e){}

/* ---------- onboarding wizard: one decision per step ---------- */
let wizStep=0;
const WIZ=[["The scenario","Where does your story begin?"],
           ["The difficulty","How cruel is Britain feeling?"],
           ["Your party","Whose rosette do you wear?"],
           ["Your past life","What were you before all this?"],
           ["Sign here","Name yourself, check the ballot paper, take the stage."]];
function startWizard(){cfg={scenario:null,difficulty:null,party:null,bg:null,seed:null};wizStep=0;show("#scr-setup");renderWiz()}
function partyStatLine(sc,p){
  const mj=p.govSeats*2-650;
  switch(sc){
    case"fresh":return"IN POWER · majority "+mj+" · unity "+p.unity;
    case"landslide":return"IN POWER · landslide majority 180 · expectations: brutal";
    case"sterling":return"IN POWER · majority "+mj+" · inflation 9.8% · markets at 28/100";
    case"coldwind":return"IN POWER · majority "+mj+" · Moscow probing · defence gutted";
    case"minority":return"IN POWER · NO MAJORITY — 316 seats · confidence & supply";
    case"knife":return"OPPOSITION · "+p.oppSeats+" seats · polls level · election due within 18 months";
    default:return"OPPOSITION · "+p.oppSeats+" seats · "+(326-p.oppSeats)+" more needed for a majority";
  }
}
function renderWiz(){
  $("#wizcrumb").textContent="New career · step "+(wizStep+1)+" of "+WIZ.length;
  $("#wiztitle").textContent=WIZ[wizStep][0];
  $("#wizsub").textContent=WIZ[wizStep][1];
  $("#wizdots").innerHTML=WIZ.map((_,i)=>`<span class="wd ${i<wizStep?"done":i===wizStep?"now":""}"></span>`).join("");
  const B=$("#wizbody");
  const pickAndGo=set=>e=>{set();e.currentTarget.classList.add("sel");setTimeout(()=>{wizStep++;renderWiz()},170)};
  if(wizStep===0){
    B.innerHTML=`<div class="pick" id="pickscenario"></div>`;const sc=$("#pickscenario");
    for(const[k,s]of Object.entries(SCENARIOS)){
      const d=document.createElement("div");d.className="opt"+(cfg.scenario===k?" sel":"");
      d.innerHTML=`<h4>${s.name}</h4><p>${s.desc}</p><div class="stats">${s.phase==="government"?"START: IN POWER":"START: OPPOSITION"}</div>`;
      d.onclick=pickAndGo(()=>{if(cfg.scenario!==k)cfg.party=null;cfg.scenario=k});sc.appendChild(d);}
  }else if(wizStep===1){
    B.innerHTML=`<div class="pick" id="pickdiff"></div>`;const df=$("#pickdiff");
    for(const[k,x]of Object.entries(DIFFS)){
      const d=document.createElement("div");d.className="opt"+(cfg.difficulty===k?" sel":"");
      d.innerHTML=`<h4>${x.name}</h4><p>${x.desc}</p>`;
      d.onclick=pickAndGo(()=>cfg.difficulty=k);df.appendChild(d);}
  }else if(wizStep===2){
    B.innerHTML=`<div class="pick" id="pickparty"></div>`;const pp=$("#pickparty");
    const isOpp=SCENARIOS[cfg.scenario].phase==="opposition";
    for(const[k,p]of Object.entries(PARTIES)){
      if(p.aiOnly)continue;
      const d=document.createElement("div");d.className="opt"+(cfg.party===k?" sel":"");
      d.innerHTML=`<h4><span class="sw" style="background:${p.col}"></span>${p.name}</h4>
        <p>${isOpp?(p.oppBlurb||p.blurb):(p.blurb||p.oppBlurb)}</p>
        <div class="stats">${partyStatLine(cfg.scenario,p)}</div>`;
      d.onclick=pickAndGo(()=>cfg.party=k);pp.appendChild(d);}
  }else if(wizStep===3){
    B.innerHTML=`<div class="pick" id="pickbg"></div>`;const pb=$("#pickbg");
    for(const[k,b]of Object.entries(BGS)){
      const d=document.createElement("div");d.className="opt"+(cfg.bg===k?" sel":"");
      d.innerHTML=`<h4>${b.name}</h4><p>${b.blurb}</p><div class="stats">${b.stats}</div>`;
      d.onclick=pickAndGo(()=>cfg.bg=k);pb.appendChild(d);}
  }else{
    const s=SCENARIOS[cfg.scenario],p=PARTIES[cfg.party],b=BGS[cfg.bg];
    B.innerHTML=`<div class="field"><div class="lbl" style="margin-bottom:8px">Your name</div>
      <input type="text" id="pmname" maxlength="28" placeholder="e.g. Alex Sterling"></div>
      <div class="panelbox" style="max-width:580px"><h4>Your setup</h4><div class="cab">
       <div class="row2"><span>Scenario</span><span><b>${s.name}</b> <a class="wizchg" data-s="0">change</a></span></div>
       <div class="row2"><span>Difficulty</span><span><b>${DIFFS[cfg.difficulty].name}</b> <a class="wizchg" data-s="1">change</a></span></div>
       <div class="row2"><span>Party</span><span><b>${p.name}</b> <a class="wizchg" data-s="2">change</a></span></div>
       <div class="row2"><span>Past life</span><span><b>${b.name}</b> <a class="wizchg" data-s="3">change</a></span></div>
       <div class="row2"><span>Opening position</span><span class="dim small">${partyStatLine(cfg.scenario,p)}</span></div>
      </div></div>
      <div class="menu"><button class="btn" id="bt-begin">Start career</button></div>`;
    $$(".wizchg").forEach(a=>a.onclick=()=>{wizStep=+a.dataset.s;renderWiz()});
    $("#bt-begin").onclick=()=>{
      cfg.name=($("#pmname").value||"").trim()||"The Leader";
      S=E.newGame(cfg);
      if(S.meta.phase==="government")E.frontPage(S,"KEYS TO NUMBER TEN",`${S.meta.pm} of the ${PARTIES[S.meta.party].name} kisses hands. ${S.flags.minority?"No majority — every vote a cliffhanger.":"Majority of "+S.majority+"."} The removal van idles, out of respect, around the corner.`);
      else E.frontPage(S,"A NEW LEADER OF THE OPPOSITION",`${S.meta.pm} takes the worst job in politics: ${PARTIES[S.meta.party].name}, ${S.party.seats} seats, a government to hunt and ${S.opp.electionDue} months till the country chooses.`);
      E.log(S,S.meta.phase==="government"?"Entered No. 10.":"Elected Leader of the Opposition.");
      enterGame();
    };
  }
}
$("#bt-wizback").onclick=()=>{if(wizStep===0)show("#scr-title");else{wizStep--;renderWiz()}};


/* ---------- outcome deltas + stat explainers ---------- */
function snapStats(){return{app:S.pols.approval,poll:S.pols.pollMe,unity:S.pols.unity,cap:S.pols.capital,trust:S.econ.trust,med:S.mediaIndex,stand:S.world.standing}}
function toastDiff(b4){
  const now=snapStats();
  const items=[["APPROVAL",now.app-b4.app,"%"],["POLLS",now.poll-b4.poll,"%"],["UNITY",now.unity-b4.unity,""],["CAPITAL",now.cap-b4.cap,""],["MARKETS",now.trust-b4.trust,""],["PRESS",now.med-b4.med,""],["STANDING",now.stand-b4.stand,""]]
    .filter(x=>Math.abs(x[1])>=0.5)
    .map(x=>`${x[0]} <b class="${x[1]>0?"good":"bad"}">${x[1]>0?"+":""}${fmt1(x[1])}${x[2]}</b>`);
  if(items.length)toast(items.slice(0,5).join(" &nbsp;·&nbsp; "));
}
const HELP={
 app:["Approval","How much the public likes YOU. Driven by the economy, services, scandals and wins. It drags your party's polls with it."],
 poll:["Polls","Your party's national vote share. The tracker in the Office shows every party. Polls decide elections."],
 seat:["Seats / Majority","326 seats wins power. In government this shows your majority; in opposition, your seat count."],
 unity:["Party unity","How happy your MPs are. Below ~32 they trigger a confidence vote and can sack you."],
 gdp:["Growth","The economy's speed. Growth lifts approval; recessions sink governments."],
 infl:["Inflation","Above ~3% it eats approval fast. The Bank raises rates to fight it, which slows growth."],
 cap:["Capital","Your political fuel. Every action costs some. Refills +4 a month. Spend it where it counts."],
 elect:["Next election","How long until the country votes. In government you can also call one early from Campaign HQ."]};
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-h]");if(!t)return;
  const h=HELP[t.dataset.h];if(!h)return;
  modal(`<div class="lbl gold">What this means</div><h3>${h[0]}</h3><div class="body">${h[1]}</div>
   <div class="menu"><button class="btn ghost" id="hclose">Got it</button></div>`);
  $("#hclose").onclick=closeModal;
});
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];


/* ---------- careers: save slots ---------- */
const SLOTKEY="mandate_careers_v1";
function listSlots(){try{return JSON.parse(localStorage.getItem(SLOTKEY)||"[]")}catch(e){return[]}}
function writeSlots(s){try{localStorage.setItem(SLOTKEY,JSON.stringify(s.slice(0,6)))}catch(e){}}
function saveSlot(){
  if(!S)return;
  const slots=listSlots().filter(x=>x.id!==S.meta.runId);
  slots.unshift({id:S.meta.runId,ts:Date.now(),
    label:`${S.meta.pm} — ${PARTIES[S.meta.party].name} · ${E.dateStr(S)} · ${S.meta.phase==="government"?"PM":"Opposition"}`,
    data:JSON.parse(JSON.stringify(S))});
  writeSlots(slots);toast("<b>CAREER SAVED</b>");
}
function openCareers(){
  const slots=listSlots();
  modal(`<div class="lbl gold">Your careers</div><h3>Saved games</h3>
   ${slots.length?`<div class="opts">${slots.map(s2=>`<button class="choice" data-load="${s2.id}">${s2.label}<small>saved ${new Date(s2.ts).toLocaleString()}</small></button>`).join("")}</div>
   <div class="menu"><button class="btn ghost small" id="cc-del">Delete all</button><button class="btn ghost" id="cc-close">Close</button></div>`
   :`<div class="body dim">No saved careers yet. Start one, then use MENU → Save career.</div>
   <div class="menu"><button class="btn ghost" id="cc-close">Close</button></div>`}`);
  $("#cc-close").onclick=closeModal;
  const del=$("#cc-del");if(del)del.onclick=()=>{writeSlots([]);closeModal();toast("Careers wiped.")};
  $$("#modal [data-load]").forEach(b2=>b2.onclick=()=>{
    const s2=listSlots().find(x=>x.id===b2.dataset.load);if(!s2)return;
    S=E.rehydrate(JSON.parse(JSON.stringify(s2.data)));closeModal();enterGame(true)});
}
function openMenu(){
  modal(`<div class="lbl gold">Menu</div><h3>${S.meta.pm} — ${PARTIES[S.meta.party].name}</h3>
   <div class="opts">
    <button class="choice" id="mm-resume">Back to the game</button>
    <button class="choice" id="mm-save">Save this career<small>Keeps a slot you can return to from the title screen</small></button>
    <button class="choice" id="mm-help">How the game works</button>
    <button class="choice" id="mm-change">Change career<small>Leave this one — you'll be asked about saving first</small></button>
   </div>`);
  $("#mm-resume").onclick=closeModal;
  $("#mm-save").onclick=()=>{saveSlot();closeModal()};
  $("#mm-help").onclick=()=>{closeModal();openPrimer(true)};
  $("#mm-change").onclick=()=>{
    modal(`<h3>Leave this career?</h3><div class="body">Save it first and you can come back any time from the title screen.</div>
     <div class="menu"><button class="btn" id="lv-save">Save & leave</button><button class="btn red" id="lv-no">Leave without saving</button><button class="btn ghost" id="lv-cancel">Cancel</button></div>`);
    $("#lv-cancel").onclick=closeModal;
    $("#lv-save").onclick=()=>{saveSlot();try{localStorage.removeItem(LSK)}catch(e){};closeModal();show("#scr-title")};
    $("#lv-no").onclick=()=>{try{localStorage.removeItem(LSK)}catch(e){};closeModal();show("#scr-title")};
  };
}
/* ---------- first-time primer ---------- */
function openPrimer(force){
  if(!force&&S.flags._primed)return;S.flags._primed=true;
  const cards=[
   ["One turn = one month","Press ADVANCE. Events will interrupt you — pick an option, watch what it does to your numbers (it pops up at the bottom)."],
   ["Capital is your fuel","Almost every action costs capital. You get +4 back each month. Run dry and you can only sit there."],
   ["The rooms do the work","Treasury sets taxes and spending. Commons passes laws. Situation runs the world. Cabinet keeps your team loyal. Press keeps the papers sweet. Campaign HQ wins elections."],
   ["Polls decide everything","The Office tracker shows every party. The countdown to the next election is always top-right. Campaign HQ shows who'd win if it were today."],
   ["How you win","Win elections, stay above 32 unity so your party doesn't knife you, and rack up a legacy score history will respect."]];
  let i=0;
  const stepP=()=>{const c=cards[i];
    modal(`<div class="lbl gold">How it works · ${i+1} / ${cards.length}</div><h3>${c[0]}</h3>
     <div class="body">${c[1]}</div>
     <div class="menu"><button class="btn" id="primer-next">${i+1<cards.length?"Next":"Let's go"}</button>${i+1<cards.length?'<button class="btn ghost" id="primer-skip">Skip</button>':""}</div>`,true);
    $("#primer-next").onclick=()=>{i++;if(i<cards.length)stepP();else{closeModal();save()}};
    const sk=$("#primer-skip");if(sk)sk.onclick=()=>{closeModal();save()};
  };stepP();
}

/* ---------- game shell ---------- */
let tab="hub",prev={};
function enterGame(loaded){
  if(!S.meta.runId)S.meta.runId="run-"+S.meta.seed;
  const col=PARTIES[S.meta.party].col;
  document.documentElement.style.setProperty("--party",col);
  document.documentElement.style.setProperty("--party-soft",col+"33");
  show("#scr-game");tab="hub";renderAll();save();if(!loaded)openPrimer(false)}
$$("#gametabs button").forEach(b=>b.onclick=()=>{tab=b.dataset.t;renderAll()});
$("#bt-advance").onclick=()=>{if(!busy)advance()};
$("#bt-menu").onclick=openMenu;
$("#bt-help").onclick=()=>openPrimer(true);

function renderAll(){const vp=$("#viewport");const sy=vp?vp.scrollTop:window.scrollY;renderHUD();renderTicker();
  $$("#gametabs button").forEach(b=>b.classList.toggle("on",b.dataset.t===tab));
  $$(".tabpane").forEach(p=>{const on=p.id==="tab-"+tab;p.classList.toggle("on",on);if(!on)p.innerHTML=""});
  if(tab==="office")$("#tab-office").innerHTML='<div class="duo"><div id="ov-left"></div><div id="ov-right"></div></div>';
  ({hub:renderHub,office:renderOverview,cabinet:renderCabinet,treasury:renderTreasury,commons:renderParliament,world:renderWorld,media:renderMedia,campaign:renderCampaign})[tab]();
  if(vp)vp.scrollTop=sy;else window.scrollTo({top:sy});
}
function renderHUD(){
  const p=S.pols,e=S.econ,gov=S.meta.phase==="government";
  $("#hud-name").textContent=S.meta.pm+" · "+PARTIES[S.meta.party].name+(gov?" · PM":" · Leader of the Opposition");
  $("#hud-date").textContent=E.dateStr(S)+(S.world.war?" · ⚔ AT WAR":"");
  const due=gov?Math.max(0,58-(S.meta.month-S.meta.termStart)):Math.max(0,S.opp.electionDue);
  const te=$("#t-elect");if(te){te.textContent="≤"+due+"m";te.className="v num "+(due>24?"good":due>9?"warn":"bad")}
  const adv=$("#bt-advance");if(adv)adv.innerHTML="ADVANCE — "+(MONTHS[(S.moy+1)%12]).toUpperCase()+" ▸";
  const cf=$("#capfill");if(cf)cf.style.width=S.pols.capital+"%";
  const tiles=[["t-app",p.approval,"%",v=>v>49?"good":v>37?"warn":"bad"],
    ["t-poll",p.pollMe,"%",v=>v>(gov?40:S.opp.gov.poll)?"good":"warn"],
    ["t-seat",gov?S.majority:S.party.seats,"",v=>gov?(v>30?"good":v>0?"warn":"bad"):(v>250?"good":"warn")],
    ["t-unity",p.unity,"",v=>v>52?"good":v>36?"warn":"bad"],
    ["t-gdp",e.g,"%",v=>v>1.5?"good":v>0?"warn":"bad"],
    ["t-infl",e.infl,"%",v=>v<3?"good":v<6?"warn":"bad"],
    ["t-cap",p.capital,"",v=>v>40?"good":v>15?"warn":"bad"]];
  for(const[id,v,u,cls]of tiles){const el=$("#"+id);const txt=(Math.abs(v)>=100?Math.round(v):fmt1(v))+u;
    if(el.textContent!==txt){el.textContent=txt;flash(el)}el.className="v num "+cls(v);
    const d=$("#d-"+id.slice(2));if(d){const pv=prev[id]??v;const dd=v-pv;
      d.innerHTML=Math.abs(dd)<0.05?'<span class="fl">·</span>':`<span class="${dd>0?"up":"dn"}">${dd>0?"+":""}${fmt1(dd)}</span>`;}
    prev[id]=v;}
  $("#k-poll").textContent=gov?"Poll share":"You v Gov "+fmt1(S.opp.gov.poll)+"%";
  $("#k-seat").textContent=gov?"Majority":"Your seats";
}
function renderTicker(){
  const items=S.ticker.length?S.ticker:["The nation awaits developments…"];
  $("#tickerin").innerHTML=(items.join(" &nbsp;•&nbsp; ")+" &nbsp;•&nbsp; ").repeat(2);
}

/* ---------- OVERVIEW (Office) ---------- */
const PNAMES={lab:"Labour",con:"Conservative",lib:"Lib Dem",ref:"Reform UK",grn:"Green",snp:"SNP"};
function renderOverview(){
  const gov=S.meta.phase==="government";
  const govParty=gov?S.meta.party:S.opp.gov.party;
  const due=gov?Math.max(0,58-(S.meta.month-S.meta.termStart)):Math.max(0,S.opp.electionDue);
  const warB=S.world.war?`<div class="warbanner">⚔ ${S.world.war.name} — support ${Math.round(S.world.war.support)}% · casualties ${Math.round(S.world.war.cas)}</div>`:"";
  $("#ov-left").innerHTML=warB+`
   <div class="panelbox"><h4>National polls — all parties</h4>
    <svg id="polls" viewBox="0 0 600 130" preserveAspectRatio="none" class="bigchart"></svg>
    <div class="polleg" id="polleg"></div></div>
   <div class="panelbox"><h4>What's been happening</h4><div class="log">${S.log.map(l=>`<div><b>${l.m}</b>${l.t}</div>`).join("")||"<div>Nothing yet. It won't last.</div>"}</div></div>`;
  drawPolls("#polls","#polleg");
  $("#ov-right").innerHTML=`
   <div class="panelbox"><h4>The state of play</h4><div class="cab">
    <div class="row2"><span>In power</span><span><b style="color:${PARTIES[govParty].col}">${PARTIES[govParty].name}</b>${gov?" — you":" — "+S.opp.gov.pm}</span></div>
    <div class="row2"><span>${gov?(S.flags.minority?"Working position":"Majority"):"Your seats"}</span><span class="num">${gov?(S.flags.minority?"minority — "+S.party.seats+" seats":S.majority):S.party.seats}</span></div>
    <div class="row2"><span>Next election</span><span class="num warn">within ${due} months</span></div>
    <div class="row2"><span>If it were today</span><span class="num" id="ov-proj">…</span></div>
   </div></div>
   <span class="seclbl" style="margin-top:14px;display:block">TOMORROW'S FRONT PAGE</span>${paperHTML()}
   <div class="panelbox"><h4>The country, at a glance</h4><div class="cab">
    ${[["NHS waiting list",fmt1(S.svc.nhsWait)+"m people",S.svc.nhsWait<6?"good":S.svc.nhsWait<7.5?"warn":"bad"],
       ["Net migration",Math.round(S.svc.mig)+"k / year",S.svc.mig<450?"good":S.svc.mig<650?"warn":"bad"],
       ["Crime",Math.round(S.svc.crime)+" (100 = normal)",S.svc.crime<98?"good":S.svc.crime<110?"warn":"bad"],
       ["Homes built",Math.round(S.svc.housing)+"k / year",S.svc.housing>220?"good":"warn"],
       ["Debt",Math.round(S.econ.debt)+"% of GDP",S.econ.debt<100?"warn":"bad"],
       ["Deficit",fmt1(S.fiscalDeficit)+"% of GDP",S.fiscalDeficit<3.5?"good":S.fiscalDeficit<5?"warn":"bad"],
       ["Unemployment",fmt1(S.econ.unemp)+"%",S.econ.unemp<4.8?"good":"warn"],
       ["Market confidence",Math.round(S.econ.trust)+"/100",S.econ.trust>55?"good":S.econ.trust>35?"warn":"bad"],
       ["Scandal pressure",Math.round(S.pols.sleaze)+"/100",S.pols.sleaze<35?"good":S.pols.sleaze<60?"warn":"bad"],
       ["World standing",Math.round(S.world.standing)+"/100",S.world.standing>55?"good":"warn"]]
     .map(x=>`<div class="row2"><span>${x[0]}</span><span class="num ${x[2]}">${x[1]}</span></div>`).join("")}</div></div>`;
  const P=E.projectElection(S);const top=[...P.rows].sort((x,y)=>y.seats-x.seats)[0];
  $("#ov-proj").innerHTML=top.seats>325?`<span style="color:${top.c}">${top.n.replace(" (you)","")}</span> majority ${top.seats*2-650}`:`hung — <span style="color:${top.c}">${top.n.replace(" (you)","")}</span> largest`;
}
function drawPolls(sel,legSel){
  const H=S.hist.polls;if(!H)return;
  const keys=E.POLL_PARTIES.filter(k=>H[k]);
  const N=H[keys[0]].length;if(N<2)return;
  const x=i=>i/(N-1)*600,y=v=>126-(v/55)*120;
  const grid=[10,20,30,40,50].map(g=>`<line x1="0" y1="${y(g)}" x2="600" y2="${y(g)}" class="pgrid"/><text x="3" y="${y(g)-2}" class="pgl">${g}%</text>`).join("");
  const lines=keys.map(k=>{
    const me=k===S.meta.party;
    const p=H[k].map((v,i)=>`${i?"L":"M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
    return`<path d="${p}" fill="none" stroke="${PARTIES[k].col}" stroke-width="${me?2.6:1.3}" opacity="${me?1:.75}"/>`}).join("");
  const el=$(sel);if(el)el.innerHTML=grid+lines;
  const leg=$(legSel);if(leg)leg.innerHTML=keys.sort((a,b2)=>S.polls[b2]-S.polls[a])
    .map(k=>`<span class="pl-chip${k===S.meta.party?" me":""}"><i style="background:${PARTIES[k].col}"></i>${PNAMES[k]} <b class="num">${fmt1(S.polls[k])}%</b></span>`).join("");
}
function paperHTML(){const pp=S.paper;
  return`<div class="paper"><div class="mh">${pp.mh}</div>
   <div class="strap"><span>${E.dateStr(S)}</span><span>£1.20 · EST. 1888</span></div>
   <h2>${pp.head}</h2><div class="sub2">${pp.sub}</div><div class="mkts">${pp.mkts||""}</div></div>`}

/* ---------- TREASURY ---------- */
let staged=null;
function renderTreasury(){
  const gov=S.meta.phase==="government";
  staged=staged||Object.assign({},S.fiscal);
  const grp=(g,title)=>`<div class="fisgroup"><h4>${title}</h4>${Object.entries(FISCAL_META).filter(([k,m])=>m.grp===g).map(([k,m])=>{
    if(m.toggle)return`<div class="sl"><label>${m.n}<span class="num">${staged[k]?"ON":"OFF"}</span></label>
      <input type="range" id="sl-${k}" min="0" max="1" step="1" value="${staged[k]}" data-f="${k}"></div>`;
    return`<div class="sl"><label>${m.n}<span class="num" id="fv-${k}">${staged[k]}${m.unit}</span></label>
      <input type="range" id="sl-${k}" min="${m.min}" max="${m.max}" step="${m.max-m.min>20?1:0.1}" value="${staged[k]}" data-f="${k}"></div>`}).join("")}</div>`;
  $("#tab-treasury").innerHTML=`
   <div class="duo">
    <div>${grp("tax","Taxation")}${grp("dial","The dials")}</div>
    <div>${grp("spend","Departmental spending (% GDP)")}
     <div class="fiscalbar" id="fiscalbar"></div>
     <div class="menu">
      ${gov?`<button class="btn" id="bt-enact">${S.moy===2&&!S.flags["bud"+S.year]?"Deliver the Budget (free)":"Enact fiscal statement · 4 cap"}</button>
      <button class="btn ghost" id="bt-bank">Lean on the Bank · 8 cap</button>`
      :`<button class="btn" id="bt-platform">Publish the platform</button>`}
      <button class="btn ghost" id="bt-reset">Reset</button>
     </div>
     <p class="dim small">${gov?"Changes are real and immediate: the gilt market marks your homework live.":"In opposition the sliders are your manifesto platform — credibility is judged against the real economy."}</p>
    </div></div>`;
  $$("#tab-treasury input[type=range]").forEach(inp=>inp.oninput=()=>{
    const k=inp.dataset.f;staged[k]=+inp.value;
    const v=$("#fv-"+k);if(v)v.textContent=staged[k]+FISCAL_META[k].unit;
    fiscalBar()});
  fiscalBar();
  if(gov){$("#bt-enact").onclick=()=>{
      const isBud=S.moy===2&&!S.flags["bud"+S.year];
      const r=E.enactFiscal(S,staged,isBud);
      if(!r.ok){toast(r.msg||"Nothing to enact.");return}
      if(isBud)S.flags["bud"+S.year]=true;
      staged=null;toast("<b>ENACTED</b> · deficit "+fmt1(r.deficit)+"%");renderAll();save()};
    $("#bt-bank").onclick=()=>{const r=E.leanOnBank(S);if(!r.ok){toast("Not enough capital.");return}renderAll();save()};}
  else $("#bt-platform").onclick=()=>{S.platform=Object.assign({},staged);S.flags.platformSet=true;
    E.applyEffects(S,{poll:.6,trustM:2});E.frontPage(S,"THE PLATFORM","Costed, laminated, launched in a factory that makes something symbolic. The IFS calls it 'a document'.");
    toast("<b>PLATFORM</b> · published");renderAll();save()};
  $("#bt-reset").onclick=()=>{staged=Object.assign({},S.fiscal);renderTreasury()};
}
function fiscalBar(){
  const rev=E.revenueOf(staged),sp=E.spendOf(staged),d=sp-rev;
  $("#fiscalbar").innerHTML=`<span>REV <b class="num">${fmt1(rev)}%</b></span><span>SPEND <b class="num">${fmt1(sp)}%</b></span>
   <span>DEFICIT <b class="num ${d>5?"bad":d>3.5?"warn":"good"}">${fmt1(d)}%</b></span>
   <span>MARKETS WILL ${d>5?'<b class="bad">REVOLT</b>':d>3.5?'<b class="warn">GRUMBLE</b>':'<b class="good">APPROVE</b>'}</span>`;
}

/* ---------- PARLIAMENT ---------- */
function renderParliament(){
  const gov=S.meta.phase==="government";
  if(!gov){$("#tab-commons").innerHTML=`<div class="panelbox"><h4>Opposition day</h4>
    <p class="body">You control the order paper once a month. Pick the wound to press.</p>
    <div class="opts">${E.pmqsTopics(S).map(t=>`<button class="choice" data-k="${t.k}">Motion on ${t.label}<small>Force government MPs to defend the indefensible on the record</small></button>`).join("")}</div></div>`;
    $$("#tab-commons .choice").forEach(b=>b.onclick=()=>{
      if(S.flags["oday"+S.meta.month]){toast("You've used this month's opposition day.");return}
      S.flags["oday"+S.meta.month]=true;E.applyEffects(S,{gov:{app:-1.2},poll:.4,capital:-2});
      E.frontPage(S,"OPPOSITION DAY AMBUSH","Government backbenchers vote, visibly wincing, to declare everything fine.");
      toast("<b>MOTION</b> · pressure applied");renderAll();save()});
    return}
  const avail=BILLS.filter(b=>!S.usedBills.includes(b.id));
  $("#tab-commons").innerHTML=`<div class="lbl">The legislative machine · majority ${S.majority} ${S.flags.minority?"· MINORITY":""}</div>
   <div class="billgrid">${avail.map(b=>{
     const d=E.computeDivision(S,b,false);
     return`<div class="bill"><h4>${b.n}</h4><p>${b.desc}</p>
      <div class="divpreview"><div style="width:${d.ayes/650*100}%" class="${d.pass?"aye":"nay"}"></div></div>
      <div class="small dim num">forecast ${d.ayes}–${d.noes} ${d.pass?"PASSES":"FALLS"} · ${d.rebels} rebels · cost ${b.cost} cap</div>
      <div class="menu tight"><button class="btn small" data-b="${b.id}" data-w="0">Put to the House</button>
      <button class="btn ghost small" data-b="${b.id}" data-w="1">Whip hard (+8 cap)</button></div></div>`}).join("")}</div>
   ${S.usedBills.length?`<div class="lbl" style="margin-top:18px">On the statute book</div><div class="dim small">${S.usedBills.map(id=>BILLS.find(b=>b.id===id).n).join(" · ")}</div>`:""}`;
  $$("#tab-commons .btn[data-b]").forEach(b=>b.onclick=()=>{
    const b4=snapStats();
    const r=E.enactBill(S,b.dataset.b,b.dataset.w==="1");
    if(!r.ok){toast(r.msg||"Not enough capital.");return}
    divisionTheatre(r);toastDiff(b4);save()});
}
function divisionTheatre(r){
  modal(`<div class="lbl gold">Division — ${r.bill.n}</div><h3>The House divides…</h3>
   <div class="divbig"><div><div class="num big" id="cnt-aye">0</div><div class="lbl">AYES</div></div>
   <div><div class="num big" id="cnt-no">0</div><div class="lbl">NOES</div></div></div>
   <div class="body" id="div-res" style="text-align:center;min-height:48px"></div>
   <div class="menu" style="justify-content:center"><button class="btn ghost" id="div-close" disabled>…</button></div>`,true);
  let a=0,n=0;const ia=setInterval(()=>{
    a=Math.min(r.div.ayes,a+13);n=Math.min(r.div.noes,n+13);
    $("#cnt-aye").textContent=a;$("#cnt-no").textContent=n;
    if(a>=r.div.ayes&&n>=r.div.noes){clearInterval(ia);
      $("#div-res").innerHTML=r.div.pass?`<b class="good">THE AYES HAVE IT.</b>${r.div.rebelNames.length?"<br><span class='dim small'>Rebels: "+r.div.rebelNames.join("; ")+"</span>":""}`
        :`<b class="bad">THE NOES HAVE IT.</b><br><span class="dim small">The whips' office lights stay on all night.</span>`;
      const c=$("#div-close");c.disabled=false;c.textContent=r.div.pass?"Onward":"Limp on";c.onclick=()=>{closeModal();renderAll()};}
  },40);
}

/* ---------- WORLD: the real map ---------- */
let selRegion=null,VB={x:0,y:0,w:1000,h:500},dragging=null;
const LL=(lon,lat)=>[ (lon+180)/360*1000, (90-lat)/180*500 ];
function landPath(pts){return "M"+pts.map(p=>{const[x,y]=LL(p[0],p[1]);return x.toFixed(1)+","+y.toFixed(1)}).join("L")+"Z"}
function applyVB(){const s=$("#worldmap");if(s)s.setAttribute("viewBox",`${VB.x} ${VB.y} ${VB.w} ${VB.h}`)}
function zoomAt(f,cx,cy){const w=Math.max(140,Math.min(1000,VB.w*f));const h=w/2;
  VB.x=Math.max(0,Math.min(1000-w,cx-(cx-VB.x)*(w/VB.w)));
  VB.y=Math.max(0,Math.min(500-h,cy-(cy-VB.y)*(h/VB.h)));
  VB.w=w;VB.h=h;applyVB()}
function renderWorld(){
  const lands=WORLD_LANDS.map(l=>`<path class="land" d="${landPath(l[1])}"/>`).join("");
  const grat=[...Array(11)].map((_,i)=>`<line x1="${i*100}" y1="0" x2="${i*100}" y2="500" class="grat"/>`).join("")
    +[...Array(5)].map((_,i)=>`<line x1="0" y1="${(i+1)*83.3}" x2="1000" y2="${(i+1)*83.3}" class="grat"/>`).join("");
  const nodes=Object.entries(REGIONS).map(([k,m])=>{
    const[x,y]=LL(m.lon,m.lat);
    const r=S.world.regions[k];const hue=Math.round(8+(r.rel+100)/200*120);
    const dep=S.mil.dep[k];const war=S.world.war&&S.world.war.theatre===k;
    return`<g class="rnode${selRegion===k?" sel":""}${war?" war":""}" data-r="${k}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      ${war?'<circle r="16" class="pulse"/>':""}
      <circle r="${m.home?8:6}" style="fill:hsl(${hue},55%,${m.home?55:42}%)"/>
      ${r.occupied?'<text y="-11" class="rocc">⚑ OCCUPIED</text>':""}
      <text y="16" class="rlabel">${m.n.toUpperCase()}</text>
      ${dep&&(dep.brig||dep.car)?`<text y="26" class="rdep">${"▲".repeat(dep.brig||0)}${dep.car?"⚓":""}</text>`:""}
    </g>`}).join("");
  $("#tab-world").innerHTML=`<div class="duo wide">
   <div><div class="seclbl">THE WORLD <span class="dim small">— scroll to zoom · drag to move · click a country</span></div>
    <div id="mapframe">
     <svg id="worldmap" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="1000" height="500" class="ocean"/>${grat}${lands}${nodes}</svg>
     <div id="mapzoom"><button id="wm-zin">+</button><button id="wm-zout">−</button><button id="wm-zreset">⌂</button></div>
    </div>
    <div class="milbar num">FORCES — ${S.mil.brig} brigades at home · ${4-S.mil.brig} deployed · carrier ${S.mil.car?"in port":"at sea"} · world standing ${Math.round(S.world.standing)}/100${S.world.war?` · ⚔ AT WAR: ${S.world.war.name} (support ${Math.round(S.world.war.support)}%)`:""}</div>
   </div>
   <div id="regionpanel">${regionPanel()}</div></div>`;
  applyVB();
  const svg=$("#worldmap");
  $$("#worldmap .rnode").forEach(g=>g.addEventListener("click",e=>{e.stopPropagation();selRegion=g.dataset.r;renderWorld()}));
  $("#wm-zin").onclick=()=>zoomAt(0.72,VB.x+VB.w/2,VB.y+VB.h/2);
  $("#wm-zout").onclick=()=>zoomAt(1.4,VB.x+VB.w/2,VB.y+VB.h/2);
  $("#wm-zreset").onclick=()=>{VB={x:0,y:0,w:1000,h:500};applyVB()};
  svg.addEventListener("wheel",e=>{e.preventDefault();
    const pt=svgPoint(svg,e);zoomAt(e.deltaY>0?1.18:0.85,pt.x,pt.y)},{passive:false});
  svg.addEventListener("pointerdown",e=>{dragging={x:e.clientX,y:e.clientY,vx:VB.x,vy:VB.y};svg.setPointerCapture(e.pointerId)});
  svg.addEventListener("pointermove",e=>{if(!dragging)return;
    const sc=VB.w/svg.getBoundingClientRect().width;
    VB.x=Math.max(0,Math.min(1000-VB.w,dragging.vx-(e.clientX-dragging.x)*sc));
    VB.y=Math.max(0,Math.min(500-VB.h,dragging.vy-(e.clientY-dragging.y)*sc));applyVB()});
  svg.addEventListener("pointerup",()=>dragging=null);
}
function svgPoint(svg,e){const r=svg.getBoundingClientRect();
  return{x:VB.x+(e.clientX-r.left)/r.width*VB.w,y:VB.y+(e.clientY-r.top)/r.height*VB.h}}
function regionPanel(){
  if(!selRegion)return`<div class="panelbox"><h4>Pick a country on the map</h4>
   <p class="body dim">Trade, summits, sanctions, aid, spy operations, troop deployments — or an invasion, if you've really thought it through. Greener dots like you more.</p></div>`;
  const k=selRegion,m=REGIONS[k],r=S.world.regions[k];
  const gov=S.meta.phase==="government";
  const can=c=>S.pols.capital>=c;
  let acts=gov?[
    ["summit","Hold a summit","+7 relations, +2 standing",5],
    ["trade","Push for a trade deal","needs decent relations · boosts growth",5],
    ["sanction","Impose sanctions","−15 relations · world approves only if they deserve it",4],
    ["aid","Send an aid package","+8 relations, +3 standing",4],
    ["covert","Covert operation","55% quiet win · 45% scandal",7],
    ["deploy","Deploy a brigade","deterrence · Moscow notices",0],
    ["recall","Bring a brigade home","—",0],
    ["carrier","Send the carrier","a 40,000-tonne message",0]]
   :[["summit","High-profile visit","look like a leader-in-waiting",5]];
  if(gov&&!m.home&&!r.occupied&&!S.world.war)acts.push(["invade","INVADE "+m.n.toUpperCase(),r.rel<-40?"they're hostile — a legal case exists":"unprovoked — the whole world will turn",15]);
  return`<div class="panelbox"><h4>${m.n} · ${m.cap}</h4>
   <div class="cab">
    <div class="row2"><span>Relations with the UK</span><span class="num ${r.rel>20?"good":r.rel<-20?"bad":"warn"}">${Math.round(r.rel)} / 100</span></div>
    <div class="row2"><span>Trade importance</span><span class="num">${r.trade}/10</span></div>
    ${S.mil.dep[k]&&S.mil.dep[k].brig?`<div class="row2"><span>Your forces here</span><span class="num">${S.mil.dep[k].brig} brigade(s)${S.mil.dep[k].car?" + carrier":""}</span></div>`:""}
    ${r.occupied?'<div class="row2"><span class="bad">⚑ UNDER BRITISH OCCUPATION</span><span class="dim small">costs money monthly — events will force a decision</span></div>':""}
   </div>
   <div class="opts" style="margin-top:10px">${acts.map(a=>
    `<button class="choice small" data-a="${a[0]}" ${a[3]&&!can(a[3])?"disabled":""}>${a[1]}<small>${a[2]}${a[3]?` · costs ${a[3]} capital${!can(a[3])?" — NOT ENOUGH":""}`:""}</small></button>`).join("")}</div></div>`;
}
document.addEventListener("click",e=>{
  const b=e.target.closest("#regionpanel .choice");if(!b||b.disabled)return;
  const act=b.dataset.a;
  if(act==="invade"){
    const m=REGIONS[selRegion],r0=S.world.regions[selRegion];
    modal(`<div class="lbl" style="color:var(--red)">Military action</div><h3>Invade ${m.n}?</h3>
     <div class="body">${selRegion==="france"?"The Chief of the Defence Staff removes his glasses very slowly.":r0.rel<-40?"A hostile state. Allies will grumble but follow. Wars are easy to start and expensive to finish.":"No mandate, no UN cover, no allies. Markets, friends and history will all answer at once — and not kindly."}</div>
     <div class="menu"><button class="btn red" id="invgo">Order the invasion</button><button class="btn ghost" id="invno">Stand down</button></div>`);
    $("#invno").onclick=closeModal;
    $("#invgo").onclick=()=>{closeModal();
      const b4=snapStats();
      const r=E.regionAction(S,selRegion,"invade");
      if(r.hague){endGame("hague");return}
      if(!r.ok){toast(r.msg||"Can't do that.");return}
      ach("warlord","Casus Belli — ordered an invasion");toastDiff(b4);renderAll();save()};
    return;
  }
  const b4=snapStats();
  const r=E.regionAction(S,selRegion,act);
  if(!r.ok){toast(r.msg||"Can't do that.");return}
  toastDiff(b4);renderAll();save();
});

/* ---------- MEDIA ---------- */
function renderMedia(){
  $("#tab-media").innerHTML=`<div class="lbl">The press · weighted index ${fmt1(S.mediaIndex)}</div>
   <div class="outgrid">${S.media.outlets.map((o,i)=>`<div class="panelbox"><h4>${o.n} <span class="dim small">· ${o.kind} · reach ${o.reach}</span></h4>
    <div class="track big"><div class="fill" style="width:${(o.stance+50)}%;background:${o.stance>10?"var(--bench)":o.stance<-10?"var(--red)":"var(--brass)"}"></div></div>
    <div class="small dim num">stance ${Math.round(o.stance)}</div>
    <div class="menu tight">
     <button class="btn ghost small" data-o="${i}" data-x="brief">Private briefing · 3 cap</button>
     <button class="btn ghost small" data-o="${i}" data-x="excl">Grant exclusive · 2 cap</button>
     ${o.kind==="tabloid"?`<button class="btn ghost small" data-o="${i}" data-x="yacht">Proprietor's yacht · 2 cap</button>`:""}
    </div></div>`).join("")}</div>`;
  $$("#tab-media .btn[data-o]").forEach(b=>b.onclick=()=>{
    const o=S.media.outlets[+b.dataset.o],x=b.dataset.x;
    const cost=x==="brief"?3:2;if(S.pols.capital<cost){toast("Not enough capital.");return}
    E.applyEffects(S,{capital:-cost});
    if(x==="brief"){o.stance=E.clamp(o.stance+6,-50,50);
      if(Math.random()<0.15){E.applyEffects(S,{sleaze:5});E.frontPage(S,"THE BRIEFING LEAKS","Your 'friends of the leader' quotes read differently in court font.");toast("<b>LEAKED</b>")}
      else toast("<b>BRIEFED</b> · "+o.n)}
    if(x==="excl"){o.stance=E.clamp(o.stance+8,-50,50);S.media.outlets.forEach(z=>{if(z!==o)z.stance=E.clamp(z.stance-2,-50,50)});toast("<b>EXCLUSIVE</b> · the others sulk")}
    if(x==="yacht"){o.stance=E.clamp(o.stance+10,-50,50);E.applyEffects(S,{sleaze:5});toast("<b>THE YACHT</b> · photos exist")}
    renderAll();save()});
}


/* ---------- THE CORRIDORS (hub) ---------- */
function renderHub(){
  const gov=S.meta.phase==="government";
  const lead=S.meta.phase==="government"?"":(" · "+(S.pols.pollMe-S.opp.gov.poll>=0?"+":"")+fmt1(S.pols.pollMe-S.opp.gov.poll)+" v gov");
  const rooms=[
   ["office","YOUR OFFICE",60,150,200,120,"approval "+Math.round(S.pols.approval)+"%"],
   ["cabinet",gov?"CABINET ROOM":"SHADOW CABINET",300,60,200,100,"unity "+Math.round(S.pols.unity)],
   ["treasury",gov?"HM TREASURY":"SHADOW TREASURY",540,60,200,100,"deficit "+fmt1(S.fiscalDeficit)+"%"],
   ["commons","COMMONS CHAMBER",300,260,200,100,gov?("majority "+S.majority):("seats "+S.party.seats)],
   ["world","SITUATION ROOM",540,260,200,100,S.world.war?("⚔ "+S.world.war.name):("standing "+Math.round(S.world.standing))],
   ["media","PRESS OFFICE",780,60,140,100,"press "+fmt1(S.mediaIndex)],
   ["campaign","CAMPAIGN HQ",780,260,140,100,"poll "+fmt1(S.pols.pollMe)+"%"+lead],
  ];
  const doors=`<path class="corridor" d="M260,210 H300 M500,110 H540 M500,310 H540 M740,110 H780 M740,310 H780 M400,160 V260 M640,160 V260 M160,150 V120 H300 M160,270 V310 H300"/>`;
  $("#tab-hub").innerHTML=`<div class="lbl" style="margin-top:10px">No. 10 — the corridors of power · ${E.dateStr(S)}</div>
   <svg id="hubmap" viewBox="0 0 960 420">
    <rect x="20" y="20" width="920" height="380" rx="6" class="hubwall"/>
    ${doors}
    ${rooms.map(r=>`<g class="room${r[0]==="world"&&S.world.war?" warroom":""}" data-t="${r[0]}">
      <rect x="${r[2]}" y="${r[3]}" width="${r[4]}" height="${r[5]}" rx="3"/>
      <text x="${r[2]+r[4]/2}" y="${r[3]+r[5]/2-8}" class="rmname">${r[1]}</text>
      <text x="${r[2]+r[4]/2}" y="${r[3]+r[5]/2+14}" class="rmstat">${r[6]}</text></g>`).join("")}
    <text x="480" y="44" class="hubtitle">${gov?"10 DOWNING STREET":"LEADER OF THE OPPOSITION'S OFFICE"}</text>
   </svg>
   <div class="hubstrip"><span class="lbl gold">Today's front page</span> <b>${S.paper.head}</b></div>`;
  $$("#hubmap .room").forEach(g=>g.onclick=()=>{tab=g.dataset.t;renderAll()});
}

/* ---------- CABINET ROOM ---------- */
function renderCabinet(){
  const gov=S.meta.phase==="government";
  const pre=gov?"":"Shadow ";
  $("#tab-cabinet").innerHTML=`<div class="lbl" style="margin:10px 0 2px">${pre}cabinet — real colleagues, live approval · replace 4 cap</div>
   <div class="mingrid">${S.cabinet.map((m,i)=>`<div class="minister">
     <div class="lbl">${pre}${m.role}</div><h4>${m.name}</h4>
     <div class="track"><div class="fill" style="width:${m.app}%;background:${m.app>45?"var(--bench)":m.app>30?"var(--brass)":"var(--red)"}"></div></div>
     <div class="small num dim">public approval ${Math.round(m.app)} · comp ${m.comp} · loyalty ${m.loyal} · charisma ${m.cha}</div>
     ${m.app>S.pols.approval+16?'<div class="small bad">⚠ more popular than you</div>':""}
     <div class="menu tight"><button class="btn ghost small" data-r="${i}">Replace</button></div></div>`).join("")}</div>
   <div class="duo" style="margin-top:18px">
    <div><div class="lbl">Factions · unity ${Math.round(S.pols.unity)}</div>
     ${S.party.factions.map((f,i)=>`<div class="panelbox"><h4>${f.name} · ${Math.round(f.w*100)}% of MPs · led by ${f.leader}</h4>
      <div class="track big"><div class="fill" style="width:${f.happy}%;background:${f.happy>55?"var(--bench)":f.happy>35?"var(--brass)":"var(--red)"}"></div></div>
      <div class="menu tight"><button class="btn ghost small" data-f="${i}" data-x="court">Court them · 4 cap</button>
      <button class="btn ghost small" data-f="${i}" data-x="pledge">Policy pledge</button></div></div>`).join("")}</div>
    <div><div class="lbl">Promises ledger</div>
     <div class="panelbox"><div class="cab">${S.promises.length?S.promises.map(p=>`<div class="row2"><span>${p.text}</span><span class="num ${p.status==="kept"?"good":p.status==="broken"?"bad":"dim"}">${p.status.toUpperCase()}</span></div>`).join(""):"<div class='dim'>No hostages to fortune. Yet.</div>"}</div></div>
     <div class="lbl" style="margin-top:14px">The bench</div>
     <div class="panelbox"><div class="cab">${(S.bench||[]).map(b=>`<div class="row2"><span>${b.name} <span class="dim small">(${b.fav})</span></span><span class="num dim">app ${Math.round(b.app)}</span></div>`).join("")||"<div class='dim'>Nobody left worth promoting. Worrying.</div>"}</div></div>
    </div></div>`;
  $$("#tab-cabinet .btn[data-r]").forEach(b=>b.onclick=()=>{
    const ri=+b.dataset.r;
    if(!(S.bench||[]).length){toast("The bench is bare.");return}
    modal(`<div class="lbl gold">Replace your ${S.cabinet[ri].role}</div><h3>Who gets the call?</h3>
     <div class="opts">${S.bench.map((x,j)=>`<button class="choice" data-j="${j}">${x.name}<small>approval ${Math.round(x.app)} · comp ${x.comp} · loyalty ${x.loyal} · prefers ${x.fav}</small></button>`).join("")}</div>
     <div class="menu"><button class="btn ghost" id="mclose">Leave it</button></div>`);
    $("#mclose").onclick=closeModal;
    $$("#modal .choice").forEach(c=>c.onclick=()=>{
      const r=E.swapMinister(S,ri,+c.dataset.j);closeModal();
      if(!r.ok){toast(r.msg||"Cannot.");return}
      toast("<b>RESHUFFLED</b>");renderAll();save()});
  });
  $$("#tab-cabinet .btn[data-f]").forEach(b=>b.onclick=()=>{
    const f=S.party.factions[+b.dataset.f];
    if(b.dataset.x==="court"){if(S.pols.capital<4){toast("Not enough capital.");return}
      E.applyEffects(S,{capital:-4});f.happy=E.clamp(f.happy+7,0,100);
      S.party.factions.forEach(o=>{if(o!==f)o.happy=E.clamp(o.happy-1,0,100)});
      toast("<b>"+f.name.toUpperCase()+"</b> · warmed");}
    else{E.applyEffects(S,{promise:"Pledge to "+f.name});f.happy=E.clamp(f.happy+10,0,100);
      S.party.factions.forEach(o=>{if(o!==f)o.happy=E.clamp(o.happy-2,0,100)});
      toast("<b>PLEDGED</b> · they will remember");}
    renderAll();save()});
}

/* ---------- CAMPAIGN HQ ---------- */
function renderCampaign(){
  const gov=S.meta.phase==="government";
  const due=gov?Math.max(0,58-(S.meta.month-S.meta.termStart)):Math.max(0,S.opp.electionDue);
  const target=S.flags.targetRegion;
  const P=E.projectElection(S);
  const sorted=[...P.rows].sort((a2,b2)=>b2.seats-a2.seats);
  const top=sorted[0];
  const verdict=top.seats>325?`<b style="color:${top.c}">${top.n.replace(" (you)","")}</b> wins with a majority of <b class="num">${top.seats*2-650}</b>`:`<b>HUNG PARLIAMENT</b> — <span style="color:${top.c}">${top.n.replace(" (you)","")}</span> the largest party`;
  $("#tab-campaign").innerHTML=`<div class="duo">
   <div>
    <div class="panelbox"><h4>IF THE ELECTION WERE TODAY — seat projection</h4>
     <div class="body" style="margin-bottom:6px">${verdict}</div>
     <div class="seatbar">${P.rows.map(r=>`<div style="width:${r.seats/650*100}%;background:${r.c}" title="${r.n} ${r.seats}"></div>`).join("")}</div>
     <div class="seatkey">${sorted.map(r=>`<span><span style="color:${r.c}">■</span> ${r.n.replace(" (you)"," — you")} <b class="num">${r.seats}</b></span>`).join(" ")}</div>
     ${electMapHTML(P.regions)}
    </div>
    <div class="panelbox"><h4>National polls</h4>
     <svg id="polls2" viewBox="0 0 600 130" preserveAspectRatio="none" class="bigchart"></svg>
     <div class="polleg" id="polleg2"></div></div>
   </div>
   <div>
    <div class="panelbox"><h4>The clock</h4><div class="cab">
     <div class="row2"><span>Next election</span><span class="num warn">within ${due} months</span></div>
     ${S.opp?`<div class="row2"><span>Campaign fund</span><span class="num">£${fmt1(S.opp.warchest)}m</span></div>`:""}
     <div class="row2"><span>Target region bonus</span><span class="num">${target?target.toUpperCase()+" ✓":"none picked"}</span></div>
    </div></div>
    <div class="panelbox"><h4>Pick a target region — extra effort where it matters</h4>
     <div class="opts">${ELECT_REGIONS.map(([k,label,seats])=>`<button class="choice small ${target===k?"selz":""}" data-tr="${k}">${label} <small>${seats} seats${target===k?" · TARGETED":""}</small></button>`).join("")}</div></div>
    ${gov?`<div class="panelbox"><h4>Go early?</h4><p class="body dim small">You can call an election whenever you like. The projection above is your honest odds.</p>
     <div class="menu tight"><button class="btn red small" id="bt-snap2">Call an election now · 20 capital</button></div></div>`
    :`<div class="panelbox"><h4>Fundraising</h4><p class="body dim small">Dinners, raffles, a man named Clive with opinions about crypto.</p>
     <div class="menu tight"><button class="btn ghost small" id="bt-fund" ${S.pols.capital<3?"disabled":""}>Fundraise · 3 capital</button></div></div>`}
   </div></div>`;
  drawPolls("#polls2","#polleg2");
  $$("#tab-campaign [data-tr]").forEach(b2=>b2.onclick=()=>{S.flags.targetRegion=b2.dataset.tr;toast("<b>TARGETED</b> · extra swing in "+b2.dataset.tr.toUpperCase());renderCampaign();save()});
  const sn=$("#bt-snap2");if(sn)sn.onclick=()=>{
    if(S.pols.capital<20){toast("Not enough capital (need 20).");return}
    modal(`<h3>Call the election?</h3><div class="body">Projection: ${verdict}. Once you ask the country, there's no taking it back.</div>
     <div class="menu"><button class="btn red" id="snapgo">Call it</button><button class="btn ghost" id="snapno">Not yet</button></div>`);
    $("#snapno").onclick=closeModal;
    $("#snapgo").onclick=()=>{closeModal();E.applyEffects(S,{capital:-20});S.flags._electionNow=true;advance()};};
  const fd=$("#bt-fund");if(fd)fd.onclick=()=>{
    if(S.pols.capital<3){toast("Not enough capital.");return}
    E.applyEffects(S,{capital:-3,chest:1.5});
    if(Math.random()<0.12){E.applyEffects(S,{sleaze:4});toast("<b>£1.5m RAISED</b> · Clive came with strings")}
    else toast("<b>£1.5m RAISED</b>");renderAll();save()};
}
function electMapHTML(regions){
  if(!regions)return"";
  return`<div class="electmap">${regions.map(r=>`<div class="eregion" style="border-color:${r.col}">
    <div class="ername">${r.label}</div>
    <div class="erbar" style="background:${r.col}"></div>
    <div class="erstat num">${r.seats} seats · you ${r.mine}</div>
    <div class="erwin dim small">${r.winner.replace(" (you)","")}</div></div>`).join("")}
   <div class="eregion ni"><div class="ername">Northern Ireland</div><div class="erbar" style="background:#777"></div><div class="erstat num">18 seats · local parties</div></div></div>`;
}

/* ---------- core flow ---------- */
function advance(){
  staged=null;busy=true;$("#bt-advance").disabled=true;
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
  if(S.meta.month>118){endGame("decade");return}
  if(S.pols.sleaze>78){E.frontPage(S,"THE LAST SCANDAL","One too many. The men in grey suits arrive in a grey car.");endGame("sleaze");return}
  if(S.world.war&&S.world.war.collapse){S.score.warsLost++;S.world.war=null;E.applyEffects(S,{app:-16,standing:-14});
    E.frontPage(S,"THE WAR IS LOST AT HOME","Support collapses. Withdrawal begins. The inquiry will outlive your career.")}
  const it=E.nextInteraction(S);
  renderAll();save();
  if(it.type==="end"&&it.kind==="resign"){endGame("resign");return}
  if(it.type==="confvote"){const ok=E.runConfVote(S);renderAll();save();
    if(!ok){endGame("ousted");return}
    if(S.pols.unity<31)ach("houdini","Houdini — survived on fumes");
    done();return}
  if(it.type==="budget"){tab="treasury";staged=null;renderAll();
    toast("<b>BUDGET DAY</b> · the Red Box is on the table — deliver from the Treasury room");done();return}
  if(it.type==="pmqs"){S.flags["pmq"+S.meta.month]=true;openPMQs();return}
  if(it.type==="election"){openElection(it);return}
  showCard(it.card);
}
function done(){busy=false;$("#bt-advance").disabled=false}

function showCard(card){
  const body=typeof card.b==="function"?card.b(S):card.b;
  const adv=E.adviceFor(S,card);
  modal(`<div class="lbl gold">${card.et||"Event"} · ${E.dateStr(S)}</div><h3>${card.t}</h3>
   <div class="body">${body}</div>
   ${adv?`<div class="advice"><b>${adv.a}</b> — “${adv.line} option ${adv.best+1}.”</div>`:""}
   <div class="opts">${card.opts.map((o,i)=>`<button class="choice" data-i="${i}">${i+1}. ${o.l}${o.s?`<small>${o.s}</small>`:""}</button>`).join("")}</div>`,true);
  $$("#modal .choice").forEach(b=>b.onclick=()=>{
    const b4=snapStats();
    E.resolveOption(S,card,+b.dataset.i);closeModal();
    if(S.flags._resign){endGame("resign");return}
    if(S.meta.over){endGame("ousted");return}
    toastDiff(b4);renderAll();save();done();
  });
}

/* ---------- PMQs ---------- */
function openPMQs(){
  const gov=S.meta.phase==="government";
  const topics=E.pmqsTopics(S);
  if(gov){
    const t=topics[0];
    modal(`<div class="lbl gold">Prime Minister's Questions · ${E.dateStr(S)}</div>
     <h3>${S.pols.oppName} comes at you on ${t.label}</h3>
     <div class="body">Six questions, the House baying, clips going straight online. How do you handle it?</div>
     <div class="opts">
      <button class="choice" data-s="own">Defend with the facts<small>Dry but solid — hard to clip against you</small></button>
      <button class="choice" data-s="pivot">Attack their record instead<small>Fires up your side, risks looking shifty</small></button>
      <button class="choice" data-s="joke">Go for the joke<small>If it lands you win the day. If not…</small></button>
      <button class="choice" data-s="pledge">Promise something on the spot<small>Gets you out of trouble now, binds you later</small></button>
     </div>`,true);
    $$("#modal .choice").forEach(b2=>b2.onclick=()=>{const b4=snapStats();E.pmqsResolve(S,t.k,b2.dataset.s);closeModal();toastDiff(b4);renderAll();save();done()});
  } else {
    modal(`<div class="lbl gold">Prime Minister's Questions · ${E.dateStr(S)}</div>
     <h3>You get six questions. What do you go after?</h3>
     <div class="body">Pick the government's weakest spot — the worse it is for them, the more you gain.</div>
     <div class="opts">${topics.map(t=>`<button class="choice" data-k="${t.k}">${t.label}<small>how bad it is for them: ${t.bad>6?"very":t.bad>3?"quite":"mildly"}</small></button>`).join("")}</div>`,true);
    $$("#modal .choice").forEach(b2=>b2.onclick=()=>{
      const k=b2.dataset.k;
      modal(`<div class="lbl gold">PMQs — ${topics.find(x=>x.k===k).label}</div><h3>How do you go at them?</h3>
       <div class="opts">
        <button class="choice" data-s="forensic">Pin them down with detail<small>Reliable damage, no fireworks</small></button>
        <button class="choice" data-s="theatrical">Go for the soundbite<small>One brutal line for the news — riskier</small></button>
        <button class="choice" data-s="statesman">Stay statesmanlike<small>Look like a PM-in-waiting</small></button>
       </div>`,true);
      $$("#modal .choice").forEach(c=>c.onclick=()=>{const b4=snapStats();E.pmqsResolve(S,k,c.dataset.s);closeModal();toastDiff(b4);renderAll();save();done()});
    });
  }
}
/* ---------- elections ---------- */
function openElection(it){
  const snap=it&&it.snap;
  const gov=S.meta.phase==="government";
  let boost=0,step=0;
  const series=[[S.pols.pollMe,gov?(100-S.pols.pollMe-28):S.opp.gov.poll]];
  const weeks=[
   {q:"Week one — the launch. Where does the battlebus go first?",o:[["The northern marginals",1.2],["The commuter belt",1],["Straight at the other leader's seat",Math.random()<.5?2.2:-1]]},
   {q:"The manifesto front page?",o:[["Costed and cautious",1],["A big bold giveaway",Math.random()<.5?2.6:-1.6],["An attack document on their record",1.6]]},
   {q:"__DEBATE__"},
   {q:"A mid-campaign wobble — a candidate's old tweets. React?",o:[["Drop them within the hour",1.2],["Defend free speech",Math.random()<.4?1.5:-1.8]]},
   {q:"Final 72 hours. Where do you stand on the last day?",o:[["Battleground blitz, four rallies",1.6],["Calm walkabout at home",0.4],["A dawn shift at a factory",1.2]]}];
  const pollsSVG=()=>{const N=series.length;if(N<2)return"";
    const x=i=>i/(Math.max(N-1,1))*300,y=v=>56-(v-15)/35*52;
    const p=j=>series.map((s,i)=>`${i?"L":"M"}${x(i).toFixed(1)},${y(s[j]).toFixed(1)}`).join("");
    return`<svg viewBox="0 0 300 60" class="campchart"><path d="${p(1)}" fill="none" stroke="#8d8d8d" stroke-width="1.4"/><path d="${p(0)}" fill="none" stroke="${PARTIES[S.meta.party].col}" stroke-width="2"/></svg>`};
  const pushPoll=()=>{series.push([E.clamp(series[series.length-1][0]+boost*0.25+(Math.random()-.45),12,58),E.clamp(series[series.length-1][1]-boost*0.15+(Math.random()-.5),10,55)])};
  const debate=(done)=>{
    const topics=E.pmqsTopics(S).slice(0,2);let qi=0;
    const rivalKey=gov?PARTIES[S.meta.party].rival:S.opp.gov.party;
    const minorKey=["lib","grn"].find(k=>k!==S.meta.party&&k!==rivalKey)||"lib";
    const flavour=k=>{const e=PARTIES[k].ideal.e;return e<-0.5?"left":e>0.5?"right":"centre"};
    const ask=()=>{
      if(qi>=topics.length){done();return}
      const t=topics[qi];const L=DEBATE_LINES[t.k]||DEBATE_LINES.jobs;
      modal(`<div class="lbl gold">THE LEADERS' DEBATE · question ${qi+1} of ${topics.length}</div>
       <h3>“What will you actually do about ${t.label}?”</h3>
       <div class="debquote"><b>${PARTIES[rivalKey].name}:</b> “${L[flavour(rivalKey)]}”</div>
       <div class="debquote"><b>${PARTIES[minorKey].name}:</b> “${L[flavour(minorKey)]}”</div>
       <div class="body" style="margin-top:10px">The moderator turns to you. Three seconds of national silence.</div>
       <div class="opts">
        <button class="choice" data-s="safe">The safe, costed answer<small>No risks, no fireworks</small></button>
        <button class="choice" data-s="attack">Turn both barrels on ${PARTIES[rivalKey].name}<small>High risk, high clip-value</small></button>
        <button class="choice" data-s="vision">The big vision moment<small>Swing for the cameras</small></button>
       </div>`,true);
      $$("#modal .choice").forEach(b=>b.onclick=()=>{
        const r=E.debateResolve(S,t.k,b.dataset.s);boost+=r.d;
        modal(`<div class="lbl gold">Snap verdict</div><h3>${r.d>0?"You won the exchange":"That one stung"}</h3>
         <div class="body">${r.txt}</div><div class="menu"><button class="btn" id="dnext">${qi+1<topics.length?"Next question":"Leave the stage"}</button></div>`,true);
        $("#dnext").onclick=()=>{qi++;ask()};
      });
    };ask();
  };
  const stepFn=()=>{
    if(step<weeks.length){
      const c=weeks[step];
      if(c.q==="__DEBATE__"){step++;pushPoll();debate(stepFn);return}
      modal(`<div class="lbl gold">${snap?"SNAP ELECTION":"GENERAL ELECTION"} · week ${step+1} of 5</div>
       <h3>${c.q}</h3>${pollsSVG()}
       <div class="opts">${c.o.map((o,i)=>`<button class="choice" data-i="${i}">${o[0]}</button>`).join("")}</div>
       <div class="small dim" style="margin-top:8px">Campaign strength: <b class="num">${fmt1(boost)}</b>${S.flags.targetRegion?" · targeting "+S.flags.targetRegion.toUpperCase():""}</div>`,true);
      $$("#modal .choice").forEach(b=>b.onclick=()=>{boost+=c.o[+b.dataset.i][1];step++;pushPoll();stepFn()});
      return}
    const R=E.computeElection(S,boost+(S.opp&&S.opp.warchest>6?1:0));
    S.lastElection=R;
    const mine=R.rows[0].seats,newMaj=mine*2-650;
    const rivalsMax=Math.max(...R.rows.filter(r=>!r.you&&r.key!=="ni").map(r=>r.seats));
    const win=newMaj>0,hung=!win&&mine>=rivalsMax;
    const bar=R.rows.map(r=>`<div style="width:${r.seats/650*100}%;background:${r.c}" title="${r.n} ${r.seats}"></div>`).join("");
    const key=R.rows.map(r=>`<span><span style="color:${r.c}">■</span> ${r.n} <b class="num">${r.seats}</b></span>`).join(" ");
    modal(`<div class="lbl gold">Election night</div>
     <h3>${win?"A MANDATE":hung?"A HUNG PARLIAMENT":"DEFEAT"}</h3>
     <div class="body">${win?`The map turns ${PARTIES[S.meta.party].name} at 3.41am. Majority of <b class="num">${newMaj}</b>.`
       :hung?`Largest party, no majority. The fax machine of history warms up.`
       :`The country said no. ${gov?"The removal van was idling for a reason.":"The mountain stays unclimbed tonight."}`}</div>
     <div class="seatbar">${bar}</div><div class="seatkey">${key}</div>
     ${electMapHTML(R.regions)}
     <div class="menu">${win?'<button class="btn" id="elc">Govern</button>'
       :hung?'<button class="btn" id="eld">Coalition with the Lib Dems (PR promise)</button><button class="btn ghost" id="elm">Minority government</button>'
       :'<button class="btn red" id="elx">Face the music</button>'}</div>`,true);
    if(win){$("#elc").onclick=()=>{closeModal();E.settleElectionWin(S,mine);
      if(newMaj>100)ach("landslide","Landslide — majority 100+");ach("first_win","Mandate — won a general election");
      if(S.meta.becamePM&&S.meta.oppMonths>0)ach("climber","The Long Climb — opposition to No. 10");
      renderAll();save();done()}}
    else if(hung){$("#eld").onclick=()=>{closeModal();E.settleElectionWin(S,326);S.flags.minority=false;
      E.applyEffects(S,{promise:"PR referendum (coalition deal)",unity:-6});ach("kingmaker","Kingmaker — governed by deal");
      renderAll();save();done()};
     $("#elm").onclick=()=>{closeModal();E.settleElectionWin(S,322);S.flags.minority=true;
      E.applyEffects(S,{unity:-4});renderAll();save();done()}}
    else{$("#elx").onclick=()=>{closeModal();
      const out=E.settleElectionLoss(S);
      if(out==="deposed"){endGame("deposed");return}
      renderAll();save();done()}}
  };
  stepFn();
}

/* ---------- endings ---------- */
function endGame(kind){
  S.meta.over=true;
  const sc=E.legacy(S);const yrs=(S.score.months/12).toFixed(1);
  const titles={decade:["TEN FULL YEARS","You leave at a time of your choosing — the rarest exit in the trade."],
   resign:["THE RESIGNATION","Your own clock, your own words, the lectern in the sun."],
   ousted:["DEFENESTRATED","The party turned. They always turn. You just hoped for later."],
   sleaze:["BURIED BY SCANDAL","Not one story but the weight of all of them."],
   deposed:["THE PARTY MOVES ON","Defeat without progress is a verdict."],
   hague:["THE HAGUE ENDING","You tried to invade France."]};
  const t=titles[kind]||titles.resign;
  if(S.score.months<2)ach("lettuce","The Lettuce — outlasted by salad");
  if(S.meta.month>118)ach("decade","The Full Decade");
  if(S.score.warsWon>0)ach("warwinner","Commander — won a war");
  if(S.score.billsPassed>=6)ach("legislator","Lawmaker — six acts on the book");
  $("#end-kicker").textContent=E.dateStr(S)+" · after "+yrs+" years";
  $("#end-title").textContent=t[0];
  $("#end-score").textContent=sc;
  $("#end-verdict").textContent=t[1]+" "+E.verdictText(sc,S);
  const stats=[["Years active",yrs],["Months in No. 10",S.meta.govMonths],["Elections won",S.score.electionsWon],["Peak approval",Math.round(S.score.peakApp)+"%"],["GDP index",fmt1(S.econ.gdpIdx)],["Acts passed",S.score.billsPassed],["Wars won / lost",S.score.warsWon+" / "+S.score.warsLost],["Scandals",S.score.scandals],["Promises kept / broken",S.score.kept+" / "+S.score.broken],["Crises resolved",S.score.crisesResolved]];
  $("#end-stats").innerHTML=stats.map(s=>`<div class="es"><div class="v num">${s[1]}</div><div class="k">${s[0]}</div></div>`).join("");
  const all=[...PM_RANKS,[S.meta.pm+" (you)",sc]].sort((a,b)=>b[1]-a[1]);
  $("#ranklist").innerHTML=all.map(r=>`<div class="rrow ${r[0].includes("(you)")?"you":""}"><span>${r[0]}</span><span class="num">${r[1]}</span></div>`).join("");
  try{localStorage.removeItem(LSK)}catch(e){}
  busy=false;$("#bt-advance").disabled=false;
  closeModal();show("#scr-end");
}
$("#bt-again").onclick=()=>show("#scr-title");
$("#bt-share2").onclick=()=>{
  const txt=`MANDATE 🇬🇧 ${S.meta.pm} (${PARTIES[S.meta.party].name}) — ${(S.score.months/12).toFixed(1)} yrs, legacy ${E.legacy(S)}/100. Beat me: https://felixgbondatpropnition.github.io/mandate/`;
  navigator.clipboard&&navigator.clipboard.writeText(txt);toast("<b>COPIED</b> · paste it in the group chat")};
$("#copybtn").onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText($("#shareurl").value);
  $("#copybtn").textContent="Copied ✓";setTimeout(()=>$("#copybtn").textContent="Copy link",1600)};
})();}
