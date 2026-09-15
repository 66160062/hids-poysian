-- เติมชื่อภาษาอังกฤษ (name_en) ให้ house_plans
-- บั๊กเดิม: ชื่อ default ของแปลน ("แปลนบ้าน N" / "House Plan N") ถูกสร้างด้วย t(key) ที่ผูกกับ
-- locale ปัจจุบันของคนสร้าง ณ ตอนนั้น — ถ้าคนสร้างสลับ UI เป็นอังกฤษไว้ ชื่อจะถูกเซฟเป็นอังกฤษถาวรลงคอลัมน์
-- `name` (ซึ่งควรเป็นไทยเสมอ) ทำให้โผล่เป็นอังกฤษแม้ตอนดู PDF ภาษาไทย (ดู useDefaultPlanName.ts ที่แก้ที่ต้นตอแล้ว)
-- สคริปต์นี้ซ่อมข้อมูลเก่า: จับ pattern ตัวเลขต่อท้ายชื่อ default ทั้งสองภาษา แล้วเติม name_en คู่กัน
-- (สลับ name กลับเป็นไทยด้วยถ้าแถวไหนติดเป็นอังกฤษ) — ชื่อที่ผู้ใช้พิมพ์เองแบบอื่นจะไม่ถูกแตะต้อง
-- รันซ้ำได้ (WHERE name_en IS NULL)
BEGIN;

ALTER TABLE house_plans ADD COLUMN IF NOT EXISTS name_en varchar(255);

-- แถวที่ชื่อเป็น pattern default ภาษาไทยอยู่แล้ว ("แปลนบ้าน N") — เติม name_en คู่กัน ไม่ต้องแตะ name
UPDATE house_plans
SET name_en = 'House Plan ' || (regexp_match(name, '^แปลนบ้าน (\d+)$'))[1]
WHERE name ~ '^แปลนบ้าน \d+$'
  AND name_en IS NULL;

-- แถวที่ติดบั๊ก: name ถูกเซฟเป็นอังกฤษ ("House Plan N") ตอนคนสร้างสลับ UI เป็นอังกฤษไว้
-- สลับกลับ: name เป็นไทย (ค่าที่ควรจะเป็นตั้งแต่แรก), name_en เก็บค่าอังกฤษเดิมไว้
UPDATE house_plans
SET name = 'แปลนบ้าน ' || (regexp_match(name, '^House Plan (\d+)$'))[1],
    name_en = name
WHERE name ~ '^House Plan \d+$'
  AND name_en IS NULL;

-- PDF ภาษาอังกฤษที่ cache ไว้ใช้ hash จากข้อมูล defect เท่านั้น (ดู ReportsService.computeDataHash)
-- การแก้ name/name_en ไม่เปลี่ยน hash จึงต้องล้าง hash อังกฤษ ให้ render ใหม่ครั้งถัดไปที่มีคนเปิด
UPDATE inspection_round SET last_pdf_hash_en = NULL WHERE last_pdf_hash_en IS NOT NULL;

COMMIT;

-- ── ตรวจหลังรัน ──
-- SELECT plan_id, name, name_en FROM house_plans ORDER BY plan_id;
-- ชื่อที่ผู้ใช้พิมพ์เอง (ไม่ตรง pattern default ทั้งสองภาษา) จะยังไม่มี name_en — ต้องกรอกเองถ้าต้องการคำแปล
-- SELECT plan_id, name FROM house_plans WHERE name_en IS NULL;
