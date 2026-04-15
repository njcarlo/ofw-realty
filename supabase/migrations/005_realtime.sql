-- ============================================================
-- Enable Realtime on key tables
-- Runs AFTER tables are created (migration 001-004)
-- ============================================================

-- Enable Realtime on listings (for live map pin removal)
ALTER PUBLICATION supabase_realtime ADD TABLE listings;

-- Enable Realtime on notifications (for OFW dashboard live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable Realtime on inquiries (for live inquiry status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE inquiries;

-- Enable Realtime on messages (for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
