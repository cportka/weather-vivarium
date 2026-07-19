// cities-count.test.mjs — keep the advertised city count in sync with the data.
// The README states a precomputed city total; this asserts it equals the unique
// union of the shipped datasets, and that each dataset's `count` matches its rows.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const url = (p) => new URL(p, import.meta.url);
const world = JSON.parse(readFileSync(url("../data/cities/world.json"), "utf8"));
const us = JSON.parse(readFileSync(url("../data/cities/us.json"), "utf8"));
const readme = readFileSync(url("../README.md"), "utf8");

function unionSize() {
  const seen = new Set();
  for (const c of us.cities) seen.add((c.name + "|US").toLowerCase());
  for (const c of world.cities) seen.add((c.name + "|" + c.cc).toLowerCase());
  return seen.size;
}
const fmt = (n) => n.toLocaleString("en-US");

test("each dataset's count matches its rows", () => {
  assert.equal(world.cities.length, world.count, "world.json count vs rows");
  assert.equal(us.cities.length, us.count, "us.json count vs rows");
});

test("README **Cities:** equals the unique precomputed union", () => {
  const m = readme.match(/\*\*Cities:\*\*\s*([\d,]+)/);
  assert.ok(m, "README has no '**Cities:** N' line");
  const stated = parseInt(m[1].replace(/,/g, ""), 10);
  assert.equal(stated, unionSize(), "README Cities total vs computed union");
});

test("README mentions the world + US dataset sizes", () => {
  assert.ok(readme.includes(fmt(world.count)), `README should mention world count ${fmt(world.count)}`);
  assert.ok(readme.includes(String(us.count)), `README should mention US count ${us.count}`);
  assert.ok(readme.includes(fmt(unionSize())), `README should mention the union ${fmt(unionSize())}`);
});
