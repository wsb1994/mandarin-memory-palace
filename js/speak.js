/** Device Mandarin TTS. No key, no quota, no network. Speak hanzi, not pinyin. */

export function speechOk() {
  return typeof speechSynthesis !== 'undefined'
}

export function pickVoice(voices, lang) {
  const list = voices || []
  const want = (lang || 'zh-CN').toLowerCase().replace('_', '-')
  const family = want.slice(0, 2)
  const score = (v) => {
    const l = String(v.lang || '').toLowerCase().replace('_', '-')
    const n = String(v.name || '')
    let s = 0
    if (l === want) s += 8
    else if (l.startsWith(want)) s += 6
    else if (l.startsWith(family)) s += 3
    if (/chinese|mandarin|中文|普通话|國語|国语|漢語|汉语/i.test(n)) s += 4
    if (want === 'zh-cn' && /china|prc|cmn-hans/i.test(n + l)) s += 2
    if (want === 'zh-tw' && /taiwan|hant|國語/i.test(n + l)) s += 2
    return s
  }
  let best = null
  let bestS = 0
  for (const v of list) {
    const s = score(v)
    if (s > bestS) {
      best = v
      bestS = s
    }
  }
  return bestS >= 3 ? best : null
}

export function hasMandarin(voices) {
  return !!(voices || []).some((v) => {
    const l = String(v.lang || '').toLowerCase()
    const n = String(v.name || '')
    return l.startsWith('zh') || /chinese|mandarin|中文|普通话|國語|国语/i.test(n)
  })
}

let cached = null
function voicesNow() {
  if (typeof speechSynthesis === 'undefined') return []
  const v = speechSynthesis.getVoices() || []
  if (v.length) cached = v
  return v.length ? v : (cached || [])
}

if (typeof speechSynthesis !== 'undefined' && speechSynthesis.addEventListener) {
  speechSynthesis.addEventListener('voiceschanged', () => { cached = speechSynthesis.getVoices() || [] })
}

export function speakZh(text, script) {
  const str = String(text || '').trim()
  if (!str) return { ok: false, why: 'empty' }
  if (typeof speechSynthesis === 'undefined') return { ok: false, why: 'no-speech' }
  const lang = script === 't' ? 'zh-TW' : 'zh-CN'
  const voices = voicesNow()
  const voice = pickVoice(voices, lang)
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(str)
  u.lang = voice ? voice.lang : lang
  u.rate = 0.88
  if (voice) u.voice = voice
  speechSynthesis.speak(u)
  return { ok: true, lang, voice: voice && voice.name, hasZh: hasMandarin(voices) }
}
