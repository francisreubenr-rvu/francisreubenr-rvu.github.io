import { LS_KEY, LS_MAJOR } from './constants'

export function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveState(courses) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(courses))
  } catch {
    // storage full or unavailable
  }
}

export function clearState() {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {}
}

export function loadMajor() {
  try { return JSON.parse(localStorage.getItem(LS_MAJOR)) } catch { return null }
}

export function saveMajor(major) {
  try { localStorage.setItem(LS_MAJOR, JSON.stringify(major)) } catch {}
}
