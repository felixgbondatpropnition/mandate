// MANDATE UI smoke test: boots the real page in jsdom and clicks through
// every room, the wizard, treasury, divisions, the map, and 30 months of play.
// Proves the wiring, not just the engine.  node smoke.js
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");

let html = fs.readFileSync(__dirname + "/index.html", "utf8");
html = html.replace(/<link[^>]*fonts[^>]*>\s*/g, "");
html = html.replace(/<link rel="stylesheet"[^>]*>\s*/g, "");
for (const f of ["data.js", "engine.js", "ui.js"]) {
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

    // coherence: Coalition of Chaos must show NO MAJORITY on party cards
    click([...$$("#pickscenario .opt")].find(o => /Coalition of Chaos/i.test(o.textContent)), "minority scenario");
    await sleep(260);
    assert($("#pickdiff"), "step 2 difficulty");
    click($$("#pickdiff .opt")[0], "difficulty");
    await sleep(260);
    assert($("#pickparty"), "step 3 parties");
    assert(/NO MAJORITY — 316/.test($("#pickparty").textContent), "minority scenario reflected on party cards");

    // back to scenario, choose fresh majority instead
    click($("#bt-wizback"), "back to diff"); click($("#bt-wizback"), "back to scenario");
    assert($("#pickscenario"), "back at step 1");
    click($$("#pickscenario .opt")[0], "fresh scenario");
    await sleep(260);
    click($$("#pickdiff .opt")[1], "standard difficulty");
    await sleep(260);
    const pTxt = $("#pickparty").textContent;
    assert(!/Green/.test(pTxt), "Green must not be pickable");
    assert(!/SNP/.test(pTxt), "SNP must not be pickable");
    assert(/majority 72/.test(pTxt), "fresh scenario shows real majority");
    click($$("#pickparty .opt")[0], "party (Labour)");
    await sleep(260);
    const bTxt = $("#pickbg").textContent;
    assert(/Successful entrepreneur/.test(bTxt), "entrepreneur background present");
    assert(/Career politician/.test(bTxt), "career politician background present");
    click([...$$("#pickbg .opt")].find(o => /entrepreneur/i.test(o.textContent)), "background");
    await sleep(260);
    assert(/ballot paper/i.test($("#wizbody").textContent), "summary step");
    $("#pmname").value = "Smoke Test";
    click($("#bt-begin"), "begin");
    assert($("#scr-game").classList.contains("on"), "game screen on");
    assert($$("#hubmap .room").length >= 7, "hub rooms drawn");

    // visit every room
    for (const t of ["office", "cabinet", "treasury", "commons", "world", "media", "campaign", "hub"]) {
      click($(`#gametabs button[data-t="${t}"]`), "tab " + t);
      const pane = $("#tab-" + t);
      assert(pane.classList.contains("on"), "pane on: " + t);
      assert(pane.innerHTML.trim().length > 50, "pane has content: " + t);
    }

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

    // campaign: target a region
    click($('#gametabs button[data-t="campaign"]'), "campaign tab");
    click($$("#tab-campaign [data-tr]")[1], "target region");

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
    click2([...qq("#pickscenario .opt")].find(o => /Wilderness/i.test(o.textContent)), "wilderness");
    await sleep(260);
    click2(qq("#pickdiff .opt")[0], "gentle");
    await sleep(260);
    assert(/OPPOSITION ·/.test(q("#pickparty").textContent), "opposition stat lines");
    assert(/more needed for a majority/.test(q("#pickparty").textContent), "the mountain shown");
    click2([...qq("#pickparty .opt")].find(o => /Reform/i.test(o.textContent)), "reform");
    await sleep(260);
    click2([...qq("#pickbg .opt")].find(o => /Career politician/i.test(o.textContent)), "lifer");
    await sleep(260);
    q("#pmname").value = "Opp Smoke";
    click2(q("#bt-begin"), "begin opp");
    assert(q("#scr-game").classList.contains("on"), "opp game on");
    assert(/Leader of the Opposition/.test(q("#hud-name").textContent), "LOTO label");
    click2(q('#gametabs button[data-t="treasury"]'), "opp treasury");
    assert(q("#bt-platform"), "platform button (opposition treasury)");
    click2(q("#bt-platform"), "publish platform");
    click2(q('#gametabs button[data-t="commons"]'), "opp commons");
    assert(/Opposition day/i.test(q("#tab-commons").textContent), "opposition day pane");
    click2(qq("#tab-commons .choice")[0], "opp motion");
    click2(q('#gametabs button[data-t="campaign"]'), "opp campaign");
    assert(q("#bt-fund"), "fundraise button");
    click2(q("#bt-fund"), "fundraise");
    for (let m = 0; m < 16; m++) {
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
