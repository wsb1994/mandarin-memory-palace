/**
 * Palace order. One item per character and one per multi-character word.
 *
 * Per HSK level: characters new to that level, in corpus frequency order (js/freq.js).
 * A word of two or more characters is placed right after the last of its
 * characters, so you always meet 出, 租, 车 before 出租车. A word whose characters
 * all came from earlier levels goes at the front of its level.
 *
 * Nothing here says how to remember. Each item gets one paragraph the learner writes.
 */

import { WORDS, LEVEL_META } from './hsk1.js'
import { FREQ_RANK } from './freq.js'

const NO_RANK = 100000

export function rankOf(ch) {
  return FREQ_RANK[ch] || NO_RANK
}

function build() {
  const items = []
  const byHz = new Map()
  const charSeen = new Map() // ch -> item
  const pendingWords = new Map() // ch -> [word rows waiting on this ch]

  for (const meta of LEVEL_META) {
    const lv = meta.lv
    const rows = WORDS.filter((w) => w.lv === lv)
    const single = new Map()
    for (const w of rows) if ([...w.hz].length === 1) single.set(w.hz, w)

    // every glyph this level introduces, with the syllable it carries
    const fresh = new Map()
    for (const w of rows) {
      const chars = [...w.hz]
      chars.forEach((ch, i) => {
        if (charSeen.has(ch) || fresh.has(ch)) return
        const syl = w.syl[Math.min(i, w.syl.length - 1)]
        fresh.set(ch, { ch, syl, from: w })
      })
    }
    const order = [...fresh.values()].sort((a, b) => rankOf(a.ch) - rankOf(b.ch) || a.ch.localeCompare(b.ch, 'zh'))

    const multi = rows.filter((w) => [...w.hz].length > 1)
    const waiting = new Map()
    for (const w of multi) {
      const need = new Set([...w.hz].filter((ch) => !charSeen.has(ch)))
      waiting.set(w.id, need)
    }

    function emitWord(w) {
      if (byHz.has(w.hz)) return
      const parts = [...new Set([...w.hz])]
      const item = {
        id: w.hz,
        kind: 'word',
        hz: w.hz,
        py: w.py,
        pyNum: w.pyNum,
        en: w.en,
        lv,
        parts,
        rank: Math.max(...parts.map(rankOf)),
        n: items.length,
      }
      items.push(item)
      byHz.set(w.hz, item)
      for (const ch of parts) {
        const c = charSeen.get(ch)
        if (c && !c.words.includes(w.hz)) c.words.push(w.hz)
      }
    }

    function release(ch) {
      const ready = []
      for (const w of multi) {
        const need = waiting.get(w.id)
        if (!need || !need.size) continue
        need.delete(ch)
        if (!need.size) ready.push(w)
      }
      ready.sort((a, b) => a.syl.length - b.syl.length || a.id - b.id)
      for (const w of ready) emitWord(w)
    }

    // words whose characters were all met in earlier levels
    const freeNow = multi.filter((w) => waiting.get(w.id).size === 0)
    freeNow.sort((a, b) => a.syl.length - b.syl.length || a.id - b.id)
    for (const w of freeNow) emitWord(w)

    for (const f of order) {
      const own = single.get(f.ch)
      const item = {
        id: f.ch,
        kind: 'char',
        hz: f.ch,
        py: own ? own.py : f.syl.display,
        pyNum: own ? own.pyNum : [f.syl.raw],
        en: own ? own.en : '',
        lv,
        parts: [],
        words: [],
        rank: rankOf(f.ch),
        n: items.length,
      }
      items.push(item)
      byHz.set(f.ch, item)
      charSeen.set(f.ch, item)
      release(f.ch)
    }
  }

  for (const it of items) {
    if (it.kind === 'char' && !it.en) {
      const first = it.words[0] && byHz.get(it.words[0])
      it.en = first ? `in ${first.hz} (${first.en})` : ''
      it.only = true
    }
  }
  return { items, byHz }
}

const built = build()
export const ITEMS = built.items
export const ITEM_BY_HZ = built.byHz

export function itemFor(hz) {
  return ITEM_BY_HZ.get(hz) || null
}

export function levelSet(state) {
  const src = state && Array.isArray(state.lv) && state.lv.length ? state.lv : [1]
  const s = new Set(src.map(Number).filter((n) => n >= 1 && n <= 6))
  if (!s.size) s.add(1)
  return s
}

export function itemsIn(state) {
  const s = levelSet(state)
  return ITEMS.filter((it) => s.has(it.lv))
}

export function storyOf(state, hz) {
  const c = state && state.c && state.c[hz]
  return c && typeof c.p === 'string' ? c.p : ''
}

export function hasStory(state, hz) {
  return storyOf(state, hz).trim().length > 0
}

/** A word may be written once each of its characters has a paragraph. */
export function unlocked(state, item) {
  if (!item) return false
  if (item.kind === 'char') return true
  return item.parts.every((ch) => hasStory(state, ch))
}

/** Items in palace order that still need a paragraph. */
export function unwritten(state) {
  return itemsIn(state).filter((it) => !hasStory(state, it.hz))
}

export function nextToWrite(state, n = 12) {
  const out = []
  for (const it of unwritten(state)) {
    if (!unlocked(state, it)) continue
    out.push(it)
    if (out.length >= n) break
  }
  return out
}

export function written(state) {
  return itemsIn(state).filter((it) => hasStory(state, it.hz))
}
