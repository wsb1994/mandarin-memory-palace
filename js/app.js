import { h, render, createContext } from 'preact'
import { useState, useMemo, useCallback, useRef, useEffect, useContext } from 'preact/hooks'
import { HSK1, COUNT, WORDS, LEVEL_META, showHz, addedWords, enabledSet, extraIds, isAdded } from './hsk1.js'
import { shotBrief, METHOD, readMaps, compactMaps, MAP_CAP, defaultMapValue, whyLead, whyLocation, whyTone, LEADS, LOCATIONS, TONES, LEAD_GROUPS } from './shots.js'
import { hintFor, defaultObjects, piecesOf, catalog } from './radicals.js'
import { speakZh, speechOk } from './speak.js'
import { review, isDue, unixDay, State, newCard } from './fsrs.js'
import {
  loadState,
  writeState,
  clearState,
  rollover,
  exportPayload,
  parseImport,
  emptyState,
} from './store.js?v=sqlite'

const ScriptCtx = createContext('s')
const MapsCtx = createContext({ maps: { a: {}, s: {}, t: {}, p: {} }, setMap: () => {} })

function dueIds(state, today) {
  const out = []
  for (const w of addedWords(state)) {
    const c = state.c[w.id]
    if (c && isDue(c, today)) out.push(w.id)
  }
  return out
}

function unseenIds(state) {
  const out = []
  for (const w of addedWords(state)) {
    const c = state.c[w.id]
    if (!c || !c.reps) out.push(w.id)
  }
  return out
}

function counts(state, today) {
  const due = dueIds(state, today).length
  const newLeft = Math.max(0, state.newCap - state.newToday)
  const unseen = unseenIds(state).length
  const added = addedWords(state).length
  const learned = Object.keys(state.c).length
  return { due, newLeft: Math.min(newLeft, unseen), unseen, learned, added }
}

function buildQueue(state, today) {
  const due = dueIds(state, today)
  const need = Math.max(0, state.newCap - state.newToday)
  const fresh = unseenIds(state).slice(0, need)
  return [...due, ...fresh]
}

function Nav({ page, go, script, setScript }) {
  const items = [
    ['home', 'Desk'],
    ['review', 'Review'],
    ['studio', 'Studio'],
    ['data', 'Data'],
  ]
  return h('header', { class: 'top' },
    h('div', { class: 'brand' },
      h('div', { class: 'script', role: 'radiogroup', 'aria-label': 'Simplified or traditional characters' },
        h('button', {
          type: 'button',
          class: 'link' + (script !== 't' ? ' on' : ''),
          role: 'radio',
          'aria-checked': script !== 't' ? 'true' : 'false',
          onClick: () => setScript('s'),
        }, '简'),
        h('button', {
          type: 'button',
          class: 'link' + (script === 't' ? ' on' : ''),
          role: 'radio',
          'aria-checked': script === 't' ? 'true' : 'false',
          onClick: () => setScript('t'),
        }, '繁'),
      ),
      h('h1', null, 'Hanzi Stage'),
    ),
    h('nav', null, items.map(([id, label]) =>
      h('button', {
        key: id,
        class: 'link' + (page === id ? ' on' : ''),
        onClick: () => go(id),
        'aria-current': page === id ? 'page' : undefined,
      }, label),
    )),
  )
}

function Home({ state, go, setState }) {
  const today = unixDay()
  const c = counts(state, today)
  return h('div', null,
    h('p', { class: 'mute' },
      'HSK 2.0 · add lists in Studio. Progress lives in a local SQLite file on this machine. No account.'),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', null, c.due), h('span', null, 'due')),
      h('div', { class: 'stat' }, h('b', null, c.newLeft), h('span', null, 'new left today')),
      h('div', { class: 'stat' }, h('b', null, `${c.learned}/${c.added}`), h('span', null, 'touched')),
    ),
    h('div', { class: 'row' },
      h('button', { onClick: () => go('review'), disabled: c.due + c.newLeft === 0 },
        c.due + c.newLeft ? 'Start review' : 'Caught up'),
      h('button', { class: 'ghost', onClick: () => go('studio') }, 'Write shots'),
      h('button', { class: 'ghost', onClick: () => go('data') }, 'Name leads & locations'),
    ),
    h('p', { class: 'small mute' }, 'Queue lists (additive). HSK 1 is on. Add 2–6 in Studio or here.'),
    h('div', { class: 'row' }, LEVEL_META.map((m) => {
      const on = enabledSet(state).has(m.lv)
      return h('button', {
        key: m.lv,
        class: on ? '' : 'ghost',
        disabled: on && m.lv === 1 && enabledSet(state).size === 1,
        onClick: () => {
          const cur = [...enabledSet(state)]
          const next = on ? cur.filter((n) => n !== m.lv) : [...cur, m.lv].sort((a, b) => a - b)
          if (!next.length) return
          const lv = next
          const x = extraIds({ ...state, lv })
          setState({ ...state, lv, x })
        },
      }, (on ? '✓ ' : '+ ') + m.name)
    })),
    h('h2', null, 'How a shot works'),
    h('ol', { class: 'small' }, METHOD.map((t, i) => h('li', { key: i }, t))),
    h('p', { class: 'small mute' },
      'Click a hanzi for radical and piece objects. Click the lead, location, or lighting to see why it was picked and to rename it for every card. Click off to close. Hear uses the Mandarin voice already on the phone or computer — no account, no quota. Speak the hanzi, not the pinyin letters.'),
    h('h2', null, 'New cards / day'),
    h('p', { class: 'small mute' }, 'Keep this low on a phone. Default 7.'),
    h('div', { class: 'row' },
      h('input', {
        type: 'number', min: 1, max: 30, value: state.newCap,
        onChange: (e) => setState({ ...state, newCap: Math.max(1, Math.min(30, +e.target.value || 7)) }),
      }),
    ),
  )
}

function PopTip({ label, aria, width, children }) {
  const wrap = useRef(null)
  const pop = useRef(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)

  const place = useCallback(() => {
    const el = wrap.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const w = Math.min(width || 288, window.innerWidth - 24)
    let left = r.left + r.width / 2 - w / 2
    left = Math.max(12, Math.min(left, window.innerWidth - w - 12))
    setPos({ top: r.bottom + 8, left, width: w })
  }, [width])

  const hide = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => { setOpen((on) => { if (on) return false; place(); return true }) }, [place])

  useEffect(() => {
    if (!open) return
    place()
    const onKey = (e) => { if (e.key === 'Escape') hide() }
    const onScroll = (e) => {
      if (pop.current && pop.current.contains(e.target)) return
      hide()
    }
    const onDoc = (e) => {
      if (wrap.current && wrap.current.contains(e.target)) return
      hide()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', hide)
    document.addEventListener('pointerdown', onDoc)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', hide)
      document.removeEventListener('pointerdown', onDoc)
    }
  }, [open, hide, place])

  return h('span', {
    class: 'glyph',
    ref: wrap,
    tabIndex: 0,
    'aria-haspopup': 'dialog',
    'aria-expanded': open ? 'true' : 'false',
    'aria-label': aria || label,
    onClick: (e) => {
      e.stopPropagation()
      toggle()
    },
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggle()
      }
    },
  },
    label,
    open && pos && h('div', {
      class: 'glyph-pop',
      ref: pop,
      role: 'dialog',
      style: { top: pos.top + 'px', left: pos.left + 'px', width: pos.width + 'px' },
      onClick: (e) => e.stopPropagation(),
    }, children),
  )
}

function MapEdit({ kind, mapKey, current }) {
  const { setMap } = useContext(MapsCtx)
  const fallback = kind === 'p' ? defaultObjects(mapKey).join(', ') : defaultMapValue(kind, mapKey)
  const [draft, setDraft] = useState(current || fallback)
  useEffect(() => { setDraft(current || fallback) }, [current, fallback])
  const dirty = (current || fallback) !== fallback
  function apply(v) {
    setMap(kind, mapKey, v)
  }
  return h('div', { class: 'map-edit' },
    h('label', { class: 'small mute' }, 'Your version (every card)'),
    h('textarea', {
      class: 'map-field',
      rows: kind === 'p' ? 3 : 2,
      maxlength: MAP_CAP[kind] || 64,
      value: draft,
      onInput: (e) => setDraft(e.target.value),
    }),
    h('div', { class: 'row tight' },
      h('button', {
        type: 'button',
        class: 'ghost',
        onClick: () => { apply(draft); },
      }, 'Use everywhere'),
      dirty && h('button', {
        type: 'button',
        class: 'ghost',
        onClick: () => { setDraft(fallback); apply('') },
      }, 'Reset'),
    ),
  )
}

function MapTip({ kind, mapKey, label }) {
  const { maps } = useContext(MapsCtx)
  const current = kind === 'p'
    ? (maps.p[mapKey] || defaultObjects(mapKey).join(', '))
    : (maps[kind] && maps[kind][mapKey]) || defaultMapValue(kind, mapKey)
  const why = kind === 'a' ? whyLead(mapKey) : kind === 's' ? whyLocation(mapKey) : whyTone(mapKey)
  const title = kind === 'a'
    ? `Lead · ${mapKey ? mapKey + '-' : 'no initial'}`
    : kind === 's'
      ? `Location · ${mapKey}`
      : `Lighting · tone ${mapKey}`
  return h(PopTip, { label, aria: `${title}. ${label}`, width: 320 },
    h('div', { class: 'rad-row' }, h('b', { class: 'map-title' }, title)),
    h('p', { class: 'small' }, why),
    h('p', { class: 'small mute' }, 'Default: ', fallbackLabel(kind, mapKey)),
    h(MapEdit, { kind, mapKey, current }),
  )
}

function fallbackLabel(kind, mapKey) {
  if (kind === 'p') return defaultObjects(mapKey).join(', ')
  return defaultMapValue(kind, mapKey)
}

function GlyphTip({ hz, onPick }) {
  const script = useContext(ScriptCtx)
  const { maps } = useContext(MapsCtx)
  const shown = showHz(hz, script)
  const hint = hintFor(hz, maps)
  if (!hint) return shown
  const parts = hint.parts && hint.parts.length ? hint.parts : null
  return h(PopTip, { label: shown, aria: `${shown}, ${parts ? parts.length + ' pieces' : 'radical ' + hint.glyph}`, width: 320 },
    h('div', { class: 'rad-row' },
      h('b', null, shown),
      h('span', { class: 'small mute' }, parts ? parts.map((p) => p.glyph).join(' · ') : hint.glyph),
    ),
    onPick && h('p', { class: 'small mute' }, 'Tap an object to drop it in this shot. Each piece has its own objects.'),
    (parts || [{ ch: hint.rad, glyph: hint.glyph, name: hint.name, role: 'radical', objects: hint.objects, why: hint.why }]).map((part) =>
      h('div', { class: 'part-block', key: part.ch },
        h('div', { class: 'rad-row' },
          h('b', null, part.glyph),
          h('span', null, part.name, ' · ', part.role),
        ),
        h('p', { class: 'small' }, part.why),
        h('ul', null, (part.objects || []).map((obj) =>
          h('li', { key: part.ch + obj },
            onPick
              ? h('button', {
                type: 'button',
                class: 'obj',
                onClick: (e) => { e.stopPropagation(); onPick(obj) },
              }, obj)
              : h('span', null, obj),
          ),
        )),
        h(MapEdit, { kind: 'p', mapKey: part.ch, current: (maps.p[part.ch] || maps.p[part.glyph] || (part.objects || []).join(', ')) }),
      ),
    ),
  )
}

function Hear({ text, label }) {
  const script = useContext(ScriptCtx)
  const [warn, setWarn] = useState('')
  if (!speechOk()) return null
  const shown = showHz(text, script)
  return h('button', {
    type: 'button',
    class: 'ghost speak',
    'aria-label': 'Hear ' + (label || shown),
    onClick: (e) => {
      e.preventDefault()
      e.stopPropagation()
      const r = speakZh(shown, script)
      setWarn(r.hasZh === false ? 'No Mandarin voice on this device. Chrome / Edge / Safari on a phone or Mac already have one.' : '')
    },
  }, 'Hear', warn ? h('span', { class: 'small mute' }, ' · ', warn) : null)
}

function HanziWord({ word }) {
  return h('div', { class: 'hanzi' },
    [...word.hz].map((ch, i) => h(GlyphTip, { key: i + ch, hz: ch })),
  )
}

function emptyShots() {
  return { s: [], k: '' }
}

function readShots(m) {
  if (!m) return emptyShots()
  if (Array.isArray(m)) return { s: m.slice(), k: m.k || '' }
  return { s: (m.s || []).slice(), k: m.k || '' }
}

function hasShot(m) {
  const x = readShots(m)
  return x.k || x.s.some(Boolean)
}

function ShotEditor({ word, shots, onChange }) {
  const script = useContext(ScriptCtx)
  const { maps } = useContext(MapsCtx)
  const m = readShots(shots)
  return h('div', null,
    word.syl.map((syl, i) => {
      const brief = shotBrief(syl, maps)
      return h('div', { class: 'shot', key: i },
        h('h3', null, h(GlyphTip, {
          hz: syl.hz,
          onPick: (obj) => {
            const s = m.s.slice()
            const cur = (s[i] || '').replace(/\s+$/, '')
            s[i] = cur ? cur + ' · ' + obj : obj
            onChange({ s, k: m.k })
          },
        }), '  ', syl.display, '  ', h(Hear, { text: syl.hz, label: syl.display })),
        h('p', { class: 'small mute shot-brief' },
          h(MapTip, { kind: 'a', mapKey: brief.init, label: brief.lead }),
          ' on ',
          h(MapTip, { kind: 's', mapKey: brief.fin, label: brief.loc }),
          ', ',
          h(MapTip, { kind: 't', mapKey: String(brief.toneN), label: brief.light }),
          '.',
        ),
        h('textarea', {
          placeholder: `3D shot: ${brief.lead} uses the strokes of ${showHz(syl.hz, script)} as objects…`,
          value: m.s[i] || '',
          maxlength: 280,
          onInput: (e) => {
            const s = m.s.slice()
            s[i] = e.target.value
            onChange({ s, k: m.k })
          },
        }),
      )
    }),
    word.syl.length > 1 && h('div', { class: 'shot' },
      h('h3', null, 'Cut — the word'),
      h('p', { class: 'small mute' },
        'How do the shots edit together so the meaning “', word.en, '” is the cut, not a caption?'),
      h('textarea', {
        placeholder: 'The cut / linking motion…',
        value: m.k || '',
        maxlength: 280,
        onInput: (e) => onChange({ s: m.s.slice(), k: e.target.value }),
      }),
    ),
  )
}

function Review({ state, setState, saveError }) {
  const today = unixDay()
  const [queue, setQueue] = useState(() => buildQueue(state, today))
  const [show, setShow] = useState(false)
  const [draft, setDraft] = useState(emptyShots)

  const id = queue[0]
  const word = id == null ? null : WORDS[id]

  useEffect(() => {
    if (id == null) return
    const existing = state.c[id]
    setDraft(readShots(existing && existing.m))
    setShow(false)
  }, [id])

  function commitShots(m) {
    setDraft(m)
  }

  function rate(g) {
    if (id == null) return
    const prev = state.c[id] || newCard()
    const wasNew = !(state.c[id] && state.c[id].reps)
    const nextCard = review(prev, g, today)
    if (hasShot(draft)) nextCard.m = readShots(draft)
    const nextState = {
      ...state,
      newToday: wasNew ? state.newToday + 1 : state.newToday,
      c: { ...state.c, [id]: nextCard },
    }
    setState(nextState)
    const rest = queue.slice(1)
    if (nextCard.due <= today) rest.push(id)
    setQueue(rest)
    setDraft(emptyShots())
    setShow(false)
  }

  if (!word) {
    return h('div', null,
      h('p', null, 'Nothing due. Write shots in Studio, or come back tomorrow.'),
    )
  }

  return h('div', null,
    h('p', { class: 'small mute' }, `${queue.length} in this pile`),
    h(HanziWord, { word }),
    !show && h('div', { class: 'row' },
      h('button', { onClick: () => setShow(true) }, 'Reveal'),
    ),
    show && h('div', null,
      h('p', { class: 'py' }, word.py, '  ', h(Hear, { text: word.hz, label: word.py })),
      h('p', { class: 'mean' }, word.en),
      h(ShotEditor, { word, shots: draft, onChange: commitShots }),
      h('p', { class: 'small mute' }, 'Rate the recall, not the prose. Again keeps it in this pile.'),
      h('div', { class: 'rates' },
        h('button', { class: 'again', onClick: () => rate(1) }, 'Again'),
        h('button', { class: 'hard', onClick: () => rate(2) }, 'Hard'),
        h('button', { class: 'good', onClick: () => rate(3) }, 'Good'),
        h('button', { onClick: () => rate(4) }, 'Easy'),
      ),
    ),
    saveError && h('p', { class: 'warn' }, saveError),
  )
}

function pieceGroups(words) {
  const map = new Map()
  for (const w of words) {
    for (const ch of [...w.hz]) {
      for (const piece of piecesOf(ch)) {
        let g = map.get(piece)
        if (!g) {
          const info = catalog(piece)
          g = { piece, name: (info && info.name) || 'piece', glyphs: new Set(), words: [] }
          map.set(piece, g)
        }
        g.glyphs.add(ch)
        if (!g.words.includes(w)) g.words.push(w)
      }
    }
  }
  return [...map.values()]
    .filter((g) => g.glyphs.size >= 2)
    .sort((a, b) => b.glyphs.size - a.glyphs.size || a.piece.localeCompare(b.piece, 'zh'))
}

const X_CAP = 80

function Studio({ state, setState, go, setFocus }) {
  const script = useContext(ScriptCtx)
  const [q, setQ] = useState('')
  const [mode, setMode] = useState('added')
  const needle = q.trim().toLowerCase()
  const on = enabledSet(state)
  const extras = extraIds(state)
  const pool = useMemo(() => addedWords(state), [state.lv, state.x])
  function matchWord(w) {
    if (!needle) return true
    return w.hz.includes(needle) || showHz(w.hz, 't').includes(needle) || w.py.toLowerCase().includes(needle) || w.en.toLowerCase().includes(needle)
  }
  const rows = useMemo(() => pool.filter(matchWord), [pool, needle])
  const groups = useMemo(() => {
    const all = pieceGroups(pool)
    if (!needle) return all
    return all.filter((g) => (g.piece + g.name + [...g.glyphs].join('')).includes(needle) || g.piece.includes(q.trim()))
  }, [pool, needle, q])
  function addLv(n) {
    const lv = [...new Set([...(state.lv || [1]), n])].filter((x) => x >= 1 && x <= 6).sort((a, b) => a - b)
    setState({ ...state, lv, x: extraIds({ ...state, lv }) })
    setMode('added')
  }
  function dropLv(n) {
    const lv = [...on].filter((x) => x !== n)
    if (!lv.length) return
    setState({ ...state, lv })
  }
  function addWord(w) {
    if (isAdded(state, w)) return
    const x = extraIds({ ...state, x: [...extras, w.id] }).slice(-X_CAP)
    setState({ ...state, x })
  }
  function dropWord(w) {
    if (on.has(w.lv)) return
    setState({ ...state, x: extras.filter((id) => id !== w.id) })
  }
  function wordRow(w, kind) {
    const c = state.c[w.id]
    const has = c && hasShot(c.m)
    const extra = extras.includes(w.id)
    if (kind === 'unadded') {
      return h('li', { key: w.id },
        h('span', null, h('span', { class: 'hz' }, showHz(w.hz, script)), '  ', w.py),
        h('span', { class: 'mute small' },
          'HSK ' + w.lv + '  ',
          extra
            ? h('button', { class: 'ghost', onClick: (e) => { e.stopPropagation(); dropWord(w) } }, 'Remove')
            : h('button', { onClick: (e) => { e.stopPropagation(); addWord(w) } }, 'Add'),
        ),
      )
    }
    return h('li', {
      key: w.id,
      onClick: () => { setFocus(w.id); go('edit') },
    },
      h('span', null, h('span', { class: 'hz' }, showHz(w.hz, script)), '  ', w.py),
      h('span', { class: 'mute small' },
        'HSK ' + w.lv + (extra ? ' · extra' : '') + ' · ' + (has ? 'shot' : (c ? 'no shot' : 'new')),
        extra ? ['  ', h('button', { class: 'ghost', onClick: (e) => { e.stopPropagation(); dropWord(w) } }, 'Remove')] : null,
      ),
    )
  }
  const unaddedLists = LEVEL_META.filter((m) => !on.has(m.lv))
  return h('div', null,
    h('p', { class: 'mute small' },
      'Added lists sit in the review queue. Unadded lists stay here. Add a whole HSK level, or one word. Lists stack.'),
    h('div', { class: 'row' },
      h('button', { class: mode === 'added' ? '' : 'ghost', onClick: () => setMode('added') }, 'Added'),
      h('button', { class: mode === 'unadded' ? '' : 'ghost', onClick: () => setMode('unadded') }, 'Unadded'),
      h('button', { class: mode === 'piece' ? '' : 'ghost', onClick: () => setMode('piece') }, 'By piece'),
    ),
    h('input', {
      type: 'search', placeholder: mode === 'piece' ? 'Filter piece  e.g. 女' : 'Filter hanzi / pinyin / English', value: q,
      style: { width: '100%', padding: '0.6rem', font: 'inherit', border: '1px solid var(--line)' },
      onInput: (e) => setQ(e.target.value),
    }),
    mode === 'added' && h('div', null,
      h('p', { class: 'small mute' },
        pool.length, ' words in queue · ', [...on].map((n) => 'HSK ' + n).join(', '),
        extras.length ? ' · ' + extras.length + ' extra words' : ''),
      [...on].length > 1 && h('p', { class: 'small mute' },
        [...on].filter((n) => !(n === 1 && on.size === 1)).map((n) =>
          h('button', { class: 'ghost', style: { marginRight: '0.35rem' }, onClick: () => dropLv(n) }, 'Remove HSK ' + n),
        ),
      ),
      h('ul', { class: 'list' }, rows.map((w) => wordRow(w, 'added'))),
    ),
    mode === 'unadded' && unaddedLists.map((m) => {
      const list = WORDS.filter((w) => w.lv === m.lv && matchWord(w) && !extras.includes(w.id))
      return h('section', { class: 'piece-group', key: m.lv },
        h('h3', { class: 'roster-h' }, m.name, ' · ', m.n, ' words'),
        h('div', { class: 'row' },
          h('button', { onClick: () => addLv(m.lv) }, 'Add all of ' + m.name),
        ),
        h('ul', { class: 'list' }, list.slice(0, 80).map((w) => wordRow(w, 'unadded'))),
        list.length > 80 && h('p', { class: 'small mute' }, '…', list.length - 80, ' more. Add the list, or search.'),
      )
    }),
    mode === 'unadded' && !unaddedLists.length && h('p', null, 'Every HSK 2.0 list is added.'),
    mode === 'piece' && h('div', { class: 'piece-groups' }, groups.map((g) =>
      h('section', { class: 'piece-group', key: g.piece },
        h('h3', { class: 'roster-h' },
          h('span', { class: 'hz' }, showHz(g.piece, script)),
          '  ', g.name, ' · ', g.glyphs.size, ' characters',
        ),
        h('p', { class: 'small mute' }, [...g.glyphs].map((ch) => showHz(ch, script)).join(' ')),
        h('ul', { class: 'list' }, g.words.map((w) => wordRow(w, 'added'))),
      ),
    )),
  )
}

function Edit({ id, state, setState, go }) {
  const word = WORDS[id]
  const card = state.c[id]
  const [draft, setDraft] = useState(() => readShots(card && card.m))
  if (!word) return h('p', null, 'Missing card')
  function persist() {
    const prev = state.c[id] || newCard()
    const nextCard = { ...prev }
    if (hasShot(draft)) nextCard.m = readShots(draft)
    else delete nextCard.m
    const next = { ...state, c: { ...state.c, [id]: nextCard } }
    setState(next)
    go('studio')
  }
  return h('div', null,
    h('button', { class: 'ghost', onClick: () => go('studio') }, '← Studio'),
    h(HanziWord, { word }),
    h('p', { class: 'py' }, word.py, '  ', h(Hear, { text: word.hz, label: word.py })),
    h('p', { class: 'mean' }, word.en),
    h(ShotEditor, { word, shots: draft, onChange: setDraft }),
    h('div', { class: 'row' },
      h('button', { onClick: persist }, 'Save shot'),
    ),
  )
}

function RosterRow({ kind, mapKey, label, hint }) {
  const { maps, setMap } = useContext(MapsCtx)
  const fallback = defaultMapValue(kind, mapKey)
  const stored = (maps[kind] && maps[kind][mapKey]) || ''
  const current = stored || fallback
  const [draft, setDraft] = useState(current)
  useEffect(() => { setDraft(current) }, [current])
  const dirty = stored && stored !== fallback
  function commit() {
    const v = draft.trim()
    if (v === current) return
    setMap(kind, mapKey, v === fallback ? '' : v)
  }
  return h('li', { class: 'roster-row' },
    h('div', { class: 'roster-key' },
      h('b', { title: hint || '' }, label),
      dirty && h('span', { class: 'small mute' }, 'yours'),
    ),
    h('input', {
      type: 'text',
      value: draft,
      maxlength: MAP_CAP[kind] || 64,
      'aria-label': label,
      placeholder: fallback,
      title: hint || fallback,
      onInput: (e) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e) => { if (e.key === 'Enter') { e.target.blur() } },
    }),
    dirty && h('button', { type: 'button', class: 'ghost', onClick: () => { setDraft(fallback); setMap(kind, mapKey, '') } }, 'Reset'),
  )
}

const LOCATION_KEYS = Object.keys(LOCATIONS)

function RosterBoard() {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  function match(label, extra) {
    if (!needle) return true
    return (label + ' ' + (extra || '')).toLowerCase().includes(needle)
  }
  function leadBlock(id, title, note, keys) {
    const rows = keys.filter((k) => match(k === '' ? 'ø null echo trade' : k, LEADS[k]))
    if (!rows.length) return null
    return [
      h('h3', { class: 'roster-h', id, key: id }, title, ' (', rows.length, ')'),
      note && h('p', { class: 'small mute', key: id + 'n' }, note),
      h('ul', { class: 'roster-list', key: id + 'l' }, rows.map((k) =>
        h(RosterRow, {
          key: 'a' + k,
          kind: 'a',
          mapKey: k,
          label: k === '' ? 'ø' : k,
          hint: whyLead(k),
        }),
      )),
    ]
  }
  const sets = LOCATION_KEYS.filter((k) => match(k === '' ? 'ø null' : k, LOCATIONS[k]))
  const tones = Object.keys(TONES).filter((k) => match('tone ' + k + ' ' + TONES[k].name, TONES[k].light))
  return h('div', { class: 'roster' },
    h('p', { class: 'small mute' },
      '13 locations, 55 leads. a/e/o are trades; i are first names; u are creatures; ü are animals. Assign places you can walk before you review. Enter or click away saves for every card.'),
    h('p', { class: 'roster-jump' },
      h('a', { href: '#roster-sets' }, 'Locations'),
      ' · ',
      h('a', { href: '#roster-male' }, 'Trades'),
      ' · ',
      h('a', { href: '#roster-female' }, 'First names'),
      ' · ',
      h('a', { href: '#roster-fiction' }, 'Creatures'),
      ' · ',
      h('a', { href: '#roster-animal' }, 'Animals'),
      ' · ',
      h('a', { href: '#roster-tones' }, 'Lighting'),
    ),
    h('input', {
      type: 'search', placeholder: 'Filter  e.g. an, ju, Yak', value: q,
      style: { width: '100%', padding: '0.6rem', font: 'inherit', border: '1px solid var(--line)', marginBottom: '0.75rem' },
      onInput: (e) => setQ(e.target.value),
    }),
    h('h3', { class: 'roster-h', id: 'roster-sets' }, 'Locations · 13 (', sets.length, ')'),
    h('p', { class: 'small mute' },
      'Coda after the lead. ø is whatever is left (shi, yi, wu, qu…). Rename each to a place you know.'),
    h('ul', { class: 'roster-list' }, sets.map((k) =>
      h(RosterRow, {
        key: 's' + k,
        kind: 's',
        mapKey: k,
        label: k === '' ? 'ø  null' : k,
        hint: whyLocation(k),
      }),
    )),
    leadBlock('roster-male', 'Trades · a e o', 'Rename to people you know if you like.', LEAD_GROUPS.male),
    leadBlock('roster-female', 'First names · i', 'Rename to friends if you like.', LEAD_GROUPS.female),
    leadBlock('roster-fiction', 'Creatures · u', 'Give each habits you can predict.', LEAD_GROUPS.fiction),
    leadBlock('roster-animal', 'Animals · ü', 'Same animal every ü-shot. Swap names if you like.', LEAD_GROUPS.animal),
    h('h3', { class: 'roster-h', id: 'roster-tones' }, 'Lighting · tone'),
    h('ul', { class: 'roster-list' }, tones.map((k) =>
      h(RosterRow, {
        key: 't' + k,
        kind: 't',
        mapKey: k,
        label: 'tone ' + k + ' · ' + TONES[k].name,
        hint: whyTone(k),
      }),
    )),
  )
}

function Data({ state, setState, dbPath }) {
  const fileRef = useRef(null)
  const payload = JSON.stringify(exportPayload(state), null, 2)
  function download() {
    const blob = new Blob([payload], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'hanzi-stage-hsk1.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  function onFile(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const next = parseImport(String(reader.result))
        setState(next)
        alert('Imported into the local database.')
      } catch (err) {
        alert(err.message || 'Could not import')
      }
    }
    reader.readAsText(file)
  }
  async function wipe() {
    if (!confirm('Delete local progress on this device?')) return
    await clearState()
    setState(emptyState())
  }
  return h('div', null,
    h('h2', null, 'Leads and locations'),
    h(RosterBoard),
    h('h2', null, 'Local database'),
    h('p', { class: 'small' },
      'SQLite on this machine',
      dbPath ? [': ', h('code', null, dbPath)] : '.',
      ' 简/繁, scheduling, and shot text all live here. No account, no upload.'),
    h('p', { class: 'small mute' },
      'Shot text is not trimmed. Export is a portable JSON snapshot of this database.'),
    h('div', { class: 'row' },
      h('button', { onClick: download }, 'Export JSON'),
      h('button', { class: 'ghost', onClick: () => fileRef.current && fileRef.current.click() }, 'Import JSON'),
      h('button', { class: 'ghost', onClick: wipe }, 'Clear database'),
    ),
    h('input', { type: 'file', accept: 'application/json', ref: fileRef, hidden: true, onChange: onFile }),
    h('h2', null, 'Database payload'),
    h('textarea', { readOnly: true, value: payload, style: { minHeight: '12rem' } }),
  )
}

function App() {
  const [state, setStateRaw] = useState(null)
  const [page, setPage] = useState('home')
  const [focus, setFocus] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [dbPath, setDbPath] = useState(null)

  useEffect(() => {
    let live = true
    loadState().then((r) => {
      if (!live) return
      setStateRaw(r.state)
      setDbPath(r.db)
    }).catch((err) => {
      if (!live) return
      setStateRaw(rollover(emptyState()))
      setSaveError(err.message || 'Could not open the local database.')
    })
    return () => { live = false }
  }, [])

  const setState = useCallback((next) => {
    const rolled = rollover(next)
    setStateRaw(rolled)
    writeState(rolled).then(() => {
      setSaveError(null)
    }).catch((err) => {
      setSaveError(err.message || 'Could not save to the local database.')
    })
  }, [])

  const script = state && state.script === 't' ? 't' : 's'
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = script === 't' ? 'zh-Hant' : 'zh-Hans'
  }, [script])

  if (!state) {
    return h('p', { class: 'mute' }, 'Opening local database…')
  }

  const setScript = (next) => setState({ ...state, script: next })
  const maps = readMaps(state.maps)
  const setMap = (kind, key, value) => {
    const next = readMaps(state.maps)
    const cap = MAP_CAP[kind] || 64
    const trimmed = String(value || '').trim().slice(0, cap)
    const fallback = kind === 'p' ? defaultObjects(key).join(', ') : defaultMapValue(kind, key)
    if (!trimmed || trimmed === fallback) delete next[kind][key]
    else next[kind][key] = trimmed
    setState({ ...state, maps: compactMaps(next) })
  }

  return h(MapsCtx.Provider, { value: { maps, setMap } },
    h(ScriptCtx.Provider, { value: script },
    h('div', null,
    h(Nav, { page, go: setPage, script, setScript }),
    saveError && page !== 'review' && h('p', { class: 'warn' }, saveError),
    page === 'home' && h(Home, { state, go: setPage, setState }),
    page === 'review' && h(Review, { state, setState, saveError }),
    page === 'studio' && h(Studio, { state, setState, go: setPage, setFocus }),
    page === 'edit' && h(Edit, { id: focus, state, setState, go: setPage }),
    page === 'data' && h(Data, { state, setState, dbPath }),
    h('footer', { class: 'legal' },
      'Dataset: official HSK 2.0 (2012) Level 1. Scheduler: FSRS-5. Local SQLite on this machine. Shots you write stay here unless you export them.'),
    ),
    ),
  )
}

render(h(App), document.getElementById('app'))
