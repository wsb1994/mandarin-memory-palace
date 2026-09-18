#!/usr/bin/env python3
"""Local Hanzi Stage server: static files + SQLite progress.

Progress lives in ~/.local/share/hanzi-stage/progress.sqlite so shot text
is not capped at a 4 KiB cookie. Bind 127.0.0.1 only.
"""

from __future__ import annotations

import json
import os
import sqlite3
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_DIR = Path.home() / ".local" / "share" / "hanzi-stage"
DB_PATH = DB_DIR / "progress.sqlite"
HOST = os.environ.get("HANZI_STAGE_HOST", "127.0.0.1")
PORT = int(os.environ.get("HANZI_STAGE_PORT", "4173"))
MAX_BODY = 8 * 1024 * 1024

_lock = threading.Lock()


def _connect() -> sqlite3.Connection:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(DB_PATH), timeout=10)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA synchronous=NORMAL")
    con.execute("PRAGMA foreign_keys=ON")
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
                  new_cap INTEGER NOT NULL,
                  day INTEGER NOT NULL,
                  new_today INTEGER NOT NULL,
                  script TEXT NOT NULL,
                  lv TEXT NOT NULL,
                  extra TEXT NOT NULL,
                  maps TEXT
                );
                CREATE TABLE IF NOT EXISTS cards (
                  id INTEGER PRIMARY KEY,
                  s REAL,
                  d REAL,
                  due INTEGER,
                  reps INTEGER,
                  lapses INTEGER,
                  st INTEGER,
                  last INTEGER,
                  shot TEXT
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
    if payload.get("v") != 1:
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
        if 1 <= i <= 6:
            out.append(i)
    return out or [1]


def _extra(raw) -> list[int]:
    if not isinstance(raw, list):
        return []
    out = []
    for n in raw:
        try:
            i = int(n)
        except (TypeError, ValueError):
            continue
        if i >= 0:
            out.append(i)
    return out


def put_state(payload: object) -> dict:
    data = _unwrap(payload)
    script = "t" if data.get("script") == "t" else "s"
    lv = _lv(data.get("lv"))
    extra = _extra(data.get("x"))
    maps = data.get("maps")
    maps_json = json.dumps(maps, ensure_ascii=False) if maps else None
    try:
        new_cap = int(data.get("newCap") or 7)
    except (TypeError, ValueError):
        new_cap = 7
    new_cap = max(1, min(30, new_cap))
    try:
        day = int(data.get("day") or 0)
    except (TypeError, ValueError):
        day = 0
    try:
        new_today = int(data.get("newToday") or 0)
    except (TypeError, ValueError):
        new_today = 0

    cards = []
    for key, card in data["c"].items():
        try:
            cid = int(key)
        except (TypeError, ValueError):
            continue
        if not isinstance(card, dict):
            continue
        shot = card.get("m")
        shot_json = json.dumps(shot, ensure_ascii=False) if shot is not None else None
        cards.append(
            (
                cid,
                card.get("s"),
                card.get("d"),
                card.get("due"),
                card.get("reps"),
                card.get("lapses"),
                card.get("st"),
                card.get("last"),
                shot_json,
            )
        )

    with _lock:
        con = _connect()
        try:
            existing = con.execute("SELECT COUNT(*) FROM cards").fetchone()[0]
            if not cards and existing:
                # An empty PUT is how a stale tab can wipe a just-migrated desk.
                # Explicit wipe is DELETE /api/state.
                raise ValueError("refusing to overwrite progress with empty cards")
            con.execute("BEGIN")
            con.execute("DELETE FROM cards")
            con.execute("DELETE FROM meta")
            con.execute(
                """
                INSERT INTO meta (id, v, new_cap, day, new_today, script, lv, extra, maps)
                VALUES (1, 1, ?, ?, ?, ?, ?, ?, ?)
                """,
                (new_cap, day, new_today, script, json.dumps(lv), json.dumps(extra), maps_json),
            )
            con.executemany(
                """
                INSERT INTO cards (id, s, d, due, reps, lapses, st, last, shot)
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


def get_state() -> dict:
    with _lock:
        con = _connect()
        try:
            meta = con.execute(
                "SELECT v, new_cap, day, new_today, script, lv, extra, maps FROM meta WHERE id = 1"
            ).fetchone()
            if not meta:
                return {
                    "ok": True,
                    "backend": "sqlite",
                    "db": str(DB_PATH),
                    "empty": True,
                    "state": None,
                }
            rows = con.execute(
                "SELECT id, s, d, due, reps, lapses, st, last, shot FROM cards"
            ).fetchall()
        finally:
            con.close()

    v, new_cap, day, new_today, script, lv_raw, extra_raw, maps_raw = meta
    cards = {}
    for cid, s, d, due, reps, lapses, st, last, shot in rows:
        card = {}
        if s is not None:
            card["s"] = s
        if d is not None:
            card["d"] = d
        if due is not None:
            card["due"] = due
        if reps is not None:
            card["reps"] = reps
        if lapses is not None:
            card["lapses"] = lapses
        if st is not None:
            card["st"] = st
        if last is not None:
            card["last"] = last
        if shot:
            try:
                card["m"] = json.loads(shot)
            except json.JSONDecodeError:
                pass
        cards[str(cid)] = card
    try:
        maps = json.loads(maps_raw) if maps_raw else None
    except json.JSONDecodeError:
        maps = None
    state = {
        "v": int(v),
        "newCap": int(new_cap),
        "day": int(day),
        "newToday": int(new_today),
        "script": "t" if script == "t" else "s",
        "lv": json.loads(lv_raw) if lv_raw else [1],
        "x": json.loads(extra_raw) if extra_raw else [],
        "c": cards,
    }
    if maps:
        state["maps"] = maps
    return {
        "ok": True,
        "backend": "sqlite",
        "db": str(DB_PATH),
        "empty": False,
        "state": state,
    }


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
        sys_stderr = __import__("sys").stderr
        sys_stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

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
            self._json(
                200,
                {"ok": True, "backend": "sqlite", "db": str(DB_PATH), "port": PORT},
            )
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
    print(f"Hanzi Stage http://{HOST}:{PORT}/  db {DB_PATH}", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nbye", flush=True)
        httpd.server_close()


if __name__ == "__main__":
    main()
