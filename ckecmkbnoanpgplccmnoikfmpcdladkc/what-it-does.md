1. `conf.min.js`

2. `content.min.js`

3. `content2.min.js`

4. `content3.min.js`

5. `content4.min.js`

6. `content5.min.js`

7. `content6.min.js`

8. `content10.min.js`

9. `content11.min.js`

10. `content13.min.js`

---

### 1. `conf.min.js`

**Role / Purpose:** Central configuration and policy definition file.

**Key behaviors & contents:**

* Defines constants for backend URLs (e.g. Securly cluster URLs) used by the extension.
* Contains flags and switches (e.g. debug mode, forced user email, logging toggles).
* Maintains a list/array of domains (e.g. `tabCheck`) that should be watched, filtered, or blocked (YouTube, TikTok, Roblox, Netflix, etc.).
* Possibly includes timing, thresholds, or whitelists/blacklists.
* Likely provides functions or global accessors for other scripts to read configuration.

**Integration & communication:**

* Other content scripts reference these global configurations to decide whether to activate or what behavior to apply.
* Acts as the “policy brain” for what should be monitored, blocked, allowed, or ignored.
* Does not itself perform monitoring or blocking, but serves as a shared policy source.

---

### 2. `content.min.js`

**Role / Purpose:** YouTube / video content monitoring.

**Key behaviors & contents:**

* Connects to a runtime port (e.g. `chrome.runtime.connect({ name: "yt" })`) to communicate with background logic.
* Uses DOM observation (e.g. `MutationObserver`) or title change detection to notice when the page navigates to a new video or channel, or when new video elements are loaded.
* Parses video meta-data: video ID, channel ID, perhaps category or other YouTube-specific info.
* Detects transitions (e.g. going from one video to another without full page reload).
* Sends that data via the port to the background logic so that rules can be applied (e.g. block certain videos, log them, restrict access).

**Integration & communication:**

* Works in tabs whose URL or domain corresponds to YouTube.
* Uses the config (from `conf.min.js`) to know whether YouTube is a monitored domain.
* Communicates with the background script via the `yt` port to enable the central logic to decide block / allow / log.

---

### 3. `content2.min.js`

**Role / Purpose:** Utility / DOM library (likely jQuery or custom DOM helper code).

**Key behaviors & contents:**

* Miniaturized (minified) library code for DOM traversal, query selection, events, manipulation.
* Provides APIs for `$(...)`, `.find()`, event bindings, etc. — used by other content scripts to simplify their DOM work.
* Handles browser compatibility, encapsulates common DOM operations.

**Integration & communication:**

* Other content scripts depend on this for interacting with the page’s DOM (e.g. finding elements, modifying or hiding parts).
* Does not itself perform monitoring or messaging; purely utility functions.

---

### 4. `content3.min.js`

**Role / Purpose:** Search engine / query monitoring.

**Key behaviors & contents:**

* Observes search engines (Google, Bing, Yahoo, and possibly YouTube searches).
* Monitors changes to document title or URL to detect when the user enters a search query.
* Parses out the search terms (keywords) from the URL or DOM (search result pages).
* Posts messages via runtime port (likely named `search_engine_parser` or similar) with data like `{ action: "sendSHResult", terms, url, etc. }`.
* Possibly flags or filters specific keywords or terms.

**Integration & communication:**

* Injected into tabs whose domain matches search engines.
* Uses the config (from `conf.min.js`) to know which search engines or terms to monitor or block.
* Reports queries to the background logic to decide whether to block, log, or alert.

---

### 5. `content4.min.js`

**Role / Purpose:** Google Maps / maps-based monitoring.

**Key behaviors & contents:**

* Connects to a runtime port (e.g. `gmaps`) for messaging.
* Watches changes to the document title or URL which reflect map queries (e.g. place search, directions).
* When the user interacts with Maps (searches for a place, moves the map, changes view), the script sends the new URL or query to background.
* Possibly extracts location names, coordinates, or addresses from the URL or the DOM.

**Integration & communication:**

* Active in tabs with Google Maps or map-related domains.
* Uses config to verify whether Maps activity should be tracked or blocked.
* Sends data to background logic for logging, filtering, or policy enforcement.

---

### 6. `content5.min.js`

**Role / Purpose:** Proxy / bypass detection (general).

**Key behaviors & contents:**

* Connects to a runtime port (e.g. `proxyDetection`).
* Runs checks (often repeatedly, e.g. via `setInterval`) for signatures of proxy or bypass services:

  * Checking script tags’ `src` attributes,
  * Inspecting iframes or embedded elements,
  * Looking for hostnames / paths commonly used by web proxies or VPN front ends.
* When detection is confirmed, it sends a message like `{ action: "proxyIdentified", data: { ... } }` to the background logic.

**Integration & communication:**

* Works across many domains, especially pages where a user might attempt to bypass filtering.
* Uses config to know which patterns to check or which hostnames to treat as suspect.
* Alerts central logic so the extension can block or log the bypass attempt.

---

### 7. `content6.min.js`

**Role / Purpose:** Google Meet / video-conference tracking.

**Key behaviors & contents:**

* Monitors the tab title or URL to detect if the current page is a Google Meet session (e.g. titles starting with “Meet – …”).
* If so, connects via a runtime port (e.g. `gmeet`) and posts message like `{ action: "getGoogleMeetUrl", url: window.location.href }`.
* This lets the extension track when a user joins, leaves, or interacts with Meet sessions.

**Integration & communication:**

* Triggered in tabs for Google Meet domain(s).
* The background/controller logic may decide whether to allow or restrict Meet access, or to log the session.
* Potentially used for compliance, logging, or real-time monitoring.

---

### 8. `content10.min.js`

**Role / Purpose:** Overlay / visual blocking enforcement.

**Key behaviors & contents:**

* Creates a full-page overlay element (a div that covers the viewport) with a high stacking order (z-index) to block visibility of the underlying page.
* When a page is to be blocked, it sets the overlay visible, hides or disables the underlying page (e.g. `contentVisibility = "hidden"`), stops media playback, disables scroll, etc.
* Possibly shows a “blocked” screen (logo, message, loading, or reason for block).
* Adjusts for themes (dark vs light mode) or responsive behavior.
* Ensures the overlay always stays on top, even if DOM changes.

**Integration & communication:**

* Activated when the central logic (background) triggers a block decision.
* Content scripts or background commands call functions in this module to enforce the block visually.
* The user cannot interact with the page until the overlay is removed.

---

### 9. `content11.min.js`

**Role / Purpose:** “I Need Help” / student well-being widget.

**Key behaviors & contents:**

* Injects a floating button or widget onto pages (e.g. “I need help” or similar).
* When clicked, opens a small UI / form for the student to submit a wellbeing or safety concern message.
* Handles user input and form submission.
* Sends communications via runtime ports (e.g. messages like `need-help-submitted`, `ctaClicked`, `closed`).
* May control when to show/hide the widget (depending on policy or page context).

**Integration & communication:**

* Works across many pages (except maybe blocked ones).
* The background logic receives the submitted data and may forward it to school admin systems or logs.
* Provides a user-facing interface integrated into webpages without needing a separate UI window.

---

### 10. `content13.min.js`

**Role / Purpose:** Advanced proxy / bypass detection (e.g. RammerHead) / signature checking.

**Key behaviors & contents:**

* Performs deeper scanning of scripts loaded in the page:

  * Fetches or reads external JS file(s) included in the page.
  * Computes or checks file hashes (e.g. SHA-256) against known signatures used by proxy / bypass tools (like RammerHead).
  * Alternatively, scans for unique code patterns (SVG strings, input placeholders, or text messages indicative of proxy pages).
* If a match is found, posts a message (via port like `rproxport`) indicating that a proxy bypass has been detected.
* This detects more sophisticated bypass methods that simple host or URL checks would not catch.

**Integration & communication:**

* Runs in pages where a user might attempt to use advanced proxies.
* Works together with `content5.min.js` (the more general proxy detector) for layered detection.
* Alerts background logic to enforce blocks or logging when advanced bypass is attempted.

---

## 📊 Summary Table (for Easy Reference)

| File               | Purpose / Role                    | Main Tasks / Behavior                                    | How It Communicates / Integrates           |
| ------------------ | --------------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| `conf.min.js`      | Configuration / Policy            | Defines URLs, domains to watch, flags                    | Read by all other scripts                  |
| `content.min.js`   | YouTube monitoring                | Detect video/channel navigation, extract metadata        | Port `yt` → background                     |
| `content2.min.js`  | DOM / Utility library             | Provides DOM / event helper functions                    | Used as support by other scripts           |
| `content3.min.js`  | Search query monitoring           | Detect search terms on Google, Bing, Yahoo, YouTube      | Port `search_engine_parser` → background   |
| `content4.min.js`  | Maps tracking                     | Monitor Google Maps activity (searches, movements)       | Port `gmaps` → background                  |
| `content5.min.js`  | Proxy / bypass detection          | Detect basic proxy/VPN usage patterns                    | Port `proxyDetection` → background         |
| `content6.min.js`  | Google Meet tracking              | Detect and report Meet session URL                       | Port `gmeet` → background                  |
| `content10.min.js` | Blocking overlay / UI enforcement | Show visual block screen, hide content, stop interaction | Activated by background or scripts         |
| `content11.min.js` | Well-being / “help” widget        | Inject widget, handle help submissions                   | Ports / messaging to background            |
| `content13.min.js` | Advanced bypass / proxy detection | Hash-check scripts, detect RammerHead / advanced proxies | Port `rproxport` (or similar) → background |

---
