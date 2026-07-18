// catalog.test.mjs — the catalog meets the breadth targets and every entry is
// well-formed (unique id, valid biomes, a draw function, a sane anchor).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CATALOG, counts } from "../src/catalog/index.js";
import { LANDMARKS } from "../src/catalog/landmarks.js";
import { BIOME_IDS } from "../src/world/biomes.js";
import { LANDSCAPE_IDS } from "../src/world/landscapes.js";

// Explicit breadth targets (the project's stated goals).
const TARGETS = { trees: 20, vehicles: 50, people: 20, animals: 40, birds: 10, signs: 10 };

test("catalog meets breadth targets", () => {
  const c = counts();
  for (const [cat, min] of Object.entries(TARGETS)) {
    assert.ok(c[cat] >= min, `${cat}: have ${c[cat]}, need >= ${min}`);
  }
});

test("at least 10 landmarks, 10 biomes, 20 landscapes", () => {
  assert.ok(LANDMARKS.length >= 10, `landmarks: ${LANDMARKS.length}`);
  assert.ok(BIOME_IDS.length >= 10, `biomes: ${BIOME_IDS.length}`);
  assert.ok(LANDSCAPE_IDS.length >= 20, `landscapes: ${LANDSCAPE_IDS.length}`);
});

const VALID_BIOMES = new Set(BIOME_IDS);
const ALL = { ...CATALOG, landmarks: LANDMARKS };

for (const [cat, list] of Object.entries(ALL)) {
  test(`${cat}: entries are well-formed and ids unique`, () => {
    const seen = new Set();
    for (const e of list) {
      assert.ok(e && typeof e.id === "string" && e.id, `${cat} entry missing id`);
      assert.ok(!seen.has(e.id), `${cat} duplicate id: ${e.id}`);
      seen.add(e.id);
      assert.ok(typeof e.name === "string" && e.name, `${e.id}: missing name`);
      assert.equal(typeof e.draw, "function", `${e.id}: draw is not a function`);
      assert.ok(Number.isFinite(e.w) && Number.isFinite(e.h), `${e.id}: bad w/h`);
      const anchor = e.anchor || "baseline";
      assert.ok(anchor === "baseline" || anchor === "center", `${e.id}: bad anchor ${anchor}`);
      if (e.biomes) for (const b of e.biomes) assert.ok(VALID_BIOMES.has(b), `${e.id}: unknown biome ${b}`);
    }
  });
}
