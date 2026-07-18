// resolve.test.mjs — a place resolves to the right biome / landscape / landmark,
// and the temperature unit defaults to the country's convention.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveScene, unitForCountry, guessBiome } from "../src/world/resolve.js";

function place(name, country, lat, lon, extra) {
  return Object.assign({ name, country, admin1: "", latitude: lat, longitude: lon, elevation: 20 }, extra || {});
}

test("New York → city / manhattan / Statue of Liberty / Fahrenheit", () => {
  const r = resolveScene(place("New York", "United States", 40.71, -74.0));
  assert.equal(r.biome.id, "city");
  assert.equal(r.landscape.id, "manhattan");
  assert.equal(r.landmark && r.landmark.id, "liberty");
  assert.equal(r.unit, "fahrenheit");
});

test("Las Vegas → desert / sonoran / casino", () => {
  const r = resolveScene(place("Las Vegas", "United States", 36.17, -115.14, { elevation: 610 }));
  assert.equal(r.biome.id, "desert");
  assert.equal(r.landmark && r.landmark.id, "casino");
});

test("Paris → Celsius, city biome", () => {
  const r = resolveScene(place("Paris", "France", 48.85, 2.35));
  assert.equal(r.unit, "celsius");
  assert.equal(r.biome.id, "city");
});

test("Reykjavik → tundra / arctic", () => {
  const r = resolveScene(place("Reykjavik", "Iceland", 64.14, -21.9));
  assert.equal(r.biome.id, "tundra");
  assert.equal(r.landscape.id, "arctic");
});

test("options override biome + unit", () => {
  const r = resolveScene(place("Anywhere", "France", 10, 10), { biome: "jungle", temperatureUnit: "fahrenheit" });
  assert.equal(r.biome.id, "jungle");
  assert.equal(r.unit, "fahrenheit");
});

test("unitForCountry", () => {
  assert.equal(unitForCountry("United States"), "fahrenheit");
  assert.equal(unitForCountry("Japan"), "celsius");
  assert.equal(unitForCountry(""), "celsius");
});

test("guessBiome fallbacks", () => {
  assert.equal(guessBiome({ latitude: 46, elevation: 2400 }), "mountain");
  assert.equal(guessBiome({ latitude: 70, elevation: 10 }), "tundra");
  assert.equal(guessBiome({ latitude: 5, elevation: 30 }), "jungle");
});
