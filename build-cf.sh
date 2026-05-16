#!/bin/bash
set -e

echo "🚀 [1/3] Cleaning previous builds..."
rm -rf .open-next

echo "📦 [2/3] Building with OpenNext..."
npx -y @opennextjs/cloudflare@latest build

echo "🔧 [3/3] Preparing Cloudflare Pages structure..."
if [ -f ".open-next/worker.js" ]; then
  cp .open-next/worker.js .open-next/_worker.js
  echo "✅ _worker.js created."
else
  echo "❌ ERROR: worker.js not found in .open-next/"
  exit 1
fi

echo "✨ Build complete! Ready for Cloudflare Pages."
