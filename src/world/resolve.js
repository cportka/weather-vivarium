/* =========================================================================
   resolve.js — a place → a scene description.

   Given a geocoded place (or raw coordinates), decide which biome/landscape to
   render, which landmark (if any) to feature, and which temperature unit to
   show. Landscape selection matches the city name against the curated lists
   first, then falls back to a latitude/elevation guess. Everything here is
   overridable through options (biome, landscape, temperatureUnit) so a caller
   can force a look.
   ========================================================================= */
import { getBiome, BIOMES } from "./biomes.js";
import { LANDSCAPES, getLandscape, landscapeForBiome } from "./landscapes.js";
import { pickLandmark } from "../catalog/landmarks.js";

// Countries that conventionally use Fahrenheit (rough but practical).
var FAHRENHEIT = [
  "united states", "united states of america", "usa",
  "bahamas", "belize", "cayman islands", "liberia",
  "palau", "micronesia", "marshall islands", "puerto rico", "guam"
];

function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); }

/** Default temperature unit for a country name. */
export function unitForCountry(country) {
  return FAHRENHEIT.indexOf(norm(country)) !== -1 ? "fahrenheit" : "celsius";
}

/** Match a place's name against the landscape city lists. */
function matchLandscape(place) {
  var name = norm(place.name), admin = norm(place.admin1), full = name + " " + admin;
  for (var i = 0; i < LANDSCAPES.length; i++) {
    var ls = LANDSCAPES[i];
    for (var c = 0; c < ls.cities.length; c++) {
      var city = ls.cities[c];
      if (name === city || name.indexOf(city) !== -1 || city.indexOf(name) !== -1 || full.indexOf(city) !== -1) return ls;
    }
  }
  return null;
}

/** Fallback biome from latitude + elevation when no city match is found. */
export function guessBiome(place) {
  var lat = Math.abs(place.latitude || 0);
  var el = place.elevation || 0;
  var fc = String(place.featureCode || "");
  if (el > 1500 || fc.indexOf("MT") === 0) return "mountain";
  if (lat > 63) return "tundra";
  if (lat < 15) return "jungle";
  if (lat < 30) return "savanna";
  return "plains";
}

/**
 * Resolve `place` (needs at least latitude/longitude; name enables city matches)
 * into { place, biome, landscape, landmark, latitude, coastal, unit }.
 * opts: { biome, landscape, temperatureUnit }.
 */
export function resolveScene(place, opts) {
  opts = opts || {};
  place = place || {};

  var landscape = null;
  if (opts.landscape) landscape = getLandscape(opts.landscape);
  if (!landscape && !opts.biome) landscape = matchLandscape(place);

  var biomeId = opts.biome || (landscape && landscape.biome) || guessBiome(place);
  if (!BIOMES[biomeId]) biomeId = "coast";
  if (!landscape) landscape = landscapeForBiome(biomeId);

  var biome = getBiome(biomeId);
  var coastal = biomeId === "coast" || biomeId === "ocean" || !!landscape.coastal;

  var unit = opts.temperatureUnit;
  if (!unit || unit === "auto") unit = unitForCountry(place.country);

  return {
    place: place,
    biome: biome,
    landscape: landscape,
    landmark: pickLandmark(place, landscape),
    latitude: place.latitude || 0,
    coastal: coastal,
    unit: unit
  };
}
