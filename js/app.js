import { h, render, createContext } from 'preact'
import { useState, useMemo, useCallback, useRef, useEffect, useContext } from 'preact/hooks'
import { LEVEL_META, showHz } from './hsk1.js'
import { ITEMS, itemFor, levelSet, itemsIn, storyOf, hasStory, unlocked, nextToWrite, unwritten, written } from './palace.js'
import { hintFor, piecesOf, catalog } from './radicals.js'
import { speakZh, speechOk } from './speak.js'
import { review, isDue, unixDay, newCard } from './fsrs.js'
import { loadState, writeState, clearState, exportPayload, parseImport, emptyState } from './store.js?v=palace'

const ScriptCtx = createContext('s')

/** Review only what has a paragraph. */
function dueList(state, today) {
  const out = []
  for (const it of itemsIn(state)) {
    const c = state.c[it.hz]
    if (!c || !c.p || !c.p.trim()) continue
    // a paragraph with no review yet is due now; after that FSRS decides
    if (!c.reps || isDue(c, today)) out.push(it.hz)
  }
  return out
}

function counts(state, today) {
  const pool = itemsIn(state)
  const done = written(state).length
  return {
    due: dueList(state, today).length,
    written: done,
    total: pool.length,
    left: pool.length - done,
  }
}

function Nav({ page, go, script, setScript, fresh }) {
  const items = [
    ...(fresh ? [['welcome', 'Welcome']] : []),
    ['home', 'Desk'],
    ['review', 'Review'],
    ['write', 'Write'],
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
      h('h1', null, 'Hanzi Palace'),
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

function LevelToggles({ state, setState }) {
  const on = levelSet(state)
  return h('div', { class: 'row' }, LEVEL_META.map((m) => {
    const has = on.has(m.lv)
    return h('button', {
      key: m.lv,
      class: has ? '' : 'ghost',
      disabled: has && on.size === 1,
      onClick: () => {
        const cur = [...on]
        const next = has ? cur.filter((n) => n !== m.lv) : [...cur, m.lv].sort((a, b) => a - b)
        if (!next.length) return
        setState({ ...state, lv: next })
      },
    }, (has ? '✓ ' : '+ ') + m.name)
  }))
}

const WATCH = [
  { href: 'https://www.youtube.com/watch?v=YW2_0dSfl2U&list=PLcnpIYbt022Eh0gtj8bDA1P9iigBqiIrm', title: 'Learning Chinese with a Game-Based Memory Palace', who: 'Language Arts with Adam', note: 'A series. Episode 1 builds a palace inside a video game world. Follow along if you want one worked example from the ground up.' },
  { href: 'https://youtu.be/_qGjfSrQH4Y', title: 'How to Use Memory Palaces to Learn Chinese', who: 'Mullen Memory', note: 'The system in practice: how characters, sounds, and tones get placed.' },
  { href: 'https://www.youtube.com/watch?v=yr_ziNyAURc', title: 'Simple Mandarin Memory Palace (how to)', who: 'Barry Allan, Mandarin Mnemonics', note: 'A short, plain version if you want to start today.' },
]

/** Shown while the database has no progress: no paragraphs, no reviews. */
function Welcome({ go, setFocus, state }) {
  const script = useContext(ScriptCtx)
  const first = nextToWrite(state, 1)[0]
  return h('div', { class: 'welcome' },
    h('h2', null, 'Welcome'),
    h('p', null,
      'Hanzi Palace is a place to keep a memory palace for Chinese characters. It gives you the order and the review schedule. The palace itself is yours.'),
    h('h3', null, 'What a memory palace is'),
    h('p', null,
      'A memory palace is a place you already know well, used as a filing system. Your childhood home, your walk to work, a level of a game you have played a hundred times. You pick a route through it and put one thing you want to remember at each spot along the way, as a vivid scene. To recall, you walk the route again and the scenes are waiting.'),
    h('p', null,
      'It works because places are what human memory is best at. You do not have to try to remember where the kitchen is. Attach a character to the kitchen with a scene that is strange, loud, funny, or moving, and the character comes back with the kitchen.'),
    h('h3', null, 'How people use it for hanzi'),
    h('ul', null,
      h('li', null, h('b', null, 'Pick a place.'), ' Real or fictional, as long as you can walk it in your head without effort.'),
      h('li', null, h('b', null, 'One character, one spot.'), ' Put the character at a stop on your route. Build a scene there from its pieces: 好 is a woman and a child at your front door.'),
      h('li', null, h('b', null, 'Give the sound a body.'), ' Many people turn each pinyin syllable, or each initial and final, into a recurring person or object, and each tone into a mood or light. Some do not. Both work.'),
      h('li', null, h('b', null, 'Words are scenes cut together.'), ' 出租车 is the scenes for 出, 租, and 车 meeting. That is why this app asks for the characters first.'),
      h('li', null, h('b', null, 'Write it down.'), ' A paragraph per item. Reread it on review until you no longer need to.'),
    ),
    h('h3', null, 'Watch before you start'),
    h('ul', { class: 'watch' }, WATCH.map((v) =>
      h('li', { key: v.href },
        h('a', { href: v.href, target: '_blank', rel: 'noopener' }, v.title),
        h('span', { class: 'small mute' }, ' · ', v.who),
        h('p', { class: 'small mute' }, v.note),
      ),
    )),
    h('h3', null, 'How this app fits'),
    h('ol', { class: 'small' },
      h('li', null, 'Each HSK level is ordered by how often its characters appear in modern Chinese, so the first rooms hold the characters you will meet most.'),
      h('li', null, 'A word is offered only after each of its characters has a paragraph.'),
      h('li', null, 'Write as many paragraphs in a day as you like. Each one enters review as soon as it is saved.'),
      h('li', null, 'Review shows the hanzi first. Walk to its spot, recall, reveal, rate. FSRS-5 picks the next date.'),
      h('li', null, 'Everything stays in a local SQLite file on this machine.'),
    ),
    h('div', { class: 'row' },
      first && h('button', { onClick: () => { setFocus(first.hz); go('edit') } }, 'Write the first paragraph: ' + showHz(first.hz, script)),
      h('button', { class: 'ghost', onClick: () => go('write') }, 'See the order'),
      h('button', { class: 'ghost', onClick: () => go('home') }, 'Skip to the desk'),
    ),
  )
}

function Home({ state, go, setState, setFocus }) {
  const script = useContext(ScriptCtx)
  const today = unixDay()
  const c = counts(state, today)
  const next = nextToWrite(state, 1)[0]
  return h('div', null,
    h('p', { class: 'mute' },
      'One paragraph per character, then per word, in frequency order. Review only what you have written. Progress lives in a local SQLite file on this machine. No account.'),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', null, c.due), h('span', null, 'due')),
      h('div', { class: 'stat' }, h('b', null, c.written), h('span', null, 'in the palace')),
      h('div', { class: 'stat' }, h('b', null, c.left), h('span', null, 'still to write')),
    ),
    h('div', { class: 'row' },
      h('button', { onClick: () => go('review'), disabled: c.due === 0 }, c.due ? 'Start review' : 'Caught up'),
      next
        ? h('button', { class: 'ghost', onClick: () => { setFocus(next.hz); go('edit') } }, 'Write next: ' + showHz(next.hz, script))
        : h('button', { class: 'ghost', onClick: () => go('write') }, 'Write'),
    ),
    h('p', { class: 'small mute' }, 'Lists stack. HSK 1 is on.'),
    h(LevelToggles, { state, setState }),
    h('p', { class: 'small mute' }, h('a', { href: '#', onClick: (e) => { e.preventDefault(); go('welcome') } }, 'What a memory palace is, and videos to follow along')),
    h('h2', null, 'How it works'),
    h('ol', { class: 'small' },
      h('li', null, 'Each HSK level is ordered by how often its characters appear in modern Chinese.'),
      h('li', null, 'A word of two or more characters is offered only after each of its characters has a paragraph. 出, 租, 车, then 出租车.'),
      h('li', null, 'Write a paragraph for each one. Method is yours: a room in your palace, a scene, a pun, a story. The app stores the text and nothing else.'),
      h('li', null, 'The moment a paragraph is saved the item enters review. Write as many in a day as you like.'),
      h('li', null, 'Review shows the hanzi first. Recall, reveal, reread your paragraph, rate. FSRS-5 sets the next date.'),
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
    onClick: (e) => { e.stopPropagation(); toggle() },
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() }
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

/** Plain reference: radical and pieces. No method attached. */
function GlyphTip({ hz, state, go, setFocus }) {
  const script = useContext(ScriptCtx)
  const shown = showHz(hz, script)
  const hint = hintFor(hz)
  const item = itemFor(hz)
  const pieces = hint ? hint.parts.map((p) => `${p.glyph} ${p.name}`) : piecesOf(hz).filter((p) => p !== hz).map((p) => {
    const info = catalog(p)
    return info ? `${info.glyph || p} ${info.name}` : p
  })
  const story = state ? storyOf(state, hz) : ''
  if (!pieces.length && !item) return shown
  return h(PopTip, { label: shown, aria: `${shown}, ${pieces.length} pieces`, width: 320 },
    h('div', { class: 'rad-row' },
      h('b', null, shown),
      item && h('span', { class: 'small mute' }, item.py, item.en ? ' · ' + item.en : ''),
    ),
    pieces.length ? h('p', { class: 'small mute' }, 'Pieces: ', pieces.join(' · ')) : null,
    story
      ? h('p', { class: 'small story-quote' }, story)
      : item && h('p', { class: 'small mute' }, 'No paragraph yet.'),
    item && go && h('button', {
      type: 'button', class: 'ghost',
      onClick: (e) => { e.stopPropagation(); setFocus(hz); go('edit') },
    }, story ? 'Edit paragraph' : 'Write paragraph'),
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
      setWarn(r.hasZh === false ? 'No Mandarin voice on this device.' : '')
    },
  }, 'Hear', warn ? h('span', { class: 'small mute' }, ' · ', warn) : null)
}

function HanziWord({ item, state, go, setFocus }) {
  return h('div', { class: 'hanzi' },
    [...item.hz].map((ch, i) => h(GlyphTip, { key: i + ch, hz: ch, state, go, setFocus })),
  )
}

function StoryEditor({ item, value, onChange, state }) {
  const script = useContext(ScriptCtx)
  const parts = item.kind === 'word'
    ? item.parts.map((ch) => ({ ch, story: storyOf(state, ch) }))
    : []
  return h('div', { class: 'shot' },
    parts.length ? h('div', { class: 'small mute parts' },
      h('p', null, 'Your paragraphs for each character, for reference:'),
      parts.map((p) => h('details', { key: p.ch },
        h('summary', null, h('span', { class: 'hz' }, showHz(p.ch, script)), ' ', (itemFor(p.ch) || {}).py || ''),
        h('p', { class: 'story-quote' }, p.story || '—'),
      )),
    ) : null,
    h('textarea', {
      class: 'story',
      placeholder: item.kind === 'word'
        ? `How ${showHz(item.hz, script)} sits in your palace as one thing…`
        : `Where ${showHz(item.hz, script)} lives in your palace, and what happens there…`,
      value,
      rows: 7,
      onInput: (e) => onChange(e.target.value),
    }),
  )
}

function Review({ state, setState, saveError, go, setFocus }) {
  const today = unixDay()
  const [queue, setQueue] = useState(() => dueList(state, today))
  const [show, setShow] = useState(false)
  const [draft, setDraft] = useState('')

  const hz = queue[0]
  const item = hz == null ? null : itemFor(hz)

  useEffect(() => {
    if (hz == null) return
    setDraft(storyOf(state, hz))
    setShow(false)
  }, [hz])

  function rate(g) {
    if (hz == null) return
    const prev = { ...newCard(), ...(state.c[hz] || {}) }
    const nextCard = review(prev, g, today)
    nextCard.p = draft.trim() ? draft : prev.p
    const nextState = { ...state, c: { ...state.c, [hz]: nextCard } }
    setState(nextState)
    const rest = queue.slice(1)
    if (nextCard.due <= today) rest.push(hz)
    setQueue(rest)
    setDraft('')
    setShow(false)
  }

  if (!item) {
    return h('div', null,
      h('p', null, 'Nothing due. Write the next paragraph, or come back tomorrow.'),
      h('button', { class: 'ghost', onClick: () => go('write') }, 'Write'),
    )
  }

  return h('div', null,
    h('p', { class: 'small mute' }, `${queue.length} in this pile · ${item.kind === 'word' ? 'word' : 'character'} · HSK ${item.lv}`),
    h(HanziWord, { item, state, go, setFocus }),
    !show && h('div', { class: 'row' },
      h('button', { onClick: () => setShow(true) }, 'Reveal'),
    ),
    show && h('div', null,
      h('p', { class: 'py' }, item.py, '  ', h(Hear, { text: item.hz, label: item.py })),
      h('p', { class: 'mean' }, item.en),
      h(StoryEditor, { item, value: draft, onChange: setDraft, state }),
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

function Write({ state, setState, go, setFocus }) {
  const script = useContext(ScriptCtx)
  const [q, setQ] = useState('')
  const [mode, setMode] = useState('next')
  const needle = q.trim().toLowerCase()
  const pool = useMemo(() => itemsIn(state), [state.lv])
  function match(it) {
    if (!needle) return true
    return it.hz.includes(needle) || showHz(it.hz, 't').includes(needle) || it.py.toLowerCase().includes(needle) || (it.en || '').toLowerCase().includes(needle)
  }
  const next = useMemo(() => nextToWrite(state, 40), [state])
  const todo = useMemo(() => unwritten(state).filter(match), [state, needle])
  const done = useMemo(() => written(state).filter(match), [state, needle])

  function row(it) {
    const locked = !unlocked(state, it)
    const has = hasStory(state, it.hz)
    return h('li', {
      key: it.hz,
      class: locked ? 'locked' : '',
      onClick: () => { if (!locked) { setFocus(it.hz); go('edit') } },
    },
      h('span', null, h('span', { class: 'hz' }, showHz(it.hz, script)), '  ', it.py, it.en ? h('span', { class: 'mute small' }, '  ', it.en) : null),
      h('span', { class: 'mute small' },
        'HSK ' + it.lv + ' · ' + (it.kind === 'word' ? 'word' : 'char') + ' · ' +
        (has ? 'written' : locked ? 'after ' + it.parts.filter((ch) => !hasStory(state, ch)).map((ch) => showHz(ch, script)).join(' ') : 'next'),
      ),
    )
  }

  return h('div', null,
    h('p', { class: 'mute small' },
      'Palace order: each level by character frequency, words after their characters. Pick the next one, or jump ahead to any unlocked item.'),
    h('div', { class: 'row' },
      h('button', { class: mode === 'next' ? '' : 'ghost', onClick: () => setMode('next') }, 'Next up'),
      h('button', { class: mode === 'all' ? '' : 'ghost', onClick: () => setMode('all') }, 'Everything left'),
      h('button', { class: mode === 'done' ? '' : 'ghost', onClick: () => setMode('done') }, 'Written'),
    ),
    h(LevelToggles, { state, setState }),
    mode !== 'next' && h('input', {
      type: 'search', placeholder: 'Filter hanzi / pinyin / English', value: q,
      style: { width: '100%', padding: '0.6rem', font: 'inherit', border: '1px solid var(--line)' },
      onInput: (e) => setQ(e.target.value),
    }),
    mode === 'next' && h('div', null,
      h('p', { class: 'small mute' }, next.length ? `${todo.length} left in the added lists. First ${next.length} in order:` : 'Every added list is written. Add a list above.'),
      h('ul', { class: 'list' }, next.map(row)),
    ),
    mode === 'all' && h('div', null,
      h('p', { class: 'small mute' }, todo.length, ' left'),
      h('ul', { class: 'list' }, todo.slice(0, 200).map(row)),
      todo.length > 200 && h('p', { class: 'small mute' }, '…', todo.length - 200, ' more. Search to narrow.'),
    ),
    mode === 'done' && h('div', null,
      h('p', { class: 'small mute' }, done.length, ' in the palace'),
      h('ul', { class: 'list' }, done.map(row)),
    ),
  )
}

function Edit({ hz, state, setState, go, setFocus }) {
  const script = useContext(ScriptCtx)
  const item = itemFor(hz)
  const [draft, setDraft] = useState(() => storyOf(state, hz))
  useEffect(() => { setDraft(storyOf(state, hz)) }, [hz])
  if (!item) return h('p', null, 'Missing item')
  const locked = !unlocked(state, item)
  const had = hasStory(state, hz)
  const after = nextToWrite({ ...state, c: { ...state.c, [hz]: { ...(state.c[hz] || {}), p: draft || 'x' } } }, 1)[0]

  function persist(thenNext) {
    const text = draft.trim() ? draft : ''
    const prev = state.c[hz] || null
    const c = { ...state.c }
    if (!text) {
      if (prev) {
        const copy = { ...prev }
        delete copy.p
        if (copy.reps) c[hz] = copy
        else delete c[hz]
      }
    } else {
      // A first paragraph starts the card today so it enters review at once.
      c[hz] = { ...(prev && prev.reps ? prev : newCard()), p: text }
    }
    setState({ ...state, c })
    if (thenNext && after && after.hz !== hz) { setFocus(after.hz); go('edit') }
    else go('write')
  }

  return h('div', null,
    h('button', { class: 'ghost', onClick: () => go('write') }, '← Write'),
    h(HanziWord, { item, state, go, setFocus }),
    h('p', { class: 'py' }, item.py, '  ', h(Hear, { text: item.hz, label: item.py })),
    h('p', { class: 'mean' }, item.en),
    h('p', { class: 'small mute', style: { textAlign: 'center' } },
      (item.kind === 'word' ? 'Word' : 'Character') + ' · HSK ' + item.lv +
      (item.kind === 'char' && item.words.length ? ' · in ' + item.words.slice(0, 6).map((w) => showHz(w, script)).join(' ') : '')),
    locked && h('p', { class: 'warn' },
      'Write its characters first: ', item.parts.filter((ch) => !hasStory(state, ch)).map((ch) => showHz(ch, script)).join(' ')),
    h(StoryEditor, { item, value: draft, onChange: setDraft, state }),
    h('div', { class: 'row' },
      h('button', { onClick: () => persist(false), disabled: locked }, had ? 'Save' : 'Save · enters review'),
      after && after.hz !== hz && h('button', { class: 'ghost', onClick: () => persist(true), disabled: locked }, 'Save & next: ' + showHz(after.hz, script)),
    ),
  )
}

function Data({ state, setState, dbPath }) {
  const fileRef = useRef(null)
  const payload = JSON.stringify(exportPayload(state), null, 2)
  function download() {
    const blob = new Blob([payload], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'hanzi-palace.json'
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
    h('h2', null, 'Local database'),
    h('p', { class: 'small' },
      'SQLite on this machine',
      dbPath ? [': ', h('code', null, dbPath)] : '.',
      ' 简/繁, scheduling, and every paragraph live here. No account, no upload.'),
    h('p', { class: 'small mute' },
      'Export is a portable JSON snapshot. An export from the old shot-list desk imports too; its shots become paragraphs.'),
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
      if (!Object.keys(r.state.c || {}).length) setPage('welcome')
    }).catch((err) => {
      if (!live) return
      setStateRaw(emptyState())
      setSaveError(err.message || 'Could not open the local database.')
    })
    return () => { live = false }
  }, [])

  const setState = useCallback((next) => {
    setStateRaw(next)
    writeState(next).then(() => setSaveError(null)).catch((err) => {
      setSaveError(err.message || 'Could not save to the local database.')
    })
  }, [])

  const script = state && state.script === 't' ? 't' : 's'
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = script === 't' ? 'zh-Hant' : 'zh-Hans'
  }, [script])

  if (!state) return h('p', { class: 'mute' }, 'Opening local database…')

  const fresh = !Object.keys(state.c).length
  const setScript = (next) => setState({ ...state, script: next })
  const go = (p) => { setPage(p); if (typeof window !== 'undefined') window.scrollTo(0, 0) }

  return h(ScriptCtx.Provider, { value: script },
    h('div', null,
      h(Nav, { page, go, script, setScript, fresh }),
      saveError && page !== 'review' && h('p', { class: 'warn' }, saveError),
      page === 'welcome' && h(Welcome, { state, go, setFocus }),
      page === 'home' && h(Home, { state, go, setState, setFocus }),
      page === 'review' && h(Review, { state, setState, saveError, go, setFocus }),
      page === 'write' && h(Write, { state, setState, go, setFocus }),
      page === 'edit' && h(Edit, { hz: focus, state, setState, go, setFocus }),
      page === 'data' && h(Data, { state, setState, dbPath }),
      h('footer', { class: 'legal' },
        `Dataset: HSK 2.0 (2012), ${ITEMS.length} characters and words. Frequency: Jun Da, MTSU. Scheduler: FSRS-5. Local SQLite on this machine.`),
    ),
  )
}

render(h(App), document.getElementById('app'))
