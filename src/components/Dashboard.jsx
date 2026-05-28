import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, FileText, Loader, Upload } from 'lucide-react'
import SGPASummaryCard from './SGPASummaryCard'
import GradeChart from './GradeChart'
import PDFImportModal from './PDFImportModal'
import { useToast } from './Toast'
import { assertFileMetadata, assertMagicBytes, parsePDFMarks } from '../utils/pdfParser'
import { GRADING_SCALE } from '../utils/constants'

// ── Comet canvas background ───────────────────────────────────────────────────

function DashCometCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const ctx = cv.getContext('2d')
    let raf, W, H
    const comets = []
    let lastSpawn = 0

    const resize = () => {
      W = cv.width  = cv.offsetWidth
      H = cv.height = cv.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function spawn() {
      const fromTop = Math.random() > 0.5
      const x  = fromTop ? Math.random() * W : -60
      const y  = fromTop ? -40 : Math.random() * H * 0.6
      const spd = 160 + Math.random() * 220
      const ang = fromTop ? (0.35 + Math.random() * 0.45) : (0.2 + Math.random() * 0.35)
      comets.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 1, tail: [], size: 1.2 + Math.random() * 1.4 })
    }

    let prev = performance.now()
    function draw(now) {
      const dt = Math.min((now - prev) / 1000, 0.05); prev = now
      ctx.clearRect(0, 0, W, H)

      if (now - lastSpawn > 2800 + Math.random() * 4000) { lastSpawn = now; spawn() }

      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i]
        c.tail.push([c.x, c.y])
        if (c.tail.length > 18) c.tail.shift()
        c.x += c.vx * dt; c.y += c.vy * dt; c.life -= 0.007
        if (c.life <= 0 || c.x > W + 100 || c.y > H + 100) { comets.splice(i, 1); continue }

        if (c.tail.length > 2) {
          for (let t = c.tail.length - 1; t > 0; t--) {
            const frac = t / c.tail.length
            ctx.strokeStyle = `rgba(200,210,255,${frac * 0.32 * c.life})`
            ctx.lineWidth   = c.size * frac * c.life
            ctx.beginPath(); ctx.moveTo(...c.tail[t]); ctx.lineTo(...c.tail[t - 1]); ctx.stroke()
          }
        }
        const ng = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size * 3)
        ng.addColorStop(0, `rgba(255,255,255,${c.life * 0.7})`); ng.addColorStop(1, 'transparent')
        ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(c.x, c.y, c.size * 3, 0, Math.PI * 2); ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.55 }} />
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: .4 }}
      className="ts-card p-5"
    >
      <div className="font-display font-300 text-4xl tracking-tight mb-2" style={{ color: accent ?? '#F5EFEB' }}>{value}</div>
      <div className="s-label">{label}</div>
    </motion.div>
  )
}

// ── PDF upload card ───────────────────────────────────────────────────────────
// Security: validate → magic bytes → PDF.js (no JS eval, no font-face) → preview

function PDFUploadCard({ courses, onUpdateCourse }) {
  const toast     = useToast()
  const fileRef   = useRef(null)

  // 'idle' | 'parsing' | 'ready' | 'error'
  const [status,      setStatus]      = useState('idle')
  const [errorMsg,    setErrorMsg]    = useState('')
  const [parsedMarks, setParsedMarks] = useState([])
  const [showModal,   setShowModal]   = useState(false)

  const handleTrigger = () => {
    if (status === 'parsing') return
    // Reset before opening picker so a re-upload of the same file still fires onChange
    setStatus('idle')
    setErrorMsg('')
    fileRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    // Clear immediately so the same file can be re-selected later
    e.target.value = ''
    if (!file) return

    setStatus('parsing')
    setErrorMsg('')

    try {
      // Layer 1 — sync metadata check (fast rejection for wrong extensions / MIME)
      assertFileMetadata(file)
      // Layer 2 — async magic-bytes check (rejects renamed files)
      await assertMagicBytes(file)
      // Layers 3 & 4 — PDF.js parse with security options + output sanitisation
      const marks = await parsePDFMarks(file)

      if (marks.length === 0) {
        setStatus('error')
        setErrorMsg('No course codes found in this PDF. Make sure it is an RVU marks statement.')
        return
      }

      setParsedMarks(marks)
      setStatus('ready')
      setShowModal(true)
    } catch (err) {
      setStatus('error')
      // Sanitise: never show raw internal error messages to the user
      const safe = String(err?.message ?? 'Unknown error').slice(0, 180)
      setErrorMsg(safe)
      toast(safe, 'error')
    }
  }

  const handleApply = (updates) => {
    if (!updates?.length) return
    updates.forEach(({ id, patch }) => onUpdateCourse(id, patch))
    toast(`Marks applied for ${updates.length} course${updates.length !== 1 ? 's' : ''}`, 'success')
    setStatus('idle')
  }

  const handleModalClose = () => {
    setShowModal(false)
    if (status === 'ready') setStatus('idle')
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .4 }}
        className="ts-card p-5"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0,
          }}>
            <FileText size={14} style={{ color: '#8B8986' }} />
          </div>
          <div>
            <p className="text-sm font-body" style={{ color: '#F5EFEB', letterSpacing: '.15px' }}>
              Import Marks from PDF
            </p>
            <p className="text-xs font-body mt-0.5" style={{ color: '#8B8986', letterSpacing: '.2px' }}>
              Upload your RVU marks statement — CIE and SEE marks are extracted automatically
            </p>
            {status === 'error' && (
              <p className="text-xs font-mono mt-1" style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlertTriangle size={10} /> {errorMsg}
              </p>
            )}
            {status === 'ready' && (
              <p className="text-xs font-mono mt-1" style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle size={10} /> Marks extracted — review and apply
              </p>
            )}
          </div>
        </div>

        {/* Hidden file input — PDF only, single file, no multiple attribute */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <motion.button
          whileHover={status !== 'parsing' ? { scale: 1.02 } : {}}
          whileTap={status !== 'parsing' ? { scale: .98 } : {}}
          onClick={handleTrigger}
          disabled={status === 'parsing'}
          className="btn-pill btn-out"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: status === 'parsing' ? 0.6 : 1,
            cursor: status === 'parsing' ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          {status === 'parsing'
            ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display:'inline-flex' }}><Loader size={13} /></motion.span> Parsing…</>
            : status === 'ready'
              ? <><CheckCircle size={13} style={{ color: '#10B981' }} /> Review</>
              : <><Upload size={13} /> Upload PDF</>
          }
        </motion.button>
      </motion.div>

      <PDFImportModal
        open={showModal}
        onClose={handleModalClose}
        parsedMarks={parsedMarks}
        currentCourses={courses}
        onApply={handleApply}
      />
    </>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({ courses, sgpa, totalCredits, totalCGP, comingSoon = false, onUpdateCourse }) {
  const scored    = courses.filter(c => c.grade !== null)
  const oCount    = courses.filter(c => c.grade === 'O').length
  const failCount = courses.filter(c => c.grade === 'F').length
  const avgGP     = scored.length > 0
    ? (scored.reduce((s, c) => s + (c.gradePoint ?? 0), 0) / scored.length).toFixed(2)
    : '—'
  const best = scored.reduce((b, c) => (c.gradePoint ?? 0) > (b?.gradePoint ?? 0) ? c : b, null)

  return (
    <div style={{ position:'relative' }}>
    <DashCometCanvas />
    {comingSoon && (
      <div style={{
        position:'absolute', inset:0, zIndex:20,
        backdropFilter:'blur(5px)', background:'rgba(13,21,37,.55)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14,
        pointerEvents:'none', minHeight:280,
      }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'2.5px', color:'#F1B497', textTransform:'uppercase', padding:'9px 20px', border:'1px solid rgba(241,180,151,.35)', background:'rgba(241,180,151,.07)' }}>
          ✦ Dashboard preview — no data yet
        </div>
        <p style={{ fontFamily:"'Hanken Grotesk',sans-serif", fontSize:12, color:'rgba(255,255,255,.35)', margin:0 }}>
          Live when semester data is available
        </p>
      </div>
    )}
    <div className="space-y-6" style={{ position:'relative', zIndex:1 }}>
      <SGPASummaryCard sgpa={sgpa} totalCredits={totalCredits} totalCGP={totalCGP} coursesCount={courses.length} />

      {/* PDF import — only shown when the dashboard is live and a callback is wired */}
      {onUpdateCourse && !comingSoon && (
        <PDFUploadCard courses={courses} onUpdateCourse={onUpdateCourse} />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="O Grades" value={oCount}   accent="#10B981" delay={.1} />
        <StatCard label="Avg GP"   value={avgGP}     accent="#F1B497" delay={.15} />
        <StatCard label="Scored"   value={`${scored.length}/${courses.length}`} accent="#F5EFEB" delay={.2} />
        <StatCard label="Fails"    value={failCount} accent={failCount > 0 ? '#EF4444' : '#10B981'} delay={.25} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: .3 }}
        className="ts-card p-6"
      >
        <p className="s-label mb-1">Grade Distribution</p>
          <p className="font-mono text-[10px] mb-4" style={{ color: '#8B8986' }}>Grade distribution across all courses</p>
        <GradeChart courses={courses} />
      </motion.div>

      {scored.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .35 }}
          className="ts-card p-6"
        >
          <p className="s-label mb-1">Course Breakdown</p>
          <p className="font-mono text-[10px] mb-4" style={{ color: '#8B8986' }}>Individual course results sorted by grade point</p>
          <div className="space-y-3">
            {[...scored].sort((a,b) => (b.gradePoint ?? 0) - (a.gradePoint ?? 0)).map((c, i) => {
              const row = GRADING_SCALE.find(r => r.grade === c.grade)
              const pct = ((c.totalMarks ?? 0) / 100) * 100
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: .4 + Math.min(i * .04, .24) }}
                  className="flex items-center gap-3"
                >
                  <div className="font-mono text-xs w-16 flex-shrink-0 truncate" style={{ color: '#8B8986' }}>{c.courseCode}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-body truncate" style={{ color: '#F5EFEB' }}>{c.courseName}</span>
                      <span className="text-xs font-mono ml-2 flex-shrink-0" style={{ color: row?.color }}>{c.totalMarks}/100</span>
                    </div>
                    <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <motion.div
                        className="h-px"
                        style={{ background: row?.color ?? '#F1B497' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: .5 + Math.min(i * .04, .24), duration: .5 }}
                      />
                    </div>
                  </div>
                  <div className="w-9 h-6 flex items-center justify-center text-xs font-body flex-shrink-0"
                    style={{ background: row?.bg, color: row?.color, border: `1px solid ${row?.color}30` }}>
                    {c.grade}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {best && (
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-mono" style={{ color: '#8B8986' }}>
                Best: <span style={{ color: '#10B981' }}>{best.courseName}</span> · {best.grade} · {best.creditGradeProduct} CGP
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
    </div>
  )
}
