import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Defect } from 'src/defects/entities/defect.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfmake = require('pdfmake');

/**
 * PdfService — สร้าง PDF รายงานตรวจบ้านแบบ server-side
 *
 * โครงสร้างรายงานเลียนแบบ DefectReport.vue ของ Frontend:
 * 1. หน้าปก: ข้อมูลโครงการ + ลูกค้า + สรุปสถิติ + กราฟ
 * 2. หน้า Major Defects: แยก defects ที่เป็น Major ทั้งหมด
 * 3. หน้า All Defects: จัดกลุ่มตามห้อง
 * 4. หน้า Summary: สรุปผลตรวจแยกตามระบบ/ประเภทงาน
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    @InjectRepository(Defect)
    private readonly defectsRepo: Repository<Defect>,
    @InjectRepository(InspectionRound)
    private readonly roundsRepo: Repository<InspectionRound>,
    @InjectRepository(InspectionSummaryItem)
    private readonly summaryItemsRepo: Repository<InspectionSummaryItem>,
  ) {}

  /**
   * สร้าง PDF รายงานตรวจบ้านสำหรับ round ที่ระบุ
   * @returns Buffer ของไฟล์ PDF
   */
  async generateReport(roundId: number): Promise<Buffer> {
    // ดึงข้อมูล round พร้อม relations ที่จำเป็น
    const round = await this.roundsRepo.findOneOrFail({
      where: { roundId },
      relations: [
        'job',
        'job.customer',
        'job.address',
        'job.houseType',
        'teamMembers',
        'teamMembers.inspector',
        'teamMembers.team',
      ],
    });

    // ดึง Defects ทั้งหมดของ round นี้
    const defects = await this.defectsRepo.find({
      where: { round: { roundId } },
      relations: [
        'room',
        'subRoom',
        'floor',
        'subCategories',
        'subCategories.category',
      ],
      order: { defectId: 'ASC' },
    });

    // ดึง Summary Items ทั้งหมดของ round นี้
    const summaryItems = await this.summaryItemsRepo.find({
      where: { round: { roundId } },
      relations: ['template', 'option'],
    });

    const job = round.job;
    const customer = job.customer;
    const address = job.address;

    // ========== สถิติ ==========
    const totalDefects = defects.length;
    const majorCount = defects.filter((d) => d.severity === 'Major').length;
    const minorCount = defects.filter((d) => d.severity === 'Minor').length;
    const pendingRepair = defects.filter(
      (d) => d.status === 'pending_repair',
    ).length;
    const repaired = defects.filter((d) => d.status === 'repaired').length;
    const rejected = defects.filter((d) => d.status === 'rejected').length;
    const verified = defects.filter((d) => d.status === 'verified').length;

    // ========== วันที่ ==========
    const scheduledDateStr = round.scheduledDate
      ? new Date(round.scheduledDate).toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '-';

    const approvedDateStr = round.approvedAt
      ? new Date(round.approvedAt).toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '-';

    // ========== ทีม ==========
    const teamName =
      round.teamMembers?.[0]?.team?.team_name ??
      round.teamMembers?.[0]?.inspector?.fullName ??
      '-';

    // ========== กราฟ: Defect ตามประเภทงาน ==========
    const categoryCounts = new Map<
      string,
      { major: number; minor: number }
    >();
    defects.forEach((d) => {
      const name =
        d.subCategories?.[0]?.category?.name ?? 'ไม่ระบุประเภท';
      const entry = categoryCounts.get(name) ?? { major: 0, minor: 0 };
      if (d.severity === 'Major') entry.major += 1;
      else entry.minor += 1;
      categoryCounts.set(name, entry);
    });
    const categoryData = [...categoryCounts.entries()]
      .map(([name, { major, minor }]) => ({
        name,
        major,
        minor,
        count: major + minor,
      }))
      .sort((a, b) => b.count - a.count);

    // ========== กราฟ: Defect ตามชั้น ==========
    const floorCounts = new Map<
      string,
      { count: number; order: number }
    >();
    defects.forEach((d) => {
      const name = d.floor?.label ?? 'ไม่ระบุชั้น';
      const order = d.floor?.floorOrder ?? Number.MAX_SAFE_INTEGER;
      const existing = floorCounts.get(name);
      floorCounts.set(name, {
        count: (existing?.count ?? 0) + 1,
        order,
      });
    });
    const floorData = [...floorCounts.entries()]
      .map(([name, { count, order }]) => ({ name, count, order }))
      .sort((a, b) => a.order - b.order);

    // ========== Major Defects ==========
    const majorDefects = defects.filter((d) => d.severity === 'Major');

    // ========== All Defects จัดกลุ่มตามห้อง ==========
    const defectsByRoom = new Map<string, Defect[]>();
    defects.forEach((defect) => {
      const key = `${defect.room?.roomName ?? '-'}, ${defect.subRoom?.roomName ?? '-'}, ${defect.floor?.label ?? '-'}`;
      if (!defectsByRoom.has(key)) defectsByRoom.set(key, []);
      defectsByRoom.get(key)!.push(defect);
    });

    // ========== Summary Groups (เหมือน Frontend) ==========
    const summaryGroups = this.buildSummaryGroups(summaryItems, defects);

    // ========== สร้าง Document ==========
    const content: Content[] = [];

    // ===== หน้า 1: ข้อมูลโครงการ + สถิติ + กราฟ =====
    content.push(
      // Header
      {
        text: 'POYSIAN',
        fontSize: 24,
        bold: true,
        color: '#1976d2',
        alignment: 'center',
        margin: [0, 0, 0, 4],
      } as Content,
      {
        text: 'บริการตรวจบ้าน ตรวจคอนโด ครบวงจร',
        fontSize: 10,
        color: '#78909c',
        alignment: 'center',
        margin: [0, 0, 0, 8],
      } as Content,

      // Title
      {
        text: `รายงานตรวจบ้าน — ${job.projectName}, ครั้งที่ ${round.roundNumber}`,
        fontSize: 14,
        bold: true,
        alignment: 'center',
        color: '#263238',
        margin: [0, 0, 0, 2],
      } as Content,
      {
        text: `วันที่ตรวจ: ${scheduledDateStr}  |  วันที่อนุมัติ: ${approvedDateStr}`,
        fontSize: 9,
        color: '#78909c',
        alignment: 'center',
        margin: [0, 0, 0, 16],
      } as Content,

      // ข้อมูลโครงการ + ลูกค้า (2 คอลัมน์)
      {
        columns: [
          {
            width: '50%',
            stack: [
              this.sectionTitle('ข้อมูลโครงการ'),
              this.infoRow('ชื่อโครงการ', job.projectName),
              this.infoRow(
                'ประเภท',
                `${job.houseType?.name ?? '-'} ${address?.floor ? address.floor + ' ชั้น' : ''}`,
              ),
              this.infoRow(
                'พื้นที่ใช้สอย',
                `${job.usableArea ?? '-'} ตร.ม.`,
              ),
              this.infoRow('จังหวัด', address?.province ?? '-'),
              this.infoRow('เขต/อำเภอ', address?.district ?? '-'),
              this.infoRow('แขวง/ตำบล', address?.subDistrict ?? '-'),
            ],
          },
          {
            width: '50%',
            stack: [
              this.sectionTitle('ข้อมูลลูกค้า'),
              this.infoRow('ชื่อลูกค้า', customer?.fullName ?? '-'),
              this.infoRow('เบอร์โทร', customer?.phoneNumber ?? '-'),
              this.infoRow('อีเมล', customer?.email ?? '-'),
              this.infoRow('ผู้ประสานงาน', teamName),
            ],
          },
        ],
        margin: [0, 0, 0, 12],
      } as Content,

      // สถิติ 6 ช่อง (เหมือน Frontend summaryStats)
      this.sectionTitle('สรุปจำนวน Defect'),
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*', '*', '*'],
          body: [
            [
              this.statHeader('Total Defects', '#e3f2fd'),
              this.statHeader('Major', '#ffebee'),
              this.statHeader('Minor', '#fff3e0'),
              this.statHeader('กำลังรอซ่อม', '#fff8e1'),
              this.statHeader('ซ่อมไม่ผ่าน', '#fce4ec'),
              this.statHeader('ซ่อมผ่านแล้ว', '#e8f5e9'),
            ],
            [
              this.statValue(totalDefects, '#1976d2'),
              this.statValue(majorCount, '#ef4444'),
              this.statValue(minorCount, '#fb8c00'),
              this.statValue(pendingRepair, '#f9a825'),
              this.statValue(rejected, '#ef4444'),
              this.statValue(verified, '#4caf50'),
            ],
          ],
        },
        layout: {
          hLineColor: () => '#e0e0e0',
          vLineColor: () => '#e0e0e0',
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        margin: [0, 0, 0, 14],
      } as Content,

      // กราฟ: Defect ตามประเภทงาน (ตารางแทน bar chart)
      this.sectionTitle('จำนวน Defect ตามประเภทงาน'),
      categoryData.length > 0
        ? this.buildCategoryTable(categoryData)
        : ({
            text: 'ไม่มีข้อมูล',
            italics: true,
            color: '#9e9e9e',
            margin: [0, 0, 0, 10],
          } as Content),

      // กราฟ: Defect ตามชั้น + สถานะซ่อม (2 คอลัมน์)
      {
        columns: [
          {
            width: '50%',
            stack: [
              this.sectionTitle('จำนวน Defect ตามชั้น'),
              floorData.length > 0
                ? this.buildFloorTable(floorData)
                : ({
                    text: 'ไม่มีข้อมูล',
                    italics: true,
                    color: '#9e9e9e',
                  } as Content),
            ],
          },
          {
            width: '50%',
            stack: [
              this.sectionTitle('สถานะการซ่อม'),
              this.buildStatusTable(
                pendingRepair,
                repaired,
                rejected,
                verified,
              ),
            ],
          },
        ],
        columnGap: 12,
        margin: [0, 0, 0, 10],
      } as Content,
    );

    // ===== หน้า Major Defects =====
    if (majorDefects.length > 0) {
      content.push({ text: '', pageBreak: 'before' } as Content);
      content.push({
        text: 'Main Defects',
        fontSize: 16,
        bold: true,
        color: '#ef4444',
        alignment: 'center',
        margin: [0, 0, 0, 10],
      } as Content);
      content.push(this.buildDefectTable(majorDefects, '#ef4444'));
    }

    // ===== หน้า All Defects จัดกลุ่มตามห้อง =====
    content.push({ text: '', pageBreak: 'before' } as Content);
    content.push({
      text: 'Defect List',
      fontSize: 16,
      bold: true,
      color: '#1976d2',
      alignment: 'center',
      margin: [0, 0, 0, 10],
    } as Content);

    for (const [roomName, roomDefects] of defectsByRoom) {
      content.push({
        text: roomName,
        fontSize: 11,
        bold: true,
        alignment: 'center',
        fillColor: '#e3f2fd',
        margin: [0, 8, 0, 4],
        background: '#e3f2fd',
      } as Content);
      content.push(this.buildDefectTable(roomDefects));
    }

    if (defects.length === 0) {
      content.push({
        text: 'ไม่พบรายการ Defect',
        italics: true,
        color: '#9e9e9e',
        alignment: 'center',
        margin: [0, 20, 0, 0],
      } as Content);
    }

    // ===== หน้า Summary (สรุปผลการตรวจ) =====
    if (summaryGroups.length > 0) {
      content.push({ text: '', pageBreak: 'before' } as Content);
      content.push({
        text: 'สรุปผลการตรวจ',
        fontSize: 16,
        bold: true,
        color: '#1976d2',
        alignment: 'center',
        margin: [0, 0, 0, 10],
      } as Content);

      for (const group of summaryGroups) {
        content.push(this.buildSummaryCard(group));
      }
    }

    // ========== Document Definition ==========
    const headerText = `${job.projectName}, ครั้งที่ ${round.roundNumber}, ${scheduledDateStr}`;

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 50, 40, 50],
      defaultStyle: {
        fontSize: 10,
      },
      header: (currentPage: number, pageCount: number) => ({
        columns: [
          {
            text: headerText,
            fontSize: 8,
            color: '#9e9e9e',
            margin: [40, 20, 0, 0],
          },
          {
            text: `หน้า | ${currentPage} / ${pageCount}`,
            fontSize: 8,
            color: '#9e9e9e',
            alignment: 'right',
            margin: [0, 20, 40, 0],
          },
        ],
      }),
      footer: () => ({
        columns: [
          {
            text: '© 2026, POYSIAN รับตรวจบ้าน ตรวจคอนโด',
            fontSize: 8,
            color: '#9e9e9e',
            margin: [40, 0],
          },
          {
            text: '@poysian  |  098-765-4321  |  poysian@gmail.com',
            fontSize: 8,
            color: '#9e9e9e',
            alignment: 'right',
            margin: [0, 0, 40, 0],
          },
        ],
      }),
      content,
    };

    return this.createPdfBuffer(docDefinition);
  }

  // ==================== Helper Methods ====================

  private sectionTitle(text: string): Content {
    return {
      text,
      fontSize: 11,
      bold: true,
      color: '#1976d2',
      margin: [0, 4, 0, 4],
    } as Content;
  }

  private infoRow(label: string, value: string): Content {
    return {
      columns: [
        {
          text: label,
          width: 80,
          fontSize: 9,
          color: '#78909c',
        },
        {
          text: value,
          fontSize: 9,
          bold: true,
          color: '#263238',
        },
      ],
      margin: [0, 0, 0, 2],
    } as Content;
  }

  private statHeader(text: string, fillColor: string) {
    return {
      text,
      bold: true,
      alignment: 'center' as const,
      fillColor,
      fontSize: 8,
    };
  }

  private statValue(value: number, color: string) {
    return {
      text: String(value),
      alignment: 'center' as const,
      fontSize: 14,
      bold: true,
      color,
    };
  }

  /** ตาราง Defect ตามประเภทงาน (แสดง bar แบบ text + สี) */
  private buildCategoryTable(
    data: { name: string; major: number; minor: number; count: number }[],
  ): Content {
    const maxCount = Math.max(1, ...data.map((d) => d.count));
    return {
      table: {
        headerRows: 1,
        widths: ['auto', 40, 40, '*', 40],
        body: [
          [
            {
              text: 'ประเภทงาน',
              bold: true,
              fillColor: '#1976d2',
              color: 'white',
              fontSize: 9,
            },
            {
              text: 'Major',
              bold: true,
              fillColor: '#ef4444',
              color: 'white',
              alignment: 'center' as const,
              fontSize: 9,
            },
            {
              text: 'Minor',
              bold: true,
              fillColor: '#fb8c00',
              color: 'white',
              alignment: 'center' as const,
              fontSize: 9,
            },
            { text: '', fillColor: '#f5f5f5', fontSize: 9 },
            {
              text: 'รวม',
              bold: true,
              fillColor: '#1976d2',
              color: 'white',
              alignment: 'center' as const,
              fontSize: 9,
            },
          ],
          ...data.map((row) => {
            const barWidth = Math.max(5, (row.count / maxCount) * 100);
            const barText = '█'.repeat(
              Math.max(1, Math.round(barWidth / 5)),
            );
            return [
              { text: row.name, fontSize: 9 },
              {
                text: String(row.major),
                alignment: 'center' as const,
                color: '#ef4444',
                bold: true,
                fontSize: 9,
              },
              {
                text: String(row.minor),
                alignment: 'center' as const,
                color: '#fb8c00',
                bold: true,
                fontSize: 9,
              },
              {
                text: barText,
                color: '#1976d2',
                fontSize: 7,
                fillColor: '#fafafa',
              },
              {
                text: String(row.count),
                alignment: 'center' as const,
                bold: true,
                fontSize: 9,
              },
            ];
          }),
        ],
      },
      layout: {
        hLineColor: () => '#e0e0e0',
        vLineColor: () => '#e0e0e0',
        paddingTop: () => 3,
        paddingBottom: () => 3,
        paddingLeft: () => 4,
        paddingRight: () => 4,
      },
      margin: [0, 0, 0, 10],
    } as Content;
  }

  /** ตาราง Defect ตามชั้น */
  private buildFloorTable(
    data: { name: string; count: number }[],
  ): Content {
    return {
      table: {
        widths: ['*', 50],
        body: [
          [
            {
              text: 'ชั้น',
              bold: true,
              fillColor: '#1976d2',
              color: 'white',
              fontSize: 9,
            },
            {
              text: 'จำนวน',
              bold: true,
              fillColor: '#1976d2',
              color: 'white',
              alignment: 'center' as const,
              fontSize: 9,
            },
          ],
          ...data.map((row, i) => [
            {
              text: row.name,
              fontSize: 9,
              fillColor: i % 2 === 0 ? '#ffffff' : '#f5f5f5',
            },
            {
              text: String(row.count),
              alignment: 'center' as const,
              bold: true,
              fontSize: 9,
              fillColor: i % 2 === 0 ? '#ffffff' : '#f5f5f5',
              color: '#1976d2',
            },
          ]),
        ],
      },
      layout: {
        hLineColor: () => '#e0e0e0',
        vLineColor: () => '#e0e0e0',
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
    } as Content;
  }

  /** ตารางสถานะการซ่อม (แทน donut chart) */
  private buildStatusTable(
    pendingRepair: number,
    repaired: number,
    rejected: number,
    verified: number,
  ): Content {
    const rows: { label: string; count: number; color: string }[] = [
      { label: 'กำลังรอซ่อม', count: pendingRepair, color: '#fb8c00' },
      { label: 'ซ่อมแล้ว', count: repaired, color: '#1976d2' },
      { label: 'ซ่อมไม่ผ่าน', count: rejected, color: '#ef4444' },
      { label: 'ซ่อมผ่านแล้ว', count: verified, color: '#4caf50' },
    ];
    return {
      table: {
        widths: [10, '*', 50],
        body: rows.map((row) => [
          { text: '●', color: row.color, fontSize: 10, alignment: 'center' as const },
          { text: row.label, fontSize: 9 },
          {
            text: String(row.count),
            bold: true,
            fontSize: 10,
            alignment: 'center' as const,
            color: row.color,
          },
        ]),
      },
      layout: {
        hLineColor: () => '#e0e0e0',
        vLineColor: () => '#e0e0e0',
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
    } as Content;
  }

  /** ตาราง Defect (ใช้ทั้ง Major page และ All Defects page) */
  private buildDefectTable(
    defectList: Defect[],
    accentColor?: string,
  ): Content {
    const headerColor = accentColor ?? '#1976d2';
    const statusMap: Record<string, string> = {
      pending_repair: 'รอซ่อม',
      repaired: 'ซ่อมแล้ว',
      rejected: 'ไม่ผ่าน',
      verified: 'ผ่านแล้ว',
    };
    return {
      table: {
        headerRows: 1,
        widths: [25, 70, 50, 'auto', '*', 40, 45],
        body: [
          [
            { text: '#', bold: true, fillColor: headerColor, color: 'white', alignment: 'center' as const, fontSize: 8 },
            { text: 'ห้อง', bold: true, fillColor: headerColor, color: 'white', fontSize: 8 },
            { text: 'ชั้น', bold: true, fillColor: headerColor, color: 'white', fontSize: 8 },
            { text: 'ประเภทงาน', bold: true, fillColor: headerColor, color: 'white', fontSize: 8 },
            { text: 'หมายเหตุ', bold: true, fillColor: headerColor, color: 'white', fontSize: 8 },
            { text: 'ระดับ', bold: true, fillColor: headerColor, color: 'white', alignment: 'center' as const, fontSize: 8 },
            { text: 'สถานะ', bold: true, fillColor: headerColor, color: 'white', alignment: 'center' as const, fontSize: 8 },
          ],
          ...defectList.map((defect, index) => {
            const rowBg = index % 2 === 0 ? '#ffffff' : '#f5f5f5';
            const severityColor =
              defect.severity === 'Major' ? '#ef4444' : '#fb8c00';
            return [
              { text: String(defect.defectId), alignment: 'center' as const, fillColor: rowBg, fontSize: 8 },
              {
                text: `${defect.room?.roomName ?? '-'}, ${defect.subRoom?.roomName ?? ''}`.trim(),
                fillColor: rowBg,
                fontSize: 8,
              },
              { text: defect.floor?.label ?? '-', fillColor: rowBg, fontSize: 8 },
              {
                text:
                  defect.subCategories
                    ?.map((s) => s.category?.name)
                    .filter(Boolean)
                    .join(', ') || '-',
                fillColor: rowBg,
                fontSize: 8,
              },
              { text: defect.description ?? '-', fillColor: rowBg, fontSize: 8 },
              {
                text: defect.severity ?? '-',
                alignment: 'center' as const,
                fillColor: rowBg,
                color: severityColor,
                bold: true,
                fontSize: 8,
              },
              {
                text: statusMap[defect.status] ?? defect.status,
                alignment: 'center' as const,
                fillColor: rowBg,
                fontSize: 8,
              },
            ];
          }),
        ],
      },
      layout: {
        hLineColor: () => '#e0e0e0',
        vLineColor: () => '#e0e0e0',
        paddingTop: () => 3,
        paddingBottom: () => 3,
        paddingLeft: () => 3,
        paddingRight: () => 3,
      },
      margin: [0, 0, 0, 6],
    } as Content;
  }

  /** สร้าง Summary Groups เหมือน DefectReport.vue */
  private buildSummaryGroups(
    summaryItems: InspectionSummaryItem[],
    defects: Defect[],
  ): {
    category: string;
    labels: { label: string; items: InspectionSummaryItem[] }[];
    defects: Defect[];
    outcomeLabel: string;
    outcomeColor: string;
    defectComments: string[];
  }[] {
    const groups = new Map<
      string,
      Map<string, InspectionSummaryItem[]>
    >();

    summaryItems.forEach((item) => {
      const category = item.template?.category ?? 'ทั่วไป';
      const label = item.template?.label ?? '-';
      if (!groups.has(category)) groups.set(category, new Map());
      const labelMap = groups.get(category)!;
      if (!labelMap.has(label)) labelMap.set(label, []);
      labelMap.get(label)!.push(item);
    });

    // เพิ่ม categories จาก defects ที่อาจยังไม่มีใน summary
    defects.forEach((defect) => {
      const categoryNames = [
        ...new Set(
          (defect.subCategories ?? [])
            .map((sub) => sub.category?.name)
            .filter((name): name is string => !!name),
        ),
      ];
      const names = categoryNames.length
        ? categoryNames
        : ['ไม่ระบุระบบ'];
      names.forEach((category) => {
        if (!groups.has(category)) groups.set(category, new Map());
      });
    });

    return [...groups.entries()].map(([category, labelMap]) => {
      const categoryDefects = defects.filter((defect) => {
        const defectCategories = (defect.subCategories ?? [])
          .map((sub) => sub.category?.name)
          .filter(Boolean);
        return (
          defectCategories.includes(category) ||
          (defectCategories.length === 0 && category === 'ไม่ระบุระบบ')
        );
      });
      const defectComments = categoryDefects
        .map((d) => d.description?.trim())
        .filter((desc): desc is string => !!desc);
      const majorInCategory = categoryDefects.filter(
        (d) => d.severity === 'Major',
      ).length;
      const outcomeLabel =
        categoryDefects.length === 0
          ? 'ผ่าน'
          : majorInCategory > 0
            ? `พบ Major ${majorInCategory} จุด`
            : 'พบ Minor';
      const outcomeColor =
        categoryDefects.length === 0
          ? '#16a34a'
          : majorInCategory > 0
            ? '#ef4444'
            : '#f59e0b';

      return {
        category,
        labels: [...labelMap.entries()].map(([label, items]) => ({
          label,
          items,
        })),
        defects: categoryDefects,
        outcomeLabel,
        outcomeColor,
        defectComments,
      };
    });
  }

  /** สร้าง Summary Card สำหรับแต่ละระบบ (เหมือน summary-system-card) */
  private buildSummaryCard(group: {
    category: string;
    labels: { label: string; items: InspectionSummaryItem[] }[];
    defects: Defect[];
    outcomeLabel: string;
    outcomeColor: string;
    defectComments: string[];
  }): Content {
    const rows: Content[] = [];

    // Header: ชื่อระบบ + ผลลัพธ์
    rows.push({
      columns: [
        {
          width: '*',
          stack: [
            {
              text: group.category,
              fontSize: 11,
              bold: true,
              color: '#1976d2',
            },
            {
              text: `ตรวจแล้ว ${group.labels.length} รายการ, พบ Defect ${group.defects.length} จุด`,
              fontSize: 8,
              color: '#78909c',
              margin: [0, 2, 0, 0],
            },
          ],
        },
        {
          width: 'auto',
          stack: [
            {
              text: ` ${group.outcomeLabel} `,
              fontSize: 9,
              bold: true,
              color: 'white',
              background: group.outcomeColor,
              alignment: 'center',
            } as Content,
            {
              text: String(group.defects.length),
              fontSize: 14,
              bold: true,
              color: group.outcomeColor,
              alignment: 'center',
              margin: [0, 2, 0, 0],
            },
          ],
        },
      ],
      margin: [0, 6, 0, 6],
    } as Content);

    // Overview: ผลการตรวจ, จำนวน Defect, คอมเมนต์
    rows.push({
      columns: [
        {
          width: '33%',
          stack: [
            { text: 'ผลการตรวจ', fontSize: 7, color: '#64748b' },
            {
              text: group.outcomeLabel,
              fontSize: 9,
              bold: true,
              color: '#1f2937',
            },
          ],
        },
        {
          width: '33%',
          stack: [
            { text: 'จำนวน Defect', fontSize: 7, color: '#64748b' },
            {
              text: `${group.defects.length} จุด`,
              fontSize: 9,
              bold: true,
              color: '#1f2937',
            },
          ],
        },
        {
          width: '33%',
          stack: [
            { text: 'คอมเมนต์', fontSize: 7, color: '#64748b' },
            {
              text: `${group.defectComments.length} รายการ`,
              fontSize: 9,
              bold: true,
              color: '#1f2937',
            },
          ],
        },
      ],
      margin: [0, 0, 0, 6],
    } as Content);

    // Label items
    if (group.labels.length > 0) {
      for (const labelGroup of group.labels) {
        rows.push({
          text: labelGroup.label,
          fontSize: 9,
          bold: true,
          color: '#263238',
          margin: [0, 2, 0, 1],
        } as Content);
        const values = labelGroup.items
          .map((item) => item.option?.value ?? '-')
          .join(', ');
        rows.push({
          text: `• ${values}`,
          fontSize: 8,
          color: '#546e7a',
          margin: [8, 0, 0, 1],
        } as Content);
        // Detail values
        for (const item of labelGroup.items) {
          if (item.detailValue) {
            rows.push({
              text: `  คอมเมนต์: ${item.detailValue}`,
              fontSize: 8,
              color: '#78909c',
              italics: true,
              margin: [12, 0, 0, 1],
            } as Content);
          }
        }
      }
    } else if (group.defects.length > 0) {
      rows.push({
        text: 'ไม่มีรายการตรวจในหมวดนี้ แต่พบ Defect ที่ถูกจัดอยู่ในระบบนี้',
        fontSize: 8,
        color: '#64748b',
        italics: true,
        margin: [0, 2, 0, 2],
      } as Content);
    }

    // Defect comments
    if (group.defectComments.length > 0) {
      rows.push({
        text: 'คอมเมนต์จากรูป Defect',
        fontSize: 9,
        bold: true,
        color: '#0f4c81',
        margin: [0, 4, 0, 2],
      } as Content);
      for (const comment of group.defectComments.slice(0, 3)) {
        rows.push({
          text: `• ${comment}`,
          fontSize: 8,
          color: '#475569',
          margin: [8, 0, 0, 1],
        } as Content);
      }
    }

    // Wrap in a bordered table to look like a card
    return {
      table: {
        widths: ['*'],
        body: [[{ stack: rows, margin: [6, 4, 6, 4] }]],
      },
      layout: {
        hLineColor: () => '#d8e1ea',
        vLineColor: () => '#d8e1ea',
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        paddingTop: () => 0,
        paddingBottom: () => 0,
        paddingLeft: () => 0,
        paddingRight: () => 0,
      },
      margin: [0, 0, 0, 8],
    } as Content;
  }

  private async createPdfBuffer(
    docDefinition: TDocumentDefinitions,
  ): Promise<Buffer> {
    const fonts = {
      Roboto: {
        normal: 'node_modules/pdfmake/fonts/Roboto/Roboto-Regular.ttf',
        bold: 'node_modules/pdfmake/fonts/Roboto/Roboto-Medium.ttf',
        italics: 'node_modules/pdfmake/fonts/Roboto/Roboto-Italic.ttf',
        bolditalics: 'node_modules/pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf',
      },
    };

    pdfmake.setFonts(fonts);
    const pdfDoc = pdfmake.createPdf(docDefinition);
    return pdfDoc.getBuffer();
  }
}
