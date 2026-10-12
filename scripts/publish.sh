#!/bin/bash
# Build to a temp dir, then publish into live dist/ without a broken window:
# new hashed assets are copied first, index.html is swapped last with an atomic rename.
set -e
cd "$(dirname "$0")/.."
TMP=$(mktemp -d /tmp/gldt_build.XXXX)
npx vite build --outDir "$TMP" --emptyOutDir >/tmp/gldt_build.log 2>&1 || { cat /tmp/gldt_build.log; exit 1; }
test -s "$TMP/index.html" || { echo "no index.html"; exit 1; }
mkdir -p dist/assets
cp -a "$TMP/assets/." dist/assets/
( cd "$TMP" && find . -type f ! -path './assets/*' ! -name index.html -exec cp -a --parents {} ../../"$OLDPWD"/dist/ \; ) 2>/dev/null || true
for f in $(cd "$TMP" && find . -type f ! -path './assets/*' ! -name index.html); do mkdir -p "dist/$(dirname "$f")"; cp -a "$TMP/$f" "dist/$f"; done
cp "$TMP/index.html" dist/.index.html.new && mv -f dist/.index.html.new dist/index.html
# prune assets not referenced by the live index and older than 2 hours (old tabs keep working meanwhile)
for a in dist/assets/*; do n=$(basename "$a"); grep -q "$n" dist/index.html || { [ -n "$(find "$a" -mmin +120)" ] && rm -f "$a"; }; done
rm -rf "$TMP"; echo "published $(grep -o 'assets/index-[^"]*\.js' dist/index.html)"
