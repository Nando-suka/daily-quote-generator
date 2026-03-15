-- ================================================================
-- Daily Quote Generator — Supabase Database Schema
-- ================================================================
-- Run this script in your Supabase SQL Editor to set up the
-- required table structure and seed data.
-- ================================================================

-- 1. Create the quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content    TEXT        NOT NULL,
  author     VARCHAR(120) NOT NULL DEFAULT 'Unknown',
  category   VARCHAR(60),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_quotes_category ON public.quotes (category);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 4. Allow anonymous read access (required for the anon key)
CREATE POLICY "Allow anonymous read access"
  ON public.quotes
  FOR SELECT
  USING (true);

-- 5. Seed the table with sample quotes
INSERT INTO public.quotes (content, author, category) VALUES
  ('The only way to do great work is to love what you do.', 'Steve Jobs', 'work'),
  ('It does not matter how slowly you go as long as you do not stop.', 'Confucius', 'perseverance'),
  ('Life is what happens when you''re busy making other plans.', 'John Lennon', 'life'),
  ('In the middle of every difficulty lies opportunity.', 'Albert Einstein', 'mindset'),
  ('The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt', 'dreams'),
  ('It is during our darkest moments that we must focus to see the light.', 'Aristotle', 'resilience'),
  ('The best time to plant a tree was 20 years ago. The second best time is now.', 'Chinese Proverb', 'action'),
  ('Believe you can and you''re halfway there.', 'Theodore Roosevelt', 'mindset'),
  ('You are never too old to set another goal or to dream a new dream.', 'C.S. Lewis', 'dreams'),
  ('Do one thing every day that scares you.', 'Eleanor Roosevelt', 'courage'),
  ('What lies behind us and what lies before us are tiny matters compared to what lies within us.', 'Ralph Waldo Emerson', 'inner-strength'),
  ('The only impossible journey is the one you never begin.', 'Tony Robbins', 'action'),
  ('Success is not final, failure is not fatal: It is the courage to continue that counts.', 'Winston Churchill', 'resilience'),
  ('Your time is limited, so don''t waste it living someone else''s life.', 'Steve Jobs', 'life'),
  ('The way to get started is to quit talking and begin doing.', 'Walt Disney', 'action'),
  ('If life were predictable it would cease to be life, and be without flavor.', 'Eleanor Roosevelt', 'life'),
  ('In order to write about life first you must live it.', 'Ernest Hemingway', 'creativity'),
  ('The most wasted of all days is one without laughter.', 'Nicolas Chamfort', 'happiness'),
  ('You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.', 'Dr. Seuss', 'self-determination'),
  ('If you look at what you have in life, you''ll always have more.', 'Oprah Winfrey', 'gratitude');
