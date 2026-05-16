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

echo "📂 Flattening assets..."
if [ -d ".open-next/assets" ]; then
  cp -a .open-next/assets/. .open-next/
fi

if [ -d "public" ]; then
  cp -a public/. .open-next/
fi

if [ -d ".next/static" ]; then
  mkdir -p .open-next/_next/static
  cp -a .next/static/. .open-next/_next/static/
fi

echo "🗺️ Generating _routes.json..."
cat << EOF > .open-next/_routes.json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/_next/*", "/favicon.ico", "/images/*", "/assets/*", "/public/*"]
}
EOF

echo "✨ Build complete! Ready for Cloudflare Pages."
