// reference-cities.test.mjs — the 50-city gate.
//
// `verify/reference-cities.mjs` is the standing, deliberately diverse set we judge
// every change against (see verify/out/reference-50.png). This test locks in how
// each one resolves — biome, cultural region, density tier, settlement style and
// landmark — so a tweak to the resolver, the region map or the style tables can't
// quietly change a reference city without someone noticing.
//
// When a change to one of them IS intended, regenerate the snapshot:
//   node scripts/update-reference-snapshot.mjs
// and eyeball verify/out/reference-50.png before committing it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { REFERENCE_CITIES, resolveReference, referenceDensity, referenceTier } from "../verify/reference-cities.mjs";

const snapshot = JSON.parse(readFileSync(new URL("./reference-cities.snapshot.json", import.meta.url), "utf8"));

const density = referenceDensity;
const tierName = referenceTier;

const resolveRef = resolveReference;

test("the reference set is 50+ diverse cities", () => {
  assert.ok(REFERENCE_CITIES.length >= 50, `expected at least 50 reference cities, got ${REFERENCE_CITIES.length}`);
  const names = REFERENCE_CITIES.map((c) => c.name);
  assert.equal(new Set(names).size, names.length, "reference city names must be unique");
  const biomes = new Set(REFERENCE_CITIES.map((c) => resolveRef(c).biome));
  assert.ok(biomes.size >= 8, `reference set should span many biomes, got ${[...biomes].join(",")}`);
  const tiers = new Set(REFERENCE_CITIES.map((c) => tierName(density(c.population))));
  for (const t of ["rural", "town", "city", "metropolis"]) {
    assert.ok(tiers.has(t), `reference set should include a ${t} place`);
  }
});

test("every reference city resolves exactly as locked in", () => {
  const drift = [];
  for (const c of REFERENCE_CITIES) {
    const want = snapshot.cities[c.name];
    assert.ok(want, `no snapshot entry for ${c.name} — regenerate the snapshot`);
    const got = resolveRef(c);
    for (const k of ["biome", "region", "tier", "style", "landmark"]) {
      if (got[k] !== want[k]) drift.push(`${c.name}.${k}: ${want[k]} → ${got[k]}`);
    }
  }
  assert.deepEqual(drift, [], "reference cities changed:\n  " + drift.join("\n  "));
});

test("every reference city can actually be built", () => {
  for (const c of REFERENCE_CITIES) {
    const { style, biome } = resolveRef(c);
    // Open water is the one place with nothing to build on; everywhere else a
    // place must have some architecture to draw, or it renders as an empty lot.
    if (biome === "coast" || biome === "ocean") continue;
    assert.ok(style, `${c.name} (${biome}) resolved to no settlement style`);
  }
});
