import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, width = '480px' }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bd"
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(17,17,17,.55)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: .25 }}
            onClick={onClose}
          />
          <motion.div
            key="panel"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: .92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: .94, y: 8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="relative w-full font-body p-5 sm:p-7"
              style={{
                maxWidth: width,
                background: 'rgba(13,17,35,0.96)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-300 text-xl tracking-tight" style={{ color: '#F5EFEB' }}>{title}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center text-stone hover:text-char transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
