import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Kyokushin Karate Foundation of India – Best Full Contact Karate Training'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
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
          backgroundColor: '#000000',
          backgroundImage: 'linear-gradient(135deg, #000000 0%, #1a0000 50%, #000000 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Red accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #dc2626, #ef4444, #dc2626)',
          }}
        />

        {/* Kanku symbol (simplified) */}
        <div
          style={{
            display: 'flex',
            fontSize: '80px',
            marginBottom: '24px',
            color: '#dc2626',
            fontWeight: 900,
          }}
        >
          ⬥
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '52px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-2px',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            KYOKUSHIN KARATE
          </div>
          <div
            style={{
              fontSize: '52px',
              fontWeight: 900,
              color: '#dc2626',
              letterSpacing: '-2px',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            FOUNDATION OF INDIA
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '22px',
            color: '#a1a1aa',
            marginTop: '20px',
            fontWeight: 500,
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          Best Full Contact Karate Training
        </div>

        {/* Features bar */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '32px',
            padding: '16px 32px',
            borderRadius: '12px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            backgroundColor: 'rgba(220, 38, 38, 0.05)',
          }}
        >
          {['Dojos Across India', 'Belt Gradings', 'Tournaments', 'Kids & Adults'].map((item) => (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#d4d4d8',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              <div style={{ color: '#dc2626', fontSize: '14px' }}>●</div>
              {item}
            </div>
          ))}
        </div>

        {/* Website URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            fontSize: '16px',
            color: '#71717a',
            fontWeight: 500,
          }}
        >
          kyokushinfoundation.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
