-- ลบแถวรูปหลักฐานเก่าที่เก็บ URL ไว้ใน detail_value (ข้อมูลเทส ไม่ย้าย)
-- แถวรูปแบบใหม่มี photo_url จึงไม่ถูกลบ รันซ้ำได้
BEGIN;

ALTER TABLE inspection_summary_item ADD COLUMN IF NOT EXISTS photo_url text;

-- ref_item_id ของแถวที่อ้างถึงแถวที่ถูกลบจะกลายเป็น NULL เอง (onDelete: SET NULL)
DELETE FROM inspection_summary_item AS i
USING summary_template_option AS o
WHERE i.option_id = o.option_id
  AND o.type = 'photo'
  AND i.photo_url IS NULL;

COMMIT;
