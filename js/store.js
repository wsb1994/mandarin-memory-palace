/** Local SQLite via /api/state. Cookie `stage` is only a one-time migrate source. */

import { unixDay } from './fsrs.js'
import { compactMaps, readMaps } from './shots.js'

export const COOKIE_NAME = 'stage'
export const DB_API = '/api/state'
const MAX_AGE = 63072000 // 2 years
const BUDGET = 3500 // cookie fallback only

export function emptyState() {
  return {
    v: 1,
    newCap: 7,
    day: unixDay(),
    newToday: 0,
    script: 's',
    lv: [1],
    x: [],
    c: {},
  }
}

export function normalizeState(parsed) {
  if (!parsed || parsed.v !== 1 || typeof parsed.c !== 'object' || parsed.c == null) {
    throw new Error('Unknown version')
  }
  return {
    v: 1,
    newCap: parsed.newCap || 7,
    day: parsed.day || unixDay(),
    newToday: parsed.newToday || 0,
    script: parsed.script === 't' ? 't' : 's',
    lv: Array.isArray(parsed.lv) && parsed.lv.length
      ? parsed.lv.map(Number).filter((n) => n >= 1 && n <= 6)
      : [1],
    x: Array.isArray(parsed.x) ? parsed.x.map(Number).filter((n) => n >= 0) : [],
    maps: compactMaps(readMaps(parsed.maps)),
    c: parsed.c || {},
  }
}

export function cookieHasProgress(state) {
  if (!state) return false
  if (state.c && Object.keys(state.c).length) return true
  if (state.script === 't') return true
  if (state.newCap && state.newCap !== 7) return true
  if (Array.isArray(state.lv) && (state.lv.length !== 1 || Number(state.lv[0]) !== 1)) return true
  if (Array.isArray(state.x) && state.x.length) return true
  if (compactMaps(readMaps(state.maps))) return true
  return false
}

export function readCookie() {
  if (typeof document === 'undefined') return emptyState()
  const parts = document.cookie.split(';')
  for (const p of parts) {
    const i = p.indexOf('=')
    if (i < 0) continue
    const k = p.slice(0, i).trim()
    if (k !== COOKIE_NAME) continue
    try {
      const parsed = JSON.parse(decodeURIComponent(p.slice(i + 1).trim()))
      return normalizeState(parsed)
    } catch {
      return emptyState()
    }
  }
  return emptyState()
}

function serialize(state) {
  const maps = compactMaps(state.maps)
  const body = { ...state }
  if (maps) body.maps = maps
  else delete body.maps
  return encodeURIComponent(JSON.stringify(body))
}

function trimShots(state) {
  const next = { ...state, c: { ...state.c } }
  const ids = Object.keys(next.c)
  ids.sort((a, b) => {
    const ma = JSON.stringify(next.c[a].m || '').length
    const mb = JSON.stringify(next.c[b].m || '').length
    return mb - ma
  })
  for (const id of ids) {
    if (serialize(next).length <= BUDGET) break
    if (next.c[id].m) {
      const copy = { ...next.c[id] }
      delete copy.m
      next.c[id] = copy
    }
  }
  return next
}

export function writeCookie(state) {
  if (typeof document === 'undefined') return { ok: true, trimmed: false, backend: 'cookie' }
  let payload = state
  let trimmed = false
  if (serialize(payload).length > BUDGET) {
    payload = trimShots(payload)
    trimmed = true
  }
  const value = serialize(payload)
  document.cookie = `${COOKIE_NAME}=${value};Max-Age=${MAX_AGE};Path=/;SameSite=Strict`
  return { ok: value.length <= BUDGET, trimmed, backend: 'cookie' }
}

export function clearCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=;Max-Age=0;Path=/;SameSite=Strict`
}

export function rollover(state, today = unixDay()) {
  if (state.day === today) return state
  return { ...state, day: today, newToday: 0 }
}

export function exportPayload(state) {
  return {
    app: 'hanzi-stage',
    dataset: 'hsk2.0',
    exportedAt: new Date().toISOString(),
    storage: 'sqlite',
    cookieName: COOKIE_NAME,
    state,
  }
}

export function parseImport(text) {
  const data = JSON.parse(text)
  const state = data.state || data
  if (!state || typeof state !== 'object') throw new Error('Not a progress file')
  return normalizeState(state)
}

async function fetchState() {
  const res = await fetch(DB_API, { cache: 'no-store' })
  if (!res.ok) throw new Error('sqlite read failed')
  return res.json()
}

export async function writeState(state) {
  const body = normalizeState(state)
  const res = await fetch(DB_API, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let detail = 'sqlite write failed'
    try { detail = (await res.json()).error || detail } catch { /* keep */ }
    throw new Error(detail)
  }
  clearCookie()
  return { ok: true, trimmed: false, backend: 'sqlite' }
}

export async function clearState() {
  try {
    await fetch(DB_API, { method: 'DELETE' })
  } catch {
    /* cookie clear still runs */
  }
  clearCookie()
}

export async function loadState() {
  const remote = await fetchState()
  const cookie = readCookie()
  if (remote && remote.empty) {
    if (cookieHasProgress(cookie)) {
      await writeState(cookie)
      clearCookie()
      return {
        state: rollover(cookie),
        backend: 'sqlite',
        migrated: true,
        db: remote.db || null,
      }
    }
    clearCookie()
    return {
      state: rollover(emptyState()),
      backend: 'sqlite',
      migrated: false,
      db: remote.db || null,
    }
  }
  const state = normalizeState(remote.state)
  clearCookie()
  return {
    state: rollover(state),
    backend: 'sqlite',
    migrated: false,
    db: remote.db || null,
  }
}
