/** Compact FSRS-5. No deps. Intervals in whole days (low-RAM devices). */

export const Rating = { Again: 1, Hard: 2, Good: 3, Easy: 4 }
export const State = { New: 0, Learning: 1, Review: 2, Relearning: 3 }

const S_MIN = 0.01
const DECAY = -0.5
const FACTOR = 19 / 81

// FSRS-5 defaults (open-spaced-repetition)
export const DEFAULT_W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575,
  0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
]

export const REQUEST_RETENTION = 0.9

export function unixDay(ms = Date.now()) {
  return Math.floor(ms / 86400000)
}

function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x))
}

function initStability(w, g) {
  return Math.max(S_MIN, w[g - 1])
}

function initDifficulty(w, g) {
  return clamp(w[4] - Math.exp(w[5] * (g - 1)) + 1, 1, 10)
}

function nextDifficulty(w, d, g) {
  const next = d - w[6] * (g - 3)
  return clamp(w[7] * initDifficulty(w, 4) + (1 - w[7]) * next, 1, 10)
}

export function retrievability(elapsedDays, stability) {
  if (elapsedDays <= 0) return 1
  return Math.pow(1 + FACTOR * elapsedDays / stability, DECAY)
}

function nextRecallStability(w, d, s, r, g) {
  const hardPen = g === Rating.Hard ? w[15] : 1
  const easyBonus = g === Rating.Easy ? w[16] : 1
  return clamp(
    s *
      (Math.exp(w[8]) *
        (11 - d) *
        Math.pow(s, -w[9]) *
        (Math.exp(w[10] * (1 - r)) - 1) *
        hardPen *
        easyBonus),
    S_MIN,
    36500,
  )
}

function nextForgetStability(w, d, s, r) {
  return clamp(
    w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r)),
    S_MIN,
    36500,
  )
}

function nextShortTermStability(w, s, g) {
  return clamp(s * Math.exp(w[17] * (g - 3 + w[18])), S_MIN, 36500)
}

export function nextInterval(stability, retention = REQUEST_RETENTION) {
  const ivl = (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1)
  return Math.max(0, Math.round(ivl))
}

export function newCard() {
  return {
    s: 0,
    d: 0,
    due: 0,
    reps: 0,
    lapses: 0,
    st: State.New,
    last: 0,
  }
}

/**
 * @param {ReturnType<typeof newCard>} card
 * @param {number} rating 1-4
 * @param {number} nowDay unix day
 * @param {number[]} [w]
 */
export function review(card, rating, nowDay, w = DEFAULT_W) {
  const g = rating
  let { s, d, reps, lapses, st, last } = card
  const elapsed = last ? Math.max(0, nowDay - last) : 0
  let scheduled

  if (st === State.New) {
    s = initStability(w, g)
    d = initDifficulty(w, g)
    st = g === Rating.Again ? State.Learning : State.Review
    scheduled = g === Rating.Again ? 0 : Math.max(1, nextInterval(s))
  } else {
    const r = retrievability(elapsed, s)
    d = nextDifficulty(w, d, g)
    if (g === Rating.Again) {
      s = nextForgetStability(w, d, s, r)
      lapses += 1
      st = State.Relearning
      scheduled = 0
    } else {
      if (elapsed === 0 && (st === State.Learning || st === State.Relearning)) {
        s = nextShortTermStability(w, s, g)
      } else {
        s = nextRecallStability(w, d, s, r, g)
      }
      st = State.Review
      scheduled = Math.max(1, nextInterval(s))
    }
  }

  return {
    s: +s.toFixed(4),
    d: +d.toFixed(4),
    due: nowDay + scheduled,
    reps: reps + 1,
    lapses,
    st,
    last: nowDay,
  }
}

export function isDue(card, nowDay) {
  if (!card || card.st === State.New) return false
  return card.due <= nowDay
}
