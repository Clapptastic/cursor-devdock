-- Migration: Initialize processed_data Table
-- Created at: 2025-04-05T00:00:00.000Z

-- Run migration
BEGIN;

-- Create processed_data table
CREATE TABLE IF NOT EXISTS processed_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original JSONB NOT NULL,
  processed JSONB NOT NULL,
  options JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  status TEXT DEFAULT 'completed',
  source TEXT,
  user_id UUID,
  
  -- Add index for faster lookups
  CONSTRAINT processed_data_id_unique UNIQUE (id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_processed_data_created_at ON processed_data (created_at);
CREATE INDEX IF NOT EXISTS idx_processed_data_status ON processed_data (status);
CREATE INDEX IF NOT EXISTS idx_processed_data_user_id ON processed_data (user_id) WHERE user_id IS NOT NULL;

-- Add RLS policy
ALTER TABLE processed_data ENABLE ROW LEVEL SECURITY;

-- Policy for API access (allows service to access all rows)
CREATE POLICY api_access_policy ON processed_data
  USING (true)
  WITH CHECK (true);

-- Record migration
INSERT INTO migrations (name, applied_at)
VALUES ('20250405_init_processed_data.sql', NOW())
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Rollback migration
-- BEGIN;
-- 
-- DROP TABLE IF EXISTS processed_data;
-- 
-- -- Remove migration record
-- DELETE FROM migrations WHERE name = '20250405_init_processed_data.sql';
-- 
-- COMMIT; 