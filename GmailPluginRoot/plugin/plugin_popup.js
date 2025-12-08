const authorizeBtn = document.getElementById("authorize");
const statusEl = document.getElementById("status");

// --- Helper: update UI state ---
function setStatus(message, loading = false, disableBtn = false) {
  statusEl.innerHTML = loading
    ? `${message} <span class="spinner"></span>`
    : message;
  authorizeBtn.disabled = disableBtn;
}

// --- Check for stored token on popup load ---
chrome.storage.local.get("gmailToken", ({ gmailToken }) => {
  if (gmailToken) {
    // Verify that the token still works by calling a lightweight Gmail API
    fetch("https://www.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${gmailToken}` }
    })
      .then((res) => {
        if (res.ok) {
          setStatus("✅ Connected to Gmail");
          authorizeBtn.textContent = "Reconnect";
          authorizeBtn.disabled = false;
        } else {
          // token invalid → remove and reset UI
          chrome.storage.local.remove("gmailToken");
          setStatus("Please connect Gmail");
        }
      })
      .catch(() => {
        setStatus("Please connect Gmail");
      });
  } else {
    setStatus("Please connect Gmail");
  }
});

// --- Handle Connect / Reconnect button ---
authorizeBtn.addEventListener("click", () => {
  setStatus("Connecting...", true, true);

  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      setStatus("❌ Authorization failed. Try again.");
      console.error(chrome.runtime.lastError.message);
      authorizeBtn.disabled = false;
      return;
    }

    // Save token
    chrome.storage.local.set({ gmailToken: token }, () => {
      console.log("Token saved locally.");
      setStatus("✅ Connected to Gmail");
      authorizeBtn.textContent = "Reconnect";
      authorizeBtn.disabled = false;
    });
  });
});