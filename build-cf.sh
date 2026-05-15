#!/bin/bash
# Trigger fresh build with correct dependencies
set -e

echo "🚀 [1/3] Cleaning previous builds..."
rm -rf .open-next

echo "📦 [2/3] Building with OpenNext..."
npx @opennextjs/cloudflare@latest build

echo "🔧 [3/3] Preparing Cloudflare Pages structure..."
if [ -f ".open-next/worker.js" ]; then
  # Move worker to its expected location for Cloudflare Pages
  cp .open-next/worker.js .open-next/_worker.js
  echo "✅ _worker.js created."
else
  echo "❌ ERROR: worker.js not found in .open-next/"
  exit 1
fi

# Ensure static assets are at the root level if they aren't already
if [ -d ".open-next/assets" ]; then
  echo "📂 Flattening assets..."
  cp -r .open-next/assets/* .open-next/ 2>/dev/null || true
fi

echo "✨ Build complete! Ready for Cloudflare Pages."
