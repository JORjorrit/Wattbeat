// Dynamic OG Image Generator for CaveFlyer Energy 2025
// Uses @vercel/og to generate share card images

import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const DIFFICULTY_NAMES = ['Easy', 'Normal', 'Hard'];
const DIFFICULTY_COLORS = {
  0: { bg: '#1a472a', accent: '#4ade80' }, // Easy - Green
  1: { bg: '#1e3a5f', accent: '#60a5fa' }, // Normal - Blue  
  2: { bg: '#5c1a1a', accent: '#f87171' }, // Hard - Red
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    
    const score = searchParams.get('score') || '0';
    const rank = searchParams.get('rank') || '';
    const difficulty = parseInt(searchParams.get('difficulty') || '0');
    const nickname = searchParams.get('nickname') || 'Anonymous';
    
    const diffName = DIFFICULTY_NAMES[difficulty] || 'Unknown';
    const colors = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS[0];
    
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
            backgroundColor: '#0b0f14',
            backgroundImage: `radial-gradient(circle at 20% 80%, ${colors.bg} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${colors.bg} 0%, transparent 50%)`,
            fontFamily: 'system-ui, sans-serif',
            padding: '40px',
          }}
        >
          {/* Top decorative line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
            }}
          />
          
          {/* Title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '48px' }}>⚡</span>
            <span
              style={{
                fontSize: '42px',
                fontWeight: 700,
                color: '#e6edf3',
                letterSpacing: '-1px',
              }}
            >
              CaveFlyer Energy 2025
            </span>
            <span style={{ fontSize: '48px' }}>🚀</span>
          </div>
          
          {/* Score display */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <span
              style={{
                fontSize: '120px',
                fontWeight: 800,
                color: colors.accent,
                lineHeight: 1,
                textShadow: `0 0 60px ${colors.accent}40`,
              }}
            >
              {parseInt(score).toLocaleString()}
            </span>
            <span
              style={{
                fontSize: '28px',
                color: '#9fb0c0',
                marginTop: '8px',
              }}
            >
              points
            </span>
          </div>
          
          {/* Player info and rank */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              marginBottom: '32px',
            }}
          >
            {/* Nickname badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1f2a37',
                padding: '12px 24px',
                borderRadius: '999px',
                border: '1px solid #2b3f58',
              }}
            >
              <span style={{ fontSize: '24px' }}>👤</span>
              <span
                style={{
                  fontSize: '24px',
                  color: '#e6edf3',
                  fontWeight: 600,
                }}
              >
                {nickname.slice(0, 15)}
              </span>
            </div>
            
            {/* Difficulty badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: colors.bg,
                padding: '12px 24px',
                borderRadius: '999px',
                border: `2px solid ${colors.accent}`,
              }}
            >
              <span
                style={{
                  fontSize: '24px',
                  color: colors.accent,
                  fontWeight: 700,
                }}
              >
                {diffName}
              </span>
            </div>
            
            {/* Rank badge */}
            {rank && rank !== '0' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#2a1a4a',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  border: '2px solid #a855f7',
                }}
              >
                <span style={{ fontSize: '24px' }}>🏆</span>
                <span
                  style={{
                    fontSize: '24px',
                    color: '#a855f7',
                    fontWeight: 700,
                  }}
                >
                  #{rank}
                </span>
              </div>
            )}
          </div>
          
          {/* Call to action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#1b2b3f',
              padding: '16px 32px',
              borderRadius: '16px',
              border: '1px solid #2b3f58',
            }}
          >
            <span
              style={{
                fontSize: '26px',
                color: '#60a5fa',
                fontWeight: 600,
              }}
            >
              Can you beat my score?
            </span>
            <span style={{ fontSize: '28px' }}>🎮</span>
          </div>
          
          {/* Subtitle */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                color: '#6b7b8a',
              }}
            >
              Fly through 2025 electricity prices
            </span>
            <span style={{ fontSize: '18px' }}>⚡</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}

