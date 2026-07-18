// draw.test.mjs — render every catalog entry with a stub Painter (no browser):
// nothing throws, and painted pixels stay roughly inside the canvas. This is the
// CI safety net that catches a sprite with a typo or out-of-box coordinates.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mix, clamp, lerp, hex, shade, tint, BAYER } from "../src/engine/painter.js";
import { CATALOG } from "../src/catalog/index.js";
import { LANDMARKS } from "../src/catalog/landmarks.js";

const L = 50;

function stubPainter() {
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity, drew: false };
  const mark = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("non-finite coord " + x + "," + y);
    bounds.drew = true;
    bounds.minX = Math.min(bounds.minX, x); bounds.maxX = Math.max(bounds.maxX, x);
    bounds.minY = Math.min(bounds.minY, y); bounds.maxY = Math.max(bounds.maxY, y);
  };
  const ctx = { set fillStyle(v) {}, beginPath() {}, arc(cx, cy) { mark(cx, cy); }, fill() {}, fillRect(x, y, w, h) { mark(x, y); mark(x + w, y + h); }, save() {}, restore() {}, translate() {}, scale() {}, clearRect() {} };
  const P = {
    ctx, L,
    px: (x, y) => mark(x, y),
    rect: (x, y, w, h) => { mark(x, y); mark(x + w, y + h); },
    disc: (cx, cy, r) => { mark(cx - r, cy - r); mark(cx + r, cy + r); },
    line: (x0, y0, x1, y1) => { mark(x0, y0); mark(x1, y1); },
    glyph: () => 4,
    text: (s) => (s ? s.length * 4 : 0),
    withAlpha: (a, fn) => fn(),
    alpha: () => {},
    flip: (x, w, fn) => fn(),
    clear: () => {},
    mix, hex, lerp, clamp, shade, tint, BAYER
  };
  return { P, bounds };
}

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
