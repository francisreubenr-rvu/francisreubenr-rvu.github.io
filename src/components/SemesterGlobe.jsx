import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// ── Cyberpunk 2077 per-semester identity palette ──────────────
const SEM_PALETTE = {
  sem1: '#FCEE0A',  // signature yellow
  sem2: '#00F0FF',  // electric cyan
  sem3: '#FF2A6D',  // hot magenta
  sem4: '#00FF9F',  // acid green
  sem5: '#9D00FF',  // deep purple
  sem6: '#FF6B00',  // hot orange
  sem7: '#0080FF',  // electric blue
  sem8: '#FF003C',  // neon red
}
const LOCKED_COLOR   = '#1a1a3a'
const FALLBACK_COLOR = '#818cf8'

function semColor(sem) {
  return SEM_PALETTE[sem.id] ?? FALLBACK_COLOR
}

// ── Glow texture 128×128 ──────────────────────────────────────
const glowTexture = (() => {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0,   'rgba(255,255,255,1)')
  g.addColorStop(0.2, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.4)')
  g.addColorStop(0.8, 'rgba(255,255,255,0.08)')
  g.addColorStop(1,   'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
})()

// ── Halo texture (soft, larger) ───────────────────────────────
const haloTexture = (() => {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0,   'rgba(255,255,255,0.4)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.15)')
  g.addColorStop(1,   'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
})()

// ── Particle generators ───────────────────────────────────────
function makeSegmentParticles(idx, total, radius = 1.72, count = 1100) {
  const phiStart  = (idx / total) * Math.PI * 2
  const phiLength = (Math.PI * 2 / total) * 0.82
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.acos(1 - 2 * Math.random())
    const phi   = phiStart + Math.random() * phiLength
    positions[i * 3]     = -radius * Math.cos(phi) * Math.sin(theta)
    positions[i * 3 + 1] =  radius * Math.cos(theta)
    positions[i * 3 + 2] =  radius * Math.sin(phi) * Math.sin(theta)
  }
  return positions
}

function makeHaloParticles(idx, total, radius = 2.05, count = 280) {
  const phiStart  = (idx / total) * Math.PI * 2
  const phiLength = (Math.PI * 2 / total) * 0.88
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.acos(1 - 2 * Math.random()) + (Math.random() - 0.5) * 0.4
    const phi   = phiStart + Math.random() * phiLength
    const r     = radius + (Math.random() - 0.5) * 0.25
    positions[i * 3]     = -r * Math.cos(phi) * Math.sin(theta)
    positions[i * 3 + 1] =  r * Math.cos(theta)
    positions[i * 3 + 2] =  r * Math.sin(phi) * Math.sin(theta)
  }
  return positions
}

function labelPos(idx, total) {
  const midPhi = (idx + 0.5) * (Math.PI * 2 / total)
  return [-Math.cos(midPhi) * 2.25, 0, Math.sin(midPhi) * 2.25]
}

// ── Segment ───────────────────────────────────────────────────
function Segment({ sem, index, total, selected, hovered, onSelect, onEnter, onLeave }) {
  const color        = semColor(sem)
  const displayColor = sem.available ? color : LOCKED_COLOR

  const coreOpacity  = selected ? 0.98 : hovered ? 0.80 : sem.available ? 0.65 : 0.12
  const haloOpacity  = selected ? 0.55 : hovered ? 0.40 : sem.available ? 0.22 : 0.04

  const corePositions = useMemo(() => makeSegmentParticles(index, total, 1.72, 1100), [index, total])
  const haloPositions = useMemo(() => makeHaloParticles(index, total, 2.05, 280),    [index, total])

  const phiStart  = (index / total) * Math.PI * 2
  const phiLength = (Math.PI * 2 / total) * 0.82
  const lp        = useMemo(() => labelPos(index, total), [index, total])

  const neonGlow   = `0 0 12px ${color}, 0 0 24px ${color}80, 0 0 6px rgba(0,0,0,1)`
  const softShadow = '0 0 8px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,0.9)'

  return (
    <group>
      {/* Core particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={corePositions} count={corePositions.length / 3} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          color={displayColor}
          size={0.020}
          map={glowTexture}
          transparent
          opacity={coreOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Halo particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={haloPositions} count={haloPositions.length / 3} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          color={displayColor}
          size={0.044}
          map={haloTexture}
          transparent
          opacity={haloOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Invisible click-target — opacity:0, NOT visible:false */}
      <mesh
        onClick={() => sem.available && onSelect(sem)}
        onPointerEnter={() => { onEnter(index); document.body.style.cursor = sem.available ? 'pointer' : 'not-allowed' }}
        onPointerLeave={() => { onLeave(); document.body.style.cursor = 'default' }}
      >
        <sphereGeometry args={[1.95, 32, 16, phiStart, phiLength]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Label */}
      <Html position={lp} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{
            fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
            fontSize:      selected ? 13 : 11,
            fontWeight:    selected ? 700 : 400,
            letterSpacing: selected ? '1.5px' : '0.5px',
            textTransform: selected ? 'uppercase' : 'none',
            color:         selected ? color : sem.available ? '#F5EFEB' : '#2a2a4a',
            whiteSpace:    'nowrap',
            textShadow:    selected ? neonGlow : sem.available ? softShadow : 'none',
            opacity:       sem.available ? 1 : 0.25,
            transition:    'all 0.2s ease',
          }}>
            {sem.label}
          </span>
          <span style={{
            fontFamily:    'monospace',
            fontSize:      8,
            letterSpacing: '1.8px',
            textTransform: 'uppercase',
            color:         sem.available ? color : '#2a2a4a',
            textShadow:    sem.available ? `0 0 8px ${color}80, 0 0 4px rgba(0,0,0,1)` : 'none',
            opacity:       sem.available ? 1 : 0.20,
          }}>
            {sem.completed ? 'Done' : sem.available ? 'Active' : 'Soon'}
          </span>
        </div>
      </Html>
    </group>
  )
}

// ── Orbital ring ──────────────────────────────────────────────
function OrbitalRing({ rx = 0, ry = 0, rz = 0, radius = 2.4, tube = 0.005, color, opacity = 0.35, speed = 0.003 }) {
  const ref = useRef()
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.z += delta * speed })
  return (
    <mesh ref={ref} rotation={[rx, ry, rz]}>
      <torusGeometry args={[radius, tube, 8, 180]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}

// ── Inner scene ───────────────────────────────────────────────
function GlobeScene({ semesters, selectedId, onSelect }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const resumeTimer = useRef(null)

  const handleDragStart = () => {
    setAutoRotate(false)
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
  }
  const handleDragEnd = () => {
    resumeTimer.current = setTimeout(() => setAutoRotate(true), 3000)
  }

  return (
    <>
      <ambientLight intensity={0.08} />

      {/* 5 cyberpunk orbital rings */}
      <OrbitalRing rx={0}    ry={0}    rz={0}    radius={2.32} tube={0.006} color="#FCEE0A" opacity={0.35} speed={0.005}  />
      <OrbitalRing rx={1.1}  ry={0.3}  rz={0.5}  radius={2.46} tube={0.004} color="#00F0FF" opacity={0.28} speed={-0.007} />
      <OrbitalRing rx={-0.4} ry={1.0}  rz={0.8}  radius={2.38} tube={0.004} color="#FF2A6D" opacity={0.22} speed={0.009}  />
      <OrbitalRing rx={0.8}  ry={-0.5} rz={-0.3} radius={2.54} tube={0.003} color="#00FF9F" opacity={0.16} speed={-0.004} />
      <OrbitalRing rx={-0.9} ry={0.6}  rz={0.2}  radius={2.60} tube={0.003} color="#9D00FF" opacity={0.14} speed={0.006}  />

      {/* Globe segments */}
      {semesters.map((sem, i) => (
        <Segment
          key={sem.id}
          sem={sem}
          index={i}
          total={semesters.length}
          selected={selectedId === sem.id}
          hovered={hoveredIdx === i}
          onSelect={onSelect}
          onEnter={setHoveredIdx}
          onLeave={() => setHoveredIdx(null)}
        />
      ))}

      {/* Bloom */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.15} intensity={1.0} radius={0.8} />
      </EffectComposer>

      {/* Full 360 orbit — no polar limits */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.7}
        onStart={handleDragStart}
        onEnd={handleDragEnd}
      />

</>
  )
}

// ── Public component ──────────────────────────────────────────
export default function SemesterGlobe({ semesters, selectedId, onSelect }) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 4.8], fov: 42 }}
      gl={{ alpha: true, antialias: true, toneMapping: THREE.NoToneMapping }}
      style={{ background: 'transparent' }}
    >
      <GlobeScene semesters={semesters} selectedId={selectedId} onSelect={onSelect} />
    </Canvas>
  )
}
