// stub-painter.mjs — a Painter that records where it was asked to paint instead
// of touching a canvas, so the whole scene can be driven under `node --test`
// with no browser. Shared by draw.test.mjs and walker.test.mjs.
import { mix, clamp, lerp, hex, shade, tint, BAYER } from "../src/engine/painter.js";

export function stubPainter(L = 50) {
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity, drew: false };
  const colours = new Set();                 // every colour the scene was asked to paint
  const mark = (x, y, c) => {
    if (typeof c === "string") colours.add(c.toLowerCase());
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("non-finite coord " + x + "," + y);
    bounds.drew = true;
    bounds.minX = Math.min(bounds.minX, x); bounds.maxX = Math.max(bounds.maxX, x);
    bounds.minY = Math.min(bounds.minY, y); bounds.maxY = Math.max(bounds.maxY, y);
  };
  const ctx = {
    set fillStyle(v) {}, beginPath() {}, arc(cx, cy) { mark(cx, cy); }, fill() {},
    fillRect(x, y, w, h) { mark(x, y); mark(x + w, y + h); },
    save() {}, restore() {}, translate() {}, scale() {}, clearRect() {}
  };
  const P = {
    ctx, L,
    px: (x, y, c) => mark(x, y, c),
    rect: (x, y, w, h, c) => { mark(x, y, c); mark(x + w, y + h); },
    disc: (cx, cy, r, c) => { mark(cx - r, cy - r, c); mark(cx + r, cy + r); },
    line: (x0, y0, x1, y1, c) => { mark(x0, y0, c); mark(x1, y1); },
    dband: (x0, y0, x1, y1) => { mark(x0, y0); mark(x1, y1); },
    glyph: () => 4,
    text: (s) => (s ? s.length * 4 : 0),
    withAlpha: (a, fn) => fn(),
    alpha: () => {},
    flip: (x, w, fn) => fn(),
    clear: () => {},
    mix, hex, lerp, clamp, shade, tint, BAYER
  };
  return { P, bounds, colours };
}
