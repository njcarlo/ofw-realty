-- ============================================================
-- Seed Data: Services Portal — Provider Profiles, Requests,
--            Proposals, Engagements, Ratings, Messages
-- Run this in Supabase SQL Editor after migrations (015_services_portal.sql)
-- Requires demo auth users to exist first (buyer, agent, broker, seller)
-- ============================================================

DO $$
DECLARE
  -- Demo user IDs (resolved from auth.users via public.users)
  buyer_id    uuid;
  seller_id   uuid;
  agent_id    uuid;
  broker_id   uuid;

  -- Provider profile IDs
  prov1_id    uuid := 'c0000001-0000-0000-0000-000000000001';
  prov2_id    uuid := 'c0000001-0000-0000-0000-000000000002';
  prov3_id    uuid := 'c0000001-0000-0000-0000-000000000003';
  prov4_id    uuid := 'c0000001-0000-0000-0000-000000000004';
  prov5_id    uuid := 'c0000001-0000-0000-0000-000000000005';

  -- Service request IDs
  req1_id     uuid := 'd0000001-0000-0000-0000-000000000001';
  req2_id     uuid := 'd0000001-0000-0000-0000-000000000002';
  req3_id     uuid := 'd0000001-0000-0000-0000-000000000003';
  req4_id     uuid := 'd0000001-0000-0000-0000-000000000004';
  req5_id     uuid := 'd0000001-0000-0000-0000-000000000005';
  req6_id     uuid := 'd0000001-0000-0000-0000-000000000006';

  -- Proposal IDs
  prop1_id    uuid := 'e0000001-0000-0000-0000-000000000001';
  prop2_id    uuid := 'e0000001-0000-0000-0000-000000000002';
  prop3_id    uuid := 'e0000001-0000-0000-0000-000000000003';
  prop4_id    uuid := 'e0000001-0000-0000-0000-000000000004';
  prop5_id    uuid := 'e0000001-0000-0000-0000-000000000005';

  -- Engagement IDs
  eng1_id     uuid := 'f0000001-0000-0000-0000-000000000001';
  eng2_id     uuid := 'f0000001-0000-0000-0000-000000000002';

BEGIN
  -- ── Resolve demo user IDs ──────────────────────────────────────────────────
  SELECT id INTO buyer_id  FROM users WHERE email = 'buyer@demo.lupaph.com'  LIMIT 1;
  SELECT id INTO seller_id FROM users WHERE email = 'seller@demo.lupaph.com' LIMIT 1;
  SELECT id INTO agent_id  FROM users WHERE email = 'agent@demo.lupaph.com'  LIMIT 1;
  SELECT id INTO broker_id FROM users WHERE email = 'broker@demo.lupaph.com' LIMIT 1;

  -- Fall back to fixed UUIDs if demo users haven't been created yet
  IF buyer_id  IS NULL THEN buyer_id  := 'a1b2c3d4-0000-0000-0000-000000000010'::uuid; END IF;
  IF seller_id IS NULL THEN seller_id := 'a1b2c3d4-0000-0000-0000-000000000004'::uuid; END IF;
  IF agent_id  IS NULL THEN agent_id  := 'a1b2c3d4-0000-0000-0000-000000000011'::uuid; END IF;
  IF broker_id IS NULL THEN broker_id := 'a1b2c3d4-0000-0000-0000-000000000012'::uuid; END IF;

  -- ── 1. PROVIDER PROFILES ──────────────────────────────────────────────────
  -- Using agent, broker, seller as the "service provider" users for demo purposes

  INSERT INTO provider_profiles (
    id, user_id, full_name, license_number, license_type,
    license_verification_status, service_types, coverage_areas,
    bio, contact_phone, contact_email, photo_url,
    availability, status, is_featured, avg_rating, completed_engagements,
    created_at, updated_at
  ) VALUES
  -- Provider 1: Notary / Legal (agent user)
  (
    prov1_id, agent_id,
    'Atty. Maria Santos',
    'PRC-2024-001234', 'prc', 'verified',
    ARRAY['notarization', 'legal_consultation', 'title_transfer'],
    ARRAY['Metro Manila', 'Cavite', 'Laguna'],
    'Licensed attorney with 10+ years specializing in real estate transactions, title transfers, and notarization for OFW clients. Fluent in English and Filipino.',
    '+63 917 123 4567', 'atty.santos@demo.lupaph.com',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
    'available', 'approved', true, 4.9, 87,
    now() - interval '6 months', now()
  ),
  -- Provider 2: Geodetic Engineer (broker user)
  (
    prov2_id, broker_id,
    'Engr. Jose Reyes',
    'PRC-2023-005678', 'prc', 'verified',
    ARRAY['geodetic_survey', 'building_permit_processing'],
    ARRAY['Cavite', 'Laguna', 'Batangas', 'Metro Manila'],
    'Licensed Geodetic Engineer with expertise in lot surveys, subdivision plans, and building permit processing. Serving OFW clients since 2015.',
    '+63 918 234 5678', 'engr.reyes@demo.lupaph.com',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80',
    'available', 'approved', true, 4.8, 64,
    now() - interval '5 months', now()
  ),
  -- Provider 3: Property Appraiser (seller user)
  (
    prov3_id, seller_id,
    'Maria Cruz, MAE',
    'PRC-2022-009012', 'prc', 'verified',
    ARRAY['property_appraisal', 'property_tax_assistance'],
    ARRAY['Metro Manila', 'Cebu', 'Davao'],
    'Master Appraiser of the Philippines with 15 years of experience. Specializes in residential and commercial property valuation for bank financing and estate settlement.',
    '+63 919 345 6789', 'maria.cruz@demo.lupaph.com',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
    'available', 'approved', false, 4.7, 52,
    now() - interval '4 months', now()
  ),
  -- Provider 4: Tax Specialist (buyer user)
  (
    prov4_id, buyer_id,
    'Carlo Mendoza, CPA',
    'PRC-2021-003456', 'prc', 'verified',
    ARRAY['property_tax_assistance', 'title_transfer', 'notarization'],
    ARRAY['Pampanga', 'Bulacan', 'Metro Manila', 'Cavite'],
    'CPA specializing in real estate tax compliance, capital gains tax, documentary stamp tax, and BIR clearance processing. Fast turnaround for OFW clients.',
    '+63 920 456 7890', 'carlo.mendoza@demo.lupaph.com',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    'busy', 'approved', false, 4.5, 38,
    now() - interval '3 months', now()
  ),
  -- Provider 5: Multi-service (pending review — for admin demo)
  (
    prov5_id, agent_id,
    'Liza Flores',
    NULL, NULL, 'not_applicable',
    ARRAY['notarization', 'legal_consultation'],
    ARRAY['Cebu', 'Iloilo', 'Davao'],
    'Paralegal with 8 years experience assisting OFW clients with document notarization and legal consultations.',
    '+63 921 567 8901', 'liza.flores@demo.lupaph.com',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    'available', 'pending_review', false, NULL, 0,
    now() - interval '2 days', now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. SERVICE REQUESTS ───────────────────────────────────────────────────

  INSERT INTO service_requests (
    id, requester_id, service_type, description,
    province, city, barangay, preferred_timeline,
    budget_min_php, budget_max_php, status, proposal_count,
    expires_at, created_at, updated_at
  ) VALUES
  -- Request 1: Open — Title Transfer (buyer)
  (
    req1_id, buyer_id, 'title_transfer',
    'I need help transferring the title of a house and lot I purchased in Bacoor, Cavite. The seller has already signed the Deed of Absolute Sale. I am currently based in Dubai and need someone who can process this on my behalf.',
    'Cavite', 'Bacoor', 'Molino',
    '2-3 weeks', 15000, 30000, 'open', 2,
    now() + interval '25 days', now() - interval '5 days', now() - interval '5 days'
  ),
  -- Request 2: Open — Property Appraisal (buyer)
  (
    req2_id, buyer_id, 'property_appraisal',
    'Looking for a licensed appraiser for a 200 sqm residential lot in Sta. Rosa, Laguna. Needed for bank financing purposes (BDO housing loan). Must provide a formal appraisal report.',
    'Laguna', 'Sta. Rosa', 'Tagaytay Road',
    '1 week', 5000, 10000, 'open', 1,
    now() + interval '20 days', now() - interval '3 days', now() - interval '3 days'
  ),
  -- Request 3: In Progress — Notarization (seller)
  (
    req3_id, seller_id, 'notarization',
    'Need a notary public to notarize a Special Power of Attorney (SPA) for my brother who will represent me in a property sale. I am in Saudi Arabia and will send the documents via courier.',
    'Metro Manila', 'Makati', 'Bel-Air',
    'ASAP', 2000, 5000, 'in_progress', 1,
    now() + interval '15 days', now() - interval '10 days', now() - interval '2 days'
  ),
  -- Request 4: Open — Geodetic Survey (seller)
  (
    req4_id, seller_id, 'geodetic_survey',
    'Need a geodetic engineer to conduct a relocation survey for a 500 sqm lot in Calamba, Laguna. The lot has been subdivided and we need updated survey plans for the title transfer.',
    'Laguna', 'Calamba', 'Pansol',
    '2 weeks', 8000, 15000, 'open', 0,
    now() + interval '28 days', now() - interval '1 day', now() - interval '1 day'
  ),
  -- Request 5: Completed — Legal Consultation (buyer)
  (
    req5_id, buyer_id, 'legal_consultation',
    'Needed legal advice on a property dispute involving a lot in Quezon City. The seller is claiming the title is clean but there is an annotation on the title. Needed a lawyer to review the documents.',
    'Metro Manila', 'Quezon City', 'Batasan Hills',
    'Flexible', 3000, 8000, 'completed', 1,
    now() - interval '5 days', now() - interval '45 days', now() - interval '5 days'
  ),
  -- Request 6: Open — Building Permit (buyer)
  (
    req6_id, buyer_id, 'building_permit_processing',
    'Looking for someone to process a building permit for a 2-storey residential house in General Trias, Cavite. Architectural plans are ready. Need someone familiar with the local LGU requirements.',
    'Cavite', 'General Trias', 'Tejero',
    '1 month', 10000, 20000, 'open', 0,
    now() + interval '30 days', now(), now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 3. PROPOSALS ─────────────────────────────────────────────────────────

  INSERT INTO proposals (
    id, request_id, provider_id, message,
    fee_min_php, fee_max_php, estimated_timeline, status,
    created_at, updated_at
  ) VALUES
  -- Proposals for req1 (Title Transfer — open, 2 proposals)
  (
    prop1_id, req1_id, prov1_id,
    'Good day! I am a licensed attorney specializing in title transfers for OFW clients. I can handle the entire process from BIR clearance, capital gains tax, documentary stamp tax, to the actual title transfer at the Registry of Deeds. I have a trusted liaison in Cavite who can process on-site. My fee covers all professional services; government fees are separate.',
    18000, 25000, '2-3 weeks', 'pending',
    now() - interval '4 days', now() - interval '4 days'
  ),
  (
    prop2_id, req1_id, prov4_id,
    'Hello! As a CPA specializing in real estate tax compliance, I can handle the BIR side (CGT, DST, BIR clearance) and coordinate with a partner lawyer for the Registry of Deeds processing. I have processed over 30 title transfers for OFW clients this year alone. I can provide weekly status updates via email or Viber.',
    15000, 22000, '3 weeks', 'pending',
    now() - interval '3 days', now() - interval '3 days'
  ),
  -- Proposal for req2 (Property Appraisal — open, 1 proposal)
  (
    prop3_id, req2_id, prov3_id,
    'Good day! I am a Master Appraiser of the Philippines (MAE) with extensive experience in residential lot appraisals for bank financing. I can conduct the site inspection and deliver a formal appraisal report within 5 business days. My report is accepted by all major banks including BDO, BPI, and Metrobank.',
    6000, 8000, '5 business days', 'pending',
    now() - interval '2 days', now() - interval '2 days'
  ),
  -- Proposal for req3 (Notarization — in_progress, accepted)
  (
    prop4_id, req3_id, prov1_id,
    'Hello! I can notarize your SPA. For OFW clients, I accept documents sent via courier. Once I receive the signed documents, I will notarize them and send them back within 2 business days. I will also provide a scanned copy via email immediately after notarization.',
    2500, 3500, '3-5 business days after document receipt', 'accepted',
    now() - interval '9 days', now() - interval '8 days'
  ),
  -- Proposal for req5 (Legal Consultation — completed)
  (
    prop5_id, req5_id, prov1_id,
    'Good day! I can review the title and all related documents for the property in Quezon City. Annotations on titles can indicate encumbrances, liens, or adverse claims. I will provide a written legal opinion on the status of the title and recommend the appropriate course of action.',
    4000, 6000, '3 business days', 'accepted',
    now() - interval '44 days', now() - interval '44 days'
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 4. ENGAGEMENTS ────────────────────────────────────────────────────────

  INSERT INTO engagements (
    id, request_id, proposal_id, requester_id, provider_id,
    status, requester_completed_at, provider_completed_at,
    rating_window_closes_at, created_at, updated_at
  ) VALUES
  -- Engagement 1: Active (req3 — Notarization in progress)
  (
    eng1_id, req3_id, prop4_id, seller_id, prov1_id,
    'active', NULL, NULL, NULL,
    now() - interval '8 days', now() - interval '2 days'
  ),
  -- Engagement 2: Completed (req5 — Legal Consultation done)
  (
    eng2_id, req5_id, prop5_id, buyer_id, prov1_id,
    'completed',
    now() - interval '6 days',
    now() - interval '7 days',
    now() + interval '8 days',
    now() - interval '44 days', now() - interval '5 days'
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 5. RATINGS ────────────────────────────────────────────────────────────

  INSERT INTO ratings (
    id, engagement_id, requester_id, provider_id,
    score, review, created_at
  ) VALUES
  (
    'g0000001-0000-0000-0000-000000000001',
    eng2_id, buyer_id, prov1_id,
    5,
    'Atty. Santos was extremely professional and thorough. She reviewed the title annotations in detail and gave me a clear written opinion within 2 days. Highly recommend for OFW clients who need reliable legal advice remotely.',
    now() - interval '5 days'
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 6. ENGAGEMENT MESSAGES ────────────────────────────────────────────────

  INSERT INTO engagement_messages (
    id, engagement_id, sender_id, content, created_at
  ) VALUES
  -- Messages for active engagement (eng1 — Notarization)
  (
    'h0000001-0000-0000-0000-000000000001',
    eng1_id, seller_id,
    'Good morning Atty. Santos! I have sent the SPA documents via LBC courier. Tracking number: LBC-2026-123456. Expected delivery is tomorrow.',
    now() - interval '7 days'
  ),
  (
    'h0000001-0000-0000-0000-000000000002',
    eng1_id, agent_id,  -- prov1 user is agent_id
    'Good morning! Thank you for the tracking number. I will watch out for the delivery. Once I receive the documents, I will notarize them and send you a scanned copy via email within the same day.',
    now() - interval '7 days' + interval '2 hours'
  ),
  (
    'h0000001-0000-0000-0000-000000000003',
    eng1_id, agent_id,
    'I have received the documents today. Everything looks good. I will proceed with the notarization this afternoon.',
    now() - interval '6 days'
  ),
  (
    'h0000001-0000-0000-0000-000000000004',
    eng1_id, seller_id,
    'Thank you so much! Please let me know once it is done. I need the notarized SPA by end of this week.',
    now() - interval '6 days' + interval '1 hour'
  ),
  (
    'h0000001-0000-0000-0000-000000000005',
    eng1_id, agent_id,
    'Done! I have notarized the SPA and sent the scanned copy to your email. The original documents will be sent back via LBC tomorrow morning. Tracking number will be provided once shipped.',
    now() - interval '5 days'
  ),
  -- Messages for completed engagement (eng2 — Legal Consultation)
  (
    'h0000001-0000-0000-0000-000000000006',
    eng2_id, buyer_id,
    'Hello Atty. Santos, I have uploaded the title copy and the Deed of Sale to the shared folder I sent to your email. Please let me know if you need any other documents.',
    now() - interval '43 days'
  ),
  (
    'h0000001-0000-0000-0000-000000000007',
    eng2_id, agent_id,
    'Thank you! I have received the documents. The annotation on the title appears to be a mortgage lien from a previous owner. I will prepare a full written opinion by tomorrow.',
    now() - interval '43 days' + interval '3 hours'
  ),
  (
    'h0000001-0000-0000-0000-000000000008',
    eng2_id, agent_id,
    'I have sent the written legal opinion to your email. In summary: the annotation is a cancelled mortgage from 2018 and poses no risk to the transaction. The title is clean. You may proceed with the purchase.',
    now() - interval '42 days'
  ),
  (
    'h0000001-0000-0000-0000-000000000009',
    eng2_id, buyer_id,
    'Thank you so much Atty. Santos! This is very reassuring. I will proceed with the purchase. I am marking this engagement as complete.',
    now() - interval '42 days' + interval '2 hours'
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 7. UPDATE proposal_count on service_requests ─────────────────────────
  UPDATE service_requests SET proposal_count = 2 WHERE id = req1_id;
  UPDATE service_requests SET proposal_count = 1 WHERE id = req2_id;
  UPDATE service_requests SET proposal_count = 1 WHERE id = req3_id;
  UPDATE service_requests SET proposal_count = 1 WHERE id = req5_id;

  RAISE NOTICE 'Services seed completed successfully.';
  RAISE NOTICE '  Provider profiles: 5 (4 approved, 1 pending)';
  RAISE NOTICE '  Service requests: 6 (3 open, 1 in_progress, 1 completed, 1 open)';
  RAISE NOTICE '  Proposals: 5';
  RAISE NOTICE '  Engagements: 2 (1 active, 1 completed)';
  RAISE NOTICE '  Ratings: 1';
  RAISE NOTICE '  Messages: 9';

END $$;
