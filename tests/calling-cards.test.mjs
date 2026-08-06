// calling-cards.test.mjs — a place's calling card must actually be castable.
//
// A calling card names the first character a city sends out (Los Angeles opens with
// the beachgoer, Nairobi with a giraffe). The compositor skips silently if the id
// isn't in the pool, so a typo would just quietly do nothing — this catches that.
import { test } from "node:test";
import assert from "node:assert/strict";
import { callingCardFor, resolveScene } from "../src/world/resolve.js";
import { CATALOG, byLayer, pools } from "../src/catalog/index.js";

const ids = {
  person: new Set(CATALOG.people.map((e) => e.id)),
  nightPerson: new Set(CATALOG.people.map((e) => e.id)),
  bird: new Set(CATALOG.birds.map((e) => e.id)),
  ground: new Set(byLayer(CATALOG.animals, "ground").map((e) => e.id)),
  water: new Set(byLayer(CATALOG.animals, "water").map((e) => e.id))
};
const SLOTS = ["person", "nightPerson", "ground", "bird", "water"];

// Places that should have a calling card, and the slot + id it should name.
const EXPECT = [
  { place: { name: "Los Angeles", latitude: 34.05, longitude: -118.24 }, slot: "person", id: "beachgoer" },
  { place: { name: "Los Angeles", latitude: 34.05, longitude: -118.24 }, slot: "nightPerson", id: "beach-cat" },
  { place: { name: "Santa Monica", latitude: 34.02, longitude: -118.49 }, slot: "person", id: "beachgoer" },
  { place: { name: "Nairobi", latitude: -1.29, longitude: 36.82 }, slot: "ground", id: "giraffe" },
  { place: { name: "Cusco", latitude: -13.53, longitude: -71.97 }, slot: "ground", id: "llama" },
  { place: { name: "New Orleans", latitude: 29.95, longitude: -90.07 }, slot: "person", id: "street-musician" },
  { place: { name: "Sydney", latitude: -33.87, longitude: 151.21 }, slot: "person", id: "surfer" },
  { place: { name: "Alice Springs", latitude: -23.7, longitude: 133.88 }, slot: "ground", id: "kangaroo" },
  { place: { name: "Honolulu", latitude: 21.31, longitude: -157.86 }, slot: "person", id: "surfer" },
  { place: { name: "Reykjavík", latitude: 64.15, longitude: -21.94 }, slot: "bird", id: "gull" },
  { place: { name: "Aspen", latitude: 39.19, longitude: -106.82 }, slot: "person", id: "skier" },
  { place: { name: "Kyoto", latitude: 35.01, longitude: 135.77 }, slot: "person", id: "monk" }
];

test("every calling card names a sprite that exists", () => {
  for (const { place } of EXPECT) {
    const card = callingCardFor(place);
    assert.ok(card, `${place.name} should have a calling card`);
    for (const slot of SLOTS) {
      if (!card[slot]) continue;
      assert.ok(ids[slot].has(card[slot]),
        `${place.name}: ${slot} "${card[slot]}" is not in the catalog`);
    }
  }
});

test("the named calling cards resolve for their city", () => {
  for (const { place, slot, id } of EXPECT) {
    const card = callingCardFor(place);
    assert.equal(card[slot], id, `${place.name} should lead with ${slot} ${id}`);
  }
});

test("a calling card is castable in its city's own biome", () => {
  const poolFor = { person: "people", nightPerson: "people", ground: "groundAnimals",
    bird: "birds", water: "waterAnimals" };
  for (const { place, slot, id } of EXPECT) {
    const res = resolveScene(place, {});
    const pool = pools(res.biome.id)[poolFor[slot]];
    assert.ok(pool.some((e) => e.id === id),
      `${place.name} resolves to biome "${res.biome.id}", where ${slot} "${id}" can't appear`);
  }
});

test("resolveScene exposes the calling card", () => {
  const res = resolveScene({ name: "Los Angeles", latitude: 34.05, longitude: -118.24 }, {});
  assert.ok(res.callingCard && res.callingCard.person === "beachgoer");
  const none = resolveScene({ name: "Nowheresville", latitude: 10, longitude: 10 }, {});
  assert.equal(none.callingCard, null, "an ordinary place has no calling card");
});
