-- Migration: Enhance conversations table for WhatsApp thread display
-- Run this in your Supabase SQL Editor

-- Add sender_name column for better message attribution
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS sender_name text;

-- Add index on buyer_id for faster conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id 
ON public.conversations(buyer_id);

-- Add index on channel for filtering by message type
CREATE INDEX IF NOT EXISTS idx_conversations_channel 
ON public.conversations(channel);

-- Add composite index for common query pattern (buyer + channel + time)
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_channel_time 
ON public.conversations(buyer_id, channel, created_at DESC);

-- Verify the conversations table structure
-- Expected columns: id, buyer_id, channel, direction, content, status, sender_name, created_at
-- You can check with: SELECT * FROM conversations LIMIT 1;
