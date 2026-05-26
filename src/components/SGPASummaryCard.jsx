import { motion } from 'framer-motion'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { SGPA_STATUS } from '../utils/constants'

export default function SGPASummaryCard({ sgpa, totalCredits, totalCGP, coursesCount }) {
  const displaySGPA  = useAnimatedNumber(sgpa ?? 0, 900, 2)
  const displayCreds = useAnimatedNumber(totalCredits, 600, 0)
  const displayCGP   = useAnimatedNumber(totalCGP, 700, 0)

  const status = SGPA_STATUS.find(s => (sgpa ?? 0) >= s.min) ?? SGPA_STATUS[SGPA_STATUS.length - 1]
  const pct    = Math.min(((sgpa ?? 0) / 10) * 100, 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .5, delay: .1 }}
      className="ts-card p-8 relative overflow-hidden"
    >
      {/* Faint blueprint circle decoration */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full pointer-events-none" style={{
        border: '1px solid rgba(255,255,255,.12)',
      }} />
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full pointer-events-none" style={{
        border: '1px solid rgba(255,255,255,.08)',
      }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="s-label mb-3">Current SGPA</p>
            <motion.div
              key={sgpa}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: .4 }}
              className="font-display font-300 leading-none tracking-tight"
              style={{ fontSize: 'clamp(56px,10vw,88px)', color: '#F1B497' }}
            >
              {sgpa !== null ? displaySGPA.toFixed(2) : '—'}
            </motion.div>
            <p className="text-xs font-body mt-2" style={{ color: '#8B8986', letterSpacing: '.2px' }}>
              out of 10.00
            </p>
          </div>

          {sgpa !== null && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, delay: .3 }}
              className="text-xs font-body px-3 py-1 mt-1"
              style={{
                border: `1px solid ${status.color}50`,
                color: status.color,
                letterSpacing: '.3px',
                borderRadius: '80px',
                background: `${status.color}12`,
              }}
            >
              {status.label}
            </motion.div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-7">
          <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <motion.div
              className="h-px"
              style={{ background: '#F1B497' }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: .9, ease: [.34, 1.56, .64, 1] }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.30)' }}>0</span>
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.30)' }}>10</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: '20px' }}>
          {[
            { label: 'Credits',   val: displayCreds },
            { label: 'CGP',       val: displayCGP   },
            { label: 'Courses',   val: coursesCount  },
          ].map(s => (
            <div key={s.label}>
              <div className="font-display font-300 text-3xl tracking-tight" style={{ color: '#F5EFEB' }}>{s.val}</div>
              <div className="s-label mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
