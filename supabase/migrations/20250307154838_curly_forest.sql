/*
  # Add sample data for testing

  This migration adds sample data for:
  1. Events - Various tech conferences and exhibitions
  2. Conferences - Sessions within events
  3. Stands - Company booths at exhibitions
  4. Networking Rooms - Meeting spaces for attendees

  All data is fictional and for testing purposes only.
*/

-- First, create a test organizer user
INSERT INTO auth.users (id, email)
VALUES 
  ('d0d54aa8-9e12-4fa3-8c42-0e2f3aff6666', 'organizer@test.com')
ON CONFLICT (id) DO NOTHING;

-- Sample Events
INSERT INTO events (
  title,
  description,
  start_date,
  end_date,
  type,
  status,
  banner_url,
  max_attendees,
  organizer_id
) VALUES 
(
  'Tech Innovation Summit 2025',
  'Join us for the largest tech summit focusing on AI, blockchain, and future technologies.',
  '2025-06-15 09:00:00+00',
  '2025-06-17 18:00:00+00',
  'hybrid',
  'published',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=2000',
  1000,
  'd0d54aa8-9e12-4fa3-8c42-0e2f3aff6666'
),
(
  'Digital Marketing Expo 2025',
  'Explore the latest trends in digital marketing, SEO, and social media strategies.',
  '2025-07-20 10:00:00+00',
  '2025-07-22 17:00:00+00',
  'exhibition',
  'published',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2000',
  800,
  'd0d54aa8-9e12-4fa3-8c42-0e2f3aff6666'
),
(
  'Startup Innovation Conference',
  'Connect with investors, founders, and industry experts in this premier startup event.',
  '2025-08-10 09:00:00+00',
  '2025-08-12 18:00:00+00',
  'conference',
  'published',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=2000',
  500,
  'd0d54aa8-9e12-4fa3-8c42-0e2f3aff6666'
);

-- Create test speakers
INSERT INTO auth.users (id, email)
VALUES 
  ('c82e0761-0e34-4c1d-a6e1-a485a12c0000', 'speaker1@test.com'),
  ('c82e0761-0e34-4c1d-a6e1-a485a12c0001', 'speaker2@test.com'),
  ('c82e0761-0e34-4c1d-a6e1-a485a12c0002', 'speaker3@test.com')
ON CONFLICT (id) DO NOTHING;

-- Sample Conferences
INSERT INTO conferences (
  event_id,
  title,
  description,
  type,
  start_time,
  end_time,
  speaker_ids,
  stream_url
) VALUES 
(
  (SELECT id FROM events WHERE title = 'Tech Innovation Summit 2025' LIMIT 1),
  'Future of AI in Enterprise',
  'Explore how artificial intelligence is transforming enterprise operations and decision-making.',
  'keynote',
  '2025-06-15 10:00:00+00',
  '2025-06-15 11:30:00+00',
  ARRAY['c82e0761-0e34-4c1d-a6e1-a485a12c0000'::uuid],
  'https://stream.example.com/ai-keynote'
),
(
  (SELECT id FROM events WHERE title = 'Tech Innovation Summit 2025' LIMIT 1),
  'Blockchain Workshop: Building DApps',
  'Hands-on workshop on building decentralized applications.',
  'workshop',
  '2025-06-15 13:00:00+00',
  '2025-06-15 15:00:00+00',
  ARRAY['c82e0761-0e34-4c1d-a6e1-a485a12c0001'::uuid],
  'https://stream.example.com/blockchain-workshop'
),
(
  (SELECT id FROM events WHERE title = 'Startup Innovation Conference' LIMIT 1),
  'Fundraising Strategies Panel',
  'Learn from successful founders about effective fundraising strategies.',
  'panel',
  '2025-08-10 11:00:00+00',
  '2025-08-10 12:30:00+00',
  ARRAY['c82e0761-0e34-4c1d-a6e1-a485a12c0002'::uuid],
  'https://stream.example.com/fundraising-panel'
);

-- Create test staff members
INSERT INTO auth.users (id, email)
VALUES 
  ('c82e0761-0e34-4c1d-a6e1-a485a12c0003', 'staff1@test.com'),
  ('c82e0761-0e34-4c1d-a6e1-a485a12c0004', 'staff2@test.com'),
  ('c82e0761-0e34-4c1d-a6e1-a485a12c0005', 'staff3@test.com')
ON CONFLICT (id) DO NOTHING;

-- Sample Stands
INSERT INTO stands (
  event_id,
  company_name,
  description,
  type,
  banner_url,
  logo_url,
  contact_email,
  website_url,
  staff_ids
) VALUES 
(
  (SELECT id FROM events WHERE title = 'Digital Marketing Expo 2025' LIMIT 1),
  'TechCorp Solutions',
  'Leading provider of enterprise software solutions.',
  'premium',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1549421263-6064833b071b?auto=format&fit=crop&q=80&w=200',
  'contact@techcorp.example.com',
  'https://techcorp.example.com',
  ARRAY['c82e0761-0e34-4c1d-a6e1-a485a12c0003'::uuid]
),
(
  (SELECT id FROM events WHERE title = 'Digital Marketing Expo 2025' LIMIT 1),
  'Digital Marketing Pro',
  'Digital marketing automation and analytics platform.',
  'enterprise',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&q=80&w=200',
  'hello@dmpro.example.com',
  'https://dmpro.example.com',
  ARRAY['c82e0761-0e34-4c1d-a6e1-a485a12c0004'::uuid]
),
(
  (SELECT id FROM events WHERE title = 'Tech Innovation Summit 2025' LIMIT 1),
  'AI Solutions Inc',
  'Artificial Intelligence and Machine Learning solutions for enterprises.',
  'enterprise',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=200',
  'info@aisolutions.example.com',
  'https://aisolutions.example.com',
  ARRAY['c82e0761-0e34-4c1d-a6e1-a485a12c0005'::uuid]
);

-- Sample Networking Rooms
INSERT INTO networking_rooms (
  event_id,
  name,
  description,
  topic_tags,
  max_participants,
  is_private,
  scheduled_start,
  scheduled_end
) VALUES 
(
  (SELECT id FROM events WHERE title = 'Tech Innovation Summit 2025' LIMIT 1),
  'AI Innovators Lounge',
  'Connect with AI researchers and practitioners.',
  ARRAY['AI', 'Machine Learning', 'Deep Learning'],
  50,
  false,
  '2025-06-15 12:00:00+00',
  '2025-06-15 14:00:00+00'
),
(
  (SELECT id FROM events WHERE title = 'Startup Innovation Conference' LIMIT 1),
  'Founder Networking',
  'Exclusive networking space for startup founders.',
  ARRAY['Startups', 'Entrepreneurship', 'Networking'],
  30,
  true,
  '2025-08-10 15:00:00+00',
  '2025-08-10 17:00:00+00'
),
(
  (SELECT id FROM events WHERE title = 'Digital Marketing Expo 2025' LIMIT 1),
  'Digital Marketing Trends',
  'Discuss the latest trends in digital marketing.',
  ARRAY['Digital Marketing', 'SEO', 'Social Media'],
  40,
  false,
  '2025-07-20 13:00:00+00',
  '2025-07-20 15:00:00+00'
);