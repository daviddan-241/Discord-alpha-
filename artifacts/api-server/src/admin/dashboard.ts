export const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Apex Auto-Poster — Control Panel</title>
<link rel="icon" type="image/svg+xml" href="/favicon.ico" />
<style>
  :root {
    --bg: #0b0d12;
    --panel: #11141b;
    --panel-2: #161a23;
    --border: #232838;
    --text: #e7ecf3;
    --muted: #8b94a7;
    --green: #22c55e;
    --red: #ef4444;
    --gold: #f1c40f;
    --purple: #9b5cf6;
    --accent: #7e22ce;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: var(--bg); color: var(--text);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  a { color: #8ab4ff; }
  header {
    padding: 22px 28px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, #131726 0%, #0b0d12 100%);
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  }
  header .brand {
    font-weight: 800; font-size: 22px; letter-spacing: 0.3px;
    background: linear-gradient(90deg, #c4b5fd, #f0abfc);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  header .pill {
    font-size: 12px; padding: 4px 10px; border-radius: 999px;
    background: #1f2334; color: var(--muted); border: 1px solid var(--border);
  }
  main { max-width: 1180px; margin: 0 auto; padding: 24px 20px 80px; }
  .grid { display: grid; gap: 20px; }
  .card {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 14px; padding: 18px 20px;
  }
  .card h2 {
    margin: 0 0 14px; font-size: 15px; letter-spacing: 0.3px;
    color: #cbd5e1; text-transform: uppercase;
  }
  .row { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
  @media (max-width: 720px) { .row { grid-template-columns: 1fr; } }
  label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 6px; }
  input[type="text"], input[type="url"] {
    width: 100%; background: #0d1018; border: 1px solid var(--border);
    color: var(--text); padding: 10px 12px; border-radius: 9px; font-family: inherit; font-size: 14px;
  }
  input[type="text"]:focus, input[type="url"]:focus {
    outline: none; border-color: #4f46e5;
  }
  button {
    cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600;
    border-radius: 9px; padding: 9px 14px; border: 1px solid var(--border);
    background: #1c2030; color: var(--text);
    transition: transform 0.05s ease, background 0.15s ease, border-color 0.15s ease;
  }
  button:hover { background: #232a3d; }
  button.primary { background: linear-gradient(135deg, #7e22ce, #d946ef); border-color: transparent; color: white; }
  button.primary:hover { filter: brightness(1.08); }
  button.success { background: var(--green); color: #062b13; border-color: transparent; }
  button.danger  { background: var(--red); color: #fff; border-color: transparent; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .channel {
    display: grid; grid-template-columns: 1fr; gap: 8px;
    padding: 14px; border: 1px solid var(--border); border-radius: 12px;
    background: var(--panel-2);
  }
  .channel-head {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }
  .channel-name {
    font-weight: 700; font-size: 14px;
  }
  .channel-tag { font-size: 11px; color: var(--muted); }
  .channel-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 11px; padding: 3px 8px; border-radius: 999px; border: 1px solid var(--border);
    color: var(--muted);
  }
  .badge.ok    { color: #86efac; border-color: #14532d; background: #052e16; }
  .badge.bad   { color: #fca5a5; border-color: #7f1d1d; background: #2d0606; }
  .badge.vip   { color: #e9d5ff; border-color: #6b21a8; background: #2e1065; }
  .toggle {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 10px 14px; border: 1px solid var(--border); border-radius: 10px;
    background: var(--panel-2);
  }
  .switch { position: relative; width: 42px; height: 22px; }
  .switch input { display: none; }
  .slider {
    position: absolute; inset: 0; background: #303749; border-radius: 999px;
    transition: 0.2s;
  }
  .slider::before {
    content: ""; position: absolute; height: 18px; width: 18px;
    left: 2px; top: 2px; background: white; border-radius: 50%; transition: 0.2s;
  }
  .switch input:checked + .slider { background: var(--green); }
  .switch input:checked + .slider::before { transform: translateX(20px); }
  .activity {
    max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;
  }
  .activity .item {
    display: grid; grid-template-columns: 80px 1fr; gap: 10px; align-items: center;
    padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--panel-2); font-size: 12.5px;
  }
  .activity .ts { color: var(--muted); font-variant-numeric: tabular-nums; }
  .channels-grid { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
  @media (max-width: 880px) { .channels-grid { grid-template-columns: 1fr; } }
  .help {
    font-size: 12.5px; line-height: 1.55; color: var(--muted);
    background: #0d1119; border: 1px dashed var(--border); padding: 12px 14px; border-radius: 10px;
  }
  .help b { color: #d8def0; }
  .footer-bar {
    display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
    margin: 14px 0 22px; padding: 14px;
    background: var(--panel); border: 1px solid var(--border); border-radius: 12px;
  }
  .stat { display:flex; flex-direction:column; padding: 8px 14px; }
  .stat b { font-size: 18px; }
  .stat span { color: var(--muted); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px; }
  .toast {
    position: fixed; bottom: 18px; right: 18px; padding: 12px 16px;
    border-radius: 10px; background: #1f2937; color: white; border: 1px solid #374151;
    opacity: 0; transform: translateY(8px); transition: 0.18s; pointer-events: none;
    max-width: 320px; font-size: 13px;
  }
  .toast.show { opacity: 1; transform: translateY(0); }
  .toast.ok { background: #052e16; border-color: #14532d; }
  .toast.bad { background: #2d0606; border-color: #7f1d1d; }
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(2, 4, 10, 0.72);
    display: none; align-items: center; justify-content: center; z-index: 50;
    padding: 20px;
  }
  .modal-overlay.show { display: flex; }
  .modal {
    background: var(--panel); border: 1px solid var(--border); border-radius: 14px;
    width: 100%; max-width: 640px; max-height: 86vh; overflow: hidden;
    display: flex; flex-direction: column;
  }
  .modal-head {
    padding: 14px 18px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 12px;
  }
  .modal-head h3 { margin: 0; font-size: 15px; }
  .modal-body {
    padding: 16px 18px; overflow-y: auto;
  }
  .modal-foot {
    padding: 12px 18px; border-top: 1px solid var(--border);
    display: flex; gap: 10px; justify-content: flex-end;
  }
  .embed {
    border-left: 4px solid var(--purple);
    background: #0d1018; border-radius: 6px;
    padding: 12px 14px; margin-top: 8px;
  }
  .embed-title { font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 6px; }
  .embed-desc { white-space: pre-wrap; font-size: 13px; line-height: 1.5; color: #cbd5e1; }
  .embed-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
  .embed-field b { display: block; font-size: 11.5px; color: #fff; }
  .embed-field span { font-size: 12.5px; color: var(--muted); white-space: pre-wrap; }
  .embed-img { margin-top: 10px; max-width: 100%; border-radius: 6px; border: 1px solid var(--border); }
  .embed-footer { font-size: 11.5px; color: var(--muted); margin-top: 10px; }
  .msg-content { white-space: pre-wrap; font-size: 13.5px; line-height: 1.55; color: var(--text); }
</style>
</head>
<body>
<header>
  <div class="brand">⚡ Apex Auto-Poster</div>
  <span class="pill" id="autoState">loading…</span>
  <span class="pill" id="schedulerState">scheduler: ?</span>
  <span class="pill" id="hookCount">0/19 webhooks</span>
</header>

<main>

  <section class="card" style="margin-bottom: 20px;">
    <h2>1 · Server settings</h2>
    <div class="row">
      <div>
        <label for="serverName">Server name (used in posts)</label>
        <input id="serverName" type="text" placeholder="Apex Alpha" />
      </div>
      <div>
        <label for="ownerHandle">Your DM handle (shown in image embeds)</label>
        <input id="ownerHandle" type="text" placeholder="@your_handle" />
      </div>
    </div>
    <div style="margin-top:12px;">
      <label for="ownerMention">Your Discord user mention (used in CTAs — actually pings you)</label>
      <input id="ownerMention" type="text" placeholder="&lt;@1035212407213133856&gt;" />
      <div class="help" style="margin-top:6px;">
        Right-click your name in Discord → <b>Copy User ID</b> → paste as <code>&lt;@THE_ID&gt;</code>.
        When set, "DM …" lines in posts become a real mention so users tap and DM you instantly.
      </div>
    </div>
    <div style="margin-top:12px;">
      <label for="publicBaseUrl">Public base URL (must be reachable from Discord — leave blank to auto-detect)</label>
      <input id="publicBaseUrl" type="url" placeholder="https://your-app.replit.app" />
      <div class="help" style="margin-top:8px;">
        Auto-detected: <b id="detectedUrl">…</b><br>
        Discord embeds image URLs from this base. After deploying, paste the deployment URL here.
      </div>
    </div>
    <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
      <button class="primary" id="saveSettings">Save settings</button>
      <div class="toggle">
        <span>Auto-posting</span>
        <label class="switch">
          <input type="checkbox" id="autoPost" />
          <span class="slider"></span>
        </label>
      </div>
    </div>
  </section>

  <section class="card" style="margin-bottom: 20px;">
    <h2>2 · How to wire up Discord webhooks</h2>
    <div class="help">
      For each Discord channel listed below:
      <br>1. In Discord → channel settings → <b>Integrations → Webhooks → New Webhook</b>.
      <br>2. Name it (e.g. "Apex Bot"), copy the webhook URL.
      <br>3. Paste it next to the matching channel here, click <b>Save</b>, then <b>Send test</b>.
      <br>Once you've pasted webhooks for the channels you want, flip <b>Auto-posting</b> ON above. Each channel posts on its own randomized schedule, so messages feel organic.
    </div>
  </section>

  <section class="card" style="margin-bottom: 20px;">
    <h2>3 · Channels</h2>
    <div class="footer-bar">
      <button class="primary" id="initInfo">Send welcome / rules / get-verified / bot-commands now</button>
      <button id="postAll">Force one post in every channel</button>
      <div style="flex:1"></div>
      <div class="stat"><b id="totalPosts">0</b><span>posts logged</span></div>
      <div class="stat"><b id="okRate">—</b><span>success rate</span></div>
    </div>
    <div class="channels-grid" id="channels"></div>
  </section>

  <section class="card">
    <h2>4 · Activity log</h2>
    <div class="activity" id="activity"></div>
  </section>

</main>

<div class="toast" id="toast"></div>

<div class="modal-overlay" id="previewModal">
  <div class="modal">
    <div class="modal-head">
      <h3 id="previewTitle">Preview</h3>
      <div style="flex:1"></div>
      <span class="badge" id="previewMeta"></span>
    </div>
    <div class="modal-body" id="previewBody"></div>
    <div class="modal-foot">
      <button id="previewRegen">Generate another</button>
      <button id="previewClose">Close</button>
    </div>
  </div>
</div>

<script>
const $ = (id) => document.getElementById(id);
let state = null;

function toast(msg, kind) {
  const el = $("toast");
  el.textContent = msg;
  el.className = "toast show " + (kind || "");
  setTimeout(() => el.classList.remove("show"), 2400);
}

async function api(path, opts) {
  const res = await fetch("/api" + path, {
    headers: { "content-type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

function fmtTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString();
}

function renderChannels() {
  const root = $("channels");
  root.innerHTML = "";
  for (const ch of state.channels) {
    const div = document.createElement("div");
    div.className = "channel";
    const cadence = ch.oneShot
      ? '<span class="badge vip">manual / one-shot</span>'
      : '<span class="badge">auto every ' + ch.minMinutes + '–' + ch.maxMinutes + 'm</span>';
    const hookBadge = ch.hasWebhook
      ? '<span class="badge ok">webhook ok ' + ch.webhookPreview + '</span>'
      : '<span class="badge bad">no webhook</span>';
    const last = ch.lastPost
      ? '<span class="badge ' + (ch.lastPost.ok ? "ok" : "bad") + '">last: ' + fmtTs(ch.lastPost.ts) + '</span>'
      : '<span class="badge">never posted</span>';
    div.innerHTML =
      '<div class="channel-head">' +
        '<span class="channel-name">' + ch.emoji + ' ' + ch.label + '</span>' +
        cadence + hookBadge + last +
      '</div>' +
      '<div class="channel-tag">' + ch.description + '</div>' +
      '<input type="url" placeholder="https://discord.com/api/webhooks/…" data-key="' + ch.key + '" />' +
      '<div class="channel-actions">' +
        '<button data-act="save" data-key="' + ch.key + '">Save</button>' +
        '<button data-act="clear" data-key="' + ch.key + '">Clear</button>' +
        '<button data-act="preview" data-key="' + ch.key + '">Preview</button>' +
        '<button class="primary" data-act="test" data-key="' + ch.key + '">Send now</button>' +
        (ch.oneShot ? '' : '<button data-act="burst" data-key="' + ch.key + '" title="Send 3 different posts spaced 6–14s apart">Burst ×3</button>') +
      '</div>';
    root.appendChild(div);
  }
  root.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", onChannelAction);
  });
}

function renderActivity() {
  const root = $("activity");
  root.innerHTML = "";
  if (!state.history.length) {
    root.innerHTML = '<div class="item"><div class="ts">—</div><div>No activity yet. Save a webhook and click <b>Send now</b> on a channel.</div></div>';
    return;
  }
  for (const h of state.history) {
    const item = document.createElement("div");
    item.className = "item";
    const tag = h.ok ? '✅' : '❌';
    item.innerHTML =
      '<div class="ts">' + new Date(h.ts).toLocaleTimeString() + '</div>' +
      '<div>' + tag + ' <b>' + h.channel + '</b> — ' + escapeHtml(h.message) + '</div>';
    root.appendChild(item);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
}

function renderTopBar() {
  $("autoState").textContent = "Auto: " + (state.autoPost ? "ON" : "OFF");
  $("autoState").style.color = state.autoPost ? "#86efac" : "#fca5a5";
  $("schedulerState").textContent = "Scheduler: " + (state.schedulerRunning ? "running" : "idle");
  const total = state.channels.length;
  const has = state.channels.filter((c) => c.hasWebhook).length;
  $("hookCount").textContent = has + "/" + total + " webhooks";
  $("totalPosts").textContent = state.history.length;
  const ok = state.history.filter((h) => h.ok).length;
  $("okRate").textContent = state.history.length ? Math.round((ok * 100) / state.history.length) + "%" : "—";
  $("autoPost").checked = state.autoPost;
  $("ownerHandle").value = state.ownerHandle || "";
  $("ownerMention").value = state.ownerMention || "";
  $("serverName").value = state.serverName || "";
  $("publicBaseUrl").value = state.publicBaseUrl || "";
  $("detectedUrl").textContent = state.detectedPublicBaseUrl || "(none — deploy first)";
}

async function refresh() {
  try {
    state = await api("/discord/state");
    renderTopBar();
    renderChannels();
    renderActivity();
  } catch (err) {
    toast("Failed to load state: " + err.message, "bad");
  }
}

async function onChannelAction(ev) {
  const btn = ev.currentTarget;
  const key = btn.dataset.key;
  const act = btn.dataset.act;
  const input = document.querySelector('input[data-key="' + key + '"]');
  btn.disabled = true;
  try {
    if (act === "save") {
      const url = input.value.trim();
      if (!url) { toast("Paste a webhook URL first", "bad"); return; }
      await api("/discord/webhook", { method: "POST", body: JSON.stringify({ channel: key, url }) });
      toast("Webhook saved for " + key, "ok");
      input.value = "";
      await refresh();
    } else if (act === "clear") {
      await api("/discord/webhook", { method: "POST", body: JSON.stringify({ channel: key, url: "" }) });
      toast("Webhook cleared", "ok");
      await refresh();
    } else if (act === "preview") {
      await openPreview(key);
    } else if (act === "test") {
      const out = await api("/discord/test", { method: "POST", body: JSON.stringify({ channel: key }) });
      if (out.ok) { toast("Sent to " + key, "ok"); }
      else { toast("Send failed: " + (out.error || "?"), "bad"); }
      await refresh();
    } else if (act === "burst") {
      toast("Burst started — 3 posts incoming over ~30s", "ok");
      const out = await api("/discord/burst", { method: "POST", body: JSON.stringify({ channel: key, count: 3 }) });
      const ok = (out.results || []).filter((r) => r.ok).length;
      toast("Burst done: " + ok + "/" + (out.results || []).length + " sent", ok ? "ok" : "bad");
      await refresh();
    }
  } catch (err) {
    toast("Error: " + err.message, "bad");
  } finally {
    btn.disabled = false;
  }
}

let activePreviewKey = null;

async function openPreview(key) {
  activePreviewKey = key;
  const ch = state && state.channels.find((c) => c.key === key);
  $("previewTitle").textContent = "Preview · " + (ch ? ch.emoji + " " + ch.label : key);
  $("previewMeta").textContent = ch
    ? (ch.oneShot ? "manual / one-shot" : "auto " + ch.minMinutes + "–" + ch.maxMinutes + "m")
    : "";
  $("previewBody").innerHTML = '<div class="msg-content">Generating sample…</div>';
  $("previewModal").classList.add("show");
  await loadPreview(key);
}

async function loadPreview(key) {
  try {
    const out = await api("/discord/preview", { method: "POST", body: JSON.stringify({ channel: key }) });
    if (!out.ok) throw new Error(out.error || "preview failed");
    $("previewBody").innerHTML = renderPayload(out.payload);
  } catch (err) {
    $("previewBody").innerHTML = '<div class="msg-content" style="color:#fca5a5">Error: ' + escapeHtml(err.message) + '</div>';
  }
}

function renderPayload(p) {
  if (!p || typeof p !== "object") return '<div class="msg-content">(empty)</div>';
  let html = "";
  if (p.username) {
    html += '<div class="msg-content" style="color:var(--muted)">as <b style="color:#fff">' + escapeHtml(p.username) + '</b></div>';
  }
  if (p.content) {
    html += '<div class="msg-content" style="margin-top:6px">' + escapeHtml(p.content) + '</div>';
  }
  const embeds = Array.isArray(p.embeds) ? p.embeds : [];
  for (const e of embeds) {
    html += '<div class="embed">';
    if (e.title) html += '<div class="embed-title">' + escapeHtml(e.title) + '</div>';
    if (e.description) html += '<div class="embed-desc">' + escapeHtml(e.description) + '</div>';
    if (Array.isArray(e.fields) && e.fields.length) {
      html += '<div class="embed-fields">';
      for (const f of e.fields) {
        html += '<div class="embed-field"><b>' + escapeHtml(f.name || "") + '</b><span>' + escapeHtml(f.value || "") + '</span></div>';
      }
      html += '</div>';
    }
    if (e.image && e.image.url) {
      html += '<img class="embed-img" src="' + escapeAttr(e.image.url) + '" alt="" onerror="this.style.display=\\'none\\'" />';
    }
    if (e.footer && e.footer.text) {
      html += '<div class="embed-footer">' + escapeHtml(e.footer.text) + '</div>';
    }
    html += '</div>';
  }
  if (!p.content && embeds.length === 0) {
    html += '<div class="msg-content" style="color:var(--muted)">(no content / embeds)</div>';
  }
  return html;
}

function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

$("saveSettings").addEventListener("click", async () => {
  try {
    await api("/discord/config", {
      method: "POST",
      body: JSON.stringify({
        ownerHandle: $("ownerHandle").value.trim(),
        ownerMention: $("ownerMention").value.trim(),
        serverName: $("serverName").value.trim() || "Apex Alpha",
        publicBaseUrl: $("publicBaseUrl").value.trim(),
      }),
    });
    toast("Saved", "ok");
    await refresh();
  } catch (err) { toast("Save failed: " + err.message, "bad"); }
});

$("autoPost").addEventListener("change", async (ev) => {
  try {
    await api("/discord/config", { method: "POST", body: JSON.stringify({ autoPost: ev.target.checked }) });
    toast("Auto-posting " + (ev.target.checked ? "ON" : "OFF"), "ok");
    await refresh();
  } catch (err) { toast("Failed: " + err.message, "bad"); }
});

$("initInfo").addEventListener("click", async () => {
  for (const k of ["welcome", "rules", "get_verified", "bot_commands"]) {
    try {
      const out = await api("/discord/test", { method: "POST", body: JSON.stringify({ channel: k }) });
      if (!out.ok) toast(k + " failed: " + (out.error || ""), "bad");
    } catch (err) { toast(k + " error", "bad"); }
  }
  toast("Sent welcome / rules / get-verified / bot-commands", "ok");
  await refresh();
});

$("postAll").addEventListener("click", async () => {
  try {
    const out = await api("/discord/post-all", { method: "POST" });
    const ok = out.results.filter((r) => r.ok).length;
    toast("Posted " + ok + "/" + out.results.length + " channels", ok ? "ok" : "bad");
    await refresh();
  } catch (err) { toast("Bulk send failed: " + err.message, "bad"); }
});

$("previewClose").addEventListener("click", () => {
  $("previewModal").classList.remove("show");
  activePreviewKey = null;
});
$("previewModal").addEventListener("click", (ev) => {
  if (ev.target === $("previewModal")) {
    $("previewModal").classList.remove("show");
    activePreviewKey = null;
  }
});
$("previewRegen").addEventListener("click", async () => {
  if (!activePreviewKey) return;
  $("previewBody").innerHTML = '<div class="msg-content">Generating sample…</div>';
  await loadPreview(activePreviewKey);
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    $("previewModal").classList.remove("show");
    activePreviewKey = null;
  }
});

refresh();
setInterval(refresh, 15000);
</script>
</body>
</html>`;
