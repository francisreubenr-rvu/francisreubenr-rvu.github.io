// GPA Calc — Dashboard (Summary Card + Donut Chart + Breakdown)
const { useMemo } = React;
const { GRADING_SCALE, SGPA_STATUS } = window.GPAUtils;

// ── SVG Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({ courses }) {
  const scored = courses.filter(c => c.grade !== null);
  if (!scored.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'rgba(255,255,255,.2)', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
        no grades yet
      </div>
    );
  }

  // Count grades
  const counts = {};
  for (const c of scored) { counts[c.grade] = (counts[c.grade] || 0) + 1; }
  const total = scored.length;

  // Build arc segments
  const R = 56, r = 36, cx = 80, cy = 80;
  let angle = -90; // start at top
  const segments = [];

  for (const row of GRADING_SCALE) {
    const count = counts[row.grade] || 0;
    if (!count) continue;
    const pct = count / total;
    const sweep = pct * 360;
    const startRad = (angle * Math.PI) / 180;
    const endRad   = ((angle + sweep) * Math.PI) / 180;
    const x1 = cx + R * Math.cos(startRad), y1 = cy + R * Math.sin(startRad);
    const x2 = cx + R * Math.cos(endRad),   y2 = cy + R * Math.sin(endRad);
    const ix1 = cx + r * Math.cos(startRad), iy1 = cy + r * Math.sin(startRad);
    const ix2 = cx + r * Math.cos(endRad),   iy2 = cy + r * Math.sin(endRad);
    const large = sweep > 180 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1} Z`;
    segments.push({ d, color: row.color, grade: row.grade, count, pct });
    angle += sweep;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg width={160} height={160} viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
        {segments.map((s, i) => (
          <path key={s.grade} d={s.d} fill={s.color} fillOpacity={0.85} style={{ cursor: 'default' }}>
            <title>{s.grade}: {s.count} course{s.count !== 1 ? 's' : ''}</title>
          </path>
        ))}
        {/* Center label */}
        <text x={cx} y={cy - 7} textAnchor="middle" fill="#F5EFEB" fontSize={22} fontFamily="'Hanken Grotesk', sans-serif" fontWeight={300}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#8B8986" fontSize={9} fontFamily="'DM Mono', monospace" letterSpacing="1.5">COURSES</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map(s => (
          <div key={s.grade} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, background: s.color, flexShrink: 0 }}></div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: s.color, width: 22 }}>{s.grade}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8B8986' }}>{s.count}× · {(s.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SGPA Summary Card ────────────────────────────────────────────────────────
function SGPASummaryCard({ sgpa, totalCredits, totalCGP, coursesCount }) {
  const displaySGPA  = window.useAnimatedNumber(sgpa || 0,  900, 2);
  const displayCreds = window.useAnimatedNumber(totalCredits, 600, 0);
  const displayCGP   = window.useAnimatedNumber(totalCGP,  700, 0);

  const status = SGPA_STATUS.find(s => (sgpa || 0) >= s.min) || SGPA_STATUS[SGPA_STATUS.length - 1];
  const pct    = Math.min(((sgpa || 0) / 10) * 100, 100);

  return (
    <div style={{
      background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)',
      padding: '32px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative rings */}
      <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(255,255,255,.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: -10, top: -10, width: 90, height: 90, borderRadius: '50%', border: '1px solid rgba(241,180,151,.08)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <window.SLabel style={{ display: 'block', marginBottom: 12 }}>Current SGPA</window.SLabel>
            <div style={{
              fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, lineHeight: 1,
              fontSize: 'clamp(52px,9vw,80px)', color: '#F1B497', letterSpacing: '-2px',
            }}>
              {sgpa !== null ? displaySGPA.toFixed(2) : '—'}
            </div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986', marginTop: 6 }}>out of 10.00</p>
          </div>

          {sgpa !== null && (
            <span style={{
              padding: '4px 12px', borderRadius: 40,
              border: `1px solid ${status.color}50`,
              color: status.color, background: `${status.color}14`,
              fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '1.5px',
              textTransform: 'uppercase', marginTop: 4,
            }}>{status.label}</span>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ height: 2, width: '100%', background: 'rgba(255,255,255,.1)', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#F1B497',
              width: `${pct}%`, transition: 'width 1s cubic-bezier(.34,1.56,.64,1)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,.25)' }}>0</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,.25)' }}>10</span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 20 }}>
          {[
            { label: 'Credits', val: displayCreds.toFixed(0) },
            { label: 'Total CGP', val: displayCGP.toFixed(0) },
            { label: 'Courses', val: coursesCount },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 30, color: '#F5EFEB', letterSpacing: '-0.5px' }}>{s.val}</div>
              <window.SLabel>{s.label}</window.SLabel>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, delay }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)',
      padding: '20px 24px', animation: `fadeUp .4s ease ${delay || 0}s both`,
    }}>
      <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 36, color: accent || '#F5EFEB', letterSpacing: '-0.5px', marginBottom: 8 }}>{value}</div>
      <window.SLabel>{label}</window.SLabel>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ courses, sgpa, totalCredits, totalCGP }) {
  const scored    = courses.filter(c => c.grade !== null);
  const oCount    = courses.filter(c => c.grade === 'O').length;
  const failCount = courses.filter(c => c.grade === 'F').length;
  const avgGP     = scored.length
    ? (scored.reduce((s, c) => s + (c.gradePoint || 0), 0) / scored.length).toFixed(2)
    : '—';
  const best = scored.reduce((b, c) => ((c.gradePoint || 0) > (b?.gradePoint || 0) ? c : b), null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SGPASummaryCard sgpa={sgpa} totalCredits={totalCredits} totalCGP={totalCGP} coursesCount={courses.length} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard label="O Grades"    value={oCount}   accent="#10B981" delay={0.05} />
        <StatCard label="Avg GP"      value={avgGP}    accent="#F1B497" delay={0.1}  />
        <StatCard label="Scored"      value={`${scored.length}/${courses.length}`} delay={0.15} />
        <StatCard label="Fails"       value={failCount} accent={failCount > 0 ? '#EF4444' : '#10B981'} delay={0.2} />
      </div>

      {/* Grade distribution */}
      <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)', padding: '24px 28px' }}>
        <window.SLabel style={{ display: 'block', marginBottom: 4 }}>Grade Distribution</window.SLabel>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986', marginBottom: 20 }}>Across all scored courses</p>
        <DonutChart courses={courses} />
      </div>

      {/* Course breakdown */}
      {scored.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)', padding: '24px 28px' }}>
          <window.SLabel style={{ display: 'block', marginBottom: 4 }}>Course Breakdown</window.SLabel>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986', marginBottom: 20 }}>Sorted by grade point · bars show total/100</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...scored].sort((a, b) => (b.gradePoint || 0) - (a.gradePoint || 0)).map((c, i) => {
              const row = GRADING_SCALE.find(r => r.grade === c.grade);
              const pct = ((c.totalMarks || 0) / 100) * 100;
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, animation: `fadeUp .35s ease ${0.05 * i}s both` }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986', width: 56, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.courseCode}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: '#F5EFEB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.courseName}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: row?.color, marginLeft: 8, flexShrink: 0 }}>{c.totalMarks}/100</span>
                    </div>
                    <div style={{ height: 2, background: 'rgba(255,255,255,.08)' }}>
                      <div style={{ height: '100%', background: row?.color || '#F1B497', width: `${pct}%`, transition: `width .6s ease ${0.05 * i}s` }} />
                    </div>
                  </div>
                  <span style={{
                    width: 32, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: row?.bg, color: row?.color, border: `1px solid ${row?.color || '#F1B497'}30`,
                    fontFamily: "'DM Mono', monospace", fontSize: 11, flexShrink: 0,
                  }}>{c.grade}</span>
                </div>
              );
            })}
          </div>
          {best && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.07)' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986' }}>
                Best: <span style={{ color: '#10B981' }}>{best.courseName}</span>
                <span style={{ color: 'rgba(255,255,255,.3)', margin: '0 6px' }}>·</span>
                {best.grade} · {best.creditGradeProduct} CGP
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

window.Dashboard = Dashboard;
