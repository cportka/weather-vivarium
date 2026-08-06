// draw.test.mjs — render every catalog entry with a stub Painter (no browser):
// nothing throws, and painted pixels stay roughly inside the canvas. This is the
// CI safety net that catches a sprite with a typo or out-of-box coordinates.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mix } from "../src/engine/painter.js";
import { CATALOG } from "../src/catalog/index.js";
import { LANDMARKS } from "../src/catalog/landmarks.js";
import { stubPainter } from "./stub-painter.mjs";

const L = 50;

function env(night) {
  return {
    L, horizon: 24, groundTop: 37, roadBot: 46,
    frame: night ? 40 : 3, now: night ? 90 : 720, dayT: night ? 0.05 : 1, night,
    col: night ? (c) => mix(c, "#20202c", 0.55) : (c) => c,
    rng: () => 0.42, wind: 0.5, dir: 1,
    code: night ? 0 : 61, cloud: 40, aqi: 60, temp: night ? 58 : 82,
    waveM: 1.1, tide: 0.6, sunrise: 380, sunset: 1180, sky: undefined,
    cold: false, latitude: 34, intensity: 0.5, rough: false, text: "72°"
  };
}

const ALL = { ...CATALOG, landmarks: LANDMARKS };

for (const [cat, list] of Object.entries(ALL)) {
  test(`${cat}: every entry draws without throwing (day + night)`, () => {
    for (const e of list) {
      for (const night of [false, true]) {
        const { P, bounds } = stubPainter();
        const anchor = e.anchor || "baseline";
        const x = anchor === "center" ? 25 : 4;
        const yb = anchor === "center" ? 25 : 40;
        assert.doesNotThrow(() => e.draw(P, x, yb, env(night)), `${cat}/${e.id} (${night ? "night" : "day"}) threw`);
        if (bounds.drew) {
          assert.ok(bounds.minX >= -10 && bounds.maxX <= L + 12, `${cat}/${e.id} x out of bounds [${bounds.minX},${bounds.maxX}]`);
          assert.ok(bounds.minY >= -12 && bounds.maxY <= L + 12, `${cat}/${e.id} y out of bounds [${bounds.minY},${bounds.maxY}]`);
        }
      }
    }
  });
}

// A stroller that stops (the beachgoer on her towel) paints through restDraw and
// restPoses, which the loop above never reaches — cover them too, and hold them to
// the restW footprint the compositor uses to keep them clear of the sign.
test("resting poses draw without throwing and stay inside restW", () => {
  for (const e of CATALOG.people) {
    if (!e.restDraw) continue;
    assert.ok(e.restW > 0, `people/${e.id} has a restDraw but no restW`);
    const poses = [e.restDraw].concat(e.restPoses || []);
    for (const pose of poses) {
      for (const night of [false, true]) {
        const { P, bounds } = stubPainter();
        assert.doesNotThrow(() => pose(P, 12, 40, env(night)), `people/${e.id} rest pose threw`);
        assert.ok(bounds.drew, `people/${e.id} rest pose painted nothing`);
        // poses are authored around x, and may spill one column left (hair on the towel)
        assert.ok(bounds.minX >= 11 && bounds.maxX <= 12 + e.restW - 1,
          `people/${e.id} rest pose spans [${bounds.minX},${bounds.maxX}], wider than restW ${e.restW}`);
      }
    }
  }
});
