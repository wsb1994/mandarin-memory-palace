/** HSK 2.0 (2012) word lists, levels 1–6. Pinyin is numbered, syllables spaced. */

import { hintFor } from './radicals.js'
import { RAW_BY_LEVEL, LEVEL_META } from './hsk-lists.js'

const MARKS = [
  {},
  { a: 'ā', e: 'ē', i: 'ī', o: 'ō', u: 'ū', ü: 'ǖ', v: 'ǖ' },
  { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', ü: 'ǘ', v: 'ǘ' },
  { a: 'ǎ', e: 'ě', i: 'ǐ', o: 'ǒ', u: 'ǔ', ü: 'ǚ', v: 'ǚ' },
  { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù', ü: 'ǜ', v: 'ǜ' },
  { a: 'a', e: 'e', i: 'i', o: 'o', u: 'u', ü: 'ü', v: 'ü' },
]

export function toneMark(numPinyin) {
  const m = numPinyin.match(/^([a-züv:]+)([1-5])(r?)$/i)
  if (!m) return numPinyin.replace('v', 'ü')
  let core = m[1].toLowerCase().replace('u:', 'ü').replace('v', 'ü')
  const tone = +m[2]
  const er = m[3]
  if (tone === 5) return core + er
  const vowels = [...core]
  let idx = vowels.findIndex((ch) => ch === 'a' || ch === 'e')
  if (idx < 0) idx = core.indexOf('ou')
  if (idx < 0) {
    for (let i = vowels.length - 1; i >= 0; i--) {
      if ('iouü'.includes(vowels[i])) {
        idx = i
        break
      }
    }
  }
  if (idx >= 0) {
    const ch = vowels[idx]
    vowels[idx] = MARKS[tone][ch] || ch
  }
  return vowels.join('') + er
}

const INIT_RE = /^(zh|ch|sh|[bpmfdtnlgkhjqxzcsryw])?/

export function parseSyl(num) {
  num = String(num).toLowerCase()
  const erhua = /r$/.test(num.replace(/[1-5]$/, '')) || /[1-5]r$/.test(num)
  const toneMatch = num.match(/([1-5])r?$/)
  const tone = toneMatch ? +toneMatch[1] : 5
  const body = num.replace(/[1-5]r?$/, '').replace(/r$/, '')
  const init = (body.match(INIT_RE) || [''])[0] || ''
  let fin = body.slice(init.length).replace('v', 'ü').replace('u:', 'ü')
  if ((init === 'j' || init === 'q' || init === 'x' || init === 'y') && (fin === 'u' || fin === 'ue' || fin === 'uan' || fin === 'un')) {
    fin = 'ü' + fin.slice(1)
  }
  if (erhua && !fin.endsWith('r') && num.includes('r')) fin += 'r'
  return { raw: num, init, fin, tone, display: toneMark(num.replace('v', 'ü')) }
}

function parseLevel(raw, lv, id0) {
  const rows = raw.trim().split('\n')
  return rows.map((line, i) => {
    const [hz, py, en] = line.split('\t')
    const parts = py.trim().split(/\s+/)
    const chars = [...hz]
    const syl = parts.map((p, j) => {
      const parsed = parseSyl(p)
      parsed.hz = chars[j] || chars[chars.length - 1]
      parsed.hint = hintFor(parsed.hz)
      return parsed
    })
    return {
      id: id0 + i,
      lv,
      hz,
      py: parts.map((p) => toneMark(p.replace('v', 'ü'))).join(' '),
      pyNum: parts,
      en,
      syl,
    }
  })
}

function parseAll() {
  const out = []
  for (const lv of [1, 2, 3, 4, 5, 6]) {
    const raw = RAW_BY_LEVEL[lv]
    if (!raw) continue
    out.push(...parseLevel(raw, lv, out.length))
  }
  return out
}

export const WORDS = parseAll()
export const HSK1 = WORDS.filter((w) => w.lv === 1)
export const COUNT = WORDS.length
export { LEVEL_META }

export function enabledSet(lv) {
  const src = Array.isArray(lv) ? lv : (lv && lv.lv)
  const s = new Set((src && src.length) ? [...src].map(Number).filter((n) => n >= 1 && n <= 6) : [1])
  if (!s.size) s.add(1)
  return s
}

export function extraIds(state) {
  const s = enabledSet(state && state.lv)
  const x = Array.isArray(state && state.x) ? state.x : []
  return [...new Set(x.map(Number))].filter((id) => {
    const w = WORDS[id]
    return w && !s.has(w.lv)
  })
}

export function addedWords(state) {
  const s = enabledSet(state && state.lv)
  const extra = new Set(extraIds(state))
  return WORDS.filter((w) => s.has(w.lv) || extra.has(w.id))
}

export function isAdded(state, w) {
  if (!w) return false
  if (enabledSet(state && state.lv).has(w.lv)) return true
  return extraIds(state).includes(w.id)
}

/** OpenCC STCharacters (Apache-2.0), first form, with HSK 1 sense overrides (钟→鐘, 系→係). */
const S2T = {
  东: '東', 个: '個', 么: '麼', 习: '習', 书: '書', 买: '買', 们: '們', 会: '會', 儿: '兒', 关: '關',
  兴: '興', 写: '寫', 几: '幾', 医: '醫', 号: '號', 后: '後', 吗: '嗎', 听: '聽', 国: '國', 块: '塊',
  妈: '媽', 学: '學', 对: '對', 岁: '歲', 师: '師', 开: '開', 时: '時', 机: '機', 来: '來', 样: '樣',
  欢: '歡', 气: '氣', 汉: '漢', 没: '沒', 点: '點', 热: '熱', 爱: '愛', 猫: '貓', 现: '現', 电: '電',
  脑: '腦', 苹: '蘋', 见: '見', 视: '視', 觉: '覺', 认: '認', 识: '識', 话: '話', 语: '語', 说: '說',
  请: '請', 读: '讀', 谁: '誰', 谢: '謝', 车: '車', 这: '這', 里: '裏', 钟: '鐘', 钱: '錢', 飞: '飛',
  饭: '飯', 系: '係',
}

export function showHz(str, script) {
  if (script !== 't' || !str) return str
  return [...str].map((ch) => S2T[ch] || ch).join('')
}
