// GPA Calc — Shared UI Components
const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

// ── Animated Number Hook ─────────────────────────────────────────────────────
function useAnimatedNumber(target, duration, decimals) {
  duration = duration || 800;
  decimals = decimals != null ? decimals : 2;
  const [current, setCurrent] = useState(target || 0);
  const prevRef = useRef(target || 0);
  useEffect(() => {
    const start = prevRef.current;
    const end   = target || 0;
    const diff  = end - start;
    if (Math.abs(diff) < 0.001) { setCurrent(end); return; }
    const t0 = performance.now();
    let raf;
    function step(now) {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setCurrent(start + diff * e);
      if (p < 1) { raf = requestAnimationFrame(step); }
      else { prevRef.current = end; setCurrent(end); }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return current;
}

// ── Toast System ─────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type) => {
    type = type || 'info';
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  const colorMap = {
    error:   { bg: 'rgba(239,68,68,.1)',   border: 'rgba(239,68,68,.4)',   color: '#F87171'  },
    success: { bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.4)',  color: '#34D399'  },
    warning: { bg: 'rgba(245,158,11,.1)',  border: 'rgba(245,158,11,.4)',  color: '#FBBF24'  },
    info:    { bg: 'rgba(255,255,255,.07)',border: 'rgba(255,255,255,.18)',color: '#F5EFEB'  },
  };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => {
          const c = colorMap[t.type] || colorMap.info;
          return (
            <div key={t.id} style={{
              padding: '10px 16px', background: c.bg, border: `1px solid ${c.border}`,
              color: c.color, fontFamily: "'DM Mono', monospace", fontSize: 12,
              maxWidth: 280, lineHeight: 1.5, animation: 'toastIn .25s ease',
            }}>{t.message}</div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() { return useContext(ToastContext); }

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width }) {
  width = width || '480px';
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(4,6,14,0.82)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{
        width: '100%', maxWidth: width, background: '#0d1021',
        border: '1px solid rgba(241,180,151,.2)', padding: '28px 28px',
        animation: 'modalIn .25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#8B8986' }}>{title}</span>
          <button onClick={onClose} style={{ color: '#8B8986', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── GradeCell (display only) ─────────────────────────────────────────────────
function GradeCell({ grade, gradePoint }) {
  const { GRADING_SCALE } = window.GPAUtils;
  const row = GRADING_SCALE.find(r => r.grade === grade);
  if (!grade) return <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,.2)' }}>—</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px',
      background: row ? row.bg : 'transparent',
      color: row ? row.color : '#F5EFEB',
      border: `1px solid ${row ? row.color + '35' : 'transparent'}`,
      fontFamily: "'DM Mono', monospace", fontSize: 11,
    }}>
      {grade}
      <span style={{ opacity: 0.55, fontSize: 10 }}>{gradePoint}</span>
    </span>
  );
}

// ── GradeCycleButton (for completed semesters) ───────────────────────────────
const GRADE_ORDER = ['O','A+','A','B+','B','C','P','F'];

function GradeCycleButton({ grade, onChange }) {
  const { GRADING_SCALE } = window.GPAUtils;
  const row = GRADING_SCALE.find(r => r.grade === grade);
  const idx = GRADE_ORDER.indexOf(grade);
  const next = () => {
    if (!grade) { onChange(GRADE_ORDER[0]); return; }
    onChange(idx === GRADE_ORDER.length - 1 ? null : GRADE_ORDER[idx + 1]);
  };
  return (
    <button onClick={next} title="Tap to cycle grade"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px',
        background: row ? row.bg : 'rgba(255,255,255,.04)',
        color: row ? row.color : 'rgba(255,255,255,.3)',
        border: `1px solid ${row ? row.color + '50' : 'rgba(255,255,255,.12)'}`,
        fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: 'pointer',
        transition: 'all .15s',
      }}>
      {grade || '—'}
      {row && <span style={{ opacity: 0.55, fontSize: 10 }}>{row.point}</span>}
    </button>
  );
}

// ── MarksInput ───────────────────────────────────────────────────────────────
function MarksInput({ value, onChange, max, error, warn }) {
  const [focused, setFocused] = useState(false);
  const borderColor = focused ? '#F1B497' : (warn ? 'rgba(245,158,11,.7)' : 'rgba(255,255,255,.15)');
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {error && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 5px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#0d1021', border: '1px solid rgba(241,180,151,.4)',
          color: '#F1B497', fontFamily: "'DM Mono', monospace", fontSize: 10,
          padding: '3px 8px', whiteSpace: 'nowrap', zIndex: 20, pointerEvents: 'none',
        }}>{error}</div>
      )}
      <input
        type="number" inputMode="decimal" min={0} max={max}
        value={value != null ? value : ''}
        placeholder="—"
        onChange={e => {
          const raw = e.target.value;
          if (raw === '') { onChange(null); return; }
          const n = parseFloat(raw);
          if (isFinite(n)) onChange(n);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: 48, textAlign: 'center',
          background: focused ? 'rgba(241,180,151,.06)' : 'transparent',
          border: `1px solid ${borderColor}`,
          color: '#F5EFEB', fontFamily: "'DM Mono', monospace", fontSize: 13,
          padding: '4px 0', outline: 'none', transition: 'all .15s',
        }}
      />
    </div>
  );
}

// ── DiffBadge ────────────────────────────────────────────────────────────────
function DiffBadge({ difficulty, onChange }) {
  const { DIFFICULTY_LEVELS } = window.GPAUtils;
  const d = DIFFICULTY_LEVELS.find(x => x.id === (difficulty || 'medium')) || DIFFICULTY_LEVELS[1];
  const next = () => {
    const ids = ['easy','medium','hard'];
    onChange(ids[(ids.indexOf(d.id) + 1) % ids.length]);
  };
  return (
    <button onClick={next} style={{
      padding: '2px 8px', fontFamily: "'DM Mono', monospace", fontSize: 10,
      background: d.bg, color: d.color, border: `1px solid ${d.color}40`,
      cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
    }}>{d.label}</button>
  );
}

// ── InputField (for modals/forms) ────────────────────────────────────────────
function InputField({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  const { style: propStyle, onFocus: pFocus, onBlur: pBlur, ...rest } = props;
  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: '#8B8986', marginBottom: 7 }}>
          {label}
        </label>
      )}
      <input
        {...rest}
        onFocus={e => { setFocused(true); pFocus && pFocus(e); }}
        onBlur={e => { setFocused(false); pBlur && pBlur(e); }}
        style={{
          width: '100%', background: focused ? 'rgba(241,180,151,.04)' : 'transparent',
          border: `1px solid ${focused ? '#F1B497' : 'rgba(255,255,255,.18)'}`,
          color: '#F5EFEB', fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14,
          padding: '10px 12px', outline: 'none', transition: 'all .15s',
          ...(propStyle || {}),
        }}
      />
    </div>
  );
}

// ── Label (section micro-label) ──────────────────────────────────────────────
function SLabel({ children, style }) {
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '2.5px',
      textTransform: 'uppercase', color: '#8B8986', ...(style || {}),
    }}>{children}</span>
  );
}

// ── Exports ──────────────────────────────────────────────────────────────────
Object.assign(window, {
  useAnimatedNumber, ToastProvider, useToast, Modal,
  GradeCell, GradeCycleButton, MarksInput, DiffBadge, InputField, SLabel,
});
