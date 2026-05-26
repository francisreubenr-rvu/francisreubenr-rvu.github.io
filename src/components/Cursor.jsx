import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)
  const pos     = useRef({ rx: 0, ry: 0, mx: 0, my: 0 })
  const raf     = useRef(null)

  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const onMove = (e) => {
      pos.current.mx = e.clientX
      pos.current.my = e.clientY
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`
    }

    const tick = () => {
      const { mx, my } = pos.current
      pos.current.rx += (mx - pos.current.rx) * 0.1
      pos.current.ry += (my - pos.current.ry) * 0.1
      ring.style.transform = `translate(${pos.current.rx}px, ${pos.current.ry}px) translate(-50%,-50%)`
      raf.current = requestAnimationFrame(tick)
    }

    const onEnter = () => document.body.classList.add('cur-hover')
    const onLeave = () => document.body.classList.remove('cur-hover')

    document.addEventListener('mousemove', onMove)
    raf.current = requestAnimationFrame(tick)

    const hoverEls = () => document.querySelectorAll('a, button, input, [data-hover]')
    const addHover = () => hoverEls().forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })
    addHover()

    // Re-run after DOM mutations (new components mount)
    const obs = new MutationObserver(addHover)
    obs.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf.current)
      obs.disconnect()
    }
  }, [])

  return (
    <>
      <div id="ts-cursor-dot"  ref={dotRef}  style={{ position:'fixed', zIndex: 99999, pointerEvents:'none' }} />
      <div id="ts-cursor-ring" ref={ringRef} style={{ position:'fixed', zIndex: 99998, pointerEvents:'none' }} />
    </>
  )
}
