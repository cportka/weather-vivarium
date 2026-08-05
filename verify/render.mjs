// Headless render harness — screenshots catalog contact sheets + example scenes
// with Chromium (Playwright). Run: node verify/render.mjs
import { launchChromium } from "./browser.mjs";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUT = path.join(ROOT, "verify", "out");
fs.mkdirSync(OUT, { recursive: true });

const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png" };
const server = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (e, data) => {
    if (e) { res.writeHead(404); return res.end("nf"); }
    res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
    res.end(data);
  });
});

async function main() {
  await new Promise(r => server.listen(8099, r));
  const browser = await launchChromium();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const logs = [];
  page.on("console", m => logs.push(m.text()));
  await page.goto("http://localhost:8099/verify/harness.html");
  await page.waitForFunction("window.__ready === true", { timeout: 15000 });

  async function shot(name, evalFn, arg) {
    const dims = await page.evaluate(evalFn, arg);
    const canvas = await page.$("#out");
    await canvas.screenshot({ path: path.join(OUT, name + ".png") });
    console.log("  wrote", name + ".png", JSON.stringify(dims));
  }

  // Catalog contact sheets
  for (const cat of ["trees", "vehicles", "birds", "animals", "people", "signs"]) {
    await shot("catalog-" + cat, (c) => window.contactSheet(window.CATALOG[c], c.toUpperCase()), cat);
  }
  await shot("catalog-landmarks", () => window.contactSheet(window.LANDMARKS, "LANDMARKS"));

  // Example scenes: LA parity (day/dusk/night), plus a spread of biomes & weather
  const scenes = [
    ["scene-la-day", { name: "Los Angeles", country: "United States", latitude: 34.02, longitude: -118.49 }, {}, 720, 4],
    ["scene-la-dusk", { name: "Los Angeles", country: "United States", latitude: 34.02, longitude: -118.49 }, { code: 0 }, 1170, 4],
    ["scene-la-night", { name: "Los Angeles", country: "United States", latitude: 34.02, longitude: -118.49 }, {}, 90, 4],
    ["scene-nyc", { name: "New York", country: "United States", latitude: 40.7, longitude: -74 }, { temp: 68, code: 2 }, 900, 4],
    ["scene-vegas", { name: "Las Vegas", country: "United States", latitude: 36.17, longitude: -115.14, elevation: 610 }, { temp: 104, code: 0, windKph: 30 }, 780, 4],
    ["scene-seattle-rain", { name: "Seattle", country: "United States", latitude: 47.6, longitude: -122.3 }, { temp: 52, code: 63, cloud: 95 }, 720, 4],
    ["scene-anchorage-snow", { name: "Anchorage", country: "United States", latitude: 61.2, longitude: -149.9 }, { temp: 20, code: 73, cloud: 90 }, 720, 4],
    ["scene-honolulu", { name: "Honolulu", country: "United States", latitude: 21.3, longitude: -157.8 }, { temp: 84, code: 1, waveM: 1.6 }, 780, 4],
    ["scene-miami", { name: "Miami", country: "United States", latitude: 25.76, longitude: -80.19 }, { temp: 88, code: 95, cloud: 80 }, 810, 4],
    ["scene-cairo", { name: "Cairo", country: "Egypt", latitude: 30.04, longitude: 31.24 }, { temp: 38, code: 0 }, 780, 4],
    ["scene-sydney", { name: "Sydney", country: "Australia", latitude: -33.87, longitude: 151.21 }, { temp: 22, code: 1, waveM: 1.2 }, 720, 6],
    ["scene-zurich", { name: "Zurich", country: "Switzerland", latitude: 47.37, longitude: 8.54, elevation: 408 }, { temp: 12, code: 2 }, 720, 4],
    ["scene-nairobi", { name: "Nairobi", country: "Kenya", latitude: -1.29, longitude: 36.82, elevation: 1795 }, { temp: 26, code: 1 }, 720, 4]
  ];
  for (const [name, place, wx, now, frames] of scenes) {
    await shot(name, (a) => window.sceneStrip(a.place, a.wx, a.now, a.frames), { place, wx, now, frames });
  }

  const errors = await page.evaluate(() => window.__errors || []);
  await browser.close();
  server.close();
  if (errors.length) { console.log("\nDRAW ERRORS:\n" + errors.join("\n")); process.exitCode = 1; }
  else console.log("\nNo draw errors.");
}
main().catch(e => { console.error(e); process.exit(1); });
