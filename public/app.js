// Wattbeat Energy 2025 - Vercel + Supabase version
// Highscores are stored in Supabase and can be shared socially

const $ = (id) => document.getElementById(id);

// --------- Session & Nickname Management ----------
function getSessionId() {
  let id = localStorage.getItem('wattbeat_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('wattbeat_session', id);
  }
  return id;
}

function getNickname() {
  return localStorage.getItem('wattbeat_nickname') || '';
}

function setNickname(name) {
  const sanitized = (name || '').trim().slice(0, 20);
  localStorage.setItem('wattbeat_nickname', sanitized);
  return sanitized;
}

// --------- Leaderboard API ----------
async function fetchLeaderboard(difficulty = 0, limit = 50) {
  try {
    const res = await fetch(`/api/scores?difficulty=${difficulty}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return await res.json();
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    return { scores: [], error: err.message };
  }
}

async function submitScore(score, difficulty, nickname) {
  const sessionId = getSessionId();
  if (!sessionId) return { error: 'No session ID' };
  
  try {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        nickname: nickname || 'Anonymous',
        score: Math.floor(score),
        difficulty: difficulty
      })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit score');
    }
    
    return await res.json();
  } catch (err) {
    console.error('Score submit error:', err);
    return { error: err.message };
  }
}

async function getPlayerRank(difficulty, score) {
  try {
    const res = await fetch(`/api/scores?difficulty=${difficulty}&score=${score}&action=rank`);
    if (!res.ok) throw new Error('Failed to get rank');
    return await res.json();
  } catch (err) {
    console.error('Rank fetch error:', err);
    return { rank: null, error: err.message };
  }
}

// --------- Share URL Generation ----------
function getShareUrl(score, rank, difficulty, nickname) {
  const base = window.location.origin;
  const params = new URLSearchParams({
    score: String(Math.floor(score)),
    rank: String(rank || 0),
    difficulty: String(difficulty),
    nickname: nickname || 'Anonymous'
  });
  return `${base}/?${params.toString()}`;
}

function getOgImageUrl(score, rank, difficulty, nickname) {
  const base = window.location.origin;
  const params = new URLSearchParams({
    score: String(Math.floor(score)),
    rank: String(rank || 0),
    difficulty: String(difficulty),
    nickname: nickname || 'Anonymous'
  });
  return `${base}/api/og?${params.toString()}`;
}

// --------- Social Sharing ----------
const DIFFICULTY_NAMES = ['Easy', 'Normal', 'Hard'];

function getShareText(score, rank, difficulty, nickname) {
  const diffName = DIFFICULTY_NAMES[difficulty] || 'Unknown';
  const rankText = rank ? `#${rank}` : '';
  
  const messages = [
    `I scored ${score} points on Wattbeat Energy 2025 ${diffName} mode! ${rankText ? `Ranked ${rankText} globally!` : ''} Can you beat me? ⚡🚀`,
    `Just flew through 2025 electricity prices and scored ${score}! ${rankText ? `I'm ${rankText} on the ${diffName} leaderboard!` : ''} ⚡🎮`,
    `${score} points navigating volatile energy markets in Wattbeat! ${rankText ? `${rankText} worldwide on ${diffName}!` : ''} Think you can do better? 🔥`,
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

function shareToTwitter(score, rank, difficulty, nickname, url) {
  const text = getShareText(score, rank, difficulty, nickname);
  const twitterUrl = new URL('https://twitter.com/intent/tweet');
  twitterUrl.searchParams.set('text', text);
  twitterUrl.searchParams.set('url', url);
  window.open(twitterUrl.toString(), '_blank', 'width=550,height=420');
}

function shareToLinkedIn(url) {
  const linkedInUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
  linkedInUrl.searchParams.set('url', url);
  window.open(linkedInUrl.toString(), '_blank', 'width=550,height=420');
}

function shareToFacebook(url) {
  const fbUrl = new URL('https://www.facebook.com/sharer/sharer.php');
  fbUrl.searchParams.set('u', url);
  window.open(fbUrl.toString(), '_blank', 'width=550,height=420');
}

function shareToReddit(score, rank, difficulty, nickname, url) {
  const title = getShareText(score, rank, difficulty, nickname);
  const redditUrl = new URL('https://www.reddit.com/submit');
  redditUrl.searchParams.set('url', url);
  redditUrl.searchParams.set('title', title);
  window.open(redditUrl.toString(), '_blank', 'width=550,height=420');
}

async function copyToClipboard(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (e) {
      return false;
    } finally {
      textArea.remove();
    }
  }
}

async function nativeShare(score, rank, difficulty, nickname, url) {
  if (!navigator.share) return false;
  
  try {
    await navigator.share({
      title: 'Wattbeat Energy 2025',
      text: getShareText(score, rank, difficulty, nickname),
      url: url
    });
    return true;
  } catch (err) {
    if (err.name !== 'AbortError') console.error('Share failed:', err);
    return false;
  }
}

function canNativeShare() {
  return typeof navigator.share === 'function';
}
const canvas = $("c");
const ctx = canvas.getContext("2d", { alpha: false });

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function safeSpawnY(level, px, x, H) {
  // Spawn at tunnel centerline at the player's x position (worldX = x + px)
  if (!level) return H * 0.5;
  const colPerPx = 0.5;
  const worldX = x + px;
  const idx = clamp(Math.floor(worldX * colPerPx), 0, level.topY.length - 1);
  const top = level.topY[idx];
  const bot = level.botY[idx];
  const center = (top + bot) * 0.5;
  const margin = 14; // keep away from walls
  return clamp(center, top + margin, bot - margin);
}

// --------- Season calendar mapping (fixed 2025) ----------
const SEASON_START = new Date(2025, 0, 1);
const SEASON_END = new Date(2025, 11, 31);
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  return Math.floor(diff / 86400000);
}
function isoWeekNumber(d) {
  // ISO week date weeks start on Monday
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}
function seasonDateFromProgress(f) {
  // f in [0..1]
  const start = SEASON_START.getTime();
  const end = SEASON_END.getTime();
  const t = start + clamp(f,0,1) * (end - start);
  return new Date(t);
}


function median(arr) {
  if (!arr.length) return NaN;
  const s = [...arr].sort((a,b)=>a-b);
  const m = (s.length-1)/2;
  return (s[Math.floor(m)] + s[Math.ceil(m)]) / 2;
}
function mad(arr, med) {
  const dev = arr.map(x => Math.abs(x - med));
  return median(dev);
}
function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base+1] === undefined) return sorted[base];
  return sorted[base] + rest * (sorted[base+1] - sorted[base]);
}
function movingAverage(arr, w) {
  const out = new Array(arr.length);
  let sum = 0;
  for (let i=0;i<arr.length;i++) {
    sum += arr[i];
    if (i>=w) sum -= arr[i-w];
    const denom = Math.min(i+1, w);
    out[i] = sum / denom;
  }
  return out;
}
function rollingStd(arr, w) {
  const out = new Array(arr.length);
  let sum=0, sum2=0;
  for (let i=0;i<arr.length;i++) {
    const x = arr[i];
    sum += x; sum2 += x*x;
    if (i>=w) {
      const y = arr[i-w];
      sum -= y; sum2 -= y*y;
    }
    const denom = Math.min(i+1, w);
    const mean = sum/denom;
    const varr = Math.max(0, (sum2/denom) - mean*mean);
    out[i] = Math.sqrt(varr);
  }
  return out;
}
async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1400);
}

// --------- Progression (local) ----------
// Everyone starts on Easy. Finish the full year to unlock the next mode.
const PROG_KEY = "wattbeat_energy2025_unlocked"; // stores max unlocked difficulty (0..2)
function getUnlockedDifficulty() {
  const v = parseInt(localStorage.getItem(PROG_KEY) || "0", 10);
  return Number.isFinite(v) ? clamp(v, 0, 2) : 0;
}
function setUnlockedDifficulty(v) {
  localStorage.setItem(PROG_KEY, String(clamp(v, 0, 2)));
}


// --------- Theme (deterministic per level) ----------
function hexToSeed(hex) {
  // Use first 16 hex chars -> 64-bit-ish number in JS safe range via BigInt
  try {
    const h = (hex || "0").slice(0, 16);
    return Number(BigInt("0x" + h) % BigInt(2**53 - 1));
  } catch {
    let s = 0;
    for (let i=0;i<(hex||"").length;i++) s = (s*31 + hex.charCodeAt(i)) >>> 0;
    return s;
  }
}
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
function hsl(h, s, l, a=1) { return `hsla(${h} ${s}% ${l}% / ${a})`; }
function computeTheme(levelHash, stats) {
  const seed = hexToSeed(levelHash);
  const rnd = mulberry32(seed || 1);

  // Base hue changes per level; volatility shifts saturation/contrast
  const baseHue = Math.floor(rnd()*360);
  const vol = clamp((stats?.volAvg ?? 0.25), 0, 1);
  const sat = Math.floor(48 + vol*34);      // 48..82
  const sat2 = Math.floor(30 + vol*28);     // 30..58
  const deep = Math.floor(6 + rnd()*6);     // 6..12 (darkness)
  const lift = Math.floor(14 + rnd()*10);   // 14..24
  const accentHue = (baseHue + 40 + Math.floor(rnd()*80)) % 360;
  const accent2Hue = (baseHue + 180 + Math.floor(rnd()*60)) % 360;

  return {
    seed,
    baseHue,
    accentHue,
    accent2Hue,
    bgTop: hsl(baseHue, sat2, deep, 1),
    bgBot: hsl((baseHue+30)%360, sat2, deep+lift, 1),
    tunnelFill: hsl((baseHue+12)%360, Math.floor(sat2*0.9), 10+Math.floor(lift*0.6), 1),
    lineMain: hsl(accentHue, sat, 58, 0.95),
    lineSoft: hsl(accentHue, sat, 68, 0.25),
    lineAlt:  hsl(accent2Hue, sat, 60, 0.55),
    ballCore: hsl(accentHue, sat, 72, 1),
    ballEdge: hsl(accent2Hue, sat, 58, 1),
    hud: hsl((baseHue+200)%360, 22, 86, 0.95),
    vignette: hsl(baseHue, sat2, 8, 0.55),
  };
}
function reactiveTheme(baseTheme, local, monthIndex=0) {
  // local: { d: [-1..1], v: [0..1], pulse: [0..1] }
  const t = baseTheme;
  if (!t) return null;
  const d = clamp(local?.d ?? 0, -1, 1);
  const v = clamp(local?.v ?? 0, 0, 1);
  const pulse = clamp(local?.pulse ?? 0, 0, 1);

  // Hue shift with derivative sign, intensity with volatility
  const hueShift = (d * 18) + (pulse * 8);
  const satBoost = Math.floor(v * 12 + pulse * 10);   // 0..22
  const lightBoost = Math.floor(pulse * 6 + Math.abs(d)*4);

  const monthHue = (monthIndex * 28) % 360; // clear monthly shift
  const h1 = (monthHue + (t.baseHue*0.25) + hueShift + 360) % 360;
  const hA = (t.accentHue + hueShift*1.2 + 360) % 360;
  const hB = (t.accent2Hue - hueShift*0.8 + 360) % 360;

  return {
    ...t,
    // overwrite select colors reactively
    bgTop: hsl(h1, 30 + satBoost, 7, 1),
    bgBot: hsl((h1+28)%360, 28 + satBoost, 18 + lightBoost, 1),
    tunnelFill: hsl((h1+10)%360, 26 + satBoost, 12 + lightBoost, 1),
    lineMain: hsl(hA, 62 + satBoost, 58 + lightBoost, 0.98),
    lineSoft: hsl(hA, 62 + satBoost, 70 + lightBoost, 0.18 + v*0.25 + pulse*0.20),
    lineAlt:  hsl(hB, 56 + satBoost, 60 + lightBoost, 0.35 + v*0.25),
    ballCore: hsl(hA, 68 + satBoost, 76, 1),
    ballEdge: hsl(hB, 62 + satBoost, 60, 1),
    hud: hsl((h1+200)%360, 22 + Math.floor(satBoost*0.3), 88, 0.95),
    // effect scalars for drawing
    glowWidth: 4 + v*6 + pulse*6,
    starAlphaMul: 0.6 + pulse*0.8,
  };
}

function buildStarfield(theme, W, H) {
  const rnd = mulberry32((theme?.seed ?? 1) ^ 0xA5A5A5A5);
  const count = Math.floor(90 + rnd()*120); // 90..210
  const stars = [];
  for (let i=0;i<count;i++) {
    const x = rnd()*W;
    const y = rnd()*H;
    const r = 0.6 + rnd()*1.6;
    const a = 0.25 + rnd()*0.55;
    const tw = rnd()*Math.PI*2;
    stars.push({x,y,r,a,tw});
  }
  return stars;
}

// --------- Fireworks (finish celebration) ----------
function spawnFireworks(state, intensity=1) {
  state.fw = state.fw || { particles: [], t0: performance.now(), active: true, intensity };
  const W = $("wrap").clientWidth;
  const H = $("wrap").clientHeight;
  const theme = state.theme;
  const baseHue = theme ? theme.accentHue : 200;
  const bursts = Math.floor(3 + intensity * 3);
  for (let b=0;b<bursts;b++) {
    const cx = W * (0.25 + Math.random()*0.5);
    const cy = H * (0.2 + Math.random()*0.4);
    const n = Math.floor(80 + intensity*90);
    const hue = (baseHue + b*35 + Math.random()*30) % 360;
    for (let i=0;i<n;i++) {
      const a = Math.random()*Math.PI*2;
      const sp = (90 + Math.random()*220) * (0.8 + intensity*0.4);
      state.fw.particles.push({
        x: cx, y: cy,
        vx: Math.cos(a)*sp,
        vy: Math.sin(a)*sp,
        life: 900 + Math.random()*700,
        born: performance.now(),
        hue,
        size: 1.2 + Math.random()*1.8,
      });
    }
  }
}
function stepFireworks(state, dt) {
  if (!state.fw || !state.fw.active) return;
  const W = $("wrap").clientWidth;
  const H = $("wrap").clientHeight;
  const g = 240; // gravity
  const drag = 0.985;
  const now = performance.now();
  state.fw.particles = state.fw.particles.filter(p => (now - p.born) < p.life);
  for (const p of state.fw.particles) {
    p.vx *= drag;
    p.vy = p.vy * drag + g*dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  if (state.fw.particles.length === 0 && (now - state.fw.t0) > 2200) {
    state.fw.active = false;
  }
}
function drawFireworks(state, ctx, W, H) {
  if (!state.fw || !state.fw.active) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const p of state.fw.particles) {
    const age = performance.now() - p.born;
    const t = clamp(age / p.life, 0, 1);
    const a = (1 - t) * 0.9;
    ctx.fillStyle = `hsla(${p.hue} 80% 65% / ${a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
  // Text is now drawn in the main draw() function for better layout
}


// --------- CSV parsing ----------
function parseDateCET(raw) {
  const s = raw.replace(/[\[\]]/g,"").trim();
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  const dd = +m[1], mm = +m[2], yyyy = +m[3], HH=+m[4], MM=+m[5];
  return new Date(yyyy, mm-1, dd, HH, MM, 0, 0);
}
function splitCSVLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i=0;i<line.length;i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) { out.push(cur); cur=""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  if (lines.length < 3) throw new Error("CSV too short");
  const header = splitCSVLine(lines[0]);
  const dateIdx = header.findIndex(h => h.trim() === "Date (CET)");
  const priceIdx = header.findIndex(h => h.trim() === "DA HR Price (EPEX)");
  if (dateIdx < 0 || priceIdx < 0) throw new Error("Required columns not found.");

  const rows = [];
  for (let i=2;i<lines.length;i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length <= Math.max(dateIdx, priceIdx)) continue;
    const d = parseDateCET(cols[dateIdx]);
    const p = parseFloat((cols[priceIdx] || "").replace(",", "."));
    if (!d || !Number.isFinite(p)) continue;
    rows.push({ t: d, p });
  }
  rows.sort((a,b)=>a.t-b.t);
  return rows;
}

// --------- Level generation ----------
async function generateLevel(prices, H, N, diff) {
  const p = prices.filter(Number.isFinite);
  if (p.length < 48) throw new Error("Range too small; pick a larger range.");

  const s = [...p].sort((a,b)=>a-b);
  const p2 = quantile(s, 0.02);
  const p98 = quantile(s, 0.98);
  const clip = p.map(x => clamp(x, p2, p98));

  const ps = movingAverage(clip, 6);

  const med = median(ps);
  const m = mad(ps, med) + 1e-9;
  let z = ps.map(x => (x - med) / (m * 1.4826));
  z = z.map(v => clamp(v, -3, 3) / 3);

  const dif = new Array(clip.length);
  dif[0] = 0;
  for (let i=1;i<clip.length;i++) dif[i] = clip[i] - clip[i-1];
  const vol = rollingStd(dif, 12);
  const vmin = Math.min(...vol);
  const vmax = Math.max(...vol);
  const vn = vol.map(v => (v - vmin) / (vmax - vmin + 1e-9));

  // ========== VOLATILITY-BASED STRETCHING ==========
  // High volatility sections get stretched horizontally, giving more time to react.
  // This preserves the visual representation while making the game playable.
  
  // Step 1: Calculate stretch factor for each source column
  // Higher volatility = more stretch (takes more tunnel columns)
  const stretchFactor = new Float32Array(z.length);
  const stretchBase = diff === 0 ? 2.5 : diff === 2 ? 1.5 : 2.0; // How much to stretch volatile sections
  for (let i = 0; i < z.length; i++) {
    // Stretch factor: 1.0 for calm sections, up to stretchBase for volatile sections
    stretchFactor[i] = 1.0 + (stretchBase - 1.0) * Math.pow(vn[i], 1.5); // Power curve for emphasis
  }
  
  // Step 2: Build cumulative stretch map (integral of stretch factors)
  const cumStretch = new Float32Array(z.length + 1);
  cumStretch[0] = 0;
  for (let i = 0; i < z.length; i++) {
    cumStretch[i + 1] = cumStretch[i] + stretchFactor[i];
  }
  const totalStretch = cumStretch[z.length];
  
  // Step 3: For each tunnel column, find the corresponding source position
  // using the non-linear stretch mapping
  const zR = new Float32Array(N);
  const vnR = new Float32Array(N);
  const dR = new Float32Array(N);
  
  for (let i = 0; i < N; i++) {
    // Target position in stretched space (0 to totalStretch)
    const targetStretch = (i / (N - 1)) * totalStretch;
    
    // Binary search to find source position
    let lo = 0, hi = z.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (cumStretch[mid] <= targetStretch) lo = mid;
      else hi = mid - 1;
    }
    
    // Interpolate within the found segment
    const segStart = cumStretch[lo];
    const segEnd = cumStretch[lo + 1] || cumStretch[lo] + 1;
    const segLen = segEnd - segStart;
    const u = segLen > 0 ? (targetStretch - segStart) / segLen : 0;
    
    const a = lo;
    const b = Math.min(z.length - 1, lo + 1);
    
    zR[i] = lerp(z[a], z[b], u);
    vnR[i] = lerp(vn[a], vn[b], u);
    const da = dif[a] || 0;
    const db = dif[b] || 0;
    dR[i] = lerp(da, db, u);
  }

  // Difficulty multipliers - with stretching in place, we can be tighter
  // Easy: 30% wider, Normal: 15% wider, Hard: 5% tighter
  const diffMul = diff === 0 ? 1.30 : diff === 2 ? 0.95 : 1.15;

  // Original tunnel (may have impossible gaps)
  const origTopY = new Float32Array(N);
  const origBotY = new Float32Array(N);
  // Expanded tunnel (always playable)
  const topY = new Float32Array(N);
  const botY = new Float32Array(N);
  // Danger level per column (0 = safe, 1 = was maximally tight)
  const danger = new Float32Array(N);

  const base = H * 0.50;
  const A = H * 0.18;

  const gapMax = H * 0.34 * diffMul;
  const gapMin = H * 0.16 * diffMul;
  
  // ========== FIX #1: HIGHER DANGER THRESHOLD ==========
  // Minimum playable gap - spread evenly across difficulties
  // Easy: 30% of height, Normal: 24%, Hard: 18%
  const minGapBase = diff === 0 ? 0.30 : diff === 2 ? 0.18 : 0.24;
  const minPlayableGap = H * minGapBase;
  
  // ========== FIX #2: ABSOLUTE HARD FLOOR ==========
  // This gap can NEVER be violated, no matter what
  // Easy: 28%, Normal: 22%, Hard: 16%
  const absoluteMinGap = H * (diff === 0 ? 0.28 : diff === 2 ? 0.16 : 0.22);
  
  // ========== FIX #3: TRANSITION SMOOTHING PARAMS ==========
  // Maximum pixels the gap can change per column
  // Easy: smoothest, Normal: moderate, Hard: sharpest transitions
  const maxGapChangePerCol = diff === 0 ? 2.0 : diff === 2 ? 4.0 : 3.0;

  let gapSum = 0;
  let volAvg = 0;

  for (let i=0;i<N;i++) {
    const center = base + A * zR[i];
    
    // Progressive difficulty within level - start easier, ramp up
    // First 5% of level: gap boosted by 30%, fades to 0% by 20% mark
    const progressInLevel = i / (N - 1);
    const easeInBoost = progressInLevel < 0.05 ? 0.30 :
                        progressInLevel < 0.20 ? 0.30 * (1 - (progressInLevel - 0.05) / 0.15) : 0;
    
    // Also ease in after each phase transition (1/3 and 2/3 marks)
    const phaseProgress = progressInLevel % (1/3);
    const phaseEaseIn = phaseProgress < 0.03 ? 0.20 * (1 - phaseProgress / 0.03) : 0;
    
    const totalEaseIn = Math.max(easeInBoost, phaseEaseIn);

    const gBase = gapMax - (gapMax - gapMin) * vnR[i];
    const g = gBase * (1 + totalEaseIn); // Apply ease-in bonus
    gapSum += g;
    volAvg += vnR[i];

    const d = clamp(dR[i] / (Math.max(1e-6, (p98 - p2))), -1, 1);
    const ripple = Math.sin(i*0.12 + d*3.0) * (H * 0.018) * Math.abs(d);

    // Store original (possibly too tight) values
    origTopY[i] = clamp(center - g/2 + ripple, 8, H-8);
    origBotY[i] = clamp(center + g/2 - ripple, 8, H-8);
    
    // Calculate danger level: how much we need to expand
    const origGap = origBotY[i] - origTopY[i];
    const needsExpansion = origGap < minPlayableGap;
    danger[i] = needsExpansion ? clamp(1 - (origGap / minPlayableGap), 0, 1) : 0;
    
    // Expand if needed (symmetric expansion from center)
    if (needsExpansion) {
      const expansion = (minPlayableGap - origGap) / 2;
      topY[i] = clamp(origTopY[i] - expansion, 8, H-8);
      botY[i] = clamp(origBotY[i] + expansion, 8, H-8);
    } else {
      topY[i] = origTopY[i];
      botY[i] = origBotY[i];
    }
  }

  // ========== POST-PROCESSING PASS 1: ENFORCE ABSOLUTE MINIMUM ==========
  // Scan entire tunnel and expand any section below the hard floor
  for (let i = 0; i < N; i++) {
    const currentGap = botY[i] - topY[i];
    if (currentGap < absoluteMinGap) {
      const center = (topY[i] + botY[i]) / 2;
      const halfGap = absoluteMinGap / 2;
      topY[i] = clamp(center - halfGap, 8, H - 8);
      botY[i] = clamp(center + halfGap, 8, H - 8);
      // Mark as maximum danger since we had to force-expand
      danger[i] = 1.0;
    }
  }
  
  // ========== POST-PROCESSING PASS 2: TRANSITION SMOOTHING ==========
  // Forward pass: prevent gap from shrinking too fast
  for (let i = 1; i < N; i++) {
    const prevGap = botY[i-1] - topY[i-1];
    const currGap = botY[i] - topY[i];
    
    // If gap is shrinking too fast, expand it
    if (prevGap - currGap > maxGapChangePerCol) {
      const targetGap = prevGap - maxGapChangePerCol;
      const center = (topY[i] + botY[i]) / 2;
      const halfGap = targetGap / 2;
      topY[i] = clamp(center - halfGap, 8, H - 8);
      botY[i] = clamp(center + halfGap, 8, H - 8);
    }
  }
  
  // Backward pass: prevent gap from shrinking too fast when approaching from ahead
  for (let i = N - 2; i >= 0; i--) {
    const nextGap = botY[i+1] - topY[i+1];
    const currGap = botY[i] - topY[i];
    
    // If the NEXT gap is much larger, smooth this one up
    if (nextGap - currGap > maxGapChangePerCol * 2) {
      const targetGap = Math.min(currGap + maxGapChangePerCol, nextGap);
      const center = (topY[i] + botY[i]) / 2;
      const halfGap = targetGap / 2;
      topY[i] = clamp(center - halfGap, 8, H - 8);
      botY[i] = clamp(center + halfGap, 8, H - 8);
    }
  }
  
  // ========== POST-PROCESSING PASS 3: FINAL HARD FLOOR CHECK ==========
  // One more pass to absolutely guarantee no gap is below minimum
  for (let i = 0; i < N; i++) {
    const currentGap = botY[i] - topY[i];
    if (currentGap < absoluteMinGap) {
      const center = (topY[i] + botY[i]) / 2;
      const halfGap = absoluteMinGap / 2;
      topY[i] = clamp(center - halfGap, 8, H - 8);
      botY[i] = clamp(center + halfGap, 8, H - 8);
    }
  }
  
  // ========== POST-PROCESSING PASS 4: ADAPTIVE CENTERLINE SMOOTHING ==========
  // Only smooth the centerline in PROBLEM areas (narrow gaps + rapid oscillation)
  // This preserves interesting calm sections while making volatile sections flyable
  
  // First, calculate centerline and detect problem areas
  const centerY = new Float32Array(N);
  const isProblematic = new Uint8Array(N); // 1 = needs smoothing
  
  // Threshold for what counts as "narrow" - trigger smoothing below this
  // Easy: 38%, Normal: 32%, Hard: 26%
  const narrowThreshold = H * (diff === 0 ? 0.38 : diff === 2 ? 0.26 : 0.32);
  // Maximum centerline change per column before it's considered "too spiky"
  const maxCenterChangePerCol = diff === 0 ? 1.5 : diff === 2 ? 3.0 : 2.2;
  
  for (let i = 0; i < N; i++) {
    centerY[i] = (topY[i] + botY[i]) / 2;
  }
  
  // Detect problem areas: narrow gap OR rapid centerline movement
  for (let i = 1; i < N; i++) {
    const gap = botY[i] - topY[i];
    const centerChange = Math.abs(centerY[i] - centerY[i-1]);
    
    // Mark as problematic if: narrow AND changing fast
    if (gap < narrowThreshold && centerChange > maxCenterChangePerCol) {
      // Mark this column and neighbors (creates smooth transition zones)
      for (let j = Math.max(0, i - 15); j < Math.min(N, i + 15); j++) {
        isProblematic[j] = 1;
      }
    }
  }
  
  // Apply local smoothing only to problematic sections
  const smoothedCenterY = new Float32Array(N);
  const smoothRadius = diff === 0 ? 20 : diff === 2 ? 10 : 14; // columns to average
  
  for (let i = 0; i < N; i++) {
    if (isProblematic[i]) {
      // Apply moving average to centerline
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - smoothRadius); j < Math.min(N, i + smoothRadius + 1); j++) {
        sum += centerY[j];
        count++;
      }
      smoothedCenterY[i] = sum / count;
    } else {
      smoothedCenterY[i] = centerY[i];
    }
  }
  
  // Blend between original and smoothed based on problem intensity
  // Also ensure smooth transitions at boundaries of problem zones
  for (let i = 0; i < N; i++) {
    if (isProblematic[i]) {
      const gap = botY[i] - topY[i];
      const halfGap = gap / 2;
      const newCenter = smoothedCenterY[i];
      
      // Blend factor: how much to apply smoothing (more in narrower sections)
      const blendFactor = clamp(1 - (gap / narrowThreshold), 0.3, 0.9);
      const blendedCenter = lerp(centerY[i], newCenter, blendFactor);
      
      topY[i] = clamp(blendedCenter - halfGap, 8, H - 8);
      botY[i] = clamp(blendedCenter + halfGap, 8, H - 8);
    }
  }
  
  // ========== POST-PROCESSING PASS 5: FINAL SAFETY CHECK ==========
  // Ensure smoothing didn't violate the hard floor
  for (let i = 0; i < N; i++) {
    const currentGap = botY[i] - topY[i];
    if (currentGap < absoluteMinGap) {
      const center = (topY[i] + botY[i]) / 2;
      const halfGap = absoluteMinGap / 2;
      topY[i] = clamp(center - halfGap, 8, H - 8);
      botY[i] = clamp(center + halfGap, 8, H - 8);
    }
  }

  gapSum /= N;
  volAvg /= N;

  const stats = {
    n: p.length,
    pmin: Math.min(...p),
    pmed: median(p),
    pmax: Math.max(...p),
    volAvg,
    gapAvg: gapSum,
  };

  return { topY, botY, origTopY, origBotY, danger, stats };
}

// --------- Dynamic Tunnel Breathing ----------
// Returns expanded tunnel values based on player proximity to danger zones
function getBreathingTunnel(level, playerWorldX, radius, H, diff = 1) {
  if (!level || !level.danger) return null;
  
  const colPerPx = 0.5;
  const N = level.topY.length;
  const playerCol = Math.floor(playerWorldX * colPerPx);
  
  // Look-ahead range for breathing effect (in columns)
  const breatheRange = 120; // ~240px look-ahead
  // Minimum safe gap - matches the new higher thresholds
  // Easy: 26% of height + ball, Normal: 20% + ball, Hard: 14% + ball
  const safeGapBase = diff === 0 ? H * 0.26 : diff === 2 ? H * 0.14 : H * 0.20;
  const minSafeGap = (radius * 2) + safeGapBase;
  
  // Create temporary expanded arrays for the visible range
  const result = {
    topY: new Float32Array(N),
    botY: new Float32Array(N),
    breatheIntensity: new Float32Array(N), // for visual effects
  };
  
  // Copy base values
  result.topY.set(level.topY);
  result.botY.set(level.botY);
  
  // Apply breathing expansion near player
  for (let i = Math.max(0, playerCol - 20); i < Math.min(N, playerCol + breatheRange); i++) {
    const dist = i - playerCol;
    
    // Only expand ahead and slightly behind the player
    if (dist < -20) continue;
    
    const currentGap = level.botY[i] - level.topY[i];
    const origGap = level.origBotY[i] - level.origTopY[i];
    
    // Check if this section needs breathing (still too tight for comfort)
    if (currentGap < minSafeGap) {
      // Proximity factor: stronger effect when closer
      // Peaks just ahead of player, fades with distance
      const proximityPeak = 30; // optimal distance for max effect
      const proximityFactor = dist < 0 
        ? Math.max(0, 1 + dist / 20) // behind player: quick falloff
        : Math.exp(-Math.pow((dist - proximityPeak) / 60, 2)); // ahead: gaussian falloff
      
      // Calculate needed expansion - stretching handles most cases
      const targetGap = minSafeGap;
      const neededExpansion = Math.max(0, targetGap - currentGap);
      // Easy: full expansion, Normal: 60%, Hard: 40%
      const expansionStrength = diff === 0 ? 1.0 : diff === 2 ? 0.40 : 0.60;
      const appliedExpansion = neededExpansion * proximityFactor * expansionStrength;
      
      // Center of the tunnel
      const center = (level.topY[i] + level.botY[i]) / 2;
      
      // Apply symmetric breathing expansion
      result.topY[i] = clamp(level.topY[i] - appliedExpansion, 8, H - 8);
      result.botY[i] = clamp(level.botY[i] + appliedExpansion, 8, H - 8);
      result.breatheIntensity[i] = clamp(proximityFactor * level.danger[i], 0, 1);
    }
  }
  
  return result;
}

// --------- Game engine ----------
const FEEL_PRESETS = {
  // Balanced: good default for “feel”
  balanced: { radius: 9, speedMul: 1.00, gravityMul: 1.00, flapMul: 1.00, scoreMul: 1.00 },
  // Floaty: easier to recover, more hang-time
  floaty:   { radius: 9, speedMul: 1.00, gravityMul: 1.00, flapMul: 1.00, scoreMul: 1.00 },
  // Snappy: faster and tighter, higher skill ceiling
  snappy:   { radius: 9, speedMul: 1.00, gravityMul: 1.00, flapMul: 1.00, scoreMul: 1.00 },
};

const state = {
  rows: null,
  feel: "snappy",
  theme: null,
  stars: null,
  fw: null,
  level: null,
  breathingTunnel: null, // Dynamic tunnel expansion
  levelHash: null,
  playing: false,
  finished: false, // Track if level was completed (vs crashed)
  finishedDiff: null, // Which difficulty was just completed
  unlockedNew: false, // Did we unlock a new difficulty?
  phase: 1, // Current phase (1, 2, or 3) - level advances at 1/3 and 2/3
  phaseComplete: false, // True when a phase is completed (show celebration)
  lastTs: 0,
  score: 0,
  best: 0,
  px: 160,
  py: 200,
  vy: 0,
  x: 0,
  speed: 220,
  gravity: 1500,
  flap: -460,
  radius: 9,
  ticks: 0,
  graceUntil: 0,
  flapBits: [],
  // Failure tracking for testing
  failureLog: [],
  // Checkpoint system - saves state when completing a phase
  checkpoint: null, // { phase, x, score, ticks }
  // Leaderboard state
  leaderboard: [], // Array of { nickname, score, rank }
  lastSubmittedRank: null, // Rank from last score submission
  nickname: '', // Player's nickname
  showShareModal: false, // Whether to show share modal
};

// --------- Failure Tracking System ----------
function captureFailure() {
  const wrap = $("wrap");
  const W = wrap.clientWidth;
  const H = wrap.clientHeight;
  const idx = getLevelIndex();
  const tunnel = state.breathingTunnel || state.level;
  const diff = +$("diff").value;
  
  // Calculate gap info at failure point
  const topY = tunnel.topY[idx];
  const botY = tunnel.botY[idx];
  const gap = botY - topY;
  const origGap = state.level.origBotY[idx] - state.level.origTopY[idx];
  const danger = state.level.danger[idx];
  
  // Get calendar position
  const progress = clamp(idx / (state.level.topY.length - 1), 0, 1);
  const date = seasonDateFromProgress(progress);
  
  // Capture screenshot from canvas
  let screenshot = null;
  try {
    screenshot = canvas.toDataURL("image/png", 0.8);
  } catch (e) {
    console.warn("Could not capture screenshot:", e);
  }
  
  const failure = {
    timestamp: new Date().toISOString(),
    difficulty: ["Easy", "Normal", "Hard"][diff] || "Unknown",
    score: Math.floor(state.score),
    progress: Math.floor(progress * 100),
    date: `${MONTHS[date.getMonth()]} ${date.getDate()}`,
    dayOfYear: dayOfYear(date),
    levelIndex: idx,
    playerY: Math.floor(state.py),
    topY: Math.floor(topY),
    botY: Math.floor(botY),
    gap: Math.floor(gap),
    originalGap: Math.floor(origGap),
    dangerLevel: danger.toFixed(2),
    hitTop: state.py - state.radius <= topY + 2,
    hitBottom: state.py + state.radius >= botY - 2,
    screenHeight: H,
    gapPercent: ((gap / H) * 100).toFixed(1),
    screenshot,
  };
  
  state.failureLog.push(failure);
  
  // Keep only last 20 failures in memory
  if (state.failureLog.length > 20) {
    state.failureLog.shift();
  }
  
  // Save to localStorage (without screenshots to save space)
  const logForStorage = state.failureLog.map(f => ({ ...f, screenshot: undefined }));
  try {
    localStorage.setItem("wattbeat_failure_log", JSON.stringify(logForStorage));
  } catch (e) {
    console.warn("Could not save failure log:", e);
  }
  
  console.log("📍 FAILURE CAPTURED:", failure);
  updateFailureUI();
  
  return failure;
}

function updateFailureUI() {
  const panel = $("failure-panel");
  if (!panel) return;
  
  const recent = state.failureLog.slice(-5).reverse();
  if (recent.length === 0) {
    panel.innerHTML = "<em>No failures recorded yet</em>";
    return;
  }
  
  panel.innerHTML = recent.map((f, i) => `
    <div class="failure-entry" style="margin-bottom:8px;padding:6px;background:rgba(255,50,50,0.15);border-radius:4px;font-size:12px;">
      <div><strong>#${state.failureLog.length - i}</strong> — ${f.date} (day ${f.dayOfYear})</div>
      <div>Gap: ${f.gap}px (${f.gapPercent}%) | Danger: ${f.dangerLevel}</div>
      <div>Hit: ${f.hitTop ? "TOP" : f.hitBottom ? "BOTTOM" : "?"} | Score: ${f.score}</div>
      ${f.screenshot ? `<img src="${f.screenshot}" style="width:100%;max-width:200px;margin-top:4px;border-radius:2px;cursor:pointer;" onclick="window.open('${f.screenshot}')">` : ""}
    </div>
  `).join("");
}

function downloadFailureLog() {
  const data = JSON.stringify(state.failureLog, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wattbeat-failures-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Failure log downloaded!");
}

function clearFailureLog() {
  state.failureLog = [];
  localStorage.removeItem("wattbeat_failure_log");
  updateFailureUI();
  toast("Failure log cleared");
}

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const wrap = $("wrap");
  const rect = wrap.getBoundingClientRect();
  
  // Ensure we have valid dimensions
  if (rect.width < 10 || rect.height < 10) {
    // Retry after a short delay if dimensions aren't ready
    requestAnimationFrame(resize);
    return;
  }
  
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if (!state.playing) state.py = rect.height * 0.5;
  if (state.theme) {
    state.stars = buildStarfield(state.theme, rect.width, rect.height);
  }
}
window.addEventListener("resize", resize);
// Also resize on orientation change (mobile)
window.addEventListener("orientationchange", () => {
  setTimeout(resize, 100);
});

function getLevelIndex() {
  const N = state.level.topY.length;
  const colPerPx = 0.5;
  // IMPORTANT: sample the tunnel under the PLAYER, not the left edge.
  const worldX = state.x + state.px;
  const idx = Math.floor(worldX * colPerPx);
  return clamp(idx, 0, N-1);
}

function updateBreathingTunnel() {
  if (!state.level) return;
  const wrap = $("wrap");
  const H = wrap.clientHeight;
  const worldX = state.x + state.px;
  const diff = +$("diff").value;
  state.breathingTunnel = getBreathingTunnel(state.level, worldX, state.radius, H, diff);
}

function collide() {
  if (performance.now() < state.graceUntil) return false;
  const idx = getLevelIndex();
  
  // Use breathing tunnel if available, otherwise base level
  const tunnel = state.breathingTunnel || state.level;
  const top = tunnel.topY[idx];
  const bot = tunnel.botY[idx];
  const y = state.py;
  const r = state.radius;
  const margin = 2; // makes collisions match visuals a bit better
  return (y - r <= top + margin) || (y + r >= bot - margin);
}

function draw() {
  const wrap = $("wrap");
  const W = wrap.clientWidth;
  const H = wrap.clientHeight;
  ctx.clearRect(0,0,W,H);

  const theme = state.theme;
  // Reactive color modulation based on local tunnel geometry + player state
  let reactive = theme;
  if (theme && state.level) {
    const tunnel = state.breathingTunnel || state.level;
    const idx = getLevelIndex();
    const N = tunnel.topY.length;
    const i2 = Math.min(N-1, idx + 6);
    const c1 = (tunnel.topY[idx] + tunnel.botY[idx]) * 0.5;
    const c2 = (tunnel.topY[i2] + tunnel.botY[i2]) * 0.5;
    const slope = clamp((c2 - c1) / 60, -1, 1); // slope proxy
    const gap = Math.max(1, (tunnel.botY[idx] - tunnel.topY[idx]));
    // Also factor in danger level for more intense reactive colors
    const dangerBoost = state.level.danger ? state.level.danger[idx] * 0.3 : 0;
    const v = clamp(1 - (gap / (canvas.getBoundingClientRect().height * 0.34)) + dangerBoost, 0, 1);
    const pulse = clamp(Math.abs(state.vy) / 900, 0, 1);
    reactive = reactiveTheme(theme, { d: slope, v, pulse }) || theme;
  }

  // Background gradient (unique per level)
  if (reactive) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, reactive.bgTop);
    g.addColorStop(1, reactive.bgBot);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = "#05070b";
  }
  ctx.fillRect(0,0,W,H);

  // Starfield
  if (reactive && state.stars) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i=0;i<state.stars.length;i++) {
      const s = state.stars[i];
      const tw = 0.15 + 0.85 * (0.5 + 0.5*Math.sin(performance.now()*0.0012 + s.tw));
      ctx.fillStyle = `rgba(255,255,255,${s.a*tw})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  // grace ring
  if (state.playing && performance.now() < state.graceUntil) {
    ctx.strokeStyle = reactive ? reactive.lineSoft : "rgba(200,220,255,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(state.px, state.py, state.radius + 7, 0, Math.PI*2);
    ctx.stroke();
  }

  if (!state.level) {
    ctx.fillStyle = "#9fb0c0";
    ctx.font = "14px system-ui";
    ctx.fillText("Season 2025 loading… (if this persists, check the console).", 16, 30);
    return;
  }

  const N = state.level.topY.length;
  const colPerPx = 0.5;
  const startCol = Math.floor(state.x * colPerPx);
  const colsOnScreen = Math.floor(W * colPerPx) + 4;
  
  // Use breathing tunnel for rendering if available
  const tunnel = state.breathingTunnel || state.level;

  ctx.fillStyle = reactive ? reactive.tunnelFill : "#08101a";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i=0;i<colsOnScreen;i++) {
    const col = clamp(startCol + i, 0, N-1);
    const x = i / colPerPx - (state.x % (1/colPerPx));
    ctx.lineTo(x, tunnel.topY[col]);
  }
  ctx.lineTo(W, 0);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let i=0;i<colsOnScreen;i++) {
    const col = clamp(startCol + i, 0, N-1);
    const x = i / colPerPx - (state.x % (1/colPerPx));
    ctx.lineTo(x, tunnel.botY[col]);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // Subtle vignette (adds depth)
  if (reactive) {
    const vg = ctx.createRadialGradient(W*0.5, H*0.5, Math.min(W,H)*0.2, W*0.5, H*0.5, Math.max(W,H)*0.65);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, reactive.vignette);
    ctx.fillStyle = vg;
    ctx.fillRect(0,0,W,H);
  }

  // Draw danger zone glow (where tunnel is breathing/expanded)
  if (state.breathingTunnel && state.level.danger) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i=0;i<colsOnScreen;i++) {
      const col = clamp(startCol + i, 0, N-1);
      const danger = state.level.danger[col];
      const breathe = state.breathingTunnel.breatheIntensity?.[col] || 0;
      
      if (danger > 0.1 || breathe > 0.05) {
        const x = i / colPerPx - (state.x % (1/colPerPx));
        const intensity = Math.max(danger * 0.4, breathe * 0.8);
        const pulsePhase = Math.sin(performance.now() * 0.004 + col * 0.02) * 0.3 + 0.7;
        const alpha = intensity * pulsePhase * 0.6;
        
        // Danger glow on top wall
        const gradTop = ctx.createLinearGradient(x, tunnel.topY[col], x, tunnel.topY[col] + 25);
        gradTop.addColorStop(0, `rgba(255, 80, 40, ${alpha})`);
        gradTop.addColorStop(1, `rgba(255, 40, 20, 0)`);
        ctx.fillStyle = gradTop;
        ctx.fillRect(x - 1, tunnel.topY[col], 3, 25);
        
        // Danger glow on bottom wall
        const gradBot = ctx.createLinearGradient(x, tunnel.botY[col], x, tunnel.botY[col] - 25);
        gradBot.addColorStop(0, `rgba(255, 80, 40, ${alpha})`);
        gradBot.addColorStop(1, `rgba(255, 40, 20, 0)`);
        ctx.fillStyle = gradBot;
        ctx.fillRect(x - 1, tunnel.botY[col] - 25, 3, 25);
      }
    }
    ctx.restore();
  }

  ctx.strokeStyle = reactive ? reactive.lineMain : "#1b2b3f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i=0;i<colsOnScreen;i++) {
    const col = clamp(startCol + i, 0, N-1);
    const x = i / colPerPx - (state.x % (1/colPerPx));
    ctx.lineTo(x, tunnel.topY[col]);
  }
  ctx.stroke();

  // Soft glow pass
  if (reactive) {
    ctx.strokeStyle = reactive.lineSoft;
    ctx.lineWidth = reactive?.glowWidth ?? 6;
    ctx.stroke();
    ctx.strokeStyle = reactive.lineAlt;
    ctx.lineWidth = 1;
  }

  ctx.beginPath();
  for (let i=0;i<colsOnScreen;i++) {
    const col = clamp(startCol + i, 0, N-1);
    const x = i / colPerPx - (state.x % (1/colPerPx));
    ctx.lineTo(x, tunnel.botY[col]);
  }
  ctx.stroke();

  // Soft glow pass
  if (reactive) {
    ctx.strokeStyle = reactive.lineSoft;
    ctx.lineWidth = reactive?.glowWidth ?? 6;
    ctx.stroke();
    ctx.strokeStyle = reactive.lineAlt;
    ctx.lineWidth = 1;
  }

  // Player ball
  if (reactive) {
    const rg = ctx.createRadialGradient(state.px-3, state.py-3, 2, state.px, state.py, state.radius+6);
    rg.addColorStop(0, reactive.ballCore);
    rg.addColorStop(0.8, reactive.ballEdge);
    rg.addColorStop(1, "rgba(0,0,0,0.0)");
    ctx.fillStyle = rg;
  } else {
    ctx.fillStyle = "#e6edf3";
  }
  ctx.beginPath();
  ctx.arc(state.px, state.py, state.radius, 0, Math.PI*2);
  ctx.fill();

  // Responsive font sizes based on canvas width
  const isMobile = W < 500;
  const hudFontSize = isMobile ? 11 : 14;
  const hudLineHeight = isMobile ? 16 : 22;
  const hudPadding = isMobile ? 10 : 16;
  
  ctx.fillStyle = reactive ? reactive.hud : "#cdd9e5";
  ctx.font = `${hudFontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace`;
  
  // Calendar HUD - positioned in top-left with proper spacing
  const progress = clamp(getLevelIndex() / (state.level.topY.length - 1), 0, 1);
  const d = seasonDateFromProgress(progress);
  const doy = dayOfYear(d);
  const wk = isoWeekNumber(d);
  const mName = MONTHS[d.getMonth()];
  
  // Phase info
  const phaseNames = ["", "🌸 Spring", "☀️ Summer", "🍂 Autumn"];
  const phaseProgress = state.phase === 1 ? progress * 3 : state.phase === 2 ? (progress - 1/3) * 3 : (progress - 2/3) * 3;
  
  // Draw HUD in top-left - but only show all lines when playing
  let hudY = hudPadding + hudFontSize;
  
  // Line 1: Score and best (always show)
  ctx.fillText(`score ${Math.floor(state.score)}  best ${Math.floor(state.best)}`, hudPadding, hudY);
  
  // Only show full HUD when playing (not overlapping with game over messages)
  if (state.playing) {
    hudY += hudLineHeight;
    // Line 2: Date info
    if (isMobile) {
      ctx.fillText(`${mName} | day ${doy}`, hudPadding, hudY);
    } else {
      ctx.fillText(`${mName}  |  day ${doy}/365  |  week ${wk}`, hudPadding, hudY);
    }
    
    hudY += hudLineHeight;
    // Line 3: Phase progress
    if (isMobile) {
      ctx.fillText(`${phaseNames[state.phase]} ${Math.floor(clamp(phaseProgress, 0, 1)*100)}%`, hudPadding, hudY);
    } else {
      ctx.fillText(`${phaseNames[state.phase]} (phase ${state.phase}/3)  |  ${Math.floor(clamp(phaseProgress, 0, 1)*100)}%`, hudPadding, hudY);
    }
  }

  // Draw fireworks on top of everything else
  if (typeof drawFireworks === "function") drawFireworks(state, ctx, W, H);

  if (!state.playing) {
    // Don't draw dark overlay if showing completion celebration
    if ((!state.finished && !state.phaseComplete) || !state.fw?.active) {
      ctx.fillStyle = reactive ? reactive.vignette : "rgba(15,22,33,0.82)";
      ctx.fillRect(0, 0, W, H);
    }
    
    // Responsive font sizes for overlays
    const titleSize = isMobile ? 24 : 36;
    const subtitleSize = isMobile ? 16 : 22;
    const bodySize = isMobile ? 14 : 18;
    const smallSize = isMobile ? 12 : 16;
    const lineSpacing = isMobile ? 28 : 40;
    
    ctx.textAlign = "center";
    
    if (state.phaseComplete) {
      // Phase completion screen (1/3 or 2/3 through the level)
      ctx.font = `bold ${titleSize}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      const phaseEmoji = state.phase === 1 ? "🌸" : "☀️";
      const seasonName = state.phase === 1 ? "Spring Complete!" : "Summer Complete!";
      ctx.fillText(`${phaseEmoji} ${seasonName} ${phaseEmoji}`, W*0.5, H*0.4);
      
      ctx.font = `${subtitleSize}px system-ui`;
      ctx.fillStyle = "rgba(220,235,255,0.9)";
      ctx.fillText(`Phase ${state.phase} of 3 complete`, W*0.5, H*0.4 + lineSpacing);
      
      ctx.font = `${bodySize}px system-ui`;
      ctx.fillStyle = "rgba(180,220,255,0.85)";
      ctx.fillText(`Score so far: ${Math.floor(state.score)}`, W*0.5, H*0.4 + lineSpacing*1.8);
      
      ctx.font = `bold ${smallSize}px system-ui`;
      ctx.fillStyle = "rgba(100,255,180,0.9)";
      const continueText = isMobile ? "Tap to continue →" : "Press ENTER to continue →";
      ctx.fillText(continueText, W*0.5, H*0.4 + lineSpacing*2.8);
      
    } else if (state.finished) {
      // Level completion screen
      ctx.font = `bold ${isMobile ? 28 : 42}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillText("🎉 Happy New Year! 🎉", W*0.5, H*0.38);
      
      ctx.font = `${subtitleSize}px system-ui`;
      ctx.fillStyle = "rgba(220,235,255,0.9)";
      const diffNames = ["Easy", "Normal", "Hard"];
      const completedMsg = `Completed: ${diffNames[state.finishedDiff] || "Unknown"}`;
      ctx.fillText(completedMsg, W*0.5, H*0.38 + lineSpacing);
      
      ctx.font = `${bodySize}px system-ui`;
      ctx.fillStyle = "rgba(180,220,255,0.85)";
      ctx.fillText(`Final Score: ${Math.floor(state.score)}`, W*0.5, H*0.38 + lineSpacing*1.8);
      
      // Show unlock message
      if (state.unlockedNew) {
        ctx.font = `bold ${bodySize}px system-ui`;
        ctx.fillStyle = "rgba(100,255,150,0.95)";
        const unlockMsg = state.finishedDiff === 0 ? "🔓 Normal Mode Unlocked!" : "🔓 Hard Mode Unlocked!";
        ctx.fillText(unlockMsg, W*0.5, H*0.38 + lineSpacing*2.8);
      } else if (state.finishedDiff === 2) {
        ctx.font = `bold ${bodySize}px system-ui`;
        ctx.fillStyle = "rgba(255,215,0,0.95)";
        ctx.fillText("🏆 Master of Energy Markets! 🏆", W*0.5, H*0.38 + lineSpacing*2.8);
      }
      
      ctx.font = `bold ${smallSize}px system-ui`;
      ctx.fillStyle = "rgba(100,255,180,0.9)";
      const continueText = isMobile ? "Tap to continue" : "Press ENTER to continue";
      ctx.fillText(continueText, W*0.5, H*0.38 + lineSpacing*3.8);
      
    } else {
      // Normal game over or ready screen - centered
      const msg = state.score > 0 ? "Game Over" : "Ready";
      ctx.font = `bold ${titleSize}px system-ui`;
      ctx.fillStyle = "#e6edf3";
      ctx.fillText(msg, W*0.5, H*0.4);
      
      ctx.font = `${bodySize}px system-ui`;
      ctx.fillStyle = "#9fb0c0";
      
      if (state.checkpoint && state.score > 0) {
        // Show checkpoint info when dead with a checkpoint
        const cpPhaseNames = ["", "Spring", "Summer", "Autumn"];
        ctx.fillText(`Checkpoint: Phase ${state.checkpoint.phase} (${cpPhaseNames[state.checkpoint.phase]})`, W*0.5, H*0.4 + lineSpacing);
        
        ctx.fillStyle = "rgba(100,255,180,0.85)";
        const tapText = isMobile ? "Tap to continue from checkpoint" : "Space / Click to continue from checkpoint";
        ctx.fillText(tapText, W*0.5, H*0.4 + lineSpacing*1.8);
        
        ctx.fillStyle = "#ff9966";
        ctx.font = `${smallSize}px system-ui`;
        const restartText = isMobile ? "Tap 'Play 2025' to start over" : "Press R to start over completely";
        ctx.fillText(restartText, W*0.5, H*0.4 + lineSpacing*2.6);
      } else {
        const startText = isMobile ? "Tap anywhere to start" : "Space / Click / Tap to start and flap";
        ctx.fillText(startText, W*0.5, H*0.4 + lineSpacing);
      }
    }
    
    ctx.textAlign = "left";
  }
}

function resetRun() {
  const wrap = $("wrap");
  
  // If we have a checkpoint, restore from it
  if (state.checkpoint) {
    state.x = state.checkpoint.x;
    state.score = state.checkpoint.score;
    state.ticks = state.checkpoint.ticks;
    state.phase = state.checkpoint.phase;
    state.flapBits = state.checkpoint.flapBits ? [...state.checkpoint.flapBits] : [];
  } else {
    state.x = 0;
    state.score = 0;
    state.ticks = 0;
    state.phase = 1;
    state.flapBits = [];
  }
  
  state.vy = 0;
  state.py = safeSpawnY(state.level, state.px, state.x, wrap.clientHeight);
  state.graceUntil = performance.now() + 800; // spawn grace (ms)
  state.phaseComplete = false;
}

function startOver() {
  // Clear checkpoint and restart completely from the beginning
  state.checkpoint = null;
  const wrap = $("wrap");
  state.x = 0;
  state.vy = 0;
  state.py = safeSpawnY(state.level, state.px, state.x, wrap.clientHeight);
  state.graceUntil = performance.now() + 800;
  state.score = 0;
  state.ticks = 0;
  state.flapBits = [];
  state.phase = 1;
  state.phaseComplete = false;
  state.finished = false;
  state.fw = null;
  state.playing = false;
  toast("Starting over from the beginning!");
}
function packFlapBit(flag) {
  const idx = state.ticks;
  const byteIndex = idx >> 3;
  const bitIndex = idx & 7;
  if (state.flapBits.length <= byteIndex) state.flapBits.push(0);
  if (flag) state.flapBits[byteIndex] |= (1 << bitIndex);
}
function startRun() {
  state.playing = true;
  state.lastTs = performance.now();
  resetRun();
}
async function endRun(finished=false) {
  state.playing = false;
  state.finished = finished;
  state.unlockedNew = false;
  
  const cur = +$("diff").value;
  
  // Capture failure data if crashed (not finished)
  if (!finished && state.level) {
    captureFailure();
  }
  
  // Submit score to leaderboard if we have a nickname (both finished and crashed games)
  if (state.nickname && state.score > 0) {
    try {
      const result = await submitScore(state.score, cur, state.nickname);
      if (result.error) {
        console.error('Score submission error:', result.error);
        toast(`Failed to submit score: ${result.error}`);
      } else if (result.rank) {
        state.lastSubmittedRank = result.rank;
        toast(`Score submitted! Rank #${result.rank}`);
        // Refresh leaderboard
        refreshLeaderboard(cur);
      } else {
        console.warn('Score submitted but no rank returned:', result);
        toast('Score submitted!');
        // Refresh leaderboard anyway
        refreshLeaderboard(cur);
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
      toast(`Failed to submit score: ${err.message}`);
    }
  } else if (!state.nickname && state.score > 0) {
    // Remind user to set nickname to submit scores
    console.log('Score not submitted: nickname not set');
  }
  
  if (finished) {
    // Clear checkpoint when finishing the year - next game starts fresh
    state.checkpoint = null;
    
    state.finishedDiff = cur;
    const unlocked = getUnlockedDifficulty();
    if (cur >= unlocked && cur < 2) {
      setUnlockedDifficulty(cur + 1);
      state.unlockedNew = true;
      $("unlock").textContent = cur === 0 ? "Unlocked: Normal" : "Unlocked: Hard";
    }
    // Celebration intensity: Hard gets a bigger show
    const intensity = cur === 2 ? 1.8 : cur === 1 ? 1.3 : 1.0;
    spawnFireworks(state, intensity);
    
    // Show share modal for completed runs
    state.showShareModal = true;
    showShareModal();
  }

  if (state.score > state.best) {
    state.best = state.score;
    if (state.levelHash) {
      localStorage.setItem("wattbeat_energy2025_best_" + $("diff").value, String(Math.floor(state.best)));
    }
  }
  updateStatsUI();
  $("share").disabled = false;
  toast(finished ? "Finished the year!" : "Game over. Failure logged.");
}

function endPhase(phase) {
  state.playing = false;
  state.phaseComplete = true;
  
  // Celebration intensity increases with each phase
  const intensity = phase === 1 ? 0.7 : phase === 2 ? 1.0 : 1.3;
  spawnFireworks(state, intensity);
  
  const phaseNames = ["", "Spring → Summer", "Summer → Autumn", ""];
  toast(`Phase ${phase} complete! ${phaseNames[phase]}`);
}

function continueFromPhase() {
  state.phaseComplete = false;
  state.fw = null; // Clear fireworks
  state.phase += 1;
  
  // Create checkpoint at the start of the new phase
  state.checkpoint = {
    phase: state.phase,
    x: state.x,
    score: state.score,
    ticks: state.ticks,
    flapBits: [...state.flapBits],
  };
  
  state.playing = true;
  state.lastTs = performance.now();
  state.graceUntil = performance.now() + 600; // Brief grace period after phase transition
  toast(`Phase ${state.phase} of 3 - Checkpoint saved! Keep going!`);
}

function tick(ts) {
  const wrap = $("wrap");
  const H = wrap.clientHeight;

  if (!state.level) {
    draw();
    requestAnimationFrame(tick);
    return;
  }

  // Always update breathing tunnel (for visual effects even when paused)
  updateBreathingTunnel();

  if (state.playing) {
    const dt = Math.min(0.033, (ts - state.lastTs) / 1000);
    state.lastTs = ts;

    state.vy += state.gravity * dt;

    // terminal velocity caps (makes control forgiving)
    const vUp = -720;
    const vDown = 1150;
    state.vy = clamp(state.vy, vUp, vDown);

    state.py += state.vy * dt;

    if (typeof stepFireworks === "function") stepFireworks(state, dt);

    state.x += state.speed * dt;
    const preset = FEEL_PRESETS[state.feel] || FEEL_PRESETS.balanced;
    state.score += state.speed * dt * 0.05 * preset.scoreMul;

    state.py = clamp(state.py, 0, H);

    if (collide()) {
      endRun();
    }

    const idx = getLevelIndex();
    const N = state.level.topY.length;
    const progress = idx / (N - 1);
    
    // Check for phase completion at 1/3 and 2/3
    if (state.phase === 1 && progress >= 1/3) {
      endPhase(1);
    } else if (state.phase === 2 && progress >= 2/3) {
      endPhase(2);
    } else if (state.phase === 3 && idx >= N - 2) {
      endRun(true);
      toast("Finished the year!");
    }

    state.ticks++;
    packFlapBit(false);
  }

  // continue fireworks even if not playing
  if (!state.playing) {
    const dtIdle = 1/60;
    if (typeof stepFireworks === "function") stepFireworks(state, dtIdle);
  }

  draw();
  requestAnimationFrame(tick);
}

// --------- Input ----------
async function dismissCelebration() {
  // Handle phase completion (mid-level celebration)
  if (state.phaseComplete && !state.playing) {
    continueFromPhase();
    return true;
  }
  
  // Handle final level completion
  if (state.finished && !state.playing) {
    state.finished = false;
    state.fw = null; // Clear fireworks
    
    // Auto-switch to next unlocked mode if we just unlocked it
    if (state.unlockedNew && state.finishedDiff < 2) {
      $("diff").value = String(state.finishedDiff + 1);
    }
    
    // Regenerate level for the new difficulty
    await makeLevel();
    return true;
  }
  
  return false;
}

// Check if we're on a touch device
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

async function flap() {
  if (!state.level) return;
  
  // On mobile (touch devices), allow tap to dismiss celebrations
  // On desktop, require Enter key to prevent accidental dismissal
  if (state.finished || state.phaseComplete) {
    if (isTouchDevice()) {
      await dismissCelebration();
    }
    return;
  }
  
  if (!state.playing) startRun();
  // Add impulse, but first limit downward speed so a flap always has effect
  if (state.vy > 260) state.vy = 260;
  state.vy = clamp(state.vy + state.flap, -740, 1150);

  const idx = Math.max(0, state.ticks);
  const byteIndex = idx >> 3;
  const bitIndex = idx & 7;
  if (state.flapBits.length <= byteIndex) state.flapBits.push(0);
  state.flapBits[byteIndex] |= (1 << bitIndex);
}
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    flap();
  }
  // Use Enter to dismiss celebrations (prevents accidental clicks)
  if (e.code === "Enter") {
    e.preventDefault();
    dismissCelebration();
  }
  // Use R to start over completely (clear checkpoint)
  if (e.code === "KeyR" && !state.playing) {
    e.preventDefault();
    startOver();
  }
});
canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  flap();
});

// Prevent default touch behaviors on canvas (no scrolling, zooming)
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
}, { passive: false });

// --------- UI ----------
async function loadDataset(filename) {
  const res = await fetch(filename, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load " + filename);
  const text = await res.text();
  return parseCSV(text);
}
function dateToISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}
function parseISODate(s) {
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2]-1, +m[3], 0, 0, 0, 0);
}
function filterRange(rows, startDate, endDate) {
  const end = new Date(endDate.getTime());
  end.setHours(23,59,59,999);
  const out = [];
  for (const r of rows) if (r.t >= startDate && r.t <= end) out.push(r.p);
  return out;
}

async function makeLevel() {
  const ds = "daprices-epex-elec.csv";
  const startS = "2025-01-01";
  const endS = "2025-12-31";
  const requestedDiff = +$("diff").value;
  const unlocked = getUnlockedDifficulty();
  const diff = clamp(requestedDiff, 0, unlocked);
  $("diff").value = String(diff);
  
  // Clear checkpoint when generating new level
  state.checkpoint = null;

  const startD = parseISODate(startS);
  const endD = parseISODate(endS);
  if (!startD || !endD || endD < startD) { toast("Invalid date range"); return; }

  if (!state.rows) {
    $("play").disabled = true;
    toast("Loading 2025 prices…");
        const u0 = document.getElementById("unlock");
        if (u0) u0.textContent = "Loading CSV…";
    state.rows = await loadDataset(ds);
  }

  const prices = filterRange(state.rows, startD, endD);
  const wrap = $("wrap");
  const H = wrap.clientHeight;
  const N = 7000;

const speedBase = 220, gravBase = 1500, flapBase = -460;
// Speed/physics multiplier - with stretching, speed can be more consistent
// Easy: 88%, Normal: 96%, Hard: 105%
const diffMult = diff === 0 ? 0.88 : diff === 2 ? 1.05 : 0.96;

const preset = FEEL_PRESETS[state.feel] || FEEL_PRESETS.balanced;

state.speed = speedBase * diffMult * preset.speedMul;
state.gravity = gravBase * diffMult * preset.gravityMul;
state.flap = flapBase * preset.flapMul;

// hitbox feel
state.radius = preset.radius;
const algo = "v1";
  const hashInput = JSON.stringify({ season:"2025", ds, start:startS, end:endS, diff, algo, N, H:Math.round(H) });
  const levelHash = await sha256Hex(hashInput);

  try {
    const level = await generateLevel(prices, H, N, diff);
    state.level = level;
    state.theme = computeTheme(levelHash, level.stats);
    state.stars = buildStarfield(state.theme, wrap.clientWidth, wrap.clientHeight);
    state.levelHash = levelHash;
    // Ensure we start inside the tunnel (important for some ranges)
    state.x = 0;
    state.vy = 0;
    state.py = safeSpawnY(state.level, state.px, state.x, wrap.clientHeight);
    state.graceUntil = performance.now() + 800;
    const bestStr = localStorage.getItem("wattbeat_energy2025_best_" + diff);
    state.best = bestStr ? parseInt(bestStr, 10) : 0;
    state.playing = false;
    state.score = 0;

    updateStatsUI();
    $("play").disabled = false;
    $("share").disabled = false;
    
    // Fetch leaderboard for this difficulty
    refreshLeaderboard(diff);
    
    toast("Level generated. Click/Space to start.");
  } catch (err) {
    console.error(err);
    toast(String(err.message || err));
  }
}

function updateStatsUI() {
  const lvl = state.level;
  $("hash").textContent = state.levelHash ? state.levelHash.slice(0, 10) + "…" : "—";
  $("pts").textContent = lvl ? String(lvl.stats.n) : "—";
  $("pstats").textContent = lvl ? `${lvl.stats.pmin.toFixed(1)} / ${lvl.stats.pmed.toFixed(1)} / ${lvl.stats.pmax.toFixed(1)}` : "—";
  $("vol").textContent = lvl ? lvl.stats.volAvg.toFixed(3) : "—";
  $("gap").textContent = lvl ? Math.round(lvl.stats.gapAvg) + " px" : "—";
  $("best").textContent = state.levelHash ? String(Math.floor(state.best || 0)) : "—";
}

function copyShareLink() {
  if (!state.levelHash) return;
  const diff = +$("diff").value;
  const best = Math.floor(state.best || 0);
  const nickname = state.nickname || 'Anonymous';
  const rank = state.lastSubmittedRank || 0;
  
  const url = getShareUrl(best, rank, diff, nickname);
  copyToClipboard(url).then(success => {
    if (success) toast("Share link copied!");
    else toast("Failed to copy link");
  });
}

// --------- Leaderboard Functions ----------
async function refreshLeaderboard(difficulty) {
  const diff = typeof difficulty === 'number' ? difficulty : +$("diff").value;
  const result = await fetchLeaderboard(diff, 20);
  
  if (result.scores) {
    state.leaderboard = result.scores;
    updateLeaderboardUI();
  }
}

function updateLeaderboardUI() {
  const panel = $("leaderboard-list");
  if (!panel) return;
  
  if (!state.leaderboard || state.leaderboard.length === 0) {
    panel.innerHTML = '<div class="leaderboard-empty">No scores yet. Be the first!</div>';
    return;
  }
  
  const sessionId = getSessionId();
  const html = state.leaderboard.slice(0, 10).map((entry, idx) => {
    const isMe = entry.session_id === sessionId;
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
    return `
      <div class="leaderboard-row ${isMe ? 'is-me' : ''}">
        <span class="lb-rank">${medal}</span>
        <span class="lb-name">${escapeHtml(entry.nickname)}</span>
        <span class="lb-score">${entry.score.toLocaleString()}</span>
      </div>
    `;
  }).join('');
  
  panel.innerHTML = html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --------- Share Modal Functions ----------
function showShareModal() {
  const modal = $("share-modal");
  if (!modal) return;
  
  const diff = +$("diff").value;
  const score = Math.floor(state.score);
  const rank = state.lastSubmittedRank;
  const nickname = state.nickname || 'Anonymous';
  const url = getShareUrl(score, rank, diff, nickname);
  
  // Update modal content
  const scoreEl = $("share-score");
  if (scoreEl) scoreEl.textContent = score.toLocaleString();
  
  const rankEl = $("share-rank");
  if (rankEl) rankEl.textContent = rank ? `#${rank} on ${DIFFICULTY_NAMES[diff]}` : DIFFICULTY_NAMES[diff];
  
  // Store share data for buttons
  modal.dataset.score = score;
  modal.dataset.rank = rank || 0;
  modal.dataset.difficulty = diff;
  modal.dataset.nickname = nickname;
  modal.dataset.url = url;
  
  modal.classList.add('show');
}

function hideShareModal() {
  const modal = $("share-modal");
  if (modal) modal.classList.remove('show');
  state.showShareModal = false;
}

function handleShareButton(platform) {
  const modal = $("share-modal");
  if (!modal) return;
  
  const score = parseInt(modal.dataset.score) || 0;
  const rank = parseInt(modal.dataset.rank) || 0;
  const difficulty = parseInt(modal.dataset.difficulty) || 0;
  const nickname = modal.dataset.nickname || 'Anonymous';
  const url = modal.dataset.url || window.location.href;
  
  switch (platform) {
    case 'twitter':
      shareToTwitter(score, rank, difficulty, nickname, url);
      break;
    case 'linkedin':
      shareToLinkedIn(url);
      break;
    case 'facebook':
      shareToFacebook(url);
      break;
    case 'reddit':
      shareToReddit(score, rank, difficulty, nickname, url);
      break;
    case 'copy':
      copyToClipboard(url).then(success => {
        toast(success ? 'Link copied!' : 'Failed to copy');
      });
      break;
    case 'native':
      nativeShare(score, rank, difficulty, nickname, url);
      break;
  }
}

// --------- Nickname Modal Functions ----------
function showNicknameModal() {
  const modal = $("nickname-modal");
  if (modal) {
    const input = $("nickname-input");
    if (input) input.value = state.nickname || '';
    modal.classList.add('show');
    if (input) input.focus();
  }
}

function hideNicknameModal() {
  const modal = $("nickname-modal");
  if (modal) modal.classList.remove('show');
}

function saveNickname() {
  const input = $("nickname-input");
  if (input) {
    const name = setNickname(input.value);
    state.nickname = name;
    updateNicknameDisplay();
    hideNicknameModal();
    toast(name ? `Welcome, ${name}!` : 'Playing anonymously');
  }
}

function updateNicknameDisplay() {
  const el = $("current-nickname");
  if (el) el.textContent = state.nickname || 'Set Nickname';
}


function applyQueryParams() {
  // Optional sharing: show someone else's claimed score for comparison (not validated in local build)
  const url = new URL(window.location.href);
  const sharedScore = url.searchParams.get("score");
  const sharedDiff = url.searchParams.get("diff");
  if (sharedScore) {
    toast(`Shared highscore: ${sharedScore}`);
  }
  if (sharedDiff !== null) $("diff").value = sharedDiff;
}

async function init() {
  resize();
  applyQueryParams();
  
  // Load nickname from localStorage
  state.nickname = getNickname();
  updateNicknameDisplay();
  
  // Load failure log from localStorage
  try {
    const savedLog = localStorage.getItem("wattbeat_failure_log");
    if (savedLog) {
      state.failureLog = JSON.parse(savedLog);
      updateFailureUI();
    }
  } catch (e) {
    console.warn("Could not load failure log:", e);
  }

  // Set up event listeners
  $("play").addEventListener("click", async () => { await makeLevel(); });
  $("share").addEventListener("click", copyShareLink);
  $("startover").addEventListener("click", () => { startOver(); });
  
  // Nickname button
  const nicknameBtn = $("nickname-btn");
  if (nicknameBtn) {
    nicknameBtn.addEventListener("click", showNicknameModal);
  }
  
  // Nickname modal events
  const nicknameSaveBtn = $("nickname-save");
  if (nicknameSaveBtn) {
    nicknameSaveBtn.addEventListener("click", saveNickname);
  }
  const nicknameCancelBtn = $("nickname-cancel");
  if (nicknameCancelBtn) {
    nicknameCancelBtn.addEventListener("click", hideNicknameModal);
  }
  const nicknameInput = $("nickname-input");
  if (nicknameInput) {
    nicknameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveNickname();
      if (e.key === "Escape") hideNicknameModal();
    });
  }
  
  // Share modal events
  const shareModalClose = $("share-modal-close");
  if (shareModalClose) {
    shareModalClose.addEventListener("click", hideShareModal);
  }
  
  // Share buttons
  document.querySelectorAll("[data-share]").forEach(btn => {
    btn.addEventListener("click", () => handleShareButton(btn.dataset.share));
  });
  
  // Difficulty change refreshes leaderboard
  const diffSelect = $("diff");
  if (diffSelect) {
    diffSelect.addEventListener("change", () => refreshLeaderboard());
  }
  
  // Close modals on backdrop click
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        hideNicknameModal();
        hideShareModal();
      }
    });
  });

  try {
    $("play").disabled = true;
    $("share").disabled = true;
    toast("Loading 2025 prices…");
    const u0 = document.getElementById("unlock");
    if (u0) u0.textContent = "Loading CSV…";

    state.rows = await loadDataset("daprices-epex-elec.csv");

    const u1 = document.getElementById("unlock");
    if (u1) u1.textContent = "CSV loaded";

    const unlocked = getUnlockedDifficulty();
    $("diff").value = String(unlocked);
    $("unlock").textContent =
      unlocked === 0 ? "Mode: Easy (start)"
      : unlocked === 1 ? "Mode: Normal (unlocked)"
      : "Mode: Hard (unlocked)";

    $("play").disabled = false;
    $("share").disabled = false;
    $("startover").disabled = false;
    $("diff").disabled = false;

    await makeLevel();
  } catch (e) {
    console.error(e);
    toast("Could not load: " + String(e?.message || e));
    const u = document.getElementById("unlock");
    if (u) u.textContent = "Load failed (see console)";
  }

  requestAnimationFrame(tick);
}

init();
