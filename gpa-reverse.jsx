// GPA Calc — Reverse Calculator (Marks Planner + Grade Simulator)
const { useState, useEffect, useMemo } = React;
const { GRADING_SCALE, SGPA_STATUS, DIFFICULTY_LEVELS, VALID_GPS, reverseCalculate, calcSGPAFromGradeMap } = window.GPAUtils;

const SIM_GP_ORDER = [10, 9, 8, 7, 6, 5, 4, 0];
const DEFAULT_SIM_GP = 6;

function cycleGP(cur) {
  const idx = SIM_GP_ORDER.indexOf(cur);
  if (idx === -1) return DEFAULT_SIM_GP;
  return SIM_GP_ORDER[(idx + 1) % SIM_GP_ORDER.length];
}

// ── Mode Toggle ──────────────────────────────────────────────────────────────
function ModeToggle({ mode, setMode }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, padding: 3, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 4 }}>
      {[['planner','Marks Planner'],['simulator','Grade Simulator']].map(([id, lbl]) => (
        <button key={id} onClick={() => setMode(id)} style={{
          padding: '7px 16px', fontSize: 11, fontFamily: "'DM Mono', monospace",
          letterSpacing: '.5px', textTransform: 'uppercase', border: 'none', cursor: 'pointer',
          background: mode === id ? 'rgba(255,255,255,.12)' : 'transparent',
          color: mode === id ? '#F5EFEB' : '#8B8986',
          transition: 'all .15s', borderRadius: 2,
        }}>{lbl}</button>
      ))}
    </div>
  );
}

// ── Achievable Pathways (empty state) ────────────────────────────────────────
function Pathways({ courses, onSelect }) {
  const locked   = courses.filter(c => c.creditGradeProduct !== null);
  const variable = courses.filter(c => c.creditGradeProduct === null);
  if (!variable.length) return null;

  const totalCr   = courses.reduce((s, c) => s + c.credits, 0);
  const lockedCGP = locked.reduce((s, c) => s + c.creditGradeProduct, 0);
  const varCr     = variable.reduce((s, c) => s + c.credits, 0);

  const paths = [10, 9, 8, 7, 6].map(gp => {
    const row  = GRADING_SCALE.find(r => r.point === gp);
    const sgpa = (lockedCGP + varCr * gp) / totalCr;
    return { gp, grade: row?.grade, row, sgpa };
  }).filter(p => p.sgpa <= 10).slice(0, 4);

  return (
    <div>
      <window.SLabel style={{ display: 'block', marginBottom: 4 }}>Achievable Pathways</window.SLabel>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,.3)', marginBottom: 16 }}>if all pending courses score this grade — click to auto-calculate</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
        {paths.map(p => (
          <button key={p.gp} onClick={() => onSelect(p.sgpa.toFixed(2))}
            style={{
              padding: '16px', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)',
              cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.borderColor = `${p.row?.color}40`; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}
          >
            <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 32, color: p.row?.color, lineHeight: 1 }}>{p.grade}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#8B8986', marginTop: 8, marginBottom: 4 }}>all pending</div>
            <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 22, color: '#F5EFEB' }}>{p.sgpa.toFixed(2)}</div>
            <window.SLabel>SGPA</window.SLabel>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Marks Planner ────────────────────────────────────────────────────────────
function MarksPlanner({ courses }) {
  const [target,  setTarget]  = useState('');
  const [results, setResults] = useState(null);
  const toast = window.useToast();

  const calculate = (val) => {
    const str = val !== undefined ? String(val) : target;
    const t = parseFloat(str);
    if (!isFinite(t) || t < 0 || t > 10) { toast('Target SGPA must be 0–10', 'error'); return; }
    if (!courses.length)                  { toast('No courses found', 'error'); return; }
    setResults(reverseCalculate(courses, t));
  };

  const handlePathwaySelect = (sgpaStr) => {
    setTarget(sgpaStr);
    const t = parseFloat(sgpaStr);
    setResults(reverseCalculate(courses, t));
  };

  const adjVar    = (results || []).filter(r => !r.locked);
  const adjLocked = (results || []).filter(r =>  r.locked);
  const impossible = adjVar.filter(r => !r.feasible);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Input panel */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '28px 28px', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)' }}>
        {/* Subtle grid */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(209,195,178,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(209,195,178,.025) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'absolute', right: 28, top: 28, width: 64, height: 64, borderRadius: '50%', border: '1px solid rgba(241,180,151,.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 48, top: 48, width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(241,180,151,.08)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <window.SLabel style={{ display: 'block', marginBottom: 4 }}>Reverse Calculator</window.SLabel>
          <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 18, color: '#F5EFEB', marginBottom: 4 }}>
            Find the marks needed for your target SGPA.
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986', marginBottom: 24 }}>
            Distributes required marks across incomplete assessments.
          </p>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <window.SLabel style={{ display: 'block', marginBottom: 10 }}>Target SGPA</window.SLabel>
              <input
                type="number" inputMode="decimal" min={0} max={10} step={0.1}
                placeholder="e.g. 9.0"
                value={target}
                onChange={e => setTarget(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                style={{
                  width: '100%', background: 'transparent',
                  borderBottom: '1px solid rgba(209,195,178,.3)', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  color: '#F1B497', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300,
                  fontSize: 'clamp(28px, 5vw, 44px)', letterSpacing: '-1px',
                  outline: 'none', paddingBottom: 6,
                }}
                onFocus={e => e.target.style.borderBottomColor = '#F1B497'}
                onBlur={e => e.target.style.borderBottomColor = 'rgba(209,195,178,.3)'}
              />
            </div>
            <button onClick={() => calculate()} style={{
              padding: '11px 28px', background: '#F1B497', border: 'none', color: '#080b14',
              fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11, letterSpacing: '1px',
              textTransform: 'uppercase', cursor: 'pointer', fontWeight: 500, flexShrink: 0,
              transition: 'background .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#DEA083'}
            onMouseLeave={e => e.currentTarget.style.background = '#F1B497'}
            >Calculate</button>
          </div>

          {/* Quick presets */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {[7.0, 8.0, 9.0, 9.5, 10.0].map(v => (
              <button key={v} onClick={() => setTarget(String(v))} style={{
                padding: '4px 12px', fontSize: 11, fontFamily: "'DM Mono', monospace",
                background: parseFloat(target) === v ? 'rgba(241,180,151,.18)' : 'rgba(255,255,255,.05)',
                border: `1px solid ${parseFloat(target) === v ? 'rgba(241,180,151,.5)' : 'rgba(255,255,255,.1)'}`,
                color: parseFloat(target) === v ? '#F1B497' : 'rgba(255,255,255,.35)',
                cursor: 'pointer', transition: 'all .15s',
              }}>{v.toFixed(1)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {results ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Summary banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            background: impossible.length ? 'rgba(239,68,68,.06)' : 'rgba(16,185,129,.06)',
            border: `1px solid ${impossible.length ? 'rgba(239,68,68,.25)' : 'rgba(16,185,129,.25)'}`,
          }}>
            <span style={{ fontSize: 14 }}>{impossible.length ? '⚠' : '✓'}</span>
            <p style={{ fontSize: 13, color: impossible.length ? '#EF4444' : '#10B981', fontFamily: "'Hanken Grotesk', sans-serif" }}>
              {impossible.length
                ? `${impossible.length} course${impossible.length !== 1 ? 's' : ''} cannot reach target — lower the target or check marks.`
                : `SGPA ${parseFloat(target).toFixed(2)} is achievable with the targets below.`}
            </p>
          </div>

          {/* Variable courses */}
          {adjVar.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                <window.SLabel>Marks Required per Course</window.SLabel>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 3 }}>pending assessments shown</p>
              </div>
              {adjVar.map((r, i) => {
                const gradeRow = GRADING_SCALE.find(g => g.grade === r.targetGrade);
                const diff = DIFFICULTY_LEVELS.find(d => d.id === (r.difficulty || 'medium'));
                return (
                  <div key={r.id} style={{
                    padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)',
                    background: !r.feasible ? 'rgba(239,68,68,.03)' : 'transparent',
                    animation: `fadeUp .3s ease ${i * 0.05}s both`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986' }}>{r.courseCode}</span>
                          <span style={{ padding: '1px 6px', background: 'rgba(241,180,151,.1)', color: '#F1B497', fontFamily: "'DM Mono', monospace", fontSize: 10 }}>{r.credits}cr</span>
                          {diff && <span style={{ padding: '1px 6px', background: diff.bg, color: diff.color, border: `1px solid ${diff.color}30`, fontFamily: "'DM Mono', monospace", fontSize: 10 }}>{diff.label}</span>}
                        </div>
                        <p style={{ fontSize: 13, color: '#F5EFEB', marginBottom: r.pending?.length ? 8 : 0 }}>{r.courseName}</p>
                        {r.feasible && r.pending?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {r.pending.map(p => (
                              <span key={p.key} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,.06)', color: '#8B8986' }}>
                                {p.key}: <span style={{ color: '#F1B497' }}>{p.target}</span><span style={{ color: 'rgba(255,255,255,.3)' }}>/{p.max}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {r.scoredSoFar > 0 && (
                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986', marginTop: 5 }}>scored so far: {r.scoredSoFar}</p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', marginBottom: 6 }}>
                          <window.SLabel>target</window.SLabel>
                          <span style={{
                            padding: '3px 10px', background: gradeRow?.bg, color: gradeRow?.color,
                            border: `1px solid ${gradeRow?.color || '#8B8986'}35`,
                            fontFamily: "'DM Mono', monospace", fontSize: 11,
                          }}>{r.targetGrade}</span>
                        </div>
                        {r.feasible ? (
                          r.neededFromPending === 0
                            ? <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#10B981' }}>Already achieved ✓</p>
                            : (
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
                                <window.SLabel>need</window.SLabel>
                                <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 28, color: '#F1B497', letterSpacing: '-0.5px' }}>{r.neededFromPending}</span>
                                <window.SLabel>/{r.maxFromPending}</window.SLabel>
                              </div>
                            )
                        ) : (
                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#EF4444' }}>⚠ Insufficient marks remaining</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Locked courses */}
          {adjLocked.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12 }}>🔒</span>
                <window.SLabel>Locked — all marks entered</window.SLabel>
              </div>
              {adjLocked.map(r => {
                const gr = GRADING_SCALE.find(g => g.grade === r.grade);
                return (
                  <div key={r.id} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986' }}>{r.courseCode}</span>
                      <p style={{ fontSize: 13, color: '#F5EFEB' }}>{r.courseName}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8B8986' }}>{r.totalMarks}/100</span>
                      <span style={{ padding: '2px 8px', background: gr?.bg, color: gr?.color, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{r.grade}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8B8986' }}>{r.creditGradeProduct} CGP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <Pathways courses={courses} onSelect={handlePathwaySelect} />
      )}
    </div>
  );
}

// ── Grade Simulator ──────────────────────────────────────────────────────────
function GradeSimulator({ courses, currentSGPA }) {
  const [simGrades, setSimGrades] = useState(() =>
    Object.fromEntries(courses.map(c => [c.id, c.gradePoint != null ? c.gradePoint : DEFAULT_SIM_GP]))
  );

  useEffect(() => {
    setSimGrades(prev => {
      const next = {};
      for (const c of courses) { next[c.id] = prev[c.id] !== undefined ? prev[c.id] : (c.gradePoint != null ? c.gradePoint : DEFAULT_SIM_GP); }
      return next;
    });
  }, [courses]);

  const simSGPA = useMemo(() => calcSGPAFromGradeMap(courses, simGrades, DEFAULT_SIM_GP), [courses, simGrades]);
  const displaySGPA = window.useAnimatedNumber(simSGPA || 0, 600, 2);
  const status = SGPA_STATUS.find(s => (simSGPA || 0) >= s.min) || SGPA_STATUS[SGPA_STATUS.length - 1];
  const delta = simSGPA !== null && currentSGPA !== null ? simSGPA - currentSGPA : null;
  const isDirty = courses.some(c => simGrades[c.id] !== (c.gradePoint != null ? c.gradePoint : DEFAULT_SIM_GP));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* SGPA preview */}
      <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)', padding: '28px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <window.SLabel style={{ display: 'block', marginBottom: 8 }}>Simulated SGPA</window.SLabel>
            <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 'clamp(48px, 8vw, 72px)', color: status.color, lineHeight: 1, letterSpacing: '-2px' }}>
              {displaySGPA.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ padding: '4px 12px', borderRadius: 40, border: `1px solid ${status.color}50`, color: status.color, background: `${status.color}14`, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {status.label}
            </span>
            {delta !== null && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, marginTop: 10, color: delta >= 0 ? '#10B981' : '#EF4444' }}>
                {delta >= 0 ? '+' : ''}{delta.toFixed(2)} vs current
              </p>
            )}
            {isDirty && (
              <button onClick={() => setSimGrades(Object.fromEntries(courses.map(c => [c.id, c.gradePoint != null ? c.gradePoint : DEFAULT_SIM_GP])))}
                style={{ marginTop: 10, padding: '4px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,.18)', color: '#8B8986', fontFamily: "'DM Mono', monospace", fontSize: 10, cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#F1B497'; e.currentTarget.style.color = '#F1B497'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.18)'; e.currentTarget.style.color = '#8B8986'; }}
              >↺ Reset</button>
            )}
          </div>
        </div>
      </div>

      {/* Grade cycling table */}
      <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
        <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <window.SLabel>Select Grade per Course</window.SLabel>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 3 }}>tap grade to cycle · O → A+ → A → B+ → B → C → P → F</p>
        </div>
        {courses.map((c, i) => {
          const gp = simGrades[c.id] != null ? simGrades[c.id] : DEFAULT_SIM_GP;
          const gr = GRADING_SCALE.find(g => g.point === gp);
          const diverged = gp !== (c.gradePoint != null ? c.gradePoint : DEFAULT_SIM_GP);
          return (
            <div key={c.id} style={{
              padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.05)',
              display: 'flex', alignItems: 'center', gap: 12,
              animation: `fadeUp .3s ease ${i * 0.04}s both`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986' }}>{c.courseCode}</span>
                  <span style={{ padding: '1px 6px', background: 'rgba(241,180,151,.1)', color: '#F1B497', fontFamily: "'DM Mono', monospace", fontSize: 10 }}>{c.credits}cr</span>
                </div>
                <p style={{ fontSize: 13, color: '#F5EFEB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.courseName}</p>
              </div>
              <button
                onClick={() => setSimGrades(prev => ({ ...prev, [c.id]: cycleGP(prev[c.id] || DEFAULT_SIM_GP) }))}
                style={{
                  padding: '4px 14px', background: gr?.bg, color: gr?.color,
                  border: `1px solid ${gr?.color || '#8B8986'}${diverged ? '90' : '30'}`,
                  outline: diverged ? `1px solid ${gr?.color || '#8B8986'}35` : 'none', outlineOffset: 2,
                  fontFamily: "'DM Mono', monospace", fontSize: 12, cursor: 'pointer',
                  transition: 'all .15s', flexShrink: 0,
                }}
              >{gr?.grade || 'B'}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Root ReverseCalculator ───────────────────────────────────────────────────
function ReverseCalculator({ courses, sgpa }) {
  const [mode, setMode] = useState('planner');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ModeToggle mode={mode} setMode={setMode} />
      {mode === 'planner'
        ? <MarksPlanner courses={courses} />
        : <GradeSimulator courses={courses} currentSGPA={sgpa} />
      }
    </div>
  );
}

window.ReverseCalculator = ReverseCalculator;
