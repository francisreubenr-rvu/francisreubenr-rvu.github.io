import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, Lock, RotateCcw } from 'lucide-react'
import { reverseCalculate, calculateSGPAFromGradeMap } from '../utils/calculations'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { useToast } from './Toast'
import { GRADING_SCALE, DIFFICULTY_LEVELS, SGPA_STATUS } from '../utils/constants'

const VALID_GPS = [0, 4, 5, 6, 7, 8, 9, 10]
const SIM_GP_ORDER = [10, 9, 8, 7, 6, 5, 4, 0]

// ASCII mono labels for difficulty — cleaner than emoji in results context
const DIFF_MONO = { easy: '(++)', medium: '(··)', hard: '(--)' }

function nextGP(cur, base) {
  const idx = VALID_GPS.indexOf(cur)
  if (idx === -1 || idx === VALID_GPS.length - 1) return base
  return VALID_GPS[idx + 1]
}

function cycleSimGP(cur) {
  const idx = SIM_GP_ORDER.indexOf(cur)
  if (idx === -1) return 6
  return SIM_GP_ORDER[(idx + 1) % SIM_GP_ORDER.length]
}

// Distribute `needed` proportionally across `pending` items (by their cap)
function distribute(needed, pending) {
  if (!pending.length) return []
  let rem = needed
  return pending.map((p, i) => {
    const totalCap = pending.reduce((s, x) => s + x.max, 0)
    let target
    if (i < pending.length - 1) {
      target = totalCap > 0 ? Math.round(needed * p.max / totalCap) : 0
      rem -= target
    } else {
      target = Math.max(0, rem)
    }
    return { ...p, target: Math.min(p.max, Math.max(0, target)) }
  })
}

// Compute per-course adjusted view, incorporating expected-mark overrides
function applyExpected(r, expectedMarks) {
  const gradeRow = GRADING_SCALE.find(g => g.point === r.targetGradePoint)
  const minTotal = gradeRow ? gradeRow.min : 0

  const pendingWithExp = r.pending.map(p => {
    const raw = expectedMarks[`${r.id}::${p.key}`]
    const num = raw !== undefined && raw !== '' && isFinite(+raw)
      ? Math.min(p.max, Math.max(0, +raw)) : null
    return { ...p, expected: num }
  })

  const expectedSum = pendingWithExp.reduce((s, p) => s + (p.expected ?? 0), 0)
  const stillNeeded = Math.max(0, minTotal - r.scoredSoFar - expectedSum)
  const freePending = pendingWithExp.filter(p => p.expected === null)
  const freeCap     = freePending.reduce((s, p) => s + p.max, 0)

  const distribFree  = distribute(stillNeeded, freePending)
  let freeIdx = 0
  const finalPending = pendingWithExp.map(p => {
    if (p.expected !== null) return { ...p, target: p.expected, isExpected: true }
    return { ...distribFree[freeIdx++], isExpected: false }
  })

  return {
    ...r,
    pending:          finalPending,
    neededFromPending: stillNeeded,
    maxFromPending:   freeCap,
    feasible:         stillNeeded <= freeCap,
  }
}

const DEFAULT_SIM_GP = 6

export default function ReverseCalculator({ courses, sgpa }) {
  const [target, setTarget]               = useState('')
  const [results, setResults]             = useState(null)
  const [gpOverrides, setGpOverrides]     = useState({})   // courseId → gp
  const [expectedMarks, setExpectedMarks] = useState({})   // `${id}::${key}` → string
  const [mode, setMode]                   = useState('planner')

  const [simulatorGrades, setSimulatorGrades] = useState(() =>
    Object.fromEntries(courses.map(c => [c.id, c.gradePoint ?? DEFAULT_SIM_GP]))
  )

  useEffect(() => {
    setSimulatorGrades(prev => {
      const next = {}
      for (const c of courses) {
        next[c.id] = prev[c.id] !== undefined ? prev[c.id] : (c.gradePoint ?? DEFAULT_SIM_GP)
      }
      return next
    })
  }, [courses])

  const simulatorSGPA = useMemo(
    () => calculateSGPAFromGradeMap(courses, simulatorGrades, DEFAULT_SIM_GP),
    [courses, simulatorGrades]
  )
  const displaySimSGPA = useAnimatedNumber(simulatorSGPA ?? 0, 700, 2)
  const simStatus = SGPA_STATUS.find(s => (simulatorSGPA ?? 0) >= s.min) ?? SGPA_STATUS[SGPA_STATUS.length - 1]
  const delta = simulatorSGPA !== null && sgpa !== null ? simulatorSGPA - sgpa : null
  const simIsDirty = courses.some(c => simulatorGrades[c.id] !== (c.gradePoint ?? DEFAULT_SIM_GP))

  const handleSimGradeClick = (courseId) => {
    setSimulatorGrades(prev => ({ ...prev, [courseId]: cycleSimGP(prev[courseId] ?? DEFAULT_SIM_GP) }))
  }
  const resetSimulator = () => {
    setSimulatorGrades(Object.fromEntries(courses.map(c => [c.id, c.gradePoint ?? DEFAULT_SIM_GP])))
  }

  const toast = useToast()

  const hasOverrides = Object.keys(gpOverrides).length > 0 || Object.keys(expectedMarks).length > 0

  const calculate = (overrideTarget) => {
    const raw = overrideTarget ?? target
    const t = parseFloat(raw)
    if (!isFinite(t) || t < 0 || t > 10) { toast('Target SGPA must be 0–10', 'error'); return }
    if (courses.length === 0) { toast('No courses found', 'error'); return }
    setGpOverrides({})
    setExpectedMarks({})
    setResults(reverseCalculate(courses, t))
  }

  const handlePathwayClick = (sgpa) => {
    const str = sgpa.toFixed(2)
    setTarget(str)
    calculate(str)
  }

  const handleGradeClick = (baseResult) => {
    setGpOverrides(prev => {
      const cur  = prev[baseResult.id] ?? baseResult.targetGradePoint
      const next = nextGP(cur, baseResult.targetGradePoint)
      if (next === baseResult.targetGradePoint) {
        const { [baseResult.id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [baseResult.id]: next }
    })
  }

  // Full rebalance: when grade overrides exist, redistribute remaining SGPA
  // requirement across non-overridden variable courses, then apply expected marks.
  const adjResults = useMemo(() => {
    if (!results || results.length === 0) return []
    const t = parseFloat(target)
    if (!isFinite(t)) return results

    const totalCr    = results.reduce((s, r) => s + r.credits, 0)
    const reqCGP     = t * totalCr
    const locked     = results.filter(r => r.locked)
    const allVar     = results.filter(r => !r.locked)
    const overridden = allVar.filter(r => gpOverrides[r.id] !== undefined)
    const free       = allVar.filter(r => gpOverrides[r.id] === undefined)

    const lockedCGP    = locked.reduce((s, r) => s + r.creditGradeProduct, 0)
    const overrideCGP  = overridden.reduce((s, r) => s + r.credits * gpOverrides[r.id], 0)
    const freeCGPNeed  = reqCGP - lockedCGP - overrideCGP
    const freeCr       = free.reduce((s, r) => s + r.credits, 0)

    let freeGP = 0, freeImpossible = false
    if (free.length > 0 && freeCr > 0) {
      const rawMin  = freeCGPNeed / freeCr
      const freeIdx = VALID_GPS.findIndex(gp => gp >= rawMin)
      freeImpossible = freeIdx === -1
      freeGP = freeImpossible ? 10 : VALID_GPS[freeIdx]
    }

    return results.map(r => {
      if (r.locked) return r

      const isOverridden = gpOverrides[r.id] !== undefined
      const effGP        = isOverridden ? gpOverrides[r.id] : freeGP
      const gradeRow     = GRADING_SCALE.find(g => g.point === effGP)

      const rWithGP = {
        ...r,
        targetGradePoint: effGP,
        targetGrade:      gradeRow?.grade ?? 'F',
      }
      const adj = applyExpected(rWithGP, expectedMarks)

      // If globally impossible for free courses, mark infeasible
      if (!isOverridden && freeImpossible) return { ...adj, feasible: false }
      return adj
    })
  }, [results, gpOverrides, expectedMarks, target])

  // Top 3 achievable SGPA pathways — shown in empty state
  const pathways = useMemo(() => {
    if (!courses.length) return []
    const locked   = courses.filter(c => c.creditGradeProduct !== null)
    const variable = courses.filter(c => c.creditGradeProduct === null)
    if (variable.length === 0) return []
    const totalCr   = courses.reduce((s, c) => s + c.credits, 0)
    const lockedCGP = locked.reduce((s, c) => s + c.creditGradeProduct, 0)
    const varCr     = variable.reduce((s, c) => s + c.credits, 0)
    return [10, 9, 8, 7, 6, 5, 4]
      .map(gp => {
        const sgpa     = (lockedCGP + varCr * gp) / totalCr
        const gradeRow = GRADING_SCALE.find(r => r.point === gp)
        return { gp, grade: gradeRow?.grade, gradeRow, sgpa }
      })
      .filter(p => p.sgpa <= 10)
      .slice(0, 3)
  }, [courses])

  const adjLocked   = adjResults.filter(r => r.locked)
  const adjVariable = adjResults.filter(r => !r.locked)
  const impossible  = adjVariable.filter(r => !r.feasible)
  // Original (pre-override) variable results — needed to get base GP for grade cycling
  const baseVariable = results?.filter(r => !r.locked) ?? []

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 self-start" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6 }}>
        {['planner', 'simulator'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-4 py-1.5 text-xs font-mono transition-all"
            style={{
              borderRadius: 4,
              background: mode === m ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: mode === m ? '#F5EFEB' : '#8B8986',
              letterSpacing: '.5px',
              textTransform: 'uppercase',
            }}
          >
            {m === 'planner' ? 'Marks Planner' : 'Grade Simulator'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'simulator' ? (
          <motion.div key="simulator" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">
            {/* SGPA Preview Card */}
            <div className="ts-card p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="s-label mb-1">Simulated SGPA</p>
                  <div className="font-display font-300 leading-none" style={{ fontSize: 'clamp(48px,8vw,72px)', color: simStatus.color }}>
                    {displaySimSGPA.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs px-2 py-1" style={{ background: `${simStatus.color}18`, color: simStatus.color, border: `1px solid ${simStatus.color}40` }}>
                    {simStatus.label}
                  </span>
                  <div className="mt-3">
                    {delta !== null ? (
                      <p className="font-mono text-sm" style={{ color: delta >= 0 ? '#10B981' : '#EF4444' }}>
                        {delta >= 0 ? '+' : ''}{delta.toFixed(2)} vs current
                      </p>
                    ) : (
                      <p className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}>enter marks to see delta</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Course grade table */}
            <div className="ts-card overflow-hidden">
              <div className="px-5 py-3 flex items-center justify-between gap-2" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <p className="s-label">Select Grade per Course</p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>tap grade to cycle  O → A+ → A → B+ → B → C → P → F</p>
                </div>
                {simIsDirty && (
                  <button
                    onClick={resetSimulator}
                    className="flex items-center gap-1 font-mono text-[10px] px-2 py-1 transition-colors flex-shrink-0"
                    style={{ border: '1px solid rgba(255,255,255,0.18)', color: '#8B8986' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#F1B497'; e.currentTarget.style.color = '#F1B497' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1C3B2'; e.currentTarget.style.color = '#8B8986' }}
                  >
                    <RotateCcw size={9} /> reset
                  </button>
                )}
              </div>
              <div>
                {courses.map((c, i) => {
                  const simGP   = simulatorGrades[c.id] ?? DEFAULT_SIM_GP
                  const gradeRow = GRADING_SCALE.find(g => g.point === simGP)
                  const isDiverged = simGP !== (c.gradePoint ?? DEFAULT_SIM_GP)
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * .04, .24) }}
                      className="px-5 py-3 flex items-center gap-4 border-b"
                      style={{ borderColor: 'rgba(255,255,255,0.07)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-mono text-xs" style={{ color: '#8B8986' }}>{c.courseCode}</span>
                          <span className="cr-chip">{c.credits}cr</span>
                        </div>
                        <p className="text-sm font-body truncate" style={{ color: '#F5EFEB' }}>{c.courseName}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <motion.button
                          whileTap={{ scale: .93 }}
                          onClick={() => handleSimGradeClick(c.id)}
                          className="px-2.5 py-1 text-xs font-body cursor-pointer transition-all"
                          style={{
                            background: gradeRow?.bg,
                            color: gradeRow?.color,
                            border: `1px solid ${gradeRow?.color}${isDiverged ? '90' : '30'}`,
                            outline: isDiverged ? `1px solid ${gradeRow?.color}45` : 'none',
                            outlineOffset: '2px',
                          }}
                        >
                          {gradeRow?.grade ?? 'B'}
                        </motion.button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="planner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-6">

      {/* Input panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden p-5 sm:p-8"
        style={{ background: '#111', color: '#F5EFEB' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(209,195,178,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(209,195,178,.04) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="absolute right-8 top-8 w-24 h-24 rounded-full pointer-events-none" style={{ border: '1px solid rgba(209,195,178,.15)' }} />
        <div className="absolute right-16 top-16 w-12 h-12 rounded-full pointer-events-none" style={{ border: '1px solid rgba(241,180,151,.2)' }} />

        <div className="relative z-10">
          <p className="s-label mb-1" style={{ color: '#8B8986' }}>Reverse Calculator</p>
<p className="font-display font-300 text-xl tracking-tight mb-1" style={{ color: '#F5EFEB' }}>
            Find the marks needed for your target SGPA.
          </p>
          <p className="font-mono text-[10px] mb-6" style={{ color: '#8B8986' }}>
            Distributes required marks across incomplete assessments based on your difficulty ratings.
          </p>

          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="s-label block mb-2" style={{ color: '#8B8986' }}>Target SGPA</label>
              <input
                type="number" inputMode="decimal" min={0} max={10} step={0.1}
                placeholder="e.g. 9.0"
                value={target}
                onChange={e => setTarget(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                className="w-full bg-transparent focus:outline-none font-display font-300 tracking-tight"
                style={{ fontSize: 'clamp(28px,4vw,40px)', color: '#F1B497', borderBottom: '1px solid rgba(209,195,178,.3)', paddingBottom: '6px' }}
                onFocus={e => e.target.style.borderBottomColor = '#F1B497'}
                onBlur={e => e.target.style.borderBottomColor = 'rgba(209,195,178,.3)'}
              />
            </div>
            <button onClick={calculate} className="btn-pill btn-sal">
              Calculate
            </button>
          </div>

          <div className="flex gap-2 mt-5 flex-wrap">
            {[7.0, 8.0, 9.0, 9.5, 10.0].map(v => (
              <button key={v} onClick={() => setTarget(String(v))} className="px-3 py-1 text-xs font-mono transition-all"
                style={{
                  background: parseFloat(target) === v ? 'rgba(241,180,151,.2)' : 'rgba(255,255,255,.05)',
                  border: `1px solid ${parseFloat(target) === v ? 'rgba(241,180,151,.5)' : 'rgba(255,255,255,.1)'}`,
                  color: parseFloat(target) === v ? '#F1B497' : 'rgba(255,255,255,.35)',
                }}>
                {v.toFixed(1)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Summary banner — reacts to grade overrides */}
            <div className="flex items-center gap-3 px-4 py-3" style={{
              background: impossible.length > 0 ? 'rgba(239,68,68,.06)' : 'rgba(16,185,129,.06)',
              border: `1px solid ${impossible.length > 0 ? 'rgba(239,68,68,.25)' : 'rgba(16,185,129,.25)'}`,
            }}>
              {impossible.length > 0
                ? <AlertTriangle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                : <CheckCircle   size={14} style={{ color: '#10B981', flexShrink: 0 }} />
              }
<p className="text-sm font-body" style={{ color: impossible.length > 0 ? '#EF4444' : '#10B981', letterSpacing: '.2px' }}>
                {impossible.length > 0
                  ? `${impossible.length} course${impossible.length !== 1 ? 's' : ''} cannot reach target with current marks. Adjust difficulty or marks.`
                  : `SGPA ${parseFloat(target).toFixed(2)} is achievable with the targets below.`
                }
              </p>
            </div>

            {/* Variable courses */}
            {adjVariable.length > 0 && (
              <div className="ts-card overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between gap-2" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <p className="s-label">Marks Required per Course</p>
                    <p className="font-mono text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>tap grade to raise target · type expected marks to recalculate</p>
                  </div>
                  {hasOverrides && (
                    <button
                      onClick={() => { setGpOverrides({}); setExpectedMarks({}) }}
                      className="flex items-center gap-1 font-mono text-[10px] px-2 py-1 transition-colors flex-shrink-0"
                      style={{ border: '1px solid rgba(255,255,255,0.18)', color: '#8B8986' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#F1B497'; e.currentTarget.style.color = '#F1B497' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1C3B2'; e.currentTarget.style.color = '#8B8986' }}
                    >
                      <RotateCcw size={9} /> reset
                    </button>
                  )}
                </div>
                <div>
                  {adjVariable.map((adj, i) => {
                    const gradeRow     = GRADING_SCALE.find(g => g.grade === adj.targetGrade)
                    const isOverridden = gpOverrides[adj.id] !== undefined
                    const diffLevel    = DIFFICULTY_LEVELS.find(x => x.id === (adj.difficulty ?? 'medium'))
                    const monoLabel    = DIFF_MONO[adj.difficulty ?? 'medium']
                    const baseResult = baseVariable.find(b => b.id === adj.id)

                    return (
                      <motion.div
                        key={adj.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * .06, .3) }}
                        className="px-5 py-4 border-b"
                        style={{ borderColor: 'rgba(255,255,255,0.07)', background: !adj.feasible ? 'rgba(239,68,68,.03)' : 'transparent' }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Course info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="font-mono text-xs" style={{ color: '#8B8986' }}>{adj.courseCode}</span>
                              <span className="cr-chip">{adj.credits}cr</span>
                              {diffLevel && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5"
                                  style={{ background: diffLevel.bg, color: diffLevel.color, border: `1px solid ${diffLevel.color}30`, letterSpacing: '.5px' }}>
                                  {monoLabel} {diffLevel.label.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-body truncate" style={{ color: '#F5EFEB' }}>{adj.courseName}</p>

                            {/* Per-assessment targets — editable */}
                            {adj.feasible && adj.pending?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {adj.pending.map(p => {
                                  const expKey = `${adj.id}::${p.key}`
                                  const rawVal = expectedMarks[expKey] ?? ''
                                  return (
                                    <div key={p.key}
                                      className="flex items-center font-mono text-[10px] px-1.5 py-0.5"
                                      style={{
                                        background: p.isExpected ? 'rgba(16,185,129,.08)' : 'rgba(255,255,255,0.08)',
                                        border: `1px solid ${p.isExpected ? 'rgba(16,185,129,.3)' : 'transparent'}`,
                                      }}
                                    >
                                      <span style={{ color: '#8B8986' }}>{p.key}:&nbsp;</span>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        max={p.max}
                                        value={rawVal}
                                        placeholder={String(p.target)}
                                        onChange={e => setExpectedMarks(prev => ({ ...prev, [expKey]: e.target.value }))}
                                        onBlur={e => {
                                          const v = e.target.value
                                          if (v === '' || !isFinite(+v) || +v < 0 || +v > p.max) {
                                            setExpectedMarks(prev => { const n = { ...prev }; delete n[expKey]; return n })
                                          }
                                        }}
                                        className="w-7 bg-transparent text-center focus:outline-none"
                                        style={{ color: p.isExpected ? '#10B981' : '#F5EFEB' }}
                                      />
                                      <span style={{ color: 'rgba(255,255,255,0.30)' }}>/{p.max}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {adj.scoredSoFar > 0 && (
                              <p className="text-[10px] font-mono mt-1.5" style={{ color: '#8B8986' }}>
                                scored so far: {adj.scoredSoFar}
                              </p>
                            )}
                          </div>

                          {/* Target grade (tappable) + requirement */}
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center justify-end gap-2 mb-2">
                              <span className="s-label">target</span>
                              <motion.button
                                whileTap={{ scale: .88 }}
                                onClick={() => baseResult && handleGradeClick(baseResult)}
                                title="tap to raise target grade · taps again to reset"
                                className="px-2 py-0.5 text-xs font-body cursor-pointer transition-all"
                                style={{
                                  background: gradeRow?.bg,
                                  color: gradeRow?.color,
                                  border: `1px solid ${gradeRow?.color}${isOverridden ? '90' : '30'}`,
                                  outline: isOverridden ? `1px solid ${gradeRow?.color}45` : 'none',
                                  outlineOffset: '2px',
                                }}
                              >
                                {adj.targetGrade}
                              </motion.button>
                            </div>

                            {adj.feasible ? (
                              adj.neededFromPending === 0 ? (
                                <p className="text-[10px] font-mono" style={{ color: '#10B981' }}>Already achieved ✓</p>
                              ) : (
                                <div className="flex items-baseline justify-end gap-1">
                                  <span className="s-label">need</span>
                                  <span className="font-display font-300 text-2xl tracking-tight" style={{ color: '#F1B497' }}>
                                    {adj.neededFromPending}
                                  </span>
                                  <span className="s-label">/{adj.maxFromPending}</span>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <AlertTriangle size={12} style={{ color: '#EF4444' }} />
                                <span className="text-xs font-mono" style={{ color: '#EF4444' }}>Insufficient marks remaining</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Locked courses */}
            {adjLocked.length > 0 && (
              <div className="ts-card overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Lock size={11} style={{ color: '#8B8986' }} />
                  <p className="s-label">Locked — all marks entered</p>
                </div>
                <div>
                  {adjLocked.map((r, i) => {
                    const gradeRow = GRADING_SCALE.find(g => g.grade === r.grade)
                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: (adjVariable.length + i) * .06 }}
                        className="px-4 sm:px-5 py-3 flex items-center gap-2 sm:gap-4 flex-wrap border-b opacity-50"
                        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-xs" style={{ color: '#8B8986' }}>{r.courseCode}</span>
                          <p className="text-sm font-body truncate" style={{ color: '#F5EFEB' }}>{r.courseName}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-xs" style={{ color: '#8B8986' }}>{r.totalMarks}/100</span>
                          <span className="px-2 py-0.5 text-xs font-body" style={{ background: gradeRow?.bg, color: gradeRow?.color }}>{r.grade}</span>
                          <span className="font-mono text-xs" style={{ color: '#8B8986' }}>{r.creditGradeProduct} CGP</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!results && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}>
          {pathways.length > 0 ? (
            <div>
              <p className="s-label mb-1">Achievable Pathways</p>
              <p className="font-mono text-[10px] mb-4" style={{ color: 'rgba(255,255,255,0.30)' }}>
                if all pending courses score this grade — click to auto-calculate
              </p>
              <div className="grid grid-cols-3 gap-3">
                {pathways.map((p, i) => (
                  <motion.button
                    key={p.gp}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: .18 + i * .08 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: .97 }}
                    onClick={() => handlePathwayClick(p.sgpa)}
                    className="ts-card p-4 sm:p-5 text-left"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="font-display font-300 text-3xl sm:text-4xl leading-none" style={{ color: p.gradeRow?.color }}>
                      {p.grade}
                    </div>
                    <div className="font-mono text-[9px] sm:text-[10px] mt-2 leading-tight" style={{ color: '#8B8986' }}>
                      all pending courses
                    </div>
                    <div className="font-display font-300 text-xl sm:text-2xl tracking-tight mt-3" style={{ color: '#F5EFEB' }}>
                      {p.sgpa.toFixed(2)}
                    </div>
                    <div className="s-label">SGPA</div>
                  </motion.button>
                ))}
              </div>
              <p className="font-mono text-[10px] mt-4 text-center" style={{ color: 'rgba(255,255,255,0.30)' }}>
                or enter a custom target above.
              </p>
            </div>
          ) : (
            <div className="py-16 text-center space-y-1">
              <p className="s-label">Enter a target SGPA above and tap Calculate</p>
              <p className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}>Required marks will be calculated per course.</p>
            </div>
          )}
        </motion.div>
      )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
