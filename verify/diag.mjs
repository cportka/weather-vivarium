// diag.mjs — batch-6 diagnostics: SF bridge, Reno arch, sprite facing, and a
// baseline check (landmarks + settlement buildings on the real ground/road rows).
import { createRequire } from "module";
import http from "http"; import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUT = path.join(ROOT, "verify", "out");
const MIME = { ".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".json":"application/json",".png":"image/png" };
const server = http.createServer((req,res)=>{ let p=path.join(ROOT,decodeURIComponent(req.url.split("?")[0])); if(!p.startsWith(ROOT)){res.writeHead(403);return res.end();} fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);return res.end("nf");} res.writeHead(200,{"content-type":MIME[path.extname(p)]||"application/octet-stream"}); res.end(d);});});

async function main() {
  await new Promise(r=>server.listen(8095,r));
  const browser = await chromium.launch({ executablePath: CHROME, args:["--no-sandbox"] });
  const page = await browser.newPage();
  page.on("console", m => { if (m.type()==="error") console.log("  [err]", m.text()); });
  await page.goto("http://localhost:8095/verify/harness.html");
  await page.waitForFunction("window.__ready === true",{timeout:15000});

  async function shot(name){ await (await page.$("#out")).screenshot({ path: path.join(OUT, name+".png") }); console.log("  wrote", name+".png"); }

  // SF + Reno scenes (sceneStrip, 3x)
  await page.evaluate(()=>window.sceneStrip({name:"San Francisco",country:"United States",latitude:37.77,longitude:-122.42,population:870000},{temp:60,code:1},840,3)); await shot("diag-sf");
  await page.evaluate(()=>window.sceneStrip({name:"San Francisco",country:"United States",latitude:37.77,longitude:-122.42,population:870000},{temp:58,code:2},90,3)); await shot("diag-sf-night");
  await page.evaluate(()=>window.sceneStrip({name:"Reno",country:"United States",latitude:39.53,longitude:-119.81,population:264000},{temp:90,code:0},1200,3)); await shot("diag-reno");
  await page.evaluate(()=>window.sceneStrip({name:"Reno",country:"United States",latitude:39.53,longitude:-119.81,population:264000},{temp:74,code:1},90,3)); await shot("diag-reno-night");

  // Facing test + baseline test (custom draw with the compositor's exact flip rule)
  await page.evaluate(async () => {
    const { createPainter } = await import("/src/engine/painter.js");
    const { CATALOG, LANDMARKS } = window;
    const settle = await import("/src/catalog/settlements.js");
    const L=50, S=6;
    const out = document.getElementById("out");
    function mkEnv(extra){ return Object.assign({ L:L, horizon:24, groundTop:37, roadBot:46, frame:0, dayT:1, night:false, col:c=>c, rng:()=>0.5, dir:1, wind:0.3, code:0, temp:70 }, extra||{}); }
    function drawFacing(P, entry, x, yb, env, dir){ env.dir=1; if(dir<0){ var x0 = entry.anchor==="center" ? x-(entry.w>>1) : x; P.flip(x0, entry.w, ()=>entry.draw(P,x,yb,env)); } else entry.draw(P,x,yb,env); }

    // --- FACING: each sprite drawn dir=+1 (left) then dir=-1 (right); the pair must mirror ---
    const gull = CATALOG.birds.find(b=>b.id==="gull");
    const toucan = CATALOG.animals.find(a=>a.id==="toucan");
    const parrot = CATALOG.animals.find(a=>a.id==="parrot");
    const car = CATALOG.vehicles.find(v=>(v.layer||"road")==="road");
    const person = CATALOG.people[0];
    const specimens = [gull, toucan, parrot, car, person].filter(Boolean);
    const cols = 2, rowH = 16, colW = 26;
    out.width = cols*colW*S; out.height = specimens.length*rowH*S;
    const oc = out.getContext("2d"); oc.imageSmoothingEnabled=false; oc.fillStyle="#7fb8e0"; oc.fillRect(0,0,out.width,out.height);
    const buf=document.createElement("canvas"); buf.width=L; buf.height=L; const b=buf.getContext("2d"); b.imageSmoothingEnabled=false; const P=createPainter(b,L);
    specimens.forEach((sp,i)=>{
      [1,-1].forEach((dir,ci)=>{
        b.clearRect(0,0,L,L); b.fillStyle="#7fb8e0"; b.fillRect(0,0,L,L);
        const cx = sp.anchor==="center" ? 12 : 8, yb = sp.anchor==="center" ? 8 : 13;
        drawFacing(P, sp, cx, yb, mkEnv(), dir);
        oc.drawImage(buf, 0,0, colW,rowH, ci*colW*S, i*rowH*S, colW*S, rowH*S);
      });
    });
    window.__diagFacing = specimens.map(s=>s.id);
  });
  await shot("diag-facing");

  // --- BASELINE: landmarks + settlement buildings on ground row 36, road at 37 ---
  await page.evaluate(async () => {
    const { createPainter } = await import("/src/engine/painter.js");
    const { LANDMARKS } = window;
    const settle = await import("/src/catalog/settlements.js");
    const L=50, S=6, GT=37;
    function mkEnv(extra){ return Object.assign({ L:L, horizon:24, groundTop:GT, roadBot:46, frame:0, dayT:1, night:false, col:c=>c, rng:()=>0.5, dir:1 }, extra||{}); }
    const items = [
      {kind:"lm", id:"casino-reno"}, {kind:"lm", id:"eiffel"}, {kind:"lm", id:"christ-redeemer"},
      {kind:"lm", id:"opera-house"}, {kind:"lm", id:"statue-liberty"},
      {kind:"st", id:"chalet"}, {kind:"st", id:"nordic"}, {kind:"st", id:"adobe"}, {kind:"st", id:"towers"}, {kind:"st", id:"stilt"}
    ];
    const cols=5, tile=50, rows=Math.ceil(items.length/cols);
    const out=document.getElementById("out"); out.width=cols*tile*S; out.height=rows*tile*S;
    const oc=out.getContext("2d"); oc.imageSmoothingEnabled=false;
    const buf=document.createElement("canvas"); buf.width=L; buf.height=L; const b=buf.getContext("2d"); b.imageSmoothingEnabled=false; const P=createPainter(b,L);
    const missing=[];
    items.forEach((it,i)=>{
      b.clearRect(0,0,L,L);
      b.fillStyle="#8aa860"; b.fillRect(0,0,L,GT);          // grass up to row 36
      b.fillStyle="#3c3c44"; b.fillRect(0,GT,L,9);          // road from row 37
      b.fillStyle="#ff00ff"; b.fillRect(0,GT,L,1);          // MAGENTA line = ground/road boundary (row 37)
      const env=mkEnv();
      if(it.kind==="lm"){ const lm=LANDMARKS.find(l=>l.id===it.id); if(!lm){missing.push(it.id);return;} lm.draw(P, 16, GT-1, env); }
      else { const stl=settle.STYLES[it.id]; if(!stl){missing.push(it.id);return;} stl.building(P, 20, 6, 8, env, true, ()=>0.5); }
      const cx=(i%cols)*tile*S, cy=Math.floor(i/cols)*tile*S;
      oc.drawImage(buf,0,0,L,L,cx,cy,L*S,L*S);
      oc.fillStyle="#fff"; oc.font="9px monospace"; oc.fillText(it.id, cx+3, cy+10);
    });
    window.__diagMissing = missing;
  });
  await shot("diag-baseline");

  const facing = await page.evaluate(()=>window.__diagFacing);
  const missing = await page.evaluate(()=>window.__diagMissing);
  const errs = await page.evaluate(()=>window.__errors||[]);
  console.log("facing specimens:", facing, "| baseline missing:", missing, "| draw errors:", errs.length);
  await browser.close(); server.close();
}
main().catch(e=>{ console.error(e); process.exit(1); });
