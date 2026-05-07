-- Migration 011: Negotiation Deal Room tables
-- Creates all 7 tables for the Negotiation Deal Room feature with constraints and CHECK clauses.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. negotiation_rooms
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE negotiation_rooms (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                     uuid        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  listing_id               uuid        NOT NULL REFERENCES listings(id),
  buyer_id                 uuid        NOT NULL REFERENCES users(id),
  status                   text        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','offer_accepted','reserved','closed','cancelled')),
  room_secret_enc          text        NOT NULL,
  inactivity_notified_at   timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- Partial unique index: only one active room per buyer+listing combination
-- (allows multiple rows for the same buyer+listing when status differs)
CREATE UNIQUE INDEX negotiation_rooms_active_unique
  ON negotiation_rooms (listing_id, buyer_id, status)
  WHERE status = 'active';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. negotiation_room_participants
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE negotiation_room_participants (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   uuid        NOT NULL REFERENCES negotiation_rooms(id) ON DELETE CASCADE,
  user_id   uuid        NOT NULL REFERENCES users(id),
  role      text        NOT NULL CHECK (role IN ('buyer','seller','realtor')),
  added_by  uuid        REFERENCES users(id),
  added_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. negotiation_offers  (append-only — no UPDATE/DELETE RLS will be added)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE negotiation_offers (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid           NOT NULL REFERENCES negotiation_rooms(id),
  submitted_by    uuid           NOT NULL REFERENCES users(id),
  submitter_role  text           NOT NULL CHECK (submitter_role IN ('buyer','seller','realtor')),
  offer_type      text           NOT NULL CHECK (offer_type IN ('offer','counter_offer')),
  amount_php      numeric(15,2)  NOT NULL,
  payment_method  text           CHECK (payment_method IN ('cash','bank_financing','pag_ibig','in_house')),
  conditions      text,
  response        text           CHECK (response IN ('accepted','declined','countered')),
  responded_by    uuid           REFERENCES users(id),
  responded_at    timestamptz,
  created_at      timestamptz    NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. negotiation_messages  (stores AES-GCM encrypted ciphertext + IV)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE negotiation_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid        NOT NULL REFERENCES negotiation_rooms(id),
  sender_id       uuid        NOT NULL REFERENCES users(id),
  sender_role     text        NOT NULL CHECK (sender_role IN ('buyer','seller','realtor')),
  content_enc     text        NOT NULL,   -- AES-GCM encrypted ciphertext (base64)
  content_iv      text        NOT NULL,   -- AES-GCM IV (base64)
  message_type    text        NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image')),
  attachment_url  text,                   -- Supabase Storage signed URL (for images)
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. negotiation_message_reads
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE negotiation_message_reads (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  uuid        NOT NULL REFERENCES negotiation_messages(id) ON DELETE CASCADE,
  reader_id   uuid        NOT NULL REFERENCES users(id),
  read_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, reader_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. negotiation_documents  (soft-delete via deleted_at)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE negotiation_documents (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id          uuid        NOT NULL REFERENCES negotiation_rooms(id),
  uploaded_by      uuid        NOT NULL REFERENCES users(id),
  uploader_role    text        NOT NULL CHECK (uploader_role IN ('buyer','seller','realtor')),
  file_name        text        NOT NULL,
  file_type        text        NOT NULL CHECK (file_type IN ('pdf','jpeg','png','docx')),
  file_size_bytes  integer     NOT NULL,
  storage_path     text        NOT NULL,   -- Supabase Storage object path
  category         text        NOT NULL CHECK (category IN (
                     'proof_of_funds','government_id','spa','reservation_agreement',
                     'contract_to_sell','title_copy','other'
                   )),
  deleted_at       timestamptz,            -- soft delete; NULL = active
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. negotiation_checklist_items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE negotiation_checklist_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid        NOT NULL REFERENCES negotiation_rooms(id),
  label       text        NOT NULL,
  sort_order  integer     NOT NULL,
  is_system   boolean     NOT NULL DEFAULT true,   -- false = custom item added by Realtor
  status      text        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','in_progress','completed')),
  updated_by  uuid        REFERENCES users(id),
  updated_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
