# full file list & what each does

### 1) `manifest.json` — the wiring diagram

Defines the extension’s permissions, background service worker, and which content scripts run on which sites (YouTube, Google Search, Google Meet, Maps, etc.). It maps:

* `securly.min.js` as the **background** (service worker)
* Content scripts and their match patterns:

  * `content.min.js` → YouTube
  * `content2.min.js` → Google Maps
  * `content3.min.js` → Google/Bing/Yahoo/YouTube search pages
  * `content4.min.js`, `content5.min.js` → `<all_urls>` (general observers / detection)
  * `content6.min.js` → Google Meet
  * `content7.min.js` → Securly geolocation page
  * `content8.min.js` → `<all_urls>` (early-running DOM tweaks/block helpers)
  * `content9.min.js` → runs on google.* only, injected on `https://*/*` (Google-scoped helper/detector)
  * `content10.min.js` → Google Chat (overlay/UX helper)
  * `content11.min.js` → `<all_urls>` (wellbeing widget) 

---

### 2) `securly.min.js` — the **background / service worker (core brain)**

The central controller that:

* Finds your **cluster URL** (`https://www.securly.com/crextn/...`), ties policies to your `userEmail`, and refreshes/updates lists (IWF/Non-CIPA).
* Brokers/decides whether to **allow, rewrite, or block** each navigation (safe-search forcing, Creative-Commons image filters, deny pages).
* Builds **blocked page URLs** with reason, policy, list type, user, extension version, and optionally **geo (lat/lng)**; pushes tab to `/blocked.html`.
* Runs an **offscreen geolocation loop** (alarms every ~5 min when enabled), stores status, and includes latency reporting.
* Maintains skip-lists/TTL for broker calls, performs cache invalidation & tab re-brokering, and sets Securly session cookies for Classroom. 

---

### 3) `content.min.js` — YouTube activity monitor

Injected on youtube domains at `document_start`. Watches SPA navigation/title changes, extracts page/video context, and coordinates with background via a runtime port (for policy, safe-search/cohort tweaks, block screen, etc.). (Mapped by the manifest to YouTube.) 

---

### 4) `content2.min.js` — bundled jQuery/DOM utilities

Minified **jQuery 3.6.0** (selection, traversal, events) used by other scripts for robust DOM work on complex, dynamic pages. 

---

### 5) `content3.min.js` — search-engine parser / search monitoring

Observes **Google/Bing/Yahoo/YouTube** search result pages by watching `<title>` and page sections; extracts the active **query** (and, on some engines, the top contextual answer box) and posts it to the extension via `search_engine_parser`. Also contains logic to **tweak YouTube** preview/search behaviors.

---

### 6) `content4.min.js` — Google Maps URL tracker

Watches the `<title>` for changes and, after a short delay, posts the **current Maps URL** to the background (`gmaps` port). Useful for recording map queries/places.

---

### 7) `content5.min.js` — generic proxy/bypass detector

Opens a `"proxyDetection"` port and repeatedly scans the DOM against a **config of target elements and fingerprints**. When a match is found, it emits `proxyIdentified` with the page origin and the action set that triggered (e.g., family vs fingerprinting). This is how the extension **detects web proxies/bypass pages** even when they aren’t obvious in the URL. 

---

### 8) `content6.min.js` — Google Meet detector

On load (with a 2s timeout), if the tab’s title contains `"Meet - "`, it posts the **meet URL** over a `"gmeet"` port so the background can log/enforce policy around video calls.

---

### 9) `content7.min.js` — geolocation helper (on Securly page)

Runs only on `*.securly.com/crextn/geoloc.html` per the manifest. It pairs with the background’s geolocation workflow; think of it as the **content-side** page that participates in location capture and update cadence. (Scope confirmed by manifest.) 

---

### 10) `content8.min.js` — early-running DOM/UX enforcement helper

Loads at `document_start` on `<all_urls>` (per manifest). In practice this is used for **fast UI interventions** before the page fully paints—e.g., hiding interactive widgets/games or preparing an overlay state for subsequent enforcement. (Exact behaviors vary across versions; scope confirmed by manifest.) 

---

### 11) `content9.min.js` — Google-scoped detector/helper

Runs only when the page is on `google.*` (manifest `include_globs: "https://www.google.*/*"`) but injected broadly (`https://*/*`). This one is used as a **Google-ecosystem specific detector/adjuster** (e.g., catching special UI/experiments or fingerprints unique to Google properties). 

---

### 12) `content10.min.js` — overlay / page-blocking UI

Implements the full-screen **Securly overlay** (`#securlyOverlay`) with ultra-high z-index, pauses `<video>` elements, hides content via `content-visibility: hidden`, and adapts to dark mode. This is the visual “blocked/holding” layer Securly shows to the user. 

---

### 13) `content11.min.js` — “I need help” (well-being) widget

Injects a floating **“I need help”** control, a small textarea form, and send/cancel CTAs. Submissions and UI clicks are messaged back to the extension (`well-path-widget` source) so admins receive student well-being pings. 

---

### 14) `content13.min.js` — advanced proxy signature checks

A more specialized detector (e.g., **RammerHead** and similar) that inspects scripts/assets for known **hash/pattern signatures** and reports hits to the background (a second layer beyond `content5`). Presence confirmed by the build hashes list; its role is the advanced/“smart” proxy check in this family. 

---

### 15) `blocked.html` — the local block page shell

The page shown to users when navigation is denied. It receives base64 query params for **site** and **category**; JS decodes and renders those. (See `blocked.js` below.) Presence & integrity in the build hash map. 

### 16) `blocked.js` — blocked page renderer

Simple client script that reads `?site=...&category=...` from the URL, **base64-decodes** them, and injects into `#site` and `#category` on the block page. 

---

### 17) `geolocation.js` — offscreen geolocation worker

Registered as an offscreen document target by the background. Listens for `{target:"offscreen", type:"get-geolocation"}` messages, calls `navigator.geolocation.getCurrentPosition`, deep-clones the `Position` object, and returns it to the background. This is how the extension **collects latitude/longitude** without UI jank. 

---

### 18) `webrtc.js` — internal IP (local network) probe

An offscreen worker that builds a `RTCPeerConnection` with **no ICE servers**, watches ICE candidates, and if it sees a **private RFC1918 address** (10/8, 172.16/12, 192.168/16) it returns it. The background pings it with `{target:"offscreen", type:"get-internal-ip"}` and gets back the LAN IP when available.

---

### 19) `computed_hashes.json` — release integrity map

A JSON list of **file paths → block hashes** (e.g., `Blockedbg_full.jpg`, `conf.min.js`, `content*.min.js`, `blocked.js`, etc.). This is essentially a **build integrity manifest** so you can prove the on-disk files match what the release produced. 

---

# how it all fits (quick map)

1. **Background (securly.min.js)** is the hub: it resolves your **cluster URL**, fetches per-org lists (IWF/Non-CIPA), enforces safe-search / CC image filters, decides **block vs allow**, and constructs **blocked page** URLs (with user, reason, policy, and optionally **geo**). 
2. **Content scripts** watch specific surfaces:

   * **YouTube** (`content.min.js`) 
   * **Search engines** (`content3.min.js`)
   * **Google Maps** (`content4.min.js`)
   * **Meet** (`content6.min.js`)
   * **Proxy/bypass** (`content5.min.js` + `content13.min.js`) 
   * **Overlay / UX** (`content10.min.js`) 
   * **Well-being UI** (`content11.min.js`) 
3. **Offscreen workers** provide **geolocation** (`geolocation.js`) and **internal IP** (`webrtc.js`) to background on demand. 
4. If blocked, background navigates to **`blocked.html` + `blocked.js`** to show reason/category and target. 

---

## tl;dr

* **Policy & decisions** live in the background (`securly.min.js`) with frequent list updates and a broker that evaluates each navigation. 
* **Sensors** (content scripts) observe activity on Search/YouTube/Maps/Meet and **detectors** hunt for proxies.     
* **Enforcement UI** is the overlay + blocked page; **help UI** is the wellbeing widget.   
* **Offscreen** modules quietly provide **location** and **LAN IP** signals. 
