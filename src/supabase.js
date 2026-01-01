// Supabase client for CaveFlyer Energy 2025
// This file is used by both the frontend and API routes

// For browser usage, we'll load these from a config endpoint or embed them
// For API routes, we'll use environment variables

const SUPABASE_URL = typeof process !== 'undefined' && process.env 
  ? process.env.SUPABASE_URL 
  : window.SUPABASE_URL;

const SUPABASE_ANON_KEY = typeof process !== 'undefined' && process.env 
  ? process.env.SUPABASE_ANON_KEY 
  : window.SUPABASE_ANON_KEY;

// Session management for anonymous users
export function getSessionId() {
  if (typeof localStorage === 'undefined') return null;
  
  let id = localStorage.getItem('caveflyer_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('caveflyer_session', id);
  }
  return id;
}

// Get or set the player's nickname
export function getNickname() {
  if (typeof localStorage === 'undefined') return 'Anonymous';
  return localStorage.getItem('caveflyer_nickname') || '';
}

export function setNickname(name) {
  if (typeof localStorage === 'undefined') return;
  const sanitized = (name || '').trim().slice(0, 20);
  localStorage.setItem('caveflyer_nickname', sanitized);
  return sanitized;
}

// API wrapper functions for browser use
export async function fetchLeaderboard(difficulty = 0, limit = 50) {
  try {
    const res = await fetch(`/api/scores?difficulty=${difficulty}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return await res.json();
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    return { scores: [], error: err.message };
  }
}

export async function submitScore(score, difficulty, nickname) {
  const sessionId = getSessionId();
  if (!sessionId) {
    return { error: 'No session ID' };
  }
  
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

export async function getPlayerRank(difficulty, score) {
  try {
    const res = await fetch(`/api/scores?difficulty=${difficulty}&score=${score}&action=rank`);
    if (!res.ok) throw new Error('Failed to get rank');
    return await res.json();
  } catch (err) {
    console.error('Rank fetch error:', err);
    return { rank: null, error: err.message };
  }
}

// Generate share URL with OG image
export function getShareUrl(score, rank, difficulty, nickname) {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    score: String(Math.floor(score)),
    rank: String(rank || 0),
    difficulty: String(difficulty),
    nickname: nickname || 'Anonymous'
  });
  return `${base}/?${params.toString()}`;
}

export function getOgImageUrl(score, rank, difficulty, nickname) {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    score: String(Math.floor(score)),
    rank: String(rank || 0),
    difficulty: String(difficulty),
    nickname: nickname || 'Anonymous'
  });
  return `${base}/api/og?${params.toString()}`;
}

