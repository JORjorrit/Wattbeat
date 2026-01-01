-- CaveFlyer Energy 2025 - Highscores Schema
-- Run this in your Supabase SQL Editor

-- Create the highscores table
CREATE TABLE IF NOT EXISTS highscores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  nickname TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 20),
  score INTEGER NOT NULL CHECK (score >= 0),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 0 AND 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One score per device per difficulty (allows updating personal best)
  UNIQUE(session_id, difficulty)
);

-- Create index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_highscores_leaderboard 
  ON highscores(difficulty, score DESC);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_highscores_session 
  ON highscores(session_id);

-- Enable Row Level Security
ALTER TABLE highscores ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read the leaderboard
CREATE POLICY "Public read access" ON highscores
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert scores (trust-based)
CREATE POLICY "Anyone can insert scores" ON highscores
  FOR INSERT
  WITH CHECK (true);

-- Policy: Session owner can update their own scores
CREATE POLICY "Session owner can update" ON highscores
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function to get rank for a specific score
CREATE OR REPLACE FUNCTION get_score_rank(p_difficulty INTEGER, p_score INTEGER)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER + 1
  FROM highscores
  WHERE difficulty = p_difficulty AND score > p_score;
$$ LANGUAGE SQL STABLE;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_highscores_updated_at
  BEFORE UPDATE ON highscores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

