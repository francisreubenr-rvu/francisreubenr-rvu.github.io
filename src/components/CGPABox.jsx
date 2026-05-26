import { useAnimatedNumber } from '../hooks/useAnimatedNumber'

export default function CGPABox({ data }) {
  const d = useAnimatedNumber(data ? data.cgpa : 0, 900, 2)
  if (!data) return null

  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:50, background:'rgba(6,9,18,.93)', border:'1px solid rgba(255,255,255,.14)', backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)', padding:'14px 22px 16px', animation:'slideUpFade .6s cubic-bezier(.34,1.56,.64,1) both', minWidth:116 }}>
      <div style={{ position:'absolute', top:0, right:0, width:0, height:0, borderTop:'18px solid rgba(241,180,151,.2)', borderLeft:'18px solid transparent' }} />
      <p style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'2.5px', color:'#8B8986', textTransform:'uppercase', marginBottom:6 }}>CGPA</p>
      <div style={{ fontFamily:"'Hanken Grotesk',sans-serif", fontWeight:300, fontSize:50, color:'#F5EFEB', letterSpacing:'-2px', lineHeight:1 }}>{d.toFixed(2)}</div>
      <p style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'#8B8986', marginTop:8 }}>
        {data.sems} sem{data.sems !== 1 ? 's' : ''} · {data.credits} cr
      </p>
    </div>
  )
}
