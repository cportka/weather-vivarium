// reference.mjs — render the 50 reference cities to one contact sheet.
// Run: npm run verify:reference   → verify/out/reference-50.png (+ -night.png)
import { launchChromium } from "./browser.mjs";
import http from "http"; import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import { REFERENCE_CITIES } from "./reference-cities.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUT = path.join(ROOT, "verify", "out");
fs.mkdirSync(OUT, { recursive: true });

const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); return res.end("nf"); }
    res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
    res.end(d);
  });
});

const specs = (now, wx) => REFERENCE_CITIES.map((c) => ({
  label: c.name, now,
  place: { name: c.name, latitude: c.lat, longitude: c.lon, country: c.country, population: c.population },
  wx
}));

async function main() {
  await new Promise((r) => server.listen(8087, r));
  const browser = await launchChromium();
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") console.log("  [err]", m.text()); });
  await page.goto("http://localhost:8087/verify/harness.html");
  await page.waitForFunction("window.__ready === true", { timeout: 15000 });

  for (const [name, now, wx] of [
    ["reference-50", 840, { temp: 72, code: 1 }],
    ["reference-50-night", 60, { temp: 60, code: 1 }]
  ]) {
    const dims = await page.evaluate((a) => window.cityGrid(a.specs, 10), { specs: specs(now, wx) });
    await (await page.$("#out")).screenshot({ path: path.join(OUT, name + ".png") });
    console.log("  wrote", name + ".png", JSON.stringify(dims));
  }

  const errors = await page.evaluate(() => window.__errors || []);
  await browser.close();
  server.close();
  if (errors.length) { console.log("\nDRAW ERRORS:\n" + errors.join("\n")); process.exitCode = 1; }
  else console.log("\n" + REFERENCE_CITIES.length + " reference cities — no draw errors.");
}
main().catch((e) => { console.error(e); process.exit(1); });
