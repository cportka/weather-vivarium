#!/usr/bin/env node
/* =========================================================================
   page-controls.mjs — do the controls on verify.html actually do anything?

   The unit suite can prove dayFactor() is correct and the widget asks for the
   right hour. It cannot prove the page WIRED those together — and that's exactly
   where the day/night and live toggles broke: the widget claimed `timezone: UTC`
   for a place given as bare coordinates, Open-Meteo dutifully returned Los
   Angeles's sunrise and sunset as UTC wall-clock times (13:05 and 02:55), sunset
   landed before sunrise, and dayFactor answered 0 for every minute of the day.
   Every scene was permanently night and neither toggle could move it. Nothing
   threw; nothing logged; the page just quietly stopped responding.

   So this drives the real page in a real browser with Open-Meteo stubbed out, and
   checks the only thing that matters: pressing the toggle changes what you see.

   Usage: node verify/page-controls.mjs
   ========================================================================= */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launchChromium } from "./browser.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".png": "image/png", ".css": "text/css" };

// What Open-Meteo returns for Los Angeles when asked with timezone=auto: the zone
// it resolved, and sunrise/sunset as wall-clock times IN that zone.
const LA_FORECAST = {
  timezone: "America/Los_Angeles",
  current: { temperature_2m: 75, weather_code: 1, cloud_cover: 20, wind_speed_10m: 8, is_day: 1 },
  daily: { sunrise: ["2026-08-06T06:05"], sunset: ["2026-08-06T19:55"] }
};

function serve(port) {
  const server = http.createServer((rq, rs) => {
    const p = path.join(ROOT, decodeURIComponent(rq.url.split("?")[0]));
    if (!p.startsWith(ROOT)) { rs.writeHead(403); return rs.end(); }
    fs.readFile(p, (e, d) => {
      if (e) { rs.writeHead(404); return rs.end("nf"); }
      rs.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
      rs.end(d);
    });
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

async function main() {
  const PORT = 8123;
  const server = await serve(PORT);
  const browser = await launchChromium();
  const page = await browser.newPage();
  const problems = [];

  await page.route("**://api.open-meteo.com/**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(LA_FORECAST) }));
  await page.route("**://marine-api.open-meteo.com/**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: '{"current":{"wave_height":0.9}}' }));
  await page.route("**://air-quality-api.open-meteo.com/**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: '{"current":{"us_aqi":42}}' }));

  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  await page.goto(`http://localhost:${PORT}/verify.html`);
  await page.waitForFunction("document.querySelector('#mount canvas')!==null", { timeout: 20000 });

  // Mean luminance of the sky half of the diorama: bright = day, dark = night.
  const skyLuma = () => page.evaluate(() => {
    const c = document.querySelector("#mount canvas");
    const d = c.getContext("2d").getImageData(0, 0, c.width, Math.floor(c.height / 2)).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    return Math.round(s / (d.length / 4));
  });
  const settle = (ms) => page.evaluate((m) => new Promise((r) => setTimeout(r, m)), ms);

  await settle(1500);
  const dayLuma = await skyLuma();
  await page.click("#tod"); await settle(1500);
  const nightLuma = await skyLuma();
  await page.click("#tod"); await settle(1500);
  const backLuma = await skyLuma();

  console.log(`day sky ${dayLuma} · night sky ${nightLuma} · back to day ${backLuma}`);

  if (!(dayLuma - nightLuma > 40)) {
    problems.push(`the day/night toggle didn't change the scene (day sky ${dayLuma}, night sky ${nightLuma})`);
  }
  if (Math.abs(backLuma - dayLuma) > 25) {
    problems.push(`toggling back didn't restore the day scene (${dayLuma} → ${backLuma})`);
  }

  // The live toggle re-creates the widget on the city's real clock; the least it
  // must do is take effect without throwing and leave a scene on the canvas.
  await page.click("#live"); await settle(1500);
  const live = await page.evaluate(() => document.getElementById("live").classList.contains("on"));
  const liveLuma = await skyLuma();
  if (!live) problems.push("the live toggle didn't turn on");
  if (!(liveLuma > 0)) problems.push("the scene went blank with live weather on");
  console.log(`live weather on: ${live}, sky ${liveLuma}`);

  if (pageErrors.length) problems.push("page errors: " + pageErrors.slice(0, 3).join(" | "));

  await browser.close();
  server.close();

  if (problems.length) {
    console.error("\nverify.html controls are broken:");
    for (const p of problems) console.error("  " + p);
    process.exit(1);
  }
  console.log("verify.html controls work: day/night flips the scene and live takes effect.");
}

main().catch((e) => { console.error(e); process.exit(1); });
