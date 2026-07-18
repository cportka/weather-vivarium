#!/usr/bin/env bash
#
# run-tests.sh — test suite for weather-vivarium (Portka standard).
#
# 1. Version sync: package.json is the source of truth; CHANGELOG.md, the README
#    **Version:** line (if present), and src/index.js VERSION must all agree, and
#    the version must be valid SemVer.
# 2. Syntax: every module under src/ (and tests/, verify/, scripts/) parses.
# 3. Unit tests: the node:test suite in tests/ (catalog breadth, resolver, and a
#    stub-painter render of every catalog entry so broken sprites fail CI).
#
# Usage:  bash tests/run-tests.sh   (or: npm test)
# Exit:   0 if nothing FAILed, 1 otherwise.

set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || { echo "cannot cd to repo root: $ROOT" >&2; exit 1; }

PASS=0; FAIL=0
pass() { printf '  \033[32mPASS\033[0m  %s\n' "$1"; PASS=$((PASS + 1)); }
fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; FAIL=$((FAIL + 1)); }
section() { printf '\n\033[1m%s\033[0m\n' "$1"; }

have_node=1; command -v node >/dev/null 2>&1 || have_node=0

# --- 1. version sync ------------------------------------------------------------------
section "Versioning — SemVer + sync (package.json / CHANGELOG / README / src)"
PKG_VER=""
if [[ $have_node -eq 1 ]]; then
  PKG_VER="$(node -e 'try{process.stdout.write(String(require("./package.json").version||""))}catch(e){}' 2>/dev/null)"
fi
if [[ -z "$PKG_VER" ]]; then
  fail "package.json version not found"
elif [[ "$PKG_VER" =~ ^[0-9]+\.[0-9]+\.[0-9]+([-+][0-9A-Za-z.]+)?$ ]]; then
  pass "package.json version is valid SemVer: $PKG_VER"
else
  fail "package.json version is not valid SemVer: '$PKG_VER'"
fi

if [[ -f CHANGELOG.md ]]; then
  if grep -qE "^##[[:space:]]+\[?${PKG_VER//./\\.}\]?([[:space:]]|\$)" CHANGELOG.md; then
    pass "CHANGELOG.md has a release section for $PKG_VER"
  else
    fail "CHANGELOG.md has no '## [$PKG_VER]' release section"
  fi
else
  fail "CHANGELOG.md missing"
fi

if [[ -f README.md ]] && grep -qE '\*\*Version:\*\*' README.md; then
  if grep -qF "**Version:** $PKG_VER" README.md; then
    pass "README **Version:** line matches ($PKG_VER)"
  else
    fail "README **Version:** line disagrees with package.json ($PKG_VER)"
  fi
fi

if [[ -f src/index.js ]]; then
  SRC_VER="$(grep -oE 'VERSION[[:space:]]*=[[:space:]]*"[0-9][^"]*"' src/index.js | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+[0-9A-Za-z.+-]*')"
  if [[ "$SRC_VER" == "$PKG_VER" ]]; then
    pass "src/index.js VERSION matches ($SRC_VER)"
  else
    fail "src/index.js VERSION ($SRC_VER) != package.json ($PKG_VER)"
  fi
fi

# --- 2. syntax ------------------------------------------------------------------------
section "Syntax — every module parses"
if [[ $have_node -eq 1 ]]; then
  BAD=""
  while IFS= read -r f; do
    node --check "$f" 2>/tmp/wv_synerr || BAD="$BAD\n    $f: $(head -1 /tmp/wv_synerr)"
  done < <(find src tests verify scripts -type f \( -name '*.js' -o -name '*.mjs' \) 2>/dev/null | sort)
  if [[ -z "$BAD" ]]; then pass "all modules parse"; else fail "syntax errors:$BAD"; fi
  rm -f /tmp/wv_synerr
else
  fail "node absent — cannot syntax-check"
fi

# --- 3. node:test unit suite ----------------------------------------------------------
section "Unit tests (node --test)"
if [[ $have_node -eq 1 ]]; then
  if node --test >/tmp/wv_test.log 2>&1; then
    grep -E '^# (tests|pass|fail)' /tmp/wv_test.log | sed 's/^/    /'
    pass "node --test suite green"
  else
    tail -40 /tmp/wv_test.log | sed 's/^/    /'
    fail "node --test suite has failures"
  fi
  rm -f /tmp/wv_test.log
else
  fail "node absent — cannot run unit tests"
fi

# --- summary --------------------------------------------------------------------------
printf '\nSummary: %d passed, %d failed\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]]
