import { motion } from 'framer-motion'
import { GRADING_SCALE } from '../utils/constants'

export default function GradeChart({ courses }) {
  const rows = GRADING_SCALE.map(r => ({
    ...r,
    count:   courses.filter(c => c.grade === r.grade).length,
    credits: courses.filter(c => c.grade === r.grade).reduce((s, c) => s + c.credits, 0),
  })).filter(r => r.count > 0)

  const maxCredits = Math.max(...rows.map(r => r.credits), 1)
  const scored     = courses.filter(c => c.grade !== null).length

  if (scored === 0) {
    return (
      <div className="py-8 text-center s-label">
        Enter marks to see grade distribution
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {rows.map((row, i) => (
        <motion.div
          key={row.grade}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * .07, duration: .35 }}
          className="flex items-center gap-3"
        >
          {/* Grade label */}
          <div
            className="w-9 h-7 flex items-center justify-center text-xs font-body font-500 flex-shrink-0"
            style={{ background: row.bg, color: row.color, border: `1px solid ${row.color}40` }}
          >
            {row.grade}
          </div>

          {/* Bar */}
          <div className="flex-1 h-7 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full flex items-center px-3"
              style={{ borderRight: `2px solid ${row.color}` }}
              initial={{ width: 0 }}
              animate={{ width: `${(row.credits / maxCredits) * 100}%` }}
              transition={{ delay: i * .07 + .15, duration: .6, ease: [.34, 1.56, .64, 1] }}
            >
              <span className="text-xs font-mono whitespace-nowrap" style={{ color: row.color }}>
                {row.count} course{row.count !== 1 ? 's' : ''} · {row.credits} cr
              </span>
            </motion.div>
          </div>

          <div className="w-20 text-right text-xs font-body flex-shrink-0" style={{ color: '#8B8986' }}>
            {row.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
