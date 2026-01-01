// API endpoint for highscores - Vercel Serverless Function
import { createClient } from '@supabase/supabase-js';

// Check environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables!');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? 'set' : 'missing');
  console.error('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'set' : 'missing');
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if Supabase is configured
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Supabase not configured - missing environment variables');
    return res.status(500).json({ 
      error: 'Database not configured. Please check server environment variables.' 
    });
  }

  try {
    if (req.method === 'GET') {
      return await handleGet(req, res);
    } else if (req.method === 'POST') {
      return await handlePost(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function handleGet(req, res) {
  const { difficulty, limit, score, action } = req.query;
  const diff = parseInt(difficulty) || 0;
  const lim = Math.min(parseInt(limit) || 50, 100);

  // If action=rank, return the rank for a specific score
  if (action === 'rank' && score !== undefined) {
    const scoreVal = parseInt(score);
    const { data, error } = await supabase.rpc('get_score_rank', {
      p_difficulty: diff,
      p_score: scoreVal
    });

    if (error) {
      // Fallback: count scores higher than this one
      const { count, error: countError } = await supabase
        .from('highscores')
        .select('*', { count: 'exact', head: true })
        .eq('difficulty', diff)
        .gt('score', scoreVal);

      if (countError) {
        return res.status(500).json({ error: countError.message });
      }

      return res.status(200).json({ rank: (count || 0) + 1 });
    }

    return res.status(200).json({ rank: data });
  }

  // Fetch leaderboard
  const { data, error } = await supabase
    .from('highscores')
    .select('id, nickname, score, difficulty, created_at')
    .eq('difficulty', diff)
    .order('score', { ascending: false })
    .limit(lim);

  if (error) {
    console.error('Supabase query error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch leaderboard',
      code: error.code
    });
  }

  // Add rank to each entry
  const scores = (data || []).map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));

  return res.status(200).json({ scores });
}

async function handlePost(req, res) {
  const { session_id, nickname, score, difficulty } = req.body;

  // Validate input
  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'Invalid session_id' });
  }
  if (!nickname || typeof nickname !== 'string' || nickname.length < 1 || nickname.length > 20) {
    return res.status(400).json({ error: 'Nickname must be 1-20 characters' });
  }
  if (typeof score !== 'number' || score < 0 || !Number.isFinite(score)) {
    return res.status(400).json({ error: 'Invalid score' });
  }
  if (typeof difficulty !== 'number' || difficulty < 0 || difficulty > 2) {
    return res.status(400).json({ error: 'Difficulty must be 0, 1, or 2' });
  }

  const scoreInt = Math.floor(score);

  // Check if this session already has a score for this difficulty
  const { data: existing, error: fetchError } = await supabase
    .from('highscores')
    .select('id, score')
    .eq('session_id', session_id)
    .eq('difficulty', difficulty)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is fine
    console.error('Supabase fetch error:', fetchError);
    return res.status(500).json({ 
      error: fetchError.message || 'Failed to check existing score',
      code: fetchError.code
    });
  }

  let result;

  if (existing) {
    // Only update if new score is higher
    if (scoreInt > existing.score) {
      const { data, error } = await supabase
        .from('highscores')
        .update({ 
          score: scoreInt, 
          nickname: nickname.trim() 
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return res.status(500).json({ 
          error: error.message || 'Failed to update score',
          code: error.code
        });
      }
      result = { ...data, updated: true, previous_score: existing.score };
    } else {
      // Score not higher, return existing
      result = { ...existing, updated: false, message: 'Score not higher than existing' };
    }
  } else {
    // Insert new score
    const { data, error } = await supabase
      .from('highscores')
      .insert({
        session_id,
        nickname: nickname.trim(),
        score: scoreInt,
        difficulty
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ 
        error: error.message || 'Failed to insert score',
        code: error.code
      });
    }
    result = { ...data, created: true };
  }

  // Get the rank for this score
  const { count, error: rankError } = await supabase
    .from('highscores')
    .select('*', { count: 'exact', head: true })
    .eq('difficulty', difficulty)
    .gt('score', scoreInt);

  const rank = rankError ? null : (count || 0) + 1;

  return res.status(200).json({ 
    ...result, 
    rank,
    difficulty_name: ['Easy', 'Normal', 'Hard'][difficulty]
  });
}

