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
      // stack on top of it.
      var xs = props.landmark ? [40, 33] : [7, 40, 22];
      var nTrees = world.biome.id === "ocean" ? 0 : (props.landmark ? 1 : (1 + (rng() < 0.6 ? 1 : 0)));
      for (var i = 0; i < nTrees; i++) {
        props.trees.push({ entry: pickWeighted(rng, pool), x: xs[i] });
      }
    }
    var signs = world.pools.signs;
    if (signs.length) props.sign = { entry: pickWeighted(rng, signs), x: 29 };
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
      wind: clamp((W.windKph || 0) / 45, 0, 1),
      code: W.code, cloud: W.cloud, aqi: W.aqi, temp: W.temp,
      waveM: W.waveM, tide: W.tide, sunrise: world.sunrise, sunset: world.sunset,
      sky: world.biome.sky, cold: !!world.biome.cold, latitude: world.latitude,
      intensity: wmoIntensity(W.code),
      rough: W.code >= 45 || W.aqi >= 160,
      text: world.tempText(), dir: 1
    };
  }

  function draw(entry, x, yb, env, dir) {
    env.dir = dir;
    if (dir < 0 && entry.anchor !== "center") P.flip(x, entry.w, function () { entry.draw(P, x, yb, env); });
    else entry.draw(P, x, yb, env);
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
    var e = pickWeighted(rng, pool);
    var gear = null;
    if (env.rough) gear = (env.aqi >= 160 && !isPrecip(env.code)) ? "gasmask" : (env.cold ? "parka" : "umbrella");
    walker = { entry: e, x: -8, dir: 1, fy: G.groundTop - 1, gear: gear, speed: env.rough ? 0.3 : 0.22 };
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
    if (isFog(env.code)) EFFECTS.fog(P, env);

    // the city's landmark (a background feature, behind the moving cast)
    if (props.landmark) props.landmark.entry.draw(P, props.landmark.x, G.groundTop - 1, env);

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

    // fixed trees (behind the road)
    for (var ti = 0; ti < props.trees.length; ti++) {
      props.trees[ti].entry.draw(P, props.trees[ti].x, G.groundTop - 1, env);
    }

    // ground animals + a strolling figure (behind the road)
    if (!reduce) {
      if (world.pools.groundAnimals.length && frame >= nextFlit && fliers.length < 1 && rng() < 0.5) {
        // reuse the flit timer to occasionally send a ground animal across, too
      }
      if (!walker && world.pools.people.length && frame >= nextWalker) spawnWalker(env);
      if (walker) {
        walker.x += walker.speed * walker.dir;
        var wx = Math.round(walker.x);
        draw(walker.entry, wx, walker.fy, env, walker.dir);
        if (walker.gear) drawGear(P, wx, walker.fy, walker.gear, env);
        if (walker.x > P.L + 10) { walker = null; nextWalker = frame + Math.round(120 + rng() * 120); }
      }
    }

    // road + shoulder
    drawRoad(P, env);
    world.biome.drawShoulder(P, env);

    // temperature sign
    if (props.sign) props.sign.entry.draw(P, props.sign.x, G.groundTop, env);

    // road traffic (in front)
    if (!reduce && world.pools.roadVehicles.length && world.biome.road.kind !== "none") {
      if (frame >= nextCar && cars.length < 3) { spawnCar(); nextCar = frame + Math.round(24 + rng() * 64); }
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
