#!/bin/bash
set -e

echo "=== Environment Info ==="
node -v
npm -v

echo "=== Running OpenNext Cloudflare Build ==="
# Using npx directly to ensure we use the right version
npx @opennextjs/cloudflare@1.19.10 build

echo "=== Creating _worker.js ==="
if [ -f ".open-next/worker.js" ]; then
  cp .open-next/worker.js .open-next/_worker.js
  echo "SUCCESS: _worker.js created in .open-next/"
else
  echo "ERROR: .open-next/worker.js not found!"
  find .open-next -maxdepth 2
  exit 1
fi

echo "=== Build Complete Structure ==="
ls -F .open-next/

