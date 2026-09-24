import { review, nextInterval, retrievability, newCard, Rating, State } from '../js/fsrs.js'
import { HSK1, COUNT, WORDS, LEVEL_META, parseSyl, toneMark, showHz } from '../js/hsk1.js'
import { ITEMS, itemFor, rankOf, itemsIn, nextToWrite, unlocked, hasStory, written, unwritten } from '../js/palace.js'
import { FREQ_RANK } from '../js/freq.js'
import { hintFor, piecesOf } from '../js/radicals.js'
import { emptyState, parseImport, exportPayload, normalizeState, hasProgress } from '../js/store.js'
import { pickVoice, hasMandarin, speakZh, speechOk } from '../js/speak.js'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

assert(HSK1.length === 150, `expected 150 HSK1 rows, got ${HSK1.length}`)
assert(COUNT > 4000, `expected HSK 1–6 pool, got ${COUNT}`)
for (const m of LEVEL_META) {
  const n = WORDS.filter((w) => w.lv === m.lv).length
  assert(n === m.n, `LEVEL_META ${m.lv} ${m.n} vs ${n}`)
}
assert(toneMark('ai4') === 'ài', toneMark('ai4'))
assert(parseSyl('nv3').fin === 'ü', JSON.stringify(parseSyl('nv3')))

// ---- palace order ----
assert(Object.keys(FREQ_RANK).length > 2600, 'frequency table')
assert(FREQ_RANK['的'] === 1 && rankOf('的') === 1, '的 is rank 1')
assert(rankOf('啰') > 99999, 'unranked glyph sorts last')

const glyphs = new Set()
for (const w of WORDS) for (const ch of [...w.hz]) glyphs.add(ch)
const chars = ITEMS.filter((it) => it.kind === 'char')
const words = ITEMS.filter((it) => it.kind === 'word')
assert(chars.length === glyphs.size, `one item per glyph: ${chars.length} vs ${glyphs.size}`)
assert(words.length === WORDS.filter((w) => [...w.hz].length > 1).length, 'one item per multi-char word')
assert(new Set(ITEMS.map((it) => it.hz)).size === ITEMS.length, 'ids unique')

// every word comes after all of its characters
const pos = new Map(ITEMS.map((it) => [it.hz, it.n]))
for (const w of words) {
  for (const ch of w.parts) {
    assert(pos.has(ch), `char item for ${ch}`)
    assert(pos.get(ch) < w.n, `${w.hz} placed before its character ${ch}`)
  }
}
// levels are contiguous and ascending
let lastLv = 0
for (const it of ITEMS) {
  assert(it.lv >= lastLv, 'levels ascend')
  lastLv = it.lv
}
// within a level, characters are in frequency order
for (const m of LEVEL_META) {
  const lvChars = chars.filter((it) => it.lv === m.lv)
  for (let i = 1; i < lvChars.length; i++) {
    assert(rankOf(lvChars[i - 1].hz) <= rankOf(lvChars[i].hz), `frequency order broke at HSK ${m.lv} ${lvChars[i].hz}`)
  }
}
// a character new to level 3 never shows up as a level-1 item
for (const it of chars) {
  const firstLv = Math.min(...WORDS.filter((w) => w.hz.includes(it.hz)).map((w) => w.lv))
  assert(it.lv === firstLv, `${it.hz} should be HSK ${firstLv}, got ${it.lv}`)
}
const l1 = ITEMS.filter((it) => it.lv === 1)
assert(l1[0].hz === '的' || rankOf(l1[0].hz) <= rankOf('不'), `HSK 1 opens with a top character, got ${l1[0].hz}`)
const taxi = itemFor('出租车')
assert(taxi && taxi.kind === 'word' && taxi.parts.length === 3, 'taxi is a 3-char word')
for (const ch of ['出', '租', '车']) assert(itemFor(ch).kind === 'char' && itemFor(ch).n < taxi.n, `${ch} before 出租车`)
assert(itemFor('租').only && itemFor('租').en.includes('出租车'), 'component-only char borrows its word gloss')
assert(itemFor('租').py === 'zū', 'component-only char gets its syllable')
assert(itemFor('爸爸').parts.length === 1 && itemFor('爸爸').parts[0] === '爸', 'repeated char counted once')
assert(itemFor('不').kind === 'char' && itemFor('不').en === 'not', 'single-char word is the char item')
assert(itemFor('电').words.includes('电脑') && itemFor('电').words.includes('电视'), 'char lists its words')

// ---- gating ----
{
  const s = emptyState()
  assert(itemsIn(s).every((it) => it.lv === 1), 'default pool HSK 1')
  assert(!unlocked(s, taxi), 'taxi locked until parts written')
  const first = nextToWrite(s, 5)
  assert(first.length === 5 && first.every((it) => it.kind === 'char'), 'first picks are characters')
  assert(first[0].hz === l1[0].hz, 'next to write is the first palace item')
  s.c['出'] = { p: 'a gate' }
  s.c['租'] = { p: 'a rent sign' }
  assert(!unlocked(s, taxi), 'still locked on 车')
  s.c['车'] = { p: 'a cart' }
  assert(unlocked(s, taxi), 'unlocked once every character has a paragraph')
  assert(hasStory(s, '车') && !hasStory(s, '的'), 'hasStory')
  assert(written(s).length === 3 && unwritten(s).length === itemsIn(s).length - 3, 'written / unwritten')
  assert(!nextToWrite(s, 500).some((it) => hasStory(s, it.hz)), 'next skips written')
  assert(nextToWrite(s, 500).some((it) => it.hz === '出租车'), 'taxi now offered')
  const s2 = { ...s, lv: [1, 2] }
  assert(itemsIn(s2).length > itemsIn(s).length, 'levels stack')
}

// ---- state / migration ----
{
  const n = normalizeState({ v: 2, c: { 爱: { reps: 1, p: 'love in the hall' } }, script: 't', lv: [1, 2] })
  assert(n.script === 't' && n.lv[1] === 2 && n.c['爱'].p === 'love in the hall', 'normalize v2')
  assert(hasProgress(n) && !hasProgress(emptyState()), 'progress')
  const round = parseImport(JSON.stringify(exportPayload(n)))
  assert(round.v === 2 && round.c['爱'].reps === 1, 'export / import round trip')
  const v1 = { v: 1, newCap: 7, script: 's', lv: [1], x: [], c: { 0: { reps: 2, s: 3, due: 5, m: { s: ['claw over a friend'], k: '' } }, 11: { m: { s: ['a gate', 'a rent sign', 'a cart'], k: 'cut to a taxi' } } } }
  const m = normalizeState(v1)
  assert(m.v === 2 && m.c['爱'].p === 'claw over a friend' && m.c['爱'].reps === 2, 'v1 shot becomes paragraph keyed by hanzi')
  assert(m.c['出租车'].p.includes('cut to a taxi') && m.c['出租车'].p.includes('a rent sign'), 'v1 multi-shot joined')
  assert(!('newCap' in m) && !('x' in m) && !('maps' in m), 'v1 desk fields dropped')
  let threw = false
  try { normalizeState({ v: 3, c: {} }) } catch { threw = true }
  assert(threw, 'unknown version rejected')
}

// ---- fsrs ----
const n = newCard()
const again = review(n, Rating.Again, 100)
assert(again.st === State.Learning && again.due === 100 && again.reps === 1, 'again')
const good = review(newCard(), Rating.Good, 100)
assert(good.st === State.Review && good.due > 100 && good.s > 0 && good.d >= 1, 'good')
const later = review(good, Rating.Good, good.due)
assert(later.s >= good.s, 'stability should not drop on good recall')
assert(nextInterval(later.s) >= 1, 'interval')
assert(retrievability(0, 2) === 1, 'r at 0')

// ---- radicals still resolve for HSK 1 ----
for (const w of HSK1) for (const ch of [...w.hz]) {
  assert(hintFor(ch) && hintFor(ch).parts.length >= 1, `hint for ${ch}`)
}
assert(piecesOf('妈').includes('女'), '妈 has 女')

assert(showHz('爱', 't') === '愛' && showHz('没关系', 't') === '沒關係' && showHz('坐', 't') === '坐', 'showHz')

assert(!speechOk() && speakZh('爱').why === 'no-speech', 'speak no-op in node')
{
  const voices = [{ lang: 'en-US', name: 'Samantha' }, { lang: 'zh-CN', name: 'Tingting' }]
  assert(pickVoice(voices, 'zh-CN').name === 'Tingting' && hasMandarin(voices), 'voices')
}

console.log('ok', ITEMS.length, 'items:', chars.length, 'chars,', words.length, 'words; HSK1 opens', l1.slice(0, 8).map((i) => i.hz).join(''), '; FSRS good interval', later.due - good.due, 'days')
