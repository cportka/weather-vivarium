/* Signs batch A — more ways to carry the current temperature (env.text). Each is
   baseline-anchored: posts/legs/base plant on row yb, the panel floats above.
   Every entry MUST print env.text via P.text. Painted surfaces are wrapped in
   env.col so they dim at night; genuine light sources (LED digits, marquee bulbs
   that are lit, the gas price display) are left undimmed and brighten as
   neon = 1 - dayT rises. Authored facing right; the engine mirrors. */

export default [
  {
    id: "led-matrix", name: "LED matrix board", biomes: ["city", "coast"],
    tags: ["sign", "led", "digital"], w: 20, h: 16, anchor: "baseline", rarity: 1,
    draw: function (P, x, yb, env) {
      var w = 20, bh = 11, top = yb - 16, by = top + bh;
      var neon = P.clamp(1 - (env.dayT || 0), 0, 1);
      var post = env.col("#3a3d44");
      P.rect(x + 3, by, 2, yb - by, post);
      P.rect(x + w - 5, by, 2, yb - by, post);
      P.rect(x, top, w, bh, env.col("#26282c"));            // casing
      P.rect(x + 1, top + 1, w - 2, bh - 2, "#0a0e0a");     // dark matrix field (screen)
      P.withAlpha(0.3, function () {                        // faint off-dot grid
        for (var gy = top + 3; gy < by - 2; gy += 2)
          for (var gx = x + 3; gx < x + w - 3; gx += 2) P.px(gx, gy, "#123016");
      });
      var lit = P.mix("#8fe14a", "#d0ff5a", neon);          // green LEDs (undimmed)
      var s = env.text || "--", wpx = s.length * 4 - 1;
      var tx = x + Math.round((w - wpx) / 2), ty = top + Math.round((bh - 5) / 2);
      P.text(s, tx, ty, lit);
      if (neon > 0.3) P.withAlpha(0.18 * neon, function () { P.rect(x + 1, top + 1, w - 2, bh - 2, "#8fe14a"); });
    }
  },
  {
    id: "marquee", name: "Theatre marquee", biomes: ["city", "coast"],
    tags: ["sign", "marquee", "bulbs"], w: 21, h: 15, anchor: "baseline", rarity: 1,
    draw: function (P, x, yb, env) {
      var w = 21, ph = 12, top = yb - 15, by = top + ph;
      var neon = P.clamp(1 - (env.dayT || 0), 0, 1), f = (env.frame || 0) >> 2;
      var post = env.col("#5a4a52");
      P.rect(x + 3, by, 2, yb - by, post);
      P.rect(x + w - 5, by, 2, yb - by, post);
      P.rect(x, top, w, ph, P.mix("#c23a3a", "#3a1420", neon));            // red frame
      P.rect(x + 2, top + 2, w - 4, ph - 4, P.mix("#f6e7c8", "#241826", neon)); // panel
      var s = env.text || "--", wpx = s.length * 4 - 1;
      var tx = x + Math.round((w - wpx) / 2), ty = top + Math.round((ph - 5) / 2);
      P.text(s, tx, ty, P.mix("#7a2a1a", "#ffd24a", neon));
      var bulbOn = P.mix("#c9a24a", "#fff2a6", neon), bulbOff = P.mix("#a58c50", "#5a4620", neon);
      var i = 0;
      function bulb(bx2, by2) {
        var on = ((i++ + f) % 3) === 0;
        P.px(bx2, by2, on ? bulbOn : bulbOff);
        if (on && neon > 0.4) P.withAlpha(0.4 * neon, function () { P.px(bx2, by2, "#fff2a6"); });
      }
      for (var bx = x; bx < x + w; bx += 2) { bulb(bx, top); bulb(bx, top + ph - 1); }
      for (var yy = top + 2; yy < top + ph - 2; yy += 2) { bulb(x, yy); bulb(x + w - 1, yy); }
    }
  },
  {
    id: "mural-wall", name: "Graffiti mural wall", biomes: ["city", "coast"],
    tags: ["sign", "mural", "graffiti"], w: 22, h: 14, anchor: "baseline", rarity: 1,
    draw: function (P, x, yb, env) {
      var w = 22, h = 14, top = yb - h;
      var rng = env.rng || function () { return 0.5; };
      var wall = env.col("#c2bcae"), cap = env.col("#d8d2c4"), base = env.col("#9a9486");
      P.rect(x, top, w, h, wall);
      P.rect(x, top, w, 1, cap);                 // top cap
      P.rect(x, yb - 2, w, 2, base);             // grimy base
      P.withAlpha(0.35, function () {            // mortar seams
        P.line(x, top + 6, x + w - 1, top + 6, "#8c8678");
        P.line(x + 10, top + 6, x + 10, yb - 2, "#8c8678");
      });
      P.disc(x + 6, top + 6, 4, env.col("#38a0c8"));   // paint splash
      P.disc(x + 15, top + 8, 3, env.col("#e0c23a"));
      P.rect(x + 5, top + 9, 1, 3, env.col("#38a0c8"));  // drips
      P.rect(x + 16, top + 10, 1, 2, env.col("#e0c23a"));
      P.withAlpha(0.5, function () {              // spray speckle
        for (var i = 0; i < 8; i++) {
          var sx = x + 1 + Math.floor(rng() * (w - 2)), sy = top + 2 + Math.floor(rng() * (h - 4));
          P.px(sx, sy, "#e0483a");
        }
      });
      var s = env.text || "--", wpx = s.length * 4 - 1;
      var tx = x + Math.round((w - wpx) / 2), ty = top + Math.round((h - 5) / 2);
      P.text(s, tx + 1, ty + 1, env.col("#20242c"));   // shadow
      P.text(s, tx, ty, env.col("#ec3a2f"));           // spray-paint number
    }
  },
  {
    id: "milestone", name: "Milestone marker", biomes: ["plains", "forest", "mountain", "farmland", "savanna", "canyon"],
    tags: ["sign", "stone", "path"], w: 15, h: 12, anchor: "baseline", rarity: 1,
    draw: function (P, x, yb, env) {
      var top = yb - 12;
      var stone = env.col("#dcd6c6"), cap = env.col("#c23a2a"), sh = env.col("#b0a890");
      P.disc(x + 7, top + 5, 5, cap);            // painted rounded dome
      P.rect(x + 2, top + 6, 11, 6, stone);       // pale body
      P.rect(x + 11, top + 6, 1, 6, sh);          // right shade
      var s = env.text || "--", wpx = s.length * 4 - 1;
      var tx = (x + 2) + Math.round((11 - wpx) / 2), ty = top + 6;
      P.text(s, tx, ty, env.col("#3a2e1e"));
    }
  },
  {
    id: "flag-banner", name: "Flag banner", biomes: ["coast", "city", "plains", "savanna", "farmland"],
    tags: ["sign", "flag", "cloth"], w: 18, h: 18, anchor: "baseline", rarity: 1,
    draw: function (P, x, yb, env) {
      var h = 18, top = yb - h;
      var pole = env.col("#9298a0");
      P.rect(x + 1, top, 2, h, pole);            // pole
      P.px(x + 1, top, env.col("#c8b24a")); P.px(x + 2, top, env.col("#c8b24a")); // gold finial
      var wind = P.clamp(env.wind || 0, 0, 1), frame = env.frame || 0;
      var fTop = top + 2, fH = 9, fx = x + 3, fw = 14;
      var cloth = env.col("#3a78c0"), stripe = env.col("#eaf0f6");
      for (var c = 0; c < fw; c++) {
        var amp = (wind * 1.5 + 0.5) * (c / fw);
        var wave = Math.round(Math.sin(frame * (0.08 + wind * 0.06) + c * 0.6) * amp);
        for (var r = 0; r < fH; r++) {
          P.px(fx + c, fTop + r + wave, (r < 1 || r >= fH - 1) ? stripe : cloth);
        }
      }
      var s = env.text || "--", wpx = s.length * 4 - 1;
      var tx = fx + Math.round((fw - wpx) / 2), ty = fTop + Math.round((fH - 5) / 2);
      P.text(s, tx, ty, env.col("#f4f8ff"));
    }
  },
  {
    id: "sandwich-board", name: "A-frame sandwich board", biomes: ["city", "coast"],
    tags: ["sign", "chalkboard", "a-frame"], w: 16, h: 12, anchor: "baseline", rarity: 1,
    draw: function (P, x, yb, env) {
      var top = yb - 12;
      var frame = env.col("#6a4a2a"), board = env.col("#2c322c"), foot = env.col("#3a2a18");
      P.line(x + 11, top + 1, x + 15, yb, env.col("#5a3a22"));  // back kickstand leg
      P.rect(x, top, 13, 10, frame);                            // frame
      P.rect(x + 1, top + 1, 11, 8, board);                     // chalk surface
      P.rect(x, yb - 1, 13, 1, foot);                           // feet
      var s = env.text || "--", wpx = s.length * 4 - 1;
      var tx = Math.max(x, (x + 1) + Math.round((11 - wpx) / 2)), ty = top + 3;
      P.text(s, tx, ty, env.night ? "#e6efdc" : "#f4f8ec");     // chalk
      P.withAlpha(0.7, function () { P.line(x + 2, top + 8, x + 10, top + 8, "#c8d2bc"); }); // chalk underline
    }
  },
  {
    id: "gas-price", name: "Fuel price totem", biomes: ["city", "plains", "desert", "farmland", "coast", "savanna"],
    tags: ["sign", "fuel", "price"], w: 15, h: 20, anchor: "baseline", rarity: 1,
    draw: function (P, x, yb, env) {
      var h = 20, top = yb - h, pw = 14, ph = 12;
      var neon = P.clamp(1 - (env.dayT || 0), 0, 1);
      var pole = env.col("#b0b6be"), poleSh = env.col("#8a9098"), poleX = x + 6;
      P.rect(poleX, yb - 8, 3, 8, pole);
      P.rect(poleX, yb - 8, 1, 8, poleSh);
      P.rect(x + 4, yb - 1, 6, 2, env.col("#5a6068"));          // base
      P.rect(x, top, pw, ph, env.col("#d43a2a"));               // brand box
      P.rect(x, top, pw, 3, env.col("#f2c23a"));                // header stripe
      P.rect(x + 1, top + 4, pw - 2, 7, "#101410");             // price display
      var lit = P.mix("#e8542f", "#ff7a3a", neon);              // amber price digits (undimmed)
      var s = env.text || "--", wpx = s.length * 4 - 1;
      var tx = x + Math.round((pw - wpx) / 2), ty = top + 4 + Math.round((7 - 5) / 2) + 1;
      P.text(s, tx, ty, lit);
      if (neon > 0.3) P.withAlpha(0.15 * neon, function () { P.rect(x + 1, top + 4, pw - 2, 7, "#ff7a3a"); });
    }
  }
];
