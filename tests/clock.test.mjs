// clock.test.mjs — the scene's clock and the sunrise/sunset it's compared against
// have to be quoted in the same timezone.
//
// The widget used to claim `timezone: "UTC"` for any place given as bare
// coordinates. Open-Meteo then returned Los Angeles's sunrise and sunset as UTC
// wall-clock times — 13:05 and 02:55 — so sunset landed BEFORE sunrise and
// dayFactor answered 0 for every minute of the day. The scene was permanently
// night, and verify.html's day/night and live toggles could not move it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dayFactor, localTime, isoToMinutes } from "../src/engine/astronomy.js";

test("a lit stretch that wraps past midnight is still daylight", () => {
  // LA's real sunrise/sunset misreported in UTC: 13:05 and 02:55 the next day.
  const sunrise = isoToMinutes("2026-08-06T13:05");   // 785
  const sunset = isoToMinutes("2026-08-07T02:55");    // 175
  assert.ok(sunset < sunrise, "this fixture is only interesting when the day wraps");

  // Inside the wrapped lit stretch (785 → 1440 → 175) it must read as day.
  for (const now of [800, 1000, 1439, 0, 100]) {
    assert.equal(dayFactor(now, sunrise, sunset), 1, `${now} should be daylight`);
  }
  // ...and the middle of the dark stretch must still read as night.
  assert.equal(dayFactor(480, sunrise, sunset), 0, "480 is inside the dark stretch");
});

test("an ordinary day is unchanged", () => {
  const sunrise = 365, sunset = 1195;                 // 06:05 → 19:55 local
  assert.equal(dayFactor(840, sunrise, sunset), 1, "14:00 is daylight");
  assert.equal(dayFactor(60, sunrise, sunset), 0, "01:00 is night");
  assert.equal(dayFactor(365, sunrise, sunset), 1, "sunrise itself is lit");
  assert.equal(dayFactor(1195, sunrise, sunset), 1, "sunset itself is lit");
  // twilight ramps down on both sides rather than snapping
  assert.ok(dayFactor(340, sunrise, sunset) > 0 && dayFactor(340, sunrise, sunset) < 1);
  assert.ok(dayFactor(1220, sunrise, sunset) > 0 && dayFactor(1220, sunrise, sunset) < 1);
});

test("twilight is measured the short way round the clock", () => {
  // 23:59 is two minutes from a 00:01 sunrise, not 1438.
  const f = dayFactor(1439, 1, 700);
  assert.ok(f > 0.9, `expected near-daylight just before a 00:01 sunrise, got ${f}`);
});

test("the day/night toggle's two fixed hours land on opposite sides", () => {
  // verify.html pins the clock to 14:00 for day and 01:00 for night.
  const sunrise = 365, sunset = 1195;
  assert.equal(dayFactor(840, sunrise, sunset), 1);
  assert.equal(dayFactor(60, sunrise, sunset), 0);
});

test("localTime honours an explicit override whatever the zone", () => {
  for (const tz of ["America/Los_Angeles", "UTC", null, undefined]) {
    assert.equal(localTime(tz, 840).minutes, 840);
    assert.equal(localTime(tz, 60).minutes, 60);
  }
});

test("localTime with no zone reads a real clock rather than throwing", () => {
  const t = localTime(null);
  assert.ok(t.minutes >= 0 && t.minutes < 1440, `minutes out of range: ${t.minutes}`);
  assert.ok(t.year > 2000, `year looks wrong: ${t.year}`);
});
