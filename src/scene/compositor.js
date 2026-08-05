/* =========================================================================
   compositor.js — lays out and animates one diorama.

   Given a `world` (resolved biome + landscape + content pools + live weather),
   createScene() returns a stateful renderer: it places the fixed props (trees,
   the temperature sign) once, then each frame advances and draws the moving cast
   (vehicles, birds, swimmers, a strolling figure, flitting insects) and washes
   the weather over the top. The z-order mirrors the original LA widget:
   sky → distance → midground → near ground → road → sign → traffic → weather.
   ========================================================================= */
import { mix, clamp } from "../engine/painter.js";
import { drawSky } from "../engine/sky.js";
import { drawSun, drawMoon } from "../engine/celestial.js";
import { sunPosition, moonPosition } from "../engine/astronomy.js";
import { intensity as wmoIntensity, isPrecip, isSnow, isStorm, isRain, isFog } from "../data/wmo.js";
import { EFFECTS } from "./weatherfx.js";
import { makeRng, pickWeighted } from "../engine/random.js";
import { styleForBiome } from "../catalog/settlements.js";
import { groundOffset } from "../catalog/measure.js";

var LANE_NEAR = 43, LANE_FAR = 39;

// ---- clouds (ported from the LA widget) ---------------------------------
function cloudPuff(P, x, y, c, s) {
  P.rect(x + 2, y + 2, 8 * s, 2, c); P.rect(x, y + 3, 12 * s, 2, c);
  P.rect(x + 3, y, 5 * s, 2, c); P.rect(x + 1, y + 4, 11 * s, 1, c);
}
function drawClouds(P, env, frame, sky) {
  var cover = clamp(env.cloud / 100, 0, 1);
  var foggy = isFog(env.code);
  var n = foggy ? 3 : Math.round(cover * 4);
  if (env.code >= 51) n = Math.max(n, 3);
  if (n <= 0) return;
  var tint = env.dayT < 0.3 ? "#3a3f52" : foggy ? "#e7eaec" : mix("#ffffff", "#b9c2cb", 0.3 + cover * 0.5);
  tint = mix(tint, sky.hor, 0.15);
  var drift = (frame * (0.25 + env.wind * 90 / 90)) % (P.L + 30);
  for (var i = 0; i < n; i++) {
    var cx = ((i * 17 + drift) % (P.L + 24)) - 12;
    var cy = 3 + (i * 5) % 12 + (foggy ? 4 : 0);
    cloudPuff(P, cx, cy, tint, foggy ? 0.8 : 1);
  }
}

// ---- urbanisation overlay -----------------------------------------------
// Two restrained layers so a place reads on a real spectrum (pastoral → town →
// city → metropolis) WITHOUT turning every biome into glass towers:
//   1. a hazy, sparse DISTANT skyline near the horizon (the wider city behind),
//   2. a LOCAL settlement in biome-appropriate style (stilt / adobe / chalet /
//      favela / …) whose height is capped per style, so a swamp or a desert town
//      stays low. Both leave generous gaps where the biome's nature shows.
function distantSkyline(P, env, rng) {
  var hy = env.horizon, d = env.density, lit = env.night || env.dayT < 0.42;
  if (env.waterLandmark) return;   // a distant bridge is already the horizon here
  if (d < 0.34) return;
  // Never a skyline standing on open water. Looking out over the sea there is no
  // land to build on, so the horizon stays clean sea and sky; only where the water
  // has a far shore (a lake's far bank, a marsh, a canyon rim) can a distant city
  // sit behind it.
  if (env.water && !env.farShore) return;
  var cov = clamp((d - 0.32) * 0.75, 0, 0.5);   // always leaves sky between
  // A far skyline is atmosphere, not architecture: heights vary a lot (a ragged
  // profile, not a row of monoliths) and everything washes toward the sky at the
  // horizon, so it reads as distance rather than as dark pillars in the scene.
  var cap = 3 + d * (hy - 11);                      // tallest tower in the far city
  var haze = env.sky && env.sky.clearHor ? env.sky.clearHor : "#b9c8d6";
  var x = 0;
  while (x < P.L) {
    if (rng() < cov) {
      var w = 2 + Math.floor(rng() * 3);
      var h = Math.max(2, Math.round(cap * (0.35 + rng() * rng() * 0.9)));   // mostly low, a few tall
      var tall = h / (cap || 1);
      var wall = mix(env.col(mix("#4a5464", "#616c7c", rng())), haze, 0.62 - tall * 0.16);
      P.rect(x, hy - h, w, h, wall);
      if (lit) {
        for (var wy = hy - h + 1; wy < hy - 1; wy += 2)
          for (var wx = x + 1; wx < x + w - 1; wx += 2) if (rng() < 0.3) P.px(wx, wy, mix("#ffe08a", haze, 0.25));
      }
      x += w + 1 + Math.floor(rng() * 3);
    } else { x += 3 + Math.floor(rng() * 4); }
  }
}
// A building has to be at least this tall to belong in a scene — anything shorter
// reads as clutter next to a person or a bird, not as architecture.
var MIN_BUILDING = 7;

/**
 * Which row a settlement stands on, given the water in this biome — and null when
 * it simply can't stand anywhere. Nothing is ever built ON open water: a style
 * that's meant to (stilt houses over a marsh) says so with `overWater`; anything
 * else steps back to dry land above the waterline. And where the sea sits behind
 * the near shore (a beach), the strip left over has to be deep enough for a real
 * building, otherwise the shore stays open sand.
 */
function settlementBase(env, style) {
  var base = env.groundTop - 1, w = env.water;
  if (!w) return base;
  if (base >= w.top && base <= w.bot) {                      // the build line is water
    if (!style.overWater) base = w.top - 1;                  // step back onto dry land
  }
  if (w.bot < base) {                                        // sea/lake behind the shore
    if (base - w.bot < MIN_BUILDING) return null;            // only a sliver of beach → leave it open
  }
  return base;
}

function localSettlement(P, env, rng) {
  var d = env.density, lit = env.night || env.dayT < 0.42;
  var style = styleForBiome(env.biomeId, env.seed, d, env.region);
  if (!style) return;
  var base = settlementBase(env, style);
  if (base == null) return;
  var tier = d < 0.36 ? 0 : d < 0.62 ? 1 : 2;                // town / city / metropolis
  var hcap = style.heights[tier];
  if (env.water && env.water.bot < base) {                   // don't grow up into the water
    hcap = Math.min(hcap, base - env.water.bot);
  }
  if (hcap < MIN_BUILDING) hcap = MIN_BUILDING;
  var cov = clamp((d - 0.08) * 0.72, 0, style.maxCoverage);  // sparse when small, still gapped when huge
  var shift = base - (env.groundTop - 1);                    // styles draw off env.groundTop
  var senv = shift ? Object.create(env) : env;
  if (shift) senv.groundTop = env.groundTop + shift;
  var fx = 0;
  while (fx < P.L) {
    if (rng() < cov) {
      var w = style.width ? style.width(rng) : (3 + Math.floor(rng() * 3));
      var h = Math.max(MIN_BUILDING, Math.round(hcap * (0.55 + rng() * 0.45)));
      style.building(P, fx, w, h, senv, lit, rng);
      fx += w + 1 + Math.floor(rng() * 3);                   // gap after each building
    } else { fx += 3 + Math.floor(rng() * 5); }              // nature gap
  }
}
function urbanLayer(P, env) {
  if ((env.density || 0) < 0.1) return;
  var rng = env.srng || env.rng;
  distantSkyline(P, env, rng);
  localSettlement(P, env, rng);
}

// gear a strolling figure gears up with in rough weather
function drawGear(P, x, fy, gear, env) {
  if (gear === "umbrella") {
    var u1 = "#d83a52", u2 = "#f4f4f4";
    P.rect(x - 1, fy - 8, 5, 1, u1); P.px(x, fy - 8, u2); P.px(x + 2, fy - 8, u2);
    P.px(x - 1, fy - 7, u1); P.px(x + 3, fy - 7, u1);
    P.px(x + 2, fy - 7, "#6a5a3a"); P.px(x + 2, fy - 6, "#6a5a3a");
  } else if (gear === "gasmask") {
    P.px(x + 1, fy - 5, "#3f5a3f"); P.px(x + 2, fy - 5, "#3f5a3f");
    P.px(x + 1, fy - 4, "#33482f");
  } else if (gear === "parka") {
    P.px(x, fy - 6, "#c8d2dc"); P.px(x + 1, fy - 6, "#c8d2dc"); P.px(x + 2, fy - 6, "#c8d2dc");
  }
}

export function createScene(P, world, opts) {
  opts = opts || {};
  var G = world.geometry;
  var reduce = !!opts.reduce;
  var rng = makeRng(world.seed || 1);

  // ---- place fixed props once (stable per scene) ------------------------
  var props = { trees: [], sign: null, landmark: null };
  (function initProps() {
    if (world.landmark) props.landmark = { entry: world.landmark, x: 1 };
    var pool = world.pools.trees;
    if (pool.length) {
      // A landmark takes the left; trees fill the remaining space so they never
      // stack on top of it. Denser (more urban) places show fewer street trees.
      var xs = props.landmark ? [40, 33] : [7, 40, 22];
      var base = props.landmark ? 1 : (1 + (rng() < 0.6 ? 1 : 0));
      var nTrees = world.biome.id === "ocean" ? 0 : Math.max(0, Math.round(base * (1 - (world.density || 0) * 0.7)));
      for (var i = 0; i < nTrees; i++) {
        props.trees.push({ entry: pickWeighted(rng, pool), x: xs[i] });
      }
    }
    var signs = world.pools.signs;
    if (signs.length) {
      // a landmark may name a paired sign (e.g. the casino → the Vegas welcome
      // sign); use it when it's available for this biome, else weighted-random.
      var chosen = null;
      if (props.landmark && props.landmark.pairedSign) {
        for (var s = 0; s < signs.length; s++) if (signs[s].id === props.landmark.pairedSign) { chosen = signs[s]; break; }
      }
      props.sign = { entry: chosen || pickWeighted(rng, signs), x: 29 };
    }
  })();

  // ---- moving cast ------------------------------------------------------
  var cars = [], nextCar = 30;
  var boats = [], nextBoat = 60;
  var birds = [], nextBird = 80;
  var swimmers = [], nextSwim = 120;
  var fliers = [], nextFlit = 100;
  var walker = null, nextWalker = 90;

  function buildEnv(frame, now, dayT) {
    var W = world.W, night = dayT < 0.35;
    function col(c) { return night ? mix(c, "#20202c", 0.55) : c; }
    return {
      L: P.L, horizon: G.horizon, groundTop: G.groundTop, roadBot: G.roadBot,
      frame: frame, now: now, dayT: dayT, night: night, col: col, rng: rng,
      // srng: a deterministic generator reseeded every frame, so static scenery
      // (a city skyline, wall graffiti) is laid out identically each frame instead
      // of flickering/"scrolling" as the shared rng advances.
      srng: makeRng(world.seed || 1),
      density: world.density || 0, biomeId: world.biome.id, seed: world.seed || 1,
      // this biome's water band (or null), and whether there's LAND across it —
      // a lake's far bank or a canyon rim can carry a distant city; open sea can't.
      region: world.region || null,
      water: world.biome.water || null,
      farShore: !!world.biome.farShore,
      wind: clamp((W.windKph || 0) / 45, 0, 1),
      code: W.code, cloud: W.cloud, aqi: W.aqi, temp: W.temp,
      waveM: W.waveM, tide: W.tide, sunrise: world.sunrise, sunset: world.sunset,
      sky: world.biome.sky, cold: !!world.biome.cold, latitude: world.latitude,
      intensity: wmoIntensity(W.code),
      rough: W.code >= 45 || W.aqi >= 160,
      text: world.tempText(), dir: 1
    };
  }

  // Draw a sprite facing its travel direction. Sprites are authored facing RIGHT,
  // so env.dir stays +1 inside the draw and the Painter mirrors left-bound sprites
  // around their anchor: baseline sprites within [x, x+w); center-anchor sprites
  // (birds, insects) around their midpoint x. This is what makes a left-flying bird
  // actually face left instead of moon-walking.
  function draw(entry, x, yb, env, dir) {
    env.dir = 1;
    if (dir < 0) {
      if (entry.anchor === "center") {
        // reflect exactly about the anchor column x (widen the window by 1 for even
        // widths so the mirror axis lands on x, not x-0.5 → no sideways shift).
        var fw = (entry.w & 1) ? entry.w : entry.w + 1;
        P.flip(x - (entry.w >> 1), fw, function () { entry.draw(P, x, yb, env); });
      } else {
        P.flip(x, entry.w, function () { entry.draw(P, x, yb, env); });
      }
    } else {
      entry.draw(P, x, yb, env);
    }
  }

  // Paint the strolling figure (+ any weather gear) at its current position — or
  // its resting pose while it's stopped (a beachgoer laid out on a towel).
  function paintWalker(env) {
    var wx = Math.round(walker.x);
    if (walker.resting) { walker.entry.restDraw(P, wx, walker.fy, env); return; }
    draw(walker.entry, wx, walker.fy, env, walker.dir);
    if (walker.gear) drawGear(P, wx, walker.fy, walker.gear, env);
  }

  // Advance the strolling figure: walk, pause to rest (if this sprite has a
  // resting pose and the weather is nice), then get up and carry on.
  function stepWalker(env, frame) {
    if (walker.resting) {
      if (frame >= walker.restUntil) { walker.resting = false; walker.rested = true; }
      return;
    }
    walker.x += walker.speed * walker.dir;
    if (!walker.rested && walker.entry.restDraw && !env.rough && walker.x >= walker.restAt) {
      walker.resting = true;
      walker.restUntil = frame + 220 + Math.round(rng() * 260);   // a good long sunbathe
    }
  }

  // spawn helpers -------------------------------------------------------
  function spawnCar() {
    var e = pickWeighted(rng, world.pools.roadVehicles);
    var near = rng() < 0.5, dir = near ? 1 : -1, yb = near ? LANE_NEAR : LANE_FAR;
    var speed = (0.55 + rng() * 0.5) * (near ? 1 : 0.92);
    cars.push({ entry: e, dir: dir, near: near, yb: yb, speed: speed,
      x: dir > 0 ? -e.w - 4 : P.L + 4 });
  }
  function spawnBird() {
    var e = pickWeighted(rng, world.pools.birds);
    var dir = rng() < 0.5 ? 1 : -1, y = G.horizon - 12 + Math.floor(rng() * 10);
    birds.push({ entry: e, dir: dir, y: clamp(y, 4, G.horizon - 2), speed: (0.4 + rng() * 0.4),
      x: dir > 0 ? -8 : P.L + 8 });
  }
  function spawnBoat() {
    var e = pickWeighted(rng, world.pools.waterVehicles);
    var band = world.biome.water; var yb = Math.round((band.top + band.bot) / 2) + 1;
    var dir = rng() < 0.5 ? 1 : -1;
    boats.push({ entry: e, dir: dir, yb: yb, speed: 0.18 + rng() * 0.18, x: dir > 0 ? -e.w - 4 : P.L + 4 });
  }
  function spawnSwimmer() {
    var e = pickWeighted(rng, world.pools.waterAnimals);
    var band = world.biome.water; var y = Math.round((band.top + band.bot) / 2);
    var dir = rng() < 0.5 ? 1 : -1;
    swimmers.push({ entry: e, dir: dir, y: y, speed: 0.25 + rng() * 0.3, x: dir > 0 ? -6 : P.L + 6 });
  }
  function spawnFlier() {
    var e = pickWeighted(rng, world.pools.airAnimals);
    var dir = rng() < 0.5 ? 1 : -1;
    fliers.push({ entry: e, dir: dir, y: G.groundTop - 8 - Math.floor(rng() * 6), speed: 0.3 + rng() * 0.3,
      x: dir > 0 ? -5 : P.L + 5, ph: rng() * 6 });
  }
  function spawnWalker(env) {
    var pool = world.pools.people; if (!pool.length) return;
    // weed-smoking strollers only turn up in cannabis-culture cities
    if (!world.cannabis) pool = pool.filter(function (p) { return p.require !== "cannabis"; });
    if (!pool.length) return;
    var e = pickWeighted(rng, pool);
    var gear = null;
    if (env.rough) gear = (env.aqi >= 160 && !isPrecip(env.code)) ? "gasmask" : (env.cold ? "parka" : "umbrella");
    walker = { entry: e, x: -8, dir: 1, fy: G.groundTop - 1, gear: gear, speed: env.rough ? 0.3 : 0.22,
      // where it stops to rest (if it has a resting pose), and whether it already has
      restAt: 8 + Math.round(rng() * 22), resting: false, rested: false, restUntil: 0 };
  }

  // ---- per-frame --------------------------------------------------------
  function render(frame, now, dayT) {
    var env = buildEnv(frame, now, dayT);
    P.clear();

    var sky = drawSky(P, env, frame, G.horizon);
    var sp = sunPosition(now, world.sunrise, world.sunset, P.L, G.horizon);
    if (sp) drawSun(P, sp, env, sky);
    else {
      var mp = moonPosition(now, world.sunrise, world.sunset, P.L, G.horizon);
      if (mp) drawMoon(P, mp, world.moon, sky);
    }
    // aurora on clear high-latitude nights
    if (env.night && Math.abs(env.latitude || 0) > 55 && env.code <= 3) EFFECTS.aurora(P, env);
    drawClouds(P, env, frame, sky);
    // rainbow when raining but sunny-ish
    if (isRain(env.code) && env.cloud < 70 && sp && !env.night) EFFECTS.rainbow(P, env);

    world.biome.drawFar(P, env);
    world.biome.drawGround(P, env);
    // lay snow over the terrain while it's actually snowing (any biome)
    if (isSnow(env.code)) {
      P.withAlpha(0.55, function () { P.rect(0, G.horizon, P.L, G.groundTop - G.horizon + 1, env.col("#eef4f8")); });
      P.rect(0, G.groundTop - 1, P.L, 1, env.col("#f4f8fb"));
    }
    // a water-spanning landmark (e.g. the Golden Gate) is a DISTANCE feature:
    // drawn over the water, behind the near shore and the city fabric. When one is
    // present it becomes the horizon, so the hazy distant skyline is suppressed
    // (otherwise those grey towers read as stray bridge piers).
    env.waterLandmark = !!(props.landmark && props.landmark.entry.place === "water");
    if (env.waterLandmark) props.landmark.entry.draw(P, 1, G.horizon + 3, env);

    // city fabric — buildings scaled by how urban the place is (gaps show nature)
    urbanLayer(P, env);
    if (isFog(env.code)) EFFECTS.fog(P, env);

    // birds (behind midground)
    if (!reduce) {
      if (world.pools.birds.length && frame >= nextBird && birds.length < 2) { spawnBird(); nextBird = frame + Math.round(260 + rng() * 520); }
      for (var bi = birds.length - 1; bi >= 0; bi--) {
        var bd = birds[bi]; bd.x += bd.speed * bd.dir;
        if (bd.x < -8 || bd.x > P.L + 8) { birds.splice(bi, 1); continue; }
        draw(bd.entry, Math.round(bd.x), bd.y, env, bd.dir);
      }
    }

    // water cast (swimmers + boats)
    if (world.biome.water) {
      if (!reduce) {
        if (world.pools.waterAnimals.length && frame >= nextSwim && swimmers.length < 2) { spawnSwimmer(); nextSwim = frame + Math.round(200 + rng() * 400); }
        for (var si = swimmers.length - 1; si >= 0; si--) {
          var sw = swimmers[si]; sw.x += sw.speed * sw.dir;
          if (sw.x < -6 || sw.x > P.L + 6) { swimmers.splice(si, 1); continue; }
          draw(sw.entry, Math.round(sw.x), sw.y, env, sw.dir);
        }
        if (world.pools.waterVehicles.length && frame >= nextBoat && boats.length < 2) { spawnBoat(); nextBoat = frame + Math.round(300 + rng() * 500); }
        for (var oi = boats.length - 1; oi >= 0; oi--) {
          var bo = boats[oi]; bo.x += bo.speed * bo.dir;
          if (bo.x < -bo.entry.w - 6 || bo.x > P.L + bo.entry.w + 6) { boats.splice(oi, 1); continue; }
          draw(bo.entry, Math.round(bo.x), bo.yb, env, bo.dir);
        }
      }
    }

    // the city's landmark — a structure at the shoreline/midground: drawn AFTER
    // the water cast so a passing boat never floats in front of it, but before
    // the foreground trees/actors so those still layer over it. (Water-spanning
    // landmarks were already drawn as a distance feature, above.)
    if (props.landmark && props.landmark.entry.place !== "water") {
      // plant the landmark so its lowest pixel lands exactly on the ground line,
      // whatever baseline habit the sprite was authored with (no more 1px float).
      props.landmark.entry.draw(P, props.landmark.x, G.groundTop - 1 + groundOffset(props.landmark.entry), env);
    }

    // fixed trees (behind the road) — auto-grounded like the landmark
    for (var ti = 0; ti < props.trees.length; ti++) {
      props.trees[ti].entry.draw(P, props.trees[ti].x, G.groundTop - 1 + groundOffset(props.trees[ti].entry), env);
    }

    // a strolling figure — advance it here. A pedestrian on the road shoulder
    // (feet on the front edge, groundTop-1) passes in FRONT of the sign, so it's
    // painted after the sign below; one further back (feet above the edge) paints
    // here, behind it. One pixel of depth decides which side of the sign it's on.
    if (!reduce) {
      if (!walker && world.pools.people.length && frame >= nextWalker) spawnWalker(env);
      if (walker) {
        stepWalker(env, frame);
        if (walker.x > P.L + 10) { walker = null; nextWalker = frame + Math.round(120 + rng() * 120); }
        else if (walker.fy < G.groundTop - 1) paintWalker(env);   // set back → behind the sign
      }
    }

    // road + shoulder
    drawRoad(P, env);
    world.biome.drawShoulder(P, env);

    // temperature sign — auto-grounded so every sign shares the same base row as
    // the trees, landmark and the strolling figure (no lone 1px-low outliers).
    if (props.sign) props.sign.entry.draw(P, props.sign.x, G.groundTop - 1 + groundOffset(props.sign.entry), env);

    // the strolling figure, when it's at the road edge, walks in FRONT of the sign
    if (!reduce && walker && walker.fy >= G.groundTop - 1) paintWalker(env);

    // road traffic (in front)
    if (!reduce && world.pools.roadVehicles.length && world.biome.road.kind !== "none") {
      // Traffic by city size — a quiet road with the odd car in a village, a steady
      // stream downtown. Kept sparse overall: the road is a frame for the scene,
      // not the subject, so even a metropolis never becomes a traffic jam.
      var d = env.density || 0;
      var maxCars = d >= 0.62 ? 3 : d >= 0.36 ? 2 : 1;
      var gap = d >= 0.62 ? 62 : d >= 0.36 ? 108 : d >= 0.12 ? 185 : 290;
      if (frame >= nextCar && cars.length < maxCars) { spawnCar(); nextCar = frame + Math.round(gap * (0.7 + rng() * 0.8)); }
      for (var ci = cars.length - 1; ci >= 0; ci--) {
        var car = cars[ci]; car.x += car.speed * car.dir;
        if (car.x < -car.entry.w - 10 || car.x > P.L + car.entry.w + 10) cars.splice(ci, 1);
      }
      for (var p = 0; p < cars.length; p++) if (!cars[p].near) draw(cars[p].entry, Math.round(cars[p].x), cars[p].yb, env, cars[p].dir);
      for (var q = 0; q < cars.length; q++) if (cars[q].near) draw(cars[q].entry, Math.round(cars[q].x), cars[q].yb, env, cars[q].dir);
    }

    // flitting insects (foreground)
    if (!reduce && world.pools.airAnimals.length) {
      if (frame >= nextFlit && fliers.length < 2) { spawnFlier(); nextFlit = frame + Math.round(150 + rng() * 300); }
      for (var fi = fliers.length - 1; fi >= 0; fi--) {
        var fl = fliers[fi]; fl.x += fl.speed * fl.dir;
        var fy = fl.y + Math.round(Math.sin(frame * 0.2 + fl.ph) * 2);
        if (fl.x < -5 || fl.x > P.L + 5) { fliers.splice(fi, 1); continue; }
        draw(fl.entry, Math.round(fl.x), fy, env, fl.dir);
      }
    }

    // weather over the top
    if (isStorm(env.code)) { EFFECTS.rain(P, env); EFFECTS.lightning(P, env); }
    else if (isRain(env.code)) EFFECTS.rain(P, env);
    else if (isSnow(env.code)) EFFECTS.snow(P, env);
    if (env.code === 96 || env.code === 99) EFFECTS.hail(P, env);
    if (world.biome.id === "desert" && env.wind > 0.55 && !isPrecip(env.code)) EFFECTS.sandstorm(P, env);
    else if (env.wind > 0.4 && !isPrecip(env.code)) EFFECTS.windParticles(P, env);
    if (world.biome.id === "desert" && env.temp > 90 && !env.night) EFFECTS.heatShimmer(P, env);

    // vignette
    P.withAlpha(0.14, function () { P.rect(0, 0, P.L, 1, "#000"); P.rect(0, P.L - 1, P.L, 1, "#000"); });
  }

  function drawRoad(P, env) {
    var kind = world.biome.road.kind;
    if (kind === "none") return;
    var C = env.night ? ROAD_NIGHT[kind] : ROAD_DAY[kind];
    for (var x = 0; x < P.L; x++) {
      P.rect(x, G.groundTop, 1, G.roadBot - G.groundTop, C.surf);
      P.px(x, G.groundTop, C.edge);
      P.px(x, G.roadBot - 1, C.dark);
      if (world.biome.road.markings && (x + 1) % 6 < 3) P.px(x, (G.groundTop + G.roadBot) >> 1, C.mark);
    }
  }

  return { render: render };
}

// road palettes resolved to concrete colours (kept out of the hot path)
var ROAD_DAY = {
  asphalt: { surf: "#3c3c44", edge: "#55555f", dark: "#1c1c22", mark: "#d8cf7a" },
  dirt: { surf: "#7a5a3a", edge: "#8a6a44", dark: "#4a3320", mark: "#c9b98a" },
  cobble: { surf: "#6a6a72", edge: "#7a7a82", dark: "#3a3a42", mark: "#9a9aa2" },
  path: { surf: "#a98b5a", edge: "#b89a68", dark: "#6a5236", mark: "#c9b98a" }
};
var ROAD_NIGHT = {
  asphalt: { surf: "#26262c", edge: "#3a3a42", dark: "#141418", mark: "#8a7f3a" },
  dirt: { surf: "#43301d", edge: "#523a24", dark: "#2a1d12", mark: "#6a5a3a" },
  cobble: { surf: "#3a3a42", edge: "#4a4a52", dark: "#222228", mark: "#5a5a62" },
  path: { surf: "#5a4630", edge: "#6a5236", dark: "#33281a", mark: "#6a5a3a" }
};
