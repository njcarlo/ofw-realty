-- Migration 012: Negotiation Deal Room — RLS, Realtime, and Storage
-- Enables RLS on all 7 negotiation tables, creates the is_room_participant()
-- SECURITY DEFINER helper, adds SELECT policies, wires Realtime publication,
-- and provisions the deal-room-docs private storage bucket.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enable RLS on all 7 tables
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE negotiation_rooms               ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_room_participants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_offers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_message_reads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_checklist_items     ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SECURITY DEFINER helper: is_room_participant(p_room_id uuid)
--    Returns true if auth.uid() is listed in negotiation_room_participants
--    for the given room.  SECURITY DEFINER avoids recursive RLS evaluation
--    (same pattern as 006_fix_rls_recursion.sql).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_room_participant(p_room_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM negotiation_room_participants
    WHERE room_id = p_room_id
      AND user_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SELECT policies
--    All writes go through the NestJS API (service-role key bypasses RLS).
--    No UPDATE/DELETE policies are added to negotiation_offers (append-only).
-- ─────────────────────────────────────────────────────────────────────────────

-- negotiation_rooms: use id (the PK) as the room identifier
CREATE POLICY "room_participants_select" ON negotiation_rooms
  FOR SELECT USING (is_room_participant(id));

-- negotiation_room_participants: participants can see who else is in the room
CREATE POLICY "room_participants_select_participants" ON negotiation_room_participants
  FOR SELECT USING (is_room_participant(room_id));

-- negotiation_offers: SELECT only — no UPDATE/DELETE (append-only table)
CREATE POLICY "offer_participants_select" ON negotiation_offers
  FOR SELECT USING (is_room_participant(room_id));

-- negotiation_messages
CREATE POLICY "message_participants_select" ON negotiation_messages
  FOR SELECT USING (is_room_participant(room_id));

-- negotiation_message_reads
CREATE POLICY "message_reads_participants_select" ON negotiation_message_reads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM negotiation_messages m
      WHERE m.id = message_id
        AND is_room_participant(m.room_id)
    )
  );

-- negotiation_documents: filter out soft-deleted rows (deleted_at IS NULL)
CREATE POLICY "document_participants_select" ON negotiation_documents
  FOR SELECT USING (
    is_room_participant(room_id)
    AND deleted_at IS NULL
  );

-- negotiation_checklist_items
CREATE POLICY "checklist_participants_select" ON negotiation_checklist_items
  FOR SELECT USING (is_room_participant(room_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Realtime publication — all 7 tables
-- ─────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE negotiation_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE negotiation_room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE negotiation_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE negotiation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE negotiation_message_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE negotiation_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE negotiation_checklist_items;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. deal-room-docs private storage bucket  (task 1.3)
--    25 MB limit, PDF / JPEG / PNG / DOCX only, server-side encrypted at rest.
--    All upload/download is handled exclusively through the NestJS API
--    (admin/service-role client) — no direct client Storage access.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deal-room-docs',
  'deal-room-docs',
  false,       -- private bucket
  26214400,    -- 25 MB (25 * 1024 * 1024)
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;
