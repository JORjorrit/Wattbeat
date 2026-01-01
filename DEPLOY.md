# Deployment Guide

## 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`:
   - This creates the `highscores` table with proper indexes
   - Sets up Row Level Security policies
   - Creates helper functions for ranking

3. Get your API credentials from **Settings > API**:
   - `SUPABASE_URL` - Your project URL
   - `SUPABASE_ANON_KEY` - Your anon/public key

## 2. Vercel Deployment

### Option A: Deploy via CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

### Option B: Deploy via GitHub

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Vercel will auto-detect the configuration from `vercel.json`

### Environment Variables

Add these in Vercel Dashboard > Project > Settings > Environment Variables:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |

## 3. Test the Deployment

1. Open your Vercel deployment URL
2. Play the game and complete a level
3. Enter a nickname when prompted
4. Your score should appear on the leaderboard
5. Try sharing your score via the share modal

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scores?difficulty=0` | GET | Fetch leaderboard for a difficulty |
| `/api/scores` | POST | Submit a score |
| `/api/og?score=...` | GET | Generate share card image |

## Local Development

```bash
# Install dependencies
npm install

# Create local env file
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run with Vercel dev server
npm run dev

# Or serve static files only (no API)
npx serve public
```

## Troubleshooting

### Leaderboard not loading
- Check browser console for errors
- Verify Supabase credentials are set in Vercel
- Check Supabase dashboard for RLS policy issues

### Score not submitting
- Ensure you have a nickname set
- Check that the API endpoint is accessible
- Verify the score is being sent in the correct format

### Share card not generating
- The `/api/og` endpoint requires the edge runtime
- Check Vercel function logs for errors

