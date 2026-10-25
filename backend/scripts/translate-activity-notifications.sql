-- เติมฉบับอังกฤษ (title_en / sub_en / message_en) ให้ "อัปเดตล่าสุด" (activity_log) และการแจ้งเตือน (notification)
-- ที่บันทึกไว้ก่อนมีคอลัมน์เหล่านี้ — แถวใหม่ระบบเติมให้เองตอนบันทึกอยู่แล้ว
--
-- ข้อความทั้งสองตารางเป็นแม่แบบตายตัว (มีแค่เลขรอบ จำนวน ชื่อโครงการ ชื่อห้อง แทรกอยู่) จึงแปลด้วย pattern ได้ ไม่ต้องใช้ LLM
-- อัปเดตเฉพาะแถวที่ยังว่าง เพื่อไม่ทับคำแปลที่มีอยู่ — รันซ้ำได้
-- ข้อความที่ไม่ตรง pattern จะยังเป็น NULL แล้วหน้าจอแสดงฉบับไทยแทน (ไม่พัง)
--
-- ต้องรันหลัง translate-rooms.sql / translate-sub-rooms.sql (ใช้ชื่อห้องอังกฤษแปลตำแหน่ง)
-- และควรสำรองข้อมูลก่อนถ้าเป็นฐานข้อมูลจริง ทั้งไฟล์อยู่ใน transaction เดียว: ถ้าผลตรวจหลังรันไม่ถูกต้องให้ ROLLBACK แทน COMMIT
BEGIN;

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS title_en varchar(255);
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS sub_en varchar(255);
ALTER TABLE notification ADD COLUMN IF NOT EXISTS message_en varchar(500);

-- ── activity_log.title (ไม่มีตัวเลขจำนวนต่อท้าย เพราะระบบต่อให้ตอนอ่าน) ─────────────────────
UPDATE activity_log SET title_en = 'New defect found'
WHERE type = 'defect_created' AND title = 'พบข้อบกพร่องใหม่' AND title_en IS NULL;

UPDATE activity_log SET title_en = 'Contractor repaired a defect'
WHERE type = 'defect_repaired' AND title = 'ผู้รับเหมาแก้ไขข้อบกพร่องแล้ว' AND title_en IS NULL;

UPDATE activity_log SET title_en = 'Inspection round ' || (regexp_match(title, '^นัดหมายตรวจรอบที่ (\d+)$'))[1] || ' scheduled'
WHERE title ~ '^นัดหมายตรวจรอบที่ \d+$' AND title_en IS NULL;

UPDATE activity_log SET title_en = 'Engineer completed inspection round ' || (regexp_match(title, '^วิศวกรเข้าตรวจรอบที่ (\d+) เสร็จสิ้น$'))[1]
WHERE title ~ '^วิศวกรเข้าตรวจรอบที่ \d+ เสร็จสิ้น$' AND title_en IS NULL;

UPDATE activity_log SET title_en = 'Report for round ' || (regexp_match(title, '^ส่งรายงานรอบที่ (\d+) ให้ลูกค้าตรวจสอบแล้ว$'))[1] || ' sent to the customer for review'
WHERE title ~ '^ส่งรายงานรอบที่ \d+ ให้ลูกค้าตรวจสอบแล้ว$' AND title_en IS NULL;

UPDATE activity_log SET title_en = 'Customer approved the report for round ' || (regexp_match(title, '^ลูกค้าอนุมัติรายงานรอบที่ (\d+) แล้ว$'))[1]
WHERE title ~ '^ลูกค้าอนุมัติรายงานรอบที่ \d+ แล้ว$' AND title_en IS NULL;

UPDATE activity_log SET title_en = 'PDF report for round ' || (regexp_match(title, '^อัปเดตรายงาน PDF รอบที่ (\d+) แล้ว$'))[1] || ' updated'
WHERE title ~ '^อัปเดตรายงาน PDF รอบที่ \d+ แล้ว$' AND title_en IS NULL;

-- ── activity_log.sub ─────────────────────────────────────────────────────────────────
-- "N รายการ" (ส่งรายงานให้ลูกค้า) และ "ปิดงานเรียบร้อย" (อนุมัติแล้วปิดงาน)
UPDATE activity_log SET sub_en = (regexp_match(sub, '^(\d+) รายการ$'))[1] || ' items'
WHERE sub ~ '^\d+ รายการ$' AND sub_en IS NULL;

UPDATE activity_log SET sub_en = 'Job closed'
WHERE sub = 'ปิดงานเรียบร้อย' AND sub_en IS NULL;

-- "วันที่ตรวจ: <วันที่ไทย>" — แปลงวันที่จากวันนัดของรอบตรวจโดยตรง (ไม่ parse ข้อความวันที่ไทย)
-- รูปแบบเดียวกับที่ระบบแสดง เช่น Dec 25, 2025
UPDATE activity_log AS a
SET sub_en = 'Inspection date: ' || to_char(r.scheduled_date, 'FMMon FMDD, YYYY')
FROM inspection_round AS r
WHERE a.round_id = r.round_id
  AND a.sub LIKE 'วันที่ตรวจ: %'
  AND a.sub_en IS NULL
  AND r.scheduled_date IS NOT NULL;

-- ตำแหน่ง "ห้อง • ห้องย่อย" ของ defect — แทนชื่อไทยด้วยชื่ออังกฤษของห้อง เรียงจากชื่อยาวไปสั้น
-- กันชื่อสั้นไปทับส่วนหนึ่งของชื่อยาว (เช่น "ห้องนอน" ใน "ห้องนอนเล็ก")
UPDATE activity_log SET sub_en = sub
WHERE type IN ('defect_created', 'defect_repaired') AND sub IS NOT NULL AND sub_en IS NULL;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT th, en FROM (
      SELECT room_name AS th, room_name_en AS en FROM room
      UNION
      SELECT room_name AS th, room_name_en AS en FROM sub_room
    ) AS names
    WHERE th IS NOT NULL AND en IS NOT NULL AND en <> ''
    ORDER BY length(th) DESC
  LOOP
    UPDATE activity_log
    SET sub_en = replace(sub_en, r.th, r.en)
    WHERE type IN ('defect_created', 'defect_repaired')
      AND sub_en LIKE '%' || r.th || '%';
  END LOOP;
END $$;

-- ยังมีตัวอักษรไทยค้างอยู่ = มีชื่อห้องที่ไม่มีคำแปล ให้เป็น NULL เพื่อแสดงฉบับไทยทั้งบรรทัด ดีกว่าภาษาปนกัน
UPDATE activity_log SET sub_en = NULL
WHERE type IN ('defect_created', 'defect_repaired') AND sub_en ~ '[ก-๙]';

-- ── notification.message ─────────────────────────────────────────────────────────────
-- ชื่อโครงการใช้ project_name_en ของงาน (ถ้าไม่มีใช้ชื่อไทย)
UPDATE notification AS n
SET message_en = 'You have been assigned an inspection job: ' || COALESCE(NULLIF(j.project_name_en, ''), j.project_name)
FROM inspection_job AS j
WHERE n.job_id = j.job_id
  AND n.message LIKE 'คุณได้รับมอบหมายงานตรวจ: %'
  AND n.message_en IS NULL;

UPDATE notification AS n
SET message_en = 'You have been assigned a new inspection round: ' || COALESCE(NULLIF(j.project_name_en, ''), j.project_name)
FROM inspection_job AS j
WHERE n.job_id = j.job_id
  AND n.message LIKE 'คุณได้รับมอบหมายรอบตรวจใหม่: %'
  AND n.message_en IS NULL;

UPDATE notification AS n
SET message_en = COALESCE(NULLIF(j.project_name_en, ''), j.project_name)
                 || ': inspection round ' || (regexp_match(n.message, 'ตรวจงวดที่ (\d+) รออนุมัติ$'))[1] || ' awaiting approval'
FROM inspection_job AS j
WHERE n.job_id = j.job_id
  AND n.message ~ 'ตรวจงวดที่ \d+ รออนุมัติ$'
  AND n.message_en IS NULL;

UPDATE notification AS n
SET message_en = COALESCE(NULLIF(j.project_name_en, ''), j.project_name)
                 || ': contractor has repaired '
                 || (regexp_match(n.message, 'ผู้รับเหมาซ่อมแล้ว (\d+)/(\d+) รายการ \((\d+)%\)$'))[1] || '/'
                 || (regexp_match(n.message, 'ผู้รับเหมาซ่อมแล้ว (\d+)/(\d+) รายการ \((\d+)%\)$'))[2] || ' items ('
                 || (regexp_match(n.message, 'ผู้รับเหมาซ่อมแล้ว (\d+)/(\d+) รายการ \((\d+)%\)$'))[3] || '%)'
FROM inspection_job AS j
WHERE n.job_id = j.job_id
  AND n.message ~ 'ผู้รับเหมาซ่อมแล้ว \d+/\d+ รายการ \(\d+%\)$'
  AND n.message_en IS NULL;

COMMIT;

-- ── ตรวจหลังรัน ──
-- แถวที่ยังไม่มีฉบับอังกฤษ (ข้อความไม่ตรง pattern เช่น ถูกแก้มือ หรือโครงการไม่มีข้อมูลงาน) — หน้าจอจะแสดงฉบับไทยแทน
-- SELECT type, title, sub FROM activity_log WHERE title_en IS NULL ORDER BY created_at DESC LIMIT 50;
-- SELECT notification_id, message FROM notification WHERE message_en IS NULL ORDER BY created_at DESC LIMIT 50;
-- ดูตัวอย่างผลลัพธ์:
-- SELECT title, title_en, sub, sub_en FROM activity_log ORDER BY created_at DESC LIMIT 20;
-- SELECT message, message_en FROM notification ORDER BY created_at DESC LIMIT 20;
