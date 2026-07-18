/* landmarks.js — the landmark catalog + the picker that gives a place its
   signature feature (or nothing, when no known landmark fits). */
import core from "./parts/landmarks-core.js";
import a from "./parts/landmarks-a.js";

export var LANDMARKS = [].concat(core, a);

export function getLandmark(id) {
  for (var i = 0; i < LANDMARKS.length; i++) if (LANDMARKS[i].id === id) return LANDMARKS[i];
  return null;
}

function normalize(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/**
 * Choose a landmark for a place. City-name match wins (loose substring, either
 * direction), then a landscape-signature match. Returns the entry or null — a
 * landmark is only shown when the place genuinely has one.
 */
export function pickLandmark(place, landscape) {
  var name = normalize(place && place.name);
  var full = normalize((place && place.name) + " " + (place && place.admin1));
  if (name) {
    for (var i = 0; i < LANDMARKS.length; i++) {
      var lm = LANDMARKS[i];
      if (!lm.cities) continue;
      for (var c = 0; c < lm.cities.length; c++) {
        var city = lm.cities[c];
        if (name.indexOf(city) !== -1 || city.indexOf(name) !== -1 || full.indexOf(city) !== -1) return lm;
      }
    }
  }
  if (landscape) {
    for (var j = 0; j < LANDMARKS.length; j++) {
      var l2 = LANDMARKS[j];
      if (l2.landscapes && l2.landscapes.indexOf(landscape.id) !== -1) return l2;
    }
  }
  return null;
}
