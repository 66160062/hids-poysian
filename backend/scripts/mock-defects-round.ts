/*
 * สร้างข้อมูล defect จำลอง (mock) ผูกกับ inspection round ที่ระบุ สำหรับทดสอบ UI/PDF/AI summary
 * โดยไม่ต้องกรอกทีละจุดผ่านหน้าเว็บ
 *
 * รันจาก backend/:
 *   npx ts-node -r tsconfig-paths/register scripts/mock-defects-round.ts --round=39 --count=150
 *
 * ค่าเริ่มต้น: dry-run เสมอ (แค่ print สรุปว่าจะ insert อะไรบ้าง ไม่เขียนลง DB จริง)
 * ต้องใส่ --yes เพิ่มถึงจะ insert จริง:
 *   npx ts-node -r tsconfig-paths/register scripts/mock-defects-round.ts --round=39 --count=150 --yes
 *
 * severity สุ่มจาก 'Minor'/'Major' เท่านั้น (ตรงกับ convention ของโปรเจกต์ — ดู completion-score.util.ts)
 * room/floor/sub-category/inspector สุ่มจากข้อมูลที่มีอยู่จริงใน DB (ต้องมีอย่างน้อยอย่างละ 1 แถว)
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { User } from '../src/users/entities/user.entity';
import { InspectionJob } from '../src/inspection-jobs/entities/inspection-job.entity';
import { Customer } from '../src/customers/entities/customer.entity';
import { Address } from '../src/addresses/entities/address.entity';
import { HouseType } from '../src/house-types/entities/house-type.entity';
import { InspectionTeamMember } from '../src/inspection-team-members/entities/inspection-team-member.entity';
import { Team } from '../src/teams/entities/team.entity';
import { InspectionRound } from '../src/inspection-rounds/entities/inspection-round.entity';
import { DefectCategory } from '../src/defect-categories/entities/defect-category.entity';
import { DefectSubCategory } from '../src/defect-sub-categories/entities/defect-sub-category.entity';
import { RepairRecord } from '../src/repair-records/entities/repair-record.entity';
import { Contractor } from '../src/contractor/entities/contractor.entity';
import { Defect } from '../src/defects/entities/defect.entity';
import { Floor } from '../src/floor/entities/floor.entity';
import { SubRoom } from '../src/sub-rooms/entities/sub-room.entity';
import { Room } from '../src/rooms/entities/room.entity';

function parseArg(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const ROUND_ID = parseInt(parseArg('round', '39')!, 10);
const COUNT = parseInt(parseArg('count', '150')!, 10);
const COMMIT = process.argv.includes('--yes');

// เดิมสุ่ม note จาก pool ทั่วไปที่ไม่เกี่ยวกับ subcategory ที่เลือก (เช่น subcategory "กระเดิด"
// ดันได้ note "ระบบท่อรั่วซึม") ทำให้ประเภทงานกับ defect คนละเรื่องกัน — เปลี่ยนมาผูก note
// เข้ากับชื่อ subcategory ตรง ๆ แทน เพื่อให้เนื้อหาคล้องจองกับหมวดที่สุ่มได้เสมอ
const MINOR_WRAPPERS = [
  (name: string) => `พบ "${name}" ระดับเล็กน้อย ยังไม่กระทบการใช้งาน`,
  (name: string) => `สังเกตเห็น "${name}" เป็นจุดเล็ก ๆ`,
  (name: string) => `ร่องรอย "${name}" ระดับผิวเผิน ปรับแต่งเก็บงานได้`,
];

const MAJOR_WRAPPERS = [
  (name: string) => `พบ "${name}" ชัดเจน ต้องซ่อมก่อนส่งมอบ`,
  (name: string) => `"${name}" ระดับรุนแรง กระทบต่อการใช้งาน`,
  (name: string) => `ตรวจพบ "${name}" ที่ต้องแก้ไขก่อนปิดงาน`,
];

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    entities: [
      User,
      InspectionJob,
      Customer,
      Address,
      HouseType,
      InspectionTeamMember,
      Team,
      InspectionRound,
      DefectCategory,
      DefectSubCategory,
      RepairRecord,
      Contractor,
      Defect,
      Floor,
      SubRoom,
      Room,
    ],
    synchronize: false,
    namingStrategy: new SnakeNamingStrategy(),
  });

  await dataSource.initialize();

  const roundRepo = dataSource.getRepository(InspectionRound);
  const round = await roundRepo.findOne({ where: { roundId: ROUND_ID } });
  if (!round) {
    console.error(`Round ${ROUND_ID} ไม่พบใน DB — หยุดทำงาน ไม่มีอะไรถูกเขียน`);
    await dataSource.destroy();
    process.exit(1);
  }

  const rooms = await dataSource.getRepository(Room).find();
  const floors = await dataSource.getRepository(Floor).find();
  const subCategories = await dataSource.getRepository(DefectSubCategory).find();
  const inspectors = await dataSource
    .getRepository(User)
    .find({ where: { role: 'inspector' } });

  const existingCount = await dataSource
    .getRepository(Defect)
    .count({ where: { round: { roundId: ROUND_ID } } });

  console.log(`Round ${ROUND_ID}: status=${round.status} roundNumber=${round.roundNumber}`);
  console.log(`ข้อมูลอ้างอิงที่มีอยู่: rooms=${rooms.length} floors=${floors.length} subCategories=${subCategories.length} inspectors=${inspectors.length}`);
  console.log(`defect ที่มีอยู่แล้วบน round นี้: ${existingCount}`);

  if (!rooms.length || !floors.length || !subCategories.length || !inspectors.length) {
    console.error('ขาดข้อมูลอ้างอิงบางอย่าง (room/floor/sub-category/inspector) — ต้อง seed พื้นฐานก่อน ไม่ insert defect');
    await dataSource.destroy();
    process.exit(1);
  }

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const severities: ('Minor' | 'Major')[] = [];
  for (let i = 0; i < COUNT; i++) severities.push(i % 2 === 0 ? 'Minor' : 'Major');
  for (let i = severities.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [severities[i], severities[j]] = [severities[j], severities[i]];
  }

  const drafts = severities.map((severity) => {
    const subCategory = pick(subCategories);
    const wrapper = pick(severity === 'Minor' ? MINOR_WRAPPERS : MAJOR_WRAPPERS);
    return {
      round: { roundId: ROUND_ID } as InspectionRound,
      room: { roomId: pick(rooms).roomId } as Room,
      floor: { floorId: pick(floors).floorId } as Floor,
      subCategories: [subCategory],
      inspector: { id: pick(inspectors).id } as User,
      severity,
      description: `[MOCK] ${wrapper(subCategory.name)}`,
    };
  });

  const minorCount = severities.filter((s) => s === 'Minor').length;
  const majorCount = severities.length - minorCount;
  console.log(`เตรียม insert ${drafts.length} defect: Minor=${minorCount} Major=${majorCount}`);

  if (!COMMIT) {
    console.log('DRY RUN — ไม่มีอะไรถูกเขียนลง DB ใส่ --yes ต่อท้ายคำสั่งถ้าจะ insert จริง');
    console.log('ตัวอย่าง 3 รายการแรก:', JSON.stringify(drafts.slice(0, 3), null, 2));
    await dataSource.destroy();
    return;
  }

  const defectRepo = dataSource.getRepository(Defect);
  const inserted: number[] = [];
  const BATCH = 25;
  for (let i = 0; i < drafts.length; i += BATCH) {
    const chunk = drafts.slice(i, i + BATCH);
    const entities = chunk.map((d) => defectRepo.create(d));
    const saved = await defectRepo.save(entities);
    saved.forEach((s) => inserted.push(s.defectId));
    console.log(`insert แล้ว ${Math.min(i + BATCH, drafts.length)}/${drafts.length}`);
  }

  console.log(`เสร็จแล้ว — insert ${inserted.length} defect ให้ round ${ROUND_ID}`);
  console.log(`defect_id range: ${Math.min(...inserted)} - ${Math.max(...inserted)}`);
  console.log(`ลบทิ้งทีหลังได้ด้วย: DELETE FROM defect WHERE defect_id BETWEEN ${Math.min(...inserted)} AND ${Math.max(...inserted)};`);

  await dataSource.destroy();
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
