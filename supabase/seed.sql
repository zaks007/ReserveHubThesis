-- ReserveHub seed data
-- Run this in Supabase SQL Editor AFTER the schema is in place.
-- This inserts all demo institutions, campuses, buildings and spaces.

-- =========================================================
-- INSTITUTIONS
-- =========================================================
INSERT INTO institutions (id, name, type, city, address, description, image_url, rating, lat, lng, contact_email, contact_phone, amenities)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Hotel Divinus Debrecen', 'hotel', 'Debrecen', 'Nagyerdei körút 1, 4032 Debrecen', 'Elegant 5-star hotel in the Great Forest with spa, wellness and conference facilities.', '/__l5e/assets-v1/119efb26-0efe-479c-bfd0-a78b10047ad3/hotel-divinus.png', 5.0, 47.5598, 21.6310, 'info@divinus.hu', '+36-52-000-000', ARRAY['Spa','WiFi','Parking','Restaurant']),
  ('10000000-0000-0000-0000-000000000002', 'University of Debrecen', 'university', 'Debrecen', 'Egyetem tér 1, 4032 Debrecen', 'One of Hungary''s largest universities with multiple campuses across the city.', 'https://upload.wikimedia.org/wikipedia/commons/7/73/DebrecenDSCN3583.JPG', 4.5, 47.5536, 21.6243, 'info@unideb.hu', '+36-52-000-000', ARRAY['WiFi','Library','Cafeteria','Parking']),
  ('10000000-0000-0000-0000-000000000003', 'Agrár Sport Pitch', 'sports', 'Debrecen', 'Böszörményi út 138, 4032 Debrecen', 'Full-size outdoor grass football pitch on the Agrár site — open to clubs, casual players and external bookings.', 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=900', 4.6, 47.5470, 21.5993, 'info@agrarsport.hu', '+36-52-000-000', ARRAY['Grass Pitch','Floodlights','Changing Rooms','Parking']),
  ('10000000-0000-0000-0000-000000000005', 'Aquaticum Thermal Hotel', 'hotel', 'Debrecen', 'Nagyerdei krt. 9-11, 4032 Debrecen', 'Spa and wellness hotel in the Great Forest with meeting rooms and event spaces.', 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Debreceni_Nagyerd%C5%91%2C_sportk%C3%B6zpont_a_magasb%C3%B3l.jpg', 4.4, 47.5614, 21.6189, 'info@aquaticum.hu', '+36-52-000-000', ARRAY['Spa','Thermal Bath','WiFi','Restaurant']),
  ('10000000-0000-0000-0000-000000000006', 'Debreceni Sportcentrum', 'sports', 'Debrecen', 'Oláh Gábor u. 5, 4032 Debrecen', 'Indoor sports complex in the heart of Debrecen offering basketball courts, training halls and equipment rental.', 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=900', 4.7, 47.5586, 21.6363, 'info@debrecenisport.hu', '+36-52-000-000', ARRAY['Indoor Courts','Equipment Rental','Showers','Parking']),
  ('10000000-0000-0000-0000-000000000007', 'Debreceni Közösségi Kert', 'garden', 'Debrecen', 'Pallagi út, 4032 Debrecen', 'Community garden in Debrecen where residents can rent garden plots for growing vegetables, herbs, and flowers.', 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600', 4.8, 47.5430, 21.6280, 'info@kozossegikert.hu', '+36-52-000-000', ARRAY['Tool Shed','Composting','Greenhouse','Water Access']),
  ('10000000-0000-0000-0000-000000000008', 'Debrecen Stays — Airbnb Collection', 'airbnb', 'Debrecen', 'Various locations, Debrecen', 'Curated collection of Airbnb listings across Debrecen — from cozy lofts in the city center to family homes near the Great Forest.', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', 4.7, 47.5316, 21.6273, 'info@debrecenstays.hu', '+36-52-000-000', ARRAY['Self Check-in','WiFi','Kitchen']),
  ('10000000-0000-0000-0000-000000000009', 'G4 Sport Arena', 'sports', 'Debrecen', 'Kassai út 26, 4028 Debrecen', 'Compact 5-a-side artificial-turf pitch with floodlights — perfect for evening matches and small groups.', 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=900', 4.5, 47.5398, 21.6300, 'info@g4sport.hu', '+36-52-000-000', ARRAY['Artificial Turf','Floodlights','Changing Rooms']),
  ('10000000-0000-0000-0000-000000000010', 'West Hostel Sport Centre', 'sports', 'Debrecen', 'Egyetem sgrt. 7, 4032 Debrecen', 'Outdoor 7-a-side artificial pitch next to the West Hostel — available to the public year-round.', 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=900', 4.4, 47.5469, 21.6168, 'info@westhostelsport.hu', '+36-52-000-000', ARRAY['Artificial Turf','Floodlights','Outdoor']);

-- =========================================================
-- CAMPUSES (University of Debrecen only)
-- =========================================================
INSERT INTO campuses (id, institution_id, name, address, lat, lng)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Main Building (Egyetem tér)', 'Egyetem tér 1, 4032 Debrecen', 47.5536, 21.6243),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Kassai Campus', 'Kassai út 26, 4028 Debrecen', 47.5418, 21.6428),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Agrár Campus (Böszörményi)', 'Böszörményi út 138, 4032 Debrecen', 47.5639, 21.5994),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Ótemető Campus', 'Ótemető u. 2-4, 4028 Debrecen', 47.5447, 21.6512);

-- =========================================================
-- BUILDINGS
-- =========================================================
INSERT INTO buildings (id, institution_id, campus_id, name, address, lat, lng)
VALUES
  -- Hotel Divinus
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null, 'Rooms', 'Nagyerdei körút 1', 47.5316, 21.6242),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', null, 'Flats & Suites', 'Nagyerdei körút 1', 47.5316, 21.6242),
  -- University campuses
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Faculty of Informatics', 'Kassai út 26', 47.5418, 21.6428),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'Faculty of Engineering', 'Ótemető u. 2-4', 47.5447, 21.6512),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Main Building', 'Egyetem tér 1', 47.5536, 21.6243),
  ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Library & Study Center', 'Egyetem tér 1', 47.5527, 21.6253),
  ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'Faculty of Agriculture', 'Böszörményi út 138', 47.5639, 21.5994),
  -- Agrár Sport Pitch
  ('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', null, 'Outdoor Pitch', 'Böszörményi út 138', 47.5470, 21.5993),
  -- Aquaticum
  ('30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000005', null, 'Rooms', 'Nagyerdei krt. 9-11', 47.5614, 21.6189),
  ('30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000005', null, 'Flats & Apartments', 'Nagyerdei krt. 9-11', 47.5614, 21.6189),
  -- Debreceni Sportcentrum
  ('30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000006', null, 'Main Arena', 'Oláh Gábor u. 5', 47.5586, 21.6363),
  -- Community Garden
  ('30000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000007', null, 'Section A — Vegetable Plots', 'Pallagi út', 47.5430, 21.6280),
  ('30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000007', null, 'Section B — Herb & Flower Gardens', 'Pallagi út', 47.5432, 21.6285),
  ('30000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000007', null, 'Greenhouse & Facilities', 'Pallagi út', 47.5428, 21.6283),
  -- Airbnb Collection
  ('30000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000008', null, 'Downtown Listings', 'Various', 47.5316, 21.6273),
  ('30000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000008', null, 'Near University', 'Various', 47.5495, 21.6250),
  ('30000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000008', null, 'Family Homes', 'Various', 47.5400, 21.6400),
  -- G4 Sport Arena
  ('30000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000009', null, 'Turf Pitch', 'Kassai út 26', 47.5398, 21.6300),
  -- West Hostel Sport
  ('30000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000010', null, 'Turf Pitch', 'Egyetem sgrt. 7', 47.5469, 21.6168);

-- =========================================================
-- SPACES
-- =========================================================
INSERT INTO spaces (id, building_id, name, capacity, image_url, features, price_per_unit, price_unit, is_active)
VALUES
  -- Hotel Divinus Rooms (b1)
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Standard Double Room', 2, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600', ARRAY['Queen Bed','WiFi','AC','Private Bathroom','TV'], 28000, 'night', true),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Deluxe King Room', 2, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600', ARRAY['King Bed','WiFi','AC','Balcony','Mini Bar','TV'], 42000, 'night', true),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'Twin Room', 2, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600', ARRAY['Two Single Beds','WiFi','AC','TV'], 25000, 'night', true),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'Family Room', 4, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600', ARRAY['2 Queen Beds','WiFi','AC','TV','Extra Space'], 52000, 'night', true),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 'Junior Suite', 2, 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600', ARRAY['King Bed','Lounge Area','WiFi','AC','Mini Bar'], 68000, 'night', false),
  -- Hotel Divinus Flats (b2)
  ('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000002', 'Studio Apartment', 2, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', ARRAY['Kitchenette','WiFi','AC','Workspace','Smart TV'], 34000, 'night', true),
  ('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000002', 'One-Bedroom Flat', 3, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', ARRAY['Full Kitchen','Living Room','WiFi','AC','Washer'], 52000, 'night', true),
  ('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000002', 'Two-Bedroom Flat', 5, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600', ARRAY['Full Kitchen','Living Room','2 Bathrooms','WiFi','Washer'], 78000, 'night', true),
  ('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000002', 'Penthouse Suite', 4, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600', ARRAY['Terrace','Full Kitchen','Jacuzzi','WiFi','Panoramic View'], 135000, 'night', true),
  -- University b3 (Kassai - Faculty of Informatics)
  ('40000000-0000-0000-0000-000000000101', '30000000-0000-0000-0000-000000000003', 'Lecture Hall 101', 120, 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600', ARRAY['Projector','WiFi','Microphone','AC','Recording','Tiered Seating'], 0, 'hour', true),
  ('40000000-0000-0000-0000-000000000111', '30000000-0000-0000-0000-000000000003', 'Seminar Room 305', 30, 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600', ARRAY['WiFi','Projector','Whiteboard','AC'], 0, 'hour', true),
  ('40000000-0000-0000-0000-000000000113', '30000000-0000-0000-0000-000000000003', 'Seminar Room 110', 28, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600', ARRAY['WiFi','Smart Board','AC'], 0, 'hour', true),
  -- University b4 (Ótemető - Faculty of Engineering)
  ('40000000-0000-0000-0000-000000000103', '30000000-0000-0000-0000-000000000004', 'Lecture Hall A-15', 80, 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600', ARRAY['Projector','WiFi','Microphone','AC'], 0, 'hour', false),
  ('40000000-0000-0000-0000-000000000114', '30000000-0000-0000-0000-000000000004', 'Seminar Room B-4', 22, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600', ARRAY['WiFi','Projector','Whiteboard','Movable Tables'], 0, 'hour', true),
  -- University b5 (Main Building)
  ('40000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000005', 'Lecture Hall 202 — Auditorium', 220, 'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=600', ARRAY['Projector','WiFi','Microphone','AC','Recording','Stage'], 0, 'hour', true),
  -- University b6 (Library)
  ('40000000-0000-0000-0000-000000000112', '30000000-0000-0000-0000-000000000006', 'Seminar Room 202', 25, 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600', ARRAY['WiFi','Projector','Whiteboard'], 0, 'hour', true),
  ('40000000-0000-0000-0000-000000000115', '30000000-0000-0000-0000-000000000006', 'Seminar Room L-2 (Library)', 18, 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600', ARRAY['WiFi','Whiteboard','Quiet Zone'], 0, 'hour', true),
  -- University b7 (Agrár)
  ('40000000-0000-0000-0000-000000000116', '30000000-0000-0000-0000-000000000007', 'Seminar Room M-7 (Medical)', 24, 'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?w=600', ARRAY['WiFi','Projector','Anatomical Models','AC'], 0, 'hour', true),
  -- Agrár Sport Pitch (b8)
  ('40000000-0000-0000-0000-000000000201', '30000000-0000-0000-0000-000000000008', 'Agrár Football Pitch', 22, 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600', ARRAY['Full-size grass pitch','Floodlights','Changing rooms','Showers','Parking'], 12000, 'hour', true),
  -- Aquaticum Rooms (b11)
  ('40000000-0000-0000-0000-000000000202', '30000000-0000-0000-0000-000000000011', 'Deluxe King Room', 2, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600', ARRAY['King Bed','WiFi','AC','Balcony','Mini Bar','TV'], 42000, 'night', true),
  ('40000000-0000-0000-0000-000000000203', '30000000-0000-0000-0000-000000000011', 'Twin Room', 2, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600', ARRAY['Two Single Beds','WiFi','AC','TV'], 25000, 'night', true),
  ('40000000-0000-0000-0000-000000000204', '30000000-0000-0000-0000-000000000011', 'Family Room', 4, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600', ARRAY['2 Queen Beds','WiFi','AC','TV','Extra Space'], 52000, 'night', true),
  -- Aquaticum Flats (b12)
  ('40000000-0000-0000-0000-000000000205', '30000000-0000-0000-0000-000000000012', 'One-Bedroom Flat', 3, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', ARRAY['Full Kitchen','Living Room','WiFi','AC','Washer'], 52000, 'night', true),
  ('40000000-0000-0000-0000-000000000206', '30000000-0000-0000-0000-000000000012', 'Two-Bedroom Flat', 5, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600', ARRAY['Full Kitchen','Living Room','2 Bathrooms','WiFi','Washer'], 78000, 'night', true),
  ('40000000-0000-0000-0000-000000000207', '30000000-0000-0000-0000-000000000012', 'Penthouse Suite', 4, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600', ARRAY['Terrace','Full Kitchen','Jacuzzi','WiFi','Panoramic View'], 135000, 'night', true),
  -- Sportcentrum Main Arena (b13)
  ('40000000-0000-0000-0000-000000000208', '30000000-0000-0000-0000-000000000013', 'Main Basketball Court', 20, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600', ARRAY['Full court','Indoor','Changing rooms','Scoreboard','Spectator seating'], 7500, 'hour', true),
  ('40000000-0000-0000-0000-000000000209', '30000000-0000-0000-0000-000000000013', 'Indoor Training Court', 12, 'https://images.unsplash.com/photo-1518614368389-d4f02c2c84e8?w=600', ARRAY['Half court','Indoor','Air conditioned','Equipment included'], 5500, 'hour', true),
  -- Community Garden Section A (b14)
  ('40000000-0000-0000-0000-000000000301', '30000000-0000-0000-0000-000000000014', 'Plot A1 — Raised Bed', 1, 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600', ARRAY['Raised Bed','Water Access','Tool Shed','Composting'], 8000, 'month', true),
  ('40000000-0000-0000-0000-000000000303', '30000000-0000-0000-0000-000000000014', 'Plot B1 — Large Family Plot', 4, 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600', ARRAY['Large Area','Water Access','Tool Shed','Greenhouse Access','Composting'], 14000, 'month', true),
  ('40000000-0000-0000-0000-000000000304', '30000000-0000-0000-0000-000000000014', 'Plot B2 — Starter Plot', 1, 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600', ARRAY['Small Area','Water Access','Beginner Friendly'], 4500, 'month', true),
  -- Community Garden Section B (b15)
  ('40000000-0000-0000-0000-000000000302', '30000000-0000-0000-0000-000000000015', 'Plot A2 — Herb Garden', 1, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600', ARRAY['Herb Section','Water Access','Sunlit'], 6000, 'month', true),
  ('40000000-0000-0000-0000-000000000305', '30000000-0000-0000-0000-000000000015', 'Plot C1 — Flower Garden', 2, 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600', ARRAY['Flower Beds','Water Access','Decorative Area'], 7000, 'month', false),
  -- Community Garden Greenhouse (b16)
  ('40000000-0000-0000-0000-000000000306', '30000000-0000-0000-0000-000000000016', 'Community Greenhouse', 6, 'https://images.unsplash.com/photo-1585255318859-f5c15f4cffe9?w=600', ARRAY['Heated','Water System','Seedling Trays','Year-Round'], 22000, 'month', true),
  -- Airbnb Downtown (b17)
  ('40000000-0000-0000-0000-000000000401', '30000000-0000-0000-0000-000000000017', 'Cozy Loft near Nagytemplom', 2, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600', ARRAY['WiFi','Kitchen','Self Check-in','City View'], 19000, 'night', true),
  ('40000000-0000-0000-0000-000000000402', '30000000-0000-0000-0000-000000000017', 'Modern Apartment in Downtown', 4, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600', ARRAY['WiFi','Full Kitchen','Washer','Workspace','Netflix'], 29000, 'night', true),
  ('40000000-0000-0000-0000-000000000406', '30000000-0000-0000-0000-000000000017', 'Luxury Penthouse Downtown', 4, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', ARRAY['Rooftop Terrace','Full Kitchen','WiFi','Premium View'], 72000, 'night', true),
  -- Airbnb Near University (b18)
  ('40000000-0000-0000-0000-000000000403', '30000000-0000-0000-0000-000000000018', 'Charming Studio by the Park', 2, 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600', ARRAY['WiFi','Kitchenette','Garden Access','Parking'], 17000, 'night', true),
  ('40000000-0000-0000-0000-000000000405', '30000000-0000-0000-0000-000000000018', 'Stylish Flat near University', 3, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600', ARRAY['WiFi','Kitchen','Workspace','Washer'], 23000, 'night', false),
  -- Airbnb Family Homes (b19)
  ('40000000-0000-0000-0000-000000000404', '30000000-0000-0000-0000-000000000019', 'Family House with Garden', 6, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600', ARRAY['WiFi','Full Kitchen','Garden','BBQ','Parking','Pet Friendly'], 48000, 'night', true),
  -- G4 Sport Arena (b20)
  ('40000000-0000-0000-0000-000000000501', '30000000-0000-0000-0000-000000000020', 'G4 Football Pitch', 14, 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=600', ARRAY['Artificial turf','5-a-side','Floodlights','Changing rooms'], 8500, 'hour', true),
  -- West Hostel Sport (b21)
  ('40000000-0000-0000-0000-000000000502', '30000000-0000-0000-0000-000000000021', 'West Hostel Football Pitch', 18, 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600', ARRAY['Artificial turf','7-a-side','Floodlights','Outdoor'], 9500, 'hour', true);
