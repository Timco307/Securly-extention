(function () {
  const $ = (id) => document.getElementById(id);

  const els = {
    refresh: $("btn-refresh"),
    copy: $("btn-copy"),
    filter: $("filter"),
    showAll: $("showAll"),
    status: $("status"),
    pillKeys: $("pill-keys"),
    pillSize: $("pill-size"),
    pillTime: $("pill-time"),
    keylist: $("keylist"),
    json: $("json"),
  };

  const DEFAULT_REGEX = /(policy|filter|config|user|list|settings)/i;

  function bytes(str) {
    return new Blob([str]).size;
  }

  function ts() {
    const d = new Date();
    return d.toLocaleString();
  }

  function setStatus(msg) {
    els.status.textContent = msg;
  }

  function renderDump(dump, matchedKeys) {
    const jsonStr = JSON.stringify(dump, null, 2);
    els.json.textContent = jsonStr;

    // pills
    els.pillKeys.textContent = `Keys: ${matchedKeys.length}`;
    els.pillSize.textContent = `JSON Size: ${bytes(jsonStr)} bytes`;
    els.pillTime.textContent = `Refreshed: ${ts()}`;

    // key list
    els.keylist.innerHTML = "";
    if (matchedKeys.length === 0) {
      const li = document.createElement("li");
      li.className = "muted";
      li.textContent = "No keys matched the filter.";
      els.keylist.appendChild(li);
    } else {
      for (const k of matchedKeys.sort()) {
        const li = document.createElement("li");
        li.textContent = k;
        els.keylist.appendChild(li);
      }
    }
  }

  async function readStorageAndRender() {
    try {
      if (!chrome?.storage?.local?.get) {
        setStatus("This page is not running as an extension page, or 'storage' permission is missing.");
        els.json.textContent = "";
        els.keylist.innerHTML = '<li class="muted">chrome.storage unavailable</li>';
        return;
      }

      setStatus("Reading chrome.storage.local …");
      const all = await chrome.storage.local.get(null);

      const showAll = !!els.showAll.checked;
      const filterText = els.filter.value.trim();
      const rx = showAll
        ? null
        : (filterText ? new RegExp(filterText, "i") : DEFAULT_REGEX);

      const keys = Object.keys(all);
      const matched = rx ? keys.filter(k => rx.test(k)) : keys.slice();

      const dump = {};
      for (const k of matched) dump[k] = all[k];

      renderDump(dump, matched);

      if (matched.length === 0) {
        setStatus("No matching keys in storage. Try enabling ‘Show all keys’ or broadening the filter.");
      } else {
        setStatus(`Loaded ${matched.length} key(s) from storage.`);
      }
    } catch (err) {
      setStatus(`Error: ${err?.message || err}`);
      els.json.textContent = "";
      els.keylist.innerHTML = '<li class="muted">Error</li>';
      console.error(err);
    }
  }

  async function copyJSON() {
    try {
      const text = els.json.textContent || "";
      if (!text.trim()) return setStatus("Nothing to copy.");
      await navigator.clipboard.writeText(text);
      setStatus("Copied JSON to clipboard.");
    } catch (e) {
      setStatus("Clipboard copy failed. Select the JSON and copy manually.");
    }
  }

  // Wire up
  document.addEventListener("DOMContentLoaded", () => {
    els.refresh.addEventListener("click", readStorageAndRender);
    els.copy.addEventListener("click", copyJSON);

    // Prefill filter with helpful default
    els.filter.value = DEFAULT_REGEX.source;

    // Optional: auto-load once on open
    readStorageAndRender();
  });
})();
