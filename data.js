/* =====================================================================
   MANDATE 2.0 — DATA LAYER
   Parties, scenarios, difficulties, world regions, outlets, bills,
   and the event decks (government + opposition + chains).
   Pure data + small pure helpers. No DOM.
   ===================================================================== */
"use strict";

const D_FN=["Alex","Sam","Jordan","Morgan","Priya","Tariq","Fiona","Gareth","Ngozi","Callum","Saoirse","Dev","Heather","Marcus","Eleanor","Owen","Yasmin","Douglas","Carys","Ade","Rosie","Hamish","Leila","Victor","Bronwen","Idris","Maeve","Stanley"];
const D_LN=["Okafor","MacLeod","Pemberton","Shah","Whitfield","O'Donnell","Hargreaves","Begum","Llewellyn","Crowther","Fitzgerald","Adeyemi","Sinclair","Bhattacharya","Mortlake","Davies","Strange","Holloway","Kerr","Antrobus","Vance","Middlemiss","Quill","Tudor","Nakamura","Fox-Pitt","Beasant","Ojo"];

/* ---------- parties ---------- */
const PARTIES={
 lab:{name:"Labour",col:"#d04a44",ideal:{e:-1.1,s:-0.3},
   govSeats:361,oppSeats:198,unity:58,trust:55,app:46,
   factions:[["The Left",.30,{e:-1.9,s:-.8},"Mo Sefton"],["Soft Left",.40,{e:-1.1,s:-.4},"Janet Okafor"],["Modernisers",.30,{e:-.3,s:.1},"Daniel Hartley"]],
   region:{north:1.25,mid:1.05,lon:1.2,south:.75,scot:.9,wales:1.2},
   rival:"con",blurb:"The people's party — and the people's expectations. The unions kept the receipts.",
   oppBlurb:"Out of power, in a queue of grievances. Win back the towns or haunt the seminar rooms forever."},
 con:{name:"Conservative",col:"#2a64b8",ideal:{e:1.1,s:.8},
   govSeats:349,oppSeats:175,unity:52,trust:62,app:44,
   factions:[["One Nation",.35,{e:.4,s:-.1},"Camilla Yorke"],["Thatcherites",.40,{e:1.7,s:.7},"Rupert Voss"],["National Right",.25,{e:1.2,s:1.8},"Lee Cragg"]],
   region:{north:.8,mid:1.05,lon:.85,south:1.35,scot:.6,wales:.8},
   rival:"lab",blurb:"The natural party of government, currently checking the natural order is still on.",
   oppBlurb:"The party that removes leaders for sport now needs one who can win. The members have opinions."},
 lib:{name:"Liberal Democrat",col:"#e8a13c",ideal:{e:-.4,s:-1},
   govSeats:332,oppSeats:78,unity:70,trust:58,app:48,
   factions:[["Orange Book",.30,{e:.3,s:-.8},"Theo Marsh"],["Social Liberals",.45,{e:-.8,s:-1.1},"Anika Rai"],["The Activists",.25,{e:-1.2,s:-1.6},"Wendy Prout"]],
   region:{north:.8,mid:.9,lon:1.1,south:1.3,scot:.8,wales:.9},
   rival:"con",blurb:"The polite revolution actually happened. Nobody is more surprised than the spreadsheet.",
   oppBlurb:"Seventy-eight seats and a dream: be the grown-up in a room that keeps setting itself on fire."},
 ref:{name:"Reform UK",col:"#36c2d9",ideal:{e:1.4,s:1.6},
   govSeats:336,oppSeats:92,unity:44,trust:42,app:45,
   factions:[["The Leader's Circle",.40,{e:1.2,s:1.6},"Davey Stone"],["Free Marketeers",.30,{e:2,s:.6},"Miranda Pike"],["Red Wall Populists",.30,{e:.1,s:1.9},"Terry Bowden"]],
   region:{north:1.2,mid:1.15,lon:.7,south:1.0,scot:.5,wales:1.0},
   rival:"lab",blurb:"The insurgency won. Half your MPs have never read standing orders; the other half wrote new ones in crayon.",
   oppBlurb:"The wave that hasn't crested. Every government failure is your recruiting sergeant."},
 grn:{name:"Green",col:"#3a9c4f",aiOnly:true,ideal:{e:-1.5,s:-1.2},
   govSeats:329,oppSeats:32,unity:66,trust:44,app:47,
   factions:[["Eco-Socialists",.40,{e:-2,s:-1.2},"Rosa Vane"],["Pragmatists",.35,{e:-.9,s:-.9},"Tom Ellery"],["Deep Greens",.25,{e:-1.6,s:-1.8},"Skye Aldous"]],
   region:{north:.9,mid:.85,lon:1.3,south:1.1,scot:.9,wales:1.0},
   rival:"lab",blurb:"The flooded summer changed everything. You promised a different civilisation; the Treasury would settle for a solvent one.",
   oppBlurb:"Thirty-two seats, one planet. Turn weather into votes without becoming the people who shout at boilers."},

 res:{name:"Restore Britain",col:"#8e3b46",ideal:{e:1.1,s:2.3},aiOnly:true,
   govSeats:328,oppSeats:8,unity:50,trust:45,app:42,
   factions:[["The Faithful",.5,{e:.8,s:2.4},"—"],["The Old Guard",.5,{e:1.4,s:2.1},"—"]],
   region:{north:1.0,mid:1.1,lon:.5,south:1.05,scot:.4,wales:.95},
   rival:"ref",blurb:null,oppBlurb:null},
 snp:{name:"SNP",col:"#e8d44d",aiOnly:true,ideal:{e:-.9,s:-.5},
   govSeats:0,oppSeats:48,unity:60,trust:50,app:46,
   factions:[["Fundamentalists",.35,{e:-.9,s:-.6},"Effie Brodie"],["Gradualists",.40,{e:-.8,s:-.4},"Alasdair Rennie"],["The New Guard",.25,{e:-1.1,s:-.7},"Zara Aziz"]],
   region:{north:0,mid:0,lon:0,south:0,scot:3.2,wales:0},
   rival:"lab",blurb:null,
   oppBlurb:"You will never be Prime Minister of the United Kingdom — the point is to make sure nobody is, of Scotland. Win Holyrood's mandate, force the referendum, end a 300-year argument.",
   special:"independence"},
};

/* ---------- backgrounds ---------- */
const BGS={
 banker:{name:"Ex-investment banker",blurb:"The markets trust you. The picket lines do not.",stats:"markets +12 · left factions −6",
   fx:S=>{S.econ.trust+=12;S.party.factions.forEach(f=>{if(f.ideal.e<-1)f.happy-=6})}},
 soldier:{name:"Army officer",blurb:"You've been shot at by professionals; the committee corridor holds no fear.",stats:"standing +8 · war bonus",
   fx:S=>{S.world.standing+=8;S.mil.cap=2}},
 doctor:{name:"NHS doctor",blurb:"You have held actual hands in actual wards. The public remembers.",stats:"approval +4 · NHS credibility",
   fx:S=>{S.pols.approval+=4;S.flags.nhsCred=1}},
 union:{name:"Trade union organiser",blurb:"You can read a room and empty one. Strikes settle cheaper.",stats:"unity +6 · cheaper strikes",
   fx:S=>{S.flags.unionCred=1;S.party.factions.forEach(f=>f.happy+=4)}},
 hack:{name:"Tabloid columnist",blurb:"You know where the bodies are buried because you buried several.",stats:"press +10 · sleaze +8",
   fx:S=>{S.media.outlets.forEach(o=>o.stance+=10);S.pols.sleaze+=8}},
 spad:{name:"Career special adviser",blurb:"You have never had a real job and you are magnificent at it.",stats:"capital +15",
   fx:S=>{S.pols.capital+=15}},
 tycoon:{name:"Successful entrepreneur",blurb:"You built something real, sold it for something unreal, and now want the hardest turnaround job in Britain.",stats:"markets +8 · capital +5 · invest +0.3 · sleaze +4",
   fx:S=>{S.econ.trust+=8;S.pols.capital+=5;S.econ.invest+=0.3;S.pols.sleaze+=4}},
 lifer:{name:"Career politician",blurb:"Council at 21, Parliament at 29, never lost a selection battle. You know where every body is buried because you attended the funerals.",stats:"unity +8 · capital +10",
   fx:S=>{S.party.factions.forEach(f=>f.happy+=5);S.pols.capital+=10}},
};

/* ---------- difficulties ---------- */
const DIFFS={
 gentle:{name:"Gentle",desc:"The fundamentals smile on you. For learning the ropes.",shock:0.7,base:2.5,mkt:0.8},
 standard:{name:"Standard",desc:"Britain, as found. Fair and unforgiving in equal measure.",shock:1.0,base:0,mkt:1.0},
 brutal:{name:"Brutal",desc:"The in-tray is on fire and the fire is in a union.",shock:1.35,base:-2.5,mkt:1.25},
};

/* ---------- scenarios ---------- */
const SCENARIOS={
 fresh:{name:"A Country, Slightly Used",phase:"government",desc:"You've just won. Majority, mandate, removal van idling round the corner out of respect. The classic campaign.",
   setup:S=>{}},
 wilderness:{name:"The Wilderness",phase:"opposition",desc:"Start as Leader of the Opposition. The government is settled, the press is bored of you, and the only way back runs through everything. Party size sets the mountain.",
   setup:S=>{}},
 knife:{name:"Knife-Edge",phase:"opposition",desc:"Opposition — but the polls are level, the government is wounded, and the election is due within eighteen months. One mistake either way decides a decade.",
   setup:S=>{S.opp.gov.approval=36;S.opp.gov.fatigue=4.5;S.opp.electionDue=Math.min(S.opp.electionDue,18);S.pols.pollMe+=6}},
 sterling:{name:"The Sterling Crisis",phase:"government",desc:"Inflation 9.8%, gilts on strike, the IMF's number saved in the Chancellor's phone 'just in case'. Govern anyway.",
   setup:S=>{S.econ.infl=9.8;S.econ.trust=28;S.econ.rates=6.5;S.econ.debt=112;S.econ.g=-0.8;S.svc.nhsWait=7.6;S.pols.approval-=8}},
 landslide:{name:"The Landslide",phase:"government",desc:"Majority of 180. Expectations of 280. Every disappointment is now a betrayal; there is nowhere to go but down, slowly, with style.",
   setup:S=>{S.party.seats=415;S.pols.approval+=6;S.flags.expectations=true;S.party.factions.forEach(f=>f.happy+=8)}},
 coldwind:{name:"The Cold Wind",phase:"government",desc:"Moscow is probing, the carrier is in refit, and Defence has been funded like a regional museum. The map will not stay quiet.",
   setup:S=>{S.world.regions.russia.rel=-85;S.flags.baltic2soon=true;S.mil.cap=0;S.fiscal.def=1.9;S.world.standing-=6}},
 minority:{name:"Coalition of Chaos",phase:"government",desc:"No majority. A confidence-and-supply partner with a shopping list. Every division is a cliffhanger and the whips' office has installed a defibrillator.",
   setup:S=>{S.party.seats=316;S.flags.minority=true;S.pols.capital-=10}},
};

/* ---------- world regions (Situation Board) ---------- */
const REGIONS={
 usa:{n:"United States",lon:-77.0,lat:38.9,rel:55,trade:9,bloc:"west",cap:"Washington"},
 canada:{n:"Canada",lon:-75.7,lat:45.4,rel:70,trade:5,bloc:"west",cap:"Ottawa"},
 southam:{n:"South America",lon:-47.9,lat:-15.8,rel:25,trade:4,bloc:"south",cap:"Brasília"},
 uk:{n:"United Kingdom",lon:-0.1,lat:51.5,rel:100,trade:10,bloc:"home",cap:"London",home:true},
 france:{n:"France",lon:2.3,lat:48.9,rel:38,trade:7,bloc:"eu",cap:"Paris"},
 germany:{n:"Germany",lon:13.4,lat:52.5,rel:42,trade:8,bloc:"eu",cap:"Berlin"},
 eunorth:{n:"Nordics & Baltics",lon:18.1,lat:59.3,rel:55,trade:6,bloc:"eu",cap:"Stockholm"},
 eusouth:{n:"Southern Europe",lon:12.5,lat:41.9,rel:35,trade:6,bloc:"eu",cap:"Rome"},
 ukraine:{n:"Ukraine",lon:30.5,lat:50.4,rel:60,trade:2,bloc:"east",cap:"Kyiv"},
 russia:{n:"Russia",lon:37.6,lat:55.8,rel:-65,trade:1,bloc:"east",cap:"Moscow"},
 mideast:{n:"Middle East",lon:46.7,lat:24.7,rel:15,trade:5,bloc:"south",cap:"Riyadh"},
 gulf:{n:"The Gulf",lon:54.4,lat:24.5,rel:30,trade:6,bloc:"south",cap:"Abu Dhabi"},
 africaN:{n:"North Africa",lon:31.2,lat:30.0,rel:18,trade:3,bloc:"south",cap:"Cairo"},
 africaS:{n:"Sub-Saharan Africa",lon:36.8,lat:-1.3,rel:28,trade:3,bloc:"south",cap:"Nairobi"},
 india:{n:"India",lon:77.2,lat:28.6,rel:35,trade:6,bloc:"south",cap:"Delhi"},
 china:{n:"China",lon:116.4,lat:39.9,rel:5,trade:8,bloc:"east",cap:"Beijing"},
 eastasia:{n:"Japan & Korea",lon:139.7,lat:35.7,rel:50,trade:7,bloc:"west",cap:"Tokyo"},
 oceania:{n:"Australia & NZ",lon:149.1,lat:-35.3,rel:72,trade:4,bloc:"west",cap:"Canberra"},
 southatl:{n:"South Atlantic",lon:-36.0,lat:-54.0,rel:100,trade:1,bloc:"home",cap:"Port Sandwick",tiny:true},
};

/* ---------- real-world geometry (equirectangular, lon/lat) ---------- */
const WORLD_LANDS=[
["North America",[[-166,68],[-161,71],[-150,71],[-140,70],[-128,71],[-119,73],[-110,73],[-101,73],[-92,74],[-83,73],[-75,72],[-68,69],[-64,61],[-70,60],[-77,62],[-82,64],[-88,63],[-92,60],[-90,56],[-85,52],[-82,46],[-75,45],[-70,47],[-66,44],[-70,42],[-74,39],[-76,35],[-80,32],[-80,25],[-83,29],[-89,29],[-94,29],[-97,26],[-97,22],[-94,18],[-92,15],[-88,13],[-83,9],[-79,9],[-83,12],[-87,16],[-91,19],[-97,20],[-105,22],[-110,26],[-114,31],[-120,34],[-124,40],[-124,46],[-128,51],[-132,55],[-140,59],[-148,60],[-153,57],[-160,55],[-166,62]]],
["Greenland",[[-58,76],[-44,83],[-30,83],[-20,80],[-22,76],[-32,72],[-42,70],[-46,61],[-52,64],[-54,70]]],
["South America",[[-78,7],[-72,11],[-62,10],[-52,5],[-44,-3],[-35,-7],[-37,-13],[-40,-22],[-48,-28],[-53,-34],[-58,-39],[-65,-41],[-66,-49],[-69,-52],[-75,-50],[-73,-44],[-72,-34],[-70,-25],[-70,-18],[-76,-14],[-81,-6],[-80,0]]],
["Africa",[[-17,15],[-16,21],[-10,29],[-6,35],[3,37],[11,37],[20,32],[30,31],[34,28],[43,12],[51,11],[48,5],[42,-1],[40,-10],[36,-18],[33,-26],[27,-33],[20,-35],[17,-29],[14,-22],[12,-15],[9,-7],[9,0],[4,6],[-4,6],[-8,5],[-13,8]]],
["Madagascar",[[44,-12],[50,-16],[48,-23],[44,-25],[43,-18]]],
["Europe",[[-9,37],[-9,43],[-2,44],[-2,48],[-5,48],[-2,50],[2,51],[5,53],[8,54],[8,57],[5,58],[6,62],[12,65],[16,68],[21,70],[28,71],[31,70],[28,66],[24,62],[22,58],[19,55],[14,54],[14,51],[20,50],[27,48],[30,46],[28,42],[23,40],[22,37],[18,40],[16,38],[15,40],[12,38],[13,41],[11,44],[7,44],[3,43],[0,40],[-1,37]]],
["Asia",[[27,41],[33,42],[40,43],[48,42],[50,37],[44,38],[40,37],[36,36],[34,32],[35,28],[39,21],[43,13],[51,13],[56,17],[59,23],[56,27],[60,25],[66,25],[70,21],[73,19],[72,15],[77,8],[80,10],[81,16],[87,22],[91,22],[94,18],[98,12],[101,7],[104,2],[105,9],[108,12],[109,17],[107,21],[113,22],[117,24],[121,28],[121,32],[122,37],[125,39],[128,42],[132,43],[135,45],[138,47],[141,53],[143,55],[150,59],[157,52],[159,56],[162,60],[170,62],[178,65],[178,70],[170,70],[160,71],[150,72],[140,73],[130,72],[120,73],[110,74],[100,73],[90,70],[80,71],[70,70],[60,69],[50,68],[40,67],[35,64],[33,60],[30,55],[33,50],[30,46],[27,41]]],
["Indonesia",[[95,5],[99,0],[103,-4],[106,-7],[110,-8],[115,-8],[114,-4],[110,-2],[105,0],[100,3]]],
["Borneo",[[109,1],[114,4],[117,1],[115,-3],[110,-2]]],
["New Guinea",[[131,-2],[138,-4],[146,-7],[143,-9],[135,-7],[130,-5]]],
["Philippines",[[120,18],[122,14],[124,9],[121,8],[119,13]]],
["Japan",[[130,31],[132,34],[136,35],[140,36],[141,40],[142,44],[144,44],[141,38],[139,34],[133,31]]],
["Britain",[[-5,50],[-3,53],[-5,56],[-3,58],[-1,57],[0,53],[1,51],[-2,50]]],
["Ireland",[[-10,52],[-8,55],[-6,54],[-6,52],[-9,51]]],
["Iceland",[[-23,64],[-18,66],[-14,65],[-17,63],[-21,63]]],
["Australia",[[114,-22],[114,-26],[116,-32],[122,-34],[130,-32],[136,-35],[140,-38],[146,-39],[150,-37],[153,-31],[153,-25],[148,-20],[143,-15],[137,-12],[132,-12],[127,-14],[122,-17],[118,-20]]],
["New Zealand",[[167,-45],[170,-43],[173,-41],[175,-37],[177,-38],[174,-40],[171,-44],[168,-47]]],
];

/* legacy blobs (unused after v4) */
const MAP_BLOBS=[
 "M60,70 L150,55 L235,70 L268,105 L262,150 L290,185 L250,215 L205,205 L160,225 L120,190 L75,160 L52,115 Z",
 "M225,250 L270,245 L295,285 L285,340 L255,400 L228,430 L210,380 L205,310 Z",
 "M408,108 L426,100 L436,116 L428,138 L412,132 Z",
 "M395,160 L440,128 L470,120 L515,128 L530,150 L500,178 L505,205 L470,212 L440,196 L408,190 Z",
 "M448,222 L520,218 L560,250 L552,300 L520,360 L488,392 L462,350 L448,290 Z",
 "M470,80 L560,62 L700,55 L840,70 L900,95 L880,130 L800,140 L740,150 L660,140 L580,130 L520,118 Z",
 "M540,160 L600,150 L650,170 L700,160 L760,170 L800,200 L770,240 L720,250 L680,290 L655,310 L630,260 L585,245 L552,210 Z",
 "M790,340 L865,330 L900,365 L880,410 L820,415 L788,380 Z",
 "M815,150 L850,142 L862,165 L840,188 L818,178 Z",
];

/* ---------- media outlets ---------- */
const OUTLETS=[
 {id:"ledger",n:"The Daily Ledger",kind:"tabloid",lean:1.2,reach:3.0,stance:0},
 {id:"mercury",n:"The Mercury",kind:"tabloid",lean:-1.2,reach:2.4,stance:0},
 {id:"sentinel",n:"The Sentinel",kind:"broadsheet",lean:-0.8,reach:1.6,stance:0},
 {id:"wt",n:"The Westminster Times",kind:"broadsheet",lean:0.7,reach:1.8,stance:0},
 {id:"pbc",n:"PBC News",kind:"broadcaster",lean:0,reach:3.2,stance:0},
];

/* ---------- treasury levers (defaults ≈ Britain 2026) ---------- */
const FISCAL_DEFAULT={
 // taxes
 basic:20, top:45, corp:25, vat:20, ni:12, fuel:53, windfall:0,
 // spending (% GDP)
 nhs:8.2, edu:4.6, def:2.3, welf:11.5, infra:2.5, police:2.1, local:3.4, green:1.0,
 // dials
 minwage:62, // % of median
 immig:50,   // 0 closed — 100 open
 triple:1,   // pension triple lock on
};
const FISCAL_META={
 basic:{n:"Income tax — basic rate",min:16,max:28,unit:"p",grp:"tax"},
 top:{n:"Income tax — top rate",min:38,max:55,unit:"p",grp:"tax"},
 corp:{n:"Corporation tax",min:12,max:32,unit:"%",grp:"tax"},
 vat:{n:"VAT",min:15,max:25,unit:"%",grp:"tax"},
 ni:{n:"National Insurance",min:8,max:16,unit:"%",grp:"tax"},
 fuel:{n:"Fuel duty",min:0,max:85,unit:"p/L",grp:"tax"},
 windfall:{n:"Windfall tax (energy/banks)",min:0,max:3,unit:"lvl",grp:"tax"},
 nhs:{n:"Health",min:6.5,max:11,unit:"% GDP",grp:"spend"},
 edu:{n:"Education",min:3.5,max:6.5,unit:"% GDP",grp:"spend"},
 def:{n:"Defence",min:1.5,max:4.5,unit:"% GDP",grp:"spend"},
 welf:{n:"Welfare & pensions",min:9,max:14,unit:"% GDP",grp:"spend"},
 infra:{n:"Infrastructure & science",min:1.5,max:5,unit:"% GDP",grp:"spend"},
 police:{n:"Police & justice",min:1.4,max:3.2,unit:"% GDP",grp:"spend"},
 local:{n:"Local government",min:2.4,max:4.5,unit:"% GDP",grp:"spend"},
 green:{n:"Green transition",min:0.2,max:3,unit:"% GDP",grp:"spend"},
 minwage:{n:"Minimum wage (% median)",min:55,max:75,unit:"%",grp:"dial"},
 immig:{n:"Immigration openness",min:0,max:100,unit:"",grp:"dial"},
 triple:{n:"Pension triple lock",min:0,max:1,unit:"",grp:"dial",toggle:true},
};

/* ---------- bills (parliament) ---------- */
const BILLS=[
 {id:"rail",n:"Railways (Public Ownership) Bill",ideo:{e:-1.6,s:0},cost:10,desc:"Take the trains back. Cheers on platforms, sighs in Threadneedle Street.",
  fx:{app:3,trustM:-6,svc:{housing:0}},quip:"STATE TAKES THE STRAIN"},
 {id:"planning",n:"Planning Freedom Bill",ideo:{e:.6,s:-.6},cost:10,desc:"Rip up the rulebook; build until the shires weep.",
  fx:{econ:{g:.35},app:-2,svc:{housing:55},faction:{"One Nation":-5}},quip:"CRANES OVER ENGLAND"},
 {id:"nhsplan",n:"NHS Decade Act",ideo:{e:-1,s:0},cost:12,desc:"£20bn, workforce plan, the works.",
  fx:{app:4,econ:{spendBump:.8},svc:{nhs:-0.9},flagSet:"nhsFunded"},quip:"TWENTY BILLION FOR THE WARDS"},
 {id:"borders",n:"Secure Borders Act",ideo:{e:.7,s:1.7},cost:12,desc:"Offshore processing, fast-track removals, annual cap.",
  fx:{app:2,svc:{mig:-140},faction:{"Social Liberals":-8,"The Left":-9,"The Activists":-9},queue:[{m:5,eff:{app:-3},head:"Courts ground the first offshore flight."}]},quip:"THE CAP FITS, SAYS PM"},
 {id:"natserv",n:"National Civic Service Bill",ideo:{e:.4,s:1.5},cost:8,desc:"A year of service for the young, beloved by people it won't apply to.",
  fx:{app:1,unity:3,econ:{spendBump:.3}},quip:"YOUR COUNTRY NEEDS YOU(TH)"},
 {id:"cannabis",n:"Regulated Cannabis Act",ideo:{e:-.4,s:-1.7},cost:9,desc:"£4bn a year and a thousand furious columns.",
  fx:{app:2,econ:{revBump:.4},svc:{crime:-4},media:-4},quip:"GREEN BUDGET, LITERALLY"},
 {id:"nuclear",n:"New Nuclear Act",ideo:{e:.3,s:.2},cost:9,desc:"Six plants. Power in 2038, headlines tonight.",
  fx:{econ:{spendBump:.4,g:.25},standing:4,svc:{energy:18}},quip:"ATOM AGE TWO"},
 {id:"ai",n:"Sovereign AI & Compute Act",ideo:{e:.5,s:-.3},cost:8,desc:"Buy the future before it buys you.",
  fx:{econ:{g:.4,spendBump:.3},standing:5,rel:{usa:5}},quip:"BRITAIN BUYS THE FUTURE"},
 {id:"wealth",n:"Wealth Tax Act (2% over £10m)",ideo:{e:-1.9,s:0},cost:13,desc:"Six billionaires threaten Monaco. Four already live there.",
  fx:{app:3,trustM:-12,media:-7,econ:{revBump:.7}},quip:"THE RICH LIST DECLARES WAR"},
 {id:"pr",n:"Electoral Reform (PR) Bill",ideo:{e:-.2,s:-.9},cost:11,desc:"Change the rules of the game you just won. Turkeys, Christmas, etc.",
  fx:{app:1,unity:-6,flagSet:"prDone",keep:"PR referendum (coalition deal)"},quip:"THE SYSTEM VOTES ON ITSELF"},
 {id:"lords",n:"Abolition of the Lords Bill",ideo:{e:-.5,s:-.6},cost:11,desc:"Eight hundred years of ermine v one afternoon of arithmetic.",
  fx:{app:2,media:-3,unity:2,queue:[{m:4,eff:{app:-2},head:"Their lordships discover proceduralism."}]},quip:"DEATH AND THE PEERS"},
 {id:"childcare",n:"Universal Childcare Act",ideo:{e:-1.1,s:-.4},cost:10,desc:"Free hours from nine months. Parents weep with gratitude and exhaustion.",
  fx:{app:4,econ:{spendBump:.6,g:.2}},quip:"THE NURSERY STATE"},
 {id:"police",n:"Safer Streets Act",ideo:{e:.5,s:1.2},cost:8,desc:"20,000 officers, stop-and-search powers, knife courts.",
  fx:{app:2,svc:{crime:-7},faction:{"The Activists":-6,"Social Liberals":-5},econ:{spendBump:.25}},quip:"CRACKDOWN"},
 {id:"unions",n:"Right to Strike (Repeal) Bill",ideo:{e:-1.3,s:-.7},cost:8,desc:"Tear up the bans; the picket line is legal again.",
  fx:{app:-1,unity:4,faction:{"The Left":10,"Eco-Socialists":8},trustM:-5},quip:"THE PICKET RETURNS"},
 {id:"frack",n:"Energy Sovereignty (Fracking) Act",ideo:{e:1.4,s:.8},cost:9,desc:"Drill, baby, in Lancashire.",
  fx:{svc:{energy:10},app:-3,faction:{"Deep Greens":-14,"The Activists":-9},media:3},quip:"THE GROUND SHAKES, ALLEGEDLY"},
 {id:"euvet",n:"EU Alignment (Veterinary) Act",ideo:{e:-.2,s:-.6},cost:7,desc:"Sausages without strings. The quiet reunion, course one.",
  fx:{rel:{germany:6,france:6},econ:{g:.15},faction:{"National Right":-8,"The Leader's Circle":-8}},quip:"PEACE IN OUR TIME (FOR SAUSAGES)"},
];

/* ---------- papers & ranks ---------- */
const PM_RANKS=[["Attlee",92],["Thatcher",86],["Blair",81],["Wilson",72],["Macmillan",70],["Churchill ('51)",66],["Major",52],["Heath",48],["Callaghan",45],["Cameron",44],["Brown",41],["Johnson",36],["Sunak",34],["Douglas-Home",33],["May",28],["Eden",25],["Truss",4]];
const ADVISERS=[["POLLING — Ava Chen"],["THE CABINET SECRETARY — Sir Geoffrey Mole"],["STRATEGY — Donnie Vex"],["THE WHIPS — 'The Librarian'"]];

/* =====================================================================
   EVENT DECKS — government
   eff keys: app unity media capital sleaze standing trustM oppHit scot
   rel{region} econ{g infl energy spendBump revBump} svc{nhs crime mig housing energy schools}
   ideo{e,s} faction{} flagSet flagClear promise keep breakP queue[] scandal war warEnd seats
   ===================================================================== */
const GOV_DECK=[
/* --- economy & industrial --- */
{id:"strike_rail",w:10,cond:S=>S.econ.infl>2.5,et:"Industrial action",t:"The railways stop",
 b:S=>`The RMT walks out over a ${(S.econ.infl+1.5).toFixed(0)}% claim. Each strike day costs £90m and one transport minister photographed on a pedalo.`,
 opts:[
 {l:"Settle near the claim",s:"Buy peace, pay for it",ideo:{e:-1.2,s:-.5},eff:{app:2,econ:{spendBump:.25,infl:.15},trustM:-4},q:"PEACE ON THE PICKET LINE"},
 {l:"Hold at half — wait them out",s:"Weeks of pain, the line holds",ideo:{e:.6,s:.3},eff:{app:-3,media:3,trustM:4,queue:[{m:2,eff:{app:2},head:"Rail strike settles on your terms."}]},q:"PM STARES DOWN THE UNIONS"},
 {l:"Ban transport strikes",s:"The nuclear option",ideo:{e:1.4,s:1.7},eff:{app:-2,unity:-4,media:6,faction:{"The Left":-12,"The Activists":-10},queue:[{m:3,eff:{app:-3},head:"Strike ban tangled in the courts."}]},q:"OUTLAWED: THE RIGHT TO STOP"}]},
{id:"strike_docs",w:9,cond:S=>S.svc.nhsWait>6.5,et:"Industrial action",t:"Junior doctors out again",
 b:()=>"Picket lines outside every major hospital. A consultant tells the cameras she saw you at medical school and 'always knew'. 61% back the doctors.",
 opts:[
 {l:"Multi-year pay restoration",s:"Expensive, popular, final",ideo:{e:-1,s:-.3},eff:{app:3,econ:{spendBump:.4},trustM:-3,svc:{nhs:-.3}},q:"WARDS BACK AT WORK"},
 {l:"Independent pay review (again)",s:"The classic for-now",eff:{app:-1,queue:[{m:4,eff:{app:-2},head:"Pay review reports; nobody is happy."}]},q:"REVIEW ANNOUNCED, EYES ROLLED"},
 {l:"Bring in army medics",s:"Strength, of a kind",ideo:{e:.8,s:1.2},eff:{app:-4,media:4,standing:-2,faction:{"The Left":-8}},q:"TROOPS ON THE WARDS"}]},
{id:"gilt_wobble",w:0,forced:S=>S.econ.trust<25&&!S.flags.giltLock,et:"MARKET CRISIS",t:"The bond market says no",
 b:()=>"Gilt yields spike 140bp before lunch. The Bank intervenes 'on financial-stability grounds'. The Chancellor's hands shake at the despatch box. This is the Moment.",
 opts:[
 {l:"Emergency consolidation + new fiscal rule",s:"Eat the pain now",ideo:{e:1,s:.2},eff:{app:-9,trustM:30,econ:{spendBump:-1.6,g:-.2},flagSet:"giltLock",capital:-10},q:"THE MARKETS ARE FED"},
 {l:"Sack the Chancellor, blame the Bank",s:"A human sacrifice",eff:{app:-5,trustM:12,unity:-7,flagSet:"giltLock",scandal:1},q:"CHANCELLOR DEFENESTRATED"},
 {l:"Double down — 'the markets will adjust'",s:"They will not",eff:{app:-15,trustM:-15,flagSet:"giltLock",queue:[{m:1,eff:{app:-8,trustM:25,econ:{spendBump:-2}},head:"IMF statement. Forced U-turn. The full Truss."}]},q:"PM v THE BOND MARKET: ROUND TWO"}]},
{id:"recession",w:0,forced:S=>S.econ.g<-0.4&&!S.flags.recCalled,et:"OFFICIAL",t:"Recession declared",
 b:()=>"Two consecutive quarters. The R-word leads every bulletin; your old growth quotes are a popular split-screen. The Treasury offers three fonts of bad news.",
 opts:[
 {l:"Stimulus: bring forward capital spending",s:"Borrow into the storm",ideo:{e:-1,s:0},eff:{flagSet:"recCalled",econ:{spendBump:.8,g:.3},trustM:-6,app:1},q:"SPEND OUR WAY OUT"},
 {l:"Steady hand: no panic, no sweets",s:"Austerity-adjacent calm",ideo:{e:.8,s:0},eff:{flagSet:"recCalled",trustM:6,app:-4},q:"NERVE, HELD"},
]},
{id:"energy_spike",w:7,once:true,et:"Cost of living",t:"Energy shock",
 b:()=>"A cold snap, an interconnector outage, a tanker queue in the Gulf. Wholesale gas triples in a fortnight. Martin Lewis trends for nine straight days.",
 opts:[
 {l:"Universal price cap, state pays gap",s:"£30bn, gone",ideo:{e:-1.2,s:0},eff:{app:5,econ:{spendBump:1.2,energy:.8},trustM:-7},q:"BILLS FROZEN, BOOKS COOKED"},
 {l:"Targeted help, bottom third",s:"Cheaper, meaner, smarter",eff:{app:1,econ:{spendBump:.5,energy:1}},q:"HELP — TERMS APPLY"},
 {l:"Let prices ration demand",s:"Textbook economics, textbook riot",ideo:{e:1.8,s:.4},eff:{app:-8,trustM:8,econ:{energy:1.4},faction:{"Red Wall Populists":-8}},q:"COLD COMFORT FROM NO. 10"}]},
{id:"bank_fail",w:4,once:true,cond:S=>S.econ.rates>4.5,et:"Financial stability",t:"A bank dies on a Friday",
 b:()=>"Northern Crown Bank cannot open Monday. Depositors film the queues. The Governor uses the words 'this weekend' a great deal.",
 opts:[
 {l:"Guarantee deposits, nationalise by Sunday",s:"2008 cosplay",eff:{app:2,trustM:6,econ:{spendBump:.5}},q:"YOUR MONEY IS SAFE — SIGNED, EVERYONE"},
 {l:"Fire-sale to a US giant",s:"Quick, quiet, humiliating",eff:{trustM:8,rel:{usa:4},app:-1},q:"SOLD BY SUNDAY"},
 {l:"Protect small savers, let it fail",s:"Moral hazard's one fan",eff:{app:-6,trustM:-9,queue:[{m:1,eff:{app:-4},head:"Contagion fears spread to two more lenders."}]},q:"DIED OF PRINCIPLE"}]},
{id:"obr",w:6,et:"Fiscal",t:"The forecast lands",
 b:S=>`The OBR projects ${(S.econ.g-0.3).toFixed(1)}% growth and calls your plans ${S.fiscalDeficit>4?"'not consistent with the mandate'":"'broadly on track, with risks'"}. 'Headroom' appears 31 times.`,
 opts:[
 {l:"Accept gracefully",s:"Boring is a strategy",eff:{trustM:3},q:"PM BORES FOR BRITAIN"},
 {l:"Attack the forecasters",s:"Shoot the messenger",ideo:{e:.6,s:.8},eff:{app:1,trustM:-6,media:2},q:"WAR ON GRAPHS"}]},
{id:"ldi",w:0,forced:S=>S.econ.trust<35&&S.econ.rates>5.5&&!S.flags.ldiDone,et:"MARKET CRISIS",t:"The pension funds are calling",
 b:()=>"LDI strategies are unwinding live; three pension funds need collateral by 3pm or begin selling gilts into a falling market. The doom loop, on a whiteboard, underlined twice.",
 opts:[
 {l:"Bank backstop + calm words",s:"Stabilise now",eff:{flagSet:"ldiDone",trustM:10,app:-2},q:"THE 3PM RESCUE"},
 {l:"Let the funds eat their hedges",s:"Discipline, expensively",eff:{flagSet:"ldiDone",trustM:-12,app:-6,queue:[{m:1,eff:{trustM:8},head:"Markets stabilise after a brutal week."}]},q:"NO RESCUE TODAY"}]},
{id:"water",w:6,et:"Public services",t:"Sewage, again",
 b:()=>"A drone shot shows a brown plume the length of a county. The water company paid £480m in dividends and wants a 19% bill rise.",
 opts:[
 {l:"Special administration — nationalise",s:"The crowd-pleaser",ideo:{e:-1.5,s:0},eff:{app:4,trustM:-5,econ:{spendBump:.3}},q:"TAKEN BACK: THE WATER"},
 {l:"Fines + outcomes regulator",s:"Tough-ish",eff:{app:1,queue:[{m:6,eff:{app:-2},head:"New regulator approves a 12% bill rise."}]},q:"WATCHDOG GETS DENTURES"}]},
{id:"ai_boom",w:5,cond:S=>S.econ.g>1.8,et:"Economy",t:"The AI gold rush hits London",
 b:()=>"Three labs open European HQs in King's Cross. Productivity statisticians report something they cautiously describe as 'hope'.",
 opts:[
 {l:"Fast-track visas for AI talent",s:"Growth now, rows later",ideo:{e:.5,s:-.8},eff:{econ:{g:.3},svc:{mig:60},faction:{"Red Wall Populists":-5,"National Right":-5}},q:"OPEN DOOR FOR THE MACHINE MAKERS"},
 {l:"Windfall-tax the compute farms",s:"Take the cream",ideo:{e:-1.4,s:0},eff:{econ:{revBump:.3},trustM:-4,app:2},q:"ROBOT TAX"}]},
{id:"deepfake",w:4,once:true,cond:S=>S.meta.month>8,et:"Technology",t:"The deepfake",
 b:S=>`A synthetic clip of you 'admitting' the budget is fake spreads to 9m views before breakfast. It is excellent work, which is the problem.`,
 opts:[
 {l:"Rapid rebuttal unit + platform ultimatum",s:"Fight tech with tech",eff:{media:3,app:1,econ:{spendBump:.05}},q:"THE CLONE WARS"},
 {l:"Laugh: release your own meme",s:"Risky charm",eff:{queue:[{m:0,eff:{app:2,media:3},head:"The PM's counter-meme lands, somehow."}]},q:"PM POSTS THROUGH IT"}]},
{id:"housing_crash",w:0,forced:S=>S.econ.rates>6.4&&!S.flags.hcrash,et:"Housing",t:"The mortgage cliff",
 b:()=>"Two million fixed deals reprice this year at triple the rate. Repossession headlines return like a bad tribute act. Negative equity maps glow red.",
 opts:[
 {l:"Mortgage rescue scheme",s:"Forbearance, funded",eff:{flagSet:"hcrash",app:3,econ:{spendBump:.4},trustM:-4},q:"THE ROOF HOLDS"},
 {l:"Let the market clear",s:"Pain now, prices later",ideo:{e:1.5,s:.2},eff:{flagSet:"hcrash",app:-7,svc:{housing:20},trustM:4},q:"THE CORRECTION"}]},
/* --- services & society --- */
{id:"nhs_winter",w:9,cond:S=>[10,11,0,1].includes(S.moy),et:"NHS",t:"Winter arrives at A&E",
 b:S=>S.svc.nhsWait<5.5?"Your funding settlement is holding — just. One more push makes it a competence story.":"Ambulances queue twelve deep. A nurse cries on the ten o'clock news and the clip outruns every rebuttal.",
 opts:[
 {l:"Winter surge fund + staff recall",s:"Cash and bodies",ideo:{e:-.7,s:0},eff:{app:3,econ:{spendBump:.3},svc:{nhs:-.2}},q:"CAVALRY FOR THE CORRIDORS"},
 {l:"Buy private beds, quietly",s:"Works; enrages your left",ideo:{e:.9,s:0},eff:{app:2,svc:{nhs:-.25},faction:{"The Left":-9,"Eco-Socialists":-9,"The Activists":-6}},q:"PRIVATE BEDS, PUBLIC ROW"},
 {l:"Tough it out, blame flu",s:"The forecast says mild",eff:{app:-4,queue:[{m:1,eff:{app:-3,svc:{nhs:.3}},head:"It was not mild."}]},q:"WRAP UP WARM"}]},
{id:"nhs_waits",w:7,cond:S=>S.svc.nhsWait>7,et:"NHS",t:"Eight million waiting",
 b:S=>`The list hits ${S.svc.nhsWait.toFixed(1)} million. A man in Solihull mails you his hip X-ray with a stamp collection's worth of postage.`,
 opts:[
 {l:"Weekend surgical blitz",s:"Sweat the assets",eff:{econ:{spendBump:.25},svc:{nhs:-.5},app:2},q:"OPERATING THROUGH THE NIGHT"},
 {l:"League tables & sackings",s:"Management by fear",ideo:{e:.8,s:.6},eff:{svc:{nhs:-.2},unity:-3,media:2},q:"NAME, SHAME, OPERATE"}]},
{id:"social_care",w:5,once:true,et:"The long grass",t:"The social care question",
 b:()=>"Every PM since Blair has promised to fix social care. The commission lands: £14bn a year, or another decade of quiet shame.",
 opts:[
 {l:"Fund it with a levy",s:"Brave. Genuinely.",ideo:{e:-.8,s:0},eff:{app:-2,trustM:2,econ:{revBump:.6},promise:"Fix social care",queue:[{m:14,eff:{app:5,keep:"Fix social care"},head:"First care-cap payments land. It is… working?"}]},q:"THE LEVY NOBODY DARED"},
 {l:"Royal commission (the long grass)",s:"See you in 2031",eff:{media:2},q:"CARE FIX DELAYED, TRADITION HONOURED"}]},
{id:"new_flu",w:4,once:true,et:"Public health",t:"H7N6 reaches Heathrow",
 b:()=>"A novel flu strain with a nasty edge. The modellers bring fan charts; the fan charts bring flashbacks. The public mood is one collective 'not again'.",
 opts:[
 {l:"Fast: antivirals, masks on transport, no lockdown",s:"Calibrated",eff:{app:2,econ:{g:-.1},queue:[{m:2,eff:{app:4},head:"Wave crests early; the fan charts fold politely."}]},q:"FAST, NOT FURIOUS"},
 {l:"Wait for data",s:"The British opening",eff:{queue:[{m:1,eff:{app:-6,econ:{g:-.3},svc:{nhs:.5}},head:"Cases triple; 'dither' enters every headline."}]},q:"WATCH AND WAIT"},
 {l:"Circuit-breaker now",s:"Maximum caution, maximum cost",eff:{app:-3,econ:{g:-.6,spendBump:.5},queue:[{m:2,eff:{app:3},head:"Deaths stay low. Vindication, expensively bought."}]},q:"BRITAIN SHUTS THE DOOR"}]},
{id:"knife",w:5,cond:S=>S.svc.crime>96,et:"Crime",t:"A terrible week in three cities",
 b:()=>"Knife deaths of teenagers, three in five days. The mothers stand together outside Downing Street. The cameras will decide if your face was right.",
 opts:[
 {l:"Meet the mothers, fund youth services",s:"Heart plus wallet",ideo:{e:-.8,s:-.6},eff:{app:3,econ:{spendBump:.15},svc:{crime:-2}},q:"THE PM LISTENED"},
 {l:"Stop-and-search surge",s:"Order, with side effects",ideo:{e:.4,s:1.6},eff:{app:2,media:3,svc:{crime:-4},faction:{"The Activists":-8,"Social Liberals":-7}},q:"CRACKDOWN"}]},
{id:"smallboats",w:8,cond:S=>S.svc.mig>420,et:"Borders",t:"Forty-one boats on a calm Tuesday",
 b:S=>`Record crossings; net migration ${Math.round(S.svc.mig)}k. France wants money, your right wants 'something biblical', the courts want legality.`,
 opts:[
 {l:"Pay France, open safe routes, fast-track decisions",s:"Process beats theatre",ideo:{e:-.4,s:-1},eff:{app:-1,rel:{france:6},econ:{spendBump:.2},queue:[{m:8,eff:{app:3,svc:{mig:-60}},head:"Crossings down 38% year on year."}]},q:"QUIET DEAL ON THE CHANNEL"},
 {l:"Offshore processing scheme",s:"The deterrent gamble",ideo:{e:.7,s:1.6},eff:{app:2,media:5,faction:{"Social Liberals":-8,"The Left":-9},queue:[{m:5,eff:{app:-4},head:"Courts ground the first offshore flight."}]},q:"WHEELS UP? NOT YET"},
 {l:"Royal Navy interdiction",s:"Gunboats v dinghies",ideo:{e:.6,s:1.9},eff:{app:1,standing:-4,rel:{france:-6},media:4},q:"THE NAVY SAILS FOR DOVER"}]},
{id:"asylum_hotels",w:5,cond:S=>S.svc.mig>500,et:"Borders",t:"The hotel bill",
 b:()=>"£8m a day on asylum hotels, says the NAO, and a seaside town's last hotel just converted. The local MP is outside it with a megaphone. The MP is yours.",
 opts:[
 {l:"Mass caseworker hiring — clear the backlog",s:"Unsexy, effective",eff:{econ:{spendBump:.15},queue:[{m:7,eff:{app:4,svc:{mig:-40}},head:"Backlog halved; hotel bill falls."}]},q:"THE PAPERWORK SURGE"},
 {l:"Dispersal to every constituency",s:"Share the pain",eff:{app:-3,unity:-4},q:"EVERYWHERE, ALL AT ONCE"}]},
{id:"prisons",w:5,et:"Justice",t:"The prisons are full. Literally.",
 b:()=>"99.7% capacity. Judges are told, discreetly, to delay sentencing. A tabloid finds out in a week, which is what tabloids are for.",
 opts:[
 {l:"Early release, low-risk only",s:"Maths over machismo",ideo:{e:-.4,s:-1.2},eff:{app:-3,media:-2,svc:{crime:1}},q:"OUT EARLY"},
 {l:"Rapid-build blocks & barges",s:"Concrete answer",ideo:{e:.3,s:.9},eff:{econ:{spendBump:.2},app:1},q:"BRITAIN BUILDS CELLS"}]},
{id:"raac",w:5,once:true,et:"Infrastructure",t:"The school roofs are made of Aero",
 b:()=>"RAAC concrete, 600 more schools. Children in portakabins; physics in the gym; the gym in the car park.",
 opts:[
 {l:"Emergency rebuild programme",s:"£6bn, no choice really",eff:{econ:{spendBump:.3},app:2,svc:{schools:4}},q:"FIX THE ROOFS"},
 {l:"Survey first, 'worst first'",s:"Slower, cheaper, riskier",eff:{queue:[{m:4,eff:{app:-5},head:"A ceiling fails during assembly. No injuries. Barely."}]},q:"ROOF ROULETTE"}]},
{id:"footballer",w:5,once:true,et:"Campaign",t:"A footballer writes a letter",
 b:()=>"England's beloved striker posts an open letter on holiday hunger, tagging you. Four million likes by noon. Your comms grid is now confetti.",
 opts:[
 {l:"Fund the meals, invite him to announce it",s:"Lose the battle, win the photo",ideo:{e:-.9,s:0},eff:{app:5,econ:{spendBump:.15},media:2},q:"STRIKER 1, TREASURY 0"},
 {l:"Hold the line on 'targeted support'",s:"Discipline v a national treasure",ideo:{e:1,s:.3},eff:{app:-5,trustM:3,media:-3},q:"PM SAYS NO TO SAINT"}]},
{id:"fourday",w:4,et:"Work",t:"The four-day week reports",
 b:()=>"Sixty firms, two years: productivity flat-to-up, sick days down, everyone suspiciously happy. The CBI calls it 'communism with yoga'.",
 opts:[
 {l:"Pilot it in the civil service",s:"The future, possibly",ideo:{e:-.9,s:-.9},eff:{app:2,media:-4,trustM:-3,queue:[{m:9,eff:{app:2},head:"Pilot: output steady, applications triple."}]},q:"FRIDAY, CANCELLED (THE WORK PART)"},
 {l:"Dismiss it",s:"Hustle propaganda",ideo:{e:.8,s:.5},eff:{media:3,faction:{"The Activists":-5}},q:"BACK TO WORK, BRITAIN"}]},
{id:"heatwave",w:5,cond:S=>[5,6,7].includes(S.moy),et:"Climate",t:"41°C",
 b:()=>"Rails buckle, schools close, and a man in Margate fries an egg on a postbox for regional news. The Climate Committee's 'told you so' runs 400 pages.",
 opts:[
 {l:"National resilience programme",s:"Adapt loudly",eff:{econ:{spendBump:.25},app:2,standing:2,svc:{energy:4}},q:"BRITAIN BUYS AIR CONDITIONING"},
 {l:"'Enjoy the sunshine'",s:"Polls fine until the next one",eff:{app:1,queue:[{m:12,eff:{app:-4},head:"Hotter. Less funny now."}]},q:"ICE CREAM FOR EVERYONE"}]},
{id:"floods",w:5,cond:S=>[0,1,10,11].includes(S.moy),et:"Emergency",t:"Three rivers, one weekend",
 b:()=>"The Severn, the Ouse and the Don, all over their banks. Wellies are being sized for you as you read this. Do not smile near sandbags.",
 opts:[
 {l:"COBRA, troops, cheque-book",s:"Grip, visibly",eff:{app:3,econ:{spendBump:.2}},q:"PM GRIPS THE FLOODS"},
 {l:"Sympathy from Downing St",s:"Dry feet, wet polls",eff:{app:-4},q:"WHERE IS THE PM? (DRY)"}]},
{id:"uni",w:4,et:"Education",t:"Three universities are insolvent",
 b:()=>"The vice-chancellors arrive with a deck titled 'Systemic Risk'. Slide four is the word 'HELP'. The caps did what the modelling said.",
 opts:[
 {l:"Bail out, lift the caps",s:"Pragmatism over posture",ideo:{e:-.3,s:-.7},eff:{econ:{spendBump:.2,g:.15},svc:{mig:40},faction:{"National Right":-6,"Red Wall Populists":-5}},q:"GOWNS SAVED"},
 {l:"Managed mergers, no new money",s:"Let Darwin lecture",ideo:{e:1,s:.3},eff:{app:-2,queue:[{m:6,eff:{app:-2},head:"Campus closes in a marginal. Awkward."}]},q:"DEGREES OF FAILURE"}]},
/* --- sleaze & party --- */
{id:"scandal_money",w:8,et:"Scandal",t:"The Minister and the money",
 b:S=>{const j=D_FN[Math.floor(S.rng()*D_FN.length)]+" "+D_LN[Math.floor(S.rng()*D_LN.length)];
  return `${j}, your Parliamentary Under-Secretary for Procurement, 'forgot' to declare £240,000 from a firm that later won a contract. The receipts are in a shoebox, and the shoebox is on the front page.`},
 opts:[
 {l:"Sack them within the hour",s:"Brutal hygiene",eff:{app:2,unity:-5,capital:-4,scandal:1},q:"GONE BY LUNCH"},
 {l:"'Independent ethics review'",s:"Buy three weeks",eff:{sleaze:8,queue:[{m:2,eff:{app:-4,unity:-3,scandal:1},head:"Review damns minister; sacked anyway, slower."}]},q:"REVIEW, THEN REGRET"},
 {l:"Full-throated defence",s:"Loyalty is a currency. So is approval.",eff:{app:-4,unity:4,sleaze:12,media:-4},q:"PM STANDS BY THE SHOEBOX"}]},
{id:"scandal_affair",w:6,et:"Scandal",t:"CCTV from the kitchenette",
 b:S=>{const j=D_FN[Math.floor(S.rng()*D_FN.length)]+" "+D_LN[Math.floor(S.rng()*D_LN.length)];
  return `${j}, a junior minister of yours, and an aide, on camera, in breach of the dignity of the departmental kitchenette. The Ledger has stills; the Mercury has the catering invoice.`},
 opts:[
 {l:"Resignation by mutual agreement",s:"Swift and Victorian",eff:{app:1,scandal:1,unity:-2},q:"EXIT, PURSUED BY A TABLOID"},
 {l:"'A private matter'",s:"It will not stay one",eff:{sleaze:10,media:-5,queue:[{m:1,eff:{app:-3,scandal:1},head:"Second kitchenette emerges."}]},q:"PRIVATE MATTER, PUBLIC PRINTER"}]},
{id:"whatsapp",w:6,et:"Leak",t:"The group chat leaks",
 b:()=>"Two years of ministerial WhatsApps, gifted to a book. You are quoted calling Cabinet 'a zoo, minus the planning'. Worse: everyone agrees.",
 opts:[
 {l:"Laugh it off at a press dinner",s:"Charm as armour",eff:{app:1,media:4},q:"PM OWNS THE ZOO"},
 {l:"Leak inquiry, phones confiscated",s:"Paranoia, institutionalised",eff:{unity:-6,capital:-3,media:-3},q:"THE PHONE PURGE"}]},
{id:"peerages",w:5,cond:S=>S.pols.sleaze>25,et:"Sleaze",t:"Peerages for patrons",
 b:()=>"Three new lords map to £9m in donations. The scatter plot is devastatingly linear: R² of 0.94.",
 opts:[
 {l:"Pause honours, back reform",s:"Concede the point",ideo:{e:0,s:-.8},eff:{app:2,sleaze:-8,unity:-3},q:"ERMINE ON ICE"},
 {l:"'Due process was followed'",s:"Technically true, fatally dull",eff:{sleaze:9,media:-4},q:"THE PROCESS IS THE PROBLEM"}]},
{id:"lobbying",w:4,cond:S=>S.meta.month>10,et:"Sleaze",t:"The consultancy texts",
 b:()=>"A predecessor texted half your Cabinet lobbying for a finance firm. Replies range from 'noted' to 'on it 👍'. The thumbs-up is doing havoc.",
 opts:[
 {l:"Publish everything, ban second jobs",s:"Burn the lot",ideo:{e:-.5,s:-.4},eff:{app:3,sleaze:-6,unity:-4,faction:{"Modernisers":-4,"One Nation":-4}},q:"THE GREAT CLEAN-OUT"},
 {l:"Registers, reviews, regret",s:"Minimum viable virtue",eff:{sleaze:4},q:"LESSONS, LEARNED-ISH"}]},
{id:"byelection",w:7,et:"Politics",t:"By-election in Middlewich",
 b:S=>`A ${S.majority>40?"chance to flex":"test you cannot afford to fail"}. The candidate is keen, local, and has tweeted 11,000 times. Eleven thousand.`,
 opts:[
 {l:"Campaign there personally",s:"Own the result, either way",eff:{capital:-6,queue:[{m:1,eff:null,head:"__BYELECTION_NEAR__"}]},q:"PM ON THE DOORSTEP"},
 {l:"Keep your distance",s:"Deniability",eff:{queue:[{m:1,eff:null,head:"__BYELECTION_FAR__"}]},q:"LOCAL MATTERS, SAYS DISTANT PM"}]},
{id:"letters",w:0,forced:S=>S.pols.unity<32&&!S.flags._confCool,et:"CONFIDENCE VOTE",t:"The letters are in",
 b:S=>`The chairman of the backbench committee requests 'a moment'. Threshold met: a confidence ballot in your leadership, tomorrow. Unity ${S.pols.unity.toFixed(0)}. Count your friends, then halve it.`,
 opts:[
 {l:"Fight — call in every favour",s:"Spend capital to live",eff:{capital:-15,flagSet:"_confVote"},q:"THE PM FIGHTS"},
 {l:"Buy the rebels: reshuffle & retreat",s:"Live smaller",eff:{unity:8,app:-3,capital:-5,flagSet:"_confCool"},q:"PEACE, AT A PRICE"},
 {l:"Resign with dignity",s:"Walk before they carry you",eff:{flagSet:"_resign"},q:"THE LONG WALK"}]},
{id:"conference",w:0,forced:S=>S.moy===9&&S.flags.confYear!==S.year,et:"Party conference",t:"Conference speech",
 b:()=>"The hall, the lanyards, the warm white wine. One hour to reset the narrative. Three drafts: safe, bold, and 'the lectern collapses either way'.",
 opts:[
 {l:"Safe: unity and competence",s:"No clips, no cuts",eff:{unity:5,app:1},q:"STEADY AS SHE GOES"},
 {l:"Bold: a big new pledge",s:"Make news, make hostages",eff:{app:4,media:3,promise:"Conference pledge",queue:[{m:10,eff:{app:-4,breakP:"Conference pledge"},head:"That conference pledge? Quietly shelved."}]},q:"THE BIG PROMISE"},
 {l:"Attack: flay the opposition",s:"Red meat for the hall",eff:{unity:7,oppHit:-4,media:-2},q:"GLOVES OFF"}],
 fx:S=>{S.flags.confYear=S.year}},
{id:"defect",w:4,cond:S=>S.pols.unity<45,et:"Party",t:"A defection, live on air",
 b:S=>`One of your MPs crosses the floor mid-interview, citing 'the direction of the project'. The clip has 4m views. Your majority is now ${S.majority-2}.`,
 opts:[
 {l:"'Good riddance'",s:"Project strength",eff:{unity:3,media:1,app:-1,seats:-1},q:"DON'T LET THE DOOR HIT YOU"},
 {l:"Listening exercise for the wobblers",s:"Therapy, at scale",eff:{capital:-5,unity:6,seats:-1},q:"PM HOLDS THE HANDS"}]},
{id:"coalition_tantrum",w:0,forced:S=>S.flags.minority&&S.meta.month%7===3&&!S.flags["ct"+S.meta.month],et:"Coalition",t:"The partner's shopping list",
 b:()=>"Your confidence-and-supply partner 'reluctantly concludes' they need more. Today's price: a pet bill and a junior ministry for their leader's college roommate.",
 opts:[
 {l:"Pay up",s:"Government continues",eff:{capital:-6,unity:-3,flag_:"ct"},q:"THE PRICE OF POWER"},
 {l:"Call their bluff",s:"They need you too… probably",eff:{flag_:"ct",queue:[{m:1,eff:{app:-2,unity:-2},head:"Partner abstains on a key vote, pour encourager."}]},q:"NO MORE SWEETS"}]},
{id:"honours_row",w:4,et:"Sleaze",t:"Your predecessor's resignation honours",
 b:()=>"They nominate their hairdresser, their tennis partner and a 24-year-old described as 'strategy'. Convention says wave it through. Decency clears its throat.",
 opts:[
 {l:"Block the list",s:"Break convention, win the day",eff:{app:3,media:-2,sleaze:-4},q:"NOT ON MY WATCH"},
 {l:"Wave it through",s:"Precedent is precedent",eff:{sleaze:6,media:2},q:"STRATEGY, ENNOBLED"}]},
{id:"bbc",w:4,et:"Culture war",t:"The licence fee, again",
 b:()=>"Charter review. Half your coalition watches only streaming; the other half watches only the PBC and complains about it. £174.50 hangs in the balance.",
 opts:[
 {l:"Freeze the fee, protect the broadcaster",s:"Auntie lives",ideo:{e:-.3,s:-.5},eff:{outlet:{pbc:8,ledger:-4},app:1},q:"AUNTIE SAVED (FROZEN)"},
 {l:"Subscription by 2030",s:"Let the market sing",ideo:{e:1.2,s:.7},eff:{outlet:{pbc:-15,ledger:8},faction:{"Soft Left":-5,"Social Liberals":-5}},q:"THE OFF SWITCH CLOCK STARTS"}]},
{id:"leveson2",w:0,forced:S=>S.pols.sleaze>55&&S.mediaIndex>20&&!S.flags.lev2,et:"The press",t:"The hacking files, volume two",
 b:()=>"A court dump shows a tabloid hacked a murdered schoolgirl's cousin's phone — and that your comms chief knew the editor socially, repeatedly, on a yacht.",
 opts:[
 {l:"Full judge-led inquiry into the press",s:"War with the people who buy ink",eff:{flagSet:"lev2",app:3,media:-18,sleaze:-6},q:"THE JUDGE WILL SEE YOU NOW"},
 {l:"'Matters for the courts'",s:"Keep the proprietors close",eff:{flagSet:"lev2",sleaze:8,media:6,app:-2},q:"NOTHING TO SEE HERE"}]},
{id:"memoir",w:4,cond:S=>S.meta.month>18,et:"Books",t:"The Chancellor you sacked writes a book",
 b:()=>"Serialised over five excruciating days. You are 'indecisive at breakfast, reckless by lunch'. There is a chapter titled simply 'The Spreadsheet'.",
 opts:[
 {l:"'I wish them well with their hobby'",s:"Aloof wins",eff:{app:1,media:2},q:"PM RISES ABOVE (HARDBACK, £25)"},
 {l:"Brief against them, hard",s:"Mutually assured leaking",eff:{sleaze:5,unity:-3,oppHit:-1},q:"NO. 10 EMPTIES THE FILES"}]},
/* --- union & devolution --- */
{id:"indyref",w:5,cond:S=>S.world.scot>55,et:"The Union",t:"Edinburgh demands a referendum",
 b:S=>`The First Minister, flanked by saltires: 'The mandate exists.' Yes polls at ${(38+S.world.scot/4).toFixed(0)}%. Your call — constitutionally and actually.`,
 opts:[
 {l:"Refuse: 'not a generation yet'",s:"Hold the line, feed the grievance",eff:{scot:6,app:1,queue:[{m:8,eff:{scot:4},head:"Holyrood passes a referendum bill anyway; courts loom."}]},q:"NO, AGAIN"},
 {l:"Grant it — and campaign hard",s:"The all-in",eff:{scot:-4,capital:-10,queue:[{m:6,eff:null,head:"__INDYREF__"}]},q:"THE UNION ON THE BALLOT"},
 {l:"Devo-max counter-offer",s:"Split the difference",eff:{scot:-8,unity:-4,econ:{spendBump:.2}},q:"MAXIMUM DEVOLUTION, MINIMUM DRAMA"}]},
{id:"stormont",w:4,once:true,et:"Northern Ireland",t:"Stormont stalls again",
 b:()=>"Power-sharing collapses over a heating scheme, a language act, and an argument originally scheduled for 1998. Civil servants are running the place on vibes.",
 opts:[
 {l:"Marathon talks at Hillsborough",s:"Tea, biscuits, history",eff:{capital:-5,queue:[{m:3,eff:{app:2,standing:3},head:"Stormont returns. Applause, briefly bipartisan."}]},q:"THE LONG TABLE"},
 {l:"Direct rule, regretfully",s:"Govern by memo",eff:{standing:-3,app:-1},q:"LONDON TAKES THE WHEEL"}]},
{id:"senedd",w:3,et:"Wales",t:"Cardiff wants the Crown Estate",
 b:()=>"The Senedd votes for devolution of Crown Estate revenues and 'justice powers, eventually'. Wales is polite about it, which somehow makes it worse.",
 opts:[
 {l:"Concede the Estate",s:"Cheap goodwill",eff:{app:1,econ:{revBump:-.05}},q:"WALES GETS THE SEABED"},
 {l:"A commission will consider",s:"The drawer marked Wales",eff:{queue:[{m:9,eff:{app:-1},head:"Welsh commission reports; drawer reopens."}]},q:"IN DUE COURSE"}]},
/* --- foreign & war chains --- */
{id:"us_tariffs",w:6,once:true,et:"Foreign policy",t:"Washington wants a deal (its deal)",
 b:S=>`The President${S.world.regions.usa.rel>50?" — who keeps calling you 'a winner' —":""} offers a pact: tariffs slashed, in exchange for US agri-standards and 'review' of the digital tax. The chicken jokes write themselves; the growth numbers are annoyingly real.`,
 opts:[
 {l:"Sign it",s:"Growth, with a side of chlorine",ideo:{e:.9,s:.3},eff:{rel:{usa:15,france:-6,germany:-6},econ:{g:.35},flagSet:"tradeBoost",app:-2,media:3,faction:{"The Activists":-7,"Eco-Socialists":-8}},q:"DEAL OF THE CENTURY (TERMS APPLY)"},
 {l:"Counter-offer: food & NHS carve-outs",s:"Slower, safer",eff:{rel:{usa:-4},queue:[{m:5,eff:{rel:{usa:8},econ:{g:.2},flagSet:"tradeBoost"},head:"Slimmer US deal signed — chicken untouched."}]},q:"NOT SO FAST, MR PRESIDENT"},
 {l:"Walk away publicly",s:"Sovereignty theatre",eff:{rel:{usa:-12},app:2,standing:2},q:"PM TELLS WASHINGTON: NO"}]},
{id:"us_election",w:0,forced:S=>S.meta.month===29&&!S.flags.usel,et:"Geopolitics",t:"America votes",
 b:()=>"A new President-elect, a new doctrine, a 2am congratulation window and a handshake photograph that will be analysed like the Zapruder film.",
 opts:[
 {l:"First flight to Washington",s:"Get in early",eff:{flagSet:"usel",rel:{usa:10},standing:2,capital:-4},q:"FIRST IN LINE"},
 {l:"Let them come to you",s:"Confidence or vanity; the polls decide",eff:{flagSet:"usel",rel:{usa:-8},app:1},q:"BRITAIN WAITS BY THE PHONE"}]},
{id:"eu_reset",w:6,once:true,et:"Foreign policy",t:"Brussels proposes 'the Reset'",
 b:()=>"A package: veterinary deal, youth mobility, defence pact — closer alignment, no rejoining. Eurosceptics call it surrender; exporters call it oxygen; focus groups ask if it's about the boats.",
 opts:[
 {l:"Take the full package",s:"Economics over flags",ideo:{e:-.3,s:-.8},eff:{rel:{germany:16,france:14,eunorth:8},econ:{g:.4},flagSet:"tradeBoost",unity:-6,media:-3,faction:{"National Right":-14,"Thatcherites":-8,"The Leader's Circle":-12,"Red Wall Populists":-10}},q:"THE QUIET REUNION"},
 {l:"Veterinary deal only",s:"Sausages without strings",eff:{rel:{germany:8,france:6},econ:{g:.15}},q:"PEACE IN OUR TIME (FOR SAUSAGES)"},
 {l:"Reject — 'we left for a reason'",s:"Base maintenance",ideo:{e:.6,s:1},eff:{rel:{germany:-8,france:-8},unity:4,econ:{g:-.1},flagSet:"tradeDrag"},q:"NON, MERCI"}]},
{id:"china_cyber",w:6,once:true,et:"Security",t:"Beijing in the grid",
 b:()=>"GCHQ confirms a Chinese state actor inside the electricity network 'for rainy-day purposes'. The Foreign Office advises measured language. The tabloids advise war.",
 opts:[
 {l:"Public attribution + sanctions",s:"Name, shame, pay",eff:{rel:{china:-18,usa:8},standing:6,econ:{g:-.15}},q:"BRITAIN POINTS THE FINGER"},
 {l:"Private warning, public silence",s:"Realpolitik",eff:{rel:{china:4},standing:-4,queue:[{m:6,eff:{media:-6,app:-3},head:"Leak: No.10 sat on China grid hack."}]},q:"(INTENTIONALLY QUIET)"}]},
{id:"taiwan",w:4,once:true,cond:S=>S.meta.month>14,et:"Geopolitics",t:"Blockade drills in the Strait",
 b:()=>"Beijing rehearses a quarantine of Taiwan for nine days. Washington asks allies for 'clarity'. Forty per cent of the world's advanced chips hold their breath.",
 opts:[
 {l:"Stand with Washington, explicitly",s:"Clarity has a price tag",eff:{rel:{usa:10,china:-15},standing:5,econ:{g:-.2}},q:"BRITAIN PICKS A SIDE"},
 {l:"Strategic ambiguity",s:"The fog, on purpose",eff:{rel:{usa:-5,china:4},standing:-2},q:"THE FOG SPEAKS"}]},
{id:"hostage",w:4,once:true,et:"Crisis",t:"A British journalist, a foreign cell",
 b:()=>"A correspondent detained on fabricated charges by a hostile state. Her family stands outside Downing Street every morning. The whispered price: a sanctioned oligarch.",
 opts:[
 {l:"Trade the oligarch",s:"One human, home",eff:{app:3,standing:-6,rel:{usa:-4}},q:"SHE'S COMING HOME"},
 {l:"Refuse; squeeze with allies",s:"The long, hard road",eff:{app:-2,standing:5,queue:[{m:9,eff:{app:5},head:"Released after nine months of pressure. No trade."}]},q:"NO RANSOM"}]},
{id:"cop",w:5,once:true,et:"Climate",t:"Your COP moment",
 b:()=>"The summit needs a headline and you are the headline act. Small islands watch. So does a 19-year-old with 40 million followers and a stare like an audit.",
 opts:[
 {l:"Binding 2035 target + climate finance",s:"Lead, pay, lead",ideo:{e:-.9,s:-.5},eff:{standing:8,econ:{spendBump:.3},svc:{energy:6},faction:{"Free Marketeers":-7,"Thatcherites":-5}},q:"BRITAIN GOES FIRST"},
 {l:"Warm words, flexible numbers",s:"The classic",eff:{standing:-3,media:2},q:"BLAH BLAH BLAH — ACTIVIST"}]},
{id:"aid",w:3,et:"Foreign",t:"The aid budget fight",
 b:()=>"Your backbenches want 0.7% restored; the spreadsheet wants 0.5% kept; a famine forecast for the Horn wants neither to be the story.",
 opts:[
 {l:"Restore 0.7%",s:"Soft power, hard cash",ideo:{e:-.7,s:-.6},eff:{standing:6,econ:{spendBump:.2},rel:{africaS:10},faction:{"Free Marketeers":-5}},q:"BRITAIN BACK AT THE TABLE"},
 {l:"Hold at 0.5%",s:"The line holds",eff:{standing:-2,trustM:2},q:"CHARITY ENDS AT HOME"}]},
{id:"gibraltar",w:3,once:true,et:"Foreign",t:"A row about the Rock",
 b:()=>"Madrid's new government 'reopens the conversation' about Gibraltar at the worst possible summit. The Rock's Chief Minister is already on College Green, magnificent in fury.",
 opts:[
 {l:"'British as long as they wish' — full stop",s:"The only answer, loudly",eff:{app:2,rel:{eusouth:-5},standing:2},q:"THE ROCK STANDS"},
 {l:"Offer a cooperation framework",s:"Suspiciously adult",eff:{rel:{eusouth:6},app:-1},q:"SHARING THE SUN"}]},
{id:"baltic0",w:4,once:true,cond:S=>S.meta.month>6,et:"Security",t:"Cables cut in the North Sea",
 b:()=>"Two data cables and a gas interconnector severed in one night. A 'research vessel' with a Russian flag loiters nearby, researching, presumably, cables. NATO convenes.",
 opts:[
 {l:"Lead a NATO patrol mission",s:"Escalate to deter",eff:{standing:8,rel:{russia:-10,usa:6},econ:{spendBump:.15},flagSet:"baltic2soon",app:2},q:"THE NAVY SAILS NORTH"},
 {l:"Sanctions only",s:"De-escalate",eff:{rel:{russia:-5},standing:-3},q:"STERN WORDS, CALM SEAS"}]},
{id:"baltic2",w:0,forced:S=>S.flags.baltic2soon&&S.meta.month>4&&!S.flags.balticDone,et:"WAR & PEACE",t:"Incident in the Baltic",
 b:()=>"A British frigate is buzzed, then grazed, by a Russian jet. Tallinn invokes Article 4. The Estonians ask, quietly, if Britain means it. Everyone is looking at you.",
 opts:[
 {l:"Deploy a UK-led brigade to the Baltics",s:"Means it",eff:{flagSet:"balticDone",standing:10,rel:{usa:8,russia:-15},econ:{spendBump:.3},app:3,war:{name:"Baltic Shield",theatre:"eunorth",phase:"posture",support:62,cas:0,months:0,intensity:.4,mood:2}},q:"BRITAIN MEANS IT"},
 {l:"Naval presence only, push for talks",s:"Half-means it",eff:{flagSet:"balticDone",standing:2,rel:{russia:-5}},q:"PRESENCE, NOT PROMISES"},
 {l:"Quietly draw down",s:"Doesn't mean it",eff:{flagSet:"balticDone",standing:-9,rel:{usa:-8},app:-3,media:-4},q:"BRITAIN BLINKS"}]},
{id:"baltic3",w:0,forced:S=>S.world.war&&S.world.war.name==="Baltic Shield"&&S.world.war.phase==="posture"&&S.meta.month>8&&!S.flags.baltic3done,et:"WAR & PEACE",t:"The line is tested",
 b:()=>"A 'separatist militia' with suspiciously new armour crosses into the border zone your brigade patrols. Shots exchanged; two British wounded. The next 48 hours decide a decade.",
 opts:[
 {l:"Engage and repel",s:"War, contained (you hope)",eff:{flagSet:"baltic3done",app:6,standing:8,rel:{usa:10},war:{name:"Baltic Shield",theatre:"eunorth",phase:"fighting",support:70,cas:12,months:0,intensity:.6,mood:3}},q:"CONTACT"},
 {l:"Hold fire, flood the zone with cameras",s:"Make Moscow own it",eff:{flagSet:"baltic3done",standing:5,rel:{russia:-8},warEnd:1,crisisWin:1,queue:[{m:2,eff:{standing:4,app:3},head:"Militia withdraws under the world's gaze."}]},q:"THE WHOLE WORLD IS WATCHING"}]},
{id:"sandwick1",w:4,once:true,cond:S=>S.meta.month>10,et:"CRISIS",t:"The Sandwick Islands",
 b:()=>"A junta seizes power in San Verde and 'reasserts ancestral claims' over the Sandwick Islands — population 2,900, sheep 480,000, British since 1807. Their fleet sails. Not a drill, not unfamiliar.",
 opts:[
 {l:"Despatch the carrier group",s:"The full Thatcher",eff:{app:8,standing:6,econ:{spendBump:.4},war:{name:"Sandwick",theatre:"southatl",phase:"sailing",support:74,cas:0,months:0,intensity:.8,mood:3}},q:"THE FLEET SAILS SOUTH"},
 {l:"UN emergency session first",s:"Process. The islands wait.",eff:{standing:-4,app:-5,queue:[{m:2,eff:{app:-6,standing:-6},head:"Junta flag over Port Sandwick. The UN expresses concern."}]},q:"PAPER SHIELD"}]},
{id:"sandwick2",w:0,forced:S=>S.world.war&&S.world.war.name==="Sandwick"&&S.world.war.phase==="sailing"&&!S.flags.sw2,et:"WAR",t:"The landings",
 b:()=>"Eight thousand miles later: the task force is in position. The junta offers 'joint sovereignty' via the Swiss. Your admiral wants the dawn tide; your chancellor wants this over by the fiscal statement.",
 opts:[
 {l:"Land at dawn",s:"Speed and violence of action",eff:{flagSet:"sw2",war:{name:"Sandwick",theatre:"southatl",phase:"fighting",support:72,cas:30,months:0,intensity:1,mood:3}},q:"THE BEACHES OF SANDWICK"},
 {l:"Blockade and strangle",s:"Slower, fewer flags on coffins",eff:{flagSet:"sw2",war:{name:"Sandwick",theatre:"southatl",phase:"fighting",support:64,cas:5,months:0,intensity:.45,mood:1}},q:"THE NOOSE, NOT THE KNIFE"},
 {l:"Take the Swiss deal",s:"Joint sovereignty over sheep",eff:{flagSet:"sw2",warEnd:1,app:-12,standing:-12,unity:-8,media:-8},q:"SOLD: 2,900 BRITONS"}]},
{id:"war_cabinet",w:0,forced:S=>S.world.war&&S.world.war.phase==="fighting"&&!S.flags["wp"+S.meta.month],et:"WAR CABINET",t:"The war cabinet",
 b:S=>{const w=S.world.war;return `${w.name}: month ${w.months+1}. Casualties ${Math.round(w.cas)}. Support ${Math.round(w.support)}%. The generals present three options and watch your eyes while you read.`},
 opts:[
 {l:"Major offensive — end this",s:"Roll the iron dice",special:"offensive"},
 {l:"Hold positions, grind",s:"Attrition, theirs and yours",special:"hold"},
 {l:"Open negotiations",s:"Talk while shooting",special:"negotiate"}]},
{id:"occ_unrest",w:0,forced:S=>{const occ=Object.keys(S.world.regions).filter(k=>S.world.regions[k].occupied);
  if(!occ.length||S.flags["occq"+S.meta.month]||S.meta.month%3!==1)return false;S.flags._occT=occ[0];S.flags["occq"+S.meta.month]=true;return true},
 et:"OCCUPATION",t:"Trouble in the occupied zone",
 b:S=>`Month after month, ${REGIONS[S.flags._occT].n} declines to enjoy being administered. An IED, a general strike, a viral funeral. The occupation costs money, soldiers and the benefit of every doubt.`,
 opts:[
 {l:"Withdraw with ceremony",s:"End it; eat the humiliation",special:"occ_withdraw"},
 {l:"Install a friendly government",s:"Sovereignty, supervised",special:"occ_puppet"},
 {l:"Iron fist",s:"Order now, history later",special:"occ_fist"}]},
{id:"quiet",w:5,et:"Westminster",t:"A quiet month, allegedly",
 b:()=>"No crisis worthy of the name. A minister opens a bridge. A swan delays a bypass. You sleep almost six hours and wake suspicious.",
 opts:[
 {l:"Catch up on red boxes",s:"+ capital",eff:{capital:6},q:"PM DOES PAPERWORK, NATION COPES"},
 {l:"Regional tour — shake hands, eat things",s:"+ approval",eff:{app:2},q:"PM EATS 14 LOCAL DELICACIES"}]},
/* --- background-specific (gov) --- */
{id:"bg_banker",w:4,once:true,cond:S=>S.meta.bg==="banker",et:"Your past",t:"The short position",
 b:()=>"A newspaper finds your old fund shorted the pound in '22 — legally, profitably, gleefully. 'PM BET AGAINST BRITAIN' is already typeset.",
 opts:[
 {l:"Publish the full trading book",s:"Radical transparency",eff:{app:-2,trustM:4,sleaze:-3},q:"THE BOOK, OPENED"},
 {l:"'Markets are markets'",s:"True, and fatal at scale",eff:{app:-4,trustM:6,media:-3},q:"NO APOLOGY FROM NO. 10"}]},
{id:"bg_doctor",w:4,once:true,cond:S=>S.meta.bg==="doctor",et:"Your past",t:"Your old ward calls",
 b:()=>"Your former hospital invites you back for a shift 'any time'. The press office hears 'photo op'; the BMA hears 'stunt'; you hear a rota gap.",
 opts:[
 {l:"Do a real night shift",s:"Twelve hours, no cameras (one camera)",eff:{app:5,media:3,capital:-4},q:"THE PM WILL SEE YOU NOW"},
 {l:"Decline gracefully",s:"Dignity, unphotographed",eff:{},q:"DUTY CALLS (ELSEWHERE)"}]},
{id:"bg_soldier",w:4,once:true,cond:S=>S.meta.bg==="soldier",et:"Your past",t:"The patrol photographs",
 b:()=>"A magazine prints photos from your tour — including one where your unit detains a man later released without charge. Context is forty pages; the photo is one.",
 opts:[
 {l:"Address it head-on in a speech",s:"Own the record",eff:{app:1,standing:3},q:"SOLDIER, STATESMAN, STORY"},
 {l:"'I won't discuss operations'",s:"The wall",eff:{media:-3,queue:[{m:2,eff:{app:-2},head:"The photo resurfaces at PMQs."}]},q:"THE WALL HOLDS, MOSTLY"}]},
{id:"bg_union",w:4,once:true,cond:S=>S.meta.bg==="union",et:"Your past",t:"The flying pickets tape",
 b:()=>"Audio from 2009: you, megaphone, advising tactics of 'questionable legality and excellent rhyme'. The Ledger has it on loop.",
 opts:[
 {l:"'I fought for working people. Still do.'",s:"Lean in",eff:{unity:5,faction:{"The Left":6},media:-3,app:-1},q:"NO REGRETS ON THE LINE"},
 {l:"'A different time'",s:"Lean out",eff:{faction:{"The Left":-6},media:2},q:"PICKET? BARELY KNEW IT"}]},
{id:"bg_hack",w:4,once:true,cond:S=>S.meta.bg==="hack",et:"Your past",t:"The column archive",
 b:()=>"Interns have read all 1,400 of your old columns. The compilation of your worst takes is 'a devastating six minutes of television'.",
 opts:[
 {l:"Pre-emptive comedy: read them aloud yourself",s:"Disarm by owning",eff:{app:2,media:4},q:"PM ROASTS PM"},
 {l:"Lawyer up over three of them",s:"Streisand has entered the chat",eff:{media:-5,sleaze:4},q:"SEE YOU IN COURT, ME"}]},
{id:"bg_spad",w:4,once:true,cond:S=>S.meta.bg==="spad",et:"Your past",t:"The memo you wrote",
 b:()=>"A 2014 memo surfaces in which you, then an adviser, designed the exact media strategy now being used against you. It is annotated 'this always works'.",
 opts:[
 {l:"'I was right then and I'm right now'",s:"Galaxy brain",eff:{media:2,app:1},q:"THE PROPHET OF SW1"},
 {l:"Quietly commission a counter-strategy",s:"Beat your younger self",eff:{capital:-4,queue:[{m:2,eff:{app:3},head:"The old playbook, neutralised by its author."}]},q:"CHESS WITH GHOSTS"}]},
];

/* =====================================================================
   OPPOSITION DECK — you are Leader of the Opposition
   extra eff keys: poll (your poll share), gov{app: hits govt approval}, chest (warchest £m)
   ===================================================================== */
const OPP_DECK=[
{id:"o_shadowbudget",w:7,et:"The reply",t:"Budget day — your reply",
 b:S=>`The Chancellor sits down to cheers. You rise with four minutes' notice and a choice: numbers, theatre, or the long game. The government's deficit is ${S.fiscalDeficit.toFixed(1)}% and everyone knows it.`,
 opts:[
 {l:"Forensic demolition of the arithmetic",s:"Win the studio, slowly",eff:{poll:1.2,media:2,capital:2},q:"THE SUMS DON'T ADD UP"},
 {l:"One brutal soundbite, repeated",s:"Win the clip",eff:{poll:.8,media:4,queue:[{m:1,eff:{poll:.5},head:"Your line leads every bulletin for a week."}]},q:"'BORROWED TIME' — LOTO'S LINE LANDS"},
 {l:"Publish a full alternative budget",s:"Hostage to every decimal",eff:{poll:rndsign(1.8),capital:-4},q:"THE SHADOW RED BOX"}]},
{id:"o_donor",w:6,et:"Money",t:"The donor with the yacht",
 b:()=>"£3m for the war chest, no strings — except the knighthood-shaped string, and the planning-permission-shaped string, and the yacht.",
 opts:[
 {l:"Take it, gold-plate the compliance",s:"Fuel for the machine",eff:{chest:3,sleaze:6},q:"THE QUIET MILLIONS"},
 {l:"Refuse, loudly",s:"Purity is a story too",eff:{poll:.8,media:2,chest:0},q:"NOT FOR SALE"}]},
{id:"o_deselect",w:5,cond:S=>S.pols.unity<50,et:"Party",t:"The deselection wars",
 b:()=>"Your activists move to deselect two moderate MPs for 'insufficient enthusiasm'. The MPs in question are on television daily, enthusiastically.",
 opts:[
 {l:"Protect the MPs",s:"Discipline the base",eff:{unity:-4,poll:.6,faction:{"The Left":-6,"Deep Greens":-6,"The Leader's Circle":-6}},q:"LOTO SHIELDS THE MODERATES"},
 {l:"Let local parties decide",s:"Feed the base",eff:{unity:3,poll:-.8,media:-3},q:"NIGHT OF THE CLIPBOARDS"}]},
{id:"o_govsteal",w:6,et:"Strategy",t:"They stole your policy",
 b:()=>"The government announces your flagship childcare plan, word for word, including the typo. The gall. The sheer, electorally effective gall.",
 opts:[
 {l:"'Imitation is surrender' — claim the win",s:"Judo",eff:{poll:.7,media:2},q:"GOVERNMENT GOVERNS BY PHOTOCOPIER"},
 {l:"Go bigger: double the offer",s:"The bidding war",eff:{poll:1,capital:-3,queue:[{m:6,eff:{poll:-.7},head:"IFS: opposition sums 'increasingly interpretive'."}]},q:"THE AUCTION OF PROMISES"}]},
{id:"o_byelect",w:7,et:"The map",t:"By-election: Crandleford North",
 b:S=>`A government seat, majority 4,100, the kind you must win to be taken seriously. Your candidate is solid; their leaflets are radioactive; the Ledger is sniffing both.`,
 opts:[
 {l:"Throw everything at it",s:"Win or wear it",eff:{chest:-1,capital:-4,queue:[{m:1,eff:null,head:"__OBYELECTION_BIG__"}]},q:"THE CRANDLEFORD BLITZ"},
 {l:"Manage expectations, modest effort",s:"Hedge",eff:{queue:[{m:1,eff:null,head:"__OBYELECTION_SMALL__"}]},q:"A 'TOUGH ASK', SAYS LOTO"}]},
{id:"o_split",w:0,forced:S=>S.pols.unity<30&&!S.flags._oconfCool,et:"LEADERSHIP",t:"The plotters move",
 b:S=>`A shadow minister resigns 'to spend more time campaigning for the leadership'. Letters are in. Unity ${S.pols.unity.toFixed(0)}. In opposition the party doesn't even wait for power to eat itself.`,
 opts:[
 {l:"Face the ballot",s:"Win or die",eff:{capital:-12,flagSet:"_oconfVote"},q:"BRING IT ON"},
 {l:"Concede a policy review + jobs for rivals",s:"Peace, smaller",eff:{unity:8,poll:-.8,flagSet:"_oconfCool"},q:"THE BIG TENT, REPITCHED"}]},
{id:"o_union_row",w:5,cond:S=>["lab","grn"].includes(S.meta.party),et:"Party",t:"The union cheque pauses",
 b:()=>"Your biggest union affiliate suspends donations over your 'fiscal credibility framework', which they pronounce like a slur.",
 opts:[
 {l:"Repair: back their strike fund",s:"Money returns, message muddies",eff:{chest:2,faction:{"The Left":8},poll:-.6,media:-2},q:"BROTHERS AGAIN"},
 {l:"Hold the line on credibility",s:"The cheque stays paused",eff:{poll:.8,trustM:3,faction:{"The Left":-8},chest:-1},q:"NO BLANK CHEQUES EITHER WAY"}]},
{id:"o_docu",w:5,once:true,et:"Television",t:"The documentary",
 b:()=>"A three-part series: 'The Real You'. Episode two contains your university flatmate, a karaoke video, and a surprisingly moving section about your mum.",
 opts:[
 {l:"Full cooperation, family interviews",s:"Humanise",eff:{app:3,poll:.8,media:2},q:"THE SOFT FOCUS GAMBIT"},
 {l:"No cooperation",s:"Mystique, or fear",eff:{media:-3,queue:[{m:1,eff:{poll:-.5},head:"Empty chair does the talking in episode three."}]},q:"THE MISSING SUBJECT"}]},
{id:"o_mrp",w:6,et:"Polling",t:"The MRP lands at midnight",
 b:S=>{const lead=S.pols.pollMe-S.opp.gov.poll;return `A 40,000-sample MRP projects ${lead>4?"you in Downing Street with room to spare":lead>0?"a hung parliament with you ahead":"the government holding on"}. Every MP has done their own seat first.`},
 opts:[
 {l:"Tour the projected gains",s:"Momentum theatre",eff:{poll:.6,capital:-3},q:"THE VICTORY LAP (PROJECTED)"},
 {l:"'The only poll that matters…'",s:"Calm, classic",eff:{unity:2},q:"LOTO PLAYS IT DOWN"}]},
{id:"o_carcrash",w:5,et:"Media",t:"The breakfast-show ambush",
 b:()=>"You came to talk policy; they came with a pop quiz on the price of milk, a gotcha about your travel claims, and a singing weatherman. Live.",
 opts:[
 {l:"Charm through it",s:"Roll with the absurd",eff:{media:3,poll:.4},q:"LOTO SURVIVES SOFA"},
 {l:"Walk off set",s:"The clip eternal",eff:{media:-5,poll:-.8,queue:[{m:1,eff:{poll:.3},head:"Walk-off divides nation; your base loves it."}]},q:"THE EMPTY SOFA"}]},
{id:"o_defector_in",w:4,cond:S=>S.opp.gov.approval<38,et:"Coup",t:"A minister wants to cross",
 b:()=>"A serving junior minister offers to defect to you — at conference, on stage, for maximum carnage. Their voting record disagrees with your last four launches.",
 opts:[
 {l:"Stage-manage the defection",s:"Theatre of collapse",eff:{poll:1.4,gov:{app:-3},seats:1,unity:-3,media:3},q:"CROSSING THE FLOOR, PRIME TIME"},
 {l:"Decline politely",s:"Purity over panto",eff:{unity:3},q:"NO VACANCIES FOR TOURISTS"}]},
{id:"o_thinktank",w:5,et:"Policy",t:"The think-tank moment",
 b:()=>"Your favourite wonks publish 'The Offer': a fully costed governing prospectus with your face implied on every page. Adopt, adapt, or admire from distance.",
 opts:[
 {l:"Adopt it wholesale",s:"Substance, with hostages",eff:{poll:.8,trustM:3,capital:-3,promise:"The Offer (platform)"},q:"THE PROSPECTUS"},
 {l:"Steal the best three ideas",s:"Buffet rules",eff:{poll:.5},q:"THE TASTING MENU"}]},
{id:"o_pastlife",w:4,once:true,et:"Your past",t:"Your past, weaponised",
 b:S=>({banker:"Attack ad: your trading floor years, scored to ominous cellos.",doctor:"They claim you 'abandoned the wards for ambition'. The wards disagree, loudly.",soldier:"An anonymous general calls you 'a corporal with a thesaurus'.",union:"Montage: every strike you ever organised, implying you personally delayed 4m commutes.",hack:"Your old paper turns on you with the special cruelty of family.",spad:"'Never had a real job' — the attack writes itself; you did, in fact, write it, in 2014."}[S.meta.bg]),
 opts:[
 {l:"Rebut with biography",s:"Tell your story properly",eff:{app:2,poll:.5},q:"THE LIFE, ANSWERED"},
 {l:"Ignore; discipline is message",s:"Don't feed it",eff:{capital:2},q:"LOTO DECLINES THE BAIT"}]},
{id:"o_localel",w:0,forced:S=>S.moy===4&&S.flags.locYear!==S.year,et:"Ballot box",t:"Local elections",
 b:()=>"Two thousand council seats, one national scoreboard, and a graphics package that will reduce your year's work to an arrow.",
 opts:[
 {l:"National campaign, your face everywhere",s:"Own the result",eff:{capital:-4,queue:[{m:0,eff:null,head:"__LOCALS_OWNED__"}]},q:"THE MAY TEST"},
 {l:"Let local issues lead",s:"Spread the risk",eff:{queue:[{m:0,eff:null,head:"__LOCALS_LOCAL__"}]},q:"ALL POLITICS IS LOCAL, INSISTS LOTO"}],
 fx:S=>{S.flags.locYear=S.year}},
{id:"o_conference",w:0,forced:S=>S.moy===8&&S.flags.oconfYear!==S.year,et:"Party conference",t:"Conference: the leader's speech",
 b:()=>"Your hall, your lanyards, your warm white wine. The press want a wobble; the members want red meat; the swing voter wants to feel safe. Pick two.",
 opts:[
 {l:"The credibility speech",s:"Aimed at the country",eff:{poll:1,trustM:3,faction:{"The Left":-4,"Deep Greens":-4,"The Leader's Circle":-4}},q:"READY TO GOVERN, SAYS LOTO"},
 {l:"The movement speech",s:"Aimed at the hall",eff:{unity:7,poll:-.4},q:"THE FAITHFUL, FED"},
 {l:"The surprise policy bomb",s:"Aimed at the bulletins",eff:{poll:rndsign(1.5),media:3,promise:"Conference pledge"},q:"THE RABBIT FROM THE HAT"}],
 fx:S=>{S.flags.oconfYear=S.year}},
{id:"o_quiet",w:5,et:"Opposition",t:"A month without traction",
 b:()=>"The government has a quiet month, which for you is a bad month. A panel show invitation sits in the inbox like a small unexploded device.",
 opts:[
 {l:"Do the panel show",s:"Risk the laugh",eff:{media:rndsign(3),poll:rndsign(.5)},q:"LOTO DOES COMEDY (RESULTS VARY)"},
 {l:"Constituency week: potholes & photos",s:"Honest graft",eff:{app:1,capital:3},q:"THE POTHOLE TOUR"}]},
{id:"o_grid",w:6,et:"Attack",t:"The government stumbles",
 b:S=>{const g=S.opp.gov;const topic=g.lastBlunder||"a procurement fiasco involving ferries and a company with no ferries";return `Today's gift: ${topic}. The question is never whether to attack — it's the calibre.`},
 opts:[
 {l:"Urgent question + media round",s:"The full press",eff:{gov:{app:-2},poll:.7,capital:-2},q:"OPPOSITION SMELLS BLOOD"},
 {l:"Hold fire; let it burn alone",s:"Never interrupt an enemy…",eff:{gov:{app:-1},capital:2},q:"SILENCE FROM THE BENCHES, LOUDLY"}]},
];


/* ---------- the talent: real figures per party (neutral stats; they drift) ---------- */
const REAL_POLS={
 lab:[["Rachel Reeves",38,78,62,48,"Chancellor"],["Wes Streeting",42,74,55,68,"Health Sec."],["Angela Rayner",46,62,58,72,"Home Sec."],["Yvette Cooper",41,76,70,46,"Home Sec."],["Ed Miliband",40,66,72,55,"Energy Sec."],["John Healey",39,71,78,40,"Defence Sec."],["Bridget Phillipson",36,65,68,45,"Education Sec."],["Shabana Mahmood",37,70,60,50,"Home Sec."],["Pat McFadden",33,75,80,32,"Chief Whip"],["Liz Kendall",30,60,62,38,"Education Sec."],["Lisa Nandy",35,58,55,52,"Foreign Sec."],["Darren Jones",34,68,64,46,"Chancellor"]],
 con:[["Jeremy Hunt",37,74,60,42,"Chancellor"],["James Cleverly",41,66,58,60,"Foreign Sec."],["Robert Jenrick",36,62,40,52,"Home Sec."],["Priti Patel",34,58,48,50,"Home Sec."],["Tom Tugendhat",40,68,55,54,"Defence Sec."],["Victoria Atkins",35,64,62,44,"Health Sec."],["Mel Stride",33,70,68,36,"Chancellor"],["Suella Braverman",30,52,30,55,"Home Sec."],["Laura Trott",34,63,64,42,"Education Sec."],["Andrew Griffith",32,61,60,38,"Energy Sec."],["Alex Burghart",31,60,66,36,"Chief Whip"],["Kemi Badenoch",38,60,42,62,"Foreign Sec."]],
 lib:[["Ed Davey",44,64,75,58,"Foreign Sec."],["Daisy Cooper",40,66,72,52,"Chancellor"],["Layla Moran",41,62,60,58,"Foreign Sec."],["Munira Wilson",36,63,66,44,"Health Sec."],["Sarah Olney",35,67,68,40,"Chancellor"],["Tim Farron",39,58,60,56,"Education Sec."],["Wendy Chamberlain",34,62,70,40,"Chief Whip"],["Helen Morgan",33,60,66,38,"Defence Sec."],["Christine Jardine",34,59,64,42,"Home Sec."],["Max Wilkinson",31,57,62,40,"Energy Sec."]],
 ref:[["Nigel Farage",47,58,35,82,"Foreign Sec."],["Richard Tice",36,56,55,50,"Chancellor"],["Zia Yusuf",35,68,52,48,"Chancellor"],["Lee Anderson",33,40,50,58,"Home Sec."],["Sarah Pochin",30,52,58,40,"Education Sec."],["Danny Kruger",34,64,48,46,"Health Sec."],["David Bull",32,50,60,52,"Health Sec."],["James McMurdock",27,45,55,34,"Chief Whip"],["Ann Widdecombe",35,55,62,54,"Home Sec."],["Tim Montgomerie",30,58,50,38,"Energy Sec."]],
 grn:[["Zack Polanski",38,58,55,66,"Energy Sec."],["Carla Denyer",37,64,68,50,"Energy Sec."],["Adrian Ramsay",34,62,72,38,"Chancellor"],["Siân Berry",36,60,66,46,"Home Sec."],["Ellie Chowns",33,63,68,40,"Foreign Sec."],["Caroline Lucas",46,70,74,58,"Foreign Sec."],["Mothin Ali",30,50,52,48,"Education Sec."],["Larry Sanders",28,48,60,36,"Health Sec."],["Jenny Jones",33,55,66,40,"Home Sec."],["Amelia Womack",30,54,60,44,"Education Sec."]],
};

/* ---------- TV debate scripts: rival answers by ideological flavour ---------- */
const DEBATE_LINES={
 infl:{left:"Cap prices, tax the profiteers, and stop pretending the market will feed anyone.",right:"Sound money, lower taxes, and an end to the borrowing binge that caused this.",centre:"Targeted help now, fiscal discipline after — and honesty that both hurt."},
 nhs:{left:"Pay the staff, fund the beds, end the privatisation by stealth.",right:"Reform before money: outcomes, not inputs — and use every spare private bed.",centre:"A ten-year workforce plan and an honest conversation about social care."},
 mig:{left:"Safe routes, faster decisions, and an economy that stops needing scapegoats.",right:"A hard annual cap, offshore processing, and deport-first appeals-later.",centre:"Control and compassion: smash the gangs, clear the backlog, count honestly."},
 crime:{left:"Youth services, mental health, and policing by consent — prevention beats punishment.",right:"More officers, longer sentences, and stop-and-search without apology.",centre:"Visible neighbourhood policing and courts that actually function."},
 jobs:{left:"A green industrial strategy and a real living wage — invest, don't liquidate.",right:"Cut the red tape, cut the taxes, and let business breathe again.",centre:"Skills, infrastructure, and planning reform — the boring trinity that works."},
 sleaze:{left:"Clean the lot out: ban second jobs, end the honours bazaar.",right:"Individual failings, swiftly punished — not an excuse to smear everyone.",centre:"An independent ethics commissioner with teeth, appointed tomorrow."},
 war:{left:"De-escalate, talk, and never again write blank cheques in other people's blood.",right:"Strength is the only language they understand — rearm and stand firm.",centre:"Hold the line with allies, fund the forces, keep the channel open."},
};

/* ---------- electoral geography ---------- */
const ELECT_REGIONS=[["scot","Scotland",57],["north","The North",124],["mid","The Midlands",100],["wales","Wales",32],["lon","London",75],["south","The South",244]];

/* helper used by deck definitions */
function rndsign(x){return Math.random()<.5?x:-x}

/* AI-government blunder/news table (opposition phase colour) */
const GOV_NEWS=[
 ["a ferry contract awarded to a company with no ferries",-2.5],
 ["the Chancellor's conference hotel invoice",-1.5],
 ["a 'levelling up' fund that levelled down",-2],
 ["an asylum barge with legionella",-2.5],
 ["the Health Secretary's gym selfie during a strike",-1.5],
 ["a triumphant GDP revision",2],
 ["a successful hostage release",2.5],
 ["falling inflation, claimed loudly",2],
 ["a popular fuel-duty freeze",1.5],
 ["an own-goal interview about 'real poverty'",-2.5],
 ["a u-turn on school meals",-2],
 ["a summit photo with three world leaders laughing at the same joke",1.5],
];

if(typeof module!=="undefined")module.exports={};
