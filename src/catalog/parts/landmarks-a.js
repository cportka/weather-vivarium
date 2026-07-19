/* Landmarks (world set A) — signature silhouettes for famous world cities,
   drawn as tall midground features behind the trees/sign. Like the core set,
   each entry carries a loose-matched `cities` list (lower-case) so the resolver
   only picks one when a place actually has a known landmark, plus `biomes` that
   suit where the city sits. Authored facing right / symmetric; the compositor
   mirrors as needed. Colours pass through env.col() so they dim at night, while
   genuine light sources (aircraft beacons, lit clock faces) stay bright. */

export default [
  {
    id: "eiffel", name: "Eiffel Tower", cities: ["paris"], biomes: ["city", "plains"],
    tags: ["tower", "iron", "lattice", "landmark"],
    w: 14, h: 31, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var iron = env.col("#6f5f4a"), dk = env.col("#4f4235"), lit = env.col("#8a765a");
      var cx = x + 7, H = 29;
      // curved A-frame legs sweeping up to a point
      for (var y = 0; y <= H; y++) {
        var t = y / H;
        var hw = Math.round(6 * (1 - t) * (1 - t));
        P.px(cx - hw, yb - y, iron);
        P.px(cx + hw, yb - y, iron);
        // fill the narrow converging top third solid so it reads as a mast
        if (hw <= 1) P.rect(cx - 1, yb - y, 3 - (hw ? 0 : 1), 1, lit);
      }
      // base arch between the legs
      P.line(cx - 6, yb - 5, cx, yb - 8, iron);
      P.line(cx + 6, yb - 5, cx, yb - 8, iron);
      // observation decks
      P.rect(cx - 5, yb - 8, 11, 1, dk);
      P.rect(cx - 3, yb - 18, 7, 1, dk);
      // beacon at the summit (light source — undimmed)
      P.px(cx, yb - 30, env.night ? "#ff6a6a" : env.col("#c9c2b0"));
      if (env.night && ((env.frame >> 2) & 1)) P.px(cx, yb - 29, "#fff2b0");
    }
  },
  {
    id: "big-ben", name: "Big Ben", cities: ["london"], biomes: ["city"],
    tags: ["tower", "clock", "gothic", "landmark"],
    w: 8, h: 30, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var stone = env.col("#c9a86a"), dk = env.col("#a5854a"), cop = env.col("#3f8a6a");
      P.rect(x + 1, yb - 24, 6, 24, stone);            // tower shaft
      P.rect(x + 1, yb - 13, 6, 1, dk);                // string course
      P.rect(x + 2, yb - 23, 4, 3, env.col("#3a3320")); // belfry openings
      // lit clock face near the top
      var face = (env.night || env.dayT < 0.4) ? "#fff2b0" : env.col("#efe7cf");
      P.disc(x + 4, yb - 16, 2, face);
      P.px(x + 4, yb - 16, env.col("#2a2418"));        // hub
      P.px(x + 4, yb - 17, env.col("#2a2418"));        // hour hand
      P.px(x + 5, yb - 16, env.col("#2a2418"));        // minute hand
      // pointed copper spire
      P.rect(x + 2, yb - 27, 4, 3, cop);
      P.px(x + 3, yb - 28, cop); P.px(x + 4, yb - 28, cop);
      P.px(x + 3, yb - 29, cop);
      P.px(x + 3, yb - 30, env.col("#d4b24a"));        // gilt finial
    }
  },
  {
    id: "opera-house", name: "Sydney Opera House", cities: ["sydney"], biomes: ["coast", "city"],
    tags: ["sails", "modern", "waterfront", "landmark"],
    w: 21, h: 14, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var sail = env.col("#f2f5f7"), rim = env.col("#c4ced4"), base = env.col("#9aa2a8");
      P.rect(x, yb - 2, 21, 2, base);                  // podium
      P.rect(x, yb - 1, 21, 1, env.col("#828a90"));    // waterline shadow
      // Each shell is a quarter-ellipse: a straight tall back edge on the right,
      // its leading edge curving down to the left — the sails all lean the same
      // way. Drawn back (short) to front (tall) so they overlap like the real roof.
      function shell(sx, sw, maxH) {
        for (var i = 0; i < sw; i++) {
          var f = (sw - 1 - i) / sw;                   // 0 at the tall right edge → 1 at the left tip
          var hh = Math.round(maxH * Math.sqrt(Math.max(0, 1 - f * f)));
          if (hh < 1) hh = 1;
          var top = yb - 2 - hh;
          P.rect(sx + i, top, 1, hh, sail);
          P.px(sx + i, top, rim);                      // curved leading rim
        }
        P.rect(sx + sw - 1, yb - 2 - maxH, 1, maxH, rim); // straight back spine
      }
      shell(x + 0, 6, 5);                              // small trailing sail (left pod)
      shell(x + 3, 8, 11);                             // tall main sail
      shell(x + 10, 5, 4);                             // small trailing sail (right pod)
      shell(x + 12, 8, 9);                             // second tall sail
    }
  },
  {
    id: "christ-redeemer", name: "Christ the Redeemer", cities: ["rio de janeiro", "rio"], biomes: ["city", "coast", "mountain"],
    tags: ["statue", "hill", "arms-out", "landmark"],
    w: 14, h: 20, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var hill = env.col("#3f6a3a"), stone = env.col("#c8ccce"), dk = env.col("#9aa0a4");
      // green hilltop
      for (var i = 0; i < 14; i++) {
        var hh = Math.round(4 - Math.abs(i - 7) * 0.4);
        if (hh < 1) hh = 1;
        P.rect(x + i, yb - hh, 1, hh, hill);
      }
      P.rect(x + 5, yb - 8, 4, 4, dk);                 // pedestal
      P.rect(x + 6, yb - 18, 2, 10, stone);            // robed body
      P.rect(x + 2, yb - 15, 10, 1, stone);            // outstretched arms
      P.px(x + 2, yb - 14, dk); P.px(x + 11, yb - 14, dk); // sleeve drape
      P.px(x + 6, yb - 19, stone); P.px(x + 7, yb - 19, stone); // head
    }
  },
  {
    id: "mount-fuji", name: "Mount Fuji", cities: ["shizuoka", "fuji", "hakone", "gotemba"], biomes: ["mountain", "coast", "forest"],
    tags: ["mountain", "volcano", "snow", "landmark"],
    w: 28, h: 16, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var rock = env.col("#5b6b86"), snow = env.col("#eef4f8"), dk = env.col("#47566e");
      for (var i = 0; i < 28; i++) {
        var hh = Math.round(15 - Math.abs(i - 14) * 1.0);
        if (hh < 1) hh = 1;
        P.rect(x + i, yb - hh, 1, hh, (i & 3) === 0 ? dk : rock);
        // jagged snow cap draping the summit flanks
        var depth = hh - 8;
        if (depth > 0) {
          var jag = ((i * 7) % 5 === 0) ? 1 : 0;
          for (var s = 0; s < depth - jag; s++) P.px(x + i, yb - hh + s, snow);
        }
      }
    }
  },
  {
    id: "golden-gate", name: "Golden Gate Bridge", cities: ["san francisco"], biomes: ["coast", "city"],
    tags: ["bridge", "suspension", "red", "landmark"],
    w: 26, h: 20, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var red = env.col("#c1442e"), cable = env.col("#8a2f22"), deck = env.col("#7a3226");
      P.rect(x, yb - 4, 26, 1, deck);                  // roadway deck
      // two towers rising from the strait
      P.rect(x + 5, yb - 18, 2, 18, red);
      P.rect(x + 20, yb - 18, 2, 18, red);
      P.rect(x + 5, yb - 12, 2, 1, cable);             // cross braces
      P.rect(x + 20, yb - 12, 2, 1, cable);
      P.rect(x + 5, yb - 8, 2, 1, cable);
      P.rect(x + 20, yb - 8, 2, 1, cable);
      // main suspension cables (catenary swags)
      P.line(x, yb - 6, x + 6, yb - 18, cable);
      P.line(x + 6, yb - 18, x + 13, yb - 9, cable);
      P.line(x + 13, yb - 9, x + 21, yb - 18, cable);
      P.line(x + 21, yb - 18, x + 25, yb - 6, cable);
      // a few hanger ropes down to the deck
      for (var hx = x + 9; hx < x + 18; hx += 3) {
        var d = Math.abs(hx - (x + 13));
        P.line(hx, yb - 4, hx, yb - 9 - d, cable);
      }
    }
  },
  {
    id: "gateway-arch", name: "Gateway Arch", cities: ["st louis"], biomes: ["city", "plains"],
    tags: ["arch", "steel", "monument", "landmark"],
    w: 20, h: 21, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var m = env.col("#b8c0c6"), hi = env.col("#e8eef2");
      for (var i = 0; i < 20; i++) {
        var t = (i - 9.5) / 9.5;                       // -1..1 across the span
        var yy = Math.round(20 * (1 - t * t));         // catenary-ish rise
        P.px(x + i, yb - yy, hi);                      // stainless glint edge
        if (yy > 0) P.px(x + i, yb - yy + 1, m);       // body / thickness
      }
    }
  },
  {
    id: "capitol-dome", name: "Capitol Dome", cities: ["washington", "austin", "denver"], biomes: ["city", "plains"],
    tags: ["dome", "government", "neoclassical", "landmark"],
    w: 18, h: 18, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var stone = env.col("#e4e2da"), dk = env.col("#c2c0b6"), dome = env.col("#eceae2");
      P.rect(x, yb - 7, 18, 8, stone);                 // main block
      for (var c = 0; c < 8; c++) P.rect(x + 2 + c * 2, yb - 6, 1, 6, dk); // colonnade
      P.rect(x, yb - 8, 18, 1, dk);                    // entablature
      P.rect(x + 4, yb - 10, 10, 2, stone);            // attic base
      P.disc(x + 9, yb - 13, 3, dome);                 // dome
      P.rect(x + 6, yb - 11, 6, 2, dk);                // drum band under dome
      P.px(x + 9, yb - 16, dk);                        // lantern
      P.px(x + 9, yb - 17, env.night ? "#ffe58a" : env.col("#f4f4ec")); // finial
    }
  },
  {
    id: "cn-tower", name: "CN Tower", cities: ["toronto"], biomes: ["city"],
    tags: ["tower", "needle", "observation", "landmark"],
    w: 8, h: 32, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var m = env.col("#b8bcc0"), dk = env.col("#8a9096");
      var cx = x + 4;
      // tapered concrete shaft up to the pod
      for (var y = 0; y < 22; y++) {
        var t = y / 22, w = Math.max(1, 3 - Math.round(t * 2));
        P.rect(cx - ((w - 1) >> 1), yb - y, w, 1, m);
      }
      // SkyPod bulge
      P.rect(cx - 2, yb - 23, 5, 3, dk);
      P.rect(cx - 1, yb - 24, 3, 1, m);
      // upper mast + aircraft beacon (light source)
      P.rect(cx, yb - 31, 1, 8, dk);
      P.px(cx, yb - 31, env.night ? "#ff5a5a" : m);
    }
  },
  {
    id: "colosseum", name: "Colosseum", cities: ["rome"], biomes: ["city"],
    tags: ["amphitheatre", "arches", "ruin", "landmark"],
    w: 22, h: 10, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var stone = env.col("#d8c49a"), dk = env.col("#b09a6a"), sh = env.col("#7a6440");
      var W = 22;
      for (var i = 0; i < W; i++) {
        var t = (i - (W - 1) / 2) / ((W - 1) / 2);
        var top = Math.round(9 * (1 - 0.25 * t * t));  // gently domed oval wall
        if (i > W - 5) top = Math.max(3, top - (i - (W - 5)) * 2); // ruined far side
        if (top < 1) top = 1;
        P.rect(x + i, yb - top, 1, top, stone);
        P.px(x + i, yb - top, dk);                     // cornice edge
      }
      // two tiers of arch openings, skipping the collapsed end
      for (var a = 1; a < W - 6; a += 3) {
        P.rect(x + a, yb - 3, 2, 2, sh);
        P.rect(x + a, yb - 6, 2, 2, sh);
      }
    }
  },
  {
    id: "taj-mahal", name: "Taj Mahal", cities: ["agra"], biomes: ["city", "plains", "wetland"],
    tags: ["dome", "marble", "palace", "landmark"],
    w: 22, h: 18, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var white = env.col("#eef0ec"), sh = env.col("#cfd2cc"), dk = env.col("#b6bab2");
      P.rect(x, yb - 2, 22, 2, sh);                    // marble plinth
      // four corner minarets
      P.rect(x + 1, yb - 13, 1, 11, white); P.px(x + 1, yb - 14, dk);
      P.rect(x + 20, yb - 13, 1, 11, white); P.px(x + 20, yb - 14, dk);
      P.rect(x + 4, yb - 11, 1, 9, sh); P.px(x + 4, yb - 12, dk);
      P.rect(x + 17, yb - 11, 1, 9, sh); P.px(x + 17, yb - 12, dk);
      // main mausoleum block
      P.rect(x + 6, yb - 9, 10, 7, white);
      P.rect(x + 9, yb - 8, 4, 6, env.col("#7a8a86")); // great arched iwan
      P.px(x + 10, yb - 9, white); P.px(x + 11, yb - 9, white);
      // drum + bulbous onion dome
      P.rect(x + 9, yb - 11, 4, 2, white);
      P.disc(x + 11, yb - 13, 3, white);
      P.px(x + 8, yb - 12, white); P.px(x + 14, yb - 12, white); // dome shoulders
      P.px(x + 11, yb - 16, white);                    // onion neck
      P.px(x + 11, yb - 17, env.col("#d4b24a"));        // gold finial
    }
  },
  {
    id: "sydney-bridge", name: "Sydney Harbour Bridge", cities: ["sydney"], biomes: ["coast", "city"],
    tags: ["bridge", "arch", "steel", "landmark"],
    w: 28, h: 16, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var steel = env.col("#7a828a"), dk = env.col("#565c62"), pyl = env.col("#c8c2b4");
      P.rect(x, yb - 5, 28, 1, dk);                    // roadway deck
      P.rect(x + 2, yb - 8, 2, 8, pyl);                // stone pylons
      P.rect(x + 23, yb - 8, 2, 8, pyl);
      // the "coathanger" steel arch
      for (var i = 3; i < 25; i++) {
        var t = (i - 14) / 11;
        var yy = Math.round(5 + 9 * (1 - t * t));
        P.px(x + i, yb - yy, steel);
        if (yy > 6) P.px(x + i, yb - yy - 1, dk);      // upper chord thickness
      }
      // vertical hangers from arch down to the deck
      for (var hxi = 5; hxi < 24; hxi += 3) {
        var t2 = (hxi - 14) / 11;
        var yy2 = Math.round(5 + 9 * (1 - t2 * t2));
        if (yy2 > 6) P.line(x + hxi, yb - 5, x + hxi, yb - yy2, steel);
      }
    }
  }
];
