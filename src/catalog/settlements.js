/* =========================================================================
   settlements.js — how a place is BUILT, by biome + density.

   The compositor's urbanLayer draws two things: a restrained, hazy *distant
   skyline* (the wider city behind) and a *local settlement* in the foreground.
   The local settlement's architecture is a biome-appropriate STYLE from here —
   a swamp gets stilt shacks, a desert gets low adobe, a mountain gets chalets,
   a jungle hillside gets stacked favela boxes — and density only decides how
   many buildings and how tall (capped per style, so nowhere turns into glass
   towers unless it's actually a dense city).

   A style:
     heights: [town, city, metro]  — max building height (px) at each density tier
     maxCoverage                   — most of the ground it ever covers (<1 → nature always shows)
     width(rng)                    — a building's width
     building(P, x, w, h, env, lit, rng)  — draw ONE building, standing on env.groundTop-1
   ========================================================================= */
import { mix } from "../engine/painter.js";
import stylesA from "./parts/settlements-a.js";
import stylesB from "./parts/settlements-b.js";

function baseRow(env) { return env.groundTop - 1; }
function lights(P, x, top, w, h, lit, rng, on, off) {
  for (var wy = top + 1; wy < top + h - 1; wy += 2)
    for (var wx = x + 1; wx < x + w - 1; wx += 2) P.px(wx, wy, (lit && rng() < 0.5) ? on : off);
}
function w3(rng) { return 3 + Math.floor(rng() * 3); }
function w4(rng) { return 4 + Math.floor(rng() * 4); }

export var STYLES = {
  // Glass/steel towers — only real dense cities (city biome).
  towers: {
    id: "towers", name: "Towers", heights: [6, 12, 24], maxCoverage: 0.5, width: function (rng) { return 4 + Math.floor(rng() * 4); },
    building: function (P, x, w, h, env, lit, rng) {
      var b = baseRow(env), top = b - h + 1, wall = env.col(mix("#39424f", "#505b6a", rng()));
      P.rect(x, top, w, h, wall); P.rect(x, top, w, 1, mix(wall, "#000000", 0.25));
      lights(P, x, top, w, h, lit, rng, "#ffe58a", mix(wall, "#000000", 0.3));
      if (rng() < 0.4) P.px(x + (w >> 1), top - 1, env.night ? "#ff5a5a" : wall);      // antenna
    }
  },
  // Concrete/brick mid-rise — harbour and mixed cities.
  midrise: {
    id: "midrise", name: "Mid-rise", heights: [4, 8, 14], maxCoverage: 0.5, width: w4,
    building: function (P, x, w, h, env, lit, rng) {
      var b = baseRow(env), top = b - h + 1, wall = env.col(mix("#7a6f62", "#9a8f7e", rng()));
      P.rect(x, top, w, h, wall); P.rect(x, top, w, 1, mix(wall, "#000000", 0.2));
      lights(P, x, top, w, h, lit, rng, "#ffe0a0", env.col("#4a4238"));
      if (rng() < 0.5) P.rect(x + 1, top - 1, 2, 1, env.col("#5a5248"));                // rooftop tank
    }
  },
  // Small townhouses / shops with awnings.
  lowrise: {
    id: "lowrise", name: "Low-rise town", heights: [3, 5, 8], maxCoverage: 0.46, width: w3,
    building: function (P, x, w, h, env, lit, rng) {
      var b = baseRow(env), top = b - h + 1;
      var wall = env.col(["#b06a4a", "#8a9a6a", "#6a8aa0", "#c0a060", "#9a6a8a"][Math.floor(rng() * 5)]);
      P.rect(x, top, w, h, wall);
      P.rect(x, top, w, 1, env.col("#3a3230"));                                          // eaves
      P.rect(x, b, w, 1, env.col("#5a4a3a"));                                            // shopfront/awning
      P.px(x + (w >> 1), b - 1, lit ? "#ffe0a0" : env.col("#3a3630"));                   // lit window/door
    }
  },
  // Red barn + silo farmstead.
  farmstead: {
    id: "farmstead", name: "Farmstead", heights: [3, 4, 6], maxCoverage: 0.3, width: function (rng) { return 4 + Math.floor(rng() * 3); },
    building: function (P, x, w, h, env, lit, rng) {
      var b = baseRow(env), top = b - h + 1;
      if (rng() < 0.4) { // silo
        var sw = 2, sx = x + ((w - sw) >> 1);
        P.rect(sx, top, sw, h, env.col("#c9c2b0")); P.px(sx, top, env.col("#8a8478")); P.px(sx + 1, top, env.col("#8a8478"));
      } else {           // barn
        P.rect(x, top + 1, w, h - 1, env.col("#a83a2a"));
        for (var i = 0; i < w; i++) P.px(x + i, top, env.col(i === (w >> 1) ? "#c9c2b0" : "#8a2f22")); // ridge
        P.rect(x + (w >> 1) - 1, b - 1, 2, 1, env.col("#e0d8c0"));                       // hay door
      }
    }
  },
  // Round thatched huts (savanna village).
  roundhut: {
    id: "roundhut", name: "Village", heights: [3, 4, 5], maxCoverage: 0.4, width: function (rng) { return 4; },
    building: function (P, x, w, h, env, lit, rng) {
      var b = baseRow(env), wall = env.col("#a9764a"), roof = env.col("#8a6a3a");
      P.rect(x + 1, b - 2, 3, 3, wall);                                                  // mud wall
      P.rect(x, b - 3, 5, 1, roof); P.rect(x + 1, b - 4, 3, 1, roof); P.px(x + 2, b - 5, roof); // thatch cone
      P.px(x + 2, b - 1, lit ? "#ffca6a" : env.col("#3a2a1a"));                          // doorway
    }
  },
  // Flat-roof adobe / pueblo blocks.
  adobe: {
    id: "adobe", name: "Adobe", heights: [3, 4, 7], maxCoverage: 0.46, width: w3,
    building: function (P, x, w, h, env, lit, rng) {
      var b = baseRow(env), top = b - h + 1, wall = env.col(mix("#c98f52", "#dcae74", rng()));
      P.rect(x, top, w, h, wall);
      P.rect(x, top, w, 1, mix(wall, "#000000", 0.18));                                  // parapet
      for (var wy = top + 2; wy < b; wy += 2) P.px(x + 1 + (Math.floor(rng() * (w - 2))), wy, lit ? "#ffca6a" : env.col("#5a3a24"));
      if (rng() < 0.3) P.px(x + w - 1, top - 1, env.col("#8a5a34"));                     // roof beam
    }
  },
  // A-frame chalets with snow roofs + a chimney.
  chalet: {
    id: "chalet", name: "Chalet", heights: [3, 5, 7], maxCoverage: 0.42, width: w4,
    building: function (P, x, w, h, env, lit, rng) {
      var b = baseRow(env), top = b - h + 1, wall = env.col(mix("#6a4a30", "#8a6540", rng())), snow = env.col("#eef2f5");
      P.rect(x, top + 1, w, h - 1, wall);
      for (var i = 0; i < w; i++) { var d = Math.abs(i - (w - 1) / 2); P.px(x + i, top + Math.round(d), snow); } // gable + snow
      P.px(x + w - 1, top - 1, env.col("#5a5560")); if (rng() < 0.5) P.px(x + w - 1, top - 2, env.night ? "#8a8590" : env.col("#7a7580"));
      P.px(x + (w >> 1), b - 1, lit ? "#ffca6a" : env.col("#3a2a1a"));                   // warm window
    }
  },
  // Stilt shacks over marsh/lake.
  stilt: {
    id: "stilt", name: "Stilt houses", heights: [4, 5, 7], maxCoverage: 0.42, width: w4,
    building: function (P, x, w, h, env, lit, rng) {
      var b = baseRow(env), body = Math.max(2, h - 2), top = b - h + 1, wall = env.col(mix("#8a7a5a", "#a99a6a", rng()));
      P.px(x + 1, b, env.col("#5a4a30")); P.px(x + w - 2, b, env.col("#5a4a30")); P.px(x, b - 1, env.col("#5a4a30")); // posts
      P.rect(x, top + 1, w, body, wall);
      for (var i = 0; i < w; i++) P.px(x + i, top, env.col("#6a5a3a"));                  // pitched tin roof
      P.px(x + (w >> 1), top + 2, lit ? "#ffca6a" : env.col("#3a2f1a"));
    }
  },
  // Stacked colourful favela boxes climbing a slope.
  favela: {
    id: "favela", name: "Favela", heights: [4, 6, 10], maxCoverage: 0.55, width: w4,
    building: function (P, x, w, h, env, lit, rng) {
      var b = baseRow(env), palette = ["#c96a4a", "#d0b24a", "#5a9ac0", "#7aa85a", "#c98a5a", "#b06a8a"];
      var yy = b, left = x;
      for (var s = 0; s < 3 && yy > b - h; s++) {
        var bw = 3 + Math.floor(rng() * 2), bh = 2 + Math.floor(rng() * 2);
        var c = env.col(palette[Math.floor(rng() * palette.length)]);
        P.rect(left, yy - bh + 1, bw, bh, c);
        P.px(left + 1, yy - 1, lit && rng() < 0.6 ? "#ffe0a0" : env.col("#2a2420"));
        left += 1 + Math.floor(rng() * 2); yy -= bh - (rng() < 0.5 ? 0 : 1);            // step up the hill
      }
    }
  }
};

// Each biome has one or more candidate styles; a city picks one deterministically
// from its seed, so cities of the same biome vary but any one city is stable.
var BIOME_STYLES = {
  city: ["towers", "midrise"], coast: ["midrise", "lowrise"], ocean: [], mountain: ["chalet"],
  desert: ["adobe"], forest: ["lowrise"], jungle: ["favela"], plains: ["lowrise", "farmstead"],
  tundra: ["chalet"], wetland: ["stilt"], lake: ["stilt", "chalet"], savanna: ["roundhut"],
  canyon: ["adobe"], farmland: ["farmstead", "lowrise"]
};

export function styleForBiome(biomeId, seed) {
  var list = BIOME_STYLES[biomeId];
  if (!list || !list.length) return null;
  return STYLES[list[(seed >>> 0) % list.length]] || null;
}

/** Register a style and add it as a candidate for the given biomes (fan-out). */
export function registerStyle(style, biomes) {
  STYLES[style.id] = style;
  if (biomes) for (var i = 0; i < biomes.length; i++) {
    (BIOME_STYLES[biomes[i]] = BIOME_STYLES[biomes[i]] || []).push(style.id);
  }
}

// Fanned-out world styles: register each as a candidate for its biomes.
[].concat(stylesA, stylesB).forEach(function (s) { registerStyle(s, s.biomes); });

export var STYLE_BIOMES = BIOME_STYLES;
