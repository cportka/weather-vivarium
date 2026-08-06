// determinism.test.mjs — a city always looks like itself.
//
// Everything fixed about a scene (which tree grows there, which sign stands by the
// road, how the buildings pack) is drawn from one seed. That seed used to be
// `name + latitude`, so the same city seeded differently depending on which code
// path supplied its coordinates — the packed dataset (34.052), a hand-written
// reference entry (34.05), the browser's geolocation (34.0522…) — and Los Angeles
// grew a different tree on each. The seed now keys on who the place IS.
import { test } from "node:test";
import assert from "node:assert/strict";
import { placeKey, resolveScene } from "../src/world/resolve.js";
import { pools } from "../src/catalog/index.js";
import { createScene } from "../src/scene/compositor.js";
import { defaultState } from "../src/data/weather.js";
import { seedFrom } from "../src/engine/random.js";
import { moonIllumination } from "../src/engine/astronomy.js";
import { groundOffset } from "../src/catalog/measure.js";
import { stubPainter } from "./stub-painter.mjs";

const L = 50, GEOMETRY = { L, horizon: 24, groundTop: 37, roadBot: 46 };

/* The fixed props of a scene: which tree/sign sprites are placed, and where. */
function fixedProps(place) {
  const res = resolveScene(place, {});
  const W = defaultState();
  const pd = Math.min(Math.max((Math.log10(place.population || 1000) - 3.6) / 4.2, 0), 1);
  const pool = pools(res.biome.id);
  const seen = [], restore = [];
  for (const [list, kind] of [[pool.trees, "tree"], [pool.signs, "sign"]]) {
    for (const e of list) {
      // groundOffset() measures a sprite by mock-drawing it once and caching the
      // result; warm it here so that one-off measuring pass isn't mistaken for a
      // placement when we wrap draw below.
      groundOffset(e);
      const orig = e.draw; restore.push(() => { e.draw = orig; });
      e.draw = function (P, x, yb, env) { seen.push(kind + ":" + e.id + "@" + x); return orig.call(this, P, x, yb, env); };
    }
  }
  try {
    const { P } = stubPainter(L);
    createScene(P, {
      geometry: GEOMETRY, biome: res.biome, landscape: res.landscape, landmark: res.landmark,
      latitude: res.latitude, coastal: res.coastal, unit: res.unit,
      density: Math.max(pd, res.biome.id === "city" ? 0.5 : 0),
      cannabis: res.cannabis, region: res.region, callingCard: res.callingCard,
      pools: pool, W, sunrise: W.sunrise, sunset: W.sunset, moon: moonIllumination(2026, 7, 18),
      seed: seedFrom(placeKey(place)), place, tempText: () => "72°"
    }, { reduce: true }).render(0, 840, 1);
  } finally { for (const undo of restore) undo(); }
  return [...new Set(seen)].sort().join(", ") + " | landmark:" + (res.landmark ? res.landmark.id : "none");
}

// The same city as it arrives from each code path that can supply it.
const SAME_PLACE = [
  { name: "Los Angeles", country: "United States", admin1: "California", latitude: 34.05, longitude: -118.24, population: 3971883 },
  { name: "Los Angeles", country: "United States", admin1: "California", latitude: 34.052, longitude: -118.2437, population: 3971883 },
  { name: "Los Angeles", country: "United States", admin1: "California", latitude: 34.0522342, longitude: -118.2436849, population: 3971883 }
];

test("a city's fixed elements do not change with coordinate jitter", () => {
  const rendered = SAME_PLACE.map(fixedProps);
  assert.equal(new Set(rendered).size, 1,
    "the same city rendered different fixed props from different coordinates:\n  " + rendered.join("\n  "));
});

test("the same scene built twice is identical", () => {
  const place = SAME_PLACE[0];
  assert.equal(fixedProps(place), fixedProps(place));
});

test("different cities still get different scenes", () => {
  const berlin = { name: "Berlin", country: "Germany", admin1: "", latitude: 52.52, longitude: 13.4, population: 3644826 };
  assert.notEqual(placeKey(SAME_PLACE[0]), placeKey(berlin));
});

test("placeKey keys on identity, and falls back to a coarse cell when unnamed", () => {
  const a = { name: "Los Angeles", country: "United States", admin1: "California", latitude: 34.05, longitude: -118.24 };
  const b = { name: "los angeles ", country: "United States", admin1: "California", latitude: 34.9, longitude: -118.9 };
  assert.equal(placeKey(a), placeKey(b), "same city, different coordinates → same key");

  // two names that differ only by country must not collide
  assert.notEqual(placeKey({ name: "Springfield", country: "United States" }),
    placeKey({ name: "Springfield", country: "Canada" }));

  // an unnamed fix (raw geolocation) rounds to a ~1° cell so two readings agree
  assert.equal(placeKey({ latitude: 34.0522, longitude: -118.2437 }),
    placeKey({ latitude: 34.0498, longitude: -118.2401 }));
  assert.equal(placeKey({}), "@0,0");
});
