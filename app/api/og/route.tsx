import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Dynamic parameters
    const name = searchParams.get('name') || 'Guest'
    const score = searchParams.get('score') || '0'
    const team = searchParams.get('team') || 'Player'
    const color = searchParams.get('color') || '#EC4899'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#06061a',
            backgroundImage: `radial-gradient(circle at center, ${color}33 0%, transparent 70%)`,
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
          }}
        >
          {/* Glass Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '40px',
              padding: '60px',
              width: '80%',
              boxShadow: `0 0 100px ${color}40`,
            }}
          >
            {/* Title / Logo */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: '900',
                  color: 'white',
                  textTransform: 'uppercase',
                  letterSpacing: '4px',
                }}
              >
                Al-Arif Trivia
              </div>
            </div>

            {/* Score Display */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '30px',
              }}
            >
              <div style={{ fontSize: '32px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                {team} Team
              </div>
              <div
                style={{
                  fontSize: '140px',
                  fontWeight: '900',
                  color: 'white',
                  lineHeight: '1',
                  margin: '20px 0',
                  textShadow: `0 0 40px ${color}`,
                }}
              >
                {score}
              </div>
              <div style={{ fontSize: '36px', color: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}>
                Points Scored
              </div>
            </div>

            {/* Player Name */}
            <div
              style={{
                marginTop: '50px',
                display: 'flex',
                alignItems: 'center',
                padding: '15px 40px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '100px',
              }}
            >
              <span style={{ fontSize: '32px', color: 'white', fontWeight: 'bold' }}>
                {name}
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.error(e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
