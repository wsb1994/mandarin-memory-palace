import { review, nextInterval, retrievability, newCard, Rating, State, DEFAULT_W } from '../js/fsrs.js'
import { HSK1, COUNT, WORDS, LEVEL_META, parseSyl, toneMark, showHz, addedWords, enabledSet, extraIds } from '../js/hsk1.js'
import { shotBrief, whyLead, whyLocation, whyTone, LOCATIONS, LEADS, LEAD_GROUPS, splitParts } from '../js/shots.js'
import { CHAR_RS, RADICALS, hintFor, defaultObjects, piecesOf } from '../js/radicals.js'
import { emptyState, parseImport, exportPayload, normalizeState, cookieHasProgress } from '../js/store.js'
import { pickVoice, hasMandarin, speakZh, speechOk } from '../js/speak.js'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

assert(HSK1.length === 150, `expected 150 HSK1 rows, got ${HSK1.length}`)
assert(COUNT > 4000, `expected HSK 1–6 pool, got ${COUNT}`)
assert(HSK1[0].hz === '爱', 'first word')
assert(HSK1[149].hz === '坐', 'last HSK1')
assert(WORDS[149].hz === '坐' && WORDS[150].lv === 2, 'level 2 follows')
assert(enabledSet({ lv: [1, 2] }).has(2), 'enabledSet reads state')
assert(addedWords({ lv: [1] }).length === 150, 'default queue is HSK 1')
assert(addedWords({ lv: [1, 2] }).every((w) => w.lv === 1 || w.lv === 2), 'additive levels')
assert(addedWords({ lv: [1, 2] }).length > 150, 'HSK 2 stacks')
{
  const w = WORDS.find((row) => row.lv === 3)
  const extra = extraIds({ lv: [1], x: [w.id] })
  assert(extra.includes(w.id), 'extra word')
  assert(addedWords({ lv: [1], x: [w.id] }).some((row) => row.id === w.id), 'extra in queue')
  assert(!extraIds({ lv: [1, 3], x: [w.id] }).includes(w.id), 'full list swallows extra')
}
for (const m of LEVEL_META) {
  const n = WORDS.filter((w) => w.lv === m.lv).length
  assert(n === m.n, `LEVEL_META ${m.lv} ${m.n} vs ${n}`)
}
for (const w of WORDS) {
  for (const s of w.syl) {
    const p = splitParts(s.init, s.fin)
    if (!Object.prototype.hasOwnProperty.call(LEADS, p.lead)) throw new Error('bad lead ' + w.hz + ' ' + JSON.stringify(p) + ' ' + s.init + '/' + s.fin)
    if (!Object.prototype.hasOwnProperty.call(LOCATIONS, p.loc)) throw new Error('bad location ' + w.hz + ' ' + JSON.stringify(p))
  }
}
assert(toneMark('ai4') === 'ài', toneMark('ai4'))
assert(parseSyl('nv3').fin === 'ü', JSON.stringify(parseSyl('nv3')))
assert(parseSyl('na3r').fin === 'ar', JSON.stringify(parseSyl('na3r')))
assert(parseSyl('zhong1').init === 'zh', JSON.stringify(parseSyl('zhong1')))
assert(Object.keys(LEADS).length === 55, '55 leads')
assert(Object.keys(LOCATIONS).length === 13, '13 locations')
assert(LEAD_GROUPS.male.length + LEAD_GROUPS.female.length + LEAD_GROUPS.fiction.length + LEAD_GROUPS.animal.length === 55, 'groups')
assert(shotBrief(parseSyl('shi4')).fin === '', 'no location for shi')
assert(shotBrief(parseSyl('shi4')).init === 'sh', 'shi lead sh')
assert(splitParts('p', 'ing').lead === 'pi' && splitParts('p', 'ing').loc === 'eng', JSON.stringify(splitParts('p', 'ing')))
assert(splitParts('j', 'ing').lead === 'ji' && splitParts('j', 'ing').loc === 'eng', 'jing')
assert(splitParts('q', 'ü').lead === 'qu' && splitParts('q', 'ü').loc === '', 'qu')
assert(splitParts('n', 'ü').lead === 'nü', 'nü')
assert(splitParts('y', 'ü').lead === 'yu', 'yu')
assert(splitParts('w', 'o').lead === 'wu' && splitParts('w', 'o').loc === 'o', 'wo')
assert(splitParts('l', 'i').lead === 'li' && splitParts('l', 'i').loc === '', 'li')
assert(LOCATIONS[''] && LOCATIONS[''].length > 0, 'empty location exists')
for (const w of HSK1) {
  for (const s of w.syl) {
    const p = splitParts(s.init, s.fin)
    if (!Object.prototype.hasOwnProperty.call(LEADS, p.lead)) throw new Error('bad lead ' + w.hz + ' ' + JSON.stringify(p) + ' ' + s.init + '/' + s.fin)
    if (!Object.prototype.hasOwnProperty.call(LOCATIONS, p.loc)) throw new Error('bad location ' + w.hz + ' ' + JSON.stringify(p))
  }
}

const apple = HSK1.find((w) => w.hz === '苹果')
assert(apple && apple.syl.length === 2, 'apple syllables')
assert(shotBrief(apple.syl[0]).lead === 'Polly', shotBrief(apple.syl[0]).lead)
assert(shotBrief(apple.syl[0], { a: { pi: 'Pilot' } }).lead === 'Pilot', 'lead override')
assert(whyLead('p').includes('trade'), 'why lead')
assert(whyLocation('an').includes('an'), 'why location')
assert(whyTone(4).includes('4'), 'why tone')
assert(hintFor('爱').why.includes('claw'), 'why radical')
assert(hintFor('爱', { p: { 爪: 'a crane hook' } }).objects[0] === 'a crane hook', 'object override')
const mapped = parseImport(JSON.stringify(exportPayload({ ...emptyState(), maps: { a: { b: 'Butcher' } } })))
assert(mapped.maps && mapped.maps.a.b === 'Butcher', 'import maps')

const n = newCard()
const again = review(n, Rating.Again, 100)
assert(again.st === State.Learning, 'again stays learning')
assert(again.due === 100, 'again due today')
assert(again.reps === 1, 'reps')

const good = review(newCard(), Rating.Good, 100)
assert(good.st === State.Review, 'good is review')
assert(good.due > 100, 'good schedules future')
assert(good.s > 0 && good.d >= 1, 'stability/difficulty')

const later = review(good, Rating.Good, good.due)
assert(later.s >= good.s, `stability should not drop on good recall: ${later.s} vs ${good.s}`)
assert(nextInterval(later.s) >= 1, 'interval')
assert(retrievability(0, 2) === 1, 'r at 0')

const payload = exportPayload(emptyState())
assert(payload.dataset === 'hsk2.0', 'export dataset')
const round = parseImport(JSON.stringify(payload))
assert(round.v === 1 && round.newCap === 7, 'import')

const seen = new Set(HSK1.map((w) => w.hz))
assert(seen.size === 150, 'unique hanzi words')

const glyphs = new Set()
for (const w of HSK1) {
  for (const ch of [...w.hz]) glyphs.add(ch)
  for (const s of w.syl) {
    assert(s.hint && s.hint.rad && s.hint.objects.length >= 2, `hint for ${s.hz}`)
    assert(s.hint.parts && s.hint.parts.length >= 1, `parts for ${s.hz}`)
    for (const p of s.hint.parts) {
      assert(p.objects && p.objects.length >= 1, `objects ${s.hz} ${p.ch}`)
    }
    assert(s.hint === hintFor(s.hz) || s.hint.rad === hintFor(s.hz).rad, 'hint lookup')
  }
}
assert(glyphs.size === Object.keys(CHAR_RS).length, `CHAR_RS ${Object.keys(CHAR_RS).length} vs glyphs ${glyphs.size}`)
for (const ch of glyphs) {
  assert(CHAR_RS[ch], `missing radical for ${ch}`)
  assert(RADICALS[CHAR_RS[ch]], `missing objects for radical of ${ch}`)
}
assert(hintFor('爱').rad === '爪' && hintFor('爱').name === 'claw', '爱 radical')
assert(hintFor('爱').parts.length >= 3, '爱 pieces')
assert(hintFor('爱').parts.some((p) => p.ch === '友' || p.glyph === '友'), '爱 has 友')
assert(hintFor('请').parts.some((p) => p.role === 'sound' && (p.ch === '青' || p.name === 'green')), '请 sound 青')
assert(hintFor('妈').parts.some((p) => p.ch === '马' || p.name === 'horse'), '妈 has 马')
assert(defaultObjects('亻').length >= 2, 'alias 亻')
assert(hintFor('苹果'.slice(0, 1)).glyph === '艹', 'grass head display')
assert(piecesOf('妈').includes('女'), '妈 has 女')
assert(piecesOf('她').includes('女'), '她 has 女')
assert(piecesOf('好').includes('女'), '好 has 女')
const nvGlyphs = new Set()
for (const w of HSK1) {
  for (const ch of [...w.hz]) {
    if (piecesOf(ch).includes('女')) nvGlyphs.add(ch)
  }
}
assert(nvGlyphs.has('女') && nvGlyphs.has('妈') && nvGlyphs.has('姐'), '女 family')
assert(nvGlyphs.size >= 5, '女 family size')

assert(showHz('爱', 's') === '爱', 'simp 爱')
assert(showHz('爱', 't') === '愛', 'trad 爱')
assert(showHz('分钟', 't') === '分鐘', '分钟')
assert(showHz('没关系', 't') === '沒關係', '没关系')
assert(showHz('后面', 't') === '後面', '后面')
assert(showHz('什么', 't') === '什麼', '什么')
assert(showHz('苹果', 't') === '蘋果', '苹果')
assert(showHz('坐', 't') === '坐', 'unchanged')
const tradRound = parseImport(JSON.stringify(exportPayload({ ...emptyState(), script: 't' })))
assert(tradRound.script === 't', 'import script')
assert(exportPayload(emptyState()).storage === 'sqlite', 'export storage')
{
  const n = normalizeState({ v: 1, c: { 0: { reps: 1 } }, script: 't', lv: [1, 2] })
  assert(n.script === 't' && n.lv[1] === 2 && n.c[0].reps === 1, 'normalize')
  assert(cookieHasProgress(n), 'progress from cards')
  assert(cookieHasProgress({ ...emptyState(), script: 't' }), 'progress from 繁')
  assert(!cookieHasProgress(emptyState()), 'empty is not progress')
}

assert(!speechOk(), 'node has no speechSynthesis')
assert(speakZh('爱').why === 'no-speech', 'speak no-op in node')
{
  const voices = [
    { lang: 'en-US', name: 'Samantha' },
    { lang: 'zh-CN', name: 'Tingting' },
    { lang: 'zh-TW', name: 'Meijia' },
  ]
  assert(pickVoice(voices, 'zh-CN').name === 'Tingting', 'pick zh-CN')
  assert(pickVoice(voices, 'zh-TW').name === 'Meijia', 'pick zh-TW')
  assert(!pickVoice([{ lang: 'en-US', name: 'Alex' }], 'zh-CN'), 'no english fallback')
  assert(hasMandarin(voices) && !hasMandarin([{ lang: 'en-US', name: 'Alex' }]), 'hasMandarin')
}

console.log('ok', COUNT, 'words;', glyphs.size, 'glyphs;', Object.keys(RADICALS).length, 'radicals; FSRS good interval', later.due - good.due, 'days')
