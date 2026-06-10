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
  const k=Object.keys(PARTIES).find(x=>PARTIES[x]===p);
  const seats=(typeof REAL_HOUSE!=="undefined")?REAL_HOUSE.seats[k]:p.oppSeats;
  const poll=(typeof REAL_POLLS_NOW!=="undefined")?REAL_POLLS_NOW[k]:10;
  const base=k==="lab"
    ?"IN POWER · "+seats+" seats · majority "+(seats*2-650)+" · polling "+poll+"%"
    :"OPPOSITION · "+seats+" seat"+(seats===1?"":"s")+" · polling "+poll+"% · facing Starmer";
  if(sc==="gen"&&cfg.gen)return base+" · "+GEN_ECON[cfg.gen.e][0];
  return base;
}

/* ---------- the scenario forge: 6,720 generated setups ---------- */
let forgeSeed=Math.floor(Math.random()*6720);
function forgeFrom(n){
  n=((n%6720)+6720)%6720;
  const e=n%6;const p=Math.floor(n/6)%7;const w=Math.floor(n/42)%5;const pr=Math.floor(n/210)%4;const wi=Math.floor(n/840)%8;
  const name="Scenario #"+String(n).padStart(4,"0")+" — "+GEN_ECON[e][0]+", "+GEN_POL[p][0];
  return{e,p,w,pr,wi,n,name};
}
function renderForge(){
  const g=forgeFrom(forgeSeed);
  const bits=[GEN_ECON[g.e][0],GEN_POL[g.p][0],GEN_WORLD[g.w][0],GEN_PRESS[g.pr][0],GEN_WILD[g.wi][0]].filter(Boolean);
  $("#forge").innerHTML=`<div class="opt forgecard ${cfg.scenario==="gen"&&cfg.gen&&cfg.gen.n===g.n?"sel":""}">
    <h4>⚒ THE SCENARIO FORGE <span class="dim small">· one of 6,720</span></h4>
    <p><b class="num">#${String(g.n).padStart(4,"0")}</b> — ${bits.join(" · ")}</p>
    <div class="stats">MODIFIERS ON THE JULY 2026 BASELINE</div>
    <div class="menu tight"><button class="btn small" id="forge-play">Play this one</button>
     <button class="btn ghost small" id="forge-roll">⟳ Forge another</button>
     <input class="forgenum num" id="forge-num" value="${g.n}" maxlength="4"></div></div>`;
  $("#forge-roll").onclick=e2=>{e2.stopPropagation();forgeSeed=Math.floor(Math.random()*6720);renderForge()};
  $("#forge-num").onclick=e2=>e2.stopPropagation();
  $("#forge-num").onchange=e2=>{forgeSeed=parseInt(e2.target.value||"0",10)||0;renderForge()};
  $("#forge-play").onclick=e2=>{e2.stopPropagation();
    const gg=forgeFrom(forgeSeed);cfg.scenario="gen";cfg.gen=gg;cfg.party=null;
    wizStep=1;renderWiz()};
}

function renderWiz(){
  $("#wizcrumb").textContent="New career · step "+(wizStep+1)+" of "+WIZ.length;
  $("#wiztitle").textContent=WIZ[wizStep][0];
  $("#wizsub").textContent=WIZ[wizStep][1];
  $("#wizdots").innerHTML=WIZ.map((_,i)=>`<span class="wd ${i<wizStep?"done":i===wizStep?"now":""}"></span>`).join("");
  const B=$("#wizbody");
  const pickAndGo=set=>e=>{set();e.currentTarget.classList.add("sel");setTimeout(()=>{wizStep++;renderWiz()},170)};
  if(wizStep===0){
    B.innerHTML=`<div class="pick" id="pickscenario"></div>
     <div class="forge" id="forge"></div>`;
    const sc=$("#pickscenario");
    for(const[k,s]of Object.entries(SCENARIOS)){
      const d=document.createElement("div");d.className="opt"+(cfg.scenario===k?" sel":"");
      d.innerHTML=`<h4>${s.name}</h4><p>${s.desc}</p><div class="stats">${k==="real"?"THE BASELINE — JULY 2026, AS IT IS":"MODIFIER ON THE JULY 2026 BASELINE"}</div>`;
      d.onclick=pickAndGo(()=>{if(cfg.scenario!==k)cfg.party=null;cfg.scenario=k});sc.appendChild(d);}
    renderForge();
  }else if(wizStep===1){
    B.innerHTML=`<div class="pick" id="pickdiff"></div>`;const df=$("#pickdiff");
    for(const[k,x]of Object.entries(DIFFS)){
      const d=document.createElement("div");d.className="opt"+(cfg.difficulty===k?" sel":"");
      d.innerHTML=`<h4>${x.name}</h4><p>${x.desc}</p>`;
      d.onclick=pickAndGo(()=>cfg.difficulty=k);df.appendChild(d);}
  }else if(wizStep===2){
    B.innerHTML=`<div class="pick" id="pickparty"></div>`;const pp=$("#pickparty");
    
    for(const[k,p]of Object.entries(PARTIES)){
      if(p.aiOnly)continue;
      const d=document.createElement("div");d.className="opt"+(cfg.party===k?" sel":"");
      d.innerHTML=`<h4><span class="sw" style="background:${p.col}"></span>${p.name}</h4>
        <p>${k==="lab"?(p.blurb||p.oppBlurb):(p.oppBlurb||p.blurb)}</p>
        <div class="stats">${partyStatLine(cfg.scenario,p)}</div>`;
      d.onclick=pickAndGo(()=>cfg.party=k);pp.appendChild(d);}
  }else if(wizStep===3){
    B.innerHTML=`<div class="pick" id="pickbg"></div>`;const pb=$("#pickbg");
    for(const[k,b]of Object.entries(BGS)){
      const d=document.createElement("div");d.className="opt"+(cfg.bg===k?" sel":"");
      d.innerHTML=`<h4>${b.name}</h4><p>${b.blurb}</p><div class="stats">${b.stats}</div>`;
      d.onclick=pickAndGo(()=>cfg.bg=k);pb.appendChild(d);}
  }else{
    const s=cfg.scenario==="gen"?{name:cfg.gen.name}:SCENARIOS[cfg.scenario],p=PARTIES[cfg.party],b=BGS[cfg.bg];
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



/* ---------- the 650-seat map of Britain ---------- */
let UKCELLS=null;
function ukCells(){if(UKCELLS)return UKCELLS;UKCELLS={};if(typeof UK_MAP!=="undefined")UK_MAP.seats.forEach(s=>{(UKCELLS[s[2]]=UKCELLS[s[2]]||[]).push(s)});return UKCELLS}
function ukMapHTML(R,title){
  if(typeof UK_MAP==="undefined"||!R||!R.regions||!R.regions.length)return"";
  const cells=ukCells(),rows=R.rows;
  let rects="";
  const cs=(UK_MAP.cell||9)*0.88,h=cs/2;
  const cell=(c,fill,tip)=>`<rect x="${(c[0]-h).toFixed(1)}" y="${(c[1]-h).toFixed(1)}" width="${cs.toFixed(1)}" height="${cs.toFixed(1)}" rx="${(cs*0.28).toFixed(1)}" class="seatcell" fill="${fill}">${tip?`<title>${tip}</title>`:""}</rect>`;
  for(const rg of R.regions){
    const list=cells[rg.key]||[];let ci=0;
    const order=(rg.breakdown||[]).map((s,i)=>[s,i]).sort((a,b)=>b[0]-a[0]);
    for(const[cnt,pi]of order){for(let k=0;k<cnt&&ci<list.length;k++,ci++){
      rects+=cell(list[ci],rows[pi].c,`${rg.label} — ${rows[pi].n.replace(" (you)","")}`)}}
    while(ci<list.length)rects+=cell(list[ci++],"#39414f");
  }
  (cells.ni||[]).forEach(c=>rects+=cell(c,"#5a5f6b","Northern Ireland — local parties"));
  const outline=UK_MAP.outline.map(p=>`<path d="${p}" class="ukoutline"/>`).join("");
  const I=UK_MAP.inset,K=UK_MAP.connector;
  return`<div class="ukmapwrap"><span class="seclbl">${title}</span>
   <svg viewBox="0 0 ${UK_MAP.W} ${UK_MAP.H}" class="ukmap">${outline}
    ${K?`<line x1="${K[0]}" y1="${K[1]}" x2="${K[2]}" y2="${K[3]}" class="connector"/>`:""}
    <rect x="${I.x}" y="${I.y}" width="${I.w}" height="${I.h}" class="insetbox"/>
    <text x="${I.x+I.w/2}" y="${I.y-5}" class="insetlbl">LONDON · 75 SEATS</text>${rects}</svg></div>`;
}

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
   ["The rooms do the work","Treasury sets taxes and spending. Commons passes laws. Situation runs the world. Cabinet holds your team AND the deals — summits, poaching MPs, pacts, mergers. Press does papers and TV. Campaign HQ wins elections."],
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
$("#bt-advance").onclick=()=>{if(busy)return;const n=+(($("#skipn")||{}).value||1);if(n>1)fastForward(n);else advance()};
$("#bt-menu").onclick=openMenu;
$("#bt-help").onclick=()=>openPrimer(true);

function renderAll(){const vp=$("#viewport");const sy=vp?vp.scrollTop:window.scrollY;renderHUD();renderTicker();
  $$("#gametabs button").forEach(b=>b.classList.toggle("on",b.dataset.t===tab));
  $$(".tabpane").forEach(p=>{const on=p.id==="tab-"+tab;p.classList.toggle("on",on);if(!on)p.innerHTML=""});
  if(tab==="office")$("#tab-office").innerHTML='<div id="ov-top"></div><div class="duo"><div id="ov-left"></div><div id="ov-right"></div></div>';
  ({hub:renderHub,office:renderOverview,cabinet:renderCabinet,treasury:renderTreasury,commons:renderParliament,world:renderWorld,media:renderMedia,campaign:renderCampaign,diary:renderDiary,whips:renderWhips,intel:renderIntel,lords:renderLords,econlab:renderEconLab})[tab]();
  if(vp)vp.scrollTop=sy;else window.scrollTo({top:sy});
}
function renderHUD(){
  const p=S.pols,e=S.econ,gov=S.meta.phase==="government";
  $("#hud-name").textContent=S.meta.pm+" · "+PARTIES[S.meta.party].name+(gov?" · PM":" · Leader of the Opposition");
  $("#hud-date").textContent=E.dateStr(S)+(S.world.war?" · ⚔ AT WAR":"");
  const due=gov?Math.max(0,58-(S.meta.month-S.meta.termStart)):Math.max(0,S.opp.electionDue);
  const te=$("#t-elect");if(te){te.textContent="≤"+due+"m";te.className="v num "+(due>24?"good":due>9?"warn":"bad")}
  const adv=$("#bt-advance");if(adv)adv.innerHTML="ADVANCE — "+(MONTHS[(S.moy+1)%12]).toUpperCase()+" ▸";
  const cf=$("#capfill");if(cf){cf.style.width=S.pols.capital+"%";cf.classList.toggle("low",S.pols.capital<15)}
  const cn=$("#capnum");if(cn)cn.textContent=Math.round(S.pols.capital)+" / 100";
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
const PNAMES={lab:"Labour",con:"Conservative",lib:"Lib Dem",ref:"Reform UK",grn:"Green",res:"Restore",snp:"SNP"};
function renderOverview(){
  const gov=S.meta.phase==="government";
  const govParty=gov?S.meta.party:S.opp.gov.party;
  const due=gov?Math.max(0,58-(S.meta.month-S.meta.termStart)):Math.max(0,S.opp.electionDue);
  const warB=S.world.war?`<div class="warbanner">⚔ ${S.world.war.name} — support ${Math.round(S.world.war.support)}% · casualties ${Math.round(S.world.war.cas)}</div>`:"";
  $("#ov-top").innerHTML=warB+`<div class="panelbox"><h4>National polls — all parties</h4>
    <svg id="polls" viewBox="0 0 660 300" class="hugechart"></svg>
    <div class="polleg" id="polleg"></div></div>`;
  $("#ov-left").innerHTML=`<div class="panelbox"><h4>What's been happening</h4><div class="log tall">${S.log.map(l=>`<div><b>${l.m}</b>${l.t}</div>`).join("")||"<div>Nothing yet. It won't last.</div>"}</div></div>`;
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
  const P=E.projectElection(S);const CA=E.coalitionAnalysis(P.rows);
  $("#ov-proj").innerHTML=CA.majority?CA.text:`hung — see Campaign HQ`;
}
function drawPolls(sel,legSel){
  const H=S.hist.polls;if(!H)return;
  const keys=E.POLL_PARTIES.filter(k=>H[k]);
  const N=H[keys[0]].length;if(N<2)return;
  const ymax=Math.max(38,Math.ceil(Math.max(...keys.map(k=>Math.max(...H[k])))/5)*5+5);
  const x=i=>i/(N-1)*560,y=v=>292-(v/ymax)*276;
  let grid="";for(let g=10;g<ymax;g+=10)grid+=`<line x1="0" y1="${y(g)}" x2="560" y2="${y(g)}" class="pgrid"/><text x="4" y="${y(g)-3}" class="pgl">${g}%</text>`;
  const lines=keys.map(k=>{
    const me=k===S.meta.party;
    const p=H[k].map((v,i)=>`${i?"L":"M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
    const last=H[k][N-1];
    return`<path d="${p}" fill="none" stroke="${PARTIES[k].col}" stroke-width="${me?3.4:1.8}" opacity="${me?1:.8}"/>
     <circle cx="${x(N-1)}" cy="${y(last)}" r="${me?4:2.6}" fill="${PARTIES[k].col}"/>
     <text x="566" y="${(y(last)+3).toFixed(1)}" class="plend" fill="${PARTIES[k].col}">${PNAMES[k]} ${fmt1(last)}</text>`}).join("");
  const el=$(sel);if(el)el.innerHTML=grid+lines;
  const leg=$(legSel);if(leg)leg.innerHTML=[...keys].sort((a2,b2)=>S.polls[b2]-S.polls[a2])
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
  staged=staged||Object.assign({},(S.meta.phase==="opposition"&&S.platform)?S.platform:S.fiscal);
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
  const baseObj=(S.meta.phase==="opposition"&&S.platform)?S.platform:S.fiscal;
  const dirty=Object.keys(FISCAL_META).some(k=>Math.abs((staged[k]??0)-(baseObj[k]??0))>1e-9);
  $("#fiscalbar").innerHTML=`<span>REV <b class="num">${fmt1(rev)}%</b></span><span>SPEND <b class="num">${fmt1(sp)}%</b></span>
   <span>DEFICIT <b class="num ${d>5?"bad":d>3.5?"warn":"good"}">${fmt1(d)}%</b></span>
   <span>MARKETS WILL ${d>5?'<b class="bad">REVOLT</b>':d>3.5?'<b class="warn">GRUMBLE</b>':'<b class="good">APPROVE</b>'}</span>
   ${dirty?'<span><b class="warn">● UNSAVED — your edits stay here until you '+(S.meta.phase==="opposition"?"publish":"enact")+'</b></span>':'<span class="good">✓ saved</span>'}`;
}

/* ---------- PARLIAMENT ---------- */
function renderParliament(){
  const gov=S.meta.phase==="government";
  if(!gov){
    const avail=BILLS.filter(b=>!S.usedBills.includes(b.id));
    $("#tab-commons").innerHTML=`<div class="panelbox"><h4>Opposition day</h4>
    <p class="body">You control the order paper once a month. Pick the wound to press.</p>
    <div class="opts">${E.pmqsTopics(S).map(t=>`<button class="choice" data-k="${t.k}">Motion on ${t.label}<small>Force government MPs to defend the indefensible on the record</small></button>`).join("")}</div></div>
    <div class="panelbox"><h4>PRESENT A BILL — they will probably kill it, and pay for doing so</h4>
     <input class="qsearch" id="pmbsearch" placeholder="search ${avail.length} bills…">
     <div class="billgrid" id="pmbgrid">${avail.map(b=>`<div class="bill" data-name="${b.n.toLowerCase()}"><h4>${b.n}</h4><p>${b.desc}</p>
      <div class="menu tight"><button class="btn small" data-pmb="${b.id}">Present it · 6 capital</button></div></div>`).join("")}</div></div>`;
    $("#pmbsearch").oninput=e2=>{const v=e2.target.value.toLowerCase();
      $$("#pmbgrid .bill").forEach(x=>x.style.display=x.dataset.name.includes(v)?"":"none")};
    $$("#tab-commons [data-pmb]").forEach(b=>b.onclick=()=>{
      const b4=snapStats();const r=E.enactOppBill(S,b.dataset.pmb);
      if(!r.ok){toast(r.msg||"Cannot.");return}
      modal(`<div class="lbl gold">The division</div><h3>${r.pass?"IT PASSES — "+r.ayes+" votes":"Voted down, "+r.ayes+"–"+r.noes}</h3>
       <div class="body">${r.pass?"An opposition writing the law of the land. The government benches sit in stunned silence.":"Every government MP is now on record against it. You will be quoting this division for years."}</div>
       <div class="menu"><button class="btn" id="pmbok">Onward</button></div>`,true);
      $("#pmbok").onclick=()=>{closeModal();toastDiff(b4);renderAll();save()}});
    $$("#tab-commons .choice").forEach(b=>b.onclick=()=>{
      if(S.flags["oday"+S.meta.month]){toast("You've used this month's opposition day.");return}
      S.flags["oday"+S.meta.month]=true;E.applyEffects(S,{gov:{app:-1.2},poll:.4,capital:-2});
      E.frontPage(S,"OPPOSITION DAY AMBUSH","Government backbenchers vote, visibly wincing, to declare everything fine.");
      toast("<b>MOTION</b> · pressure applied");renderAll();save()});
    return}
  const avail=BILLS.filter(b=>!S.usedBills.includes(b.id));
  $("#tab-commons").innerHTML=`<div class="lbl">The legislative machine · majority ${S.majority} ${S.flags.minority?"· MINORITY":""}${S.flags.coalitionWith?" · COALITION: "+S.flags.coalitionWith:""}</div>
   <input class="qsearch" id="billsearch" placeholder="search ${avail.length} bills…">
   <div class="billgrid">${avail.map(b=>{
     const d=E.computeDivision(S,b,false);
     return`<div class="bill"><h4>${b.n}</h4><p>${b.desc}</p>
      <div class="divpreview"><div style="width:${d.ayes/650*100}%" class="${d.pass?"aye":"nay"}"></div></div>
      <div class="small dim num">forecast ${d.ayes}–${d.noes} ${d.pass?"PASSES":"FALLS"} · ${d.rebels} rebels · cost ${b.cost} cap</div>
      <div class="menu tight"><button class="btn small" data-b="${b.id}" data-w="0">Put to the House</button>
      <button class="btn ghost small" data-b="${b.id}" data-w="1">Whip hard (+8 cap)</button></div></div>`}).join("")}</div>
   ${S.usedBills.length?`<div class="lbl" style="margin-top:18px">On the statute book</div><div class="dim small">${S.usedBills.map(id=>BILLS.find(b=>b.id===id).n).join(" · ")}</div>`:""}`;
  const bs=$("#billsearch");if(bs)bs.oninput=e2=>{const v=e2.target.value.toLowerCase();
    $$("#tab-commons .bill").forEach(x=>{const nm=(x.querySelector("h4")||{}).textContent||"";x.style.display=nm.toLowerCase().includes(v)?"":"none"})};
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
      <text x="${m.lx||0}" y="${16+(m.ly||0)}" class="rlabel">${m.n.toUpperCase()}</text>
      ${dep&&(dep.brig||dep.car)?`<text y="26" class="rdep">${"▲".repeat(dep.brig||0)}${dep.car?"⚓":""}</text>`:""}
    </g>`}).join("");
  const warHud=S.world.war?`<div class="warbanner">⚔ ${S.world.war.name} — support ${Math.round(S.world.war.support)}% · casualties ${Math.round(S.world.war.cas)}${S.world.war.ww?` &nbsp;·&nbsp; ☢ DOOMSDAY ${Math.round(S.world.doom||0)}/100`:""}
   ${S.world.war.ww&&(S.world.doom||0)>50?'<button class="btn red small" id="bt-nuke" style="margin-left:14px">AUTHORISE NUCLEAR STRIKE</button>':""}</div>`:"";
  $("#tab-world").innerHTML=warHud+`<div class="duo wide">
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
  const nk=$("#bt-nuke");if(nk)nk.onclick=()=>{
    modal(`<div class="lbl" style="color:var(--red)">THE FOLDER</div><h3>There is no walking this back.</h3>
     <div class="body">Type the codeword to authorise first use. The codeword is <b>MIDNIGHT</b>. Or close this and remain a country among countries.</div>
     <input class="qsearch" id="nukecode" placeholder="codeword">
     <div class="menu"><button class="btn red" id="nkgo">Authorise</button><button class="btn ghost" id="nkno">Close the folder</button></div>`,true);
    $("#nkno").onclick=closeModal;
    $("#nkgo").onclick=()=>{
      if(($("#nukecode").value||"").trim().toUpperCase()!=="MIDNIGHT"){toast("The folder stays shut.");return}
      closeModal();
      const out=E.nukeStrike(S,S.world.war.theatre);
      if(out==="mad"){endGame("mad");return}
      ach("pariah","First Use — and the world that followed");
      renderAll();save()};
  };
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
  if(gov&&!m.home&&!r.occupied&&!S.world.war){
    acts.push(["invade","INVADE "+m.n.toUpperCase(),r.rel<-40?"they're hostile — a legal case exists":"unprovoked — the whole world will turn",15]);
    if(typeof MAJORS!=="undefined"&&MAJORS.includes(k))acts.push(["ultimatum","Issue an ultimatum","draw the line in public · relations −10",4],
      ["declare","DECLARE WAR on "+m.n.toUpperCase(),"a great-power war · the doomsday clock starts",20]);}
  return`<div class="panelbox"><h4>${m.n} · ${m.cap}</h4>
   <div class="cab">
    <div class="row2"><span>Leader</span><span><b>${LEADER_NAMES[k]||m.cap}</b> <span class="num ${E.rapport(S,k)>5?"good":E.rapport(S,k)<-5?"bad":"dim"}">rapport ${E.rapport(S,k)>0?"+":""}${E.rapport(S,k)}</span></span></div>
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
  if(act==="ultimatum"){const b4=snapStats();
    E.applyEffects(S,{capital:-4,rel:{[selRegion]:-10},standing:2});
    E.frontPage(S,"AN ULTIMATUM TO "+REGIONS[selRegion].n.toUpperCase(),"Delivered at the podium, not through channels. The word 'consequences' is used without a smile.");
    toastDiff(b4);renderAll();save();return;}
  if(act==="declare"){
    const m=REGIONS[selRegion];
    modal(`<div class="lbl" style="color:var(--red)">GREAT-POWER WAR</div><h3>Declare war on ${m.n}?</h3>
     <div class="body">They have nuclear weapons. The Cabinet Secretary asks, formally, whether you have considered what the word "win" means here. The doomsday meter starts the moment you say yes.</div>
     <div class="menu"><button class="btn red" id="dwgo">Declare war</button><button class="btn ghost" id="dwno">Step back</button></div>`);
    $("#dwno").onclick=closeModal;
    $("#dwgo").onclick=()=>{closeModal();const b4=snapStats();
      const r2=E.declareWar(S,selRegion);
      if(!r2.ok){toast(r2.msg||"Cannot.");return}
      ach("greatpower","Into the Abyss — declared war on a major power");
      toastDiff(b4);renderAll();save()};
    return;}
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
   <div class="panelbox"><h4>GO ON TELEVISION — whenever you dare</h4>
    <div class="fmtgrid">${Object.entries(INTERVIEW_FORMATS).map(([k,f])=>`
     <button class="choice" data-iv="${k}" ${S.pols.capital<f.cost?"disabled":""}>${f.name}
      <small>${f.desc} · ${f.n} questions · reach ×${f.reach} · ${f.cost} capital${S.pols.capital<f.cost?" — NOT ENOUGH":""}</small></button>`).join("")}</div></div>
   <div class="lbl" style="margin-top:16px">The papers</div>
   <div class="outgrid">${S.media.outlets.map((o,i)=>`<div class="panelbox"><h4>${o.n} <span class="dim small">· ${o.kind} · reach ${o.reach}</span></h4>
    <div class="track big"><div class="fill" style="width:${(o.stance+50)}%;background:${o.stance>10?"var(--bench)":o.stance<-10?"var(--red)":"var(--brass)"}"></div></div>
    <div class="small dim num">stance ${Math.round(o.stance)}</div>
    <div class="menu tight">
     <button class="btn ghost small" data-o="${i}" data-x="brief">Private briefing · 3 cap</button>
     <button class="btn ghost small" data-o="${i}" data-x="excl">Grant exclusive · 2 cap</button>
     ${o.kind==="tabloid"?`<button class="btn ghost small" data-o="${i}" data-x="yacht">Proprietor's yacht · 2 cap</button>`:""}
    </div></div>`).join("")}</div>`;
  $$("#tab-media [data-iv]").forEach(b=>b.onclick=()=>startInterview(b.dataset.iv));
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
  const rank=[...E.POLL_PARTIES].sort((a,b)=>S.polls[b]-S.polls[a]).indexOf(S.meta.party)+1;
  const rooms=[
   ["office","YOUR OFFICE",36,162,188,96,"approval "+Math.round(S.pols.approval)+"%"],
   ["cabinet",gov?"CABINET":"SHADOW CABINET",252,46,188,96,"unity "+Math.round(S.pols.unity)],
   ["treasury",gov?"TREASURY":"SHADOW TREASURY",466,46,188,96,"deficit "+fmt1(S.fiscalDeficit)+"%"],
   ["media","PRESS OFFICE",680,46,188,96,"press "+(S.mediaIndex>=0?"+":"")+Math.round(S.mediaIndex)],
   ["commons","THE COMMONS",252,258,188,96,gov?(S.flags.minority?"no majority":"majority "+S.majority):S.party.seats+" seats"],
   ["world","SITUATION ROOM",466,258,188,96,S.world.war?"⚔ AT WAR":"standing "+Math.round(S.world.standing)],
   ["campaign","CAMPAIGN HQ",680,258,188,96,"polls "+Math.round(S.pols.pollMe)+"% · #"+rank],
  ];
  const wing=[["diary","DIARY",36,372,150,66,"skip ahead"],["whips","WHIPS",206,372,150,66,"letters "+Math.max(0,Math.round(32-(S.pols.unity-32)))],
   ["intel","INTELLIGENCE",376,372,150,66,"3 live ops"],["lords","THE LORDS",546,372,150,66,((S.lords&&S.lords.peers)||0)+" peers"],
   ["econlab","ECONOMY LAB",716,372,150,66,fmt1(S.econ.infl)+"% / "+fmt1(S.econ.rates)+"%"]];
  wing.forEach(w2=>rooms.push(w2));
  const doors=`<path class="corridor" d="M260,210 H300 M500,110 H540 M500,310 H540 M740,110 H780 M740,310 H780 M400,160 V260 M640,160 V260 M160,150 V120 H300 M160,270 V310 H300"/>`;
  $("#tab-hub").innerHTML=`<div class="lbl" style="margin-top:10px">No. 10 — the corridors of power · ${E.dateStr(S)}</div>
   <svg id="hubmap" viewBox="0 0 960 460">
    <rect x="20" y="20" width="920" height="430" rx="6" class="hubwall"/>
    ${doors}
    ${rooms.map(r=>`<g class="room${r[0]==="world"&&S.world.war?" warroom":""}" data-t="${r[0]}">
      <rect x="${r[2]}" y="${r[3]}" width="${r[4]}" height="${r[5]}" rx="3"/>
      <text x="${r[2]+r[4]/2}" y="${r[3]+r[5]/2-8}" class="rmname">${r[1]}</text>
      <text x="${r[2]+r[4]/2}" y="${r[3]+r[5]/2+14}" class="rmstat">${r[6]}</text></g>`).join("")}
    <text x="40" y="38" text-anchor="start" class="hubtitle">${gov?"10 DOWNING STREET":"LEADER OF THE OPPOSITION'S OFFICE"}</text>
   </svg>
   <div class="hubstrip"><span class="lbl gold">Today's front page</span> <b>${S.paper.head}</b></div>`;
  $$("#hubmap .room").forEach(g=>g.onclick=()=>{tab=g.dataset.t;renderAll()});
}

/* ---------- CABINET ROOM ---------- */
function renderCabinet(){
  const gov=S.meta.phase==="government";
  const pre=gov?"":"Shadow ";
  $("#tab-cabinet").innerHTML=`   <div class="panelbox"><h4>DEALS &amp; DEFECTIONS — summits, poaching, pacts, mergers</h4>
    <div class="cab">${Object.keys(PARTIES).filter(k=>k!==S.meta.party&&k!=="snp").map(k=>
     `<div class="row2"><span><span style="color:${PARTIES[k].col}">■</span> ${PARTIES[k].name} <span class="dim small">· ${REAL_LEADERS[k]||""} · polls ${fmt1(S.polls[k]||0)}%</span></span>
      <span class="num dim">rel ${E.relOf(S,k)}</span></div>`).join("")}</div>
    <div class="menu tight" style="margin-top:10px">
     <button class="btn ghost small" data-xp="summit">Leader summit · 4</button>
     <button class="btn ghost small" data-xp="poach">Court a defector · 8</button>
     ${S.meta.phase==="opposition"?'<button class="btn ghost small" data-xp="pact">Propose electoral pact · 6</button>':""}
     <button class="btn ghost small" data-xp="merge">Merger talks · 12</button>
    </div></div>
  <div class="lbl" style="margin:10px 0 2px">${pre}cabinet · the bar shows each minister’s PUBLIC APPROVAL — red means they’re a liability · replace 4 cap</div>
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

  $$("#tab-cabinet [data-xp]").forEach(b=>b.onclick=()=>{
    const op=b.dataset.xp;
    const targets=Object.keys(PARTIES).filter(k=>k!==S.meta.party&&k!=="snp"&&!(S.meta.phase==="opposition"&&op==="pact"&&S.opp&&k===S.opp.gov.party));
    modal(`<div class="lbl gold">${{summit:"Leader summit",poach:"Court a defector",pact:"Electoral pact",merge:"Merger talks"}[op]}</div>
     <h3>With which party?</h3><div class="opts">${targets.map(k=>`<button class="choice" data-k="${k}"><span style="color:${PARTIES[k].col}">■</span> ${PARTIES[k].name}<small>${REAL_LEADERS[k]||""} · polls ${fmt1(S.polls[k]||0)}% · relationship ${E.relOf(S,k)}</small></button>`).join("")}</div>
     <div class="menu"><button class="btn ghost" id="xpclose">Never mind</button></div>`);
    $("#xpclose").onclick=closeModal;
    $$("#modal .choice").forEach(c=>c.onclick=()=>{closeModal();
      const b4=snapStats();
      const r=op==="summit"?E.partySummit(S,c.dataset.k)
        :op==="poach"?E.poachMP(S,c.dataset.k)
        :op==="pact"?E.proposePact(S,c.dataset.k)
        :E.proposeMerger(S,c.dataset.k);
      if(!r.ok){toast(r.msg||"Cannot.");return}
      toastDiff(b4);renderAll();save()})});
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
function seatBarHTML(rows){return`<div class="seatbar">${rows.map(r=>`<div style="width:${r.seats/650*100}%;background:${r.c}" title="${r.n} ${r.seats}"></div>`).join("")}</div>
 <div class="seatkey">${[...rows].sort((a2,b2)=>b2.seats-a2.seats).filter(r=>r.seats>0).map(r=>`<span><span style="color:${r.c}">■</span> ${r.n.replace(" (you)"," — you")} <b class="num">${r.seats}</b></span>`).join(" ")}</div>`}
function renderCampaign(){
  const gov=S.meta.phase==="government";
  const due=gov?Math.max(0,58-(S.meta.month-S.meta.termStart)):Math.max(0,S.opp.electionDue);
  const P=E.projectElection(S);
  const CA=E.coalitionAnalysis(P.rows);
  const HCA=S.house?E.coalitionAnalysis(S.house.rows):null;
  $("#tab-campaign").innerHTML=`<div class="duo wide">
   <div>
    <div class="panelbox"><h4>1 · THE HOUSE OF COMMONS NOW <span class="dim">— as elected ${S.house?S.house.when:""}</span></h4>
     ${S.house?seatBarHTML(S.house.rows):""}
     <div class="ukduo">${S.house?ukMapHTML(S.house,"SEATS TODAY — all 650"):""}
      <div class="panelbox slim"><h4>Where power sits</h4>
       <div class="body">${HCA?HCA.text:""}</div>
       ${S.flags.coalitionWith?`<div class="dim small" style="margin-top:8px">You govern in partnership with ${S.flags.coalitionWith}.</div>`:""}
      </div></div></div>
    <div class="panelbox"><h4>2 · NATIONAL POLLS — the country's mood now</h4>
     <svg id="polls2" viewBox="0 0 660 300" class="hugechart"></svg>
     <div class="polleg" id="polleg2"></div></div>
    <div class="panelbox"><h4>3 · IF THE ELECTION WERE TODAY — polls turned into seats</h4>
     <div class="body" style="margin-bottom:6px">${CA.text}</div>
     ${seatBarHTML(P.rows)}
     <div class="ukduo">${ukMapHTML(P,"PROJECTED SEATS — all 650")}
      <div class="panelbox slim"><h4>Swing vs the House</h4><div class="cab">
       ${P.rows.filter(r=>r.key!=="ni").map(r=>{const h=S.house?(S.house.rows.find(x=>x.key===r.key)||{seats:0}).seats:0;const d2=r.seats-h;
         return`<div class="row2"><span style="color:${r.c}">${r.n.replace(" (you)"," — you")}</span><span class="num ${d2>0?"good":d2<0?"bad":"dim"}">${d2>0?"+":""}${d2}</span></div>`}).join("")}
      </div></div></div></div>
   </div>
   <div>
    <div class="panelbox"><h4>The clock</h4><div class="cab">
     <div class="row2"><span>Next election</span><span class="num warn">within ${due} months</span></div>
     ${S.opp?`<div class="row2"><span>Campaign fund</span><span class="num">£${fmt1(S.opp.warchest)}m</span></div>`:""}
     
    </div></div>

    <div class="panelbox"><h4>MANIFESTO POSITIONS — where you stand · ▲ marks public opinion</h4>
     <div id="stances">${Object.entries(ISSUES).map(([k,v])=>{
       const sv=S.stance?S.stance[k]:0,pub=S.pubop?S.pubop[k]:v.pub;
       return`<div class="sl stancerow"><label>${v.n}<span class="num">${sv>0?"+":""}${fmt1(sv)}</span></label>
        <div class="stancewrap"><span class="pubmark" style="left:${(pub+2)/4*100}%">▲</span>
        <input type="range" min="-2" max="2" step="0.5" value="${sv}" data-st="${k}"></div>
        <div class="stancelbls"><span>${v.lo}</span><span>${v.hi}</span></div></div>`}).join("")}</div>
     <div class="menu tight">${S.meta.phase==="opposition"
       ?'<button class="btn small" id="bt-manifesto">Publish manifesto positions</button>'
       :'<button class="btn small" id="bt-positions">Set the government’s line · 3 capital</button>'}
      <span class="dim small">Sliders save instantly. Interviews and PMQs also move them — what you say in public IS your position.</span></div></div>
    ${gov?`<div class="panelbox"><h4>Go early?</h4><p class="body dim small">The projection in panel 3 is your honest odds. There's no taking it back.</p>
     <div class="menu tight"><button class="btn red small" id="bt-snap2">Call an election now · 20 capital</button></div></div>`
    :`<div class="panelbox"><h4>Fundraising</h4><p class="body dim small">Dinners, raffles, a man named Clive with opinions about crypto.</p>
     <div class="menu tight"><button class="btn ghost small" id="bt-fund" ${S.pols.capital<3?"disabled":""}>Fundraise · 3 capital</button></div></div>`}
   </div></div>`;
  drawPolls("#polls2","#polleg2");

  $$("#tab-campaign [data-st]").forEach(inp=>inp.oninput=()=>{
    E.setStance(S,inp.dataset.st,+inp.value);save();
    inp.closest(".stancerow").querySelector("label .num").textContent=(+inp.value>0?"+":"")+fmt1(+inp.value)});
  const bm=$("#bt-manifesto");if(bm)bm.onclick=()=>{S.flags.platformSet=true;
    E.applyEffects(S,{poll:.5});E.frontPage(S,"THE MANIFESTO POSITIONS","Eight answers to eight arguments, in writing. Brave, by Westminster standards.");
    toast("<b>PUBLISHED</b>");renderAll();save()};
  const bp=$("#bt-positions");if(bp)bp.onclick=()=>{
    if(S.pols.capital<3){toast("Not enough capital.");return}
    E.applyEffects(S,{capital:-3});
    toast("<b>LINE SET</b> · the lobby is briefed");renderAll();save()};
  const sn=$("#bt-snap2");if(sn)sn.onclick=()=>{
    if(S.pols.capital<20){toast("Not enough capital (need 20).");return}
    modal(`<h3>Call the election?</h3><div class="body">${CA.text}. Once you ask the country, there's no taking it back.</div>
     <div class="menu"><button class="btn red" id="snapgo">Call it</button><button class="btn ghost" id="snapno">Not yet</button></div>`);
    $("#snapno").onclick=closeModal;
    $("#snapgo").onclick=()=>{closeModal();E.applyEffects(S,{capital:-20});S.flags._electionNow=true;advance()};};
  const fd=$("#bt-fund");if(fd)fd.onclick=()=>{
    if(S.pols.capital<3){toast("Not enough capital.");return}
    E.applyEffects(S,{capital:-3,chest:1.5});
    if(Math.random()<0.12){E.applyEffects(S,{sleaze:4});toast("<b>£1.5m RAISED</b> · Clive came with strings")}
    else toast("<b>£1.5m RAISED</b>");renderAll();save()};
}

/* ---------- the studio ---------- */
function startInterview(fmtKey){
  const f=INTERVIEW_FORMATS[fmtKey];
  if(S.pols.capital<f.cost){toast("Not enough capital.");return}
  E.applyEffects(S,{capital:-f.cost});
  const iv=E.interviewBuild(S,fmtKey);
  let qi=0,score=0;const b4=snapStats();
  const ask=()=>{
    if(qi>=iv.qs.length){
      const res=E.interviewFinish(S,fmtKey,score,iv.qs.length);
      modal(`<div class="onair">OFF AIR</div><h3>${res==="triumph"?"You owned the studio.":res==="fine"?"You survived it.":"That… will follow you."}</h3>
       <div class="body">${res==="triumph"?"The clips run all evening — for once, in your favour.":res==="fine"?"No headlines is good headlines.":"One answer is already a meme with four million views."}</div>
       <div class="menu"><button class="btn" id="iv-done">Leave the studio</button></div>`,true);
      $("#iv-done").onclick=()=>{closeModal();toastDiff(b4);renderAll();save()};
      return;}
    const q=iv.qs[qi];
    modal(`<div class="onair">● ON AIR — ${f.name.toUpperCase()} · Q${qi+1} OF ${iv.qs.length}</div>
     <h3 class="ivq">“${q.q}”</h3>
     <div class="opts">${q.opts.map((o,i)=>`<button class="choice quote" data-i="${i}">${o[0]}</button>`).join("")}</div>
     <div class="perfbar"><div style="width:${clampPct(50+score*8)}%"></div></div>`,true);
    $$("#modal .choice").forEach(c=>c.onclick=()=>{
      score+=E.interviewAnswer(S,q.opts[+c.dataset.i],f.reach,q.k);
      const mv=(E.answerShift._last||[]).slice(0,2);
      if(mv.length)toast(mv.map(m2=>(m2[1]>0?"+":"")+fmt1(m2[1])+"% "+(m2[1]>0?"from ":"to ")+PNAMES[m2[0]]).join(" &nbsp;·&nbsp; "));
      qi++;ask()});
  };
  ask();
}
function clampPct(x){return Math.max(4,Math.min(96,x))}


/* ---------- DIARY: the calendar & the fast-forward ---------- */
function renderDiary(){
  const gov=S.meta.phase==="government";
  const due=gov?Math.max(0,58-(S.meta.month-S.meta.termStart)):Math.max(0,S.opp.electionDue);
  const nextBudget=gov?((2-S.moy+12)%12||12):null;
  const conf=( (gov?9:8) - S.moy + 12)%12||12;
  $("#tab-diary").innerHTML=`<div class="duo">
   <div><div class="seclbl">THE DIARY — what's coming</div>
    <div class="panelbox"><div class="cab">
     <div class="row2"><span>Next general election</span><span class="num warn">within ${due} months</span></div>
     ${gov?`<div class="row2"><span>Next Budget</span><span class="num">${nextBudget} month${nextBudget>1?"s":""}</span></div>`:""}
     <div class="row2"><span>Party conference</span><span class="num">${conf} month${conf>1?"s":""}</span></div>
     ${S.world.war?`<div class="row2"><span class="bad">⚔ War cabinet</span><span class="num bad">every month</span></div>`:""}
     ${S.world.doom?`<div class="row2"><span class="bad">☢ Doomsday meter</span><span class="num bad">${Math.round(S.world.doom)}/100</span></div>`:""}
    </div></div>
    <div class="panelbox"><h4>FAST-FORWARD — let the team run the shop</h4>
     <p class="body dim small">Your advisers take the routine decisions (you'll get a recap). Anything big — elections, confidence votes, budgets, wars, the brink — stops the clock and waits for you.</p>
     <div class="menu tight">
      <button class="btn small" data-ff="3">Skip 3 months</button>
      <button class="btn small" data-ff="6">Skip 6 months</button>
      <button class="btn small" data-ff="12">Skip a year</button>
     </div></div></div>
   <div><div class="seclbl">RECENT MONTHS</div>
    <div class="panelbox"><div class="log tall">${S.log.map(l=>`<div><b>${l.m}</b>${l.t}</div>`).join("")}</div></div></div></div>`;
  $$("#tab-diary [data-ff]").forEach(b=>b.onclick=()=>fastForward(+b.dataset.ff));
}
function isForcedCard(card){
  if(!card||card.gen)return false;
  const deck=S.meta.phase==="government"?GOV_DECK:OPP_DECK;
  const d=deck.find(c=>c.id===card.id);
  return !!(d&&d.forced);
}
function fastForward(n){
  if(busy)return;busy=true;$("#bt-advance").disabled=true;
  const b4=snapStats();const recap=[];let stopped=null;
  for(let i=0;i<n;i++){
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
    if(S.flags.mad||S.meta.month>118||S.pols.sleaze>78){stopped="end";break}
    const it=E.nextInteraction(S);
    if(it.type==="end"||it.type==="confvote"||it.type==="election"){stopped=it.type;var pend=it;break}
    if(it.type==="budget"){S.flags["bud"+S.year]=true;recap.push("Budget day: the team rolled last year's settlement over.");continue}
    if(it.type==="pmqs"){S.flags["pmq"+S.meta.month]=true;
      const t=E.pmqsTopics(S)[0];
      E.pmqsResolve(S,t,S.meta.phase==="government"?"own":"forensic");
      recap.push("PMQs on "+t.label+": handled by the book.");continue}
    if(it.type==="event"){
      if(isForcedCard(it.card)){stopped="forced";var pendCard=it.card;break}
      const adv=E.adviceFor(S,it.card)||{best:0};
      const pick=Math.min(adv.best,it.card.opts.length-1);
      E.resolveOption(S,it.card,pick);
      recap.push(it.card.t+" → "+it.card.opts[pick].l);
      if(S.flags._resign||S.meta.over){stopped="end";break}
    }
  }
  renderAll();save();
  const finish=()=>{busy=false;$("#bt-advance").disabled=false;
    if(stopped==="end"){ if(S.flags.mad){endGame("mad")} else if(S.meta.month>118){endGame("decade")} else if(S.pols.sleaze>78){endGame("sleaze")} else if(S.meta.over){endGame("ousted")} else if(S.flags._resign){endGame("resign")} return;}
    if(stopped==="election"){openElection(pend);return}
    if(stopped==="confvote"){const ok=E.runConfVote(S);renderAll();save();if(!ok){endGame("ousted");return}return}
    if(stopped==="forced"&&pendCard){busy=true;$("#bt-advance").disabled=true;showCard(pendCard);return}
  };
  modal(`<div class="lbl gold">While you were heads-down</div>
   <h3>${recap.length} decision${recap.length===1?"":"s"} taken by the team</h3>
   <div class="body" style="max-height:300px;overflow-y:auto">${recap.map(r=>"· "+r).join("<br>")||"A quiet stretch. Suspicious."}</div>
   ${stopped&&stopped!=="end"?'<div class="warbanner">⏸ The clock stopped — something needs the leader.</div>':""}
   <div class="menu"><button class="btn" id="ffok">Back to the desk</button></div>`,true);
  $("#ffok").onclick=()=>{closeModal();toastDiff(b4);finish()};
}

/* ---------- WHIPS ---------- */
function renderWhips(){
  const dist=Math.round(S.pols.unity-32);
  $("#tab-whips").innerHTML=`<div class="duo">
   <div><div class="seclbl">THE WHIPS' OFFICE — discipline, counted nightly</div>
    <div class="panelbox"><h4>Distance from a confidence vote</h4>
     <div class="track big"><div class="fill" style="width:${Math.max(4,Math.min(100,dist*2.2))}%;background:${dist>15?"var(--grn)":dist>6?"var(--gold)":"var(--red)"}"></div></div>
     <div class="small dim num" style="margin-top:6px">unity ${Math.round(S.pols.unity)} — the letters go in below 32</div></div>
    ${S.party.factions.map((f,i)=>{const rebels=Math.max(0,Math.round(S.party.seats*f.w*(46-f.happy)/120));
     return`<div class="panelbox"><h4>${f.name} · ${f.leader}</h4>
      <div class="cab"><div class="row2"><span>Mood</span><span class="num ${f.happy>55?"good":f.happy>38?"warn":"bad"}">${Math.round(f.happy)}</span></div>
      <div class="row2"><span>Estimated rebels</span><span class="num ${rebels>8?"bad":"dim"}">${rebels} MPs</span></div></div>
      <div class="menu tight"><button class="btn ghost small" data-riot="${i}">Read the riot act · 5 cap</button></div></div>`}).join("")}
   </div>
   <div><div class="seclbl">TOOLS</div>
    ${S.meta.phase==="government"
      ?`<div class="panelbox"><h4>Loyalty honours</h4><p class="body dim small">Gongs with a suspiciously high correlation to division lists. Unity +5, a little grubby.</p>
       <div class="menu tight"><button class="btn ghost small" id="wh-hon">Issue the list · 8 cap</button></div></div>`
      :`<div class="panelbox"><h4>Frontbench promises</h4><p class="body dim small">You have no gongs to give — but you can promise who sits where after the win. Unity +5, and everyone keeps the receipt.</p>
       <div class="menu tight"><button class="btn ghost small" id="wh-jobs">Make the promises · 8 cap</button></div></div>`}</div></div>`;
  $$("#tab-whips [data-riot]").forEach(b=>b.onclick=()=>{const b4=snapStats();
    const r=E.whipAction(S,"riot",+b.dataset.riot);if(!r.ok){toast(r.msg||"Cannot.");return}
    toast(r.backfired?"<b>IT LEAKED</b>":"<b>MESSAGE DELIVERED</b>");toastDiff(b4);renderAll();save()});
  const wh=$("#wh-hon");if(wh)wh.onclick=()=>{const b4=snapStats();const r=E.whipAction(S,"honours",0);
    if(!r.ok){toast(r.msg||"Cannot.");return}toastDiff(b4);renderAll();save()};
  const wj=$("#wh-jobs");if(wj)wj.onclick=()=>{const b4=snapStats();const r=E.whipJobs(S);
    if(!r.ok){toast(r.msg||"Cannot.");return}toastDiff(b4);renderAll();save()};
}

/* ---------- INTELLIGENCE ---------- */
function renderIntel(){
  const worst=Object.entries(S.world.regions).filter(([k])=>k!=="uk").sort((a,b)=>a[1].rel-b[1].rel)[0];
  $("#tab-intel").innerHTML=`<div class="duo">
   <div><div class="seclbl">${S.meta.phase==="government"?"THE INTELLIGENCE PICTURE — JIC assessment":"THE PICTURE FROM OUTSIDE — briefings on privy-council terms"}</div>
    <div class="panelbox"><h4>This month's assessment</h4>
     <p class="body">Principal concern: <b>${REGIONS[worst[0]].n}</b> (relations ${Math.round(worst[1].rel)}). ${S.world.war?"Wartime tasking takes priority — agency capacity is stretched.":"Capacity available for special tasking."} ${S.world.doom?`<span class="bad">Strategic warning level: ${Math.round(S.world.doom)}/100.</span>`:""}</p></div>
    <div class="panelbox"><h4>${S.meta.phase==="government"?"SPECIAL TASKINGS — the agencies":"THE OPPOSITION RESEARCH DESK — private, deniable"}</h4><div class="opts">
     <button class="choice" data-op="dossier">${S.meta.phase==="government"?"Obtain the opposition's playbook":"Commission opposition research"}<small>${S.meta.phase==="government"?"Their next month's grid on your desk":"A private firm maps the government's weak spots"} · 6 capital</small></button>
     ${S.meta.phase==="government"?'<button class="choice" data-op="sweep">Counter-espionage sweep<small>Standing +2 · small chance of catching a mole · 5 capital</small></button>':""}
     <button class="choice" data-op="kompromat">${S.meta.phase==="government"?"Open the kompromat file":"Open the black book"}<small>50% devastating · 35% nothing · 15% it blows up on YOU · 9 capital</small></button>
    </div></div></div>
   <div><div class="seclbl">WORLD LEADERS — personal rapport</div>
    <div class="panelbox"><div class="cab">${Object.keys(REGIONS).filter(k=>k!=="uk"&&k!=="southatl").map(k=>
     `<div class="row2"><span>${LEADER_NAMES[k]||REGIONS[k].cap} <span class="dim small">· ${REGIONS[k].n}</span></span><span class="num ${E.rapport(S,k)>5?"good":E.rapport(S,k)<-5?"bad":"dim"}">${E.rapport(S,k)>0?"+":""}${E.rapport(S,k)}</span></div>`).join("")}</div>
    <p class="dim small" style="margin-top:8px">Summits build rapport. Rapport sways trade deals, war support and how fast the phone gets answered.</p></div></div></div>`;
  $$("#tab-intel [data-op]").forEach(b=>b.onclick=()=>{const b4=snapStats();
    const r=E.intelOp(S,b.dataset.op);if(!r.ok){toast(r.msg||"Cannot.");return}
    if(r.msg)toast(r.msg);toastDiff(b4);renderAll();save()});
}

/* ---------- LORDS ---------- */
function renderLords(){
  const peers=(S.lords&&S.lords.peers)||0;
  if(S.meta.phase!=="government"){
    $("#tab-lords").innerHTML=`<div class="duo">
     <div><div class="seclbl">THE HOUSE OF LORDS — enemy territory, friendly benches</div>
      <div class="panelbox"><h4>The red-bench resistance</h4>
       <p class="body">You cannot create peers — that power belongs to the Prime Minister. But the government has no Lords majority, and your peers know every procedural knife in the drawer.</p>
       <div class="menu tight"><button class="btn ghost small" id="ld-obs">Ambush a government bill · 4 cap</button></div></div>
      <div class="panelbox"><h4>Honours nominations</h4>
       <p class="body dim small">By convention you may nominate a handful of names to the PM's list. It buys goodwill in your own ranks, nothing more.</p></div></div>
     <div><div class="seclbl">WHY IT MATTERS</div>
      <div class="panelbox"><p class="body">Every ambush costs the government a news cycle and a slice of approval. Win power, and the peer-making pen is yours.</p></div></div></div>`;
    $("#ld-obs").onclick=()=>{const b4=snapStats();const r=E.lordsObstruct(S);
      if(!r.ok){toast(r.msg||"Cannot.");return}toastDiff(b4);renderAll();save()};
    return;
  }
  $("#tab-lords").innerHTML=`<div class="duo">
   <div><div class="seclbl">THE HOUSE OF LORDS</div>
    <div class="panelbox"><h4>Your working peers</h4>
     <div class="bigscore num" style="font-size:42px">${peers}</div>
     <p class="body dim small">Each batch of friendly peers smooths your bills through ping-pong — roughly +0.4 votes of effective margin per peer (capped) and fewer ambushes from the red benches.</p>
     <div class="menu tight"><button class="btn small" id="ld-app">Appoint working peers · 6 cap</button></div></div></div>
   <div><div class="seclbl">THE MOOD OF THE RED BENCHES</div>
    <div class="panelbox"><p class="body">${peers>8?"Their lordships grumble that you've packed the place. They are correct.":peers>3?"A respectable presence. Your bills get a fairer wind.":"You are outnumbered among the ermine. Expect ambushes on anything radical."}</p></div></div></div>`;
  $("#ld-app").onclick=()=>{const b4=snapStats();const r=E.appointPeers(S);
    if(!r.ok){toast(r.msg||"Cannot.");return}toast("<b>+PEERS</b> · now "+r.peers);toastDiff(b4);renderAll();save()};
}

/* ---------- ECONOMY LAB ---------- */
function seriesChart(id,series,ymin,ymax,unit){
  series=series.map(s2=>{const a=(s2[2]||[]).filter(v=>isFinite(v));
    return[s2[0],s2[1],a.length>=2?a:[a[0]??0,a[0]??0]]});
  const N=Math.max(...series.map(s2=>s2[2].length));
  const x=i=>i/(N-1)*560,y=v=>132-((v-ymin)/(ymax-ymin))*124;
  let grid="";const step=(ymax-ymin)/4;
  for(let g=ymin;g<=ymax+0.01;g+=step)grid+=`<line x1="0" y1="${y(g).toFixed(1)}" x2="560" y2="${y(g).toFixed(1)}" class="pgrid"/><text x="3" y="${(y(g)-2).toFixed(1)}" class="pgl">${(Math.round(g*10)/10)}${unit}</text>`;
  const lines=series.map(s2=>{
    const arr=s2[2];const p=arr.map((v,i)=>`${i?"L":"M"}${x(i+(N-arr.length)).toFixed(1)},${y(v).toFixed(1)}`).join("");
    return`<path d="${p}" fill="none" stroke="${s2[1]}" stroke-width="2"/><text x="566" y="${(y(arr[arr.length-1])+3).toFixed(1)}" class="plend" fill="${s2[1]}">${s2[0]}</text>`}).join("");
  return`<svg viewBox="0 0 660 140" class="econchart" id="${id}">${grid}${lines}</svg>`;
}
function renderEconLab(){
  const H=S.hist;const E2=S.econ;
  const mk=(t,html)=>`<div class="panelbox"><h4>${t}</h4>${html}</div>`;
  $("#tab-econlab").innerHTML=`<div class="seclbl">THE ECONOMY LAB — every dial, every linkage</div><div class="duo">
   <div>
    ${mk("INFLATION vs BANK RATE — the duel",seriesChart("c1",[["CPI","#e2543f",H.infl||[E2.infl]],["Rate","#7fa3c0",H.rates||[E2.rates]]],0,Math.max(8,Math.ceil(Math.max(...(H.infl||[5])))),"%"))}
    ${mk("GROWTH (annualised)",seriesChart("c2",[["GDP","#5fc88f",(H.gdp||[]).map((v,i,a)=>i?((v/a[i-1]-1)*1200):1.4)]],-4,5,"%"))}
    ${mk("UNEMPLOYMENT",seriesChart("c3",[["Jobless","#c9a86a",H.unemp||[E2.unemp]]],2,9,"%"))}
    ${mk("DEBT & MARKET CONFIDENCE",seriesChart("c4",[["Debt %GDP","#e2543f",H.debt||[E2.debt]],["Markets","#5fc88f",H.trust||[E2.trust]]],0,140,""))}
   </div>
   <div>
    <div class="panelbox"><h4>THE TRANSMISSION — how it all connects, live</h4><div class="cab">
     <div class="row2"><span>Bank rate ${fmt1(E2.rates)}% → growth drag</span><span class="num ${E2.rates>4?"bad":"dim"}">−${fmt1(Math.max(0,0.45*(E2.rates-3.25)))}pp</span></div>
     <div class="row2"><span>Deficit ${fmt1(S.fiscalDeficit)}% → inflation push</span><span class="num ${S.fiscalDeficit>4?"bad":"dim"}">+${fmt1(Math.max(0,(S.fiscalDeficit-3.5)*0.32))}pp</span></div>
     <div class="row2"><span>Inflation ${fmt1(E2.infl)}% → approval drag</span><span class="num ${E2.infl>3?"bad":"dim"}">−${fmt1(Math.max(0,E2.infl-2)*1.8)}pts</span></div>
     <div class="row2"><span>Growth ${fmt1(E2.g)}% → approval lift</span><span class="num ${E2.g>1?"good":"dim"}">${E2.g>0?"+":""}${fmt1(E2.g*2.1)}pts</span></div>
     <div class="row2"><span>Approval → your poll share</span><span class="num dim">${S.meta.phase==="government"?"24 + 0.42×approval":"anchored to the gov's failure"}</span></div>
     <div class="row2"><span>Markets ${Math.round(E2.trust)}/100 → gilt premium</span><span class="num ${E2.trust<40?"bad":"dim"}">+${fmt1((60-Math.min(60,E2.trust))/25)}%</span></div>
    </div><p class="dim small" style="margin-top:8px">Every arrow is computed from the live engine, not decoration. Drop markets under 25 and the gilt strike forces an emergency budget.</p></div>
    ${S.meta.phase==="government"?`<div class="panelbox"><h4>MONETARY LEVERS</h4><div class="opts">
     <button class="choice" id="el-lean">Lean on the Governor<small>Rates −0.5 now · markets −8 · inflation risk · 8 capital</small></button>
     <button class="choice" id="el-qe">Request QE<small>Only in a crisis (markets &lt;40) · markets +9, inflation +0.5 · 6 capital</small></button>
     <button class="choice" id="el-hawk">Appoint a HAWK Governor<small>Bank fights inflation harder · markets +6 · 8 capital</small></button>
     <button class="choice" id="el-dove">Appoint a DOVE Governor<small>Bank protects growth · markets −4 · 8 capital</small></button>
    </div>${S.flags.govHawk?'<p class="small warn">Current Governor: HAWK</p>':S.flags.govDove?'<p class="small warn">Current Governor: DOVE</p>':""}</div>`
    :`<div class="panelbox"><h4>THE OPPOSITION'S ECONOMIC WEAPONS</h4><div class="opts">
     <button class="choice" id="el-attack">Savage the record on the airwaves<small>Government approval −1.2 · press +1 · 4 capital</small></button>
     <button class="choice" id="el-pledge">The Iron Pledge — independent audit of every plan<small>Markets +4, polls +0.5 · once per career · 3 capital</small></button>
    </div><p class="dim small">The Bank doesn't take your calls. The charts are public; the dials belong to the government — until you take it.</p></div>`}
   </div></div>`;
  const elL=$("#el-lean");if(elL)elL.onclick=()=>{const b4=snapStats();const r=E.leanOnBank(S);if(!r.ok){toast(r.msg||"Not enough capital.");return}toastDiff(b4);renderAll();save()};
  const elQ=$("#el-qe");if(elQ)elQ.onclick=()=>{const b4=snapStats();const r=E.requestQE(S);if(!r.ok){toast(r.msg);return}toastDiff(b4);renderAll();save()};
  const elH=$("#el-hawk");if(elH)elH.onclick=()=>{const r=E.appointGovernor(S,"hawk");if(!r.ok){toast(r.msg);return}renderAll();save()};
  const elD=$("#el-dove");if(elD)elD.onclick=()=>{const r=E.appointGovernor(S,"dove");if(!r.ok){toast(r.msg);return}renderAll();save()};
  const elA=$("#el-attack");if(elA)elA.onclick=()=>{
    if(S.pols.capital<4){toast("Not enough capital.");return}
    const b4=snapStats();E.applyEffects(S,{capital:-4,gov:{app:-1.2},media:1});
    E.frontPage(S,"THE SHADOW CHANCELLOR DRAWS BLOOD","Your economy attack lands on every bulletin. The Treasury issues a rebuttal that everyone reads as confirmation.");
    toastDiff(b4);renderAll();save()};
  const elP=$("#el-pledge");if(elP)elP.onclick=()=>{const b4=snapStats();const r=E.fiscalPledge(S);
    if(!r.ok){toast(r.msg||"Cannot.");return}toastDiff(b4);renderAll();save()};
}

/* ---------- core flow ---------- */
function advance(){
  busy=true;$("#bt-advance").disabled=true;
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
    if(S.flags.mad){endGame("mad");return}
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
     <div class="opts">${topics.map((t,ti)=>`<button class="choice" data-ti="${ti}">${t.label}<small>how bad it is for them: ${t.bad>6?"very":t.bad>3?"quite":"mildly"}</small></button>`).join("")}</div>`,true);
    $$("#modal .choice").forEach(b2=>b2.onclick=()=>{
      const ti=+b2.dataset.ti;const tobj=topics[ti];
      modal(`<div class="lbl gold">PMQs — ${tobj.label}</div><h3>How do you go at them?</h3>
       <div class="opts">
        <button class="choice" data-s="forensic">Pin them down with detail<small>Reliable damage, no fireworks</small></button>
        <button class="choice" data-s="theatrical">Go for the soundbite<small>One brutal line for the news — riskier</small></button>
        <button class="choice" data-s="statesman">Stay statesmanlike<small>Look like a PM-in-waiting</small></button>
       </div>`,true);
      $$("#modal .choice").forEach(c=>c.onclick=()=>{const b4=snapStats();E.pmqsResolve(S,tobj,c.dataset.s);closeModal();toastDiff(b4);renderAll();save();done()});
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
       <div class="small dim" style="margin-top:8px">Campaign strength: <b class="num">${fmt1(boost)}</b></div>`,true);
      $$("#modal .choice").forEach(b=>b.onclick=()=>{boost+=c.o[+b.dataset.i][1];step++;pushPoll();stepFn()});
      return}
    const R=E.computeElection(S,boost+(S.opp&&S.opp.warchest>6?1:0),{shock:true});
    S.lastElection=R;
    const mine=R.rows[0].seats,newMaj=mine*2-650;
    const CA=E.coalitionAnalysis(R.rows);
    const youTop=CA.top&&CA.top.you;
    const win=newMaj>0,hung=!win&&youTop;
    const DEALS={lib:"Electoral reform referendum (deal)",snp:"A say on indyref (deal)",grn:"Green spending guarantees (deal)",ref:"A hard migration cap (deal)",res:"Restoration agenda concessions (deal)",lab:"A national-interest pact (deal)",con:"A national-interest pact (deal)"};
    let dealBtns="";
    if(hung&&CA.viable){
      let run=[],tot2=mine;
      CA.combo.forEach((p,ix)=>{run.push(p);tot2+=p.seats;
        if(tot2>325||ix===CA.combo.length-1)dealBtns+=`<button class="btn" data-deal="${ix}">Deal with ${run.map(r=>r.n.replace(" (you)","")).join(" + ")} — ${tot2} seats</button>`});
    }
    modal(`<div class="lbl gold">Election night</div>
     <h3>${win?"A MANDATE":hung?"A HUNG PARLIAMENT":"DEFEAT"}</h3>
     <div class="body">${win?`The map turns ${PARTIES[S.meta.party].name} at 3.41am. Majority of <b class="num">${newMaj}</b>.`:CA.text}</div>
     <div class="dim small" style="margin:4px 0 8px">${R.pollErr?`The final polls were out by <b class="num">${fmt1(Math.abs(R.pollErr))}%</b> — ${R.pollErr>0?"in your favour":"against you"}.`:""} ${S.flags.pactWith?`Your pact with ${PARTIES[S.flags.pactWith].name} held.`:""}</div>
     ${seatBarHTML(R.rows)}
     ${ukMapHTML(R,"THE RESULT — all 650 seats")}
     <div class="menu">${win?'<button class="btn" id="elc">Govern</button>'
       :hung?dealBtns+'<button class="btn ghost" id="elm">Govern alone as a minority</button>'
       :'<button class="btn red" id="elx">Face the music</button>'}</div>`,true);
    if(win){$("#elc").onclick=()=>{closeModal();E.settleElectionWin(S,mine);E.setHouse(S,R);
      delete S.flags.coalitionSeats;delete S.flags.coalitionWith;
      if(newMaj>100)ach("landslide","Landslide — majority 100+");ach("first_win","Mandate — won a general election");
      if(S.meta.becamePM&&S.meta.oppMonths>0)ach("climber","The Long Climb — opposition to No. 10");
      renderAll();save();done()}}
    else if(hung){
      $$("#modal [data-deal]").forEach(btn=>btn.onclick=()=>{
        const upto=+btn.dataset.deal;closeModal();
        const partners=CA.combo.slice(0,upto+1);
        E.settleElectionWin(S,mine);E.setHouse(S,R);
        S.flags.minority=false;
        S.flags.coalitionSeats=partners.reduce((a2,p)=>a2+p.seats,0);
        S.flags.coalitionWith=partners.map(p=>p.n.replace(" (you)","")).join(" + ");
        partners.forEach(p=>{if(DEALS[p.key])E.applyEffects(S,{promise:DEALS[p.key]});
          if(p.key==="snp")E.applyEffects(S,{scot:5});});
        E.applyEffects(S,{unity:-6});
        ach("kingmaker","Kingmaker — governed by deal");
        toast("<b>COALITION</b> · with "+S.flags.coalitionWith);
        renderAll();save();done()});
      const em=$("#elm");if(em)em.onclick=()=>{closeModal();E.settleElectionWin(S,mine);E.setHouse(S,R);S.flags.minority=true;
        delete S.flags.coalitionSeats;delete S.flags.coalitionWith;
        E.applyEffects(S,{unity:-4});renderAll();save();done()}}
    else{$("#elx").onclick=()=>{closeModal();
      const out=E.settleElectionLoss(S);E.setHouse(S,R);
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
   hague:["THE HAGUE ENDING","You tried to invade France."],
   mad:["MUTUAL ANNIHILATION","The folder was opened. The reply took eleven minutes."]};
  const t=titles[kind]||titles.resign;
  if(kind==="mad")ach("midnight","Midnight — there was no morning");
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
