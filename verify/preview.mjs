// preview.mjs — render the 12-city README preview (animated GIF + static PNG).
// Representative time/weather per city (deterministic, no network). Run:
//   node verify/preview.mjs
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { encodeGif } from "./gif.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const FRAMES = path.join(ROOT, "verify", "out", "frames");
const ASSETS = path.join(ROOT, "assets");
fs.mkdirSync(FRAMES, { recursive: true });
fs.mkdirSync(ASSETS, { recursive: true });

// Evocative time-of-day + weather per city (a showcase; the live gallery is real).
const SPECS = [
  { label: "Berkeley, CA", now: 540, wx: { temp: 61, code: 1, cloud: 20, waveM: 0.8 }, place: { name: "Berkeley", admin1: "CA", latitude: 37.87, longitude: -122.27, timezone: "America/Los_Angeles", elevation: 52 } },
  { label: "New York, NY", now: 1165, wx: { temp: 68, code: 2, cloud: 30 }, place: { name: "New York", admin1: "NY", latitude: 40.71, longitude: -74.01, timezone: "America/New_York", elevation: 10 } },
  { label: "Honolulu, HI", now: 720, wx: { temp: 84, code: 0, waveM: 1.6 }, place: { name: "Honolulu", admin1: "HI", latitude: 21.31, longitude: -157.86, timezone: "Pacific/Honolulu", elevation: 6 } },
  { label: "Anchorage, AK", now: 1050, wx: { temp: 21, code: 73, cloud: 90, windKph: 12 }, place: { name: "Anchorage", admin1: "AK", latitude: 61.22, longitude: -149.90, timezone: "America/Anchorage", elevation: 30 } },
  { label: "Seattle, WA", now: 780, wx: { temp: 52, code: 63, cloud: 95, windKph: 14 }, place: { name: "Seattle", admin1: "WA", latitude: 47.61, longitude: -122.33, timezone: "America/Los_Angeles", elevation: 56 } },
  { label: "Las Vegas, NV", now: 780, wx: { temp: 104, code: 0, windKph: 26 }, place: { name: "Las Vegas", admin1: "NV", latitude: 36.17, longitude: -115.14, timezone: "America/Los_Angeles", elevation: 610 } },
  { label: "Miami, FL", now: 930, wx: { temp: 87, code: 95, cloud: 80 }, place: { name: "Miami", admin1: "FL", latitude: 25.76, longitude: -80.19, timezone: "America/New_York", elevation: 2 } },
  { label: "Austin, TX", now: 1155, wx: { temp: 91, code: 1, cloud: 15 }, place: { name: "Austin", admin1: "TX", latitude: 30.27, longitude: -97.74, timezone: "America/Chicago", elevation: 149 } },
  { label: "Washington, DC", now: 600, wx: { temp: 70, code: 2, cloud: 40 }, place: { name: "Washington", admin1: "DC", latitude: 38.90, longitude: -77.04, timezone: "America/New_York", elevation: 7 } },
  { label: "New Orleans, LA", now: 1200, wx: { temp: 82, code: 80, cloud: 60 }, place: { name: "New Orleans", admin1: "LA", latitude: 29.95, longitude: -90.07, timezone: "America/Chicago", elevation: 1 } },
  { label: "Memphis, TN", now: 70, wx: { temp: 66, code: 0, cloud: 10 }, place: { name: "Memphis", admin1: "TN", latitude: 35.15, longitude: -90.05, timezone: "America/Chicago", elevation: 78 } },
  { label: "Chicago, IL", now: 1020, wx: { temp: 57, code: 3, cloud: 85, windKph: 34 }, place: { name: "Chicago", admin1: "IL", latitude: 41.88, longitude: -87.63, timezone: "America/Chicago", elevation: 181 } }
];

const server = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (e, data) => {
    if (e) { res.writeHead(404); return res.end("nf"); }
    const mime = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json" }[path.extname(p)] || "application/octet-stream";
    res.writeHead(200, { "content-type": mime }); res.end(data);
  });
});

async function main() {
  await new Promise(r => server.listen(8098, r));
  const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.goto("http://localhost:8098/verify/harness.html");
  await page.waitForFunction("window.__ready === true", { timeout: 15000 });
  const dims = await page.evaluate((s) => window.previewInit(s), SPECS);
  console.log("grid", JSON.stringify(dims));

  const canvas = await page.$("#out");
  const START = 40, N = 36;
  // warm up entity state
  for (let f = 0; f < START; f++) await page.evaluate((f) => window.previewFrame(f), f);
  for (let i = 0; i < N; i++) {
    await page.evaluate((f) => window.previewFrame(f), START + i);
    await canvas.screenshot({ path: path.join(FRAMES, "f" + String(i).padStart(3, "0") + ".png") });
  }
  const errors = await page.evaluate(() => window.__errors || []);
  await browser.close(); server.close();
  if (errors.length) console.log("PREVIEW ERRORS:\n" + errors.slice(0, 10).join("\n"));

  // static PNG (first frame) + animated GIF (12fps), encoded in pure JS
  fs.copyFileSync(path.join(FRAMES, "f000.png"), path.join(ASSETS, "gallery-preview.png"));
  const info = encodeGif(FRAMES, path.join(ASSETS, "gallery-preview.gif"), { delay: 83 });
  console.log(`Wrote assets/gallery-preview.png and assets/gallery-preview.gif ` +
    `(${info.width}x${info.height}, ${info.frames} frames, ${Math.round(info.bytes / 1024)} KB)`);
}
main().catch(e => { console.error(e); process.exit(1); });
