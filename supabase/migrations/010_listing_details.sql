-- Migration 010: Add Lamudi-parity listing detail fields

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS listing_type    text DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent')),
  ADD COLUMN IF NOT EXISTS floor_area_sqm  numeric(10,2),
  ADD COLUMN IF NOT EXISTS bedrooms        integer CHECK (bedrooms >= 0),
  ADD COLUMN IF NOT EXISTS bathrooms       integer CHECK (bathrooms >= 0),
  ADD COLUMN IF NOT EXISTS parking_slots   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS furnishing      text CHECK (furnishing IN ('unfurnished', 'semi_furnished', 'fully_furnished')),
  ADD COLUMN IF NOT EXISTS amenities       text[],
  ADD COLUMN IF NOT EXISTS boundary_geojson jsonb;

-- Index for rent/sale filter
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(listing_type) WHERE status = 'active';

-- Index for bedroom filter
CREATE INDEX IF NOT EXISTS idx_listings_bedrooms ON listings(bedrooms) WHERE status = 'active';
