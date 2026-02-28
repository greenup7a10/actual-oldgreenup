/* ===== Green Up — shared script (no-login, v15) ===== */

/** Site-wide “user” (always on) */
const DEFAULT_USER = "GREEN UP";

/** Display names (in case pages use the old map) */
const DISPLAY_NAMES = {
  "green up": "GREEN UP",
  greenup: "GREEN UP",
  greenup7a10: "GREEN UP",
  sontung: "GREEN UP",
  admin: "GREEN UP",
};

function $(sel, root = document) { return root.querySelector(sel); }
const stripZW = s => s.replace(/[\u200B-\u200D\uFEFF]/g, "");
const cleanUsername = s => stripZW((s || "").normalize("NFC").trim()).toLowerCase();

/* ---- Cookie helpers ---- */
const AUTH_COOKIE = "greenup_auth";
function setAuthCookie(on) {
  try {
    if (on) document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=31536000; samesite=lax`;
    else    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } catch (_) {}
}
function hasAuthCookie() {
  try { return /(?:^|;)\s*greenup_auth=true\b/.test(document.cookie); }
  catch(_) { return false; }
}

/* ---------- Auth shim (always-on guest) ---------- */
const Auth = {
  ensureGuest() {
    try {
      localStorage.setItem("greenup_auth", "true");
      sessionStorage.setItem("greenup_auth", "true");
      localStorage.setItem("greenup_user", DEFAULT_USER);
      sessionStorage.setItem("greenup_user", DEFAULT_USER);
      if (localStorage.getItem("greenup_count") == null) localStorage.setItem("greenup_count", "0");
      if (localStorage.getItem("streak_count") == null)  localStorage.setItem("streak_count", "0");
      setAuthCookie(true);
    } catch(_) {}
  },
  isAuthed() { return true; },
  user() { return DEFAULT_USER; },
  clear() {
    try {
      ["greenup_auth","greenup_user","greenup_count","streak_count"].forEach(k=>{
        localStorage.removeItem(k); sessionStorage.removeItem(k);
      });
    } catch(_) {}
    setAuthCookie(false);
  },
  get(key, fallback = null) {
    try { return localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? fallback; }
    catch(_) { return fallback; }
  },
  setBoth(key, val) {
    try {
      localStorage.setItem(key, String(val));
      sessionStorage.setItem(key, String(val));
    } catch(_) {}
  }
};

/* Ensure flags exist on every load */
Auth.ensureGuest();

/* --- Global “guard”: just send index -> frontpage, never block anything --- */
(function softRouter(){
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const isLogin = page === "" || page === "index.html" || page === "index.htm";
  if (isLogin) { location.replace("frontpage.html"); }
})();

/* ---------- Rank helpers (used to set avatar everywhere) ---------- */
function getLeafCountFallback() {
  const raw = Auth.get("greenup_count", "0");
  let n = parseInt(raw, 10);
  if (!isFinite(n)) n = 0;
  try {
    if (n === 0) {
      const bag = JSON.parse(localStorage.getItem("greenup_badges") || "{}");
      const derived = Object.keys(bag).length;
      n = Math.max(n, derived);
    }
  } catch (_) {}
  return n;
}
function rankFromLeaves(n) {
  if (n >= 30) return "earthsaver";
  if (n >= 22) return "tree";
  if (n >= 15) return "flower";
  if (n >= 11) return "plant";
  if (n >= 8)  return "sapling";
  if (n >= 4)  return "sprout";
  return "seed";
}
const RANK_IMG = {
  seed:"img/ranks/seed.png", sprout:"img/ranks/sprout.png",
  sapling:"img/ranks/sapling.png", plant:"img/ranks/plant.png",
  flower:"img/ranks/flower.png", tree:"img/ranks/tree.png",
  earthsaver:"img/ranks/earth-saver.png"
};
function setAvatarFromRank() {
  const leaves = getLeafCountFallback();
  const rank   = rankFromLeaves(leaves);
  const src    = RANK_IMG[rank] || "img/logo.png";
  document.querySelectorAll("img.avatar").forEach(img => {
    img.src = src;
    img.onerror = () => { img.src = "img/logo.png"; };
  });
}

/* ---------- STREAK ENGINE (shared) ---------- */
const LS_ENTRIES = "greenup_entries";
function loadEntries(){
  try { return JSON.parse(localStorage.getItem(LS_ENTRIES) || "[]"); }
  catch { return []; }
}
function computeStreak(entries){
  const days = new Set(
    entries.map(e => ((e && (e.when || e.date)) || "").toString().slice(0,10)).filter(Boolean)
  );
  if (days.size === 0) return 0;

  let count = 0;
  const d = new Date();
  for(;;){
    const key = d.toISOString().slice(0,10);
    if (days.has(key)) { count++; d.setDate(d.getDate() - 1); }
    else {
      if (count === 0) { // allow starting yesterday
        d.setDate(d.getDate() - 1);
        const yKey = d.toISOString().slice(0,10);
        if (days.has(yKey)) { count = 1; d.setDate(d.getDate() - 1); continue; }
      }
      break;
    }
  }
  return count;
}
function recomputeAndPersistStreak(){
  const s = computeStreak(loadEntries());
  Auth.setBoth("streak_count", s);
  return s;
}

/* ---------- UI boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // user menu (unchanged)
  const userTrigger = $("#userMenuBtn");
  const userMenu    = $("#userMenu");
  if (userTrigger && userMenu) {
    const closeMenu  = () => { userMenu.classList.remove("open"); userTrigger.setAttribute("aria-expanded","false"); };
    const toggleMenu = () => { const isOpen = userMenu.classList.toggle("open"); userTrigger.setAttribute("aria-expanded", String(isOpen)); };
    userTrigger.addEventListener("click", e => { e.stopPropagation(); toggleMenu(); });
    document.addEventListener("click", e => { if (!userMenu.contains(e.target) && !userTrigger.contains(e.target)) closeMenu(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
  }

  // haptics on call icon (unchanged)
  const telLink   = document.querySelector(".island-footer .tel");
  const phoneIcon = document.querySelector(".island-footer .phone-icon");
  function buzz(){ try{ if (navigator.vibrate) navigator.vibrate([30,40,30]); }catch(_){} }
  if (telLink)   { telLink.addEventListener("click", buzz);   telLink.addEventListener("touchstart", buzz, { passive:true }); }
  if (phoneIcon) { phoneIcon.addEventListener("click", buzz); phoneIcon.addEventListener("touchstart", buzz, { passive:true }); }

  // logout still “works”, but index immediately logs back in & forwards to frontpage
  const logoutBtn = $("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      Auth.clear();
      location.replace("index.html");
    });
  }

  // recompute streak on every page view
  const latestStreak = recomputeAndPersistStreak();

  // header counters + names
  const displayNameEl     = $("#displayName");
  const headerUsernameEl  = $("#headerUsername");
  const leafEl            = $("#leafCount");
  const streakEl          = $("#streakCount");

  const rawUser = DEFAULT_USER;
  const mapped  = DISPLAY_NAMES[cleanUsername(rawUser)] || DEFAULT_USER;

  if (displayNameEl)    displayNameEl.textContent = mapped;   // brand
  if (headerUsernameEl) headerUsernameEl.textContent = rawUser; // username

  const greenUps = parseInt(Auth.get("greenup_count","0"), 10);
  if (leafEl)   leafEl.textContent = isNaN(greenUps) ? 0 : greenUps;
  if (streakEl) streakEl.textContent = String(latestStreak || parseInt(Auth.get("streak_count","0"),10) || 0);

  // rank avatar everywhere
  setAvatarFromRank();

  // live refresh if another tab changes things
  window.addEventListener("storage", (e) => {
    if (e.key === LS_ENTRIES) {
      const s = recomputeAndPersistStreak();
      const el = $("#streakCount"); if (el) el.textContent = String(s);
    }
    if (e.key === "greenup_count" || e.key === "greenup_badges") {
      setAvatarFromRank();
      const leafEl2 = $("#leafCount");
      if (leafEl2) leafEl2.textContent = Auth.get("greenup_count","0") || "0";
    }
  });
});
