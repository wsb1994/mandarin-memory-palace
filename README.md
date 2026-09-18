# Hanzi Stage

HSK 2.0 levels 1–6 (~5000 words) with an in-browser FSRS-5 scheduler and an original shot-list mnemonic desk. HSK 1 starts added; add later lists from Studio. Built for a low-RAM MacBook or phone: Preact, no login.

Progress lives in a local SQLite file at `~/.local/share/hanzi-stage/progress.sqlite` (简/繁, FSRS scheduling, and shot text). Nothing is uploaded. An old `stage` cookie is imported once if the database is empty, then left as a backup.

## Run

    python3 serve.py

Open http://127.0.0.1:4173/

`file://` has no API, so the app would fall back to the 4 KiB cookie and start dropping shots again.

## Use

- Desk — due / new counts, method notes, daily new cap. Top-left 简 / 繁 switches simplified and traditional (OpenCC). The choice lives in the database.
- Review — hanzi first, then pinyin, English, and shot briefs (lead from initial, location from final, lighting from tone). Click lead / location / lighting / hanzi for why + objects + global edit; click off to close. In a shot editor, tap an object to drop it into the text. Write the 3D shot, then rate Again / Hard / Good / Easy
- Studio — draft shots without a review
- Data — name leads, locations, and tone lighting before you start (global; stored as diffs). Export JSON, import it later, or clear the database

Shot text is not trimmed. Export still gives you a portable JSON snapshot.

## Tests

    node tests/check.mjs

## Layout

    index.html
    css/app.css
    js/app.js      UI
    js/fsrs.js     FSRS-5
    js/hsk1.js     official 2012 HSK 1 list
    js/shots.js      lead / location / tone maps (original names)
    js/radicals.js Kangxi radical + original pickup-able objects (Wiktionary Han char)
    js/store.js    SQLite API + one-time cookie migrate
    serve.py       static files + SQLite on :4173

Preact 10 is loaded from jsDelivr via import map (~10 KB). First load needs network; after that the browser cache is enough.
