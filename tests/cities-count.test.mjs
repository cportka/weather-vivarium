// cities-count.test.mjs — keep the advertised city count in sync with the data.
// The README states a precomputed city total; this asserts it equals the sum of
// the two shipped datasets, which are disjoint by country (world.json holds the
// top cities OUTSIDE the US; us.json holds the top US cities), so the sum has no
// double-counting. Also checks each dataset's `count` matches its rows.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodeCities, cityCount } from "../src/data/cities.js";

const url = (p) => new URL(p, import.meta.url);
const world = JSON.parse(readFileSync(url("../data/cities/world.json"), "utf8"));
const us = JSON.parse(readFileSync(url("../data/cities/us.json"), "utf8"));
const readme = readFileSync(url("../README.md"), "utf8");

const worldCities = decodeCities(world), usCities = decodeCities(us);
const total = () => cityCount(us) + cityCount(world);
const fmt = (n) => n.toLocaleString("en-US");

test("each dataset's count matches its rows", () => {
  assert.equal(worldCities.length, world.count, "world.json count vs rows");
  assert.equal(usCities.length, us.count, "us.json count vs rows");
});

test("the compact datasets decode into complete records", () => {
  for (const [label, list] of [["world", worldCities], ["us", usCities]]) {
    const c = list[0];
    assert.ok(c && c.name && typeof c.lat === "number" && typeof c.lon === "number",
      `${label}.json first row should decode to a real city`);
    assert.ok(c.tz && c.biome && c.unit, `${label}.json row should carry tz/biome/unit`);
  }
});

test("the datasets are disjoint by country (no US in world.json)", () => {
  assert.ok(!worldCities.some((c) => c.cc === "US"), "world.json must not contain US cities");
});

test("README **Cities:** equals the US + world total", () => {
  const m = readme.match(/\*\*Cities:\*\*\s*([\d,]+)/);
  assert.ok(m, "README has no '**Cities:** N' line");
  const stated = parseInt(m[1].replace(/,/g, ""), 10);
  assert.equal(stated, total(), "README Cities total vs us + world");
});

test("README mentions the world + US dataset sizes", () => {
  assert.ok(readme.includes(fmt(world.count)), `README should mention world count ${fmt(world.count)}`);
  assert.ok(readme.includes(fmt(us.count)), `README should mention US count ${fmt(us.count)}`);
  assert.ok(readme.includes(fmt(total())), `README should mention the total ${fmt(total())}`);
});

test("metro-aware density: suburbs are lifted, cores and standalone towns are not", () => {
  const find = (list, name, admin) => list.find((c) => c.name === name && (!admin || c.admin === admin));

  // Chicago's commuter belt lifts Naperville; Chicago itself IS the core.
  const naperville = find(usCities, "Naperville", "IL");
  assert.ok(naperville, "Naperville IL should be in us.json");
  assert.ok(naperville.density != null && naperville.density >= 0.38,
    `Naperville should carry a metro-lifted density, got ${naperville.density}`);
  assert.equal(find(usCities, "Chicago", "IL").density, null, "a metro core needs no lift");

  // a standalone town far from any bigger core keeps the population formula
  const iowaCity = find(usCities, "Iowa City", "IA");
  if (iowaCity) assert.equal(iowaCity.density, null, "Iowa City has no bigger neighbour to lift it");

  // the pass moved a real share of the dataset, not a handful
  const lifted = usCities.filter((c) => c.density != null);
  assert.ok(lifted.length > 2000, `expected thousands of lifted US suburbs, got ${lifted.length}`);
  for (const c of lifted) {
    assert.ok(c.density >= 0.15 && c.density <= 1, `${c.name}: stored density ${c.density} out of range`);
  }
});

test("the Naperville reference row's hand-set density matches the dataset", async () => {
  // resolveReference honours an explicit density on a reference row; this pins the
  // hand-set value to what the build actually computed so the two can't drift.
  const { REFERENCE_CITIES } = await import("../verify/reference-cities.mjs");
  const ref = REFERENCE_CITIES.find((c) => c.name === "Naperville");
  assert.ok(ref, "Naperville should be a reference city");
  const row = usCities.find((c) => c.name === "Naperville" && c.admin === "IL");
  assert.equal(ref.density, row.density,
    `reference density ${ref.density} vs dataset ${row.density} — regenerate one of them`);
});
