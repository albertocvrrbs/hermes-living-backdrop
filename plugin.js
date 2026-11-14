// Fondo vivo — el bosque al pastel animado detrás del chat.
// El video baja una vez del backend (/api/plugins/fondo-vivo) y queda en IndexedDB.
// El chat se vuelve transparente; mensajes y composer pasan a vidrio esmerilado
// teñido con la paleta del video, y el acento del app toma el coral del atardecer.
import { setAccentOverride } from '@hermes/plugin-sdk'

const ID = 'fondo-vivo'
const ACCENT = '#ee8a86'
const DB = 'fondo-vivo', STORE = 'video'

const CSS = `
[data-chat-surface][data-fondo-vivo] { --ui-chat-surface-background: transparent !important; background: transparent !important; }
[data-chat-surface][data-fondo-vivo] [data-slot="composer-bounds"] { background: transparent !important; }
.fv-layer { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; background: #3a4792; }
.fv-layer video, .fv-layer .fv-poster {
  position: absolute; inset: -2%; width: 104%; height: 104%; object-fit: cover; object-position: 38% 60%;
  transition: opacity 1.4s ease, filter .6s ease;
}
.fv-layer .fv-poster { filter: blur(18px) saturate(1.1); }
.fv-layer video { opacity: 0; }
.fv-layer[data-ready] video { opacity: 1; }
.fv-layer[data-ready] .fv-poster { opacity: 0; }
/* velo: deja los bordes y el centro-alto limpios; solo sombrea donde vive el texto y abajo, en el composer */
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
/* grano de papel encima de todo el fondo: une el video con la interfaz */
.fv-grain { position: absolute; inset: 0; opacity: .10; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"); }


/* app completa: el mismo bosque, desenfocado y tenido, detras de barras laterales, pestanas y barra de estado */
:root[data-fondo-vivo-app] { background-color: transparent !important;
  --ui-sidebar-surface-background: transparent !important; --ui-editor-surface-background: transparent !important;
  --ui-chat-surface-background: transparent !important; --sidebar: transparent !important;
  --sidebar-edge-border: rgba(255,255,255,.10) !important; --pane-tab-strip-bg: transparent !important; }
/* el tema pinta sus variables en linea sobre <html>; por eso los !important */
:root[data-fondo-vivo-app] body {
  background: linear-gradient(rgba(254,245,222,.50), rgba(249,231,198,.62)), var(--fv-blur) center / cover fixed, #efc2a2 !important; }
:root.dark[data-fondo-vivo-app] body {
  background: linear-gradient(160deg, rgba(22,26,62,.66), rgba(30,36,80,.58) 55%, rgba(60,40,80,.62)), var(--fv-blur) center / cover fixed, #1e2450 !important; }
/* el lado del sol: un brillo coral que entra por la orilla de cada barra */
:root[data-fondo-vivo-app] [data-tour="sessions-sidebar"] { box-shadow: inset -1px 0 0 rgba(255,255,255,.08), inset -40px 0 60px -40px rgba(238,138,134,.28); }
:root[data-fondo-vivo-app] [data-slot="statusbar"] { border-top: 1px solid rgba(255,255,255,.08); }
/* elemento activo / hover del menu en vidrio coral */
:root[data-fondo-vivo-app] [data-slot="sidebar"] [data-active="true"],
:root[data-fondo-vivo-app] [data-slot="sidebar"] [aria-current="page"] { background: rgba(238,138,134,.20) !important; }
:root[data-fondo-vivo-app] [data-slot="sidebar"] input { background: rgba(255,255,255,.06); border-radius: 8px; }

/* vidrio esmerilado: crema cálida en claro, índigo profundo en oscuro */
[data-fondo-vivo] { --fv-glass: rgba(254,245,222,.72); --fv-glass-edge: rgba(255,255,255,.55); --fv-shadow: 0 10px 30px -14px rgba(58,71,146,.45); }
:root.dark [data-fondo-vivo] { --fv-glass: rgba(24,28,66,.70); --fv-glass-edge: rgba(143,220,207,.18); --fv-shadow: 0 12px 34px -12px rgba(10,12,40,.7); }
[data-fondo-vivo] [data-slot="aui_assistant-message-content"] {
  background: var(--fv-glass); border: 1px solid var(--fv-glass-edge); border-radius: 18px;
  padding: .85rem 1.1rem; box-shadow: var(--fv-shadow);
  backdrop-filter: blur(32px) saturate(1.5); -webkit-backdrop-filter: blur(32px) saturate(1.5);
}
/* burbuja del usuario: vidrio teñido de coral (el color del atardecer) */
[data-fondo-vivo] { --fv-user: rgba(246,179,162,.55); }
:root.dark [data-fondo-vivo] { --fv-user: rgba(124,60,90,.50); }
[data-fondo-vivo] [data-slot="aui_user-message-root"] [class*="border-(--ui-stroke-tertiary)"] {
  background: var(--fv-user) !important; border-color: var(--fv-glass-edge) !important; box-shadow: var(--fv-shadow);
  backdrop-filter: blur(32px) saturate(1.5); -webkit-backdrop-filter: blur(32px) saturate(1.5);
}
[data-fondo-vivo] [data-slot="composer-surface"] {
  backdrop-filter: blur(32px) saturate(1.5); -webkit-backdrop-filter: blur(32px) saturate(1.5);
}
[data-fondo-vivo] [data-slot="composer-surface"] {
  background: var(--fv-glass) !important; border-color: var(--fv-glass-edge) !important; box-shadow: var(--fv-shadow); border-radius: 22px;
}
[data-fondo-vivo] [data-slot="composer-surface"] > div[aria-hidden][class*="-z-10"] { background: transparent !important; }
[data-fondo-vivo] [data-slot="aui_assistant-message-content"] pre,
[data-fondo-vivo] [data-slot="aui_assistant-message-content"] table { background-color: color-mix(in srgb, var(--fv-glass) 70%, transparent); }
@media (prefers-reduced-motion: reduce) { .fv-layer video { display: none; } .fv-layer .fv-poster { opacity: 1 !important; filter: none; } }
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
  name: 'Fondo vivo',
  register(ctx) {
    let disposed = false, videoUrl = null, poster = ''
    const style = document.createElement('style')
    style.dataset.plugin = ID
    style.textContent = CSS
    document.head.appendChild(style)
    setAccentOverride(ACCENT)
    document.documentElement.setAttribute('data-fondo-vivo-app', '')

    const layers = new Set()
    function mount(surface) {
      if (surface.querySelector(':scope > .fv-layer')) return
      surface.setAttribute('data-fondo-vivo', '')
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
      layer.append(img, v, veil, grain)
      surface.prepend(layer)
      layers.add(layer)
      if (videoUrl) { v.src = videoUrl; v.play().catch(() => {}) }
    }
    const scan = () => document.querySelectorAll('[data-chat-surface]').forEach(mount)
    const mo = new MutationObserver(() => scan())
    mo.observe(document.body, { childList: true, subtree: true })
    scan()

    // ahorra GPU/CPU: pausa cuando la ventana no se ve
    const onVis = () => layers.forEach(l => { const v = l.querySelector('video'); if (!v || !v.src) return; document.hidden ? v.pause() : v.play().catch(() => {}) })
    document.addEventListener('visibilitychange', onVis)

    ;(async () => {
      try {
        const meta = await ctx.rest('/meta', { timeoutMs: 20000 })
        poster = meta.poster || ''
        if (meta.blur) document.documentElement.style.setProperty('--fv-blur', `url("${meta.blur}")`)
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
        console.warn('[fondo-vivo] no pude cargar el video', e)
      }
    })()

    ctx.onDispose(() => {
      disposed = true
      mo.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      layers.forEach(l => { const v = l.querySelector('video'); if (v) { v.pause(); v.removeAttribute('src'); v.load() } l.remove() })
      document.querySelectorAll('[data-fondo-vivo]').forEach(s => s.removeAttribute('data-fondo-vivo'))
      style.remove()
      document.documentElement.removeAttribute('data-fondo-vivo-app')
      document.documentElement.style.removeProperty('--fv-blur')
      setAccentOverride(null)
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    })
  }
}
