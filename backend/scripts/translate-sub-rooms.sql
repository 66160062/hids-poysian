-- เติมชื่อภาษาอังกฤษ (room_name_en) ให้ sub_room
-- จับคู่ด้วยชื่อไทย ไม่ใช่ id เพราะ id อาจไม่ตรงกันระหว่าง dev/prod
-- อัปเดตเฉพาะแถวที่ room_name_en ยังว่าง เพื่อไม่ทับคำแปลที่ admin แก้เอง — รันซ้ำได้
BEGIN;

ALTER TABLE sub_room ADD COLUMN IF NOT EXISTS room_name_en varchar(255);

UPDATE sub_room AS s
SET room_name_en = m.en
FROM (VALUES
  ('ห้องน้ำในห้องนอนใหญ่', 'Master Bedroom Bathroom'),
  ('ห้องน้ำในห้องนอนเล็ก', 'Small Bedroom Bathroom'),
  ('ระเบียงห้องนอนใหญ่', 'Master Bedroom Balcony'),
  ('ระเบียงห้องนอนเล็ก', 'Small Bedroom Balcony'),
  ('มุมซักล้าง', 'Laundry Corner'),
  ('ห้องน้ำ', 'Bathroom'),
  ('ห้องแต่งตัว', 'Dressing Room'),
  ('ระเบียง', 'Balcony'),
  ('ใต้หลังคา', 'Under the Roof'),
  ('ดาดฟ้า', 'Rooftop'),
  ('ห้องนั่งเล่น', 'Living Room'),
  ('อื่นๆ…..', 'Other…')
) AS m(th, en)
WHERE btrim(s.room_name) = m.th
  AND s.room_name_en IS NULL;

-- PDF ภาษาอังกฤษที่ cache ไว้ใช้ hash จากข้อมูล defect เท่านั้น (ดู ReportsService.computeDataHash)
-- การเติม room_name_en ไม่เปลี่ยน hash จึงต้องล้าง hash อังกฤษ ให้ render ใหม่ครั้งถัดไปที่มีคนเปิด
UPDATE inspection_round SET last_pdf_hash_en = NULL WHERE last_pdf_hash_en IS NOT NULL;

COMMIT;

-- ── ตรวจหลังรัน: ควรได้ 0 แถว ถ้ามีแถวโผล่แปลว่าชื่อไทยใน DB ไม่ตรงกับในไฟล์นี้ ──
-- SELECT sub_room_id, room_name FROM sub_room WHERE room_name_en IS NULL;
