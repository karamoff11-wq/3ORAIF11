#!/bin/bash
set -e

echo "=== Running OpenNext Cloudflare Build ==="
npx @opennextjs/cloudflare@1.19.10 build

echo "=== Contents of .open-next ==="
ls -la .open-next/

echo "=== Copying worker.js to _worker.js ==="
if [ -f ".open-next/worker.js" ]; then
  cp .open-next/worker.js .open-next/_worker.js
  echo "SUCCESS: _worker.js created"
else
  echo "ERROR: worker.js not found in .open-next/"
  ls -la .open-next/
  exit 1
fi

echo "=== Final .open-next contents ==="
ls -la .open-next/
echo "=== Build complete ==="
