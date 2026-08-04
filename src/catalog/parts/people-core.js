/* Reference people — walking figures, feet on row yb, a two-frame walk cycle on
   env.frame, facing right. Weather gear (umbrella / gas mask / parka hood) is
   drawn over the top by the actor system, so entries only paint the body. The
   beachgoer is ported from the LA widget. env.skin/env.hair can tint an
   individual, but defaults keep each figure distinct. */

export default [
  {
    id: "beachgoer", name: "Beachgoer", biomes: ["coast"],
    tags: ["person", "summer"], w: 4, h: 7, anchor: "baseline", layer: "ground",
    // A beachgoer doesn't just march past: `restDraw` is the sunbathing pose the
    // compositor holds partway across — lying on a towel for a good while, one
    // knee lazily rocking, before getting up and strolling on.
    restW: 7,
    restDraw: function (P, x, yb, env) {
      var skin = "#e8b98f", hair = "#5a3a1e", suit = "#e0445a", towel = env.col("#3aa0c8"), towel2 = env.col("#f0f0e6");
      var slow = (env.frame >> 4) & 1;                      // a slow, drowsy shift
      for (var i = 0; i < 7; i++) P.px(x + i, yb, (i & 1) ? towel : towel2);   // striped towel
      P.px(x + 1, yb - 1, hair); P.px(x + 2, yb - 1, hair);  // head + hair spread
      P.px(x + 3, yb - 1, skin);                             // face
      P.px(x + 4, yb - 1, suit);                             // torso
      P.px(x + 5, yb - 1, skin);                             // hips
      P.px(x + 6, yb - 1, slow ? skin : towel);              // outstretched leg
      if (slow) P.px(x + 6, yb - 2, skin);                   // knee drawn up
      P.px(x + 2, yb - 2, hair);                             // hair on the towel
    },
    draw: function (P, x, yb, env) {
      var skin = "#e8b98f", hair = "#5a3a1e", suit = "#e0445a";
      var step = (env.frame >> 2) & 1;
      P.px(x, yb - 6, hair); P.px(x + 1, yb - 6, hair);
      P.px(x, yb - 5, hair); P.px(x + 1, yb - 5, skin);
      P.px(x, yb - 4, hair); P.px(x + 1, yb - 4, suit);
      P.px(x, yb - 3, hair);
      P.px(x + 1, yb - 3, skin); P.px(x + 2, yb - 3, skin);
      P.px(x + 1, yb - 2, suit);
      P.px(x + 1, yb - 1, skin);
      if (step) { P.px(x + 1, yb, skin); }
      else { P.px(x, yb, skin); P.px(x + 2, yb, skin); }
    }
  },
  {
    id: "stroller", name: "Passer-by", biomes: ["city", "coast", "plains", "farmland", "forest"],
    tags: ["person", "casual"], w: 4, h: 7, anchor: "baseline", layer: "ground",
    draw: function (P, x, yb, env) {
      var skin = "#d7a26a", coat = env.col("#3a63b8"), pants = env.col("#2a2f3a");
      var step = (env.frame >> 2) & 1;
      P.px(x + 1, yb - 6, "#3a2a1e");                    // hair
      P.px(x + 1, yb - 5, skin);                         // head
      P.rect(x + 1, yb - 4, 1, 2, coat);                 // torso
      P.px(x, yb - 4, coat); P.px(x + 2, yb - 3, skin);  // arm swing
      P.px(x + 1, yb - 2, pants);
      if (step) { P.px(x, yb - 1, pants); P.px(x + 2, yb, pants); P.px(x, yb, pants); }
      else { P.px(x + 1, yb - 1, pants); P.px(x + 1, yb, pants); P.px(x + 2, yb, pants); }
    }
  },
  {
    id: "jogger", name: "Jogger", biomes: ["city", "coast", "plains", "forest", "mountain"],
    tags: ["person", "active"], w: 5, h: 7, anchor: "baseline", layer: "ground",
    draw: function (P, x, yb, env) {
      var skin = "#c88a55", shirt = env.col("#e8d24a"), shorts = env.col("#2a6ab0");
      var step = (env.frame >> 1) & 1;
      P.px(x + 2, yb - 6, "#2a1a10"); P.px(x + 2, yb - 5, skin);
      P.rect(x + 2, yb - 4, 1, 2, shirt);
      P.px(step ? x + 3 : x + 1, yb - 3, skin);          // pumping arm
      P.px(x + 2, yb - 2, shorts);
      if (step) { P.px(x + 1, yb - 1, skin); P.px(x + 3, yb, skin); }
      else { P.px(x + 3, yb - 1, skin); P.px(x + 1, yb, skin); }
    }
  },
  {
    id: "hiker", name: "Hiker", biomes: ["mountain", "forest", "tundra", "plains"],
    tags: ["person", "outdoor"], w: 5, h: 8, anchor: "baseline", layer: "ground",
    draw: function (P, x, yb, env) {
      var skin = "#d09a68", coat = env.col("#b0562a"), pack = env.col("#3a6a3a"), pants = env.col("#3a3f48");
      var step = (env.frame >> 2) & 1;
      P.px(x + 2, yb - 7, env.col("#7a3f18"));           // hat
      P.px(x + 2, yb - 6, skin);
      P.rect(x + 2, yb - 5, 1, 2, coat);
      P.px(x + 3, yb - 5, pack); P.px(x + 3, yb - 4, pack); // backpack
      P.px(x + 1, yb - 4, skin);
      P.px(x, yb - 5, env.col("#8a6a3a"));               // trekking pole top
      P.line(x, yb - 5, x, yb, env.col("#8a6a3a"));
      P.px(x + 2, yb - 3, pants);
      if (step) { P.px(x + 1, yb - 1, pants); P.px(x + 3, yb, pants); }
      else { P.px(x + 3, yb - 1, pants); P.px(x + 1, yb, pants); }
    }
  },
  {
    id: "kite-kid", name: "Kid with kite", biomes: ["coast", "plains", "farmland"],
    tags: ["person", "child", "play"], w: 5, h: 8, anchor: "baseline", layer: "ground",
    draw: function (P, x, yb, env) {
      var skin = "#e0a870", shirt = env.col("#e0445a");
      P.px(x, yb - 5, "#3a2a1e"); P.px(x, yb - 4, skin);
      P.rect(x, yb - 3, 1, 2, shirt);
      P.px(x + 1, yb - 3, skin);                         // raised arm to string
      P.px(x, yb - 1, env.col("#2a3a6a")); P.px(x, yb, env.col("#2a3a6a"));
      // string up to a small diamond kite
      P.line(x + 1, yb - 3, x + 4, yb - 7, env.col("#8a8a8a"));
      P.px(x + 4, yb - 8, env.col("#f0c33a")); P.px(x + 4, yb - 7, env.col("#e0445a"));
      P.px(x + 3, yb - 7, env.col("#3aa06a")); P.px(x + 5, yb - 7, env.col("#3a63b8"));
    }
  },
  {
    id: "cyclist", name: "Cyclist", biomes: ["city", "coast", "plains", "farmland"],
    tags: ["person", "bike"], w: 9, h: 7, anchor: "baseline", layer: "ground", rarity: 0.9,
    draw: function (P, x, yb, env) {
      var skin = "#c88a55", jersey = env.col("#2aa0b0"), metal = "#aab0b6";
      P.disc(x + 1, yb - 1, 1, "#1a1a1a"); P.px(x + 1, yb - 1, metal);   // rear wheel
      P.disc(x + 7, yb - 1, 1, "#1a1a1a"); P.px(x + 7, yb - 1, metal);   // front wheel
      P.line(x + 1, yb - 1, x + 4, yb - 3, metal); P.line(x + 4, yb - 3, x + 7, yb - 1, metal);
      P.px(x + 4, yb - 4, jersey); P.px(x + 5, yb - 5, jersey);          // torso lean
      P.px(x + 5, yb - 6, skin);                                         // head
      P.px(x + 6, yb - 4, skin);                                         // arm to bars
      P.px(x + 3, yb - 2, jersey); P.px(x + 6, yb - 2, jersey);          // legs to pedals
    }
  }
];
