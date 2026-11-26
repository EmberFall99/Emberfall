#!/usr/bin/env bash
# Compile the game with Microsoft's MakeCode Arcade compiler, to catch errors before pushing.
# First time only:  (cd tools && npm install)
# Then, from anywhere:  bash tools/compile_check.sh
set -euo pipefail
TOOLS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$TOOLS")"
BUILD="$TOOLS/.build"
rm -rf "$BUILD"; mkdir -p "$BUILD"
cp "$ROOT"/pxt.json "$ROOT"/*.ts "$ROOT"/images.g.jres "$ROOT"/README.md "$BUILD"/
echo '{ "dependencies": { "pxt-arcade": "4.2.1" } }' > "$BUILD/package.json"
ln -s "$TOOLS/node_modules" "$BUILD/node_modules"
cd "$BUILD"
npx pxt install > install.log 2>&1
npx pxt build > build.log 2>&1 || true
if grep -iE "error" build.log; then echo "COMPILE ERRORS - see tools/.build/build.log"; exit 1; fi
echo "Compiled OK"
