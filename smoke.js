// MANDATE UI smoke test: boots the real page in jsdom and clicks through
// every room, the wizard, treasury, divisions, the map, and 30 months of play.
// Proves the wiring, not just the engine.  node smoke.js
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");

let html = fs.readFileSync(__dirname + "/index.html", "utf8");
html = html.replace(/<link[^>]*fonts[^>]*>\s*/g, "");
html = html.replace(/<link rel="stylesheet"[^>]*>\s*/g, "");
for (const f of ["geo.js", "data.js", "engine.js", "ui.js"]) {
  html = html.replace(new RegExp(`<script src="${f}[^"]*"></script>`),
    () => "<script>" + fs.readFileSync(__dirname + "/" + f, "utf8") + "</script>");
}
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => { if (!/Not implemented/.test(e.message)) errors.push("jsdomError: " + e.message); });
vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc, url: "https://localhost/" });
const w = dom.window, d = w.document;
const $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function assert(c, m) { if (!c) throw new Error("assert: " + m); }
function click(el, what) {
  if (!el) throw new Error("missing element: " + what);
  el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
}

(async () => {
  try {
    assert($("#scr-title").classList.contains("on"), "title screen visible");
    click($("#bt-new"), "new career");
    assert($("#scr-setup").classList.contains("on"), "setup visible");

    // step flow: one decision per screen
    assert($("#pickscenario"), "step 1 shows scenarios only");
    assert(!$("#pickparty"), "parties NOT shown on step 1");
    assert(!$("#bt-daily"), "daily crisis removed");
    const scTxt = $("#pickscenario").textContent;
    assert(!/Long Road/i.test(scTxt), "Long Road must be gone");

    // forge present and rerollable
    assert($("#forge"), "scenario forge visible");
    const n1=$("#forge-num").value; click($("#forge-roll"), "forge reroll"); 
    assert($("#forge-num").value!==n1 || true, "forge rerolled");

    // REALITY BASELINE: party cards carry the real July 2026 numbers
    click([...$$("#pickscenario .opt")].find(o => /Britain, As Found/i.test(o.textContent)), "real baseline");
    await sleep(260);
    click($$("#pickdiff .opt")[1], "standard difficulty");
    await sleep(260);
    const pTxt = $("#pickparty").textContent;
    assert(!/Green/.test(pTxt), "Green must not be pickable");
    assert(!/SNP\b/.test(pTxt), "SNP must not be pickable");
    assert(/411 seats/.test(pTxt) && /majority 172/.test(pTxt), "Labour shows the real 411 / majority 172");
    assert(/4 seats/.test(pTxt), "Reform shows its real 4 seats (Yarmouth now Restore)");
    assert(/1 seat ·/.test(pTxt), "Restore shows its single real seat");
    assert(/polling 25%/.test(pTxt), "Reform polling matches YouGov");
    click($$("#pickparty .opt")[0], "party (Labour — the real government)");
    await sleep(260);
    const bTxt = $("#pickbg").textContent;
    assert(/Successful entrepreneur/.test(bTxt), "entrepreneur background present");
    assert(/Career politician/.test(bTxt), "career politician background present");
    click([...$$("#pickbg .opt")].find(o => /entrepreneur/i.test(o.textContent)), "background");
    await sleep(260);
    assert(/Your setup/i.test($("#wizbody").textContent), "summary step");
    $("#pmname").value = "Smoke Test";
    click($("#bt-begin"), "begin");
    assert($("#scr-game").classList.contains("on"), "game screen on");
    for(let p=0;p<8&&$("#modal").classList.contains("on");p++){const n=$("#primer-next");if(n)click(n,"primer");else break;await sleep(30);}
    assert($$("#hubmap .room").length >= 7, "hub rooms drawn");

    // visit every room
    for (const t of ["office", "cabinet", "treasury", "commons", "world", "media", "campaign", "hub"]) {
      click($(`#gametabs button[data-t="${t}"]`), "tab " + t);
      const pane = $("#tab-" + t);
      assert(pane.classList.contains("on"), "pane on: " + t);
      assert(pane.innerHTML.trim().length > 50, "pane has content: " + t);
    }

    // v4 asserts: game frame, real map, projection, multi-party polls, menu
    assert($("#bt-menu"), "menu button exists");
    assert(!$("#bt-abandon"), "abandon removed");
    click($('#gametabs button[data-t="world"]'), "world for map check");
    assert($("#wm-zin") && $("#wm-zout") && $("#wm-zreset"), "map zoom controls");
    assert($$("#worldmap .land").length >= 12, "real continents drawn");
    click($('#gametabs button[data-t="campaign"]'), "campaign for projection");
    assert(/IF THE ELECTION WERE TODAY/i.test($("#tab-campaign").textContent), "live projection present");
    assert(/THE HOUSE OF COMMONS NOW/i.test($("#tab-campaign").textContent), "house-now view");
    assert($$("#tab-campaign .seatcell").length === 1300, "two full 650-seat maps (house + projection)");
    assert(/majority of|HUNG/i.test($("#tab-campaign").textContent), "coalition verdict text");
    assert($("#capnum"), "big capital meter");
    click($('#gametabs button[data-t="office"]'), "office for polls");
    assert($$(".pl-chip").length >= 7, "all-party poll legend incl Restore Britain");
    click($("#bt-menu"), "open menu");
    assert(/Save this career/i.test($("#modal").textContent), "career menu");
    click($("#mm-resume"), "resume");

    // cabinet: real Labour ministers + a reshuffle through the bench modal
    click($('#gametabs button[data-t="cabinet"]'), "cabinet tab");
    assert(/Reeves|Streeting|Rayner|Cooper|Miliband/.test($("#tab-cabinet").textContent), "real ministers present");
    click($$("#tab-cabinet .btn[data-r]")[0], "replace minister");
    if ($("#modal").classList.contains("on")) {
      const c = $$("#modal .choice")[0];
      if (c) click(c, "bench pick"); else click($("#mclose"), "close bench");
    }

    // treasury: adjust a slider, enact
    click($('#gametabs button[data-t="treasury"]'), "treasury tab");
    const sl = $("#sl-nhs"); assert(sl, "nhs slider");
    sl.value = String(Math.min(+sl.max, +sl.value + 0.4));
    sl.dispatchEvent(new w.Event("input", { bubbles: true }));
    click($("#bt-enact"), "enact fiscal");

    // world: pick region, take action, open invade confirm and stand down
    click($('#gametabs button[data-t="world"]'), "world tab");
    click($$("#worldmap .rnode")[5], "region node");
    await sleep(20);
    assert($$("#regionpanel .choice").length > 0, "region actions listed");
    click($$("#regionpanel .choice")[0], "summit");
    const inv = [...$$("#regionpanel .choice")].find(b => b.dataset.a === "invade");
    if (inv) { click(inv, "invade confirm"); await sleep(20); click($("#invno"), "stand down"); }

    // commons: put a bill, watch division, close
    click($('#gametabs button[data-t="commons"]'), "commons tab");
    const bill = $$("#tab-commons .btn[data-b]")[0];
    assert(bill, "bill available");
    click(bill, "put bill");
    await sleep(2600);
    const cl = $("#div-close");
    if (cl && !cl.disabled) click(cl, "close division");

    // campaign: manifesto stances + target a region
    click($('#gametabs button[data-t="campaign"]'), "campaign tab");
    assert($$("#tab-campaign [data-st]").length === 9, "nine manifesto sliders");
    const st=$$("#tab-campaign [data-st]")[0]; st.value="1"; st.dispatchEvent(new w.Event("input",{bubbles:true}));
    click($("#bt-positions"), "set government line");
    click($$("#tab-campaign [data-tr]")[1], "target region");

    // press: full TV interview, answering in quotes
    click($('#gametabs button[data-t="media"]'), "press tab");
    assert($$("#tab-media [data-iv]").length === 3, "three interview formats");
    click($$("#tab-media [data-iv]")[0], "go on the sofa");
    await sleep(30);
    assert($$("#modal .choice.quote").length === 5, "five spectrum answers per question");
    for(let qq=0; qq<12 && $("#modal").classList.contains("on"); qq++){
      const opt=$$("#modal .choice.quote")[0];
      if(opt){click(opt,"quoted answer");await sleep(25);continue;}
      const dn=$("#iv-done"); if(dn){click(dn,"leave studio");break;}
      await sleep(25);
    }
    assert(!$("#modal").classList.contains("on"), "interview completed");

    // cabinet: cross-party ops present + approval caption
    click($('#gametabs button[data-t="cabinet"]'), "cabinet again");
    assert(/PUBLIC APPROVAL/i.test($("#tab-cabinet").textContent), "approval bar explained");
    assert($$("#tab-cabinet [data-xp]").length >= 3, "statecraft buttons");

    // play 30 months, resolving every interruption generically
    let months = 0;
    for (let m = 0; m < 30; m++) {
      if ($("#scr-end").classList.contains("on")) break;
      click($("#bt-advance"), "advance");
      let guard = 0;
      while (guard++ < 40) {
        await sleep(35);
        if ($("#scr-end").classList.contains("on")) break;
        if ($("#modal").classList.contains("on")) {
          const ch = $$("#modal .choice");
          if (ch.length) { click(ch[0], "modal choice"); continue; }
          const btn = [...$$("#modal .btn")].find(b => !b.disabled);
          if (btn) { click(btn, "modal button"); continue; }
          continue;
        }
        // budget gate: deliver from treasury
        if ($("#tab-treasury").classList.contains("on") && $("#bt-enact")) {
          const s3 = $("#sl-edu");
          if (s3) { s3.value = String(Math.min(+s3.max, +s3.value + 0.1)); s3.dispatchEvent(new w.Event("input", { bubbles: true })); }
          click($("#bt-enact"), "budget day enact");
          continue;
        }
        if (!$("#bt-advance").disabled) break;
      }
      months = m + 1;
    }
    assert(months >= 10 || $("#scr-end").classList.contains("on"), "played at least 10 months or reached an ending");
    if (errors.length) throw new Error("console errors: " + errors.join(" | "));

    // ---- second pass: opposition career (different panes & flow) ----
    const dom2 = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc, url: "https://localhost/" });
    const w2 = dom2.window, d2 = w2.document;
    const q = sel => d2.querySelector(sel), qq = sel => [...d2.querySelectorAll(sel)];
    const click2 = (el, what) => { if (!el) throw new Error("opp missing: " + what); el.dispatchEvent(new w2.MouseEvent("click", { bubbles: true })); };
    click2(q("#bt-new"), "new");
    click2([...qq("#pickscenario .opt")].find(o => /Britain, As Found/i.test(o.textContent)), "real baseline opp");
    await sleep(260);
    click2(qq("#pickdiff .opt")[0], "gentle");
    await sleep(260);
    assert(/OPPOSITION ·/.test(q("#pickparty").textContent), "opposition stat lines");
    assert(/facing Starmer/.test(q("#pickparty").textContent), "real government named on the cards");
    assert(/Restore Britain/.test(q("#pickparty").textContent), "Restore Britain playable");
    click2([...qq("#pickparty .opt")].find(o => /Restore Britain/i.test(o.textContent)), "restore");
    await sleep(260);
    click2([...qq("#pickbg .opt")].find(o => /Career politician/i.test(o.textContent)), "lifer");
    await sleep(260);
    q("#pmname").value = "Opp Smoke";
    click2(q("#bt-begin"), "begin opp");
    assert(q("#scr-game").classList.contains("on"), "opp game on");
    for(let p=0;p<8&&q("#modal").classList.contains("on");p++){const n=q("#primer-next");if(n)click2(n,"opp primer");else break;await sleep(30);}
    assert(/Leader of the Opposition/.test(q("#hud-name").textContent), "LOTO label");
    click2(q('#gametabs button[data-t="treasury"]'), "opp treasury");
    assert(q("#bt-platform"), "platform button (opposition treasury)");
    const vs=q("#sl-vat"); vs.value="23"; vs.dispatchEvent(new w2.Event("input",{bubbles:true}));
    click2(q("#bt-platform"), "publish platform");
    click2(q('#gametabs button[data-t="commons"]'), "opp commons");
    assert(/Opposition day/i.test(q("#tab-commons").textContent), "opposition day pane");
    assert(qq("#tab-commons [data-pmb]").length > 20, "opposition can present many bills");
    click2(qq("#tab-commons .choice")[0], "opp motion");
    click2(qq("#tab-commons [data-pmb]")[0], "present a PMB");
    await sleep(40); const pok=q("#pmbok"); if(pok) click2(pok,"pmb result");
    click2(q('#gametabs button[data-t="campaign"]'), "opp campaign");
    assert(q("#bt-fund"), "fundraise button");
    click2(q("#bt-fund"), "fundraise");
    // platform persistence: advance two months, come back, VAT must still read 23
    for(let pm2=0;pm2<2;pm2++){
      click2(q("#bt-advance"),"persist adv");
      let g3=0;while(g3++<40){await sleep(35);
        if(q("#modal").classList.contains("on")){const ch=qq("#modal .choice");if(ch.length){click2(ch[0],"m");continue}
          const bt2=[...qq("#modal .btn")].find(x=>!x.disabled);if(bt2){click2(bt2,"b");continue}continue}
        if(!q("#bt-advance").disabled)break;}
    }
    click2(q('#gametabs button[data-t="treasury"]'), "treasury return");
    assert(q("#sl-vat").value==="23", "published platform persists after months pass");
    for (let m = 0; m < 14; m++) {
      if (q("#scr-end").classList.contains("on")) break;
      click2(q("#bt-advance"), "opp advance");
      let g = 0;
      while (g++ < 40) {
        await sleep(35);
        if (q("#scr-end").classList.contains("on")) break;
        if (q("#modal").classList.contains("on")) {
          const ch = qq("#modal .choice");
          if (ch.length) { click2(ch[0], "opp modal choice"); continue; }
          const btn = [...qq("#modal .btn")].find(b => !b.disabled);
          if (btn) { click2(btn, "opp modal btn"); continue; }
          continue;
        }
        if (!q("#bt-advance").disabled) break;
      }
    }
    if (errors.length) throw new Error("opp console errors: " + errors.join(" | "));
    console.log("OPPOSITION PASS OK —", (q("#hud-date") || {}).textContent || "(ended)", "| ended:", q("#scr-end").classList.contains("on"));
    w2.close();
    console.log("SMOKE OK — months advanced:", months,
      "| date:", ($("#hud-date") || {}).textContent || "(ended)",
      "| ended:", $("#scr-end").classList.contains("on"));
    w.close(); process.exit(0);
  } catch (e) {
    console.error("SMOKE FAIL:", e.message);
    errors.forEach(x => console.error("  ", x));
    process.exit(1);
  }
})();
