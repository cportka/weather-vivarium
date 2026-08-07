#!/usr/bin/env node
/* =========================================================================
   replay-cities.mjs — build every city in the database and check what got placed.

   The 52-city reference sheet is how we judge whether scenes look GOOD. It is not
   how we catch a scene that is quietly missing something: placement bugs here are
   silent no-ops — the diorama still renders, it just has no tree in it — and two
   have shipped that way (0.7.0 lost New Orleans' stilt houses, 0.10.0 dropped the
   tree in 71 cities including the one Honolulu's calling card asked for). Neither
   was visible in 52 cities. Both were obvious across all of them.

   So this replays the whole database and asserts the invariants a render can't
   show you:

     * every city that should get a tree gets one (dense metros deliberately get
       none — the guarantee is for everywhere below that)
     * a calling card that names a tree is honoured — the exact 0.10.0 bug
     * nothing — tree, sign or landmark — is placed off the 50x50 canvas
     * nothing throws

   It is deliberately cheap. No canvas, no image files, nothing written to disk:
   a stub Painter records coordinates and throws them away, each city is built and
   stepped exactly one frame with the moving cast switched off, and the whole run
   is a few seconds of CPU and a few megabytes of RSS. Cost scales linearly with
   the database, so growing it stays affordable.

   Usage:
     node scripts/replay-cities.mjs            # every city
     node scripts/replay-cities.mjs --sample 4000
   ========================================================================= */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { decodeCities } from "../src/data/cities.js";
import { resolveScene, placeKey, sceneDensity } from "../src/world/resolve.js";
import { pools } from "../src/catalog/index.js";
import { createScene } from "../src/scene/compositor.js";
import { defaultState } from "../src/data/weather.js";
import { seedFrom } from "../src/engine/random.js";
import { moonIllumination } from "../src/engine/astronomy.js";
import { stubPainter } from "../tests/stub-painter.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const L = 50, GEOMETRY = { L, horizon: 24, groundTop: 37, roadBot: 46 };
const MOON = moonIllumination(2026, 7, 18);

export function loadAllCities() {
  const out = [];
  for (const f of ["us.json", "world.json"]) {
    const p = path.join(ROOT, "data", "cities", f);
    out.push(...decodeCities(JSON.parse(readFileSync(p, "utf8"))));
  }
  return out;
}

/* One city, built exactly as the widget builds it, stepped one frame with the
   moving cast off. Returns what got placed — or the error that stopped it. */
function replayCity(c) {
  const place = {
    name: c.name, country: c.cc || c.country || "", admin1: c.admin || c.state || "",
    latitude: c.lat, longitude: c.lon, timezone: c.tz, population: c.population
  };
  const res = resolveScene(place, {});
  const pool = pools(res.biome.id);
  const W = defaultState();
  const density = sceneDensity(res, c.population);

  // Record every tree/sign/landmark placement and where it landed.
  const placed = { trees: [], signs: [], landmarks: [] };
  const restore = [];
  const watch = (list, bucket) => {
    for (const e of list) {
      const orig = e.draw; restore.push(() => { e.draw = orig; });
      e.draw = function (P, x, yb, env) { placed[bucket].push({ id: e.id, x, w: e.w || 1 }); return orig.call(this, P, x, yb, env); };
    }
  };
  watch(pool.trees, "trees");
  watch(pool.signs, "signs");
  if (res.landmark) watch([res.landmark], "landmarks");

  try {
    const { P } = stubPainter(L);
    createScene(P, {
      geometry: GEOMETRY, biome: res.biome, landscape: res.landscape, landmark: res.landmark,
      latitude: res.latitude, coastal: res.coastal, unit: res.unit, density,
      cannabis: res.cannabis, region: res.region, callingCard: res.callingCard,
      pools: pool, W, sunrise: W.sunrise, sunset: W.sunset, moon: MOON,
      seed: seedFrom(placeKey(place)), place, tempText: () => "72°"
    }, { reduce: true }).render(0, 840, 1);
  } catch (err) {
    return { error: err.message };
  } finally {
    for (const undo of restore) undo();
  }
  // The compositor thins trees out as a place gets denser — a metropolis is meant
  // to be all building and no greenery — so "must have a tree" only holds below
  // that. It plants round(base * (1 - density*0.7)) of them with base >= 1, which
  // is >= 1 for density up to ~0.71; 0.6 keeps us clear of the rounding edge.
  const hasTrees = pool.trees.length > 0 && res.biome.id !== "ocean";
  return {
    placed, biome: res.biome.id, density,
    wantsTree: hasTrees && density <= 0.6,
    wantsCardTree: hasTrees && res.callingCard && res.callingCard.tree &&
      pool.trees.some((t) => t.id === res.callingCard.tree) ? res.callingCard.tree : null
  };
}

/* Check one city against the invariants. Returns a list of complaints (usually empty). */
export function checkCity(c) {
  const r = replayCity(c);
  const where = `${c.name} (${c.cc || c.country || "?"}) [${r.biome || "?"}]`;
  if (r.error) return [`${where}: threw — ${r.error}`];

  const bad = [];
  if (r.wantsTree && r.placed.trees.length === 0) {
    bad.push(`${where}: density ${r.density.toFixed(2)} should get a tree, none was planted`);
  }
  if (r.wantsCardTree && !r.placed.trees.some((t) => t.id === r.wantsCardTree)) {
    bad.push(`${where}: calling card asks for "${r.wantsCardTree}", it was never planted`);
  }
  for (const kind of ["trees", "signs", "landmarks"]) {
    for (const p of r.placed[kind]) {
      if (p.x < 0 || p.x + p.w > L) bad.push(`${where}: ${kind.slice(0, -1)} "${p.id}" placed at x=${p.x} w=${p.w}, off the ${L}px canvas`);
    }
  }
  return bad;
}

function main() {
  const args = process.argv.slice(2);
  const si = args.indexOf("--sample");
  let cities = loadAllCities();
  if (si !== -1) {
    // deterministic stride, so a sampled run still spans the whole database
    const n = parseInt(args[si + 1], 10) || 4000;
    const stride = Math.max(1, Math.floor(cities.length / n));
    cities = cities.filter((_, i) => i % stride === 0);
  }

  const t0 = process.hrtime.bigint();
  const failures = [];
  for (const c of cities) failures.push(...checkCity(c));
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;

  console.log(`Replayed ${cities.length} cities in ${(ms / 1000).toFixed(1)}s ` +
    `(${(ms / cities.length).toFixed(2)} ms/city, peak RSS ${(process.memoryUsage().rss / 1048576).toFixed(0)} MB)`);
  if (failures.length) {
    console.error(`\n${failures.length} problem(s):`);
    for (const f of failures.slice(0, 40)) console.error("  " + f);
    if (failures.length > 40) console.error(`  ...and ${failures.length - 40} more`);
    process.exit(1);
  }
  console.log("Every city placed a tree where its biome has one, and nothing landed off-canvas.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
