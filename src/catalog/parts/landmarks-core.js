/* Landmarks — a prominent, recognisable feature for a city, drawn in the
   midground behind the trees/sign. Where the LA scene's "landmark" is really its
   palm, other cities get a signature silhouette: the Statue of Liberty for New
   York, a casino for Las Vegas, the Space Needle for Seattle, and so on. A
   landmark entry adds `cities` (loose-matched names) and/or `landscapes`; the
   resolver picks one only when a place actually has a known landmark. */

export default [
  {
    id: "liberty", name: "Statue of Liberty", cities: ["new york", "jersey city", "newark"], biomes: ["city", "coast"],
    w: 10, h: 26, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var stone = env.col("#5aa08a"), dark = env.col("#3f7a68"), torch = "#ffd24a";
      P.rect(x + 3, yb - 6, 4, 6, env.col("#6a6a70"));      // pedestal
      P.rect(x + 4, yb - 16, 2, 10, stone);                 // robe/body
      P.px(x + 3, yb - 12, dark); P.px(x + 6, yb - 12, dark);
      P.px(x + 4, yb - 17, stone); P.px(x + 5, yb - 17, stone); // head
      for (var s = 0; s < 5; s++) P.px(x + 3 + s, yb - 19 + Math.abs(s - 2), dark); // crown spikes
      P.px(x + 6, yb - 16, stone); P.px(x + 7, yb - 18, stone); P.px(x + 8, yb - 20, stone); // raised arm
      P.px(x + 8, yb - 21, torch); if (!env.night) P.withAlpha(0.4, function () { P.disc(x + 8, yb - 21, 2, torch); });
      else P.withAlpha(0.6, function () { P.disc(x + 8, yb - 21, 2, torch); });
    }
  },
  {
    id: "casino", name: "Casino", cities: ["las vegas", "reno", "atlantic city", "macau", "monte carlo"], biomes: ["desert", "city"],
    pairedSign: "vegas-welcome", w: 16, h: 22, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var neon = P.clamp(1 - env.dayT, 0, 1), f = env.frame || 0;
      var bulbs = ["#ff4a7a", "#ffd24a", "#4affd2", "#8a5aff", "#ff7a3a"];
      function chase(i) { return neon > 0.25 ? bulbs[(i + (f >> 1)) % bulbs.length] : env.col("#6a5a4a"); }
      // tower + a stepped penthouse crown
      P.rect(x, yb - 13, 16, 13, env.col("#332a44"));
      P.rect(x + 4, yb - 17, 8, 4, env.col("#42354f"));
      P.rect(x + 6, yb - 20, 4, 3, env.col("#4a3a5f"));
      // full marquee ring of chasing bulbs around the whole facade
      for (var i = 0; i < 16; i++) { P.px(x + i, yb - 13, chase(i)); P.px(x + i, yb - 1, chase(i + 2)); }
      for (var yy = 0; yy < 12; yy += 2) { P.px(x, yb - 1 - yy, chase(yy)); P.px(x + 15, yb - 1 - yy, chase(yy + 1)); }
      // lit windows glowing gold
      for (var wy = yb - 11; wy < yb - 2; wy += 2) for (var wx = x + 3; wx < x + 14; wx += 3) P.px(wx, wy, neon > 0.3 ? "#ffe58a" : env.col("#5a5240"));
      // a tall vertical marquee sign up the middle (pure celebration, no numbers)
      var vsign = P.mix("#c23a7a", "#ff5aa8", neon);
      P.rect(x + 7, yb - 19, 2, 6, vsign);
      P.px(x + 7, yb - 20, chase(0)); P.px(x + 8, yb - 20, chase(3)); // twin bulbs atop
      // rooftop searchlight sweep + sparkle at night
      if (neon > 0.4) {
        var sweep = Math.round(Math.sin(f * 0.08) * 6);
        P.withAlpha(0.25, function () { P.line(x + 8, yb - 20, x + 8 + sweep, yb - 26, "#fff2b0"); });
        if ((f >> 1) % 3 === 0) P.px(x + 2 + (f % 12), yb - 15, "#ffffff");
      }
    }
  },
  {
    id: "space-needle", name: "Space Needle", cities: ["seattle", "tacoma"], biomes: ["city", "forest"],
    w: 9, h: 24, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var m = env.col("#c9cdd2");
      P.line(x + 3, yb, x + 4, yb - 14, m); P.line(x + 5, yb, x + 4, yb - 14, m); // tapered legs
      P.rect(x + 3, yb - 16, 3, 3, m);                        // shaft to saucer
      P.rect(x, yb - 18, 9, 2, env.col("#9aa0a6"));           // saucer
      P.px(x, yb - 17, m); P.px(x + 8, yb - 17, m);
      P.rect(x + 4, yb - 23, 1, 5, m);                        // spire
      P.px(x + 4, yb - 23, env.night ? "#ff5a5a" : "#e0e0e0"); // beacon
    }
  },
  {
    id: "belltower", name: "Campanile", cities: ["berkeley", "venice", "san marco"], biomes: ["city", "coast", "farmland"],
    w: 6, h: 24, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var stone = env.col("#d8c9a0"), dk = env.col("#b0a078");
      P.rect(x + 1, yb - 20, 4, 20, stone);
      P.rect(x + 1, yb - 20, 4, 1, dk);
      P.rect(x + 1, yb - 14, 4, 3, env.col("#3a3a42"));        // belfry opening
      // clock face
      P.px(x + 2, yb - 17, "#f4efe0"); P.px(x + 3, yb - 17, "#f4efe0");
      // pyramid cap
      P.px(x + 2, yb - 22, dk); P.px(x + 3, yb - 22, dk); P.px(x + 1, yb - 21, dk); P.px(x + 4, yb - 21, dk);
      P.px(x + 2, yb - 23, env.col("#c9a24a")); P.px(x + 3, yb - 23, env.col("#c9a24a"));
    }
  },
  {
    id: "diamond-head", name: "Diamond Head", cities: ["honolulu", "waikiki"], biomes: ["coast"],
    w: 26, h: 12, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var g = env.col("#5a7a44"), d = env.col("#3f5a30");
      // a broad extinct-crater ridge on the horizon
      for (var i = 0; i < 24; i++) {
        var h = Math.round(9 - Math.abs(i - 10) * 0.7 + (i > 14 ? 2 : 0));
        if (h < 1) h = 1;
        P.rect(x + i, yb - h, 1, h, i % 3 === 0 ? d : g);
      }
    }
  },
  {
    id: "snowpeak", name: "Denali", cities: ["anchorage", "denali", "fairbanks", "juneau"], biomes: ["tundra", "mountain", "forest"],
    w: 22, h: 16, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var rock = env.col("#8a97a4"), snow = env.col("#eef4f8");
      for (var i = 0; i < 20; i++) {
        var h = Math.round(14 - Math.abs(i - 9) * 1.2);
        if (h < 1) h = 1;
        var top = yb - h;
        P.rect(x + i, top, 1, h, rock);
        if (h > 6) { P.px(x + i, top, snow); if (h > 9) P.px(x + i, top + 1, snow); }
      }
    }
  },
  {
    id: "artdeco", name: "Art Deco hotel", cities: ["miami", "miami beach", "fort lauderdale"], biomes: ["coast", "city"],
    w: 12, h: 16, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var neon = P.clamp(1 - env.dayT, 0, 1);
      var wall = P.mix("#f2d9c0", "#2a1f3a", neon * 0.7);
      P.rect(x, yb - 14, 12, 14, wall);
      P.rect(x + 4, yb - 17, 4, 3, wall);                     // stepped tower
      var trim = P.mix("#2ab0c2", "#2affe0", neon);
      P.rect(x, yb - 14, 12, 1, trim); P.rect(x, yb - 9, 12, 1, trim); P.rect(x, yb - 4, 12, 1, trim);
      for (var wy = yb - 12; wy < yb - 1; wy += 3) for (var wx = x + 2; wx < x + 10; wx += 3) P.px(wx, wy, neon > 0.3 ? "#ffe58a" : env.col("#8a94a0"));
    }
  },
  {
    id: "monument", name: "Washington Monument", cities: ["washington", "district of columbia"], biomes: ["city", "plains"],
    w: 5, h: 24, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var stone = env.col("#dcdce0");
      for (var y = 0; y < 22; y++) {
        var t = y / 22, w = Math.max(1, Math.round(3 - t * 1.5));
        P.rect(x + 2 - ((w - 1) >> 1), yb - y, w, 1, stone);
      }
      P.px(x + 2, yb - 22, env.col("#f4f4f4"));
      if (env.night) P.px(x + 2, yb - 5, "#ff5a5a");
    }
  },
  {
    id: "riverboat", name: "Riverboat", cities: ["new orleans", "memphis", "st louis", "baton rouge"], biomes: ["wetland", "lake", "coast"],
    w: 16, h: 12, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var hull = env.col("#e8e4d8"), red = env.col("#c23b3b"), trim = env.col("#b08a4a");
      P.rect(x, yb - 4, 16, 4, hull);                          // hull
      P.rect(x + 2, yb - 8, 11, 4, hull);                      // deck house
      P.rect(x + 2, yb - 8, 11, 1, red);
      P.rect(x + 4, yb - 11, 2, 3, env.col("#2a2a30")); P.rect(x + 8, yb - 11, 2, 3, env.col("#2a2a30")); // twin stacks
      P.disc(x + 15, yb - 3, 2, red); P.px(x + 15, yb - 3, trim); // paddlewheel
      P.px(x + 1, yb - 6, red); // flag
    }
  },
  {
    id: "guitar-sign", name: "Neon guitar", cities: ["memphis", "nashville", "austin", "cleveland"], biomes: ["city"],
    w: 8, h: 16, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var neon = P.clamp(1 - env.dayT, 0, 1);
      P.rect(x + 3, yb - 10, 2, 10, env.col("#3a3a42"));       // pole
      var body = P.mix("#b0662a", "#ff9a3a", neon), neck = P.mix("#8a5a2a", "#ffd24a", neon);
      P.disc(x + 4, yb - 13, 2, body);                         // body
      P.rect(x + 4, yb - 16, 1, 3, neck);                      // neck
      if (neon > 0.3) P.withAlpha(0.3 * neon, function () { P.disc(x + 4, yb - 13, 3, "#ff9a3a"); });
    }
  },
  {
    id: "skyscraper", name: "Skyscraper", cities: ["chicago", "toronto", "dallas", "houston", "shanghai"], biomes: ["city"],
    w: 8, h: 26, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var wall = env.col("#4a525e");
      P.rect(x + 1, yb - 24, 6, 24, wall);
      P.rect(x + 2, yb - 26, 4, 2, wall);                      // setback top
      P.rect(x + 3, yb - 28, 2, 2, env.col("#5a626e"));        // antenna base
      P.px(x + 3, yb - 29, env.night ? "#ff5a5a" : "#8a929e");
      for (var wy = yb - 22; wy < yb - 1; wy += 2) for (var wx = x + 2; wx < x + 6; wx += 2) P.px(wx, wy, (env.night || env.dayT < 0.4) && ((wx + wy) & 3) ? "#ffe58a" : env.col("#2f3742"));
    }
  },
  {
    id: "lone-star", name: "Lone Star tower", cities: ["austin", "dallas", "fort worth", "san antonio"], biomes: ["plains", "desert", "farmland", "city"],
    w: 8, h: 18, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var m = env.col("#9098a0");
      P.line(x + 2, yb, x + 4, yb - 12, m); P.line(x + 5, yb, x + 4, yb - 12, m); // legs
      P.rect(x + 2, yb - 15, 5, 3, env.col("#c0c6cc"));        // tank
      var star = env.night ? "#ffe58a" : "#e8c24a";
      P.px(x + 4, yb - 18, star); P.px(x + 3, yb - 17, star); P.px(x + 5, yb - 17, star); P.px(x + 4, yb - 16, star);
    }
  },
  {
    id: "lighthouse", name: "Lighthouse", cities: ["portland maine", "cape may", "montauk"], landscapes: ["north-sea", "pacific-cliffs"], biomes: ["coast"],
    w: 7, h: 20, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var white = env.col("#eae6dc"), red = env.col("#c23b3b");
      for (var y = 0; y < 16; y++) {
        var w = Math.max(2, 4 - Math.floor(y / 6));
        P.rect(x + 3 - ((w - 1) >> 1), yb - y, w, 1, (Math.floor(y / 2) & 1) ? red : white);
      }
      P.rect(x + 2, yb - 18, 3, 2, env.col("#3a3a42"));        // lantern room
      var beam = env.night || env.dayT < 0.4;
      P.px(x + 3, yb - 17, beam ? "#fff2b0" : env.col("#d8d8c0"));
      if (beam) P.withAlpha(0.3, function () { P.rect(x + 4, yb - 18, 6, 1, "#fff2b0"); });
    }
  },
  {
    id: "ferris-wheel", name: "Ferris wheel", cities: ["london eye", "vienna", "yokohama"], biomes: ["city", "coast"],
    w: 16, h: 17, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var m = env.col("#c0c6cc"), cx = x + 8, cy = yb - 9, r = 7;
      P.line(x + 5, yb, cx, cy, m); P.line(x + 11, yb, cx, cy, m); // A-frame
      for (var a = 0; a < 12; a++) {
        var ang = (a / 12) * Math.PI * 2 + env.frame * 0.02;
        var px = Math.round(cx + Math.cos(ang) * r), py = Math.round(cy + Math.sin(ang) * r);
        var lit = (env.night || env.dayT < 0.4);
        P.px(px, py, lit ? ["#ff5a7a", "#ffd24a", "#4affd2"][a % 3] : m);
      }
      P.disc(cx, cy, 1, m);
    }
  },
  {
    id: "windmill", name: "Windmill", cities: ["amsterdam", "rotterdam", "kinderdijk"], biomes: ["farmland", "plains", "wetland"],
    w: 12, h: 16, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var wall = env.col("#8a7050"), cap = env.col("#5a4030");
      P.rect(x + 4, yb - 10, 4, 10, wall);                     // tapered tower body
      P.px(x + 3, yb - 1, wall); P.px(x + 8, yb - 1, wall);
      P.rect(x + 4, yb - 12, 4, 2, cap);                       // cap
      var cx = x + 6, cy = yb - 11, sp = (env.frame * 0.08);
      for (var b = 0; b < 4; b++) {
        var ang = sp + b * Math.PI / 2;
        P.line(cx, cy, Math.round(cx + Math.cos(ang) * 5), Math.round(cy + Math.sin(ang) * 5), env.col("#e8e0cc"));
      }
    }
  },
  {
    id: "pyramid", name: "Pyramids", cities: ["cairo", "giza", "luxor"], landscapes: ["sahara"], biomes: ["desert"],
    w: 22, h: 15, anchor: "baseline",
    draw: function (P, x, yb, env) {
      var lit = env.col("#f0d08a"), shade = env.col("#a06d34"), edge = env.col("#7a5326");
      // two solid triangles: wide base on row yb, converging to an apex on top.
      // Brighter sunlit face + a dark left edge so they read against the dunes.
      for (var p = 0; p < 2; p++) {
        var h = p ? 10 : 13;                      // second pyramid a touch shorter/behind
        var bx = x + p * 10, apex = bx + (h - 1);
        for (var y = 0; y < h; y++) {
          var w = (h - y) * 2 - 1;                // widest at the base, 1px at the top
          var left = apex - ((w - 1) >> 1);
          P.rect(left, yb - y, w, 1, lit);
          var half = w >> 1;
          if (half > 0) P.rect(left + w - half, yb - y, half, 1, shade); // shaded right face
          P.px(left, yb - y, edge);               // crisp left silhouette edge
        }
      }
    }
  }
];
