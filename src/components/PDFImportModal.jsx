import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Info, Shield } from 'lucide-react'
import Modal from './Modal'
import { ASSESSMENT_CAPS } from '../utils/constants'
import { validateMark } from '../utils/pdfParser'

// ── Single mark input field ───────────────────────────────────────────────────

function MarkField({ label, cap, value, onChange }) {
  const { ok } = validateMark(value, cap)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8B8986', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
        {label} <span style={{ color: 'rgba(255,255,255,0.2)' }}>/{cap}</span>
      </span>
      <input
        type="number"
        min={0}
        max={cap}
        step="1"
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : e.target.value)}
        style={{
          background: ok ? 'rgba(255,255,255,0.07)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${ok ? 'rgba(255,255,255,0.12)' : 'rgba(239,68,68,0.5)'}`,
          borderRadius: 4,
          padding: '5px 4px',
          fontFamily: "'DM Mono',monospace",
          fontSize: 13,
          textAlign: 'center',
          color: ok ? '#F5EFEB' : '#EF4444',
          outline: 'none',
          width: '100%',
          // Prevent scrolling the number with mouse wheel while focused
          MozAppearance: 'textfield',
        }}
        onWheel={e => e.currentTarget.blur()}
      />
      {!ok && (
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#EF4444' }}>0–{cap}</span>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function PDFImportModal({ open, onClose, parsedMarks = [], currentCourses = [], onApply }) {
  const [rows, setRows] = useState([])

  // Rebuild editable state whenever the modal opens with new data
  useEffect(() => {
    if (!open) return
    const matched = parsedMarks
      .map(pm => {
        const course = currentCourses.find(c => c.courseCode === pm.courseCode)
        if (!course) return null
        return {
          id:         course.id,
          courseCode: pm.courseCode,
          courseName: course.courseName,
          confidence: pm.confidence,
          note:       pm.note ?? null,
          cie1:       pm.cie1,
          cie2:       pm.cie2,
          cie3:       pm.cie3,
          see:        pm.see,
        }
      })
      .filter(Boolean)
    setRows(matched)
  }, [open, parsedMarks, currentCourses])

  // Course codes in the PDF that don't match anything in the current semester
  const unmatched = parsedMarks.filter(
    pm => !currentCourses.find(c => c.courseCode === pm.courseCode)
  )

  const updateRow = (id, field, val) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r))

  const allValid = rows.every(r =>
    validateMark(r.cie1, ASSESSMENT_CAPS.cie1).ok &&
    validateMark(r.cie2, ASSESSMENT_CAPS.cie2).ok &&
    validateMark(r.cie3, ASSESSMENT_CAPS.cie3).ok &&
    validateMark(r.see,  ASSESSMENT_CAPS.see ).ok
  )

  const handleApply = () => {
    if (!allValid) return
    const updates = rows
      .map(r => {
        const patch = {}
        const checks = [
          ['cie1Marks', r.cie1, ASSESSMENT_CAPS.cie1],
          ['cie2Marks', r.cie2, ASSESSMENT_CAPS.cie2],
          ['cie3Marks', r.cie3, ASSESSMENT_CAPS.cie3],
          ['seeMarks',  r.see,  ASSESSMENT_CAPS.see ],
        ]
        for (const [key, raw, cap] of checks) {
          const { out, ok } = validateMark(raw, cap)
          // Only write the key when a value was actually provided.
          // null / empty → leave the existing mark untouched.
          if (ok && out !== null) patch[key] = out
        }
        return Object.keys(patch).length > 0 ? { id: r.id, patch } : null
      })
      .filter(Boolean)

    onApply(updates)
    onClose()
  }

  const highCount    = rows.filter(r => r.confidence === 'high').length
  const partialCount = rows.filter(r => r.confidence === 'partial').length

  return (
    <Modal open={open} onClose={onClose} title="PDF Marks Extraction" width="520px">

      {/* Security / review notice */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 14px', marginBottom: 16,
        background: 'rgba(99,102,241,0.07)',
        border: '1px solid rgba(99,102,241,0.18)',
        borderRadius: 6,
      }}>
        <Shield size={13} style={{ color: '#6366F1', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8B8986', lineHeight: 1.65, margin: 0 }}>
          Review every value before applying. Empty fields are skipped and will not overwrite
          marks you have already entered.
        </p>
      </div>

      {/* Empty-match state */}
      {rows.length === 0 && (
        <p style={{
          fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13,
          color: '#8B8986', textAlign: 'center', padding: '24px 0',
        }}>
          No course codes from this PDF matched your current semester.
        </p>
      )}

      {/* Confidence summary chips */}
      {rows.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {highCount > 0 && (
            <span style={{
              fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '0.4px',
              padding: '3px 10px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981',
            }}>
              ✓ {highCount} full match{highCount !== 1 ? 'es' : ''}
            </span>
          )}
          {partialCount > 0 && (
            <span style={{
              fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '0.4px',
              padding: '3px 10px',
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B',
            }}>
              ~ {partialCount} partial match{partialCount !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
      )}

      {/* Matched course rows */}
      <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {rows.map((r, idx) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            {/* Course header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8B8986' }}>{r.courseCode}</span>
                <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: '#F5EFEB', marginLeft: 8 }}
                  className="truncate">
                  {r.courseName}
                </span>
              </div>
              {r.confidence === 'high'
                ? (
                  <span style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 8, whiteSpace: 'nowrap', flexShrink: 0,
                    padding: '2px 8px',
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981',
                  }}>auto-filled</span>
                ) : (
                  <span style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 8, whiteSpace: 'nowrap', flexShrink: 0,
                    padding: '2px 8px',
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B',
                  }}>partial</span>
                )
              }
            </div>

            {/* Parser note (partial confidence) */}
            {r.note && (
              <div style={{
                display: 'flex', gap: 6, alignItems: 'flex-start',
                marginBottom: 10, padding: '6px 8px',
                background: 'rgba(245,158,11,0.07)',
                border: '1px solid rgba(245,158,11,0.15)',
                borderRadius: 4,
              }}>
                <Info size={10} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#F59E0B', lineHeight: 1.55 }}>
                  {r.note}
                </span>
              </div>
            )}

            {/* Mark inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <MarkField label="CIE 1" cap={ASSESSMENT_CAPS.cie1} value={r.cie1} onChange={v => updateRow(r.id, 'cie1', v)} />
              <MarkField label="CIE 2" cap={ASSESSMENT_CAPS.cie2} value={r.cie2} onChange={v => updateRow(r.id, 'cie2', v)} />
              <MarkField label="CIE 3" cap={ASSESSMENT_CAPS.cie3} value={r.cie3} onChange={v => updateRow(r.id, 'cie3', v)} />
              <MarkField label="SEE"   cap={ASSESSMENT_CAPS.see}  value={r.see}  onChange={v => updateRow(r.id, 'see',  v)} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Unmatched course codes from PDF */}
      {unmatched.length > 0 && (
        <div style={{
          marginBottom: 14, padding: '8px 12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 6,
        }}>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8B8986', marginBottom: 6, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            Not in your semester
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {unmatched.map(u => (
              <span key={u.courseCode} style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8B8986',
                padding: '2px 8px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {u.courseCode}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onClose}
          className="btn-pill btn-out"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          disabled={!allValid || rows.length === 0}
          className="btn-pill btn-sal"
          style={{
            flex: 1, justifyContent: 'center',
            opacity: !allValid || rows.length === 0 ? 0.4 : 1,
            cursor:  !allValid || rows.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Apply Marks
        </button>
      </div>
    </Modal>
  )
}
