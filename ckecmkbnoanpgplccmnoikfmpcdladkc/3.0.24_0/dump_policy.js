(async () => {
  try {
    // Securly caches its policy and config under various keys
    const all = await chrome.storage.local.get(null);

    // Find likely policy-related entries
    const possibleKeys = Object.keys(all).filter(k =>
      /policy|filter|config|user/i.test(k)
    );

    const dump = {};
    for (const key of possibleKeys) dump[key] = all[key];

    // Create a Blob and trigger download
    const blob = new Blob(
      [JSON.stringify(dump, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "policy.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Policy data dumped to policy.json", dump);
    alert("Policy data saved as policy.json (check your Downloads folder)");
  } catch (err) {
    console.error("Error dumping policy:", err);
    alert("Could not dump policy. Check the console for details.");
  }
})();
