// version-sync.test.mjs — package.json is the source of truth; CHANGELOG.md, the
// README **Version:** line, and src/index.js VERSION must agree (SemVer).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const url = (p) => new URL(p, import.meta.url);
const version = JSON.parse(readFileSync(url("../package.json"))).version;

test("package.json version is valid SemVer", () => {
  assert.match(version, /^\d+\.\d+\.\d+([-+][0-9A-Za-z.]+)?$/);
});

test("CHANGELOG.md has a release section for the current version", () => {
  const log = readFileSync(url("../CHANGELOG.md"), "utf8");
  const esc = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.ok(new RegExp(String.raw`^##\s+\[?${esc}\]?(\s|$)`, "m").test(log),
    `CHANGELOG.md has no "## [${version}]" release section`);
});

test("src/index.js VERSION matches package.json", () => {
  const idx = readFileSync(url("../src/index.js"), "utf8");
  const m = idx.match(/VERSION\s*=\s*"([^"]+)"/);
  assert.ok(m, "src/index.js exports no VERSION string");
  assert.equal(m[1], version);
});

test("README **Version:** line matches (if present)", () => {
  const rm = readFileSync(url("../README.md"), "utf8");
  const m = rm.match(/\*\*Version:\*\*\s*([0-9][0-9A-Za-z.+-]*)/);
  if (m) assert.equal(m[1], version);
});
