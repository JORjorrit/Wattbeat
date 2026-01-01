# CaveFlyer Energy 2025

A tunnel flying game where the level is procedurally generated from EPEX electricity price data for 2025.

## Features

- **Dynamic tunnel generation** from real energy price volatility
- **Three difficulty modes** (Easy → Normal → Hard) that unlock progressively
- **Global leaderboard** powered by Supabase
- **Social sharing** with dynamically generated share cards

## Development

### Prerequisites

- Node.js 18+
- A Supabase project (for leaderboard)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Update `.env.local` with your Supabase credentials from the Supabase dashboard.

4. Run the Supabase migration (see `supabase/schema.sql`).

5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Deploy!

## Controls

- **Space** / **Click** / **Tap** - Flap upward
- **R** - Restart from beginning (clears checkpoint)
- **Enter** - Continue after phase completion

## Data Source

The game uses `daprices-epex-elec.csv` containing EPEX Day-Ahead Hourly electricity prices for 2025.
