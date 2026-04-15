-- Migration 007: Add missing columns to ad_campaigns for production ads integration

ALTER TABLE ad_campaigns
  ADD COLUMN IF NOT EXISTS caption          text,
  ADD COLUMN IF NOT EXISTS image_url        text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS duration_days    integer DEFAULT 7;

-- Extend status check to include 'stopped'
ALTER TABLE ad_campaigns
  DROP CONSTRAINT IF EXISTS ad_campaigns_status_check;

ALTER TABLE ad_campaigns
  ADD CONSTRAINT ad_campaigns_status_check
  CHECK (status IN ('pending_review','active','paused','completed','rejected','stopped'));
