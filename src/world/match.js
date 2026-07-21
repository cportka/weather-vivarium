/* match.js — shared whole-word/phrase matching for city-name lookups.

   Used by both the landscape resolver and the landmark picker so a curated city
   entry only matches a place when it appears as a whole word/phrase — "reno"
   matches "Reno" but never "g[reno]ble", while shortenings like "new york" still
   match "New York City". Kept separate to avoid a resolve ↔ landmarks import cycle. */

function isBound(ch) {
  return ch === undefined || ch === " " || ch === "-" || ch === "," || ch === "'" || ch === ".";
}

/** `needle` occurs in `hay` bounded by string ends or separators. */
export function phraseIn(hay, needle) {
  if (!needle || !hay) return false;
  var i = hay.indexOf(needle);
  while (i !== -1) {
    if (isBound(hay[i - 1]) && isBound(hay[i + needle.length])) return true;
    i = hay.indexOf(needle, i + 1);
  }
  return false;
}

/** True when a curated `city` entry names this place (as a whole phrase). `name`
 *  is the normalized place name, `full` is name + " " + admin. */
export function cityNames(city, name, full) {
  return name === city || phraseIn(full, city) || phraseIn(city, name);
}
