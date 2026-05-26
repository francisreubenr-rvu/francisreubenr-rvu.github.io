// GPA Calc — App Shell v3 (Neural Orbit major selector + full animation suite)
const { useState, useEffect, useCallback, useMemo, useRef } = React;
const {
  SEMESTERS, DIVIDES, MAJORS, MAJOR_SEMESTERS, SGPA_STATUS,
  calculateSGPA, loadCourses, saveCourses, loadSelection, saveSelection,
  makeCoursesFromTemplate, exportCSV, enrichCourse,
  loadMajor, saveMajor,
} = window.GPAUtils;

const SEM_COLORS = ['#FCEE0A','#00F0FF','#FF2A6D','#00FF9F','#9D00FF','#FF6B00','#0080FF','#FF003C'];

// ── 3D perspective projection ─────────────────────────────────────────────
function project3D(angleY, tiltX, radius, perspective) {
  const ry = (angleY * Math.PI) / 180;
  const rx = (tiltX  * Math.PI) / 180;
  const x  = radius * Math.cos(ry), y = 0, z = radius * Math.sin(ry);
  const yT = y * Math.cos(rx) - z * Math.sin(rx);
  const zT = y * Math.sin(rx) + z * Math.cos(rx);
  const sc = perspective / (perspective + zT);
  return { x: x * sc, y: yT * sc, z: zT, scale: sc };
}

// ── Octagon Globe ─────────────────────────────────────────────────────────
function OctagonGlobe({ semesters, onSelect }) {
  const [rotY, setRotY] = useState(0);
  const [hov, setHov]   = useState(null);
  const s = useRef({ rotY: 0, paused: false, dragging: false, startX: 0, startRot: 0 });
  const raf = useRef(null);

  useEffect(() => {
    let last = performance.now();
    function tick(now) {
      const dt = Math.min(now - last, 50);
      if (!s.current.paused) { s.current.rotY = (s.current.rotY + dt * 0.018) % 360; setRotY(s.current.rotY); }
      last = now; raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const pause = (ms) => { s.current.paused = true; clearTimeout(s.current.t); s.current.t = setTimeout(() => { s.current.paused = false; }, ms); };
  const dn = cx => { s.current.dragging = true; s.current.startX = cx; s.current.startRot = s.current.rotY; pause(99999); };
  const mv = cx => { if (!s.current.dragging) return; s.current.rotY = (s.current.startRot + (cx - s.current.startX) * 0.45) % 360; setRotY(s.current.rotY); };
  const up = () => { if (s.current.dragging) { s.current.dragging = false; pause(2200); } };

  const CX = 230, CY = 178;
  const nodes = semesters.map((sem, i) => {
    const angle = (i * 45 + rotY) % 360;
    const p = project3D(angle, -22, 158, 520);
    const depth = (p.z + 158) / 316;
    return { sem, i, p, depth, color: SEM_COLORS[i], cx: CX + p.x, cy: CY + p.y };
  }).sort((a, b) => a.depth - b.depth);

  return (
    <div style={{ width: 460, height: 395, position: 'relative', userSelect: 'none', touchAction: 'none', cursor: s.current.dragging ? 'grabbing' : 'grab' }}
      onMouseDown={e => dn(e.clientX)} onMouseMove={e => mv(e.clientX)} onMouseUp={up} onMouseLeave={up}
      onTouchStart={e => dn(e.touches[0].clientX)} onTouchMove={e => { e.preventDefault(); mv(e.touches[0].clientX); }} onTouchEnd={up}
    >
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <ellipse cx={CX} cy={CY} rx="192" ry="60"  fill="none" stroke="rgba(241,180,151,.18)" strokeWidth="1" />
        <ellipse cx={CX} cy={CY} rx="156" ry="49"  fill="none" stroke="rgba(99,102,241,.12)"  strokeWidth="0.7" />
        <ellipse cx={CX} cy={CY} rx="215" ry="68"  fill="none" stroke="rgba(6,182,212,.07)"   strokeWidth="0.8" strokeDasharray="5 10" />
        <circle  cx={CX} cy={CY} r="5"   fill="rgba(241,180,151,.4)" />
        <circle  cx={CX} cy={CY} r="14"  fill="none" stroke="rgba(241,180,151,.14)" strokeWidth="0.7" />
        <line x1={CX-22} y1={CY} x2={CX-9}  y2={CY} stroke="rgba(241,180,151,.22)" strokeWidth="0.5"/>
        <line x1={CX+9}  y1={CY} x2={CX+22} y2={CY} stroke="rgba(241,180,151,.22)" strokeWidth="0.5"/>
        <line x1={CX} y1={CY-22} x2={CX} y2={CY-9}  stroke="rgba(241,180,151,.22)" strokeWidth="0.5"/>
        <line x1={CX} y1={CY+9}  x2={CX} y2={CY+22} stroke="rgba(241,180,151,.22)" strokeWidth="0.5"/>
        <text x="10" y="20" fill="rgba(241,180,151,.18)" fontSize="8" fontFamily="monospace" letterSpacing="1">SEM SELECT · DRAG TO ROTATE</text>
      </svg>

      {nodes.map(({ sem, i, depth, color, cx, cy }) => {
        const isH = hov === sem.id;
        const op  = sem.comingSoon ? 0.12 + 0.28 * depth : (0.18 + 0.82 * depth);
        const ns  = 0.52 + 0.48 * depth;
        const gl  = !sem.comingSoon && (depth > 0.55 || isH);
        return (
          <div key={sem.id}
            onClick={e => { e.stopPropagation(); if (!s.current.dragging) onSelect(sem); }}
            onMouseEnter={() => setHov(sem.id)}
            onMouseLeave={() => setHov(null)}
            style={{ position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) scale(${ns * (isH ? 1.08 : 1)})`, opacity: op, zIndex: Math.round(depth * 100), cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: 'transform .12s, opacity .08s' }}
          >
            <div style={{ width: 54, height: 54, clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)', background: sem.comingSoon ? 'rgba(255,255,255,.03)' : `${color}${isH ? '28' : '12'}`, border: `1.5px solid ${sem.comingSoon ? 'rgba(255,255,255,.08)' : color + (depth > 0.55 ? 'bb' : '44')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: gl ? `0 0 26px ${color}55, 0 0 10px ${color}30` : 'none', transition: 'box-shadow .2s' }}>
              <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 17, color: sem.comingSoon ? 'rgba(255,255,255,.2)' : color, lineHeight: 1 }}>{i + 1}</span>
            </div>
            <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 11, color: sem.comingSoon ? 'rgba(255,255,255,.25)' : '#F5EFEB', whiteSpace: 'nowrap', textShadow: gl ? `0 0 12px ${color}60` : 'none' }}>{sem.label}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 2, color: sem.comingSoon ? 'rgba(255,255,255,.2)' : (sem.completed ? '#10B981' : '#F1B497') }}>
                {sem.comingSoon ? 'Soon' : (sem.completed ? 'Done' : 'Active')}
              </div>
            </div>
          </div>
        );
      })}
      <p style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '1.5px', color: 'rgba(255,255,255,.18)', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
        Drag to rotate · tap to select
      </p>
    </div>
  );
}

// ── Neural Orbit — Major Selector ─────────────────────────────────────────
function NeuralOrbit({ savedMajor, onSelect }) {
  const [hov,  setHov]  = useState(null);
  const [sel,  setSel]  = useState(null);

  const handleSelect = (m) => {
    setSel(m.id);
    setTimeout(() => { saveMajor({ id: m.id }); onSelect(m); }, 550);
  };

  return (
    <div style={{ width: '100%', maxWidth: 640, animation: 'fadeUp .55s ease .1s both' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {MAJORS.map((m, i) => {
          const isH = hov === m.id;
          const isS = sel === m.id;
          const isCur = savedMajor?.id === m.id;
          return (
            <window.TiltCard key={m.id} intensity={5}
              style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', border: `1px solid ${isH || isCur ? m.color + '70' : m.color + '25'}`, background: `radial-gradient(ellipse at 30% 30%, ${m.color}10, transparent 65%), rgba(255,255,255,.03)`, animation: `majorReveal .5s ease ${0.08 * i}s both`, transition: 'border-color .2s' }}
              onMouseEnter={() => setHov(m.id)} onMouseLeave={() => setHov(null)}
              onClick={() => handleSelect(m)}
            >
              {/* Animated gradient sweep */}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${m.color}12, transparent 60%, ${m.color}06)`, backgroundSize: '200% 200%', animation: 'gradientShift 5s ease infinite', animationDelay: `${i * 1.2}s` }} />

              {/* Selected flash */}
              {isS && <div style={{ position: 'absolute', inset: 0, background: `${m.color}25`, zIndex: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeUp .2s ease both' }}><span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: m.color, letterSpacing: '2px' }}>SELECTED ✓</span></div>}

              {/* Recommended badge */}
              {isCur && !isS && <div style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: m.color, background: `${m.color}18`, padding: '2px 8px', border: `1px solid ${m.color}40`, zIndex: 2 }}>Current</div>}

              <div style={{ position: 'relative', zIndex: 1, padding: '22px 22px 18px' }}>
                {/* Orbital glyph */}
                <div style={{ position: 'relative', width: 68, height: 68, marginBottom: 16 }}>
                  <window.OrbitalRing color={m.color} size={68} speed={7} dotSize={5} />
                  <window.OrbitalRing color={m.color} size={48} speed={4.5} dotSize={3} reverse />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: m.color, textShadow: isH ? `0 0 20px ${m.color}, 0 0 40px ${m.color}60` : 'none', transition: 'text-shadow .25s' }}>
                    {m.glyph}
                  </div>
                </div>

                <h3 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 20, color: '#F5EFEB', marginBottom: 5 }}>{m.label}</h3>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#8B8986', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>{m.desc}</p>

                {/* Course pills — expand on hover */}
                <div style={{ overflow: 'hidden', maxHeight: isH ? '120px' : 0, transition: 'max-height .35s ease' }}>
                  <div style={{ borderTop: `1px solid ${m.color}25`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {m.courses.map((c, ci) => (
                      <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,.6)', animation: isH ? `fadeUp .22s ease ${ci * 0.06}s both` : 'none' }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: m.color, flexShrink: 0, boxShadow: `0 0 6px ${m.color}` }} />{c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </window.TiltCard>
          );
        })}
      </div>
    </div>
  );
}

// ── Coming Soon Screen ────────────────────────────────────────────────────
function ComingSoonScreen({ semester, majorData, onBack }) {
  const semNum = parseInt(semester.id.replace('sem', ''));
  const courses = majorData ? (MAJOR_SEMESTERS[semester.id]?.[majorData.id] || []) : [];

  return (
    <div style={{ width: '100%', maxWidth: 560, position: 'relative', animation: 'fadeUp .5s ease both' }}>
      {/* Ghost number */}
      <div style={{ position: 'absolute', top: -20, right: 0, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 200, color: 'rgba(241,180,151,.03)', lineHeight: 1, letterSpacing: '-12px', pointerEvents: 'none', userSelect: 'none' }}>{semNum}</div>

      <window.SLabel style={{ display: 'block', marginBottom: 12 }}>Coming Soon</window.SLabel>
      <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 'clamp(36px,6vw,64px)', letterSpacing: '-2px', color: '#F5EFEB', lineHeight: 1, marginBottom: 20 }}>
        Semester {semNum}.
      </h2>

      {majorData && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: `${majorData.color}14`, border: `1px solid ${majorData.color}40`, marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: majorData.color, boxShadow: `0 0 8px ${majorData.color}` }} />
          <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: majorData.color }}>{majorData.label} track</span>
        </div>
      )}

      {/* Course preview — blurred teaser */}
      {courses.length > 0 && (
        <div style={{ marginBottom: 28, position: 'relative' }}>
          <window.SLabel style={{ display: 'block', marginBottom: 12 }}>Course Preview</window.SLabel>
          <div style={{ filter: 'blur(3px)', userSelect: 'none', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {courses.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', animation: `fadeUp .3s ease ${i * 0.06}s both` }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986', flexShrink: 0 }}>{c.courseCode}</span>
                <span style={{ fontSize: 13, color: '#F5EFEB', flex: 1 }}>{c.courseName}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#F1B497' }}>{c.credits}cr</span>
              </div>
            ))}
          </div>
          {/* Gradient lock overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, rgba(8,11,20,.95))', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986', letterSpacing: '1.5px', textTransform: 'uppercase' }}>🔒 Unlocks when available</span>
          </div>
        </div>
      )}

      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986', lineHeight: 1.7, marginBottom: 28 }}>
        Course data for Semester {semNum} will be added as the semester rolls out. Your major preference has been saved.
      </p>

      <window.RippleBtn onClick={onBack} style={{ padding: '11px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,.18)', color: '#F5EFEB', fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase' }}>
        ← Back to Semesters
      </window.RippleBtn>
    </div>
  );
}

// ── CGPA Box ──────────────────────────────────────────────────────────────
function CGPABox({ data }) {
  const d = window.useAnimatedNumber(data ? data.cgpa : 0, 900, 2);
  if (!data) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, background: 'rgba(6,9,18,.93)', border: '1px solid rgba(255,255,255,.14)', backdropFilter: 'blur(18px)', padding: '14px 22px 16px', animation: 'slideUpFade .6s cubic-bezier(.34,1.56,.64,1) both', minWidth: 116 }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderTop: '18px solid rgba(241,180,151,.2)', borderLeft: '18px solid transparent' }} />
      <window.SLabel style={{ display: 'block', marginBottom: 6 }}>CGPA</window.SLabel>
      <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 50, color: '#F5EFEB', letterSpacing: '-2px', lineHeight: 1 }}>{d.toFixed(2)}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#8B8986', marginTop: 8 }}>{data.sems} sem{data.sems !== 1 ? 's' : ''} · {data.credits} cr</div>
    </div>
  );
}

// ── useCGPA ───────────────────────────────────────────────────────────────
function useCGPA(courses, selection) {
  return useMemo(() => {
    let cgp = 0, cr = 0; const seen = new Set();
    for (const sem of SEMESTERS) {
      if (!sem.available) continue;
      for (const div of (DIVIDES[sem.id] || [])) {
        const isCur = selection && sem.id === selection.semester && div.id === selection.divide;
        const sc = isCur ? courses : (() => { try { const r = localStorage.getItem(`sgpa_calc_v2_${sem.id}_${div.id}`); return r ? JSON.parse(r).map(enrichCourse) : []; } catch { return []; } })();
        const scored = sc.filter(c => c.creditGradeProduct !== null);
        if (!scored.length) continue;
        seen.add(sem.id);
        scored.forEach(c => { cgp += c.creditGradeProduct; cr += c.credits; });
      }
    }
    return cr > 0 ? { cgpa: cgp / cr, sems: seen.size, credits: cr } : null;
  }, [courses, selection]);
}

// ── Rich Blueprint Background ─────────────────────────────────────────────
function BlueprintBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 55% 35%, rgba(99,102,241,.065) 0%, transparent 70%), radial-gradient(ellipse 45% 45% at 15% 70%, rgba(129,140,248,.04) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.055) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse at center, rgba(241,180,151,.05) 0%, transparent 70%)' }} />
      <svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .055 }}>
        <line x1="0" y1="450" x2="1400" y2="450" stroke="#818cf8" strokeWidth=".3" strokeDasharray="5 12"/>
        <line x1="700" y1="0"  x2="700"  y2="900" stroke="#818cf8" strokeWidth=".3" strokeDasharray="5 12"/>
        <circle cx="700" cy="450" r="310" fill="none" stroke="#818cf8" strokeWidth=".35"/>
        <circle cx="700" cy="450" r="220" fill="none" stroke="#818cf8" strokeWidth=".35"/>
        <circle cx="700" cy="450" r="130" fill="none" stroke="#818cf8" strokeWidth=".35"/>
        <circle cx="700" cy="450" r="48"  fill="none" stroke="#F1B497" strokeWidth=".5" opacity=".8"/>
        <circle cx="700" cy="450" r="6"   fill="#F1B497" opacity=".6"/>
        <rect x="28" y="28" width="118" height="72" fill="none" stroke="#818cf8" strokeWidth=".35"/>
        <line x1="28" y1="50" x2="146" y2="50" stroke="#818cf8" strokeWidth=".25"/>
        <text x="36" y="44" fill="#818cf8" fontSize="7.5" fontFamily="monospace">SGPA CALCULATOR</text>
        <text x="36" y="64" fill="#818cf8" fontSize="6.5" fontFamily="monospace">PROJECT  GPA-2026</text>
        <text x="36" y="76" fill="#818cf8" fontSize="6.5" fontFamily="monospace">SCALE    1:250</text>
        <circle cx="1260" cy="160" r="90" fill="none" stroke="#818cf8" strokeWidth=".3"/>
        <circle cx="1260" cy="160" r="8"  fill="#F1B497" opacity=".5"/>
        <line x1="700" y1="450" x2="200"  y2="100" stroke="#818cf8" strokeWidth=".18" strokeDasharray="3 9"/>
        <line x1="700" y1="450" x2="1200" y2="100" stroke="#818cf8" strokeWidth=".18" strokeDasharray="3 9"/>
        <line x1="700" y1="450" x2="200"  y2="800" stroke="#818cf8" strokeWidth=".18" strokeDasharray="3 9"/>
        <line x1="700" y1="450" x2="1200" y2="800" stroke="#818cf8" strokeWidth=".18" strokeDasharray="3 9"/>
      </svg>
    </div>
  );
}

// ── Selection Screen (wraps SpaceSelectionScreen + NeuralOrbit overlay) ──
function SelectionScreen({ onSelect, onClose }) {
  const [showMajor, setShowMajor] = useState(false);
  const [savedMaj,  setSavedMaj]  = useState(() => loadMajor());

  const handleMajorSelect = (m) => {
    saveMajor({ id: m.id });
    setSavedMaj({ id: m.id });
    setShowMajor(false);
  };

  return (
    <>
      <window.SpaceSelectionScreen
        onSelect={onSelect}
        onClose={onClose}
        savedMajor={savedMaj}
        onSetMajor={() => setShowMajor(true)}
      />

      {/* Neural Orbit overlay */}
      {showMajor && (
        <div style={{
          position:'fixed', inset:0, zIndex:600,
          background:'rgba(4,6,14,0.88)', backdropFilter:'blur(10px)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:'40px 24px', animation:'fadeIn .3s ease both',
        }} onClick={e => { if (e.target===e.currentTarget) setShowMajor(false); }}>
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <window.SLabel style={{ display:'block', marginBottom:12 }}>
              Your Specialisation
            </window.SLabel>
            <h2 style={{ fontFamily:"'Hanken Grotesk',sans-serif", fontWeight:300, fontSize:'clamp(32px,5vw,56px)', letterSpacing:'-1.5px', color:'#F5EFEB', margin:0, animation:'fadeUp .45s ease .05s both' }}>
              Choose Your Major.
            </h2>
            <p style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'#8B8986', marginTop:12, animation:'fadeUp .4s ease .15s both' }}>
              Applied from Year 2 onwards · saved to your profile
            </p>
          </div>
          <NeuralOrbit savedMajor={savedMaj} onSelect={handleMajorSelect} />
          <button onClick={() => setShowMajor(false)} style={{ marginTop:24, background:'none', border:'none', fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(255,255,255,.3)', cursor:'pointer', letterSpacing:'1px', textTransform:'uppercase' }}>
            Cancel
          </button>
        </div>
      )}
    </>
  );
}

// ── Header ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'courses',   label: 'Courses'      },
  { id: 'dashboard', label: 'Dashboard'    },
  { id: 'reverse',   label: 'Reverse Calc' },
  { id: 'settings',  label: 'Settings'     },
];

function Header({ activeTab, setActiveTab, selection, sgpa, onSwitch }) {
  const displaySGPA = window.useAnimatedNumber(sgpa || 0, 700, 2);
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,11,20,.93)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 52 }}>
        <div style={{ width: 6, height: 6, background: '#F1B497', flexShrink: 0, marginRight: 28, animation: 'pulse 3s ease infinite', boxShadow: '0 0 8px #F1B497' }} />
        <nav style={{ display: 'flex', alignItems: 'center', flex: 1, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '0 16px', height: 52, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12, color: activeTab === t.id ? '#F5EFEB' : '#8B8986', borderBottom: `2px solid ${activeTab === t.id ? '#F1B497' : 'transparent'}`, transition: 'color .15s, border-color .2s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { if (activeTab !== t.id) e.currentTarget.style.color = '#F5EFEB'; }}
              onMouseLeave={e => { if (activeTab !== t.id) e.currentTarget.style.color = '#8B8986'; }}
            >{t.label}</button>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16, flexShrink: 0 }}>
          {sgpa !== null && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#F1B497', letterSpacing: '-0.3px' }}>{displaySGPA.toFixed(2)}</span>}
          {selection && (
            <window.RippleBtn onClick={onSwitch} style={{ padding: '4px 10px', background: 'rgba(241,180,151,.08)', border: '1px solid rgba(241,180,151,.22)', color: '#F1B497', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(241,180,151,.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(241,180,151,.08)'}
            >{selection.semester.replace('sem','S')}·{selection.divide}</window.RippleBtn>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────
function Hero({ selection, sgpa, courses }) {
  const displaySGPA = window.useAnimatedNumber(sgpa || 0, 1000, 2);
  // Major only applies from Sem 3+ (comingSoon semesters)
  const isMajorSem = selection ? (SEMESTERS.find(s => s.id === selection.semester)?.comingSoon ?? false) : false;
  const majorData  = useMemo(() => {
    if (!isMajorSem) return null;
    const m = loadMajor(); return m ? MAJORS.find(x => x.id === m.id) : null;
  }, [isMajorSem]);
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#090c15', minHeight: '48vh', display: 'flex', alignItems: 'flex-end' }}>
      <BlueprintBg />
      <window.ParticleField count={22} />
      <window.ScanLine />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 24px 44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ paddingTop: 88 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '3px', color: '#8B8986', textTransform: 'uppercase', marginBottom: 22, animation: 'fadeUp .5s ease .1s both' }}>
            RV University · SGPA Calculator
            {selection && <span style={{ marginLeft: 12, padding: '2px 8px', background: 'rgba(241,180,151,.1)', color: '#F1B497' }}>{selection.semester.toUpperCase()} · {selection.divide}</span>}
            {majorData && <span style={{ marginLeft: 8, padding: '2px 8px', background: `${majorData.color}15`, color: majorData.color, border: `1px solid ${majorData.color}30` }}>{majorData.label}</span>}
          </p>
          <h1 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 'clamp(48px,9vw,118px)', letterSpacing: '-3px', color: '#F5EFEB', lineHeight: 0.92, margin: 0 }}>
            <span style={{ display: 'block', overflow: 'hidden' }}><span style={{ display: 'block', animation: 'clipReveal .8s cubic-bezier(.76,0,.24,1) .2s both' }}>SGPA</span></span>
            <span style={{ display: 'block', overflow: 'hidden' }}><span style={{ display: 'block', color: '#F1B497', animation: 'clipReveal .8s cubic-bezier(.76,0,.24,1) .38s both' }}>Calculator.</span></span>
          </h1>
          <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: '#8B8986', marginTop: 22, maxWidth: 320, lineHeight: 1.65, animation: 'fadeUp .5s ease .6s both' }}>
            Enter CIE and SEE marks below. SGPA updates in real-time using RVU's credit-weighted grading scale.
          </p>
        </div>
        {sgpa !== null && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0, animation: 'fadeUp .6s ease .5s both' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8B8986', letterSpacing: '2px' }}>CURRENT</span>
            <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 'clamp(64px,11vw,138px)', color: '#F1B497', letterSpacing: '-4px', lineHeight: 1, animation: 'glowPulse 3s ease 1.2s infinite' }}>
              {displaySGPA.toFixed(2)}
            </span>
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,.06)', padding: '10px 0', overflow: 'hidden', background: 'rgba(8,11,20,.5)' }}>
        <div style={{ display: 'flex', animation: 'mq 28s linear infinite', width: 'max-content', whiteSpace: 'nowrap' }}>
          {[0, 1].map(rep => courses.map(c => (
            <span key={`${rep}-${c.id}`} style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 13, color: '#8B8986', padding: '0 28px', flexShrink: 0 }}>
              <span style={{ color: '#F1B497', fontSize: 10, marginRight: 12 }}>✦</span>{c.courseName}
            </span>
          )))}
        </div>
      </div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────
function Settings({ courses, sgpa, onReset, onSwitchDivide, selection }) {
  const toast = window.useToast();
  const [showReset, setShowReset] = useState(false);
  const [savedMaj, setSavedMaj]  = useState(() => loadMajor());
  const isMajorSem = selection ? (SEMESTERS.find(s => s.id === selection?.semester)?.comingSoon ?? false) : false;
  const majorData = isMajorSem ? MAJORS.find(m => m.id === savedMaj?.id) : null;
  const scored = courses.filter(c => c.creditGradeProduct !== null);
  const totalCr = scored.reduce((s, c) => s + c.credits, 0);
  const totalCGP = scored.reduce((s, c) => s + c.creditGradeProduct, 0);

  const row = (title, desc, btnLabel, danger, onClick) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.07)', flexWrap: 'wrap', gap: 12 }}>
      <div><p style={{ fontSize: 14, color: danger ? '#EF4444' : '#F5EFEB', marginBottom: 3 }}>{title}</p><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986' }}>{desc}</p></div>
      <window.RippleBtn onClick={onClick} style={{ padding: '9px 20px', background: danger ? 'rgba(239,68,68,.08)' : 'rgba(255,255,255,.06)', border: `1px solid ${danger ? 'rgba(239,68,68,.25)' : 'rgba(255,255,255,.18)'}`, color: danger ? '#EF4444' : '#F5EFEB', fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase' }}
        onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(239,68,68,.15)' : 'rgba(255,255,255,.1)'}
        onMouseLeave={e => e.currentTarget.style.background = danger ? 'rgba(239,68,68,.08)' : 'rgba(255,255,255,.06)'}
      >{btnLabel}</window.RippleBtn>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Major display */}
      {majorData && (
        <div style={{ background: `${majorData.color}08`, border: `1px solid ${majorData.color}25`, padding: '20px 24px', animation: 'fadeUp .4s ease both', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
            <window.OrbitalRing color={majorData.color} size={52} speed={5} dotSize={4} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: majorData.color }}>{majorData.glyph}</div>
          </div>
          <div>
            <window.SLabel style={{ display: 'block', marginBottom: 4 }}>Your Major</window.SLabel>
            <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 22, color: majorData.color, marginBottom: 2 }}>{majorData.label}</p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986' }}>{majorData.desc}</p>
          </div>
        </div>
      )}

      {selection && (
        <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)', padding: '24px 28px', animation: 'fadeUp .4s ease .05s both' }}>
          <window.SLabel style={{ display: 'block', marginBottom: 16 }}>Current Session</window.SLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            {[{ label: 'Semester', val: selection.semester.replace('sem','Semester ') }, { label: 'Section', val: selection.divide }, { label: 'Courses', val: courses.length }, { label: 'SGPA', val: sgpa !== null ? sgpa.toFixed(2) : '—' }, { label: 'Credits', val: totalCr }, { label: 'Total CGP', val: totalCGP }].map(s => (
              <div key={s.label}><window.SLabel style={{ display: 'block', marginBottom: 4 }}>{s.label}</window.SLabel><span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 22, color: '#F5EFEB' }}>{s.val}</span></div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)', padding: '24px 28px', animation: 'fadeUp .4s ease .1s both' }}>
        <window.SLabel style={{ display: 'block', marginBottom: 16 }}>Actions</window.SLabel>
        {row('Export to CSV', 'Download all marks and grades as a spreadsheet', 'Export ↓', false, () => { window.GPAUtils.exportCSV(courses, sgpa); toast('CSV downloaded', 'success'); })}
        {row('Switch Semester / Divide', 'Change your semester without losing other data', 'Switch →', false, onSwitchDivide)}
        {row('Reset All Marks', 'Clear all entered marks and restore default courses', 'Reset', true, () => setShowReset(true))}
      </div>

      <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)', padding: '24px 28px', animation: 'fadeUp .4s ease .15s both' }}>
        <window.SLabel style={{ display: 'block', marginBottom: 16 }}>RVU Grading Scale</window.SLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {window.GPAUtils.GRADING_SCALE.map((r, i) => (
            <window.TiltCard key={r.grade} intensity={4} style={{ padding: '10px 12px', background: r.bg, border: `1px solid ${r.color}20`, animation: `fadeUp .3s ease ${i * 0.04}s both` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: r.color }}>{r.grade}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: r.color, opacity: 0.7 }}>{r.point} GP</span>
              </div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#8B8986', marginTop: 4 }}>≥{r.min} marks · {r.label}</p>
            </window.TiltCard>
          ))}
        </div>
      </div>

      <window.Modal open={showReset} onClose={() => setShowReset(false)} title="Reset All Marks" width="380px">
        <p style={{ fontSize: 13, color: '#8B8986', lineHeight: 1.65, marginBottom: 22 }}>All entered marks will be cleared. This cannot be undone.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <window.RippleBtn onClick={() => setShowReset(false)} style={{ flex: 1, padding: '11px 0', background: 'transparent', border: '1px solid rgba(255,255,255,.18)', color: '#F5EFEB', fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase' }}>Cancel</window.RippleBtn>
          <window.RippleBtn onClick={() => { onReset(); setShowReset(false); toast('Marks cleared', 'info'); }} style={{ flex: 1, padding: '11px 0', background: '#EF4444', border: 'none', color: '#fff', fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase' }}>Reset</window.RippleBtn>
        </div>
      </window.Modal>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
function App() {
  const [selection,  setSelection]  = useState(() => loadSelection());
  const [courses,    setCourses]    = useState(() => {
    if (!selection) return [];
    return loadCourses(selection.semester, selection.divide)
      || makeCoursesFromTemplate((DIVIDES[selection.semester]?.find(d => d.id === selection.divide)?.courses) || []);
  });
  const [activeTab,  setActiveTab]  = useState('courses');
  const [switchOpen, setSwitchOpen] = useState(false);

  useEffect(() => { if (selection) saveCourses(selection.semester, selection.divide, courses); }, [courses, selection]);

  const handleSelect = useCallback((semester, divide) => {
    const sel = { semester, divide };
    saveSelection(sel); setSelection(sel);
    const divData = DIVIDES[semester]?.find(d => d.id === divide);
    setCourses(loadCourses(semester, divide) || makeCoursesFromTemplate(divData?.courses || []));
    setSwitchOpen(false); setActiveTab('courses');
  }, []);

  const updateCourse = useCallback((id, patch) => {
    setCourses(prev => prev.map(c => c.id === id ? enrichCourse({ ...c, ...patch }) : c));
  }, []);
  const addCourse = useCallback((data) => {
    setCourses(prev => [...prev, enrichCourse({ id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`, ...data, totalMarks: null, grade: null, gradePoint: null, creditGradeProduct: null })]);
  }, []);
  const deleteCourse = useCallback((id) => setCourses(prev => prev.filter(c => c.id !== id)), []);
  const resetAll = useCallback(() => {
    if (!selection) return;
    const d = DIVIDES[selection.semester]?.find(d => d.id === selection.divide);
    setCourses(makeCoursesFromTemplate(d?.courses || []));
    try { localStorage.removeItem(`sgpa_calc_v2_${selection.semester}_${selection.divide}`); } catch {}
  }, [selection]);

  const sgpa         = calculateSGPA(courses);
  const scored       = courses.filter(c => c.creditGradeProduct !== null);
  const totalCredits = scored.reduce((s, c) => s + c.credits, 0);
  const totalCGP     = scored.reduce((s, c) => s + c.creditGradeProduct, 0);
  const isCompleted  = SEMESTERS.find(s => s.id === selection?.semester)?.completed ?? false;
  const cgpaData     = useCGPA(courses, selection);

  if (!selection && !switchOpen) return <SelectionScreen onSelect={handleSelect} />;
  if (switchOpen) return (
    <window.ToastProvider>
      <SelectionScreen onSelect={handleSelect} onClose={() => setSwitchOpen(false)} />
    </window.ToastProvider>
  );

  const views = {
    courses:   <window.CourseManager courses={courses} onUpdate={updateCourse} onAdd={addCourse} onDelete={deleteCourse} completed={isCompleted} />,
    dashboard: <window.Dashboard courses={courses} sgpa={sgpa} totalCredits={totalCredits} totalCGP={totalCGP} />,
    reverse:   <window.ReverseCalculator courses={courses} sgpa={sgpa} />,
    settings:  <Settings courses={courses} sgpa={sgpa} onReset={resetAll} onSwitchDivide={() => setSwitchOpen(true)} selection={selection} />,
  };

  return (
    <window.ToastProvider>
      <div style={{ minHeight: '100vh', background: '#080b14' }}>
        <Header activeTab={activeTab} setActiveTab={setActiveTab} selection={selection} sgpa={sgpa} onSwitch={() => setSwitchOpen(true)} />

        {activeTab === 'courses' && <Hero selection={selection} sgpa={sgpa} courses={courses} />}

        {activeTab !== 'courses' && (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 20px', animation: 'fadeUp .4s ease both' }}>
            <window.SLabel style={{ display: 'block', marginBottom: 10 }}>RV University · SGPA Calculator</window.SLabel>
            <h1 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 'clamp(32px,5vw,56px)', letterSpacing: '-1.5px', color: '#F5EFEB', margin: 0 }}>
              {activeTab === 'dashboard' ? 'Dashboard.' : activeTab === 'reverse' ? 'Reverse Calc.' : 'Settings.'}
            </h1>
          </div>
        )}

        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 80px' }}>
          <div key={activeTab} style={{ animation: 'fadeUp .32s ease both' }}>
            {views[activeTab]}
          </div>
        </main>

        <footer style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,.2)', textAlign: 'center', letterSpacing: '1px' }}>
            RVU SGPA CALCULATOR · DATA PERSISTS IN LOCAL STORAGE · UNOFFICIAL TOOL
          </p>
        </footer>

        <CGPABox data={cgpaData} />
        <window.CursorFollower />
      </div>
    </window.ToastProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
