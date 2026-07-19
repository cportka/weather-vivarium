// eval-batch5.mjs — visual check for the settlements/density/biome-variety batch.
// Renders three sheets into verify/out/: a density spectrum (one place, growing
// population), a settlement-style grid (one city per biome at city density), and
// a landmark strip incl. the redrawn Christ the Redeemer. Run: node verify/eval-batch5.mjs
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

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

// A density spectrum on one coastal place, population 500 → 30M.
const SPECTRUM = [
  ["pastoral 500", 500], ["hamlet 3k", 3000], ["village 12k", 12000], ["town 60k", 60000],
  ["small city 200k", 200000], ["city 800k", 800000], ["big city 3M", 3000000],
  ["metropolis 12M", 12000000], ["megacity 30M", 30000000]
].map(([label, pop]) => ({
  label, now: 840,
  place: { name: "Everytown", country: "United States", latitude: 36.9, longitude: -76.2, population: pop },
  wx: { temp: 70, code: 1 }
}));

// One representative city per biome at a healthy city density — exercises the
// settlement styles (a city picks one per seed; the name seeds the pick).
const BIOMES = [
  ["Dubai desert", { name: "Dubai", country: "AE", latitude: 25.2, longitude: 55.3, population: 3300000 }],
  ["Marrakesh medina", { name: "Marrakesh", country: "MA", latitude: 31.6, longitude: -8.0, population: 900000 }],
  ["Bergen nordic", { name: "Bergen", country: "NO", latitude: 60.4, longitude: 5.3, population: 280000 }],
  ["Singapore shophouse", { name: "Georgetown", country: "MY", latitude: 5.4, longitude: 100.3, population: 700000 }],
  ["Kyoto pagoda", { name: "Kyoto", country: "JP", latitude: 35.0, longitude: 135.8, population: 1400000 }],
  ["Rotterdam port", { name: "Rotterdam", country: "NL", latitude: 51.9, longitude: 4.5, population: 650000 }],
  ["Hong Kong towers", { name: "Kowloon", country: "HK", latitude: 22.3, longitude: 114.2, population: 2000000 }],
  ["Brooklyn brownstone", { name: "Brooklyn", country: "United States", latitude: 40.7, longitude: -73.9, population: 2600000 }],
  ["Midland oil-town", { name: "Midland", country: "United States", latitude: 32.0, longitude: -102.1, population: 130000 }],
  ["Tahoe lake-lodge", { name: "Tahoe", country: "United States", latitude: 39.1, longitude: -120.0, population: 24000 }],
  ["Cancun resort", { name: "Cancun", country: "MX", latitude: 21.2, longitude: -86.8, population: 900000 }],
  ["Santa Fe pueblo", { name: "Santa Fe", country: "United States", latitude: 35.7, longitude: -106.0, population: 85000 }],
  ["Nairobi savanna", { name: "Nairobi", country: "Kenya", latitude: -1.29, longitude: 36.82, population: 4400000 }],
  ["Rio favela+Christ", { name: "Rio de Janeiro", country: "Brazil", latitude: -22.9, longitude: -43.2, population: 6700000 }],
  ["New Orleans swamp", { name: "New Orleans", country: "United States", latitude: 30.0, longitude: -90.1, population: 390000 }],
  ["Aspen pastoral 7k", { name: "Aspen", country: "United States", latitude: 39.2, longitude: -106.8, population: 7000 }]
].map(([label, place]) => ({ label, now: 840, place, wx: { temp: 66, code: 1 } }));

async function main() {
  await new Promise(r => server.listen(8097, r));
  const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  page.on("console", m => { if (m.type() === "error") console.log("  [console.error]", m.text()); });
  await page.goto("http://localhost:8097/verify/harness.html");
  await page.waitForFunction("window.__ready === true", { timeout: 15000 });

  async function grid(name, specs, cols) {
    const dims = await page.evaluate((a) => window.cityGrid(a.specs, a.cols), { specs, cols });
    await (await page.$("#out")).screenshot({ path: path.join(OUT, name + ".png") });
    console.log("  wrote", name + ".png", JSON.stringify(dims));
  }
  await grid("eval-spectrum", SPECTRUM, 9);
  await grid("eval-styles", BIOMES, 4);

  // Landmark contact sheet (Christ redraw + the rest).
  await page.evaluate(() => window.contactSheet(window.LANDMARKS, "LANDMARKS"));
  await (await page.$("#out")).screenshot({ path: path.join(OUT, "eval-landmarks.png") });
  console.log("  wrote eval-landmarks.png");

  const errors = await page.evaluate(() => window.__errors || []);
  await browser.close();
  server.close();
  if (errors.length) { console.log("\nDRAW ERRORS:\n" + errors.join("\n")); process.exitCode = 1; }
  else console.log("\nNo draw errors.");
}
main().catch(e => { console.error(e); process.exit(1); });
