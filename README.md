# HIDS — Home Inspection & Construction Tracking System

ระบบติดตามงาน **ตรวจรับบ้าน** และ **งานก่อสร้าง** แบบครบวงจร ตั้งแต่ลงพื้นที่ตรวจ บันทึกจุดบกพร่อง (defect) พร้อมรูปภาพ ไปจนถึงติดตามการแก้ไขงานและออกรายงานสรุปผลเป็น PDF โดยรองรับผู้ใช้งาน 4 บทบาท:

- **Inspector** — ลงพื้นที่ตรวจบ้าน บันทึกจุดบกพร่อง (defect) พร้อมรูปถ่ายแยกตามห้อง/ชั้น
- **Contractor** — รับงานแก้ไขจุดบกพร่อง อัปเดตสถานะ พร้อมรูปหลังซ่อม
- **Customer** — ติดตามความคืบหน้าการตรวจ/ซ่อม และรับรายงาน PDF สรุปผล
- **Admin** — จัดการทีมงาน ผู้ใช้ สาขา และงานตรวจทั้งหมดในระบบ

## ฟีเจอร์หลัก

- สร้างรายงาน PDF อัตโนมัติจากข้อมูลการตรวจ (headless Puppeteer render + cache ตามการเปลี่ยนแปลงข้อมูลจริง)
- อัปโหลด/จัดเก็บรูปภาพผ่าน Supabase Storage พร้อมบีบอัดอัตโนมัติ
- ระบบแชร์ลิงก์ตรวจงานแบบจำกัดสิทธิ์ (token-based) สำหรับ contractor/customer โดยไม่ต้อง login
- บันทึกรายงานประจำวันของงานก่อสร้าง (daily report) — บุคลากร เครื่องจักร ปัญหาหน้างาน อุบัติเหตุ
- ระบบแจ้งเตือน (notifications) และประวัติกิจกรรม (activity logs)
- สรุปผลการตรวจด้วย AI (AI summary ผ่าน Groq / Gemini)
- ระบบให้คะแนน/รีวิวงาน (ratings)

## Tech Stack

| ส่วน | เทคโนโลยี |
| --- | --- |
| Frontend | Vue 3, Quasar Framework, Pinia, vue-router, vue-i18n, TypeScript |
| Backend | NestJS, TypeORM, PostgreSQL |
| Storage | Supabase Storage |
| Auth | JWT (Passport), bcrypt |
| PDF | Puppeteer (server-side render จาก route พิเศษของ frontend) |
| อื่น ๆ | Nodemailer (อีเมล), Sharp (บีบอัดรูป), Groq API / Gemini API (AI summary) |

## โครงสร้างโปรเจกต์

```
hids-poysian/
├── backend/          # NestJS API (REST + Swagger docs ที่ /api)
│   └── src/
│       ├── auth/                 # ระบบ login, guard, jwt
│       ├── inspection-jobs/      # งานตรวจบ้าน
│       ├── inspection-rounds/    # รอบตรวจ
│       ├── defects/              # จุดบกพร่อง
│       ├── repair-records/       # บันทึกการซ่อม
│       ├── construction-daily-reports/  # รายงานประจำวันงานก่อสร้าง
│       ├── reports/              # สร้างรายงาน PDF
│       ├── admin/, teams/, users/, branches/  # จัดการระบบ
│       └── ...
└── Frontend/         # Vue 3 + Quasar SPA/PWA
    └── src/
        ├── pages/     # หน้าจอแยกตามบทบาท (Admin/Inspector/Contractor/Customer)
        ├── stores/    # Pinia stores
        ├── layouts/, components/, boot/, i18n/, router/
        └── ...
```

## เริ่มต้นใช้งาน (Getting Started)

### สิ่งที่ต้องมีก่อน

- Node.js (แนะนำ v20 ขึ้นไป)
- PostgreSQL (ฐานข้อมูลหลัก)
- บัญชี Supabase (สำหรับ Storage เก็บรูปภาพ)
- SMTP server (สำหรับส่งอีเมล เช่น แจ้งเตือน/รีเซ็ตรหัสผ่าน)
- API key ของ Groq และ/หรือ Gemini (ถ้าต้องการใช้ฟีเจอร์ AI summary)

### 1) Backend (NestJS)

```bash
cd backend
npm install
```

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/` โดยกำหนดค่าตัวแปรดังนี้:

```
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

JWT_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=

GROQ_API_KEY=
GEMINI_API_KEY=
```

รันเซิร์ฟเวอร์:

```bash
npm run start:dev     # dev mode (watch)
npm run start:prod    # production (ต้อง build ก่อนด้วย npm run build)
```

API จะรันที่ `http://localhost:3000` และมี Swagger docs อยู่ที่ `http://localhost:3000/api`

คำสั่งอื่น ๆ ที่มีให้ใช้:

```bash
npm run test           # unit tests
npm run test:e2e       # e2e tests
npm run test:cov       # test coverage
npm run lint           # eslint --fix
npm run migrate:house-plans   # สคริปต์ migrate ข้อมูลผังบ้าน
npm run eval:ai-summary       # ประเมินผล AI summary
```

### 2) Frontend (Vue 3 + Quasar)

```bash
cd Frontend
npm install
```

สร้างไฟล์ `.env` ในโฟลเดอร์ `Frontend/` โดยกำหนดค่า:

```
# URL ของ backend ที่ frontend จะเรียกใช้งาน
VITE_API_URL=http://localhost:3000
```

รันแอปในโหมดพัฒนา:

```bash
npm run dev          # หรือ quasar dev
```

คำสั่งอื่น ๆ ที่มีให้ใช้:

```bash
npm run build     # build สำหรับ production (quasar build)
npm run lint      # ตรวจสอบโค้ดด้วย eslint
npm run format    # จัดรูปแบบโค้ดด้วย prettier
```

## License

โปรเจกต์นี้เป็น Private/Unlicensed สำหรับใช้งานภายในทีมเท่านั้น
