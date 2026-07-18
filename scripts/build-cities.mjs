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

function main() {
  const args = process.argv.slice(2);
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
  mkdirSync(OUT_DIR, { recursive: true });
  const db = {
    generatedBy: "scripts/build-cities.mjs",
    source,
    country: "US",
    count: cities.length,
    cities
  };
  const outPath = path.join(OUT_DIR, "us.json");
  writeFileSync(outPath, JSON.stringify(db, null, 0) + "\n");
  // a quick summary
  const byBiome = {};
  for (const c of cities) byBiome[c.biome] = (byBiome[c.biome] || 0) + 1;
  console.log(`Wrote ${outPath}: ${cities.length} US cities`);
  console.log("By biome:", JSON.stringify(byBiome));
  const withLandmark = cities.filter((c) => c.landmark).length;
  console.log(`With a landmark: ${withLandmark}/${cities.length}`);
}

main();
