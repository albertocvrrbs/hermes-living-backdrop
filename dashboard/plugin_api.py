"""living-backdrop — backend half.

Serves the background loop to the desktop half. ``ctx.rest`` only speaks JSON, so the
video is sent as base64 chunks; the desktop reassembles it once and caches it in
IndexedDB keyed by ``version`` (size + mtime), so it downloads a single time.
Swap ``media/backdrop.mp4`` for any loop you like and every client picks it up.
"""
from __future__ import annotations

import base64
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException

router = APIRouter()
_MEDIA = Path(__file__).resolve().parent.parent / "media"
_VIDEO = _MEDIA / "backdrop.mp4"
_POSTER = _MEDIA / "poster.jpg"
_CHUNK = 3 * 1024 * 1024


def _version() -> str:
    st = _VIDEO.stat()
    return f"{st.st_size}-{int(st.st_mtime)}"


@router.get("/meta")
async def meta() -> dict[str, Any]:
    if not _VIDEO.is_file():
        raise HTTPException(status_code=404, detail="no video")
    size = _VIDEO.stat().st_size
    poster = ""
    if _POSTER.is_file():
        poster = "data:image/jpeg;base64," + base64.b64encode(_POSTER.read_bytes()).decode("ascii")
    return {"version": _version(), "size": size, "chunks": (size + _CHUNK - 1) // _CHUNK,
            "mime": "video/mp4", "poster": poster}


@router.get("/chunk")
async def chunk(i: int = 0) -> dict[str, Any]:
    size = _VIDEO.stat().st_size
    n = (size + _CHUNK - 1) // _CHUNK
    if i < 0 or i >= n:
        raise HTTPException(status_code=416, detail="bad chunk")
    with _VIDEO.open("rb") as f:
        f.seek(i * _CHUNK)
        raw = f.read(_CHUNK)
    return {"i": i, "b64": base64.b64encode(raw).decode("ascii"), "version": _version()}
