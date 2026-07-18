/* Animal catalog — reference animals plus fanned-out batches
   (large/farm mammals, exotic mammals, sea life, small critters + insects). */
import core from "./parts/animals-core.js";
import a from "./parts/animals-a.js";
import b from "./parts/animals-b.js";
import c from "./parts/animals-c.js";
import d from "./parts/animals-d.js";
export default [].concat(core, a, b, c, d);
