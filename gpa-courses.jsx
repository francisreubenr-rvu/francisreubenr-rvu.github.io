// GPA Calc — Course Manager
const { useState, useCallback } = React;
const { ASSESSMENT_CAPS, GRADING_SCALE, DIFFICULTY_LEVELS } = window.GPAUtils;

const FIELDS = [
  { key: 'cie1Marks', label: 'CIE 1', max: ASSESSMENT_CAPS.cie1 },
  { key: 'cie2Marks', label: 'CIE 2', max: ASSESSMENT_CAPS.cie2 },
  { key: 'cie3Marks', label: 'CIE 3', max: ASSESSMENT_CAPS.cie3 },
  { key: 'seeMarks',  label: 'SEE',   max: ASSESSMENT_CAPS.see  },
];
const FIELD_WARN = { cie1Marks: 'cie1', cie2Marks: 'cie2', cie3Marks: 'cie3' };
const CREDIT_OPTIONS = [1, 2, 3, 4, 5];

// ── Add Course Modal ─────────────────────────────────────────────────────────
function AddCourseModal({ open, onClose, onAdd, existingCodes }) {
  const blank = { courseCode: '', courseName: '', credits: 3, cie1Marks: null, cie2Marks: null, cie3Marks: null, seeMarks: null };
  const [form, setForm] = useState(blank);
  const toast = window.useToast();
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = () => {
    if (!form.courseCode.trim()) { toast('Course code required', 'error'); return; }
    if (!form.courseName.trim()) { toast('Course name required', 'error'); return; }
    const code = form.courseCode.trim().toUpperCase();
    if (existingCodes.includes(code)) { toast('Duplicate course code', 'error'); return; }
    onAdd({ ...form, courseCode: code, courseName: form.courseName.trim() });
    setForm(blank);
    onClose();
  };

  return (
    <window.Modal open={open} onClose={onClose} title="Add Custom Course">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <window.InputField label="Course Code" type="text" placeholder="e.g. CS2001"
          value={form.courseCode} onChange={e => set('courseCode', e.target.value)} />
        <window.InputField label="Course Name" type="text" placeholder="e.g. Computer Networks"
          value={form.courseName} onChange={e => set('courseName', e.target.value)} />

        <div>
          <window.SLabel style={{ display: 'block', marginBottom: 8 }}>Credits</window.SLabel>
          <div style={{ display: 'flex', gap: 6 }}>
            {CREDIT_OPTIONS.map(n => (
              <button key={n} onClick={() => set('credits', n)} style={{
                flex: 1, padding: '8px 0', fontSize: 13,
                fontFamily: "'Hanken Grotesk', sans-serif",
                background: form.credits === n ? '#F1B497' : 'transparent',
                color: form.credits === n ? '#080b14' : '#8B8986',
                border: `1px solid ${form.credits === n ? '#F1B497' : 'rgba(255,255,255,.18)'}`,
                cursor: 'pointer', transition: 'all .15s',
              }}>{n}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {FIELDS.map(f => (
            <window.InputField key={f.key} label={`${f.label} (0–${f.max})`}
              type="number" min={0} max={f.max} placeholder="—"
              value={form[f.key] != null ? form[f.key] : ''}
              onChange={e => set(f.key, e.target.value === '' ? null : Number(e.target.value))} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px 0', background: 'transparent', cursor: 'pointer',
            border: '1px solid rgba(255,255,255,.18)', color: '#F5EFEB',
            fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase',
          }}>Cancel</button>
          <button onClick={submit} style={{
            flex: 1, padding: '11px 0', background: '#F1B497', cursor: 'pointer',
            border: 'none', color: '#080b14', fontWeight: 500,
            fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase',
          }}>Add Course</button>
        </div>
      </div>
    </window.Modal>
  );
}

// ── Pass Warnings ────────────────────────────────────────────────────────────
function PassWarnings({ w }) {
  const msgs = [
    w?.cie1  && 'CIE 1 <8',
    w?.cie2  && 'CIE 2 <10',
    w?.cie3  && 'CIE 3 <10',
    w?.total && 'CIE total <28/70',
  ].filter(Boolean);
  if (!msgs.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
      {msgs.map(m => (
        <span key={m} style={{
          fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '1px 6px',
          background: 'rgba(245,158,11,.08)', color: '#D97706', border: '1px solid rgba(245,158,11,.2)',
        }}>⚠ {m}</span>
      ))}
    </div>
  );
}

// ── Compact Credits chip ─────────────────────────────────────────────────────
function CrChip({ n }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24,
      background: 'rgba(241,180,151,.1)', color: '#F1B497',
      fontFamily: "'DM Mono', monospace", fontSize: 11,
    }}>{n}</span>
  );
}

// ── Course Manager ────────────────────────────────────────────────────────────
function CourseManager({ courses, onUpdate, onAdd, onDelete, completed }) {
  const [showAdd,      setShowAdd]      = useState(false);
  const [deleteId,     setDeleteId]     = useState(null);
  const [fieldErrors,  setFieldErrors]  = useState({});
  const toast = window.useToast();

  const showFieldError = useCallback((courseId, field, msg) => {
    const key = `${field}-${courseId}`;
    setFieldErrors(prev => ({ ...prev, [key]: msg }));
    setTimeout(() => setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n; }), 2500);
  }, []);

  const handleMarks = useCallback((id, field, value) => {
    if (field === 'difficulty' || field === 'directGrade') { onUpdate(id, { [field]: value }); return; }
    if (value === null) { onUpdate(id, { [field]: null }); return; }
    const cap = FIELDS.find(f => f.key === field)?.max ?? 100;
    if (value < 0)   { showFieldError(id, field, 'Min is 0');     return; }
    if (value > cap) { showFieldError(id, field, `Max is ${cap}`); return; }
    onUpdate(id, { [field]: value });
  }, [onUpdate, showFieldError]);

  const confirmDelete = id => {
    onDelete(id); setDeleteId(null); toast('Course removed', 'info');
  };

  // shared cell/header styles
  const thS = { fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: '#8B8986', padding: '10px 12px', textAlign: 'left', background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.1)', whiteSpace: 'nowrap' };
  const tdS = { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,.05)', verticalAlign: 'middle' };
  const numS = { ...tdS, fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#8B8986', textAlign: 'center' };

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <window.SLabel style={{ display: 'block', marginBottom: 6 }}>Course Management</window.SLabel>
          <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 300, fontSize: 'clamp(22px,4vw,30px)', color: '#F5EFEB', letterSpacing: '-0.5px', margin: 0 }}>
            {completed ? 'Semester Results' : 'Enter Your Marks'}
          </h2>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8B8986', marginTop: 5 }}>
            {completed
              ? 'Tap a grade badge to cycle through O → A+ → A → B+ → B → C → P → F'
              : 'CIE 1 (/20) + CIE 2 (/25) + CIE 3 (/25) + SEE (/30) · Total out of 100'}
          </p>
        </div>
        {!completed && (
          <button onClick={() => setShowAdd(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
            background: '#F1B497', border: 'none', color: '#080b14', fontWeight: 500,
            fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase',
            cursor: 'pointer', flexShrink: 0, transition: 'background .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#DEA083'}
          onMouseLeave={e => e.currentTarget.style.background = '#F1B497'}
          >+ Add Course</button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: completed ? 500 : 860 }}>
          <thead>
            <tr>
              {completed ? (
                ['Code','Course','Cr','Grade','GP','Cr×GP',''].map(h => <th key={h} style={thS}>{h}</th>)
              ) : (
                ['Code','Course','Vibe','Cr','CIE 1 /20','CIE 2 /25','CIE 3 /25','SEE /30','Total','Grade','Cr×GP',''].map(h => <th key={h} style={thS}>{h}</th>)
              )}
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => {
              const hasWarn = c.passWarnings?.cie1 || c.passWarnings?.cie2 || c.passWarnings?.cie3 || c.passWarnings?.total;
              return (
                <tr key={c.id}
                  style={{ borderLeft: hasWarn ? '2px solid rgba(245,158,11,.7)' : '2px solid transparent', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tdS, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8B8986' }}>{c.courseCode}</td>
                  <td style={{ ...tdS, maxWidth: 180 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: '#F5EFEB' }} title={c.courseName}>{c.courseName}</span>
                    {!completed && hasWarn && <PassWarnings w={c.passWarnings} />}
                  </td>
                  <td style={tdS}><CrChip n={c.credits} /></td>

                  {completed ? (
                    <>
                      <td style={tdS}>
                        <window.GradeCycleButton grade={c.directGrade ?? null} onChange={v => handleMarks(c.id, 'directGrade', v)} />
                      </td>
                      <td style={numS}>{c.gradePoint != null ? c.gradePoint : <span style={{ color: 'rgba(255,255,255,.2)' }}>—</span>}</td>
                      <td style={numS}>{c.creditGradeProduct != null ? c.creditGradeProduct : <span style={{ color: 'rgba(255,255,255,.2)' }}>—</span>}</td>
                    </>
                  ) : (
                    <>
                      <td style={tdS}><window.DiffBadge difficulty={c.difficulty} onChange={v => handleMarks(c.id, 'difficulty', v)} /></td>
                      {FIELDS.map(f => (
                        <td key={f.key} style={tdS}>
                          <window.MarksInput
                            value={c[f.key]}
                            onChange={v => handleMarks(c.id, f.key, v)}
                            max={f.max}
                            error={fieldErrors[`${f.key}-${c.id}`]}
                            warn={!!(FIELD_WARN[f.key] && c.passWarnings?.[FIELD_WARN[f.key]])}
                          />
                        </td>
                      ))}
                      <td style={{ ...numS, color: c.totalMarks != null ? '#F5EFEB' : 'rgba(255,255,255,.2)' }}>
                        {c.totalMarks != null ? c.totalMarks : '—'}
                      </td>
                      <td style={tdS}><window.GradeCell grade={c.grade} gradePoint={c.gradePoint} /></td>
                      <td style={numS}>{c.creditGradeProduct != null ? c.creditGradeProduct : <span style={{ color: 'rgba(255,255,255,.2)' }}>—</span>}</td>
                    </>
                  )}

                  <td style={{ ...tdS, width: 40 }}>
                    <button className="del-btn" onClick={() => setDeleteId(c.id)} style={{
                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.18)',
                      opacity: 0, transition: 'all .15s', fontSize: 13,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.18)'}
                    >✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddCourseModal
        open={showAdd} onClose={() => setShowAdd(false)}
        onAdd={data => { onAdd(data); toast('Course added', 'success'); }}
        existingCodes={courses.map(c => c.courseCode)}
      />

      <window.Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Course" width="360px">
        <p style={{ fontSize: 13, color: '#8B8986', lineHeight: 1.65, marginBottom: 22 }}>
          This course and all entered marks will be permanently removed from this session.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setDeleteId(null)} style={{
            flex: 1, padding: '11px 0', background: 'transparent', cursor: 'pointer',
            border: '1px solid rgba(255,255,255,.18)', color: '#F5EFEB',
            fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase',
          }}>Cancel</button>
          <button onClick={() => confirmDelete(deleteId)} style={{
            flex: 1, padding: '11px 0', background: '#EF4444', border: 'none', cursor: 'pointer', color: '#fff',
            fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase',
          }}>Remove</button>
        </div>
      </window.Modal>
    </div>
  );
}

window.CourseManager = CourseManager;
