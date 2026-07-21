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
import { cityNames } from "./match.js";

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
      if (cityNames(ls.cities[c], name, full)) return ls;
    }
  }
  return null;
}

/** Fallback biome from geography when no city match is found.
 *  Elevation is usually absent in bulk city data, so we lean on coarse lat/lon
 *  boxes for the world's big arid / grassland / alpine belts — real geography,
 *  deliberately broad. Anything unmatched falls to the latitude default. This is
 *  what gives the uncurated long tail its variety (deserts, plains, mountains)
 *  instead of a monotone wall of "forest". */
export function guessBiome(place) {
  var lat = place.latitude || 0, alat = Math.abs(lat), lon = place.longitude || 0;
  var el = place.elevation || 0;
  var fc = String(place.featureCode || "");
  if (el > 1500 || fc.indexOf("MT") === 0) return "mountain";
  if (alat > 66) return "tundra";

  function box(la0, la1, lo0, lo1) { return lat >= la0 && lat <= la1 && lon >= lo0 && lon <= lo1; }
  // North America
  if (box(31, 37, -118, -103)) return "desert";     // US Southwest
  if (box(36, 42, -120, -114)) return "desert";     // Great Basin high desert (Reno, Carson City)
  if (box(37, 49, -114, -105)) return "mountain";   // Rockies / Mountain West
  if (box(31, 49, -104, -96)) return "plains";      // Great Plains
  if (box(37, 49, -96, -82)) return "farmland";     // Corn Belt / Midwest
  // South America
  if (box(-32, -14, -73, -66)) return "mountain";   // Andes
  if (box(-40, -22, -66, -56)) return "plains";     // Pampas
  // Africa / Middle East
  if (box(15, 33, -12, 50)) return "desert";        // Sahara + Arabian peninsula
  if (box(-32, -20, 15, 32)) return "desert";       // Kalahari / Karoo
  // Asia
  if (box(35, 48, 55, 95)) return "desert";         // Central Asian steppe / desert
  if (box(27, 40, 70, 88)) return "mountain";       // Himalaya / Tibetan fringe
  // Australia
  if (box(-30, -20, 118, 145)) return "desert";     // Outback

  if (alat < 12) return "jungle";
  if (alat < 24) return "savanna";
  return "forest";                 // temperate / boreal default
}

// Cities with a famously relaxed cannabis culture — the odd weed-smoking stroller
// shows up in these (gated so they don't appear everywhere).
var CANNABIS = [
  "amsterdam", "denver", "boulder", "portland", "seattle", "oakland", "san francisco",
  "los angeles", "santa cruz", "eugene", "arcata", "eureka", "humboldt", "vancouver",
  "kingston", "barcelona", "montevideo", "christiania"
];
export function isCannabisCity(place) {
  var name = norm(place && place.name), full = name + " " + norm(place && place.admin1);
  for (var i = 0; i < CANNABIS.length; i++) if (cityNames(CANNABIS[i], name, full)) return true;
  return false;
}

/**
 * Resolve `place` (needs at least latitude/longitude; name enables city matches)
 * into { place, biome, landscape, landmark, latitude, coastal, unit, cannabis }.
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
  var biome = getBiome(biomeId);
  // Uncurated places (fell through to the biome guess) get an honest, biome-named
  // landscape — so a big city that guessed "forest" reads as "Forest", not as some
  // unrelated named preset like "Pacific Northwest". (Density still makes it urban.)
  if (!landscape) landscape = { id: biomeId, name: biome.name, biome: biomeId };

  var coastal = biomeId === "coast" || biomeId === "ocean" || !!landscape.coastal;

  var unit = opts.temperatureUnit;
  if (!unit || unit === "auto") unit = unitForCountry(place.country);

  return {
    place: place,
    biome: biome,
    landscape: landscape,
    landmark: pickLandmark(place, landscape, biomeId),
    latitude: place.latitude || 0,
    coastal: coastal,
    unit: unit,
    cannabis: isCannabisCity(place)
  };
}
