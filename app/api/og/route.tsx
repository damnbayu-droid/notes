import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const title = searchParams.get('title') || 'Shared Intelligence'
    const category = searchParams.get('category') || 'Neural Node'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'radial-gradient(circle at 25% 25%, #1e1b4b 0%, transparent 50%), radial-gradient(circle at 75% 75%, #1e1b4b 0%, transparent 50%)',
            padding: '80px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Branded Label */}
          <div
            style={{
              display: 'flex',
              padding: '8px 16px',
              backgroundColor: '#7c3aed',
              borderRadius: '8px',
              marginBottom: '40px',
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {category}
            </span>
          </div>

          {/* Title Section */}
          <h1
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: 'white',
              lineHeight: 1,
              marginBottom: '20px',
              textTransform: 'uppercase',
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>

          {/* Verification Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '40px',
            }}
          >
             <div style={{ width: 12, height: 12, backgroundColor: '#10b981', borderRadius: '50%', marginRight: '12px' }} />
             <span style={{ fontSize: 20, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Smart Notes verified Oracle
             </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
