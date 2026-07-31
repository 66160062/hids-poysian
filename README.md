# HIDS — Home Inspection & Construction Tracking System

ระบบสำหรับติดตามงานตรวจรับบ้านและงานก่อสร้าง รองรับผู้ใช้งาน 4 บทบาท:
- **Inspector** — ลงพื้นที่ตรวจบ้าน บันทึกจุดบกพร่อง (defect) พร้อมรูปถ่ายแยกตามห้อง/ชั้น
- **Contractor** — รับงานแก้ไขจุดบกพร่อง อัปเดตสถานะ พร้อมรูปหลังซ่อม
- **Customer** — ติดตามความคืบหน้าการตรวจ/ซ่อม และรับรายงาน PDF สรุปผล
- **Admin** — จัดการทีมงาน ผู้ใช้ และงานตรวจทั้งหมดในระบบ

## ฟีเจอร์หลัก
- สร้างรายงาน PDF อัตโนมัติจากข้อมูลการตรวจ (headless Puppeteer render + cache ตามการเปลี่ยนแปลงข้อมูลจริง)
- อัปโหลด/จัดเก็บรูปภาพผ่าน Supabase Storage พร้อมบีบอัดอัตโนมัติ
- ระบบแชร์ลิงก์ตรวจงานแบบจำกัดสิทธิ์ (token-based) สำหรับ contractor/customer โดยไม่ต้อง login

## Tech Stack
- **Frontend**: Vue 3, Quasar, Pinia, vue-router, vue-i18n
- **Backend**: NestJS, TypeORM, PostgreSQL
- **Storage**: Supabase Storage
- **PDF**: Puppeteer (server-side render จาก route พิเศษของ frontend)
