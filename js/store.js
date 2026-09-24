/** Local SQLite via /api/state. State v2: cards keyed by hanzi, one paragraph each. */

import { WORDS } from './hsk1.js'

export const DB_API = '/api/state'

export function emptyState() {
  return { v: 2, script: 's', lv: [1], c: {} }
}

function cleanLv(raw) {
  const lv = Array.isArray(raw) ? raw.map(Number).filter((n) => n >= 1 && n <= 6) : []
  return lv.length ? [...new Set(lv)].sort((a, b) => a - b) : [1]
}

function cleanCard(card) {
  if (!card || typeof card !== 'object') return null
  const out = {}
  for (const k of ['s', 'd', 'due', 'reps', 'lapses', 'st', 'last']) {
    if (card[k] != null && Number.isFinite(Number(card[k]))) out[k] = Number(card[k])
  }
  if (typeof card.p === 'string' && card.p.trim()) out.p = card.p
  return out
}

/** v1 desk: numeric word ids, shot text in m.s[] / m.k. Fold into paragraphs keyed by hanzi. */
function fromV1(parsed) {
  const out = emptyState()
  out.script = parsed.script === 't' ? 't' : 's'
  out.lv = cleanLv(parsed.lv)
  for (const [key, card] of Object.entries(parsed.c || {})) {
    const w = WORDS[Number(key)]
    if (!w || !card) continue
    const next = cleanCard(card) || {}
    const m = card.m
    if (m) {
      const s = Array.isArray(m) ? m : (m.s || [])
      const k = (Array.isArray(m) ? m.k : m.k) || ''
      const para = [...s.filter(Boolean), k].filter((t) => t && String(t).trim()).map((t) => String(t).trim()).join('\n\n')
      if (para) next.p = para
    }
    if (Object.keys(next).length) out.c[w.hz] = next
  }
  return out
}

export function normalizeState(parsed) {
  if (!parsed || typeof parsed !== 'object' || typeof parsed.c !== 'object' || parsed.c == null) {
    throw new Error('Unknown version')
  }
  if (parsed.v === 1) return fromV1(parsed)
  if (parsed.v !== 2) throw new Error('Unknown version')
  const out = emptyState()
  out.script = parsed.script === 't' ? 't' : 's'
  out.lv = cleanLv(parsed.lv)
  for (const [hz, card] of Object.entries(parsed.c)) {
    const next = cleanCard(card)
    if (next && Object.keys(next).length) out.c[hz] = next
  }
  return out
}

export function hasProgress(state) {
  if (!state) return false
  if (state.c && Object.keys(state.c).length) return true
  if (state.script === 't') return true
  const lv = cleanLv(state.lv)
  return lv.length !== 1 || lv[0] !== 1
}

export function exportPayload(state) {
  return {
    app: 'hanzi-palace',
    dataset: 'hsk2.0',
    exportedAt: new Date().toISOString(),
    storage: 'sqlite',
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
  return { ok: true, backend: 'sqlite' }
}

export async function clearState() {
  await fetch(DB_API, { method: 'DELETE' })
}

export async function loadState() {
  const remote = await fetchState()
  if (remote && remote.empty) {
    // A v1 desk from the shot-list branch is offered once, then converted here.
    if (remote.legacy) {
      try {
        const migrated = normalizeState(remote.legacy)
        if (hasProgress(migrated)) {
          await writeState(migrated)
          return { state: migrated, backend: 'sqlite', migrated: true, db: remote.db || null }
        }
      } catch {
        /* fall through to empty */
      }
    }
    return { state: emptyState(), backend: 'sqlite', migrated: false, db: remote.db || null }
  }
  return { state: normalizeState(remote.state), backend: 'sqlite', migrated: false, db: remote.db || null }
}
