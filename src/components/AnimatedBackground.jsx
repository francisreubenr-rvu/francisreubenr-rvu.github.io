// Atmospheric dark background — nebula-style radial glows + fine grid
export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>

      {/* Deep space gradient base */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(99,102,241,0.07) 0%, transparent 70%),' +
                    'radial-gradient(ellipse 50% 40% at 20% 70%, rgba(129,140,248,0.05) 0%, transparent 60%),' +
                    'radial-gradient(ellipse 40% 50% at 80% 80%, rgba(16,185,129,0.04) 0%, transparent 60%)',
      }} />

      {/* Fine grid */}
      <div className="absolute inset-0" style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* Subtle scan-line feel — coarser horizontal lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.015) 1px, transparent 1px)',
        backgroundSize: '80px 24px',
      }} />

      {/* Salmon focal glow — warm centre point */}
      <div className="absolute" style={{
        top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse at center, rgba(241,180,151,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Technical blueprint overlay — dimmed for dark context */}
      <svg
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: .06 }}
      >
        <line x1="0" y1="450" x2="1400" y2="450" stroke="#818cf8" strokeWidth=".3" strokeDasharray="5 12"/>
        <line x1="700" y1="0"  x2="700"  y2="900" stroke="#818cf8" strokeWidth=".3" strokeDasharray="5 12"/>
        <circle cx="700" cy="450" r="310" fill="none" stroke="#818cf8" strokeWidth=".35"/>
        <circle cx="700" cy="450" r="220" fill="none" stroke="#818cf8" strokeWidth=".35"/>
        <circle cx="700" cy="450" r="130" fill="none" stroke="#818cf8" strokeWidth=".35"/>
        <circle cx="700" cy="450" r="48"  fill="none" stroke="#F1B497" strokeWidth=".5" opacity=".8"/>
        <circle cx="700" cy="450" r="6"   fill="#F1B497" opacity=".6"/>
        <line x1="700" y1="450" x2="1010" y2="450" stroke="#818cf8" strokeWidth=".25"/>
        <text x="855" y="440" fill="#818cf8" fontSize="8" fontFamily="monospace" letterSpacing="1">R = 310</text>
        <line x1="388" y1="445" x2="388" y2="455" stroke="#818cf8" strokeWidth=".4"/>
        <line x1="1012" y1="445" x2="1012" y2="455" stroke="#818cf8" strokeWidth=".4"/>
        <line x1="695" y1="138" x2="705" y2="138" stroke="#818cf8" strokeWidth=".4"/>
        <line x1="695" y1="762" x2="705" y2="762" stroke="#818cf8" strokeWidth=".4"/>
        <rect x="28" y="28" width="115" height="72" fill="none" stroke="#818cf8" strokeWidth=".35"/>
        <line x1="28" y1="50" x2="143" y2="50" stroke="#818cf8" strokeWidth=".25"/>
        <text x="36" y="44" fill="#818cf8" fontSize="7.5" fontFamily="monospace" letterSpacing=".5">SGPA CALCULATOR</text>
        <text x="36" y="64" fill="#818cf8" fontSize="6.5" fontFamily="monospace">PROJECT  GPA-2026</text>
        <text x="36" y="76" fill="#818cf8" fontSize="6.5" fontFamily="monospace">SCALE    1:250</text>
        <text x="36" y="88" fill="#818cf8" fontSize="6.5" fontFamily="monospace">SHEET    01 OF 01</text>
        <circle cx="1260" cy="160" r="90" fill="none" stroke="#818cf8" strokeWidth=".3"/>
        <circle cx="1260" cy="160" r="50" fill="none" stroke="#818cf8" strokeWidth=".3"/>
        <circle cx="1260" cy="160" r="8"  fill="#F1B497" opacity=".5"/>
        <line x1="1170" y1="155" x2="1350" y2="155" stroke="#818cf8" strokeWidth=".2" strokeDasharray="3 6"/>
        <line x1="1255" y1="70"  x2="1255" y2="250" stroke="#818cf8" strokeWidth=".2" strokeDasharray="3 6"/>
        <line x1="180" y1="860" x2="1220" y2="860" stroke="#818cf8" strokeWidth=".35"/>
        <line x1="180" y1="854" x2="180"  y2="866" stroke="#818cf8" strokeWidth=".4"/>
        <line x1="1220" y1="854" x2="1220" y2="866" stroke="#818cf8" strokeWidth=".4"/>
        <text x="700" y="878" fill="#818cf8" fontSize="7" fontFamily="monospace" textAnchor="middle" letterSpacing="1">1040 UNITS</text>
        <line x1="700" y1="450" x2="200"  y2="100" stroke="#818cf8" strokeWidth=".18" strokeDasharray="3 9"/>
        <line x1="700" y1="450" x2="1200" y2="100" stroke="#818cf8" strokeWidth=".18" strokeDasharray="3 9"/>
        <line x1="700" y1="450" x2="200"  y2="800" stroke="#818cf8" strokeWidth=".18" strokeDasharray="3 9"/>
        <line x1="700" y1="450" x2="1200" y2="800" stroke="#818cf8" strokeWidth=".18" strokeDasharray="3 9"/>
      </svg>

      {/* Film grain */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '300px 300px',
        opacity: .035,
      }} />
    </div>
  )
}
