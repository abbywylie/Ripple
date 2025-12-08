// === Ripple Gmail Plugin — Background Poller ===
// MV3 service worker (module)

const BACKEND_ENDPOINTS = ["http://127.0.0.1:5000/new-mail"];
const POLL_INTERVAL_MIN = 1;                 // alarm cadence
const LOOKBACK_SECONDS = 120;                // safety window to avoid misses
const STORAGE_KEYS = { LAST_CHECKED: "lastCheckedUnix", SEEN: "recentSeenIds" };
const SEEN_MAX = 500;                        // ring buffer size

// Install / startup: schedule the alarm and run once
chrome.runtime.onInstalled.addListener(() => {
  console.log("Ripple installed: scheduling Gmail poll…");
  chrome.alarms.create("pollGmail", { periodInMinutes: POLL_INTERVAL_MIN });
  pollGmail(); // run immediately once
});

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "pollGmail") pollGmail();
});

// Core poller
async function pollGmail() {
  try {
    const token = await getAccessToken();
    if (!token) return console.warn("No Gmail token; user not authorized yet.");

    const { lastCheckedUnix, recentSeenIds } = await getState();
    const now = Math.floor(Date.now() / 1000);
    // Use a small look-back to avoid races/misses
    const sinceUnix = Math.max(0, (lastCheckedUnix || now - LOOKBACK_SECONDS) - LOOKBACK_SECONDS);

    // 1) List message IDs since last check (paginate)
    const ids = await listMessageIds(token, sinceUnix);

    if (!ids.length) {
      await setState({ lastCheckedUnix: now }); // still advance the cursor
      console.log("No new messages.");
      return;
    }

    // 2) Filter out ones we’ve already processed
    const seen = new Set(recentSeenIds || []);
    const newIds = ids.filter((id) => !seen.has(id));
    if (!newIds.length) {
      await setState({ lastCheckedUnix: now });
      console.log("Only previously seen messages.");
      return;
    }

    console.log(`📬 Found ${newIds.length} candidate messages`);

    // 3) Fetch metadata for each and POST to backend(s)
    for (const id of newIds) {
      const meta = await getMessageMetadata(token, id);
      if (!meta) continue;

      const headers = Object.fromEntries(
        (meta.payload?.headers || []).map((h) => [h.name, h.value])
      );

      const payload = {
        id,
        threadId: meta.threadId,
        snippet: meta.snippet || "",
        subject: headers.Subject || "",
        from: headers.From || "",
        to: headers.To || "",
        date: headers.Date || "",
        // optional: lightweight plain-text body attempt
        body: await tryGetPlainTextBody(token, id)
      };

      console.log("📩", payload);
      await postToBackends(payload);

      // update dedupe buffer incrementally
      seen.add(id);
      if (seen.size > SEEN_MAX) {
        // trim oldest entries: convert to array, slice last SEEN_MAX
        const trimmed = Array.from(seen).slice(-SEEN_MAX);
        await setState({ recentSeenIds: trimmed });
      } else {
        await setState({ recentSeenIds: Array.from(seen) });
      }
    }

    // 4) Move the watermark forward
    await setState({ lastCheckedUnix: now });
  } catch (err) {
    console.error("Poll error:", err);
  }
}

// ---- Gmail helpers ----

async function listMessageIds(token, sinceUnix) {
  const base = "https://gmail.googleapis.com/gmail/v1/users/me/messages";
  const q = `after:${sinceUnix} label:INBOX`;
  let url = `${base}?q=${encodeURIComponent(q)}&maxResults=100`;

  const out = [];
  while (url) {
    const r = await gmailFetch(url, token);
    if (r?.messages?.length) out.push(...r.messages.map((m) => m.id));
    url = r?.nextPageToken ? `${base}?q=${encodeURIComponent(q)}&maxResults=100&pageToken=${r.nextPageToken}` : null;
  }
  return out;
}

async function getMessageMetadata(token, id) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`;
  return gmailFetch(url, token);
}

async function tryGetPlainTextBody(token, id) {
  try {
    const full = await gmailFetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
      token
    );
    const text = extractPlainText(full?.payload);
    return text || full?.snippet || "";
  } catch {
    return "";
  }
}

function extractPlainText(payload) {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeB64(payload.body.data);
  }
  if (payload.parts) {
    for (const p of payload.parts) {
      const t = extractPlainText(p);
      if (t) return t;
    }
  }
  return "";
}

function decodeB64(data) {
  try {
    return decodeURIComponent(escape(atob(data.replace(/-/g, "+").replace(/_/g, "/"))));
  } catch {
    return "";
  }
}

async function gmailFetch(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) {
    // token expired → try interactive refresh next poll
    console.warn("401 Unauthorized from Gmail API.");
    return null;
  }
  if (res.status === 429 || res.status >= 500) {
    console.warn(`Gmail API backoff: ${res.status}`);
    // simple soft backoff; the alarm cadence handles pacing
    return null;
  }
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Gmail API error ${res.status}: ${t}`);
  }
  return res.json();
}

// ---- Token handling ----

function getAccessToken() {
  // First try silent; if unsupported/expired, fall back to interactive
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, (t) => {
      if (chrome.runtime.lastError || !t) {
        chrome.identity.getAuthToken({ interactive: true }, (t2) => {
          if (chrome.runtime.lastError || !t2) {
            console.warn("Auth token unavailable:", chrome.runtime.lastError?.message);
            resolve(null);
          } else {
            resolve(t2);
          }
        });
      } else {
        resolve(t);
      }
    });
  });
}

// ---- Backend POST ----

async function postToBackends(msg) {
  for (const endpoint of BACKEND_ENDPOINTS) {
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg)
      });
      if (!r.ok) throw new Error(`status ${r.status}`);
      console.log(`✅ Posted to ${endpoint}`);
    } catch (e) {
      console.warn(`⚠️ Post failed to ${endpoint}:`, e.message);
    }
  }
}

// ---- State (storage) ----

async function getState() {
  const obj = await chrome.storage.local.get([STORAGE_KEYS.LAST_CHECKED, STORAGE_KEYS.SEEN]);
  return {
    lastCheckedUnix: obj[STORAGE_KEYS.LAST_CHECKED],
    recentSeenIds: obj[STORAGE_KEYS.SEEN] || []
  };
}

async function setState({ lastCheckedUnix, recentSeenIds }) {
  const patch = {};
  if (typeof lastCheckedUnix === "number") patch[STORAGE_KEYS.LAST_CHECKED] = lastCheckedUnix;
  if (Array.isArray(recentSeenIds)) patch[STORAGE_KEYS.SEEN] = recentSeenIds;
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);
}