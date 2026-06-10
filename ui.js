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
$("#bt-continue").onclick=()=>{try{const raw=localStorage.getItem(LSK);if(!raw)return;S=E.rehydrate(JSON.parse(raw));enterGame();}catch(e){toast("Save unreadable.")}};
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
      <div class="panelbox" style="max-width:580px"><h4>The ballot paper</h4><div class="cab">
       <div class="row2"><span>Scenario</span><span><b>${s.name}</b> <a class="wizchg" data-s="0">change</a></span></div>
       <div class="row2"><span>Difficulty</span><span><b>${DIFFS[cfg.difficulty].name}</b> <a class="wizchg" data-s="1">change</a></span></div>
       <div class="row2"><span>Party</span><span><b>${p.name}</b> <a class="wizchg" data-s="2">change</a></span></div>
       <div class="row2"><span>Past life</span><span><b>${b.name}</b> <a class="wizchg" data-s="3">change</a></span></div>
       <div class="row2"><span>Opening position</span><span class="dim small">${partyStatLine(cfg.scenario,p)}</span></div>
      </div></div>
      <div class="menu"><button class="btn" id="bt-begin">Take the stage</button></div>`;
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

/* ---------- game shell ---------- */
let tab="hub",prev={};
function enterGame(){
  const col=PARTIES[S.meta.party].col;
  document.documentElement.style.setProperty("--party",col);
  document.documentElement.style.setProperty("--party-soft",col+"33");
  show("#scr-game");tab="hub";renderAll();save()}
$$("#gametabs button").forEach(b=>b.onclick=()=>{tab=b.dataset.t;renderAll()});
$("#bt-advance").onclick=()=>{if(!busy)advance()};
$("#bt-abandon").onclick=()=>{modal(`<h3>Abandon this career?</h3><div class="body">History will record nothing, which is its own mercy.</div>
  <div class="menu"><button class="btn red" id="yq">Abandon</button><button class="btn ghost" id="nq">Stay</button></div>`);
  $("#yq").onclick=()=>{try{localStorage.removeItem(LSK)}catch(e){};closeModal();show("#scr-title")};$("#nq").onclick=closeModal};

function renderAll(){const sy=window.scrollY;renderHUD();renderTicker();
  $$("#gametabs button").forEach(b=>b.classList.toggle("on",b.dataset.t===tab));
  $$(".tabpane").forEach(p=>{const on=p.id==="tab-"+tab;p.classList.toggle("on",on);if(!on)p.innerHTML=""});
  if(tab==="office")$("#tab-office").innerHTML='<div class="duo"><div id="ov-left"></div><div id="ov-right"></div></div>';
  ({hub:renderHub,office:renderOverview,cabinet:renderCabinet,treasury:renderTreasury,commons:renderParliament,world:renderWorld,media:renderMedia,campaign:renderCampaign})[tab]();
  window.scrollTo({top:sy});
}
function renderHUD(){
  const p=S.pols,e=S.econ,gov=S.meta.phase==="government";
  $("#hud-name").textContent=S.meta.pm+" · "+PARTIES[S.meta.party].name+(gov?" · PM":" · Leader of the Opposition");
  $("#hud-date").textContent=E.dateStr(S)+" · month "+S.meta.month+(S.world.war?" · ⚔ "+S.world.war.name:"")+(gov?"":" · election in ≤"+Math.max(0,S.opp.electionDue)+"m");
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

/* ---------- OVERVIEW ---------- */
function renderOverview(){
  const host=$("#ov-left");
  const warB=S.world.war?`<div class="warbanner">⚔ ${S.world.war.name} — ${S.world.war.phase==="fighting"?"FIGHTING":S.world.war.phase.toUpperCase()} · support ${Math.round(S.world.war.support)}% · casualties ${Math.round(S.world.war.cas)}</div>`:"";
  host.innerHTML=warB+`<div class="panelbox"><h4>Poll tracker — you <span class="dotme">●</span> v ${S.meta.phase==="government"?"opposition":"government"} <span class="dotgov">●</span></h4>
   <svg id="polls" viewBox="0 0 600 110" preserveAspectRatio="none" class="bigchart"></svg>
   <div class="legend2"><span>you ${fmt1(S.pols.pollMe)}%</span><span>${S.meta.phase==="government"?"opp":"gov"} ${fmt1(S.meta.phase==="government"?(100-S.pols.pollMe-28):S.opp.gov.poll)}%</span><span>approval ${fmt1(S.pols.approval)}%</span><span>markets ${Math.round(S.econ.trust)}/100</span></div></div>
  <div class="panelbox"><h4>Recent history</h4><div class="log">${S.log.map(l=>`<div><b>${l.m}</b>${l.t}</div>`).join("")||"<div>Nothing yet. It won't last.</div>"}</div></div>`;
  drawPolls();
  $("#ov-right").innerHTML=`<span class="lbl">Tomorrow's front page</span>${paperHTML()}
   <div class="panelbox"><h4>The dashboard</h4><div class="cab">
    ${[["NHS waiting list",fmt1(S.svc.nhsWait)+"m",S.svc.nhsWait<6?"good":S.svc.nhsWait<7.5?"warn":"bad"],
       ["Net migration",Math.round(S.svc.mig)+"k",S.svc.mig<450?"good":S.svc.mig<650?"warn":"bad"],
       ["Crime index",Math.round(S.svc.crime),S.svc.crime<98?"good":S.svc.crime<110?"warn":"bad"],
       ["Housing starts",Math.round(S.svc.housing)+"k",S.svc.housing>220?"good":"warn"],
       ["Energy security",Math.round(S.svc.energy),S.svc.energy>60?"good":"warn"],
       ["Debt",Math.round(S.econ.debt)+"% GDP",S.econ.debt<100?"warn":"bad"],
       ["Deficit",fmt1(S.fiscalDeficit)+"%",S.fiscalDeficit<3.5?"good":S.fiscalDeficit<5?"warn":"bad"],
       ["Unemployment",fmt1(S.econ.unemp)+"%",S.econ.unemp<4.8?"good":"warn"],
       ["Sleaze",Math.round(S.pols.sleaze),S.pols.sleaze<35?"good":S.pols.sleaze<60?"warn":"bad"],
       ["World standing",Math.round(S.world.standing),S.world.standing>55?"good":"warn"]]
     .map(x=>`<div class="row2"><span>${x[0]}</span><span class="num ${x[2]}">${x[1]}</span></div>`).join("")}</div></div>`;
}
function paperHTML(){const pp=S.paper;
  return`<div class="paper"><div class="mh">${pp.mh}</div>
   <div class="strap"><span>${E.dateStr(S)}</span><span>£1.20 · EST. 1888</span></div>
   <h2>${pp.head}</h2><div class="sub2">${pp.sub}</div><div class="mkts">${pp.mkts||""}</div></div>`}
function drawPolls(){
  const a=S.hist.pollMe,b=S.hist.pollGov,N=a.length;if(N<2)return;
  const x=i=>i/(N-1)*600, y=v=>108-(v-5)/45*104;
  const path=arr=>arr.map((v,i)=>`${i?"L":"M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  $("#polls").innerHTML=`<line x1="0" y1="${y(33)}" x2="600" y2="${y(33)}" stroke="rgba(236,232,218,.1)"/>
   <path d="${path(b)}" fill="none" stroke="#8d8d8d" stroke-width="1.6" opacity=".8"/>
   <path d="${path(a)}" fill="none" stroke="${PARTIES[S.meta.party].col}" stroke-width="2.2"/>`;
}

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
    const r=E.enactBill(S,b.dataset.b,b.dataset.w==="1");
    if(!r.ok){toast(r.msg||"Cannot.");return}
    divisionTheatre(r);save()});
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

/* ---------- WORLD ---------- */
let selRegion=null;
function renderWorld(){
  const blobs=MAP_BLOBS.map(p=>`<path d="${p}" class="blob"/>`).join("");
  const nodes=Object.entries(REGIONS).map(([k,m])=>{
    const r=S.world.regions[k];const hue=Math.round(8+(r.rel+100)/200*120);
    const dep=S.mil.dep[k];const war=S.world.war&&S.world.war.theatre===k;
    return`<g class="rnode${selRegion===k?" sel":""}${war?" war":""}" data-r="${k}" transform="translate(${m.x},${m.y})">
      <circle r="${m.home?11:7+(m.trade||3)*.5}" style="fill:hsl(${hue},45%,${m.home?52:38}%)"/>
      ${war?'<circle r="14" class="pulse"/>':""}
      <text y="${m.tiny?24:22}" class="rlabel">${m.n.toUpperCase()}</text>
      ${dep&&(dep.brig||dep.car)?`<text y="-14" class="rdep">${"▲".repeat(dep.brig||0)}${dep.car?"⚓":""}</text>`:""}
    </g>`}).join("");
  $("#tab-world").innerHTML=`<div class="duo wide">
   <div><div class="lbl">The situation board</div>
    <svg id="worldmap" viewBox="0 0 960 480">${blobs}${nodes}</svg>
    <div class="milbar num">FORCES — brigades ${S.mil.brig} home / ${4-S.mil.brig-(S.world.war?0:0)} deployed · carrier ${S.mil.car?"in port":"at sea"} · deterrent: <span class="dim">unmentionable</span> · standing ${Math.round(S.world.standing)}</div>
   </div>
   <div id="regionpanel">${regionPanel()}</div></div>`;
  $$("#worldmap .rnode").forEach(g=>g.onclick=()=>{selRegion=g.dataset.r;renderWorld()});
}
function regionPanel(){
  if(!selRegion)return`<div class="panelbox"><h4>Select a region</h4><p class="body dim">Click the board. Diplomacy, trade, sanctions, aid, covert action, deployments — every needle moves something else.</p>
   ${S.world.war?`<div class="warbanner">⚔ ${S.world.war.name} · ${S.world.war.phase} · support ${Math.round(S.world.war.support)}%</div>`:""}</div>`;
  const k=selRegion,m=REGIONS[k],r=S.world.regions[k];
  const gov=S.meta.phase==="government";
  const occupied=r.occupied;
  let acts=gov?[["summit","Summit in "+m.cap,"5 cap"],["trade","Trade mission","5 cap"],["sanction","Sanctions","4 cap"],["aid","Aid package","4 cap"],["covert","Covert operation","7 cap · risky"],["deploy","Deploy brigade","forces"],["recall","Recall brigade","—"],["carrier","Send the carrier","forces"]]
    :[["summit","Profile visit to "+m.cap,"5 cap"]];
  if(gov&&!m.home&&!occupied)acts.push(["invade","INVADE "+m.n,(r.rel<-40?"15 cap · a case exists":"15 cap · UNPROVOKED — the world will answer")]);
  return`<div class="panelbox"><h4>${m.n} · ${m.cap}</h4>
   <div class="cab"><div class="row2"><span>Relations</span><span class="num ${r.rel>20?"good":r.rel<-20?"bad":"warn"}">${Math.round(r.rel)}</span></div>
   <div class="row2"><span>Trade value</span><span class="num">${r.trade}/10</span></div>
   ${S.mil.dep[k]&&S.mil.dep[k].brig?`<div class="row2"><span>Deployed</span><span class="num">${S.mil.dep[k].brig} bde${S.mil.dep[k].car?" + carrier":""}</span></div>`:""}
   ${occupied?'<div class="row2"><span class="bad">⚑ UNDER BRITISH OCCUPATION</span><span class="dim small">administration events will arrive</span></div>':""}</div>
   <div class="opts" style="margin-top:10px">${acts.map(a=>`<button class="choice small" data-a="${a[0]}">${a[1]}<small>${a[2]}</small></button>`).join("")}</div></div>`;
}
document.addEventListener("click",e=>{
  const b=e.target.closest("#regionpanel .choice");if(!b)return;
  const act=b.dataset.a;
  if(act==="invade"){
    const m=REGIONS[selRegion],r0=S.world.regions[selRegion];
    modal(`<div class="lbl" style="color:var(--red)">Military action</div><h3>Invade ${m.n}?</h3>
     <div class="body">${selRegion==="france"?"The Chief of the Defence Staff removes his glasses very slowly.":r0.rel<-40?"A hostile state. A legal case can be assembled; allies will grumble but follow.":"No mandate, no UN cover, no allied support. Markets, allies and history will all answer at once."}</div>
     <div class="menu"><button class="btn red" id="invgo">Order the invasion</button><button class="btn ghost" id="invno">Stand down</button></div>`);
    $("#invno").onclick=closeModal;
    $("#invgo").onclick=()=>{closeModal();
      const r=E.regionAction(S,selRegion,"invade");
      if(r.hague){endGame("hague");return}
      if(!r.ok){toast(r.msg||"Cannot.");return}
      ach("warlord","Casus Belli — ordered an invasion");renderAll();save()};
    return;
  }
  const r=E.regionAction(S,selRegion,act);
  if(!r.ok){toast(r.msg||"Cannot.");return}
  renderAll();save();
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
  const due=gov?(58-(S.meta.month-S.meta.termStart)):"≤"+Math.max(0,S.opp.electionDue);
  const target=S.flags.targetRegion;
  $("#tab-campaign").innerHTML=`<div class="duo">
   <div><div class="lbl" style="margin-top:10px">The war room</div>
    <div class="panelbox"><h4>Poll tracker — you <span class="dotme">●</span> v ${gov?"opposition":"government"} <span class="dotgov">●</span></h4>
     <svg id="polls" viewBox="0 0 600 110" preserveAspectRatio="none" class="bigchart"></svg>
     <div class="legend2"><span>you ${fmt1(S.pols.pollMe)}%</span><span>them ${fmt1(gov?(100-S.pols.pollMe-28):S.opp.gov.poll)}%</span><span>months to election: <b class="num">${due}</b></span>${S.opp?`<span>war chest £${fmt1(S.opp.warchest)}m</span>`:""}</div></div>
    ${S.lastElection?`<div class="panelbox"><h4>Last election — the map</h4>${electMapHTML(S.lastElection.regions)}</div>`:""}
   </div>
   <div><div class="lbl" style="margin-top:10px">Ground game</div>
    <div class="panelbox"><h4>Target region — bank extra swing where it matters</h4>
     <div class="opts">${ELECT_REGIONS.map(([k,label,seats])=>`<button class="choice small ${target===k?"selz":""}" data-tr="${k}">${label} <small>${seats} seats${target===k?" · TARGETED":""}</small></button>`).join("")}</div></div>
    ${gov?`<div class="panelbox"><h4>The button</h4><p class="body dim small">Approval ${fmt1(S.pols.approval)}%. The models give you ${Math.round(E.sig((S.pols.approval-41)/6)*100)}% odds of a majority.</p>
     <div class="menu tight"><button class="btn red small" id="bt-snap2">Call snap election · 20 cap</button></div></div>`
    :`<div class="panelbox"><h4>Fundraising</h4><p class="body dim small">Dinners, raffles, a man named Clive with opinions about crypto.</p>
     <div class="menu tight"><button class="btn ghost small" id="bt-fund">Fundraise · 3 cap</button></div></div>`}
   </div></div>`;
  drawPolls();
  $$("#tab-campaign [data-tr]").forEach(b=>b.onclick=()=>{S.flags.targetRegion=b.dataset.tr;toast("<b>TARGETED</b> · "+b.dataset.tr.toUpperCase());renderCampaign();save()});
  const sn=$("#bt-snap2");if(sn)sn.onclick=()=>{
    if(S.pols.capital<20){toast("Not enough capital.");return}
    modal(`<h3>Go to the country?</h3><div class="body">There is no taking it back.</div>
     <div class="menu"><button class="btn red" id="snapgo">Call it</button><button class="btn ghost" id="snapno">Lose nerve</button></div>`);
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
    E.resolveOption(S,card,+b.dataset.i);closeModal();
    if(S.flags._resign){endGame("resign");return}
    if(S.meta.over){endGame("ousted");return}
    renderAll();save();done();
  });
}

/* ---------- PMQs ---------- */
function openPMQs(){
  const gov=S.meta.phase==="government";
  const topics=E.pmqsTopics(S);
  if(gov){
    const t=topics[0];
    modal(`<div class="lbl gold">Prime Minister's Questions · ${E.dateStr(S)}</div>
     <h3>${S.pols.oppName} rises on ${t.label}</h3>
     <div class="body">Six questions, one trap, and the House smelling blood either way. How do you play it?</div>
     <div class="opts">
      <button class="choice" data-s="own">Own the numbers<small>Forensic, dry, oddly effective</small></button>
      <button class="choice" data-s="pivot">Pivot to attack<small>Their record, louder</small></button>
      <button class="choice" data-s="joke">The prepared joke<small>Live by the gag…</small></button>
      <button class="choice" data-s="pledge">Make a pledge, live<small>Escape via hostage-taking (of yourself)</small></button>
     </div>`,true);
    $$("#modal .choice").forEach(b=>b.onclick=()=>{E.pmqsResolve(S,t.k,b.dataset.s);closeModal();renderAll();save();done()});
  } else {
    modal(`<div class="lbl gold">Prime Minister's Questions · ${E.dateStr(S)}</div>
     <h3>Your six questions. Choose the wound.</h3>
     <div class="body">The PM is across the despatch box pretending not to rehearse. Pick the topic, then the blade.</div>
     <div class="opts">${topics.map(t=>`<button class="choice" data-k="${t.k}">${t.label}<small>severity ${fmt1(t.bad)}</small></button>`).join("")}</div>`,true);
    $$("#modal .choice").forEach(b=>b.onclick=()=>{
      const k=b.dataset.k;
      modal(`<div class="lbl gold">PMQs — on ${topics.find(x=>x.k===k).label}</div><h3>The blade</h3>
       <div class="opts">
        <button class="choice" data-s="forensic">The forensic six-pack<small>Each question narrows the cage</small></button>
        <button class="choice" data-s="theatrical">The theatrical zinger<small>One line for the bulletins</small></button>
        <button class="choice" data-s="statesman">Above the fray<small>More in sorrow than in anger</small></button>
       </div>`,true);
      $$("#modal .choice").forEach(c=>c.onclick=()=>{E.pmqsResolve(S,k,c.dataset.s);closeModal();renderAll();save();done()});
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
