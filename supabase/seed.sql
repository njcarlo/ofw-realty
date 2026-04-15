-- ============================================================
-- Seed Data: Dummy Listings for OFW Realty Marketplace
-- Run this in Supabase SQL Editor after migrations
-- ============================================================

-- Insert a dummy broker company
INSERT INTO broker_companies (id, name, slug, description, office_address, verified_badge, verified_at)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'LupaPH Realty',
  'lupaph-realty',
  'Premier real estate brokerage serving OFWs and Filipinos abroad.',
  'Makati City, Metro Manila',
  true,
  now()
) ON CONFLICT (id) DO NOTHING;

-- Insert a dummy user (realtor)
INSERT INTO users (id, email, full_name, role, email_verified)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000002',
  'agent@lupaph.com',
  'Maria Santos',
  'realtor',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert realtor profile
INSERT INTO realtors (id, slug, prc_license_number, primary_brokerage, verified_badge, verified_at)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000002',
  'maria-santos',
  'PRC-2024-001234',
  'a1b2c3d4-0000-0000-0000-000000000001',
  true,
  now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LISTINGS — Spread across the Philippines
-- ============================================================

INSERT INTO listings (id, realtor_id, brokerage_id, property_type, title, description, price_php, lat, lng, address, province, city, barangay, lot_area_sqm, block_number, lot_number, status, is_featured, blockchain_verified)
VALUES

-- Metro Manila
('b1000001-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'condo', 'Modern Studio Condo in BGC', 'Brand new studio unit in the heart of BGC. Perfect for investment or OFW family use.',
 4500000, 14.5547, 121.0509, 'Bonifacio Global City', 'Metro Manila', 'Taguig', 'BGC', 32, 'A', '12', 'active', true, true),

('b1000002-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'house_and_lot', 'House & Lot in Quezon City', 'Spacious 3-bedroom house in a quiet subdivision. Near schools and hospitals.',
 8500000, 14.6760, 121.0437, 'Batasan Hills', 'Metro Manila', 'Quezon City', 'Batasan Hills', 120, 'B', '5', 'active', false, true),

('b1000003-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'residential_lot', 'Residential Lot in Paranaque', 'Clean title lot in a prime location near NAIA.',
 3200000, 14.4793, 121.0198, 'BF Homes', 'Metro Manila', 'Paranaque', 'BF Homes', 200, 'C', '8', 'active', false, false),

-- Cavite
('b1000004-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'house_and_lot', 'House & Lot in Bacoor Cavite', 'Ready for occupancy 2-bedroom townhouse. Near Aguinaldo Highway.',
 2800000, 14.4624, 120.9645, 'Molino Blvd', 'Cavite', 'Bacoor', 'Molino', 80, 'D', '3', 'active', true, true),

('b1000005-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'residential_lot', 'Lot in Dasmariñas Cavite', 'Corner lot in a gated subdivision. Ideal for OFW investment.',
 1500000, 14.3294, 120.9367, 'Salawag', 'Cavite', 'Dasmariñas', 'Salawag', 150, 'E', '22', 'active', false, true),

('b1000006-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'house_and_lot', 'RFO House in General Trias', 'Ready for occupancy 3-bedroom house. Near CALAX exit.',
 3500000, 14.3869, 120.8817, 'Tejero', 'Cavite', 'General Trias', 'Tejero', 100, 'F', '7', 'active', false, false),

-- Laguna
('b1000007-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'residential_lot', 'Lot in Sta. Rosa Laguna', 'Prime lot near Nuvali. Great appreciation potential.',
 2200000, 14.2830, 121.1114, 'Tagaytay Road', 'Laguna', 'Sta. Rosa', 'Tagaytay Road', 180, 'G', '15', 'active', true, true),

('b1000008-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'farm_lot', 'Farm Lot in Calamba Laguna', 'Agricultural lot with mountain view. Near hot spring resorts.',
 1800000, 14.2115, 121.1653, 'Pansol', 'Laguna', 'Calamba', 'Pansol', 500, 'H', '1', 'active', false, false),

-- Cebu
('b1000009-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'condo', 'Condo Unit in Cebu IT Park', 'High-rise condo in the business district. Fully furnished.',
 5200000, 10.3310, 123.9054, 'Cebu IT Park', 'Cebu', 'Cebu City', 'Lahug', 45, 'I', '18', 'active', true, true),

('b1000010-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'house_and_lot', 'House & Lot in Mandaue Cebu', 'Corner house in a quiet village. Near SM Mandaue.',
 4800000, 10.3236, 123.9223, 'Casuntingan', 'Cebu', 'Mandaue', 'Casuntingan', 110, 'J', '9', 'active', false, true),

-- Davao
('b1000011-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'residential_lot', 'Lot in Davao City', 'Titled lot in a prime subdivision near Abreeza Mall.',
 2500000, 7.0731, 125.6128, 'Matina', 'Davao del Sur', 'Davao City', 'Matina', 200, 'K', '4', 'active', false, false),

('b1000012-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'house_and_lot', 'House & Lot in Davao City', 'Modern 4-bedroom house in a gated community.',
 7500000, 7.1907, 125.4553, 'Buhangin', 'Davao del Sur', 'Davao City', 'Buhangin', 150, 'L', '11', 'active', true, true),

-- Pampanga
('b1000013-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'commercial', 'Commercial Lot in Angeles City', 'Prime commercial lot along MacArthur Highway.',
 6000000, 15.1450, 120.5887, 'MacArthur Highway', 'Pampanga', 'Angeles City', 'Balibago', 300, 'M', '2', 'active', false, true),

-- Batangas
('b1000014-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'residential_lot', 'Beach Lot in Batangas', 'Lot with sea view near Laiya Beach. Perfect for vacation home.',
 3800000, 13.6218, 121.3680, 'Laiya', 'Batangas', 'San Juan', 'Laiya', 250, 'N', '6', 'active', true, false),

-- Iloilo
('b1000015-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 'house_and_lot', 'House & Lot in Iloilo City', 'Elegant 3-bedroom house in Mandurriao district.',
 4200000, 10.7202, 122.5621, 'Mandurriao', 'Iloilo', 'Iloilo City', 'Mandurriao', 130, 'O', '14', 'active', false, true)

ON CONFLICT (id) DO NOTHING;

-- Insert dummy photos for each listing
INSERT INTO listing_photos (listing_id, url, is_primary, sort_order)
SELECT id, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', true, 0
FROM listings WHERE id LIKE 'b1000%'
ON CONFLICT DO NOTHING;

INSERT INTO listing_photos (listing_id, url, is_primary, sort_order)
SELECT id, 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', false, 1
FROM listings WHERE id LIKE 'b1000%'
ON CONFLICT DO NOTHING;

INSERT INTO listing_photos (listing_id, url, is_primary, sort_order)
SELECT id, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', false, 2
FROM listings WHERE id LIKE 'b1000%'
ON CONFLICT DO NOTHING;
