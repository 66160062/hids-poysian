-- Index ของ foreign key ที่ใช้บ่อยตอนตรวจ defect (list ตามรอบ, เช็คซ้ำ, guard สิทธิ์ inspector)
--
-- dev: TypeORM synchronize สร้างให้เองจาก @Index() ใน entity ไม่ต้องรันไฟล์นี้
-- production: synchronize ปิดอยู่ (NODE_ENV=production) ให้รันไฟล์นี้เองครั้งเดียว
--   psql "$DATABASE_URL" -f backend/scripts/add-fk-indexes.sql
--
-- ชื่อ index ตรงกับที่ TypeORM สร้าง (คำนวณจาก entity) ถ้าวันหนึ่งเปิด synchronize จะไม่ถูกลบ/สร้างซ้ำ
-- CONCURRENTLY ไม่ล็อกตารางระหว่างสร้าง แต่ห้ามรันใน transaction (อย่าครอบด้วย BEGIN/COMMIT)

CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_aaa0f8e16c5233d9f079ca70e1" ON "defect" ("round_id", "room_id", "floor_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_3292393517fe17a7c58068c68c" ON "inspection_round" ("job_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_c3263cc4234ec10f4ee993bfec" ON "inspection_team_member" ("round_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_c2c39bb95a5fa9879a57aad32f" ON "inspection_team_member" ("inspector_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_c1f7ae35acae890ccd110a5352" ON "inspection_team_member" ("team_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_e2262a906a37770a56a1a7168d" ON "assignment" ("job_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_d5ec950c6a69ce9fefdc0b15d2" ON "assignment" ("inspector_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_5191e656779b9097c887024b19" ON "assignment" ("round_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_155dbc144ff2bd4713fdf1f6c7" ON "user" ("team_id");
