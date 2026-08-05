/* browser.mjs — find a Chromium to render with, wherever we're running.

   Locally this repo runs inside a sandbox that ships Playwright and a browser at
   fixed paths; in CI, Playwright is installed normally and knows where its own
   browser lives. This resolves both without either having to care. */
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);

const SANDBOX_PLAYWRIGHT = "/opt/node22/lib/node_modules/playwright";
const SANDBOX_CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

function loadPlaywright() {
  try { return require("playwright"); } catch (e) { /* not installed here */ }
  try { return require(SANDBOX_PLAYWRIGHT); } catch (e) { /* nor there */ }
  throw new Error("Playwright not found — `npm i --no-save playwright && npx playwright install chromium`");
}

/** Launch Chromium. Uses PW_CHROME, else the sandbox browser, else Playwright's own. */
export async function launchChromium() {
  const { chromium } = loadPlaywright();
  const explicit = process.env.PW_CHROME;
  const opts = { args: ["--no-sandbox"] };
  if (explicit && fs.existsSync(explicit)) opts.executablePath = explicit;
  else if (fs.existsSync(SANDBOX_CHROME)) opts.executablePath = SANDBOX_CHROME;
  return chromium.launch(opts);
}
