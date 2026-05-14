import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  // ── Bundle Optimization ───────────────────────────────────────────────────
  // Tree-shake only the exported members actually used — reduces bundle size
  // for large libs like framer-motion, supabase, and paddle.
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      '@supabase/supabase-js',
      '@supabase/ssr',
      '@paddle/paddle-js',
    ],
  },

  // Server-only packages — prevent them from being accidentally bundled
  // into client-side JavaScript chunks.
  serverExternalPackages: ['resend', '@google/generative-ai'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'mbqonwwoazurvkxrffqx.supabase.co' },
      { protocol: 'https', hostname: 'media3.giphy.com' },
      { protocol: 'https', hostname: 'preview.redd.it' },
      { protocol: 'https', hostname: 'lumiere-a.akamaihd.net' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'i.pinimg.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'assets.mixkit.co' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'flagcdn.com' },
    ],
  },

  // ── Edge Delivery & Strict Caching ────────────────────────────────────────
  async headers() {
    return [
      {
        // Apply aggressive caching to all static assets in /public
        source: '/:path*.png',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*.svg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/themes/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      }
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
});

