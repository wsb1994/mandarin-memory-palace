/**
 * Shot-list mnemonic scaffolding (original wording and names).
 * 55 leads (a/e/o trades, i first names, u creatures, ü animals) and 13 locations.
 */

export const LEAD_GROUPS = {
  male: ['', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'z', 'c', 's', 'zh', 'ch', 'sh', 'r', 'g', 'k', 'h'],
  female: ['yi', 'bi', 'pi', 'mi', 'di', 'ti', 'ni', 'li', 'ji', 'qi', 'xi'],
  fiction: ['wu', 'bu', 'pu', 'mu', 'fu', 'du', 'tu', 'nu', 'lu', 'zu', 'cu', 'su', 'zhu', 'chu', 'shu', 'ru', 'gu', 'ku', 'hu'],
  animal: ['yu', 'nü', 'lü', 'ju', 'qu', 'xu'],
}

export const LEADS = {
  '': 'Echo',
  b: 'Baker', p: 'Painter', m: 'Magician', f: 'Farmer',
  d: 'Drummer', t: 'Tailor', n: 'Nurse', l: 'Librarian',
  z: 'Acrobat', c: 'Cyclist', s: 'Sailor',
  zh: 'Judge', ch: 'Chef', sh: 'Shepherd', r: 'Ranger',
  g: 'Guard', k: 'Cook', h: 'Hunter',
  yi: 'Iris', bi: 'Bonnie', pi: 'Polly', mi: 'Maisie',
  di: 'Dora', ti: 'Tess', ni: 'Nora', li: 'Lina',
  ji: 'Jessie', qi: 'Quinn', xi: 'Sylvie',
  wu: 'Wisp', bu: 'Bug', pu: 'Puppet', mu: 'Muse',
  fu: 'Fable', du: 'Dummy', tu: 'Troll', nu: 'Nymph',
  lu: 'Lumen', zu: 'Zombie', cu: 'Cyclops', su: 'Shade',
  zhu: 'Jester', chu: 'Chimera', shu: 'Specter', ru: 'Rook',
  gu: 'Golem', ku: 'Kobold', hu: 'Hound',
  yu: 'Yak', nü: 'Newt', lü: 'Lynx',
  ju: 'Jaguar', qu: 'Quail', xu: 'Shrew',
}

/** 13 locations: leftover coda after the lead takes the medial. */
export const LOCATIONS = {
  '': 'an empty backlot (no final left)',
  a: 'an open plaza',
  ai: 'a narrow alley',
  an: 'a sandstone canyon',
  ang: 'an aircraft hangar',
  ao: 'an opera house',
  e: 'a brick well courtyard',
  ei: 'a lakeside pier',
  en: 'a walled garden',
  eng: 'a mountain temple',
  o: 'a cargo dock',
  ong: 'a palace hall',
  ou: 'an old boathouse',
}

export const TONES = {
  1: { name: 'level', light: 'hard noon sun, everything sharp and still' },
  2: { name: 'rising', light: 'dawn wind lifting banners and dust' },
  3: { name: 'dip', light: 'dusk; shadows pool, then lift' },
  4: { name: 'fall', light: 'night storm; a strike, then dark' },
  5: { name: 'neutral', light: 'fog; edges soft, sound muffled' },
}

export const MAP_CAP = { a: 48, s: 64, t: 80, p: 96 }

const APICAL = { z: 1, c: 1, s: 1, zh: 1, ch: 1, sh: 1, r: 1 }
const I_INIT = { b: 1, p: 1, m: 1, d: 1, t: 1, n: 1, l: 1, j: 1, q: 1, x: 1 }
const U_INIT = {
  b: 1, p: 1, m: 1, f: 1, d: 1, t: 1, n: 1, l: 1,
  g: 1, k: 1, h: 1, z: 1, c: 1, s: 1, zh: 1, ch: 1, sh: 1, r: 1,
}

function codaI(fin) {
  if (fin === 'i') return ''
  const rest = fin.slice(1)
  const map = { a: 'a', ao: 'ao', an: 'an', ang: 'ang', e: 'e', u: 'ou', n: 'en', ng: 'eng', ong: 'ong' }
  return map[rest] !== undefined ? map[rest] : ''
}

function codaU(fin) {
  if (fin === 'u') return ''
  if (fin[0] !== 'u') return simpleCoda(fin)
  const rest = fin.slice(1)
  const map = { a: 'a', o: 'o', ai: 'ai', i: 'ei', an: 'an', n: 'en', ang: 'ang' }
  return map[rest] !== undefined ? map[rest] : simpleCoda(rest)
}

function codaÜ(fin) {
  if (fin === 'ü' || fin === 'u' || fin === 'v') return ''
  const rest = fin.replace(/^ü/, '').replace(/^u/, '').replace(/^v/, '')
  const map = { e: 'e', an: 'an', n: 'en' }
  return map[rest] !== undefined ? map[rest] : ''
}

function simpleCoda(fin) {
  if (!fin) return ''
  if (fin === 'er' || fin === 'ar') return 'e'
  if (LOCATIONS[fin]) return fin
  return ''
}

/** Split pinyin into one of 55 leads + one of 13 locations. */
export function splitParts(init, fin) {
  init = init || ''
  fin = (fin || '').toLowerCase().replace('u:', 'ü').replace('v', 'ü')
  if (APICAL[init] && (fin === 'i' || !fin)) return { lead: init, loc: '' }
  if (init === 'y') {
    if (fin[0] === 'ü' || fin === 'u') return { lead: 'yu', loc: codaÜ(fin === 'u' ? 'ü' : fin) }
    if (fin === 'ou' || fin === 'o' || fin === 'ong') return { lead: 'yi', loc: fin === 'o' ? 'o' : fin === 'ong' ? 'ong' : 'ou' }
    if (fin[0] === 'i' || !fin) return { lead: 'yi', loc: codaI(fin || 'i') }
    return { lead: 'yi', loc: simpleCoda(fin) }
  }
  if (init === 'w') {
    if (fin[0] === 'u') return { lead: 'wu', loc: codaU(fin) }
    return { lead: 'wu', loc: simpleCoda(fin) }
  }
  if (init === 'j' || init === 'q' || init === 'x') {
    if (fin[0] === 'ü' || fin[0] === 'u') return { lead: init + 'u', loc: codaÜ(fin[0] === 'u' ? 'ü' + fin.slice(1) : fin) }
    return { lead: init + 'i', loc: codaI(fin[0] === 'i' ? fin : 'i' + fin) }
  }
  if ((init === 'n' || init === 'l') && fin[0] === 'ü') {
    return { lead: init + 'ü', loc: codaÜ(fin) }
  }
  if (I_INIT[init] && (fin === 'i' || fin[0] === 'i')) {
    return { lead: init + 'i', loc: codaI(fin) }
  }
  if (U_INIT[init] && (fin === 'u' || (fin[0] === 'u' && fin[1] !== 'e'))) {
    return { lead: init + 'u', loc: codaU(fin) }
  }
  return { lead: init, loc: simpleCoda(fin) }
}

export function finKey(fin, init) {
  return splitParts(init, fin).loc
}

export function emptyMaps() {
  return { a: {}, s: {}, t: {}, p: {} }
}

export function readMaps(raw) {
  const out = emptyMaps()
  if (!raw || typeof raw !== 'object') return out
  for (const k of ['a', 's', 't', 'p']) {
    if (raw[k] && typeof raw[k] === 'object') {
      for (const [key, val] of Object.entries(raw[k])) {
        if (val && String(val).trim()) out[k][key] = String(val).trim()
      }
    }
  }
  return out
}

export function compactMaps(maps) {
  const src = readMaps(maps)
  const out = {}
  for (const k of ['a', 's', 't', 'p']) {
    if (Object.keys(src[k]).length) out[k] = src[k]
  }
  return Object.keys(out).length ? out : undefined
}

export function defaultLead(key) {
  return LEADS[key] || LEADS['']
}

export function defaultLocation(fin, init) {
  const key = arguments.length < 2 && LOCATIONS[fin] !== undefined ? fin : finKey(fin, init)
  return LOCATIONS[key] !== undefined ? LOCATIONS[key] : LOCATIONS['']
}

export function defaultTone(n) {
  return TONES[n] || TONES[5]
}

export function locationFor(fin, maps, init) {
  const key = finKey(fin, init)
  const over = maps && maps.s && maps.s[key]
  return over || defaultLocation(key)
}

export function leadFor(key, maps) {
  const over = maps && maps.a && maps.a[key]
  return over || defaultLead(key)
}

export function toneFor(n, maps) {
  const base = defaultTone(n)
  const over = maps && maps.t && maps.t[String(n)]
  return { name: base.name, light: over || base.light }
}

export function shotBrief(syl, maps) {
  const parts = splitParts(syl.init, syl.fin)
  const lead = leadFor(parts.lead, maps)
  const loc = (maps && maps.s && maps.s[parts.loc]) || defaultLocation(parts.loc)
  const tone = toneFor(syl.tone, maps)
  return {
    lead,
    loc,
    tone: tone.name,
    light: tone.light,
    init: parts.lead,
    fin: parts.loc,
    toneN: syl.tone,
    line: `${lead} at ${loc}, ${tone.light}.`,
  }
}

export function leadKind(key) {
  if (LEAD_GROUPS.animal.includes(key)) return 'animal'
  if (LEAD_GROUPS.female.includes(key)) return 'female'
  if (LEAD_GROUPS.fiction.includes(key)) return 'fiction'
  return 'male'
}

export function whyLead(key) {
  const kind = leadKind(key)
  if (!key) return 'ø trade — no initial (ài, èr…). Echo, not a fake consonant.'
  if (kind === 'female') return `${key} · first name (i-medial). Picture a friend with this name.`
  if (kind === 'fiction') return `${key} · creature (u-medial). Give it habits you can predict.`
  if (kind === 'animal') return `${key} · animal (ü-medial). Same animal in every ${key} shot.`
  return `${key}- · trade (a/e/o). Picture someone you know doing this job.`
}

export function whyLocation(fin) {
  const key = LOCATIONS[fin] !== undefined ? fin : finKey(fin)
  if (!key) {
    return 'ø no location sound — leftover after the lead (shi, zhu, qu, yi…). An empty backlot you can still walk.'
  }
  return `Location “${key}” — one of 13 places. Same coda, same place.`
}

export function whyTone(n) {
  const t = defaultTone(n)
  return `Tone ${n} (${t.name}) is the time of day and lighting at the location, not a new costume. Keep the lead and location; change the light so the contour is something you can see.`
}

export function defaultMapValue(kind, key) {
  if (kind === 'a') return defaultLead(key)
  if (kind === 's') return defaultLocation(key)
  if (kind === 't') return defaultTone(key).light
  return ''
}

export const METHOD = [
  'One character = one shot. You frame it yourself instead of copying by rote.',
  'The initial picks the lead. The final picks the location. The tone is the time of day — the lighting there.',
  'Look at the strokes until they become objects you could pick up: a hook, a roof, a walking legs.',
  'Block the shot in 3D. Walk around it. Give it a before and after, not a flat cartoon.',
  'For a word with two or more characters, cut the shots together so the meaning is the edit.',
]
