// Living Backdrop — an animated pastel forest behind the Hermes chat.
// The loop downloads once from the backend (/api/plugins/living-backdrop) and is cached in IndexedDB.
// The chat surface goes transparent; messages, composer and status pills become frosted glass
// tinted with the video's palette, and the app accent takes the sunset coral.
import { setAccentOverride } from '@hermes/plugin-sdk'

const ID = 'living-backdrop'
const ACCENT = '#ee8a86'
const DB = 'living-backdrop', STORE = 'video'

const CSS = `
[data-chat-surface][data-living-backdrop] { --ui-chat-surface-background: transparent !important; background: transparent !important; }
[data-chat-surface][data-living-backdrop] [data-slot="composer-bounds"] { background: transparent !important; }
.fv-layer { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; background: #3a4792; }
.fv-layer video, .fv-layer .fv-poster {
  max-width: none; max-height: none; position: absolute; inset: -2%; width: 104%; height: 104%; object-fit: cover; object-position: 38% 60%;
  transition: opacity 1.4s ease, filter .6s ease;
}
.fv-layer .fv-poster { filter: blur(18px) saturate(1.1); }
.fv-layer video { opacity: 0; }
.fv-layer[data-ready] video { opacity: 1; }
.fv-layer[data-ready] .fv-poster { opacity: 0; }
/* veil: edges and upper middle stay clear; it only shades where text lives and near the composer */
.fv-veil { position: absolute; inset: 0; transition: background .6s ease; }
:root .fv-veil {
  background:
    linear-gradient(to bottom, rgba(254,245,222,.30) 0%, rgba(254,245,222,0) 14%, rgba(254,245,222,0) 70%, rgba(249,231,198,.55) 100%),
    radial-gradient(ellipse 46% 80% at 50% 55%, rgba(254,245,222,.34), rgba(254,245,222,0) 75%);
}
:root.dark .fv-veil {
  background:
    linear-gradient(to bottom, rgba(30,36,80,.45) 0%, rgba(30,36,80,0) 16%, rgba(30,36,80,0) 66%, rgba(30,36,80,.70) 100%),
    radial-gradient(ellipse 46% 80% at 50% 55%, rgba(30,36,80,.40), rgba(30,36,80,0) 75%);
}
:root.dark .fv-layer video { filter: saturate(1.05) brightness(.88); }
/* paper grain over the whole backdrop: ties the video to the interface */
.fv-grain { position: absolute; inset: 0; opacity: .10; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"); }


/* frosted glass: warm cream in light mode, deep indigo in dark mode */
[data-living-backdrop] { --fv-glass: rgba(254,245,222,.72); --fv-glass-edge: rgba(255,255,255,.55); --fv-shadow: 0 10px 30px -14px rgba(58,71,146,.45); }
:root.dark [data-living-backdrop] { --fv-glass: rgba(24,28,66,.70); --fv-glass-edge: rgba(143,220,207,.18); --fv-shadow: 0 12px 34px -12px rgba(10,12,40,.7); }
[data-living-backdrop] [data-slot="aui_assistant-message-content"] {
  background: var(--fv-glass); border: 1px solid var(--fv-glass-edge); border-radius: 18px;
  padding: .85rem 1.1rem; box-shadow: var(--fv-shadow);
}
/* user bubble: coral-tinted glass (the sunset colour) */
[data-living-backdrop] { --fv-user: rgba(246,179,162,.55); }
:root.dark [data-living-backdrop] { --fv-user: rgba(124,60,90,.50); }
[data-living-backdrop] [data-slot="aui_user-message-root"] [class*="border-(--ui-stroke-tertiary)"] {
  background: var(--fv-user) !important; border-color: var(--fv-glass-edge) !important; box-shadow: var(--fv-shadow);
}
[data-living-backdrop] [data-slot="composer-surface"] {
  background: var(--fv-glass) !important; border-color: var(--fv-glass-edge) !important; box-shadow: var(--fv-shadow); border-radius: 22px;
}
[data-living-backdrop] [data-slot="composer-surface"] > div[aria-hidden][class*="-z-10"] { background: transparent !important; }
[data-living-backdrop] [data-slot="aui_assistant-message-content"] pre,
[data-living-backdrop] [data-slot="aui_assistant-message-content"] table { background-color: color-mix(in srgb, var(--fv-glass) 70%, transparent); }

/* blur: a small copy of the video, upscaled and clipped to every bubble's shape (no backdrop-filter, which drops while scrolling) */
.fv-layer canvas.fv-blur { max-width: none; max-height: none; position: absolute; inset: -2%; width: 104%; height: 104%; filter: blur(12px) saturate(1.45); opacity: 0; transition: opacity 1.4s ease; }
.fv-layer[data-ready] canvas.fv-blur { opacity: 1; }
:root.dark .fv-layer canvas.fv-blur { filter: blur(12px) saturate(1.4) brightness(.8); }

/* live status (thinking, tools, loading) and notes (skill/memory updated): glass pills */
[data-living-backdrop] :is([data-slot="aui_turn-activity"]:not(.sr-only), [data-slot="aui_response-loading"], [data-slot="aui_background-resume"], [data-slot="aui_system-message-root"]) {
  width: fit-content !important; max-width: 100%; align-self: flex-start;
  background: var(--fv-glass); border: 1px solid var(--fv-glass-edge); border-radius: 999px;
  padding: .3rem .9rem .3rem .7rem !important; box-shadow: var(--fv-shadow);
  animation: fv-in .45s cubic-bezier(.2,.8,.2,1) both;
  transition: background .4s ease, box-shadow .4s ease;
}
[data-living-backdrop] [data-slot="aui_system-message-root"] { margin: .35rem 0; }
[data-living-backdrop] .fv-swap { animation: fv-swap .42s cubic-bezier(.2,.8,.2,1) both; }
@keyframes fv-in { from { opacity: 0; transform: translateY(8px) scale(.98); filter: blur(4px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes fv-swap { 0% { opacity: .15; transform: translateY(5px); filter: blur(3px); } 100% { opacity: 1; transform: none; filter: none; } }
/* new replies fade in too */
[data-living-backdrop] [data-slot="aui_assistant-message-content"] { animation: fv-in .5s cubic-bezier(.2,.8,.2,1) both; }
@media (prefers-reduced-motion: reduce) { [data-living-backdrop] *, [data-living-backdrop] .fv-swap { animation: none !important; }
   .fv-layer video { display: none; } .fv-layer .fv-poster { opacity: 1 !important; filter: none; } }
`

function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
async function idbGet(key) {
  const db = await idb()
  return new Promise(res => { const q = db.transaction(STORE).objectStore(STORE).get(key); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null) })
}
async function idbPut(key, val) {
  const db = await idb()
  return new Promise(res => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).clear(); tx.objectStore(STORE).put(val, key); tx.oncomplete = () => res(); tx.onerror = () => res() })
}
const b64ToBytes = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u }

export default {
  id: ID,
  name: 'Living Backdrop',
  register(ctx) {
    let disposed = false, videoUrl = null, poster = ''
    const style = document.createElement('style')
    style.dataset.plugin = ID
    style.textContent = CSS
    document.head.appendChild(style)
    setAccentOverride(ACCENT)

    const layers = new Set()
    function mount(surface) {
      if (surface.querySelector(':scope > .fv-layer')) return
      surface.setAttribute('data-living-backdrop', '')
      const layer = document.createElement('div')
      layer.className = 'fv-layer'
      layer.setAttribute('aria-hidden', 'true')
      const img = document.createElement('img'); img.className = 'fv-poster'; img.alt = ''; if (poster) img.src = poster
      const v = document.createElement('video')
      Object.assign(v, { muted: true, loop: true, autoplay: true, playsInline: true, preload: 'auto' })
      v.setAttribute('muted', ''); v.disablePictureInPicture = true
      v.addEventListener('playing', () => layer.setAttribute('data-ready', ''), { once: true })
      const veil = document.createElement('div'); veil.className = 'fv-veil'
      const grain = document.createElement('div'); grain.className = 'fv-grain'
      const blur = document.createElement('canvas'); blur.className = 'fv-blur'; blur.width = 384; blur.height = 216
      layer.append(img, v, veil, grain, blur)
      surface.prepend(layer)
      layers.add(layer)
      if (videoUrl) { v.src = videoUrl; v.play().catch(() => {}) }
    }
    const scan = () => document.querySelectorAll('[data-chat-surface]').forEach(mount)
    const mo = new MutationObserver(() => scan())
    mo.observe(document.body, { childList: true, subtree: true })
    scan()


    // every frame: copy the video into the small canvas and clip it to the union of visible bubbles
    const SEL = '[data-slot="aui_assistant-message-content"], [data-slot="aui_user-message-root"] [class*="border-(--ui-stroke-tertiary)"], [data-slot="composer-surface"], [data-slot="aui_turn-activity"]:not(.sr-only), [data-slot="aui_response-loading"], [data-slot="aui_background-resume"], [data-slot="aui_system-message-root"]'
    const rr = (x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); return `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z` }
    let raf = 0
    function tick() {
      raf = requestAnimationFrame(tick)
      if (document.hidden) return
      layers.forEach(l => {
        const v = l.querySelector('video'), c = l.querySelector('canvas.fv-blur')
        if (!v || !c || !l.isConnected) return
        if (v.readyState >= 2) { const g = c._g || (c._g = c.getContext('2d')); try { g.drawImage(v, 0, 0, c.width, c.height) } catch {} }
        const surf = l.parentElement, cb = c.getBoundingClientRect()
        const port = surf.querySelector('[data-slot="aui_thread-viewport"]') || surf.querySelector('[data-slot="composer-bounds"]')
        const pb = port ? port.getBoundingClientRect() : cb
        let d = ''
        surf.querySelectorAll(SEL).forEach(el => {
          const b = el.getBoundingClientRect(), comp = el.matches('[data-slot="composer-surface"]')
          // whatever the thread already scrolled out of view gets no blur
          const top = comp ? b.top : Math.max(b.top, pb.top), bot = comp ? b.bottom : Math.min(b.bottom, pb.bottom)
          if (b.width < 2 || bot - top < 2) return
          const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 12
          d += rr(b.left - cb.left, top - cb.top, b.width, bot - top, r)
        })
        const clip = d ? `path("${d}")` : 'inset(50%)'
        if (c._clip !== clip) { c.style.clipPath = clip; c._clip = clip }
      })
    }
    raf = requestAnimationFrame(tick)

    // smooth transition when the live status text changes
    const swapMo = new MutationObserver(muts => {
      for (const m of muts) {
        const el = (m.target.nodeType === 3 ? m.target.parentElement : m.target)?.closest?.('[data-slot="aui_turn-activity"], [data-slot="aui_response-loading"], [data-slot="aui_background-resume"]')
        if (!el || el._fvBusy) continue
        const key = (el.textContent || '').replace(/[\d.,:]+/g, '#').trim()
        if (key === el._fvKey) continue
        el._fvKey = key; el._fvBusy = true
        requestAnimationFrame(() => { el.classList.remove('fv-swap'); void el.offsetWidth; el.classList.add('fv-swap'); el._fvBusy = false })
      }
    })
    swapMo.observe(document.body, { characterData: true, childList: true, subtree: true })

    // save GPU/CPU: pause while the window is hidden
    const onVis = () => layers.forEach(l => { const v = l.querySelector('video'); if (!v || !v.src) return; document.hidden ? v.pause() : v.play().catch(() => {}) })
    document.addEventListener('visibilitychange', onVis)

    ;(async () => {
      try {
        const meta = await ctx.rest('/meta', { timeoutMs: 20000 })
        poster = meta.poster || ''
        layers.forEach(l => { const i = l.querySelector('.fv-poster'); if (i && poster) i.src = poster })
        let blob = null
        const hit = await idbGet(meta.version).catch(() => null)
        if (hit instanceof Blob && hit.size === meta.size) blob = hit
        if (!blob) {
          const parts = []
          for (let i = 0; i < meta.chunks && !disposed; i++) {
            const c = await ctx.rest(`/chunk?i=${i}`, { timeoutMs: 120000 })
            parts.push(b64ToBytes(c.b64))
          }
          if (disposed) return
          blob = new Blob(parts, { type: meta.mime })
          idbPut(meta.version, blob).catch(() => {})
        }
        if (disposed) return
        videoUrl = URL.createObjectURL(blob)
        layers.forEach(l => { const v = l.querySelector('video'); v.src = videoUrl; v.play().catch(() => {}) })
      } catch (e) {
        console.warn('[living-backdrop] could not load the video', e)
      }
    })()

    ctx.onDispose(() => {
      disposed = true
      mo.disconnect()
      swapMo.disconnect()
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
      layers.forEach(l => { const v = l.querySelector('video'); if (v) { v.pause(); v.removeAttribute('src'); v.load() } l.remove() })
      document.querySelectorAll('[data-living-backdrop]').forEach(s => s.removeAttribute('data-living-backdrop'))
      style.remove()
      setAccentOverride(null)
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    })
  }
}
