import Wave from 'react-wavify'

export function WaterWaveProgress({ percentage }: { percentage: number }) {
    const clampedPercent = Math.min(Math.max(percentage, 10), 100)
    const waveTop = 100 - clampedPercent

    return (
        <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
            {/* Wave with lower z-index */}
            <Wave
                fill="url(#gradient)"
                paused={false}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: '150%',
                    top: `${waveTop}%`,
                    transition: 'top 1s ease-in-out',
                    zIndex: 0, // ensure wave is behind
                }}
                options={{
                    height: 20,
                    amplitude: 20,
                    speed: 0.15,
                    points: 3,
                }}
            >
                <defs>
                    <linearGradient id="gradient" gradientTransform="rotate(90)">
                        <stop offset="0%" stopColor="#ffe066" />
                        <stop offset="100%" stopColor="#38d996" />
                    </linearGradient>
                </defs>
            </Wave>

            {/* Text with higher z-index */}
            {/*  <div
        style={{
          position: 'absolute',
          top: '50%',
          width: '100%',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 24,
          color: '#222',
          userSelect: 'none',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          zIndex: 1, // ensure text is on top
        }}
      >
        {Math.round(clampedPercent)}%
      </div> */}
        </div>
    )
}
