-- เติมชื่อภาษาอังกฤษ (category_en/label_en, value_en/group_en) ให้ summary_template / summary_template_option
-- ใช้ในหน้าสรุปผลการตรวจ (checklist) ของ PDF รายงาน (ดู DefectReport.vue: summaryCategories/summaryPages)
-- จับคู่ด้วยข้อความไทย ไม่ใช่ id เพราะ id อาจไม่ตรงกันระหว่าง dev/prod
-- label ของ summary_template ไม่ซ้ำกันเลยทั้ง 19 แถว จึงจับคู่ตรงๆ ได้
-- value/group ของ summary_template_option ซ้ำกันข้ามหัวข้อ (เช่น "ติดตั้งเรียบร้อย") จึงแปลแค่ค่าที่ไม่ซ้ำ
-- แล้วอัปเดตทุกแถวที่ค่าตรงกัน — อัปเดตเฉพาะแถวที่ยังว่าง เพื่อไม่ทับคำแปลที่ admin แก้เอง รันซ้ำได้
BEGIN;

ALTER TABLE summary_template ADD COLUMN IF NOT EXISTS category_en varchar(255);
ALTER TABLE summary_template ADD COLUMN IF NOT EXISTS label_en varchar(255);
ALTER TABLE summary_template_option ADD COLUMN IF NOT EXISTS value_en varchar(255);
ALTER TABLE summary_template_option ADD COLUMN IF NOT EXISTS group_en varchar(255);

-- ── หมวดหลัก (category) ──────────────────────────────────────────────────
UPDATE summary_template AS t
SET category_en = m.en
FROM (VALUES
  ('ทิศทางของบ้าน', 'House Orientation'),
  ('งานโครงสร้าง', 'Structural Work'),
  ('งานประปาและสุขาภิบาล', 'Plumbing & Sanitation'),
  ('งานระบบไฟฟ้า', 'Electrical System'),
  ('งานอื่นๆ', 'Other Work'),
  ('ความสะอาดและความเรียบร้อย', 'Cleanliness & Tidiness')
) AS m(th, en)
WHERE btrim(t.category) = m.th
  AND t.category_en IS NULL;

-- ── หัวข้อ (label) — ไม่ซ้ำกัน จับคู่ตรงๆ ─────────────────────────────────
UPDATE summary_template AS t
SET label_en = m.en
FROM (VALUES
  ('ทิศทางของบ้าน', 'House Orientation'),
  ('โครงสร้างของบ้าน', 'House Structure'),
  ('ลานซักล้าง', 'Laundry Area'),
  ('ฐานราก', 'Foundation'),
  ('โครงสร้างของหลังคา', 'Roof Structure'),
  ('บันได, ราวบันได', 'Stairs, Handrail'),
  ('มิเตอร์ประปา', 'Water Meter'),
  ('งานระบบประปา', 'Plumbing System'),
  ('งานสุขาภิบาล', 'Sanitation Work'),
  ('ตรวจสอบสโลปห้องน้ำ', 'Bathroom Floor Slope Check'),
  ('ตรวจสอบการรั่วซึมจากพื้นห้องน้ำ', 'Bathroom Floor Leak Check'),
  ('มิเตอร์ไฟฟ้า', 'Electrical Meter'),
  ('ปลั๊ก/สวิตช์', 'Outlets / Switches'),
  ('เครื่องป้องกันไฟรั่ว', 'Earth Leakage Protection (RCD)'),
  ('พื้นที่ควบคุมของเบรคเกอร์', 'Breaker Control Area'),
  ('เครื่องปั๊มน้ำ', 'Water Pump'),
  ('ระบบป้องกันปลวก', 'Termite Protection System'),
  ('ระบบรักษาความปลอดภัย', 'Security System'),
  ('การเข้าอยู่อาศัย', 'Move-in Readiness')
) AS m(th, en)
WHERE btrim(t.label) = m.th
  AND t.label_en IS NULL;

-- ── กลุ่มตัวเลือก (group) — ไม่ซ้ำกัน 6 ค่า ────────────────────────────────
UPDATE summary_template_option AS o
SET group_en = m.en
FROM (VALUES
  ('ทิศทาง', 'Direction'),
  ('รูปแบบโครงสร้าง', 'Structure Type'),
  ('รายละเอียด', 'Details'),
  ('การติดตั้ง', 'Installation'),
  ('ขนาดเมนเบรคเกอร์', 'Main Breaker Size'),
  ('จำนวนสายไฟ', 'Number of Poles')
) AS m(th, en)
WHERE btrim(o."group") = m.th
  AND o.group_en IS NULL;

-- ── ตัวเลือก (value) — ซ้ำกันข้ามหัวข้อ จึงแปลแค่ค่าที่ไม่ซ้ำ ───────────────
UPDATE summary_template_option AS o
SET value_en = m.en
FROM (VALUES
  ('เหนือ', 'North'),
  ('ใต้', 'South'),
  ('ตะวันออก', 'East'),
  ('ตะวันตก', 'West'),
  ('ตะวันตกเฉียงใต้', 'Southwest'),
  ('ตะวันออกเฉียงเหนือ', 'Northeast'),
  ('ผนังก่ออิฐฉาบปูน', 'Brick Wall with Plaster'),
  ('ผนังเบา', 'Lightweight Wall'),
  ('ไม่พบปัญหาทางด้านโครงสร้าง', 'No Structural Issues Found'),
  ('พบปัญหาทางด้านโครงสร้าง', 'Structural Issues Found'),
  ('ไม่พบปัญหาการทรุดตัว', 'No Subsidence Issues Found'),
  ('พบปัญหาการทรุดตัว', 'Subsidence Issues Found'),
  ('โครงหลังคาสำเร็จรูป', 'Prefabricated Roof Structure'),
  ('โครงหลังคาไม้', 'Wood Roof Structure'),
  ('แผ่นสะท้อนความร้อน / แผ่นกันความร้อน', 'Radiant Barrier / Heat Insulation Sheet'),
  ('ติดตั้งเรียบร้อย', 'Installed'),
  ('ยังไม่ได้ติดตั้ง', 'Not Yet Installed'),
  ('ไม่พบปัญหา', 'No Issues Found'),
  ('พบปัญหา', 'Issues Found'),
  ('ไม่พบปัญหาน้ำขัง', 'No Water Pooling Found'),
  ('พบปัญหาน้ำขัง', 'Water Pooling Found'),
  ('ไม่พบปัญหาการรั่วซึม', 'No Leakage Found'),
  ('พบปัญหาการรั่วซึม', 'Leakage Found'),
  ('100 แอมป์', '100 Amps'),
  ('150 แอมป์', '150 Amps'),
  ('1 Pole', '1 Pole'),
  ('3 Pole', '3 Pole'),
  ('ตรวจสอบครบทุกจุด', 'All Points Checked'),
  ('พร้อมเข้าอยู่อาศัย', 'Ready for Move-in'),
  ('ยังไม่พร้อมเข้าอยู่อาศัย', 'Not Yet Ready for Move-in')
) AS m(th, en)
WHERE btrim(o.value) = m.th
  AND o.value_en IS NULL;

-- PDF ภาษาอังกฤษที่ cache ไว้ใช้ hash จากข้อมูล defect เท่านั้น (ดู ReportsService.computeDataHash)
-- การเติมคำแปลไม่เปลี่ยน hash จึงต้องล้าง hash อังกฤษ ให้ render ใหม่ครั้งถัดไปที่มีคนเปิด
UPDATE inspection_round SET last_pdf_hash_en = NULL WHERE last_pdf_hash_en IS NOT NULL;

COMMIT;

-- ── ตรวจหลังรัน: ควรได้ 0 แถว ถ้ามีแถวโผล่แปลว่าข้อความไทยใน DB ไม่ตรงกับในไฟล์นี้ ──
-- SELECT template_id, category, label FROM summary_template WHERE category_en IS NULL OR label_en IS NULL;
-- SELECT option_id, value, "group" FROM summary_template_option WHERE value_en IS NULL OR ("group" IS NOT NULL AND group_en IS NULL);
