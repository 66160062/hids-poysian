/*
 * One-time migration: rename job_plans → house_plans and backfill any existing
 * inspection_job.house_plan_url values into house_plans, before the backend code
 * that removes the legacy column gets deployed.
 *
 * รันจาก backend/:
 *   npm run migrate:house-plans
 *
 * ปลอดภัยที่จะรันซ้ำ (idempotent):
 *   - ถ้า table job_plans ถูก rename ไปแล้ว จะข้ามขั้นตอน RENAME
 *   - INSERT มี NOT EXISTS guard กันไม่ให้ backfill ซ้ำสำหรับ job เดียวกัน
 *
 * ใช้ DB connection env vars ชุดเดียวกับ src/app.module.ts (DB_HOST/DB_PORT/DB_USERNAME/
 * DB_PASSWORD/DB_DATABASE), อ่านจาก .env ที่ backend/
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';

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
  });

  await dataSource.initialize();
  console.log(`Connected to database "${process.env.DB_DATABASE}".`);

  try {
    const tableExists = async (name: string) => {
      const rows = await dataSource.query(
        `SELECT 1 FROM information_schema.tables WHERE table_name = $1`,
        [name],
      );
      return rows.length > 0;
    };

    if ((await tableExists('job_plans')) && !(await tableExists('house_plans'))) {
      await dataSource.query(`ALTER TABLE job_plans RENAME TO house_plans`);
      console.log('Renamed table job_plans -> house_plans.');
    } else if (await tableExists('house_plans')) {
      console.log('Table house_plans already exists, skipping rename.');
    } else {
      throw new Error(
        'Neither job_plans nor house_plans table exists — check DB connection / that the app has run at least once.',
      );
    }

    const [{ count: beforeCount }] = await dataSource.query(
      `SELECT count(*)::int AS count FROM house_plans`,
    );
    console.log(`house_plans currently has ${beforeCount} row(s).`);

    const result = await dataSource.query(`
      INSERT INTO house_plans (name, image_url, order_index, created_at, updated_at, job_id, floor_id)
      SELECT 'แปลนบ้าน 1', ij.house_plan_url, 0, NOW(), NOW(), ij.job_id, NULL
      FROM inspection_job ij
      WHERE ij.house_plan_url IS NOT NULL
        AND ij.house_plan_url <> ''
        AND NOT EXISTS (SELECT 1 FROM house_plans hp WHERE hp.job_id = ij.job_id)
      RETURNING plan_id
    `);
    console.log(`Backfilled ${result.length} house_plans row(s) from inspection_job.house_plan_url.`);

    const [{ count: afterCount }] = await dataSource.query(
      `SELECT count(*)::int AS count FROM house_plans`,
    );
    console.log(`house_plans now has ${afterCount} row(s).`);
    console.log(
      'Done. Safe to deploy the backend code that removes inspection_job.house_plan_url now.',
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
