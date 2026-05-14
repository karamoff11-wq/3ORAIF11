import { NextRequest } from 'next/server'

export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const name = searchParams.get('name') || 'Guest'
  const score = searchParams.get('score') || '0'
  const team = searchParams.get('team') || 'Player'

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#06061a"/>
  <rect x="100" y="80" width="1000" height="470" rx="40" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
  <text x="600" y="180" text-anchor="middle" fill="white" font-size="48" font-weight="900" letter-spacing="4">Al-Arif Trivia</text>
  <text x="600" y="300" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="32" letter-spacing="2">${team} Team</text>
  <text x="600" y="420" text-anchor="middle" fill="white" font-size="140" font-weight="900">${score}</text>
  <text x="600" y="480" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="36" font-weight="bold">Points Scored</text>
  <rect x="400" y="520" width="400" height="60" rx="30" fill="rgba(255,255,255,0.1)"/>
  <text x="600" y="565" text-anchor="middle" fill="white" font-size="32" font-weight="bold">${name}</text>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}