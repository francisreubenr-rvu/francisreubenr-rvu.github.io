/**
 * pdfParser.js — secure PDF mark extraction for the SGPA calculator.
 *
 * Security model: every upload is treated as hostile input until it passes
 * all four validation layers in order:
 *   1. File metadata  (extension + MIME + size)
 *   2. Magic bytes    (%PDF within first 1 024 bytes — PDF spec §7.5.1)
 *   3. PDF.js options (disable JS eval + disable font-face loading)
 *   4. Output sanitisation (strip control chars, clamp numbers to assessment caps)
 *
 * pdfjs-dist 5.7.284 is used (CVE-2024-4367 fixed in 4.2.67; this is well past that).
 * disableFontFace: true is the primary mitigation for that class of font-exploit CVE.
 */

import * as pdfjs from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ASSESSMENT_CAPS } from './constants'

// Worker runs in a separate thread — do NOT disable it (that would move untrusted
// parsing onto the main thread and reduce isolation).
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

const MAX_BYTES = 2 * 1024 * 1024  // 2 MB — generous for a marks sheet
const MAX_PAGES = 10               // never process more pages than this

// ── Layer 1: file metadata ────────────────────────────────────────────────────

export function assertFileMetadata(file) {
  if (!(file instanceof File)) throw new Error('Invalid input: expected a File object.')

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'pdf') throw new Error('Only .pdf files are accepted.')

  // MIME type is browser-supplied and can be empty ('') on some OS/browser combos,
  // so only reject when the browser provides a non-PDF MIME.
  if (file.type !== '' && file.type !== 'application/pdf')
    throw new Error(`Blocked: unexpected MIME type "${String(file.type).slice(0, 64)}".`)

  if (file.size === 0) throw new Error('The file is empty.')
  if (file.size > MAX_BYTES)
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 2 MB.`)
}

// ── Layer 2: magic bytes ──────────────────────────────────────────────────────
// PDF spec §7.5.2 says the header (%PDF-) may be preceded by up to 1 024 bytes
// of binary data. Scan the first 1 024 bytes rather than requiring offset 0.

export async function assertMagicBytes(file) {
  const buf  = await file.slice(0, 1024).arrayBuffer()
  const b    = new Uint8Array(buf)
  // %PDF = 0x25 0x50 0x44 0x46
  for (let i = 0; i + 3 < b.length; i++) {
    if (b[i] === 0x25 && b[i+1] === 0x50 && b[i+2] === 0x44 && b[i+3] === 0x46) return
  }
  throw new Error('File rejected: no PDF signature found (%PDF). The file may be corrupted or misnamed.')
}

// ── Output sanitisation helpers ───────────────────────────────────────────────

function sanitizeText(s) {
  if (typeof s !== 'string') return ''
  return s
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // strip control chars
    .replace(/[<>&"'`]/g, '')                          // strip HTML-dangerous chars
    .trim()
    .slice(0, 256)
}

// Validate and clamp a mark to [0, cap]. Returns null for empty/invalid input.
export function validateMark(raw, cap) {
  if (raw === null || raw === undefined || raw === '') return { out: null, ok: true }
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || n > cap) return { out: raw, ok: false }
  return { out: Math.round(n * 10) / 10, ok: true }
}

// ── Text extraction: position-aware row reconstruction ────────────────────────
// pdfjs getTextContent() returns items with a 6-element transform:
//   [scaleX, skewX, skewY, scaleY, translateX, translateY]
// Items with similar translateY are on the same visual row.

const Y_CLUSTER = 3.5  // pt — items within this distance share a row

async function extractPageRows(page) {
  const content = await page.getTextContent({ includeMarkedContent: false })
  const rowMap  = new Map()

  for (const item of content.items) {
    const str = sanitizeText(item.str ?? '')
    if (!str) continue
    const y = Math.round(item.transform[5] / Y_CLUSTER) * Y_CLUSTER
    const x = item.transform[4]
    if (!rowMap.has(y)) rowMap.set(y, [])
    rowMap.get(y).push({ x, str })
  }

  // Sort rows top-to-bottom (higher PDF y = closer to top of page)
  return [...rowMap.entries()]
    .sort(([ya], [yb]) => yb - ya)
    .map(([, items]) => items.sort((a, b) => a.x - b.x).map(i => i.str))
}

// ── Mark interpretation ───────────────────────────────────────────────────────
// Course codes in RVU's scheme follow the pattern: 2 uppercase letters + 4 digits.
// Some PDF renderers split tokens, so we also try merging adjacent items.

const COURSE_CODE_RE = /^[A-Z]{2}\d{4}$/
const NUMBER_RE      = /^\d{1,3}(\.\d{1,2})?$/

function preprocessRow(tokens) {
  const out = []
  for (let i = 0; i < tokens.length; i++) {
    if (i + 1 < tokens.length && COURSE_CODE_RE.test(tokens[i] + tokens[i + 1])) {
      out.push(tokens[i] + tokens[i + 1])
      i++
    } else {
      out.push(tokens[i])
    }
  }
  return out
}

function interpretRow(rawTokens) {
  const tokens  = preprocessRow(rawTokens)
  const codeIdx = tokens.findIndex(t => COURSE_CODE_RE.test(t))
  if (codeIdx === -1) return null

  const code = tokens[codeIdx]

  // Collect numeric tokens after the course code, discard values > 100
  // (avoids treating roll numbers, years, etc. as marks)
  const nums = tokens
    .slice(codeIdx + 1)
    .filter(t => NUMBER_RE.test(t))
    .map(Number)
    .filter(n => n <= 100)

  if (nums.length === 0)
    return { courseCode: code, cie1: null, cie2: null, cie3: null, see: null, confidence: 'none' }

  // Strategy A — 4 consecutive values fitting all assessment caps
  // Expected sequence: CIE1(≤20), CIE2(≤25), CIE3(≤25), SEE(≤30)
  for (let i = 0; i + 3 <= nums.length - 1; i++) {
    const [a, b, c, d] = [nums[i], nums[i+1], nums[i+2], nums[i+3]]
    if (a <= ASSESSMENT_CAPS.cie1 && b <= ASSESSMENT_CAPS.cie2 &&
        c <= ASSESSMENT_CAPS.cie3 && d <= ASSESSMENT_CAPS.see) {
      const sum  = a + b + c + d
      const next = nums[i + 4]
      // Optional: verify that the following number is the total (±1 for rounding)
      if (next === undefined || Math.abs(next - sum) <= 1) {
        return { courseCode: code, cie1: a, cie2: b, cie3: c, see: d, confidence: 'high' }
      }
    }
  }

  // Strategy B — CIE total (31–70) followed by SEE (0–30)
  // This happens when the PDF shows aggregated internal marks, not per-component marks.
  for (let i = 0; i + 1 <= nums.length - 1; i++) {
    const [cieT, see] = [nums[i], nums[i + 1]]
    if (cieT > ASSESSMENT_CAPS.cie1 && cieT <= 70 && see <= ASSESSMENT_CAPS.see) {
      const next = nums[i + 2]
      if (next === undefined || Math.abs(next - (cieT + see)) <= 1) {
        return {
          courseCode: code, cie1: null, cie2: null, cie3: null, see,
          confidence: 'partial',
          note: `PDF shows CIE total ${cieT}/70 — individual CIE marks not available. Only SEE pre-filled.`,
        }
      }
    }
  }

  return { courseCode: code, cie1: null, cie2: null, cie3: null, see: null, confidence: 'none' }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function parsePDFMarks(file) {
  // Layers 1 & 2 run synchronously/quickly — reject bad files before allocating
  // the full ArrayBuffer.
  assertFileMetadata(file)
  await assertMagicBytes(file)

  const buf = await file.arrayBuffer()

  let doc
  try {
    doc = await pdfjs.getDocument({
      data:            new Uint8Array(buf),  // defensive copy — don't hold a ref to the original
      isEvalSupported: false,                // Layer 3a: disable JavaScript evaluation inside PDF
      disableFontFace: true,                 // Layer 3b: block font-face loading (CVE-2024-4367 vector)
      useSystemFonts:  false,
      verbosity:       0,                    // suppress all console output from pdfjs
    }).promise
  } catch (err) {
    throw new Error(`Could not open PDF: ${sanitizeText(String(err?.message ?? '').slice(0, 120))}`)
  }

  const numPages   = Math.min(doc.numPages, MAX_PAGES)
  const candidates = []
  const seenCodes  = new Set()

  for (let p = 1; p <= numPages; p++) {
    const page = await doc.getPage(p)
    const rows = await extractPageRows(page)
    page.cleanup()

    for (const row of rows) {
      const parsed = interpretRow(row)
      if (!parsed || seenCodes.has(parsed.courseCode)) continue
      seenCodes.add(parsed.courseCode)
      candidates.push(parsed)
    }
  }

  await doc.destroy()
  return candidates
  // Shape: Array<{ courseCode, cie1, cie2, cie3, see, confidence, note? }>
  // confidence: 'high' | 'partial' | 'none'
}
