-- เติมชื่อภาษาอังกฤษ (room_name_en) ให้ room
-- จับคู่ด้วยชื่อไทย ไม่ใช่ id เพราะ id อาจไม่ตรงกันระหว่าง dev/prod
-- อัปเดตเฉพาะแถวที่ room_name_en ยังว่าง เพื่อไม่ทับคำแปลที่ admin แก้เอง — รันซ้ำได้
BEGIN;

ALTER TABLE room ADD COLUMN IF NOT EXISTS room_name_en varchar(255);

UPDATE room AS r
SET room_name_en = m.en
FROM (VALUES
  ('ห้องนอนใหญ่', 'Master Bedroom'),
  ('ห้องนอนเล็ก', 'Small Bedroom'),
  ('ห้องน้ำ', 'Bathroom'),
  ('ห้องครัว', 'Kitchen'),
  ('ห้องนั่งเล่น', 'Living Room'),
  ('ห้องรับแขก', 'Reception Room'),
  ('ระเบียง', 'Balcony'),
  ('โรงรถ', 'Garage'),
  ('ห้องนอน 1', 'Bedroom 1'),
  ('ห้องนอน 2', 'Bedroom 2'),
  ('ห้องนอน 3', 'Bedroom 3'),
  ('ห้องนอน 4', 'Bedroom 4'),
  ('ห้องนอน 5', 'Bedroom 5'),
  ('ห้องนอน 6', 'Bedroom 6'),
  ('ห้องใต้หลังคา', 'Attic'),
  ('ห้องพักผ่อน', 'Relaxation Room'),
  ('ห้องอเนกประสงค์', 'Multipurpose Room'),
  ('ห้องประชุม 1', 'Meeting Room 1'),
  ('ห้องประชุม 2', 'Meeting Room 2'),
  ('ห้องประชุม 3', 'Meeting Room 3'),
  ('ห้องประชุม 4', 'Meeting Room 4'),
  ('ห้องหนังสือ', 'Library'),
  ('ห้องพระ', 'Prayer Room'),
  ('ห้องทำงาน', 'Home Office'),
  ('ห้องครัวไทย', 'Thai Kitchen'),
  ('ห้องครัวฝรั่ง', 'Western Kitchen'),
  ('ห้องรับประทานอาหาร', 'Dining Room'),
  ('โถงบันได', 'Stairwell Hall'),
  ('ห้องโถง', 'Hall'),
  ('ห้องเก็บของ', 'Storage Room'),
  ('ห้องใต้บันได', 'Under-stair Room'),
  ('ห้องรองเท้า', 'Shoe Room'),
  ('โถงทางเข้า', 'Entrance Hall'),
  ('โถงทางเดิน', 'Corridor Hall'),
  ('ห้องซักล้าง', 'Laundry Room'),
  ('ห้องไฟฟ้า', 'Electrical Room'),
  ('ห้องออกกำลังกาย', 'Exercise Room'),
  ('ห้องปั๊ม', 'Pump Room'),
  ('ห้องเครื่องวงจรปิด', 'CCTV Equipment Room'),
  ('ภายใน', 'Interior'),
  ('ภายนอก', 'Exterior'),
  ('โรงจอดรถ', 'Carport'),
  ('หน้าบ้าน', 'Front Yard'),
  ('หลังบ้าน', 'Back Yard'),
  ('เฉลียงหน้าบ้าน', 'Front Porch'),
  ('เฉลียงหลังบ้าน', 'Back Porch'),
  ('เฉลียงข้างบ้าน', 'Side Porch'),
  ('ห้องใต้ดิน', 'Basement'),
  ('หลังคา', 'Roof'),
  ('ห้องโซล่าเซลล์', 'Solar Cell Room'),
  ('บันไดหนีไฟ', 'Fire Escape Stairs'),
  ('ห้องแม่บ้าน 1', 'Maid''s Room 1'),
  ('ห้องแม่บ้าน 2', 'Maid''s Room 2'),
  ('ห้องแม่บ้าน 3', 'Maid''s Room 3'),
  ('ห้องแม่บ้าน 4', 'Maid''s Room 4'),
  ('ห้องล็อคเกอร์', 'Locker Room'),
  ('ห้องส่วนตัว', 'Private Room'),
  ('ห้องอื่นๆ…..', 'Other Room…')
) AS m(th, en)
WHERE btrim(r.room_name) = m.th
  AND r.room_name_en IS NULL;

-- PDF ภาษาอังกฤษที่ cache ไว้ใช้ hash จากข้อมูล defect เท่านั้น (ดู ReportsService.computeDataHash)
-- การเติม room_name_en ไม่เปลี่ยน hash จึงต้องล้าง hash อังกฤษ ให้ render ใหม่ครั้งถัดไปที่มีคนเปิด
UPDATE inspection_round SET last_pdf_hash_en = NULL WHERE last_pdf_hash_en IS NOT NULL;

COMMIT;

-- ── ตรวจหลังรัน: ควรได้ 0 แถว ถ้ามีแถวโผล่แปลว่าชื่อไทยใน DB ไม่ตรงกับในไฟล์นี้ ──
-- SELECT room_id, room_name FROM room WHERE room_name_en IS NULL;
