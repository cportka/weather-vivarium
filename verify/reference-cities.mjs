/* =========================================================================
   reference-cities.mjs — the 50 cities we always check.

   A deliberately diverse standing set: every biome, the full density spectrum
   (rural hamlet → megacity), both hemispheres, coastal and landlocked, curated
   landmarks and uncurated long-tail places. These are the reference renders —
   any tweak to the compositor, the settlement styles or the resolver gets judged
   against this sheet, and `tests/reference-cities.test.mjs` locks in how each one
   resolves so a change can't quietly alter them.

   Run `npm run verify:reference` to render the contact sheet to
   verify/out/reference-50.png.
   ========================================================================= */

import { resolveScene, placeKey, sceneDensity } from "../src/world/resolve.js";
import { styleForBiome } from "../src/catalog/settlements.js";
import { seedFrom } from "../src/engine/random.js";

export const REFERENCE_CITIES = [
  // --- the origin story + US coast ---
  { name: "Los Angeles", lat: 34.05, lon: -118.24, population: 3971883, country: "United States" },
  { name: "Santa Monica", lat: 34.02, lon: -118.49, population: 93000, country: "United States" },
  { name: "San Francisco", lat: 37.77, lon: -122.42, population: 870887, country: "United States" },
  { name: "Honolulu", lat: 21.31, lon: -157.86, population: 371657, country: "United States" },
  { name: "Seattle", lat: 47.61, lon: -122.33, population: 684451, country: "United States" },
  // --- US interior: desert, mountain, plains, swamp, tundra ---
  { name: "New York City", lat: 40.71, lon: -74.01, population: 8175133, country: "United States" },
  { name: "Chicago", lat: 41.88, lon: -87.63, population: 2720546, country: "United States" },
  { name: "Las Vegas", lat: 36.17, lon: -115.14, population: 623747, country: "United States" },
  { name: "Reno", lat: 39.53, lon: -119.81, population: 264165, country: "United States" },
  { name: "Denver", lat: 39.74, lon: -104.99, population: 682545, country: "United States" },
  { name: "Aspen", lat: 39.19, lon: -106.82, population: 7004, country: "United States" },
  { name: "Santa Fe", lat: 35.69, lon: -105.94, population: 84683, country: "United States" },
  { name: "New Orleans", lat: 29.95, lon: -90.07, population: 390144, country: "United States" },
  { name: "Anchorage", lat: 61.22, lon: -149.9, population: 291826, country: "United States" },
  { name: "Berkeley", lat: 37.87, lon: -122.27, population: 124321, country: "United States" },
  { name: "Miami", lat: 25.76, lon: -80.19, population: 441003, country: "United States" },
  { name: "Torrance", lat: 33.84, lon: -118.34, population: 147067, country: "United States" },
  { name: "Lomita", lat: 33.79, lon: -118.32, population: 20921, country: "United States" },
  // --- the Americas ---
  { name: "Mexico City", lat: 19.43, lon: -99.13, population: 12294193, country: "Mexico" },
  { name: "Rio de Janeiro", lat: -22.91, lon: -43.2, population: 6023699, country: "Brazil" },
  { name: "Cusco", lat: -13.53, lon: -71.97, population: 312140, country: "Peru" },
  { name: "Ushuaia", lat: -54.8, lon: -68.3, population: 63000, country: "Argentina" },
  { name: "Havana", lat: 23.13, lon: -82.38, population: 2163824, country: "Cuba" },
  { name: "Vancouver", lat: 49.28, lon: -123.12, population: 600000, country: "Canada" },
  // --- Europe ---
  { name: "London", lat: 51.51, lon: -0.13, population: 8961989, country: "United Kingdom" },
  { name: "Paris", lat: 48.86, lon: 2.35, population: 2138551, country: "France" },
  { name: "Reykjavík", lat: 64.15, lon: -21.94, population: 131136, country: "Iceland" },
  { name: "Zurich", lat: 47.37, lon: 8.54, population: 415367, country: "Switzerland" },
  { name: "Moscow", lat: 55.75, lon: 37.62, population: 11500000, country: "Russia" },
  { name: "Barcelona", lat: 41.39, lon: 2.17, population: 1620343, country: "Spain" },
  { name: "Tromsø", lat: 69.65, lon: 18.96, population: 65286, country: "Norway" },
  { name: "Venice", lat: 45.44, lon: 12.32, population: 261362, country: "Italy" },
  // --- Africa + Middle East ---
  { name: "Cairo", lat: 30.04, lon: 31.24, population: 7734614, country: "Egypt" },
  { name: "Nairobi", lat: -1.29, lon: 36.82, population: 4397073, country: "Kenya" },
  { name: "Marrakesh", lat: 31.63, lon: -8.01, population: 839296, country: "Morocco" },
  { name: "Cape Town", lat: -33.93, lon: 18.42, population: 3433441, country: "South Africa" },
  { name: "Lagos", lat: 6.46, lon: 3.39, population: 9000000, country: "Nigeria" },
  { name: "Dubai", lat: 25.08, lon: 55.19, population: 3478000, country: "United Arab Emirates" },
  { name: "Timbuktu", lat: 16.77, lon: -3.01, population: 32460, country: "Mali" },
  // --- Asia ---
  { name: "Tokyo", lat: 35.68, lon: 139.69, population: 8336599, country: "Japan" },
  { name: "Kyoto", lat: 35.01, lon: 135.77, population: 1459640, country: "Japan" },
  { name: "Taipei", lat: 25.03, lon: 121.57, population: 2618772, country: "Taiwan" },
  { name: "Bengaluru", lat: 12.97, lon: 77.59, population: 5104047, country: "India" },
  { name: "Mumbai", lat: 19.08, lon: 72.88, population: 12691836, country: "India" },
  { name: "Bangkok", lat: 13.75, lon: 100.5, population: 5104476, country: "Thailand" },
  { name: "Hong Kong", lat: 22.32, lon: 114.17, population: 7012738, country: "Hong Kong" },
  { name: "Kathmandu", lat: 27.72, lon: 85.32, population: 1442271, country: "Nepal" },
  { name: "Ulaanbaatar", lat: 47.91, lon: 106.88, population: 844818, country: "Mongolia" },
  { name: "Jakarta", lat: -6.21, lon: 106.85, population: 8540121, country: "Indonesia" },
  // --- Oceania + the far south ---
  { name: "Sydney", lat: -33.87, lon: 151.21, population: 4627345, country: "Australia" },
  { name: "Queenstown", lat: -45.03, lon: 168.66, population: 15850, country: "New Zealand" },
  { name: "Alice Springs", lat: -23.7, lon: 133.88, population: 25186, country: "Australia" }
];

/* How a reference city resolves — biome, region, density tier, settlement style and
   landmark. The snapshot test and the snapshot updater both call THIS, so the locked
   expectations can't drift from what the widget actually builds: the place object and
   the seed key here are the same ones src/scene/widget.js uses. */
export function referencePlace(c) {
  return { name: c.name, latitude: c.lat, longitude: c.lon, country: c.country, admin1: c.admin1 || "" };
}
export function referenceDensity(pop) {
  return Math.max(0, Math.min(1, (Math.log10(pop) - 3.6) / 4.2));
}
export function referenceTier(d) {
  return d < 0.2 ? "rural" : d < 0.36 ? "town" : d < 0.62 ? "city" : "metropolis";
}
export function resolveReference(c) {
  var place = referencePlace(c);
  var r = resolveScene(place, {});
  var d = sceneDensity(r, c.population);
  var s = styleForBiome(r.biome.id, seedFrom(placeKey(place)), d, r.region);
  return {
    biome: r.biome.id, region: r.region, tier: referenceTier(d),
    style: s ? s.id : null, landmark: r.landmark ? r.landmark.id : null
  };
}

export default REFERENCE_CITIES;
