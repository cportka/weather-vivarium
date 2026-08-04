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
