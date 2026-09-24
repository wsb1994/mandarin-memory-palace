#!/usr/bin/env python3
"""Local Hanzi Palace server: static files + SQLite progress.

Progress lives in ~/.local/share/hanzi-stage/palace.sqlite. Cards are keyed by
hanzi and each carries one paragraph. An older progress.sqlite (v1 shot desk)
is offered to the client once, while palace.sqlite is still empty, so the
client can convert it. Bind 127.0.0.1 only.
"""

from __future__ import annotations

import json
import os
import sqlite3
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_DIR = Path.home() / ".local" / "share" / "hanzi-stage"
DB_PATH = DB_DIR / "palace.sqlite"
LEGACY_PATH = DB_DIR / "progress.sqlite"
HOST = os.environ.get("HANZI_STAGE_HOST", "127.0.0.1")
PORT = int(os.environ.get("HANZI_STAGE_PORT", "4173"))
MAX_BODY = 16 * 1024 * 1024

_lock = threading.Lock()


def _connect(path: Path = DB_PATH) -> sqlite3.Connection:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(path), timeout=10)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA synchronous=NORMAL")
    return con


def init_db() -> None:
    with _lock:
        con = _connect()
        try:
            con.executescript(
                """
                CREATE TABLE IF NOT EXISTS meta (
                  id INTEGER PRIMARY KEY CHECK (id = 1),
                  v INTEGER NOT NULL,
                  script TEXT NOT NULL,
                  lv TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS cards (
                  hz TEXT PRIMARY KEY,
                  s REAL,
                  d REAL,
                  due INTEGER,
                  reps INTEGER,
                  lapses INTEGER,
                  st INTEGER,
                  last INTEGER,
                  story TEXT
                );
                """
            )
            con.commit()
        finally:
            con.close()


def _unwrap(payload: object) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("expected a JSON object")
    if isinstance(payload.get("state"), dict) and payload.get("v") is None:
        payload = payload["state"]
    if payload.get("v") != 2:
        raise ValueError("unknown version")
    if not isinstance(payload.get("c"), dict):
        raise ValueError("missing cards")
    return payload


def _lv(raw) -> list[int]:
    if not isinstance(raw, list) or not raw:
        return [1]
    out = []
    for n in raw:
        try:
            i = int(n)
        except (TypeError, ValueError):
            continue
        if 1 <= i <= 6 and i not in out:
            out.append(i)
    return sorted(out) or [1]


def _num(v):
    if v is None or isinstance(v, bool):
        return None
    try:
        return float(v) if isinstance(v, float) else int(v)
    except (TypeError, ValueError):
        return None


def put_state(payload: object) -> dict:
    data = _unwrap(payload)
    script = "t" if data.get("script") == "t" else "s"
    lv = _lv(data.get("lv"))

    cards = []
    for hz, card in data["c"].items():
        if not isinstance(hz, str) or not hz or not isinstance(card, dict):
            continue
        story = card.get("p")
        story = story if isinstance(story, str) and story.strip() else None
        cards.append(
            (
                hz,
                _num(card.get("s")),
                _num(card.get("d")),
                _num(card.get("due")),
                _num(card.get("reps")),
                _num(card.get("lapses")),
                _num(card.get("st")),
                _num(card.get("last")),
                story,
            )
        )

    with _lock:
        con = _connect()
        try:
            existing = con.execute("SELECT COUNT(*) FROM cards").fetchone()[0]
            if not cards and existing:
                # An empty PUT is how a stale tab can wipe a desk. Explicit wipe is DELETE.
                raise ValueError("refusing to overwrite progress with empty cards")
            con.execute("BEGIN")
            con.execute("DELETE FROM cards")
            con.execute("DELETE FROM meta")
            con.execute(
                "INSERT INTO meta (id, v, script, lv) VALUES (1, 2, ?, ?)",
                (script, json.dumps(lv)),
            )
            con.executemany(
                """
                INSERT INTO cards (hz, s, d, due, reps, lapses, st, last, story)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                cards,
            )
            con.commit()
        except Exception:
            con.rollback()
            raise
        finally:
            con.close()
    return {"ok": True, "cards": len(cards)}


def _card(s, d, due, reps, lapses, st, last) -> dict:
    card = {}
    for k, v in (("s", s), ("d", d), ("due", due), ("reps", reps), ("lapses", lapses), ("st", st), ("last", last)):
        if v is not None:
            card[k] = v
    return card


def legacy_state() -> dict | None:
    """Read the v1 shot desk (numeric ids, shot json) if it exists. Never written."""
    if not LEGACY_PATH.exists():
        return None
    try:
        con = sqlite3.connect(f"file:{LEGACY_PATH}?mode=ro", uri=True, timeout=5)
    except sqlite3.Error:
        return None
    try:
        meta = con.execute("SELECT script, lv FROM meta WHERE id = 1").fetchone()
        rows = con.execute("SELECT id, s, d, due, reps, lapses, st, last, shot FROM cards").fetchall()
    except sqlite3.Error:
        return None
    finally:
        con.close()
    if not meta or not rows:
        return None
    script, lv_raw = meta
    cards = {}
    for cid, s, d, due, reps, lapses, st, last, shot in rows:
        card = _card(s, d, due, reps, lapses, st, last)
        if shot:
            try:
                card["m"] = json.loads(shot)
            except json.JSONDecodeError:
                pass
        cards[str(cid)] = card
    try:
        lv = json.loads(lv_raw) if lv_raw else [1]
    except json.JSONDecodeError:
        lv = [1]
    return {"v": 1, "script": "t" if script == "t" else "s", "lv": lv, "c": cards}


def get_state() -> dict:
    with _lock:
        con = _connect()
        try:
            meta = con.execute("SELECT v, script, lv FROM meta WHERE id = 1").fetchone()
            if not meta:
                return {
                    "ok": True,
                    "backend": "sqlite",
                    "db": str(DB_PATH),
                    "empty": True,
                    "state": None,
                    "legacy": legacy_state(),
                }
            rows = con.execute(
                "SELECT hz, s, d, due, reps, lapses, st, last, story FROM cards"
            ).fetchall()
        finally:
            con.close()

    v, script, lv_raw = meta
    cards = {}
    for hz, s, d, due, reps, lapses, st, last, story in rows:
        card = _card(s, d, due, reps, lapses, st, last)
        if story:
            card["p"] = story
        cards[hz] = card
    try:
        lv = json.loads(lv_raw) if lv_raw else [1]
    except json.JSONDecodeError:
        lv = [1]
    state = {
        "v": 2,
        "script": "t" if script == "t" else "s",
        "lv": lv,
        "c": cards,
    }
    return {"ok": True, "backend": "sqlite", "db": str(DB_PATH), "empty": False, "state": state}


def clear_state() -> None:
    with _lock:
        con = _connect()
        try:
            con.execute("DELETE FROM cards")
            con.execute("DELETE FROM meta")
            con.commit()
        finally:
            con.close()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        path = self.path.split("?", 1)[0]
        if path == "/" or path.endswith(".html") or path.endswith(".js"):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _json(self, code: int, payload: dict) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def _route(self) -> str:
        return self.path.split("?", 1)[0]

    def do_GET(self) -> None:
        route = self._route()
        if route == "/api/health":
            self._json(200, {"ok": True, "backend": "sqlite", "db": str(DB_PATH), "port": PORT})
            return
        if route == "/api/state":
            self._json(200, get_state())
            return
        super().do_GET()

    def do_PUT(self) -> None:
        if self._route() != "/api/state":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length") or "0")
        if length > MAX_BODY:
            self._json(413, {"ok": False, "error": "body too large"})
            return
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8"))
            result = put_state(payload)
        except ValueError as e:
            self._json(400, {"ok": False, "error": str(e)})
            return
        except json.JSONDecodeError:
            self._json(400, {"ok": False, "error": "invalid json"})
            return
        self._json(200, result)

    def do_DELETE(self) -> None:
        if self._route() != "/api/state":
            self.send_error(404)
            return
        clear_state()
        self._json(200, {"ok": True})


def main() -> None:
    init_db()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Hanzi Palace http://{HOST}:{PORT}/  db {DB_PATH}", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nbye", flush=True)
        httpd.server_close()


if __name__ == "__main__":
    main()
