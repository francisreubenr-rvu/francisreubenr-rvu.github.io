import { useEffect, useRef, useState } from 'react'

export function useAnimatedNumber(target, duration = 800, decimals = 2) {
  const [display, setDisplay] = useState(target ?? 0)
  const prevRef = useRef(target ?? 0)
  const frameRef = useRef(null)

  useEffect(() => {
    if (target === null || target === undefined) {
      setDisplay(0)
      prevRef.current = 0
      return
    }

    const from = prevRef.current
    const to   = target
    const diff = to - from
    if (diff === 0) return

    const startTime = performance.now()

    function step(now) {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + diff * eased
      setDisplay(parseFloat(current.toFixed(decimals)))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        prevRef.current = to
      }
    }

    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration, decimals])

  return display
}
