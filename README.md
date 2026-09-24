# Hanzi Palace

HSK 2.0 levels 1–6 (~5000 words, ~2650 characters) with an in-browser FSRS-5 scheduler and one paragraph per item. You only review what you have written. Preact, no login, low-RAM friendly.

## The idea

- **One item, one paragraph.** Every character gets a paragraph, and every word of two or more characters gets its own paragraph. How you memorize is up to you: a room in a memory palace, a scene, a pun, a song. The app stores your text and the review schedule, nothing about method.
- **Frequency order.** Within each HSK level, characters come in the order they appear in modern Chinese (Jun Da's MTSU corpus ranks, `js/freq.js`). Adding HSK 2 puts its new characters after HSK 1's.
- **Characters before words.** 出租车 is offered only after 出, 租, and 车 each have a paragraph. A character that only exists inside words (租) is its own item and borrows the word's gloss until you write it.
- **No daily cap.** Write as many paragraphs in a day as you like. Saving a first paragraph puts the item into review at once; after that FSRS-5 sets the dates.

Progress lives in a local SQLite file at `~/.local/share/hanzi-stage/palace.sqlite`. Nothing is uploaded. If an older `progress.sqlite` from the shot-list desk is found while the palace is empty, its shots are converted to paragraphs once and the old file is left as a backup.

## Run

    python3 serve.py

Open http://127.0.0.1:4173/

## Use

- Desk — due count, palace size, what is left, which lists are on. Top-left 简 / 繁 switches script.
- Write — the next items in palace order; jump to any unlocked one. Save & next walks the order.
- Review — hanzi first; reveal pinyin, meaning, and your paragraph (editable); rate Again / Hard / Good / Easy.
- Data — export / import JSON, clear the database. Exports from the old desk import too.

## Tests

    node tests/check.mjs

## Layout

    index.html
    css/app.css
    js/app.js       UI
    js/palace.js    item order, gating, next-to-write
    js/freq.js      character frequency ranks for HSK glyphs
    js/fsrs.js      FSRS-5
    js/hsk1.js      HSK 2.0 word rows + pinyin parsing
    js/hsk-lists.js raw lists
    js/radicals.js  Kangxi radical + pieces (HSK 1 glyphs), shown as reference
    js/store.js     SQLite API, v1 → v2 conversion
    serve.py        static files + SQLite on :4173
