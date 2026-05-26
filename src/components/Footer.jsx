import { motion } from 'framer-motion'

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: .8 }}
      className="mt-20 pt-6 px-0"
      style={{ borderTop: '1px solid rgba(255,255,255,0.10)', overflow: 'hidden' }}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between flex-wrap gap-4 pb-8">
        <div className="flex gap-6">
          {['Courses','Dashboard','Reverse Calc','Settings'].map(l => (
            <span key={l} className="text-xs font-body" style={{ color: '#8B8986', letterSpacing: '.3px' }}>{l}</span>
          ))}
        </div>
        <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '.3px' }}>
          Francis Reuben · SGPA Calculator
        </p>
      </div>

      {/* Giant wordmark — bleeds to viewport edges */}
      <div
        style={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          overflow: 'hidden',
          lineHeight: 0.85,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="font-display font-300"
          style={{
            fontSize: 'clamp(80px, 18vw, 240px)',
            letterSpacing: '-0.04em',
            color: 'rgba(255,255,255,0.10)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          MARQUE
        </motion.div>
      </div>
    </motion.footer>
  )
}
