<template>
  <div style="overflow: hidden; width: 100%">
    <div
      ref="reportRef"
      class="pdf-wrapper"
      :style="`transform: scale(${pageScale}); transform-origin: top left; width: 794px;`"
    >
      <!-- หน้า 1: ข้อมูล -->
      <div class="pdf-page">
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ round.job.projectName }}, ครั้งที่ {{ round.roundNumber }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">หน้า | 1 / {{ totalPages }}</div>
        </div>

        <div class="row justify-center q-py-sm">
          <img loading="eager" :src="reportLogo" style="height: 100px; object-fit: contain" />
        </div>

        <div class="row justify-center q-mb-md">
          <img
            loading="eager"
            :src="
              round.job.projectImageUrl
                ? `${apiUrl}${round.job.projectImageUrl}`
                : 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600'
            "
            style="
              width: 95%;
              max-height: 200px;
              object-fit: cover;
              border-radius: 8px;
              margin-bottom: 16px;
            "
          />
        </div>

        <div class="row q-col-gutter-md q-px-md q-mb-md">
          <div class="col-6">
            <div class="section-title q-mb-xs">ข้อมูลโครงการ</div>
            <div class="info-box q-pa-sm">
              <div class="row q-mb-xs">
                <div class="col-6">
                  <div class="text-caption text-grey-7">ชื่อโครงการ TH</div>
                  <div class="text-caption text-bold">{{ round.job.projectName }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">จังหวัด</div>
                  <div class="text-caption text-bold">{{ round.job.address?.province }}</div>
                </div>
              </div>
              <div class="row q-mb-xs">
                <div class="col-6">
                  <div class="text-caption text-grey-7">เขต/อำเภอ</div>
                  <div class="text-caption text-bold">{{ round.job.address?.district }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">แขวง/ตำบล</div>
                  <div class="text-caption text-bold">{{ round.job.address?.subDistrict }}</div>
                </div>
              </div>
              <div class="row">
                <div class="col-6">
                  <div class="text-caption text-grey-7">ประเภท</div>
                  <div class="text-caption text-bold">
                    {{ round.job.houseType?.name }} {{ round.job.address?.floor }} ชั้น
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">พื้นที่</div>
                  <div class="text-caption text-bold">{{ round.job.usableArea }} ตร.ม.</div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-6">
            <div class="section-title q-mb-xs">ข้อมูลลูกค้า</div>
            <div class="info-box q-pa-sm">
              <div class="row q-mb-xs">
                <div class="col-6">
                  <div class="text-caption text-grey-7">ชื่อลูกค้า</div>
                  <div class="text-caption text-bold">{{ round.job.customer?.fullName }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">เบอร์โทรศัพท์</div>
                  <div class="text-caption text-bold">{{ round.job.customer?.phoneNumber }}</div>
                </div>
              </div>
              <div class="text-caption text-grey-7">อีเมล</div>
              <div class="text-caption text-description-header text-bold">
                {{ round.job.customer.email }}
              </div>
              <div class="row q-mt-xs">
                <div class="col-6">
                  <div class="text-caption text-grey-7">ผู้ประสานงาน</div>
                  <div class="text-caption text-bold">
                    {{ round.teamMember?.inspector?.team?.teamName || '-' }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">เบอร์ผู้ประสานงาน</div>
                  <div class="text-caption text-bold">
                    {{ round.teamMember?.inspector?.team?.contactInfo || '-' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-sm q-px-md q-mb-md">
          <div v-for="stat in summaryStats" :key="stat.label" class="col-2">
            <div class="text-center q-pa-sm stat-card">
              <div class="text-caption" style="font-size: 10px">
                {{ stat.label }}
              </div>
              <div class="text-h6 text-bold" :style="`color: ${stat.color}`">{{ stat.value }}</div>
              <div class="text-caption" style="font-size: 10px">รายการ</div>
            </div>
          </div>
        </div>

        <div class="q-px-md q-mb-md">
          <div class="row items-center justify-between q-mb-xs">
            <div class="section-title" style="margin-bottom: 0">จำนวน Defect ตามประเภทงาน</div>
            <div class="mini-legend">
              <span class="mini-legend-item"
                ><span class="mini-legend-swatch" style="background: #ef4444" />Major</span
              >
              <span class="mini-legend-item"
                ><span class="mini-legend-swatch" style="background: #fb8c00" />Minor</span
              >
            </div>
          </div>
          <div class="mini-chart">
            <div v-for="cat in categoryCounts" :key="cat.name" class="mini-bar-col">
              <div class="mini-bar-count">{{ cat.count }}</div>
              <div v-if="cat.major > 0 && cat.minor > 0" class="mini-bar-split">
                <span style="color: #ef4444">{{ cat.major }}</span>
                <span>/</span>
                <span style="color: #fb8c00">{{ cat.minor }}</span>
              </div>
              <div
                class="mini-bar-stack"
                :style="`height: ${Math.max((cat.count / maxCategoryCount) * 100, 8)}%`"
              >
                <div :style="`height: ${cat.minorPct}%; background: #fb8c00`" />
                <div :style="`height: ${cat.majorPct}%; background: #ef4444`" />
              </div>
              <div class="mini-bar-label">{{ cat.name }}</div>
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-sm q-px-md q-mb-md">
          <div class="col-6">
            <div class="section-title q-mb-xs">จำนวน Defect ตามชั้น</div>
            <div class="mini-chart">
              <div v-for="f in floorCounts" :key="f.name" class="mini-bar-col">
                <div class="mini-bar-count">{{ f.count }}</div>
                <div
                  class="mini-bar"
                  :style="`height: ${Math.max((f.count / maxFloorCount) * 100, 8)}%; background: ${barColor(f.count, maxFloorCount)}`"
                />
                <div class="mini-bar-label">{{ f.name }}</div>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="section-title q-mb-xs">สถานะการซ่อม</div>
            <div class="mini-chart donut-panel">
              <svg viewBox="0 0 42 42" width="100" height="100" class="donut-svg">
                <circle
                  v-for="seg in statusDonutSegments"
                  :key="seg.key"
                  cx="21"
                  cy="21"
                  r="15"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="8"
                  :stroke-dasharray="`${seg.dash} ${seg.gap}`"
                  :stroke-dashoffset="-seg.offset"
                  transform="rotate(-90 21 21)"
                />
              </svg>
              <div class="donut-legend">
                <div v-for="seg in statusDonutSegments" :key="seg.key" class="donut-legend-item">
                  <span class="mini-legend-swatch" :style="`background: ${seg.color}`" />
                  <span>{{ seg.label }}</span>
                  <b>{{ seg.count }}</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pdf-footer">
          <span>© 2026, POYSIAN</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>@poysian,</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>Poysian รับตรวจบ้าน ตรวจคอนโด,</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>098-765-4321,</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span>poysian@gmail.com</span>
          </div>
        </div>
      </div>

      <!-- หน้า Major Defects -->
      <div v-for="(chunk, pageIndex) in majorChunks" :key="`major-${pageIndex}`" class="pdf-page">
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ round.job.projectName }}, ครั้งที่ {{ round.roundNumber }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">หน้า | {{ pageIndex + 2 }} / {{ totalPages }}</div>
        </div>

        <div class="text-center text-bold q-py-sm" style="font-size: 16px; color: #ef4444">
          Main Defects
        </div>

        <div class="defects-grid">
          <div v-for="defect in chunk" :key="defect.defectId" class="defect-card">
            <div class="badge-id">#{{ defect.defectId }}</div>
            <div class="badge-main" style="background: #ef4444">{{ defect.severity }}</div>
            <img loading="eager" :src="defect.imageUrl ? `${apiUrl}${defect.imageUrl}` : 'https://via.placeholder.com/400x300?text=No+Image'" class="defect-img" />
            <div class="card-body">
              <div class="room-title">{{ getRoomShortName(defect) }}</div>
              <div class="info-row">
                <span class="label">ประเภทงาน:</span>
                {{ defect.subCategories?.[0]?.category?.name }}
              </div>
              <div class="info-row">
                <span class="label">รายการ:</span>
                {{ defect.subCategories?.map((s) => s.name).join(', ') }}
              </div>
              <div class="info-row">
                <span class="label">หมายเหตุ:</span> {{ defect.description }}
              </div>
              <div class="info-row">
                <span class="label">สถานะ:</span>
                {{
                  defect.status === 'pending_repair'
                    ? 'กำลังรอซ่อม'
                    : defect.status === 'rejected'
                      ? 'ซ่อมไม่ผ่าน'
                      : defect.status === 'verified'
                        ? 'ซ่อมผ่านแล้ว'
                        : defect.status
                }}
              </div>
              <img loading="eager" :src="reportLogo" class="card-logo-watermark-img" />
            </div>
          </div>
        </div>
        <div class="pdf-footer">
          <span>© 2026, POYSIAN</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>@poysian,</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>Poysian รับตรวจบ้าน ตรวจคอนโด,</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>098-765-4321,</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span>poysian@gmail.com</span>
          </div>
        </div>
      </div>

      <!-- หน้า All Defects -->
      <div v-for="(page, pageIndex) in allDefectChunks" :key="`all-${pageIndex}`" class="pdf-page">
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ round.job.projectName }}, ครั้งที่ {{ round.roundNumber }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">
            หน้า | {{ 1 + majorChunks.length + pageIndex + 1 }} / {{ totalPages }}
          </div>
        </div>

        <div class="text-center text-bold q-py-sm" style="font-size: 16px; color: #1976d2">
          Defect List
        </div>

        <div v-if="pageIndex === 0" class="sticker-legend q-mb-sm">
          <div class="text-caption text-weight-bold">คำอธิบายสีสติกเกอร์</div>
          <div class="sticker-legend-items">
            <div v-for="legend in stickerLegend" :key="legend.label" class="sticker-legend-item">
              <span class="sticker-dot" :style="`background: ${legend.color}`" />
              <div class="sticker-legend-text">
                <span class="sticker-legend-label">{{ legend.label }}</span>
                <span class="sticker-legend-description">{{ legend.description }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-for="group in page" :key="group.roomName" class="q-mb-sm">
          <div
            class="text-center text-bold q-py-xs q-mb-sm"
            style="background: #e3f2fd; border-radius: 8px; font-size: 13px"
          >
            {{ group.roomName }}
          </div>
          <div class="defects-grid">
            <div v-for="defect in group.defects" :key="defect.defectId" class="defect-card">
              <div class="badge-id">#{{ defect.defectId }}</div>
              <div
                class="badge-main"
                :style="defect.severity === 'MAJOR' ? 'background: #ef4444' : 'background: #fb8c00'"
              >
                {{ defect.severity }}
              </div>
              <img loading="eager" :src="defect.imageUrl ? `${apiUrl}${defect.imageUrl}` : 'https://via.placeholder.com/400x300?text=No+Image'" class="defect-img" />
              <div class="card-body">
                <div class="info-row">
                  <span class="label">ประเภทงาน:</span>
                  {{ defect.subCategories?.[0]?.category?.name }}
                </div>
                <div class="info-row">
                  <span class="label">รายการ:</span>
                  {{ defect.subCategories?.map((s) => s.name).join(', ') }}
                </div>
                <div class="info-row">
                  <span class="label">หมายเหตุ:</span> {{ defect.description }}
                </div>
                <div class="info-row">
                  <span class="label">สถานะ:</span>
                  {{ defect.status === 'pending_repair' ? 'กำลังรอซ่อม' : defect.status }}
                </div>
                <img loading="eager" :src="reportLogo" class="card-logo-watermark-img" />
              </div>
            </div>
          </div>
        </div>

        <!-- ลายเซ็นหน้าสุดท้าย -->
        <!-- <div v-if="pageIndex === allDefectChunks.length - 1" class="row q-mt-auto q-pb-lg">
          <div class="col-6 text-center">
            <div class="signature-line">
              <div class="text-caption">ลายเซ็นผู้ตรวจ</div>
              <div class="text-caption text-grey-7">
                {{ round.teamMember?.inspector?.team?.teamName }}
              </div>
            </div>
          </div>
          <div class="col-6 text-center">
            <div class="signature-line">
              <div class="text-caption">ลายเซ็นลูกค้า</div>
              <div class="text-caption text-grey-7">{{ round.job.customer?.fullName }}</div>
            </div>
          </div>
        </div> -->
        <div class="pdf-footer">
          <span>© 2026, POYSIAN</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>@poysian,</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>Poysian รับตรวจบ้าน ตรวจคอนโด,</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>098-765-4321,</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span>poysian@gmail.com</span>
          </div>
        </div>
      </div>
      <!-- หน้า Summary -->
      <div
        v-for="(categoryGroup, pageIndex) in summaryChunks"
        :key="`summary-${pageIndex}`"
        class="pdf-page"
      >
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ round.job.projectName }}, ครั้งที่ {{ round.roundNumber }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">
            หน้า | {{ 1 + majorChunks.length + allDefectChunks.length + pageIndex + 1 }} /
            {{ totalPages }}
          </div>
        </div>

        <div class="text-center text-bold q-py-sm" style="font-size: 16px; color: #1976d2">
          สรุปผลการตรวจ
        </div>

        <div
          v-for="categorySummary in categoryGroup"
          :key="categorySummary.category"
          class="summary-system-card"
        >
          <div class="summary-system-header">
            <div>
              <div class="summary-system-title">{{ categorySummary.category }}</div>
              <div class="summary-system-meta">
                ตรวจแล้ว {{ categorySummary.labels.length }} รายการ,
                พบ Defect {{ categorySummary.defects.length }} จุด
              </div>
            </div>
            <div class="summary-system-result">
              <div
                class="summary-result-pill"
                :style="`background: ${categorySummary.outcomeColor}`"
              >
                {{ categorySummary.outcomeLabel }}
              </div>
              <div class="summary-system-count">{{ categorySummary.defects.length }}</div>
            </div>
          </div>

          <div class="summary-system-body">
            <div class="summary-checklist">
              <div class="summary-overview">
                <div class="summary-overview-item">
                  <span class="summary-overview-label">ผลการตรวจ</span>
                  <span class="summary-overview-value">{{ categorySummary.outcomeLabel }}</span>
                </div>
                <div class="summary-overview-item">
                  <span class="summary-overview-label">รูปประกอบ</span>
                  <span class="summary-overview-value">{{ categorySummary.photoCount }} รูป</span>
                </div>
                <div class="summary-overview-item">
                  <span class="summary-overview-label">คอมเมนต์</span>
                  <span class="summary-overview-value">
                    {{ categorySummary.defectComments.length }} รายการ
                  </span>
                </div>
              </div>

              <div v-if="categorySummary.labels.length === 0" class="summary-empty-check">
                ไม่มีรายการตรวจในหมวดนี้ แต่พบ Defect ที่ถูกจัดอยู่ในระบบนี้
              </div>

              <div
                v-for="labelGroup in categorySummary.labels"
                :key="labelGroup.label"
                class="summary-check-row"
              >
                <div class="summary-check-title">{{ labelGroup.label }}</div>
                <div class="summary-option-list">
                  <span
                    v-for="item in labelGroup.items"
                    :key="item.itemId"
                    class="summary-option-chip"
                    :style="`border-color: ${getStickerMeta(item).color}; color: ${getStickerMeta(item).color}`"
                  >
                    {{ item.option?.value ?? '-' }}
                  </span>
                </div>
                <div
                  v-for="item in labelGroup.items.filter((summaryItem) => summaryItem.detailValue)"
                  :key="`detail-${item.itemId}`"
                  class="summary-comment"
                >
                  <span class="label">คอมเมนต์:</span> {{ item.detailValue }}
                </div>
              </div>

              <div v-if="categorySummary.defectComments.length" class="summary-comment-box">
                <div class="summary-comment-title">คอมเมนต์จากรูป Defect</div>
                <div
                  v-for="comment in categorySummary.defectComments.slice(0, 3)"
                  :key="comment"
                  class="summary-comment-line"
                >
                  {{ comment }}
                </div>
              </div>
            </div>

            <div class="summary-photo-grid">
              <div
                v-for="defect in categorySummary.defects.slice(0, 4)"
                :key="defect.defectId"
                class="summary-photo-card"
              >
                <img
                  loading="eager"
                  :src="
                    defect.imageUrl
                      ? resolveImageUrl(defect.imageUrl)
                      : 'https://via.placeholder.com/320x220?text=No+Image'
                  "
                  class="summary-photo"
                />
                <div
                  class="summary-sticker"
                  :style="`background: ${getStickerMeta(defect).color}`"
                >
                  {{ getStickerMeta(defect).shortLabel }}
                </div>
                <div class="summary-photo-caption">
                  <div class="text-weight-bold">{{ getRoomShortName(defect) }}</div>
                  <div>{{ defect.subCategories?.map((s) => s.name).join(', ') || '-' }}</div>
                  <div v-if="defect.description">
                    <span class="label">คอมเมนต์:</span> {{ defect.description }}
                  </div>
                </div>
              </div>
              <div v-if="categorySummary.defects.length > 4" class="summary-more-photo">
                +{{ categorySummary.defects.length - 4 }} รูปในระบบนี้
              </div>
              <div v-if="categorySummary.defects.length === 0" class="summary-empty-photo">
                ไม่มีรูป Defect ในหมวดนี้
              </div>
            </div>
          </div>
        </div>
        <div class="pdf-footer">
          <span>© 2026, POYSIAN</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>@poysian,</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>Poysian รับตรวจบ้าน ตรวจคอนโด,</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>098-765-4321,</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span>poysian@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { InspectionRound, Defect, InspectionSummaryItem } from 'src/models';
import PoysianLogo from 'src/assets/Logos/Poysian.png';
import LineLogo from 'src/assets/Logos/LINE.png';
import FacebookLogo from 'src/assets/Logos/Facebook.png';
import CallLogo from 'src/assets/Logos/Call.png';
import GmailLogo from 'src/assets/Logos/Gmail.png';
const apiUrl = import.meta.env.VITE_API_URL;

const props = defineProps<{
  round: InspectionRound;
  defects: Defect[];
  summaryItems: InspectionSummaryItem[];
}>();

interface SummaryLabelGroup {
  label: string;
  items: InspectionSummaryItem[];
}

interface SummaryCategoryGroup {
  category: string;
  labels: SummaryLabelGroup[];
  defects: Defect[];
  outcomeLabel: string;
  outcomeColor: string;
  defectComments: string[];
  photoCount: number;
}

interface StickerMeta {
  label: string;
  shortLabel: string;
  color: string;
  description: string;
}

const stickerLegend: StickerMeta[] = [
  {
    label: 'รอยร้าว',
    shortLabel: 'ร้าว',
    color: '#ef4444',
    description: 'จุดที่พบการแตกร้าวหรือรอยแยก',
  },
  {
    label: 'ผิวไม่เรียบ',
    shortLabel: 'ผิว',
    color: '#1976d2',
    description: 'พื้นผิวไม่เรียบ นูน ยุบ หรือขรุขระ',
  },
  {
    label: 'คราบ/รั่วซึม',
    shortLabel: 'ซึม',
    color: '#16a34a',
    description: 'มีคราบน้ำ ความชื้น หรือร่องรอยรั่วซึม',
  },
  {
    label: 'งานเก็บรายละเอียด',
    shortLabel: 'เก็บ',
    color: '#f59e0b',
    description: 'งานสี รอยต่อ ยาแนว ช่องว่าง หรือรายละเอียดที่ต้องเก็บเพิ่ม',
  },
  {
    label: 'อื่นๆ',
    shortLabel: 'อื่น',
    color: '#64748b',
    description: 'รายการอื่นที่ไม่เข้ากลุ่มหลัก',
  },
];
const reportLogo = computed(() => {
  const logoUrl = props.round.job.branch?.logoUrl;
  if (!logoUrl) return PoysianLogo;
  return logoUrl.startsWith('http') ? logoUrl : `${apiUrl}${logoUrl}`;
});

const pageScale = ref(1);
onMounted(() => {
  const pageWidthPx = 794; // 210mm ≈ 794px
  const screenWidth = window.innerWidth - 32;
  pageScale.value = Math.min(1, screenWidth / pageWidthPx);
});

const reportRef = ref<HTMLElement | null>(null);

const summaryStats = computed(() => [
  { label: 'Total Defects', value: props.defects.length, color: '#1976d2' },
  {
    label: 'Major',
    value: props.defects.filter((d) => d.severity === 'Major').length,
    color: '#ef4444',
  },
  {
    label: 'Minor',
    value: props.defects.filter((d) => d.severity === 'Minor').length,
    color: '#fb8c00',
  },
  {
    label: 'กำลังรอซ่อม',
    value: props.defects.filter((d) => d.status === 'pending_repair').length,
    color: '#fb8c00',
  },
  {
    label: 'ซ่อมไม่ผ่าน',
    value: props.defects.filter((d) => d.status === 'rejected').length,
    color: '#ef4444',
  },
  {
    label: 'ซ่อมผ่านแล้ว',
    value: props.defects.filter((d) => d.status === 'verified').length,
    color: '#4CAF50',
  },
]);

const categoryCounts = computed(() => {
  const counts = new Map<string, { major: number; minor: number }>();
  props.defects.forEach((d) => {
    const name = d.subCategories?.[0]?.category?.name ?? 'ไม่ระบุประเภท';
    const entry = counts.get(name) ?? { major: 0, minor: 0 };
    if (d.severity === 'Major') entry.major += 1;
    else entry.minor += 1;
    counts.set(name, entry);
  });
  return [...counts.entries()]
    .map(([name, { major, minor }]) => {
      const count = major + minor;
      return {
        name,
        count,
        major,
        minor,
        majorPct: count > 0 ? (major / count) * 100 : 0,
        minorPct: count > 0 ? (minor / count) * 100 : 0,
      };
    })
    .sort((a, b) => b.count - a.count);
});

const maxCategoryCount = computed(() => Math.max(1, ...categoryCounts.value.map((c) => c.count)));

const CHART_GRADIENT = ['#0b3d68', '#1462a8', '#1976d2', '#5b9de0', '#a9cdec'];

function barColor(count: number, max: number) {
  const ratio = max > 0 ? count / max : 0;
  const pos = (1 - ratio) * (CHART_GRADIENT.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return CHART_GRADIENT[lo];
  const mix = pos - lo;
  const c1 = CHART_GRADIENT[lo]!.match(/\w\w/g)!.map((x) => parseInt(x, 16));
  const c2 = CHART_GRADIENT[hi]!.match(/\w\w/g)!.map((x) => parseInt(x, 16));
  const c = c1.map((v, idx) => Math.round(v + (c2[idx]! - v) * mix));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

const floorCounts = computed(() => {
  const byFloor = new Map<string, { count: number; order: number }>();
  props.defects.forEach((d) => {
    const name = d.floor?.label ?? 'ไม่ระบุชั้น';
    const order = d.floor?.floorOrder ?? Number.MAX_SAFE_INTEGER;
    const existing = byFloor.get(name);
    byFloor.set(name, { count: (existing?.count ?? 0) + 1, order });
  });
  return [...byFloor.entries()]
    .map(([name, { count, order }]) => ({ name, count, order }))
    .sort((a, b) => a.order - b.order);
});

const maxFloorCount = computed(() => Math.max(1, ...floorCounts.value.map((f) => f.count)));

const STATUS_META: { key: string; label: string; color: string }[] = [
  { key: 'pending_repair', label: 'กำลังรอซ่อม', color: '#fb8c00' },
  { key: 'repaired', label: 'ซ่อมแล้ว', color: '#1976d2' },
  { key: 'rejected', label: 'ซ่อมไม่ผ่าน', color: '#ef4444' },
  { key: 'verified', label: 'ซ่อมผ่านแล้ว', color: '#4CAF50' },
];

const statusDonutSegments = computed(() => {
  const circumference = 2 * Math.PI * 15;
  const total = props.defects.length;
  let offset = 0;
  return STATUS_META.map((meta) => {
    const count = props.defects.filter((d) => d.status === meta.key).length;
    const dash = total > 0 ? (count / total) * circumference : 0;
    const seg = { ...meta, count, dash, gap: circumference - dash, offset };
    offset += dash;
    return seg;
  }).filter((seg) => seg.count > 0);
});

const majorDefects = computed(() => props.defects.filter((d) => d.severity === 'Major'));

const majorChunks = computed(() => {
  const chunks: Defect[][] = [];
  for (let i = 0; i < majorDefects.value.length; i += 6) {
    chunks.push(majorDefects.value.slice(i, i + 6));
  }
  return chunks;
});

const allDefectGroups = computed(() => {
  const groups: Record<string, Defect[]> = {};
  props.defects.forEach((defect) => {
    const key = `${defect.room?.roomName ?? '-'}, ${defect.subRoom?.roomName ?? '-'}, ${defect.floor?.label}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(defect);
  });
  return groups;
});

const orderedDefectGroups = computed(() => {
  return Object.entries(allDefectGroups.value).sort(([, defectsA], [, defectsB]) => {
    const orderA = defectsA[0]?.floor?.floorOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = defectsB[0]?.floor?.floorOrder ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
});

const allDefectChunks = computed(() => {
  const pages: { roomName: string; defects: Defect[] }[][] = [];

  orderedDefectGroups.value.forEach(([roomName, defects]) => {
    for (let i = 0; i < defects.length; i += 6) {
      const chunk = defects.slice(i, i + 6);
      pages.push([{ roomName, defects: chunk }]);
    }
  });

  return pages;
});

// const totalPages = computed(() => 1 + majorChunks.value.length + allDefectChunks.value.length);
const totalPages = computed(
  () => 1 + majorChunks.value.length + allDefectChunks.value.length + summaryChunks.value.length,
);

function getRoomShortName(defect: Defect) {
  return `${defect.room?.roomName ?? '-'}, ${defect.subRoom?.roomName ?? '-'}, ${defect.floor?.label ?? '-'}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function exportPdf() {
  if (!reportRef.value) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const allStyles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((r) => r.cssText)
          .join('');
      } catch {
        return '';
      }
    })
    .join('');

  const html = `
    <html>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;700&display=swap">
        <style>
          ${allStyles}
          /* --- เพิ่มจุดที่ 1: บังคับให้พิมพ์สีพื้นหลัง (แก้ปัญหาสีหาย) --- */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body { margin: 0; padding: 0; font-family: 'Sarabun', sans-serif !important; background: #ccc; }
          .pdf-wrapper { background: #ccc; padding: 0; }

          /* --- เพิ่มจุดที่ 2: แก้ไขความสูงหน้ากระดาษ (แก้ปัญหาหน้ายาวว่างเปล่า) --- */
          .pdf-page {
            width: 210mm;
            min-height: 297mm; /* ใช้ min-height เพื่อให้หดได้ถ้าเนื้อหาน้อย */
            padding: 10mm;
            margin: 10mm auto;
            background: white;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            page-break-after: always;
            position: relative;
          }

          @media print {
            body { background: none; }
            .pdf-page {
              margin: 0;
              box-shadow: none;
              height: 297mm; /* ตอนพิมพ์จริงค่อยล็อคให้เต็มหน้า A4 */
            }
            @page { size: A4; margin: 0; }
          }
          /* -------------------------------------------------- */

          .defects-grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); gap: 10px; flex: 1; }
          .defect-card { display: flex; flex-direction: column; border: 1px solid #f48fb1; border-radius: 8px; background: #fff5f7; position: relative; overflow: hidden; height: 100mm; }
          .defect-img { width: 100%; height: 55mm; object-fit: cover; }
          .badge-id { position: absolute; top: 5px; left: 5px; background: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; border: 1px solid #ddd; z-index: 10; }
          .badge-main { position: absolute; top: 5px; right: 5px; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; z-index: 10; }
          .card-body { padding: 8px; font-size: 11px; position: relative; flex: 1; overflow: visible; }
          .room-title { font-weight: bold; text-align: center; margin-bottom: 5px; border-bottom: 1px solid #fecaca; }
          .header-line { border-bottom: 1px solid #ccc; margin-bottom: 8px; }
          .section-title { border-left: 4px solid #1976d2; padding-left: 8px; font-weight: bold; font-size: 12px; }
          .info-box { border: 1px solid #e0e0e0; border-radius: 4px; background: #fafafa; min-height: 85px; padding: 8px; }
          .label { font-weight: bold; }
          .info-row { margin-bottom: 2px; font-size: 10px; }
          .card-logo-watermark-img { position: absolute; bottom: 0px; right: 10px; opacity: 0.3; width: 60px; object-fit: contain; }
          .pdf-footer { border-top: 1px solid #ccc; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #555; margin-top: auto; }
          .footer-contacts { display: flex; align-items: center; gap: 6px; font-size: 10px; }
          .sticker-legend { border: 1px solid #d8e1ea; border-radius: 6px; background: #f8fafc; padding: 8px 10px; }
          .sticker-legend-items { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 12px; margin-top: 5px; }
          .sticker-legend-item { display: grid; grid-template-columns: 10px minmax(0, 1fr); align-items: start; gap: 5px; min-width: 0; font-size: 9px; color: #334155; line-height: 1.3; }
          .sticker-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; margin-top: 2px; }
          .sticker-legend-text { min-width: 0; }
          .sticker-legend-label { font-weight: 700; color: #1f2937; white-space: nowrap; margin-right: 3px; }
          .sticker-legend-description { color: #475569; overflow-wrap: anywhere; }
          .summary-system-result { display: flex; align-items: center; gap: 8px; }
          .summary-result-pill { color: white; border-radius: 999px; padding: 2px 8px; font-size: 9px; font-weight: 700; white-space: nowrap; }
          .summary-overview { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; margin-bottom: 7px; }
          .summary-overview-item { border: 1px solid #e2e8f0; border-radius: 5px; background: #f8fafc; padding: 5px; min-width: 0; }
          .summary-overview-label { display: block; color: #64748b; font-size: 8px; line-height: 1.2; }
          .summary-overview-value { display: block; color: #1f2937; font-size: 9px; font-weight: 700; line-height: 1.25; overflow-wrap: anywhere; }
          .summary-empty-check { border: 1px dashed #cbd5e1; border-radius: 5px; color: #64748b; background: #f8fafc; padding: 7px; font-size: 9px; line-height: 1.35; }
          .summary-comment-box { border-left: 3px solid #1976d2; background: #f8fafc; padding: 6px 8px; margin-top: 2px; }
          .summary-comment-title { color: #0f4c81; font-size: 9px; font-weight: 700; margin-bottom: 3px; }
          .summary-comment-line { color: #475569; font-size: 8.5px; line-height: 1.35; margin-top: 2px; overflow-wrap: anywhere; }
          .summary-more-photo { min-height: 108px; border: 1px dashed #cbd5e1; border-radius: 5px; color: #475569; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; text-align: center; padding: 8px; }
        </style>
      </head>
      <body>
        ${reportRef.value.innerHTML}
      </body>
    </html>`;

  const script =
    '<script>window.onload = () => { setTimeout(() => window.print(), 1000); }</s' + 'cript>';
  const finalHtml = html.replace('</body>', script + '</body>');

  printWindow.document.open();
  printWindow.document.write(finalHtml);
  printWindow.document.close();
}

defineExpose({ exportPdf });

function normalizeText(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function getDefectCategoryNames(defect: Defect) {
  const categoryNames = [
    ...new Set(
      (defect.subCategories ?? [])
        .map((subCategory) => subCategory.category?.name)
        .filter((name): name is string => !!name),
    ),
  ];
  return categoryNames.length ? categoryNames : ['ไม่ระบุระบบ'];
}

function resolveImageUrl(imageUrl: string) {
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }
  return `${apiUrl}${imageUrl}`;
}

function getStickerMeta(source: InspectionSummaryItem | Defect): StickerMeta {
  const text =
    'option' in source
      ? `${source.option?.value ?? ''} ${source.detailValue ?? ''}`
      : `${source.description ?? ''} ${source.subCategories?.map((sub) => sub.name).join(' ') ?? ''}`;
  const normalized = normalizeText(text);

  if (['ร้าว', 'แตกร้าว', 'crack'].some((keyword) => normalized.includes(keyword))) {
    return stickerLegend[0]!;
  }
  if (['ผิว', 'ไม่เรียบ', 'ขรุขระ', 'ปูด', 'นูน', 'ยุบ'].some((keyword) => normalized.includes(keyword))) {
    return stickerLegend[1]!;
  }
  if (['คราบ', 'เปื้อน', 'ซึม', 'รั่ว', 'ชื้น', 'leak'].some((keyword) => normalized.includes(keyword))) {
    return stickerLegend[2]!;
  }
  if (['เก็บ', 'รอยต่อ', 'ช่อง', 'ยาแนว', 'ห่าง', 'สี'].some((keyword) => normalized.includes(keyword))) {
    return stickerLegend[3]!;
  }
  return stickerLegend[4]!;
}

const summaryGroups = computed<SummaryCategoryGroup[]>(() => {
  const groups = new Map<string, Map<string, InspectionSummaryItem[]>>();

  props.summaryItems.forEach((item) => {
    const category = item.template.category;
    const label = item.template.label;
    if (!groups.has(category)) groups.set(category, new Map());
    const labelMap = groups.get(category)!;
    if (!labelMap.has(label)) labelMap.set(label, []);
    labelMap.get(label)!.push(item);
  });

  props.defects.forEach((defect) => {
    getDefectCategoryNames(defect).forEach((category) => {
      if (!groups.has(category)) groups.set(category, new Map());
    });
  });

  return [...groups.entries()].map(([category, labelMap]) => {
    const defects = props.defects.filter((defect) =>
      getDefectCategoryNames(defect).some((defectCategory) => defectCategory === category),
    );
    const defectComments = defects
      .map((defect) => defect.description?.trim())
      .filter((description): description is string => !!description);
    const majorCount = defects.filter((defect) => defect.severity === 'Major').length;
    const outcomeLabel =
      defects.length === 0 ? 'ผ่าน' : majorCount > 0 ? `พบ Major ${majorCount} จุด` : 'พบ Minor';

    return {
      category,
      labels: [...labelMap.entries()].map(([label, items]) => ({ label, items })),
      defects,
      outcomeLabel,
      outcomeColor: defects.length === 0 ? '#16a34a' : majorCount > 0 ? '#ef4444' : '#f59e0b',
      defectComments,
      photoCount: defects.filter((defect) => defect.imageUrl).length,
    };
  });
});

const summaryChunks = computed(() => {
  const chunks: SummaryCategoryGroup[][] = [];
  for (let i = 0; i < summaryGroups.value.length; i += 2) {
    chunks.push(summaryGroups.value.slice(i, i + 2));
  }
  return chunks;
});
</script>

<style scoped>
.pdf-wrapper {
  background: #eee;
  padding: 20px 0;
  transform-origin: top left;
}
.pdf-page {
  width: 210mm;
  height: 297mm;
  background: white;
  margin: 0 auto 20px auto;
  padding: 10mm;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.header-line {
  border-bottom: 1px solid #ccc;
  margin-bottom: 8px;
}
.section-title {
  border-left: 4px solid #1976d2;
  padding-left: 8px;
  font-weight: bold;
  font-size: 12px;
}
.info-box {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fafafa;
  min-height: 85px;
}
.stat-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
.mini-chart {
  height: 150px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  border: 1px solid #e2e6ea;
  border-radius: 4px;
  background: #fafbfc;
  padding: 10px 6px 6px;
}
.mini-bar-col {
  flex: 1;
  min-width: 0;
  max-width: 34px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}
.mini-bar-count {
  font-size: 9px;
  font-weight: bold;
  color: #212121;
  margin-bottom: 3px;
  font-variant-numeric: tabular-nums;
}
.mini-bar-split {
  font-size: 6px;
  font-weight: bold;
  margin-bottom: 3px;
  font-variant-numeric: tabular-nums;
  display: flex;
  gap: 2px;
  color: #9e9e9e;
}
.mini-bar {
  width: 100%;
  max-width: 20px;
  border-radius: 2px 2px 0 0;
}
.mini-bar-label {
  margin-top: 4px;
  font-size: 7.5px;
  line-height: 1.15;
  text-align: center;
  color: #45505b;
  word-break: break-word;
  max-height: 24px;
  overflow: hidden;
}
.mini-bar-stack {
  width: 100%;
  max-width: 20px;
  display: flex;
  flex-direction: column-reverse;
  border-radius: 2px 2px 0 0;
  overflow: hidden;
}
.mini-legend {
  display: flex;
  gap: 10px;
}
.mini-legend-item {
  display: flex;
  align-items: center;
  font-size: 8px;
  color: #45505b;
}
.mini-legend-swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
  margin-right: 3px;
}
.donut-panel {
  align-items: center;
  justify-content: center;
  gap: 20px;
}
.donut-svg {
  flex-shrink: 0;
}
.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.donut-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9.5px;
  color: #45505b;
}
.donut-legend-item b {
  color: #212121;
  font-variant-numeric: tabular-nums;
  margin-left: 2px;
}
.defects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 10px;
  flex: 1;
}
.defect-card {
  display: flex;
  flex-direction: column;
  border: 1px solid #f48fb1;
  border-radius: 8px;
  background: #fff5f7;
  position: relative;
  overflow: hidden;
  height: 100mm; /* ลดลงมา */
}
.defect-img {
  width: 100%;
  height: 55mm; /* ลดลงตาม */
  object-fit: cover;
}
.badge-id {
  position: absolute;
  top: 6px;
  left: 6px;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  border: 1px solid #ddd;
  z-index: 10;
}
.badge-main {
  position: absolute;
  top: 6px;
  right: 6px;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  z-index: 10;
}
.card-body {
  padding: 8px;
  font-size: 11px;
  position: relative;
  flex: 1;
  overflow: visible;
}
.room-title {
  font-weight: bold;
  text-align: center;
  margin-bottom: 5px;
  border-bottom: 1px solid #fecaca;
}
.signature-line {
  border-top: 1px solid #000;
  margin: 0 40px;
  padding-top: 4px;
}
.card-logo-watermark {
  position: absolute;
  bottom: 5px;
  right: 8px;
  opacity: 0.2;
  font-weight: bold;
  font-size: 14px;
  color: #1976d2;
}
.info-row {
  margin-bottom: 2px;
  font-size: 10px;
}
.label {
  font-weight: bold;
}
.text-description-header {
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-logo-watermark-img {
  position: absolute;
  bottom: 0px;
  right: 10px;
  opacity: 0.3;
  width: 60px;
  object-fit: contain;
}

.pdf-footer {
  border-top: 1px solid #ccc;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: #555;
  margin-top: auto;
}

.footer-contacts {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
}

.sticker-legend {
  border: 1px solid #d8e1ea;
  border-radius: 6px;
  background: #f8fafc;
  padding: 8px 10px;
}

.sticker-legend-items {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
  margin-top: 5px;
}

.sticker-legend-item {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr);
  align-items: start;
  gap: 5px;
  min-width: 0;
  font-size: 9px;
  color: #334155;
  line-height: 1.3;
}

.sticker-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
  margin-top: 2px;
}

.sticker-legend-text {
  min-width: 0;
}

.sticker-legend-label {
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  margin-right: 3px;
}

.sticker-legend-description {
  color: #475569;
  overflow-wrap: anywhere;
}

.summary-system-card {
  border: 1px solid #d7e0ea;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 10px;
  background: #fff;
}

.summary-system-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eef6ff;
  border-bottom: 1px solid #d7e0ea;
  padding: 8px 10px;
}

.summary-system-result {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-result-pill {
  color: white;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
}

.summary-system-title {
  color: #0f4c81;
  font-weight: 700;
  font-size: 13px;
}

.summary-system-meta {
  color: #64748b;
  font-size: 9.5px;
  margin-top: 2px;
}

.summary-system-count {
  min-width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1976d2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.summary-system-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 10px;
  padding: 10px;
}

.summary-checklist {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.summary-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
  margin-bottom: 7px;
}

.summary-overview-item {
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  background: #f8fafc;
  padding: 5px;
  min-width: 0;
}

.summary-overview-label {
  display: block;
  color: #64748b;
  font-size: 8px;
  line-height: 1.2;
}

.summary-overview-value {
  display: block;
  color: #1f2937;
  font-size: 9px;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.summary-empty-check {
  border: 1px dashed #cbd5e1;
  border-radius: 5px;
  color: #64748b;
  background: #f8fafc;
  padding: 7px;
  font-size: 9px;
  line-height: 1.35;
}

.summary-check-row {
  border-bottom: 1px solid #eef2f6;
  padding-bottom: 6px;
}

.summary-check-title {
  font-size: 10.5px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.25;
}

.summary-option-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.summary-option-chip {
  border: 1px solid;
  border-radius: 999px;
  padding: 1px 6px;
  font-size: 9px;
  line-height: 1.4;
  background: #fff;
}

.summary-comment {
  color: #475569;
  font-size: 9.5px;
  line-height: 1.35;
  margin-top: 3px;
}

.summary-comment-box {
  border-left: 3px solid #1976d2;
  background: #f8fafc;
  padding: 6px 8px;
  margin-top: 2px;
}

.summary-comment-title {
  color: #0f4c81;
  font-size: 9px;
  font-weight: 700;
  margin-bottom: 3px;
}

.summary-comment-line {
  color: #475569;
  font-size: 8.5px;
  line-height: 1.35;
  margin-top: 2px;
  overflow-wrap: anywhere;
}

.summary-photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
}

.summary-photo-card {
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  overflow: hidden;
  min-height: 108px;
  position: relative;
  background: #f8fafc;
}

.summary-photo {
  width: 100%;
  height: 58px;
  object-fit: cover;
  display: block;
}

.summary-sticker {
  position: absolute;
  top: 5px;
  right: 5px;
  color: white;
  border-radius: 999px;
  padding: 1px 6px;
  font-size: 8px;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.25);
}

.summary-photo-caption {
  padding: 5px 6px;
  font-size: 8.5px;
  line-height: 1.25;
  color: #334155;
}

.summary-empty-photo {
  grid-column: 1 / -1;
  min-height: 96px;
  border: 1px dashed #cbd5e1;
  border-radius: 5px;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  background: #f8fafc;
}

.summary-more-photo {
  min-height: 108px;
  border: 1px dashed #cbd5e1;
  border-radius: 5px;
  color: #475569;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  padding: 8px;
}

.page-content {
  flex: 1;
}
</style>
