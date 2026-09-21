<template>
  <div style="overflow: hidden; width: 100%">
    <div v-if="checkFreshness && isReportStale" class="row items-center q-pa-sm q-mb-sm freshness-banner">
      <q-icon name="autorenew" color="warning" size="18px" class="q-mr-sm" />
      <div class="text-caption text-grey-8">
        {{ t('reports.defect.freshnessBanner') }}
      </div>
    </div>
    <div
      ref="reportRef"
      class="pdf-wrapper"
      :style="`transform: scale(${pageScale}); transform-origin: top left; width: 794px;`"
    >
      <!-- หน้า 1: ข้อมูล -->
      <div class="pdf-page">
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ pickLocalized(round.job.projectName, round.job.projectNameEn) }}, {{ t('reports.defect.roundOf', { n: round.roundNumber }) }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">{{ t('reports.defect.page') }} | 1 / {{ totalPages }}</div>
        </div>
        <div v-if="generatedAtLabel" class="row justify-end q-px-md">
          <div class="text-caption text-grey-6" style="font-size: 9px">
            {{ t('reports.defect.asOf', { date: generatedAtLabel }) }}
          </div>
        </div>

        <div class="row justify-center q-py-sm">
          <img loading="eager" :src="reportLogo" style="height: 100px; object-fit: contain" />
        </div>

        <div class="row justify-center q-mb-sm">
          <img
            loading="eager"
            :src="
              resolveImageUrl(
                round.job.projectImageUrl,
                'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600',
              )
            "
            style="width: 95%; max-height: 150px; object-fit: cover; border-radius: 8px"
          />
        </div>

        <div class="row q-col-gutter-md q-px-md q-mb-sm">
          <div class="col-6">
            <div class="section-title q-mb-xs">{{ t('reports.defect.projectInfo') }}</div>
            <div class="info-box q-pa-sm">
              <div class="row q-mb-xs">
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ t('reports.defect.projectNameTh') }}</div>
                  <div class="text-caption text-bold">{{ round.job.projectName }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ t('reports.defect.projectNameEnLabel') }}</div>
                  <div class="text-caption text-bold">{{ round.job.projectNameEn }}</div>
                </div>
              </div>
              <div class="q-mb-xs">
                <div class="text-caption text-grey-7">{{ t('reports.defect.location') }}</div>
                <div class="text-caption text-bold">{{ addressLocation }}</div>
              </div>
              <div class="row">
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ t('reports.defect.type') }}</div>
                  <div class="text-caption text-bold">
                    {{ pickLocalized(round.job.houseType?.name, round.job.houseType?.nameEn) }} {{ round.job.address?.floor }} {{ t('reports.defect.floorSuffix') }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ t('reports.defect.area') }}</div>
                  <div class="text-caption text-bold">{{ round.job.usableArea }} {{ t('reports.defect.areaUnit') }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-6">
            <div class="section-title q-mb-xs">{{ t('reports.defect.customerInfo') }}</div>
            <div class="info-box q-pa-sm">
              <div class="row q-mb-xs">
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ t('reports.defect.customerName') }}</div>
                  <div class="text-caption text-bold">{{ round.job.customer?.fullName }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ t('reports.defect.phoneNumber') }}</div>
                  <div class="text-caption text-bold">{{ round.job.customer?.phoneNumber }}</div>
                </div>
              </div>
              <div class="text-caption text-grey-7">{{ t('reports.defect.email') }}</div>
              <div class="text-caption text-description-header text-bold">
                {{ round.job.customer.email }}
              </div>
              <div class="row q-mt-xs">
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ t('reports.defect.coordinator') }}</div>
                  <div class="text-caption text-bold">
                    {{ round.job.createdBy?.fullName || '-' }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ t('reports.defect.coordinatorPhone') }}</div>
                  <div class="text-caption text-bold">
                    {{ round.job.createdBy?.phoneNumber || '-' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-sm q-px-md q-mb-sm">
          <div v-for="stat in summaryStats" :key="stat.label" class="col-2">
            <div class="text-center q-pa-sm stat-card">
              <div class="text-caption" style="font-size: 10px">
                {{ stat.label }}
              </div>
              <div class="text-h6 text-bold" :style="`color: ${stat.color}`">{{ stat.value }}</div>
              <div class="text-caption" style="font-size: 10px">{{ t('reports.defect.itemsSuffix') }}</div>
            </div>
          </div>
        </div>

        <div class="q-px-md q-mb-sm">
          <div class="row items-center justify-between q-mb-xs">
            <div class="section-title" style="margin-bottom: 0">{{ t('reports.defect.defectsByCategory') }}</div>
            <div class="mini-legend">
              <span class="mini-legend-item"
                ><span class="mini-legend-swatch" style="background: #ef4444" />Major</span
              >
              <span class="mini-legend-item"
                ><span class="mini-legend-swatch" style="background: #fb8c00" />Minor</span
              >
              <span class="mini-legend-item"
                ><span class="mini-legend-swatch" style="background: #1976d2" />{{ t('reports.defect.total') }}</span
              >
            </div>
          </div>
          <div class="category-table">
            <div
              v-for="row in categoryTableRows"
              :key="row.name"
              class="category-table-row"
              :class="{ 'category-table-row-other': row.isOther }"
            >
              <span class="category-table-rank">{{ row.rank }}</span>
              <span class="category-table-name">{{ row.name }}</span>
              <span class="category-table-count" style="color: #ef4444">{{ row.major }}</span>
              <span class="category-table-count" style="color: #fb8c00">{{ row.minor }}</span>
              <span class="category-table-total">{{ row.count }}</span>
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-sm q-px-md q-mb-sm">
          <div class="col-6">
            <div class="section-title q-mb-xs">{{ t('reports.defect.defectsByFloor') }}</div>
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
            <div class="section-title q-mb-xs">{{ t('reports.defect.repairStatus') }}</div>
            <div class="mini-chart donut-panel">
              <svg viewBox="0 0 42 42" width="80" height="80" class="donut-svg">
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
          <span>© 2026, {{ branch?.branchName }}</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>{{ branch?.line }},</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>{{ branch?.facebook }},</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>{{ branch?.phoneNumber }},</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span> {{ branch?.mailAddress }} </span>
          </div>
        </div>
      </div>

      <!-- หน้า 2: สารบัญ + คำอธิบายสีสติกเกอร์ที่ติดหน้างาน -->
      <div :id="reportPageId(TOC_PAGE)" class="pdf-page">
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ pickLocalized(round.job.projectName, round.job.projectNameEn) }}, {{ t('reports.defect.roundOf', { n: round.roundNumber }) }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">{{ t('reports.defect.page') }} | {{ TOC_PAGE }} / {{ totalPages }}</div>
        </div>

        <div class="text-center text-bold q-py-sm" style="font-size: 16px; color: #1976d2">
          {{ t('reports.defect.tocTitle') }}
        </div>

        <div class="toc q-mx-md">
          <div v-for="entry in tocEntries" :key="entry.key" class="toc-entry">
            <a
              class="toc-row toc-row--section"
              :href="`#${reportPageId(entry.page)}`"
              @click.prevent="scrollToReportPage(entry.page)"
            >
              <span class="toc-label">{{ entry.label }}</span>
              <span class="toc-leader" />
              <span class="toc-page">{{ entry.page }}</span>
            </a>
            <a
              v-for="child in entry.children"
              :key="child.key"
              class="toc-row toc-row--child"
              :href="`#${reportPageId(child.page)}`"
              @click.prevent="scrollToReportPage(child.page)"
            >
              <span class="toc-label">{{ child.label }}</span>
              <span class="toc-leader" />
              <span class="toc-page">{{ child.page }}</span>
            </a>
          </div>
        </div>

        <div class="sticker-legend q-mx-md q-mt-lg">
          <div class="text-caption text-weight-bold">{{ t('reports.defect.stickerLegendTitle') }}</div>
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

        <div class="pdf-footer">
          <span>© 2026, {{ branch?.branchName }}</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>{{ branch?.line }},</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>{{ branch?.facebook }},</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>{{ branch?.phoneNumber }},</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span> {{ branch?.mailAddress }} </span>
          </div>
        </div>
      </div>

      <!-- หน้า Major Defects -->
      <div
        v-for="(chunk, pageIndex) in majorChunks"
        :id="reportPageId(pageStarts.major + pageIndex)"
        :key="`major-${pageIndex}`"
        class="pdf-page"
      >
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ pickLocalized(round.job.projectName, round.job.projectNameEn) }}, {{ t('reports.defect.roundOf', { n: round.roundNumber }) }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">{{ t('reports.defect.page') }} | {{ pageStarts.major + pageIndex }} / {{ totalPages }}</div>
        </div>

        <div class="text-center text-bold q-py-sm" style="font-size: 16px; color: #ef4444">
          {{ t('reports.defect.mainDefectsTitle') }}
        </div>

        <div class="defects-grid">
          <div v-for="defect in chunk" :key="defect.defectId" class="defect-card">
            <div class="badge-id">#{{ defect.defectId }}</div>
            <div class="badge-main" style="background: #ef4444">{{ defect.severity }}</div>
            <img loading="eager" :src="resolveImageUrl(defect.imageUrl, 'https://via.placeholder.com/400x300?text=No+Image', 600)" class="defect-img" />
            <div class="card-body">
              <div class="room-title">{{ getRoomShortName(defect) }}</div>
              <div class="info-grid">
                <span class="label">{{ t('reports.defect.jobTypeLabel') }}</span>
                <span>{{ localizedName(defect.subCategories?.[0]?.category) }}</span>
                <span class="label">{{ t('reports.defect.itemsLabel') }}</span>
                <span>{{ defect.subCategories?.map((s) => localizedName(s)).join(', ') }}</span>
                <span class="label">{{ t('reports.defect.noteLabel') }}</span>
                <span>{{ defect.description }}</span>
                <span class="label">{{ t('reports.defect.statusLabel') }}</span>
                <span>
                  {{
                    defect.status === 'pending_repair'
                      ? t('reports.defect.statusPendingRepair')
                      : defect.status === 'rejected'
                        ? t('reports.defect.statusRejected')
                        : defect.status === 'verified'
                          ? t('reports.defect.statusVerified')
                          : defect.status
                  }}
                </span>
              </div>
              <img loading="eager" :src="reportLogo" class="card-logo-watermark-img" />
            </div>
          </div>
        </div>
        <div class="pdf-footer">
          <span>© 2026, {{ branch?.branchName }}</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>{{ branch?.line }},</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>{{ branch?.facebook }},</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>{{ branch?.phoneNumber }},</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span> {{ branch?.mailAddress }} </span>
          </div>
        </div>
      </div>

      <!-- หน้า All Defects -->
      <div
        v-for="(page, pageIndex) in allDefectChunks"
        :id="reportPageId(pageStarts.defectList + pageIndex)"
        :key="`all-${pageIndex}`"
        class="pdf-page"
      >
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ pickLocalized(round.job.projectName, round.job.projectNameEn) }}, {{ t('reports.defect.roundOf', { n: round.roundNumber }) }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">
            {{ t('reports.defect.page') }} | {{ pageStarts.defectList + pageIndex }} / {{ totalPages }}
          </div>
        </div>

        <div class="text-center text-bold q-py-sm" style="font-size: 16px; color: #1976d2">
          {{ t('reports.defect.defectListTitle') }}
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
                :style="defect.severity === 'Major' ? 'background: #ef4444' : 'background: #fb8c00'"
              >
                {{ defect.severity }}
              </div>
              <img loading="eager" :src="resolveImageUrl(defect.imageUrl, 'https://via.placeholder.com/400x300?text=No+Image', 600)" class="defect-img" />
              <div class="card-body">
                <div class="info-grid">
                  <span class="label">{{ t('reports.defect.jobTypeLabel') }}</span>
                  <span>{{ localizedName(defect.subCategories?.[0]?.category) }}</span>
                  <span class="label">{{ t('reports.defect.itemsLabel') }}</span>
                  <span>{{ defect.subCategories?.map((s) => localizedName(s)).join(', ') }}</span>
                  <span class="label">{{ t('reports.defect.noteLabel') }}</span>
                  <span>{{ defect.description }}</span>
                  <span class="label">{{ t('reports.defect.statusLabel') }}</span>
                  <span>{{ defect.status === 'pending_repair' ? t('reports.defect.statusPendingRepair') : defect.status }}</span>
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
          <span>© 2026, {{ branch?.branchName }}</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>{{ branch?.line }},</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>{{ branch?.facebook }},</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>{{ branch?.phoneNumber }},</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span> {{ branch?.mailAddress }} </span>
          </div>
        </div>
      </div>
      <!-- หน้า Summary -->
      <div
        v-for="(sections, pageIndex) in summaryPages"
        :id="reportPageId(pageStarts.summary + pageIndex)"
        :key="`summary-${pageIndex}`"
        class="pdf-page"
      >
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ pickLocalized(round.job.projectName, round.job.projectNameEn) }}, {{ t('reports.defect.roundOf', { n: round.roundNumber }) }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">
            {{ t('reports.defect.page') }} | {{ pageStarts.summary + pageIndex }} /
            {{ totalPages }}
          </div>
        </div>

        <div class="text-center text-bold q-py-sm" style="font-size: 16px; color: #1976d2">
          {{ t('reports.defect.summaryTitle') }}
        </div>

        <div
          v-for="section in sections"
          :key="`${section.category.category}-${section.isContinuation}`"
          class="summary-section"
        >
          <div class="summary-section-header">
            <div class="summary-section-title">
              {{ pickLocalized(section.category.category, section.category.categoryEn) }}
              <span v-if="section.isContinuation" class="summary-section-continued">{{ t('reports.defect.continued') }}</span>
            </div>
            <div class="summary-section-meta">
              {{ t('reports.defect.summaryTopicsCount', { n: section.category.topics.length }) }}
            </div>
          </div>

          <div v-for="topic in section.topics" :key="topic.templateId" class="summary-topic">
            <div class="summary-topic-text">
              <div class="summary-topic-label">{{ pickLocalized(topic.label, topic.labelEn) }}</div>
              <div v-for="answer in topic.answers" :key="answer.group" class="summary-answer">
                <span v-if="answer.group" class="summary-answer-group">{{ pickLocalized(answer.group, answer.groupEn) }}:</span>
                {{ answer.values.map((v) => pickLocalized(v.th, v.en)).join(', ') }}
              </div>
              <div v-if="topic.note" class="summary-answer">
                <span class="summary-answer-group">{{ t('reports.defect.noteLabel') }}</span>
                {{ topic.note }}
              </div>
            </div>
            <div class="summary-topic-photos">
              <img
                v-for="url in topic.photos"
                :key="url"
                loading="eager"
                :src="resolveImageUrl(url, '', 400)"
                class="summary-evidence-photo"
              />
              <span v-if="!topic.photos.length" class="summary-muted">{{ t('reports.defect.noEvidencePhotos') }}</span>
            </div>
          </div>
        </div>
        <div class="pdf-footer">
          <span>© 2026, {{ branch?.branchName }}</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>{{ branch?.line }},</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>{{ branch?.facebook }},</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>{{ branch?.phoneNumber }},</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span> {{ branch?.mailAddress }} </span>
          </div>
        </div>
      </div>

      <!-- หน้าแผนผังแสดงตำแหน่งข้อบกพร่อง (ก่อนหน้า AI Summary) -->
      <div
        v-for="(planPage, pageIdx) in planReportPages"
        :id="reportPageId(pageStarts.plans + pageIdx)"
        :key="`${planPage.plan.planId}-${planPage.items[0]?.displayIndex}`"
        class="pdf-page"
      >
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ pickLocalized(round.job.projectName, round.job.projectNameEn) }}, {{ t('reports.defect.roundOf', { n: round.roundNumber }) }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">
            {{ t('reports.defect.page') }} | {{ pageStarts.plans + pageIdx }} / {{ totalPages }}
          </div>
        </div>
        <div v-if="generatedAtLabel" class="row justify-end q-px-md">
          <div class="text-caption text-grey-6" style="font-size: 9px">
            {{ t('reports.defect.asOf', { date: generatedAtLabel }) }}
          </div>
        </div>

        <div class="page-content q-px-md q-py-sm column">
          <!-- Title -->
          <div class="row items-center justify-between q-mb-xs">
            <div class="text-subtitle1 text-weight-bold text-primary">
              {{ t('reports.defect.planTitlePrefix') }} — {{ planPage.plan.planName }}
              <span v-if="planPage.plan.floorLabel" class="text-caption text-grey-7">({{ planPage.plan.floorLabel }})</span>
              <span v-if="planPage.isContinuation" class="text-caption text-grey-7">{{ t('reports.defect.continued') }}</span>
            </div>
            <div class="text-caption text-grey-7">
              {{ t('reports.defect.foundDefectsCount', { n: planPage.plan.defects.length }) }}
            </div>
          </div>

          <!-- Floor Plan Image with Pin Overlays -->
          <div v-if="!planPage.isContinuation" class="report-plan-container shadow-1 rounded-borders q-mb-sm">
            <!-- canvas หดตามขนาดรูปพอดี: planX/planY เป็น % ของตัวรูป (PlanPositionDialog) หมุดต้องอ้างกรอบเดียวกัน -->
            <div class="report-plan-canvas">
              <img
                loading="eager"
                :src="resolveImageUrl(planPage.plan.imageUrl, 'https://via.placeholder.com/800x600?text=No+Plan+Image')"
                class="report-plan-image"
                @load="onPlanImageLoad(planPage.plan.planId, $event)"
              />
              <div
                v-for="pin in planPinsByPlan.get(planPage.plan.planId)"
                :key="pin.key"
                class="report-plan-pin flex flex-center"
                :style="{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  backgroundColor: pin.isMajor ? '#e53935' : '#fb8c00',
                }"
              >
                {{ pin.label }}
              </div>
            </div>
          </div>

          <!-- Legend Table -->
          <div class="report-plan-legend">
            <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
              {{ t('reports.defect.legendTitle') }}
            </div>
            <table class="report-legend-table">
              <thead>
                <tr>
                  <th style="width: 40px;">{{ t('reports.defect.colRank') }}</th>
                  <th style="width: 55px;">{{ t('reports.defect.colDefectId') }}</th>
                  <th style="width: 140px;">{{ t('reports.defect.colRoomArea') }}</th>
                  <th>{{ t('reports.defect.colDefectList') }}</th>
                  <th style="width: 80px;">{{ t('reports.defect.colSeverity') }}</th>
                  <th style="width: 70px;">{{ t('reports.defect.colStatus') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in planPage.items" :key="item.defect.defectId">
                  <td class="text-center">
                    <span
                      class="legend-index-badge"
                      :style="{
                        backgroundColor: item.defect.severity === 'Major' ? '#e53935' : '#fb8c00',
                      }"
                    >
                      {{ item.displayIndex }}
                    </span>
                  </td>
                  <td class="text-center text-grey-8">#{{ item.defect.defectId }}</td>
                  <td>{{ getRoomShortName(item.defect) }}</td>
                  <td>
                    <span v-if="item.defect.subCategories && item.defect.subCategories.length">
                      {{ item.defect.subCategories.map((s) => localizedName(s)).join(', ') }}
                    </span>
                    <span v-else>{{ item.defect.description || '-' }}</span>
                  </td>
                  <td class="text-center">
                    <span
                      class="legend-severity-tag"
                      :class="item.defect.severity === 'Major' ? 'text-red text-weight-bold' : 'text-orange text-weight-medium'"
                    >
                      {{ item.defect.severity }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span :class="item.defect.status === 'verified' ? 'text-green text-weight-bold' : 'text-red'">
                      {{ item.defect.status === 'verified' ? t('reports.defect.passed') : t('reports.defect.failed') }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="pdf-footer">
          <span>© 2026, {{ branch?.branchName }}</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>{{ branch?.line }},</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>{{ branch?.facebook }},</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>{{ branch?.phoneNumber }},</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span> {{ branch?.mailAddress }} </span>
          </div>
        </div>
      </div>

      <!-- หน้าท้ายเล่ม: AI Summary -->
      <div v-if="hasAiSummary" :id="reportPageId(pageStarts.aiSummary)" class="pdf-page">
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ pickLocalized(round.job.projectName, round.job.projectNameEn) }}, {{ t('reports.defect.roundOf', { n: round.roundNumber }) }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">{{ t('reports.defect.page') }} | {{ pageStarts.aiSummary }} / {{ totalPages }}</div>
        </div>
        <div v-if="generatedAtLabel" class="row justify-end q-px-md">
          <div class="text-caption text-grey-6" style="font-size: 9px">
            {{ t('reports.defect.asOf', { date: generatedAtLabel }) }}
          </div>
        </div>

        <div class="text-center text-bold q-py-sm" style="font-size: 16px; color: #1976d2">
          {{ t('reports.defect.overallSummaryTitle') }}
        </div>

        <div class="row justify-center q-my-md">
          <div class="completion-gauge">
            <svg viewBox="0 0 120 120" width="160" height="160">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#eee" stroke-width="12" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                :stroke="completionColor"
                stroke-width="12"
                stroke-linecap="round"
                :stroke-dasharray="`${completionDash} ${completionGap}`"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div class="completion-gauge-label">
              <div class="text-h4 text-bold" :style="`color: ${completionColor}`">
                {{ round.completionPercent }}%
              </div>
              <div class="text-caption text-grey-7">{{ t('reports.defect.completeness') }}</div>
            </div>
          </div>
        </div>

        <!-- ที่มาของคะแนน — ให้ลูกค้าเห็นว่า % รวมมาจากสองส่วนไหน ไม่ใช่ตัวเลขลอยๆ -->
        <div v-if="round.completionDefectScore != null" class="row q-col-gutter-sm q-mx-md q-mb-md">
          <div class="col-6">
            <div class="score-part">
              <div class="text-caption text-grey-7">{{ t('reports.defect.defectScoreLabel') }}</div>
              <div class="text-h6 text-bold" style="color: #1976d2">
                {{ round.completionDefectScore }}%
              </div>
              <div class="text-caption text-grey-6" style="font-size: 9px">
                {{ t('reports.defect.defectScoreNote') }}
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="score-part">
              <div class="text-caption text-grey-7">{{ t('reports.defect.systemScoreLabel') }}</div>
              <div class="text-h6 text-bold" style="color: #1976d2">
                {{ round.completionSystemScore != null ? round.completionSystemScore + '%' : '-' }}
              </div>
              <div class="text-caption text-grey-6" style="font-size: 9px">
                {{
                  round.completionSystemScore != null
                    ? t('reports.defect.systemScoreNoteFilled')
                    : t('reports.defect.systemScoreNoteEmpty')
                }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="round.aiSummaryText" class="q-mx-md q-pa-md ai-summary-box">
          <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">{{ t('reports.defect.aiSummaryTitle') }}</div>
          <div class="text-body2" style="line-height: 1.6">{{ round.aiSummaryText }}</div>
        </div>

        <div class="pdf-footer">
          <span>© 2026, {{ branch?.branchName }}</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>{{ branch?.line }},</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>{{ branch?.facebook }},</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>{{ branch?.phoneNumber }},</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span> {{ branch?.mailAddress }} </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import { useLocalizedField, localizedName } from 'src/composables/useLocalizedField';

const { t, locale } = useI18n();
const { pickLocalized } = useLocalizedField();
import type { InspectionRound, Defect, InspectionSummaryItem } from 'src/models';
import { clusterPlanPins } from 'src/utils/planPinClusters';
import PoysianLogo from 'src/assets/Logos/Poysian.png';
import LineLogo from 'src/assets/Logos/LINE.png';
import FacebookLogo from 'src/assets/Logos/Facebook.png';
import CallLogo from 'src/assets/Logos/Call.png';
import GmailLogo from 'src/assets/Logos/Gmail.png';
const apiUrl = import.meta.env.VITE_API_URL;

import { useBranchStore } from 'src/stores/useBranch';
const branchStore = useBranchStore();
// ใช้ข้อมูลสาขาที่มากับ round ก่อน — หน้า print ของ Puppeteer ไม่ได้โหลด branch store ทำให้ footer ว่าง
const branch = computed(
  () => props.round.job.branch ?? branchStore.branches.find((b) => b.branchId === props.round.job.branch?.branchId),
);

// เรียงตามลำดับที่ตั้งของไทย: ตำบล/แขวง → เขต/อำเภอ → จังหวัด
const addressLocation = computed(() =>
  [props.round.job.address?.subDistrict, props.round.job.address?.district, props.round.job.address?.province]
    .filter(Boolean)
    .join(' '),
);

// ค่า default เก่าในฐานข้อมูลที่ไม่เคยมีไฟล์จริงรองรับ (ข้อมูลเสียของระบบเดิม) — แทนที่ด้วยรูปจริงที่อัปโหลดเก็บไว้ใน Supabase Storage แล้ว
const LEGACY_IMAGE_REPLACEMENTS: Record<string, string> = {
  '/defect-images/unknown.jpg':
    'https://wduuxuwwbesgrcmcsnxq.supabase.co/storage/v1/object/public/hids-uploads/defects/unknown2.jpg',
};

// ต้นฉบับใน Storage เก็บที่ 1920px ซึ่งใหญ่กว่าที่หน้านี้แสดงจริงหลายเท่า พอฝังลง PDF ที่มีรูป
// หลายร้อยใบ ไฟล์จะทะลุเพดานอัปโหลดของ Storage จนสร้างรายงานไม่สำเร็จ — ส่ง width มาด้วยเพื่อขอ
// รูปย่อจาก backend แทน (ดู ImagesController) ต้นฉบับยังอยู่ครบ แค่ไม่เอามาฝังในเล่ม
const STORAGE_PUBLIC_PREFIX = '/storage/v1/object/public/';
const resolveImageUrl = (
  url: string | null | undefined,
  placeholder = '',
  width?: number,
): string => {
  if (!url) return placeholder;
  const replacement = LEGACY_IMAGE_REPLACEMENTS[url];
  const resolved =
    replacement ?? (/^(https?:|data:|blob:)/.test(url) ? url : `${apiUrl}${url}`);

  if (!width || !resolved.includes(STORAGE_PUBLIC_PREFIX)) return resolved;
  return `${apiUrl}/images/thumb?w=${width}&src=${encodeURIComponent(resolved)}`;
};

const props = withDefaults(
  defineProps<{
    round: InspectionRound;
    defects: Defect[];
    summaryItems: InspectionSummaryItem[];
    // เปิดเช็ค+โชว์ banner ว่ารายงานนี้เก่ากว่าข้อมูล defect ปัจจุบันไหม — ใช้เฉพาะหน้าที่คนเปิดดูจริง
    // (Admin/Customer/Inspector) ห้ามเปิดใน PrintDefectReportPage.vue เพราะ Puppeteer จะ screenshot
    // banner นี้ติดไปในตัว PDF ด้วย
    checkFreshness?: boolean;
  }>(),
  { checkFreshness: false },
);

interface SummaryAnswerValue {
  th: string;
  en?: string | null;
}

interface SummaryAnswerGroup {
  group: string;
  groupEn?: string | null;
  values: SummaryAnswerValue[];
}

interface SummaryTopic {
  templateId: number;
  label: string;
  labelEn?: string | null;
  answers: SummaryAnswerGroup[];
  note: string;
  photos: string[];
}

interface SummaryCategory {
  category: string;
  categoryEn?: string | null;
  topics: SummaryTopic[];
}

interface SummaryPageSection {
  category: SummaryCategory;
  topics: SummaryTopic[];
  isContinuation: boolean;
}

interface StickerMeta {
  label: string;
  shortLabel: string;
  color: string;
  description: string;
}

const stickerLegend = computed<StickerMeta[]>(() => [
  {
    label: t('reports.defect.categories.crack.label'),
    shortLabel: t('reports.defect.categories.crack.shortLabel'),
    color: '#ef4444',
    description: t('reports.defect.categories.crack.description'),
  },
  {
    label: t('reports.defect.categories.roughSurface.label'),
    shortLabel: t('reports.defect.categories.roughSurface.shortLabel'),
    color: '#1976d2',
    description: t('reports.defect.categories.roughSurface.description'),
  },
  {
    label: t('reports.defect.categories.stainLeak.label'),
    shortLabel: t('reports.defect.categories.stainLeak.shortLabel'),
    color: '#16a34a',
    description: t('reports.defect.categories.stainLeak.description'),
  },
  {
    label: t('reports.defect.categories.finishing.label'),
    shortLabel: t('reports.defect.categories.finishing.shortLabel'),
    color: '#f59e0b',
    description: t('reports.defect.categories.finishing.description'),
  },
  {
    label: t('reports.defect.categories.other.label'),
    shortLabel: t('reports.defect.categories.other.shortLabel'),
    color: '#64748b',
    description: t('reports.defect.categories.other.description'),
  },
]);
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

const isReportStale = ref(false);
let freshnessTimer: ReturnType<typeof setInterval> | null = null;

// เทียบ hash ข้อมูล defect สดกับ hash ตอน generate PDF/AI summary ครั้งล่าสุด (backend คำนวณให้
// ผ่าน isStale — ดู ReportsService.getCachedReportUrl) ระหว่างรอ debounce 30 วิ + เวลา render จริง
// คนที่กดเข้ามาดูจะเห็นสรุป/PDF เก่าอยู่ เลย poll เตือนไว้กันงงว่าทำไมข้อมูลไม่ตรงกับที่เพิ่งแก้
async function checkReportFreshness() {
  try {
    const { data } = await api.get<{ isStale: boolean }>(
      `/inspection-rounds/${props.round.roundId}/report`,
    );
    isReportStale.value = data.isStale;
    if (!data.isStale && freshnessTimer) {
      clearInterval(freshnessTimer);
      freshnessTimer = null;
    }
  } catch {
    // เช็คไม่สำเร็จ ไม่โชว์ banner ผิดๆ ปล่อยผ่านเงียบๆ
  }
}

onMounted(() => {
  if (!props.checkFreshness) return;
  void checkReportFreshness();
  freshnessTimer = setInterval(() => void checkReportFreshness(), 8000);
  void useBranchStore().fetchBranches()
});

onUnmounted(() => {
  if (freshnessTimer) clearInterval(freshnessTimer);
});

const reportRef = ref<HTMLElement | null>(null);

const summaryStats = computed(() => [
  { label: t('reports.defect.totalDefects'), value: props.defects.length, color: '#1976d2' },
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
    label: t('reports.defect.statusPendingRepair'),
    value: props.defects.filter((d) => d.status === 'pending_repair').length,
    color: '#fb8c00',
  },
  {
    label: t('reports.defect.statusRejected'),
    value: props.defects.filter((d) => d.status === 'rejected').length,
    color: '#ef4444',
  },
  {
    label: t('reports.defect.statusVerified'),
    value: props.defects.filter((d) => d.status === 'verified').length,
    color: '#4CAF50',
  },
]);

const categoryCounts = computed(() => {
  const counts = new Map<string, { major: number; minor: number }>();
  props.defects.forEach((d) => {
    const name = localizedName(d.subCategories?.[0]?.category) || t('reports.defect.unnamedCategory');
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

const CATEGORY_TABLE_LIMIT = 24;

const categoryTableRows = computed(() => {
  const rows = categoryCounts.value.map((cat, index) => ({
    rank: index + 1,
    name: cat.name,
    major: cat.major,
    minor: cat.minor,
    count: cat.count,
    isOther: false,
  }));

  if (rows.length <= CATEGORY_TABLE_LIMIT) return rows;

  const shown = rows.slice(0, CATEGORY_TABLE_LIMIT);
  const rest = categoryCounts.value.slice(CATEGORY_TABLE_LIMIT);
  const otherMajor = rest.reduce((sum, c) => sum + c.major, 0);
  const otherMinor = rest.reduce((sum, c) => sum + c.minor, 0);

  shown.push({
    rank: CATEGORY_TABLE_LIMIT + 1,
    name: t('reports.defect.otherCategoriesFallback', { n: rest.length }),
    major: otherMajor,
    minor: otherMinor,
    count: otherMajor + otherMinor,
    isOther: true,
  });

  return shown;
});

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
    const name = pickLocalized(d.floor?.label, d.floor?.labelEn) || t('reports.defect.unnamedFloor');
    const order = d.floor?.floorOrder ?? Number.MAX_SAFE_INTEGER;
    const existing = byFloor.get(name);
    byFloor.set(name, { count: (existing?.count ?? 0) + 1, order });
  });
  return [...byFloor.entries()]
    .map(([name, { count, order }]) => ({ name, count, order }))
    .sort((a, b) => a.order - b.order);
});

const maxFloorCount = computed(() => Math.max(1, ...floorCounts.value.map((f) => f.count)));

const STATUS_META = computed<{ key: string; label: string; color: string }[]>(() => [
  { key: 'pending_repair', label: t('reports.defect.statusPendingRepair'), color: '#fb8c00' },
  { key: 'repaired', label: t('reports.defect.statusRepaired'), color: '#1976d2' },
  { key: 'rejected', label: t('reports.defect.statusRejected'), color: '#ef4444' },
  { key: 'verified', label: t('reports.defect.statusVerified'), color: '#4CAF50' },
]);

const statusDonutSegments = computed(() => {
  const circumference = 2 * Math.PI * 15;
  const total = props.defects.length;
  let offset = 0;
  return STATUS_META.value.map((meta) => {
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
    const key = `${pickLocalized(defect.room?.roomName, defect.room?.roomNameEn) || '-'}, ${pickLocalized(defect.subRoom?.roomName, defect.subRoom?.roomNameEn) || '-'}, ${pickLocalized(defect.floor?.label, defect.floor?.labelEn)}`;
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

const hasAiSummary = computed(
  () => props.round.completionPercent != null || !!props.round.aiSummaryText,
);

// Compute plan pages for PDF - groups defects by planId, only plans with pinned defects
const planPages = computed(() => {
  const planMap = new Map<
    number,
    {
      planId: number;
      planName: string;
      imageUrl: string;
      floorLabel: string | null;
      defects: { defect: Defect; planX: number; planY: number; displayIndex: number }[];
    }
  >();

  let globalIndex = 1;
  props.defects.forEach((defect) => {
    const planId = defect.plan?.planId ?? defect.planId;
    const planX = defect.planX;
    const planY = defect.planY;
    if (!planId || planX == null || planY == null) return;

    if (!planMap.has(planId)) {
      const planData = defect.plan;
      planMap.set(planId, {
        planId,
        planName: planData?.name ? pickLocalized(planData.name, planData.nameEn) : t('reports.defect.planNameFallback', { id: planId }),
        imageUrl: planData?.imageUrl ?? '',
        floorLabel: pickLocalized(planData?.floor?.label, planData?.floor?.labelEn) || null,
        defects: [],
      });
    }
    planMap.get(planId)!.defects.push({
      defect,
      planX: Number(planX),
      planY: Number(planY),
      displayIndex: globalIndex++,
    });
  });

  return Array.from(planMap.values());
});

// หน้าแรกของแปลนมีรูปกินไปถึง 160mm เหลือที่ให้ตารางราว 10 แถว; หน้าต่อไม่มีรูปจึงใส่ได้มากกว่า
// เผื่อแถวที่ข้อความยาวจนขึ้นบรรทัดใหม่ไว้แล้ว — หน้า PDF สูงตายตัว เนื้อหาเกินจะล้นหน้า ไม่ไหลไปหน้าถัดไปเอง
const PLAN_LEGEND_ROWS_FIRST_PAGE = 10;
const PLAN_LEGEND_ROWS_CONTINUATION_PAGE = 25;

const planReportPages = computed(() =>
  planPages.value.flatMap((plan) => {
    const pages = [
      { plan, isContinuation: false, items: plan.defects.slice(0, PLAN_LEGEND_ROWS_FIRST_PAGE) },
    ];
    for (
      let start = PLAN_LEGEND_ROWS_FIRST_PAGE;
      start < plan.defects.length;
      start += PLAN_LEGEND_ROWS_CONTINUATION_PAGE
    ) {
      pages.push({
        plan,
        isContinuation: true,
        items: plan.defects.slice(start, start + PLAN_LEGEND_ROWS_CONTINUATION_PAGE),
      });
    }
    return pages;
  }),
);

// ต้องตรงกับขนาด .report-plan-pin — ห่างน้อยกว่านี้ (+ช่องไฟ) หมุดจะทับจนอ่านเลขไม่ออก
const PLAN_PIN_SIZE_PX = 24;
const PLAN_PIN_MIN_GAP_PX = 4;

// ขนาดรูปแปลนที่ render จริง (layout px ไม่รวม transform) ใช้แปลง % เป็นระยะจริงตอนตัดสินว่าหมุดทับกัน
const planImageSize = ref<Record<number, { width: number; height: number }>>({});

function onPlanImageLoad(planId: number, event: Event) {
  const img = event.target as HTMLImageElement;
  planImageSize.value[planId] = { width: img.offsetWidth, height: img.offsetHeight };
}

const planPinsByPlan = computed(
  () =>
    new Map(
      planPages.value.map((page) => [
        page.planId,
        clusterPlanPins(
          page.defects.map((item) => ({
            id: item.defect.defectId,
            x: item.planX,
            y: item.planY,
            displayIndex: item.displayIndex,
            isMajor: item.defect.severity === 'Major',
          })),
          planImageSize.value[page.planId],
          PLAN_PIN_SIZE_PX + PLAN_PIN_MIN_GAP_PX,
        ),
      ]),
    ),
);

// เลขหน้าเริ่มของแต่ละส่วนคำนวณที่นี่ที่เดียว — header ทุกหน้า สารบัญ และลิงก์ในสารบัญอ่านจากตรงนี้ จะได้ไม่คลาดกัน
// ลำดับต้องตรงกับลำดับ .pdf-page ใน template: ข้อมูล → สารบัญ → Main Defects → Defect List → สรุปผลการตรวจ → แปลน → AI Summary
const TOC_PAGE = 2;

const pageStarts = computed(() => {
  const major = TOC_PAGE + 1;
  const defectList = major + majorChunks.value.length;
  const summary = defectList + allDefectChunks.value.length;
  const plans = summary + summaryPages.value.length;
  const aiSummary = plans + planReportPages.value.length;
  return { major, defectList, summary, plans, aiSummary };
});

const totalPages = computed(() => pageStarts.value.aiSummary - 1 + (hasAiSummary.value ? 1 : 0));

function reportPageId(page: number) {
  return `report-page-${page}`;
}

// ในแอปใช้ scroll แทน — href="#..." จะไปชน hash router; ส่วนใน PDF (Puppeteer) Chrome แปลง href เป็นลิงก์ภายในเล่มให้เอง
function scrollToReportPage(page: number) {
  reportRef.value?.querySelector(`#${reportPageId(page)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

interface TocItem {
  key: string;
  label: string;
  page: number;
}

interface TocEntry extends TocItem {
  children: TocItem[];
}

// Defect List แยกตามชั้น ไม่ใช่ตามห้อง — บางรอบมีกลุ่มห้องเป็นร้อย สารบัญจะล้นหน้าเดียว
const tocEntries = computed<TocEntry[]>(() => {
  const entries: TocEntry[] = [];
  const starts = pageStarts.value;

  if (majorChunks.value.length) {
    entries.push({ key: 'major', label: t('reports.defect.mainDefectsTitle'), page: starts.major, children: [] });
  }

  if (allDefectChunks.value.length) {
    const floors: TocItem[] = [];
    allDefectChunks.value.forEach((groups, index) => {
      const label = pickLocalized(groups[0]?.defects[0]?.floor?.label, groups[0]?.defects[0]?.floor?.labelEn) || t('reports.defect.unnamedFloor');
      if (!floors.some((floor) => floor.label === label)) {
        floors.push({ key: `floor-${label}`, label, page: starts.defectList + index });
      }
    });
    entries.push({
      key: 'defect-list',
      label: t('reports.defect.defectListTitle'),
      page: starts.defectList,
      children: floors,
    });
  }

  if (summaryPages.value.length) {
    const categories: TocItem[] = [];
    summaryPages.value.forEach((sections, index) => {
      sections
        .filter((section) => !section.isContinuation)
        .forEach((section) => {
          categories.push({
            key: `category-${section.category.category}`,
            label: pickLocalized(section.category.category, section.category.categoryEn),
            page: starts.summary + index,
          });
        });
    });
    entries.push({
      key: 'summary',
      label: t('reports.defect.summaryTitle'),
      page: starts.summary,
      children: categories,
    });
  }

  if (planReportPages.value.length) {
    entries.push({
      key: 'plans',
      label: t('reports.defect.planTitlePrefix'),
      page: starts.plans,
      children: planReportPages.value
        .map((planPage, index) => ({ planPage, index }))
        .filter(({ planPage }) => !planPage.isContinuation)
        .map(({ planPage, index }) => ({
          key: `plan-${planPage.plan.planId}`,
          label: planPage.plan.floorLabel
            ? `${planPage.plan.planName} (${planPage.plan.floorLabel})`
            : planPage.plan.planName,
          page: starts.plans + index,
        })),
    });
  }

  if (hasAiSummary.value) {
    entries.push({ key: 'ai', label: t('reports.defect.overallSummaryTitle'), page: starts.aiSummary, children: [] });
  }

  return entries;
});

const completionColor = computed(() => {
  const pct = props.round.completionPercent ?? 0;
  if (pct >= 80) return '#4CAF50';
  if (pct >= 50) return '#fb8c00';
  return '#ef4444';
});

const completionDash = computed(() => {
  const circumference = 2 * Math.PI * 52;
  const pct = props.round.completionPercent ?? 0;
  return (pct / 100) * circumference;
});

const completionGap = computed(() => {
  const circumference = 2 * Math.PI * 52;
  return circumference - completionDash.value;
});

function getRoomShortName(defect: Defect) {
  const parts = [pickLocalized(defect.room?.roomName, defect.room?.roomNameEn), pickLocalized(defect.subRoom?.roomName, defect.subRoom?.roomNameEn), pickLocalized(defect.floor?.label, defect.floor?.labelEn)].filter(Boolean);
  return parts.length ? parts.join(', ') : '-';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// เวลาที่ PDF ไฟล์นี้ถูก render จริง (backend/src/reports/reports.service.ts) — โชว์ในตัวรายงาน
// เพื่อให้เช็คได้ว่าไฟล์ที่กำลังดู/ดาวน์โหลดเป็นข้อมูล ณ เวลาไหน เพราะ PDF อาจ regenerate ช้ากว่าการแก้ defect ล่าสุดได้ (debounce 30 วิ + เวลา render)
const generatedAtLabel = computed(() => {
  if (!props.round.lastPdfGeneratedAt) return '';
  return new Date(props.round.lastPdfGeneratedAt).toLocaleString(locale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

// เช็ค cache PDF ที่ backend generate ไว้ล่วงหน้าก่อนเสมอ (backend/src/reports/reports.service.ts) —
// มีแล้วเปิดโหลดทันที ไม่ต้อง render ฝั่ง client เลย ถ้ายังไม่มี (เช่นรอบแรกที่ debounce ยังไม่ settle)
// ค่อย fallback ไปสร้างแบบเดิมผ่าน window.print()
async function exportPdf() {
  try {
    const { data } = await api.get<{ url: string | null; generatedAt: string | null }>(
      `/inspection-rounds/${props.round.roundId}/report`,
      { params: { lang: locale.value } },
    );
    if (data.url) {
      window.open(data.url, '_blank');
      return;
    }
  } catch {
    // เช็ค cache ไม่สำเร็จ ปล่อยผ่านไป fallback ด้านล่าง
  }

  exportPdfClientSide();
}

function exportPdfClientSide() {
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
          .info-grid { display: grid; grid-template-columns: max-content minmax(0, 1fr); column-gap: 4px; row-gap: 2px; font-size: 10px; overflow-wrap: anywhere; }
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

// รวมคำตอบเป็น 1 แถวต่อหัวข้อ (template) — API ส่งมาเป็น 1 แถวต่อตัวเลือกที่ติ้ก + 1 แถวต่อรูปหลักฐาน
// เรียงตาม templateId ให้ลำดับหมวด/หัวข้อตรงกับแบบฟอร์มที่ช่างกรอก ไม่ใช่ตามลำดับที่บันทึก
const summaryCategories = computed<SummaryCategory[]>(() => {
  const topicsByCategory = new Map<string, { categoryEn: string | null; topics: Map<number, SummaryTopic> }>();

  [...props.summaryItems]
    .sort((a, b) => a.template.templateId - b.template.templateId || a.itemId - b.itemId)
    .forEach((item) => {
      const { category, templateId, label } = item.template;
      const categoryEn = item.template.categoryEn ?? null;
      const labelEn = item.template.labelEn ?? null;
      if (!topicsByCategory.has(category)) topicsByCategory.set(category, { categoryEn, topics: new Map() });
      const topics = topicsByCategory.get(category)!.topics;
      if (!topics.has(templateId)) {
        topics.set(templateId, { templateId, label, labelEn, answers: [], note: '', photos: [] });
      }
      const topic = topics.get(templateId)!;

      if (item.photoUrl) {
        topic.photos.push(item.photoUrl);
        return;
      }
      if (!item.option) return;

      const group = item.option.group ?? '';
      let answer = topic.answers.find((a) => a.group === group);
      if (!answer) {
        answer = { group, groupEn: item.option.groupEn ?? null, values: [] };
        topic.answers.push(answer);
      }
      answer.values.push({ th: item.option.value, en: item.option.valueEn ?? null });
      // หน้ากรอกบันทึกหมายเหตุเดียวกันซ้ำลงทุกตัวเลือกที่ติ้ก เก็บค่าเดียวพอ ไม่งั้นพิมพ์ซ้ำหลายรอบ
      if (!topic.note && item.detailValue?.trim()) topic.note = item.detailValue.trim();
    });

  return [...topicsByCategory.entries()].map(([category, { categoryEn, topics }]) => ({
    category,
    categoryEn,
    topics: [...topics.values()],
  }));
});

// หน้า PDF สูงตายตัว เนื้อหาเกินจะล้นหน้าแทนที่จะไหลไปหน้าถัดไป จึงต้องประมาณความสูง (mm) เองแล้วตัดหน้าก่อน render
// ค่าเหล่านี้ผูกกับ CSS .summary-* ด้านล่าง (ขนาดตัวอักษร ความกว้างคอลัมน์ ขนาดรูป) — แก้ CSS แล้วต้องปรับตาม
const SUMMARY_PAGE_BUDGET_MM = 232;
const SUMMARY_SECTION_HEADER_MM = 11.2;
const SUMMARY_TOPIC_LABEL_MM = 3.5;
const SUMMARY_TEXT_LINE_MM = 3.5;
const SUMMARY_TEXT_CHARS_PER_LINE = 50;
const SUMMARY_PHOTO_MM = 22.5;
const SUMMARY_TOPIC_PADDING_MM = 2.5;

function estimateLines(text: string) {
  return Math.max(1, Math.ceil(text.length / SUMMARY_TEXT_CHARS_PER_LINE));
}

function estimateTopicMm(topic: SummaryTopic) {
  const lines =
    topic.answers.reduce((sum, a) => sum + estimateLines(`${a.group}: ${a.values.map((v) => pickLocalized(v.th, v.en)).join(', ')}`), 0) +
    (topic.note ? estimateLines(`${t('reports.defect.noteLabel')} ${topic.note}`) : 0);
  const textMm = SUMMARY_TOPIC_LABEL_MM + lines * SUMMARY_TEXT_LINE_MM;
  const photoMm = topic.photos.length ? SUMMARY_PHOTO_MM : SUMMARY_TEXT_LINE_MM;
  return Math.max(textMm, photoMm) + SUMMARY_TOPIC_PADDING_MM;
}

// วางทีละหัวข้อ ถ้าไม่พอก็ขึ้นหน้าใหม่ หมวดที่ยาวข้ามหน้าจะมีหัวหมวด "(ต่อ)" ซ้ำให้
const summaryPages = computed(() => {
  const pages: SummaryPageSection[][] = [];
  let currentPage: SummaryPageSection[] = [];
  let usedMm = 0;

  const startNewPage = () => {
    pages.push(currentPage);
    currentPage = [];
    usedMm = 0;
  };

  summaryCategories.value.forEach((category) => {
    let section: SummaryPageSection | null = null;

    category.topics.forEach((topic, index) => {
      const topicMm = estimateTopicMm(topic);

      if (section && usedMm + topicMm > SUMMARY_PAGE_BUDGET_MM) {
        startNewPage();
        section = null;
      }
      if (!section) {
        // หัวหมวดต้องมีหัวข้อแรกติดไปด้วย ไม่งั้นหัวหมวดค้างอยู่ท้ายหน้าเปล่าๆ
        if (currentPage.length && usedMm + SUMMARY_SECTION_HEADER_MM + topicMm > SUMMARY_PAGE_BUDGET_MM) {
          startNewPage();
        }
        section = { category, topics: [], isContinuation: index > 0 };
        currentPage.push(section);
        usedMm += SUMMARY_SECTION_HEADER_MM;
      }

      section.topics.push(topic);
      usedMm += topicMm;
    });
  });

  if (currentPage.length) pages.push(currentPage);
  return pages;
});
</script>

<style scoped>
.pdf-wrapper {
  background: #eee;
  padding: 20px 0;
  margin: 0 auto;
  transform-origin: top center;
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
  min-height: 65px;
}
.stat-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
.mini-chart {
  height: 115px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  border: 1px solid #e2e6ea;
  border-radius: 4px;
  background: #fafbfc;
  padding: 8px 6px 6px;
  overflow: hidden;
}
.category-table {
  column-count: 3;
  column-gap: 14px;
  border: 1px solid #e2e6ea;
  border-radius: 4px;
  background: #fafbfc;
  padding: 6px 8px;
}
.category-table-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 2px 0;
  border-bottom: 1px solid #edf0f2;
  break-inside: avoid;
  font-size: 8px;
}
.category-table-row:last-child {
  border-bottom: none;
}
.category-table-rank {
  min-width: 12px;
  color: #9e9e9e;
  font-variant-numeric: tabular-nums;
}
.category-table-name {
  flex: 1;
  min-width: 0;
  color: #212121;
  word-break: break-word;
}
.category-table-count {
  min-width: 12px;
  text-align: right;
  font-weight: bold;
  font-variant-numeric: tabular-nums;
}
.category-table-total {
  min-width: 14px;
  text-align: right;
  font-weight: bold;
  color: #1976d2;
  font-variant-numeric: tabular-nums;
}
.category-table-row-other .category-table-name {
  color: #757575;
  font-style: italic;
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
.mini-bar-track {
  width: 100%;
  height: 95px;
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
.completion-gauge {
  position: relative;
  width: 160px;
  height: 160px;
}
.completion-gauge-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.ai-summary-box {
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}
.freshness-banner {
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 8px;
}
.score-part {
  background: #f5f7fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 10px;
  text-align: center;
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
/* label เป็นคอลัมน์ของตัวเอง ข้อความยาวที่ขึ้นบรรทัดใหม่จะเยื้องตรงกับค่า ไม่ย้อนไปใต้ label */
.info-grid {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 4px;
  row-gap: 2px;
  font-size: 10px;
  overflow-wrap: anywhere;
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

.toc-entry {
  padding: 6px 0;
  border-bottom: 1px solid #eef2f6;
}

.toc-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: inherit;
  text-decoration: none;
}

.toc-row--section {
  font-size: 12px;
  font-weight: 700;
  color: #0f4c81;
}

.toc-row--child {
  font-size: 10.5px;
  color: #334155;
  padding: 2px 0 0 16px;
}

.toc-label {
  min-width: 0;
}

.toc-leader {
  flex: 1;
  border-bottom: 1px dotted #cbd5e1;
  transform: translateY(-3px);
}

.toc-page {
  min-width: 24px;
  text-align: right;
  font-variant-numeric: tabular-nums;
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
.summary-section {
  border: 1px solid #d7e0ea;
  border-radius: 6px;
  overflow: hidden;
  margin: 0 16px 10px;
  background: #fff;
}

.summary-section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  background: #eef6ff;
  border-bottom: 1px solid #d7e0ea;
  padding: 6px 10px;
}

.summary-section-title {
  color: #0f4c81;
  font-weight: 700;
  font-size: 13px;
  line-height: 1.3;
}

.summary-section-continued {
  color: #64748b;
  font-size: 10px;
  font-weight: 400;
}

.summary-section-meta {
  color: #64748b;
  font-size: 9.5px;
  white-space: nowrap;
}

/* ความกว้างรูป/ช่องข้อความผูกกับ SUMMARY_PHOTO_MM และ SUMMARY_TEXT_CHARS_PER_LINE ใน script */
.summary-topic {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 94mm;
  gap: 8px;
  padding: 5px 10px;
  break-inside: avoid;
}

.summary-topic + .summary-topic {
  border-top: 1px solid #eef2f6;
}

.summary-topic-text {
  min-width: 0;
  font-size: 9px;
  line-height: 1.4;
  color: #1f2937;
  overflow-wrap: anywhere;
}

.summary-topic-label {
  font-size: 10px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1px;
}

.summary-answer-group {
  color: #64748b;
}

.summary-topic-photos {
  display: flex;
  align-items: flex-start;
  gap: 2mm;
}

.summary-evidence-photo {
  width: 30mm;
  height: 22.5mm;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  display: block;
}

.summary-muted {
  color: #94a3b8;
  font-size: 9px;
}

.page-content {
  flex: 1;
}

.report-plan-container {
  display: flex;
  justify-content: center;
  width: 100%;
  border: 1px solid #e0e0e0;
}

.report-plan-canvas {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

/* ย่อทั้งรูปให้อยู่ใน 160mm แทนการตัดทิ้ง — รูปแนวตั้งเคยโดน overflow ตัดจนหมุดเลื่อนขึ้น */
.report-plan-image {
  display: block;
  max-width: 100%;
  max-height: 160mm;
}

.report-plan-pin {
  position: absolute;
  min-width: 24px;
  height: 24px;
  padding: 0 5px;
  border-radius: 12px;
  white-space: nowrap;
  color: white;
  font-size: 10px;
  font-weight: bold;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.report-plan-legend {
  width: 100%;
}

.report-legend-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

.report-legend-table th,
.report-legend-table td {
  border: 1px solid #e0e0e0;
  padding: 3px 6px;
  text-align: left;
  vertical-align: middle;
}

.report-legend-table th {
  background: #f5f5f5;
  font-weight: bold;
}

.legend-index-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: white;
  font-size: 9px;
  font-weight: bold;
}
</style>
