// Geography v2: 50m Natural Earth world + fully-tiled 650-cell UK cartogram.
const https=require("https"),fs=require("fs");
const topo=require("topojson-client");
function get(url){return new Promise((res,rej)=>{https.get(url,r=>{
  if(r.statusCode>=300&&r.headers.location)return get(r.headers.location).then(res,rej);
  let d="";r.on("data",c=>d+=c);r.on("end",()=>res(d));}).on("error",rej)})}
const PX=(lon,lat)=>[(lon+180)/360*1000,(90-lat)/180*500];
(async()=>{
  console.log("downloading 50m datasets…");
  const land=JSON.parse(await get("https://unpkg.com/world-atlas@2.0.2/land-50m.json"));
  const countries=JSON.parse(await get("https://unpkg.com/world-atlas@2.0.2/countries-50m.json"));
  // ---------- world ----------
  const landGeo=topo.feature(land,land.objects.land);
  const paths=[];let pts=0;
  for(const poly of landGeo.features[0].geometry.coordinates){
    for(const ring of poly){
      let prev=null;const out=[];
      for(const[lo,la]of ring){
        const[x,y]=PX(lo,la);const px=Math.round(x*10)/10,py=Math.round(y*10)/10;
        if(prev&&Math.abs(prev[0]-px)<0.15&&Math.abs(prev[1]-py)<0.15)continue;
        out.push([px,py]);prev=[px,py];}
      if(out.length<5)continue;
      const xs=out.map(p=>p[0]),ys=out.map(p=>p[1]);
      if(Math.max(...xs)-Math.min(...xs)<2.2&&Math.max(...ys)-Math.min(...ys)<2.2)continue;
      pts+=out.length;
      paths.push("M"+out.map(p=>p[0]+","+p[1]).join("L")+"Z");
    }
  }
  console.log("world: ",paths.length,"rings,",pts,"points");
  // ---------- UK ----------
  const cgeo=topo.feature(countries,countries.objects.countries);
  const uk=cgeo.features.find(f=>f.id==="826"||/United Kingdom/i.test((f.properties&&f.properties.name)||""));
  const rings=uk.geometry.type==="Polygon"?[uk.geometry.coordinates]:uk.geometry.coordinates;
  const LON0=-8.7,LON1=2.1,LAT0=49.8,LAT1=61.1,W=460,H=560,PAD=10,GBW=350;
  const ux=lo=>PAD+(lo-LON0)/(LON1-LON0)*(GBW-2*PAD);
  const uy=la=>PAD+(LAT1-la)/(LAT1-LAT0)*(H-2*PAD);
  const allRings=[],ukPaths=[];
  for(const poly of rings){for(const ring of poly){
    if(ring.length<8)continue;
    allRings.push(ring);
    ukPaths.push("M"+ring.map(([lo,la])=>(Math.round(ux(lo)*10)/10)+","+(Math.round(uy(la)*10)/10)).join("L")+"Z");}}
  console.log("uk rings:",allRings.length);
  function insideLL(lo,la){let inAny=false;
    for(const ring of allRings){let c=false;
      for(let i=0,j=ring.length-1;i<ring.length;j=i++){
        const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
        if(((yi>la)!=(yj>la))&&(lo<(xj-xi)*(la-yi)/(yj-yi)+xi))c=!c;}
      if(c)inAny=true;}
    return inAny;}
  const isNI=(lo,la)=>lo<-5.15&&la>53.95&&la<55.35;
  function regionOf(lo,la){
    if(la>54.95&&!(lo<-5.15&&la<55.35))return"scot";
    if(lo<=-2.68&&la>=51.33&&la<=53.45)return"wales";
    if(la>53.05)return"north";
    if(la>52.0)return"mid";
    return"south";}
  // hex-pack GB at a pitch giving slightly more than 557 cells, then trim edges
  const TARGET={scot:57,wales:32,north:124,mid:100,south:244};
  const GBN=557;
  function packGB(pitch){
    const cells=[];
    const dLat=pitch*(LAT1-LAT0)/(H-2*PAD);
    const dLon=pitch*(LON1-LON0)/(GBW-2*PAD);
    let row=0;
    for(let la=LAT0+dLat/2;la<=LAT1;la+=dLat*0.866,row++){
      const off=(row%2)*dLon/2;
      for(let lo=LON0+dLon/2+off;lo<=LON1;lo+=dLon){
        if(isNI(lo,la))continue;
        if(insideLL(lo,la))cells.push({lo,la,r:regionOf(lo,la)});}}
    return cells;}
  let pitch=9.4,cells=null;
  for(let it=0;it<28;it++){cells=packGB(pitch);
    if(cells.length>GBN+70)pitch*=1.035;else if(cells.length<GBN+12)pitch*=0.97;else break;}
  console.log("gb packed:",cells.length,"pitch",pitch.toFixed(2));
  // trim outermost (fewest neighbours) until exactly GBN
  function neighbours(c,arr,d){let n=0;for(const o of arr){if(o===c)continue;
    const dx=(o.lo-c.lo)/( (LON1-LON0)/(GBW-2*PAD)),dy=(o.la-c.la)/((LAT1-LAT0)/(H-2*PAD));
    if(dx*dx+dy*dy<d*d)n++;}return n;}
  while(cells.length>GBN){
    let worst=null,wn=99;
    for(const c of cells){const n=neighbours(c,cells,pitch*1.25);if(n<wn){wn=n;worst=c;if(n<=2)break}}
    cells.splice(cells.indexOf(worst),1);}
  // exact regional quotas via boundary transfers to adjacent regions
  const ADJ={scot:["north"],north:["scot","mid","wales"],mid:["north","south","wales"],south:["mid","wales"],wales:["north","mid","south"]};
  const cnt=()=>{const m={scot:0,wales:0,north:0,mid:0,south:0};cells.forEach(c=>m[c.r]++);return m};
  for(let it=0;it<4000;it++){
    const m=cnt();const over=Object.keys(TARGET).find(k=>m[k]>TARGET[k]);
    if(!over)break;
    const under=Object.keys(TARGET).filter(k=>m[k]<TARGET[k]&&ADJ[over].includes(k))
      .sort((a,b)=>(m[a]-TARGET[a])-(m[b]-TARGET[b]))[0]
      ||Object.keys(TARGET).find(k=>m[k]<TARGET[k]);
    // move the 'over' cell geographically closest to the 'under' region's centroid
    const uc=cells.filter(c=>c.r===under);
    const cy=uc.length?uc.reduce((a,c)=>a+c.la,0)/uc.length:52,cx=uc.length?uc.reduce((a,c)=>a+c.lo,0)/uc.length:-1;
    let best=null,bd=1e9;
    for(const c of cells){if(c.r!==over)continue;const d=(c.lo-cx)*(c.lo-cx)*0.5+(c.la-cy)*(c.la-cy);if(d<bd){bd=d;best=c}}
    best.r=under;}
  console.log("gb quotas:",cnt());
  // NI: 18 cells on its own finer grid
  let ni=[];let np=pitch*0.86;
  for(let it=0;it<24;it++){ni=[];
    const dLat=np*(LAT1-LAT0)/(H-2*PAD),dLon=np*(LON1-LON0)/(GBW-2*PAD);let row=0;
    for(let la=53.95+dLat/2;la<55.35;la+=dLat*0.866,row++){
      const off=(row%2)*dLon/2;
      for(let lo=-8.2+dLon/2+off;lo<-5.15;lo+=dLon){
        if(insideLL(lo,la)&&isNI(lo,la))ni.push({lo,la,r:"ni"});}}
    if(ni.length>26)np*=1.06;else if(ni.length<18)np*=0.93;else break;}
  while(ni.length>18)ni.splice(Math.floor(ni.length/2),1);
  console.log("ni cells:",ni.length);
  const seats=[];
  const push=(c)=>seats.push([Math.round(ux(c.lo)*10)/10,Math.round(uy(c.la)*10)/10,c.r]);
  cells.sort((a,b)=>b.la-a.la||a.lo-b.lo).forEach(push);ni.forEach(push);
  // London inset: 75 hex cells out at sea, with connector to London
  const IN={x:356,y:300,cols:9,p:pitch};
  for(let i=0;i<75;i++){const r=Math.floor(i/IN.cols),c2=i%IN.cols;
    seats.push([Math.round((IN.x+c2*IN.p+(r%2)*IN.p/2)*10)/10,Math.round((IN.y+r*IN.p*0.866)*10)/10,"lon"]);}
  const counts={};seats.forEach(s=>counts[s[2]]=(counts[s[2]]||0)+1);
  console.log("FINAL:",counts,"total",seats.length);
  if(seats.length!==650)throw new Error("not 650: "+seats.length);
  const lonPt=[ux(-0.12),uy(51.5)];
  const inW=IN.cols*IN.p+IN.p,inH=Math.ceil(75/IN.cols)*IN.p*0.866+IN.p;
  const out="/* generated by tools-build-geo.js v2 — Natural Earth 50m */\n"
   +"const WORLD_GEO="+JSON.stringify(paths)+";\n"
   +"const UK_MAP={W:"+W+",H:"+H+",cell:"+(Math.round(pitch*10)/10)
   +",outline:"+JSON.stringify(ukPaths)
   +",inset:{x:"+(IN.x-pitch)+",y:"+(IN.y-pitch)+",w:"+Math.round(inW+pitch)+",h:"+Math.round(inH+pitch)+"}"
   +",connector:["+Math.round(lonPt[0])+","+Math.round(lonPt[1])+","+(IN.x-pitch)+","+Math.round(IN.y+inH/2)+"]"
   +",seats:"+JSON.stringify(seats)+"};\n";
  fs.writeFileSync("geo.js",out);
  console.log("geo.js:",(out.length/1024).toFixed(0)+"KB");
})().catch(e=>{console.error("GEO FAIL:",e.message);process.exit(1)});
