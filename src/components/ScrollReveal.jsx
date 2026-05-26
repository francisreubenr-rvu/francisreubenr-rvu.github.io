import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * ScrollReveal — splits children text into word spans and reveals
 * each word with a staggered fade/slide as the element enters view.
 *
 * Words start visible at 15% opacity, then animate to full opacity
 * and translateY 0 with a 60ms stagger per word.
 */
export default function ScrollReveal({
  children,
  className = '',
  style = {},
  as: Tag = 'h1',
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  // Flatten children to a single string (filter falsy from short-circuit expressions)
  const text = (Array.isArray(children) ? children : [children])
    .filter(Boolean)
    .join(' ')

  const words = text.split(/\s+/).filter(Boolean)

  const MotionTag = motion[Tag] ?? motion.h1

  return (
    <MotionTag ref={ref} className={className} style={style}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          style={{ display: 'inline-block', overflow: 'hidden' }}
        >
          <motion.span
            style={{ display: 'inline-block', willChange: 'transform, opacity' }}
            initial={{ opacity: 0.15, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0.15, y: 10 }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
              delay: i * 0.06,
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </MotionTag>
  )
}
