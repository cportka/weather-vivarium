// walker.test.mjs — the strolling figure, driven through the real compositor.
//
// Placement bugs in this engine are silent no-ops: the scene still renders, it's
// just missing someone. So this drives createScene() over a few hundred frames with
// a stub Painter and instrumented sprites, and asserts what actually got painted:
//
//   * Los Angeles opens with its calling card — the beachgoer by day, the cat after
//     dark — and never the wrong one for the hour.
//   * She lies down through the in-between poses instead of snapping flat, and gets
//     back up the same way.
//   * Wherever she settles, the towel stays clear of the temperature sign.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveScene, sceneDensity } from "../src/world/resolve.js";
import { pools, CATALOG, byLayer } from "../src/catalog/index.js";
import { createScene } from "../src/scene/compositor.js";
import { defaultState } from "../src/data/weather.js";
import { seedFrom } from "../src/engine/random.js";
import { moonIllumination } from "../src/engine/astronomy.js";
import { groundOffset } from "../src/catalog/measure.js";
import { stubPainter } from "./stub-painter.mjs";

const L = 50, GEOMETRY = { L, horizon: 24, groundTop: 37, roadBot: 46 };
const SIGN_X = 29;                                  // must match compositor.js

const UMBRELLA = "#d83a52";                         // drawGear()'s canopy, used nowhere else

/* Build a world exactly as src/scene/widget.js does, then render `frames` of it,
   recording every paint of a person sprite as {id, mode, x, yb}. `seen.colours` is
   every colour the whole scene painted, so gear (drawn by the compositor, not by a
   sprite) can be checked for too. */
function run(place, dayT, frames, over) {
  const res = resolveScene(place, {});
  const W = Object.assign(defaultState(), over || {});
  const pool = pools(res.biome.id);
  const seen = [];
  const wrap = (e, mode, fn) => function (P, x, yb, env) { seen.push({ id: e.id, mode, x, yb }); return fn.call(this, P, x, yb, env); };
  const restore = [];
  for (const e of pool.people) {
    const orig = { draw: e.draw, restDraw: e.restDraw, restPoses: e.restPoses };
    restore.push(() => Object.assign(e, orig));
    e.draw = wrap(e, "walk", orig.draw);
    if (orig.restDraw) e.restDraw = wrap(e, "rest", orig.restDraw);
    if (orig.restPoses) e.restPoses = orig.restPoses.map((p, i) => wrap(e, "pose" + i, p));
  }
  const { P, colours } = stubPainter(L);
  seen.colours = colours;
  try {
    const scene = createScene(P, {
      geometry: GEOMETRY, biome: res.biome, landscape: res.landscape, landmark: res.landmark,
      latitude: res.latitude, coastal: res.coastal, unit: res.unit,
      density: sceneDensity(res, place.population),
      cannabis: res.cannabis, region: res.region, callingCard: res.callingCard,
      pools: pool, W, sunrise: W.sunrise, sunset: W.sunset, moon: moonIllumination(2026, 7, 18),
      seed: seedFrom(place.name + place.latitude), place,
      tempText: () => W.temp + "°"
    }, { reduce: false });
    const now = dayT > 0.5 ? 840 : 60;
    for (let f = 0; f <= frames; f++) scene.render(f, now, dayT);
  } finally {
    for (const undo of restore) undo();
  }
  return seen;
}

const LA = { name: "Los Angeles", country: "United States", admin1: "California",
  latitude: 34.05, longitude: -118.24, timezone: "UTC", elevation: 71, population: 3971883 };

test("Los Angeles leads with the beachgoer by day, and never at night", () => {
  const day = run(LA, 1, 400);
  assert.ok(day.length, "nobody strolled out at all by day");
  assert.equal(day[0].id, "beachgoer", "the day calling card should walk out first");
  assert.ok(!day.some((s) => s.id === "beach-cat"), "the night cat should not be out in daylight");

  const night = run(LA, 0, 400);
  assert.ok(night.length, "nobody strolled out at all at night");
  assert.equal(night[0].id, "beach-cat", "the night calling card should walk out first");
  assert.ok(!night.some((s) => s.id === "beachgoer"),
    "the beachgoer sunbathes in daylight only — she must not appear after dark");
});

test("the beachgoer folds down through her in-between poses and rises the same way", () => {
  const modes = run(LA, 1, 600).filter((s) => s.id === "beachgoer").map((s) => s.mode);
  // collapse runs: walk,walk,pose0,pose0,pose1,... → walk,pose0,pose1,...
  const seq = modes.filter((m, i) => m !== modes[i - 1]);
  assert.deepEqual(seq, ["walk", "pose0", "pose1", "rest", "pose1", "pose0", "walk"],
    `unexpected sunbathe sequence: ${seq.join(" → ")}`);
});

test("the towel is always laid out clear of the temperature sign", () => {
  // every seed lands her somewhere slightly different — check the whole spread
  for (const lat of [34.05, 34.02, 33.99, 34.11, 34.2]) {
    const place = Object.assign({}, LA, { latitude: lat });
    const rests = run(place, 1, 600).filter((s) => s.mode === "rest" || /^pose/.test(s.mode));
    assert.ok(rests.length, `nobody rested at lat ${lat}`);
    for (const r of rests) {
      // poses are authored around x and span restW columns from one left of it
      assert.ok(r.x - 1 >= 0, `towel runs off the left edge at x=${r.x}`);
      assert.ok(r.x + 8 < SIGN_X, `towel at x=${r.x} reaches under the sign at x=${SIGN_X}`);
    }
  }
});

test("weather gear is for people — the cat just hunches and hurries", () => {
  const wetNight = run(LA, 0, 300, { code: 61, temp: 55 });
  assert.ok(wetNight.some((s) => s.id === "beach-cat"), "the cat should still be out in the rain");
  assert.ok(!wetNight.colours.has(UMBRELLA), "the beach cat was handed an umbrella");

  // ...and the control: a person in the same rain does get one
  const wetDay = run(LA, 1, 300, { code: 61, temp: 55 });
  assert.ok(wetDay.colours.has(UMBRELLA), "a person walking in the rain should carry an umbrella");
});

test("ground animals stand on the ground, not a pixel above it", () => {
  // A grounder used to be planted at groundTop-2 while the trees, sign, landmark
  // and strolling figure all used groundTop-1 — so every animal hovered, and the
  // deer and elephant (drawn a pixel short of their own baseline) hovered by two.
  const GROUND = GEOMETRY.groundTop - 1;
  for (const e of byLayer(CATALOG.animals, "ground")) {
    const yb = GROUND + groundOffset(e);
    let deepest = -Infinity;
    // walk the animation: no frame may sink below the ground, and at least one
    // frame has to actually touch it
    for (let frame = 0; frame < 8; frame++) {
      const { P, bounds } = stubPainter(L);
      e.draw(P, 10, yb, {
        L, horizon: 24, groundTop: GEOMETRY.groundTop, roadBot: 46, frame, dayT: 1, night: false,
        col: (c) => c, rng: () => 0.4, dir: 1, wind: 0.3, code: 0, cloud: 20, aqi: 40,
        temp: 70, intensity: 0, tide: 0.5, waveM: 0.8, rough: false, cold: false
      });
      assert.ok(bounds.drew, `animals/${e.id} painted nothing on frame ${frame}`);
      assert.ok(bounds.maxY <= GROUND,
        `animals/${e.id} sinks to row ${bounds.maxY} on frame ${frame}, below the ground line ${GROUND}`);
      if (bounds.maxY > deepest) deepest = bounds.maxY;
    }
    assert.equal(deepest, GROUND,
      `animals/${e.id} never touches the ground — deepest row ${deepest}, ground line ${GROUND}`);
  }
});
