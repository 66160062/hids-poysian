-- เติมชื่อภาษาอังกฤษ (label_en / name_en) ให้ floor / house_type
-- ทั้งสองตารางเป็น lookup ปิดตายตัว (floor 7 แถว, house_type 11 แถว) — เดิมแปลด้วย hardcoded
-- dictionary ในโค้ด frontend (useFloorLabel.ts / useHouseTypeLabel.ts) ย้ายมาเก็บใน DB แทน
-- เพื่อรองรับหน้าแก้ไขข้อมูลในอนาคต (แก้ผ่าน UI แล้วคำแปลต้อง sync ตามได้)
-- จับคู่ด้วยชื่อไทย ไม่ใช่ id เพราะ id อาจไม่ตรงกันระหว่าง dev/prod
-- อัปเดตเฉพาะแถวที่ยังว่าง เพื่อไม่ทับคำแปลที่ admin แก้เอง — รันซ้ำได้
BEGIN;

ALTER TABLE floor ADD COLUMN IF NOT EXISTS label_en varchar(255);
ALTER TABLE house_type ADD COLUMN IF NOT EXISTS name_en varchar(255);

UPDATE floor AS f
SET label_en = m.en
FROM (VALUES
  ('ชั้น 1', 'Floor 1'),
  ('ชั้น 2', 'Floor 2'),
  ('ชั้น 3', 'Floor 3'),
  ('ชั้น 4', 'Floor 4'),
  ('ชั้น 5', 'Floor 5'),
  ('ชั้นลอย', 'Mezzanine'),
  ('ชั้นอื่นๆ…..', 'Other Floor…')
) AS m(th, en)
WHERE btrim(f.label) = m.th
  AND f.label_en IS NULL;

UPDATE house_type AS h
SET name_en = m.en
FROM (VALUES
  ('บ้านเดี่ยว', 'Detached House'),
  ('ทาวน์โฮม', 'Townhome'),
  ('คอนโดมิเนียม', 'Condominium'),
  ('อาคารพาณิชย์', 'Commercial Building'),
  ('บ้านแฝด', 'Semi-Detached House'),
  ('ทาวน์เฮาส์', 'Townhouse'),
  ('บ้านสร้างเอง', 'Self-Built House'),
  ('อพาร์ทเม้นท์', 'Apartment'),
  ('โรงงาน', 'Factory'),
  ('อาคาร', 'Building'),
  ('ออฟฟิศ', 'Office')
) AS m(th, en)
WHERE btrim(h.name) = m.th
  AND h.name_en IS NULL;

-- PDF ภาษาอังกฤษที่ cache ไว้ใช้ hash จากข้อมูล defect เท่านั้น (ดู ReportsService.computeDataHash)
-- การเติม label_en/name_en ไม่เปลี่ยน hash จึงต้องล้าง hash อังกฤษ ให้ render ใหม่ครั้งถัดไปที่มีคนเปิด
UPDATE inspection_round SET last_pdf_hash_en = NULL WHERE last_pdf_hash_en IS NOT NULL;

COMMIT;

-- ── ตรวจหลังรัน: ควรได้ 0 แถว ถ้ามีแถวโผล่แปลว่าชื่อไทยใน DB ไม่ตรงกับในไฟล์นี้ ──
-- SELECT floor_id, label FROM floor WHERE label_en IS NULL;
-- SELECT house_type_id, name FROM house_type WHERE name_en IS NULL;
