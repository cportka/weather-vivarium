#!/usr/bin/env node
/* =========================================================================
   build-cities.mjs — build the city database.

   Reads a curated raw list (data/cities/us-seed.raw.json) — or, in future, a
   GeoNames dump — resolves each place through the same engine the widget uses
   (resolveScene + catalog pools), and writes the enriched lookup to
   data/cities/us.json. Each record carries the biome/landscape/landmark/category
   and the count of content available there, so a city can render from only its
   current weather.

   Usage:
     node scripts/build-cities.mjs                       # from the curated seed
     node scripts/build-cities.mjs --geonames US.txt     # (future) GeoNames P-class TSV
   ========================================================================= */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { resolveScene } from "../src/world/resolve.js";
import { pools } from "../src/catalog/index.js";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUT_DIR = path.join(ROOT, "data", "cities");

function category(res, pop) {
  const b = res.biome.id;
  if (b === "coast" || b === "ocean") return "beach";
  if (b === "city" || pop >= 250000) return "urban";
  if (b === "mountain") return "mountain";
  if (b === "desert") return "desert";
  if (b === "wetland" || b === "lake") return "waterside";
  if (pop < 15000) return "rural";
  return "town";
}

function contentCounts(biomeId) {
  const p = pools(biomeId);
  return {
    trees: p.trees.length,
    vehicles: p.roadVehicles.length + p.waterVehicles.length,
    people: p.people.length,
    animals: p.groundAnimals.length + p.waterAnimals.length + p.airAnimals.length,
    birds: p.birds.length,
    signs: p.signs.length
  };
}

function enrich(name, state, lat, lon, tz, elevation, population) {
  const place = { name, admin1: state, country: "United States", latitude: lat, longitude: lon, timezone: tz, elevation, population };
  const res = resolveScene(place);
  return {
    name, state, country: "United States", lat, lon, tz, elevation, population,
    biome: res.biome.id, landscape: res.landscape.id,
    landmark: res.landmark ? res.landmark.id : null,
    category: category(res, population), unit: res.unit,
    content: contentCounts(res.biome.id)
  };
}

function fromSeed() {
  const raw = JSON.parse(readFileSync(path.join(OUT_DIR, "us-seed.raw.json"), "utf8"));
  return raw.rows.map((r) => enrich(r[0], r[1], r[2], r[3], r[4], r[5], r[6]));
}

// Countries that conventionally use Fahrenheit, by ISO2 code.
var FAHRENHEIT_CC = new Set(["US", "BS", "BZ", "KY", "LR", "PW", "FM", "MH", "PR", "GU", "VI", "AS"]);

// Build from the bundled `all-the-cities` dataset (GeoNames, pop >= 1000, MIT):
// take the top `limit` by population and enrich each. Timezone comes from
// `tz-lookup` (offline). Dependencies are loaded lazily so the default seed
// build stays dependency-free.
async function fromAllTheCities(limit, opts) {
  opts = opts || {};
  const allCities = (await import("all-the-cities")).default;
  const tzlookup = (await import("tz-lookup")).default;
  let pool = allCities;
  if (opts.only) pool = pool.filter((c) => c.country === opts.only);
  if (opts.exclude) pool = pool.filter((c) => c.country !== opts.exclude);
  const top = pool
    .slice()
    .sort((a, b) => b.population - a.population)
    .slice(0, limit);
  const out = [];
  for (const c of top) {
    const lat = c.loc.coordinates[1], lon = c.loc.coordinates[0];
    let tz = "UTC";
    try { tz = tzlookup(lat, lon); } catch (e) { /* rare coords miss → UTC */ }
    const unit = FAHRENHEIT_CC.has(c.country) ? "fahrenheit" : "celsius";
    const place = { name: c.name, admin1: c.adminCode || "", country: c.country, latitude: lat, longitude: lon, elevation: 0, featureCode: c.featureCode, population: c.population };
    const res = resolveScene(place, { temperatureUnit: unit });
    out.push({
      name: c.name, cc: c.country, admin: c.adminCode || "", lat: Math.round(lat * 1000) / 1000, lon: Math.round(lon * 1000) / 1000,
      tz, population: c.population, biome: res.biome.id, landscape: res.landscape.id,
      landmark: res.landmark ? res.landmark.id : null, category: category(res, c.population), unit
    });
  }
  return out;
}

// Parse a GeoNames "cities" TSV (feature class P). Columns are documented at
// https://download.geonames.org/export/dump/readme.txt
function fromGeonames(file, countryFilter) {
  const lines = readFileSync(file, "utf8").split("\n");
  const out = [];
  for (const line of lines) {
    if (!line) continue;
    const c = line.split("\t");
    if (countryFilter && c[8] !== countryFilter) continue;
    const pop = parseInt(c[14], 10) || 0;
    const elev = parseInt(c[15], 10) || parseInt(c[16], 10) || 0;
    out.push(enrich(c[1], c[10] || "", parseFloat(c[4]), parseFloat(c[5]), c[17] || "UTC", elev, pop));
  }
  return out;
}

// Columns whose values repeat heavily across rows — dictionary-encode them so a
// row stores a small integer instead of the same string tens of thousands of
// times. (`name` is near-unique, `lat`/`lon`/`population` are numbers: left raw.)
const DICT_FIELDS = ["cc", "admin", "tz", "biome", "landscape", "landmark", "category", "unit"];

/** Pack rows into the compact columnar form src/data/cities.js reads. */
function packCities(cities) {
  const fields = ["name", "cc", "admin", "lat", "lon", "tz", "population", "biome", "landscape", "landmark", "category", "unit"]
    .filter((f) => cities.some((c) => c[f] !== undefined));
  const dicts = {}, index = {};
  for (const f of fields) {
    if (!DICT_FIELDS.includes(f)) continue;
    dicts[f] = []; index[f] = new Map();
  }
  const rows = cities.map((c) => fields.map((f) => {
    const v = c[f] === undefined ? null : c[f];
    if (!index[f]) return v;                       // raw column
    if (v == null) return null;
    let i = index[f].get(v);
    if (i === undefined) { i = dicts[f].length; dicts[f].push(v); index[f].set(v, i); }
    return i;
  }));
  return { fields, dicts, rows };
}

function summarize(outPath, cities) {
  const byBiome = {};
  for (const c of cities) byBiome[c.biome] = (byBiome[c.biome] || 0) + 1;
  console.log(`Wrote ${outPath}: ${cities.length} cities`);
  console.log("By biome:", JSON.stringify(byBiome));
  console.log(`With a landmark: ${cities.filter((c) => c.landmark).length}/${cities.length}`);
}

async function main() {
  const args = process.argv.slice(2);
  mkdirSync(OUT_DIR, { recursive: true });

  // --world [limit]: build data/cities/world.json from the top cities worldwide.
  const wi = args.indexOf("--world");
  if (wi !== -1) {
    const limit = parseInt(args[wi + 1], 10) || 1000;
    // World = the top cities OUTSIDE the US, so world.json and us.json are
    // disjoint (US is covered fully by us.json) and their union is exactly the
    // sum. Keeps the advertised total honest and avoids duplicate tiles.
    const cities = await fromAllTheCities(limit, { exclude: "US" });
    cities.sort((a, b) => b.population - a.population);
    const outPath = path.join(OUT_DIR, "world.json");
    writeFileSync(outPath, JSON.stringify({
      generatedBy: "scripts/build-cities.mjs --world " + limit,
      source: "all-the-cities (GeoNames, pop>=1000, CC BY 4.0 — geonames.org)",
      note: "top cities outside the US (US cities live in us.json)",
      count: cities.length, ...packCities(cities)
    }, null, 0) + "\n");
    summarize(outPath, cities);
    return;
  }

  // --us-top [limit]: build data/cities/us.json from the top US cities by
  // population (from `all-the-cities`), same enriched schema as --world.
  const ui = args.indexOf("--us-top");
  if (ui !== -1) {
    const limit = parseInt(args[ui + 1], 10) || 5000;
    const cities = await fromAllTheCities(limit, { only: "US" });
    cities.sort((a, b) => b.population - a.population);
    const outPath = path.join(OUT_DIR, "us.json");
    writeFileSync(outPath, JSON.stringify({
      generatedBy: "scripts/build-cities.mjs --us-top " + limit,
      source: "all-the-cities (GeoNames, pop>=1000, CC BY 4.0 — geonames.org)",
      country: "US", count: cities.length, ...packCities(cities)
    }, null, 0) + "\n");
    summarize(outPath, cities);
    return;
  }

  // Default / --geonames: the US database from the curated seed.
  let cities, source;
  const gi = args.indexOf("--geonames");
  if (gi !== -1 && args[gi + 1]) {
    cities = fromGeonames(args[gi + 1], "US");
    source = "geonames:" + path.basename(args[gi + 1]) + " (CC BY 4.0 — geonames.org)";
  } else {
    cities = fromSeed();
    source = "curated seed (data/cities/us-seed.raw.json)";
  }
  cities.sort((a, b) => b.population - a.population);
  const outPath = path.join(OUT_DIR, "us.json");
  writeFileSync(outPath, JSON.stringify({
    generatedBy: "scripts/build-cities.mjs", source, country: "US", count: cities.length, ...packCities(cities)
  }, null, 0) + "\n");
  summarize(outPath, cities);
}

main().catch((e) => { console.error(e); process.exit(1); });
