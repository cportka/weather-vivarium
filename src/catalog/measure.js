/* measure.js — robust ground alignment for placed sprites.

   Landmarks were authored by many hands: some draw their lowest pixel exactly on
   the baseline yb, others 1px above it, so a chunk of them floated a pixel over
   the ground ("1px too short"). Rather than hand-normalise every sprite, we
   measure each one's base once — a tiny mock Painter runs the draw and records
   the lowest painted row — and the compositor plants it so that lowest row lands
   exactly on the ground line. Appearance is untouched; only placement is fixed,
   and any future landmark is auto-grounded too. */

function mockPainter() {
  var maxY = -Infinity;
  function mark(y) { if (y > maxY) maxY = y; }
  function span(y0, y1) { mark(y0 > y1 ? y0 : y1); }
  var noop = function () {};
  var P = {
    L: 50,
    px: function (x, y) { mark(y); },
    rect: function (x, y, w, h) { mark(y + (h > 0 ? h - 1 : 0)); },
    line: function (x0, y0, x1, y1) { span(y0, y1); },
    disc: function (x, y, r) { mark(y + r); },
    dband: function (x, y0, w, y1) { span(y0, y1); },
    glyph: noop, text: noop,
    withAlpha: function (a, fn) { fn(); },
    mix: function (a) { return a; }, shade: function (a) { return a; }, tint: function (a) { return a; },
    lerp: function (a) { return a; }, clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    hex: function (a) { return a; }, BAYER: [[0, 0], [0, 0]]
  };
  return { P: P, max: function () { return maxY; } };
}

// A neutral, deterministic env — enough surface that any draw runs to completion.
var ENV = {
  L: 50, horizon: 24, groundTop: 37, roadBot: 46, frame: 0, now: 720, dayT: 1, night: false,
  col: function (c) { return c; }, rng: function () { return 0.5; }, dir: 1,
  wind: 0.3, code: 0, cloud: 20, aqi: 40, temp: 70, intensity: 0, tide: 0.5, waveM: 0.8
};

/** Rows the entry's lowest pixel sits ABOVE its baseline yb (>= 0). Cached. */
export function groundOffset(entry) {
  if (entry.__groundOff != null) return entry.__groundOff;
  var off = 0, refYb = 40;
  try {
    var m = mockPainter();
    entry.draw(m.P, 8, refYb, ENV);
    var maxY = m.max();
    if (isFinite(maxY)) off = refYb - maxY;
    if (off < 0) off = 0;   // never plant a sprite below the ground line
  } catch (e) { off = 0; }
  entry.__groundOff = off;
  return off;
}
