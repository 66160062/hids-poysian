<template>
  <q-page class="bg-grey-1">
    <!-- Header -->
    <div class="header-bar bg-white row items-center justify-between q-px-md q-py-sm">
      <q-icon
        name="arrow_back_ios_new"
        color="primary"
        size="24px"
        class="cursor-pointer job-back-icon"
        @click="goBack"
      />
      <div class="text-weight-bold job-detail-title">{{ t('adminJobs.construction.detailTitle') }}</div>
      <q-btn flat no-caps :label="t('adminJobs.construction.edit')" color="primary" @click="onEdit" />
    </div>

    <div class="detail-content">
      <!-- Project Card -->
      <q-card flat bordered class="q-mb-md card-round overflow-hidden">
        <!-- House Image -->
        <div
          class="house-image-wrapper"
          :class="job.projectImage ? 'cursor-pointer' : ''"
          @click="viewProjectImage"
        >
          <q-img loading="eager" v-if="job.projectImage" :src="job.projectImage" class="house-img" fit="cover" />
          <div v-else class="house-img-placeholder row items-center justify-center bg-grey-2">
            <q-icon name="home" size="64px" color="grey-4" />
          </div>
        </div>

        <q-card-section class="q-pt-md">
          <!-- Project Name & Map button -->
          <div class="row items-start justify-between">
            <div class="col">
              <div class="text-h6 text-primary text-weight-bold">{{ pickLocalized(job.projectName, job.projectNameEn) }}</div>
              <div class="text-caption text-grey-7 q-mt-xs">{{ job.address }}</div>
            </div>
            <q-btn round flat icon="map" color="primary" class="map-btn" @click="openGoogleMaps" />
          </div>

          <!-- Type & Area -->
          <div class="q-mt-sm column q-gutter-y-xs">
            <div class="row items-center">
              <q-icon name="home_work" size="18px" color="primary" class="q-mr-sm" />
              <span class="text-body2 text-grey-8">{{ job.houseType }}</span>
            </div>
            <div class="row items-center">
              <q-icon name="straighten" size="18px" color="primary" class="q-mr-sm" />
              <span class="text-body2 text-grey-8">{{ job.area }} {{ t('adminJobs.construction.sqm') }}</span>
            </div>
            <div v-if="job.appointmentDate" class="row items-center">
              <q-icon name="calendar_today" size="18px" color="primary" class="q-mr-sm" />
              <span class="text-body2 text-grey-8">{{ job.appointmentDate }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Customer & Coordinator Card (2-column) -->
      <q-card flat bordered class="q-mb-md card-round">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- ลูกค้า -->
            <div class="col-6">
              <div class="row items-center q-mb-xs text-grey-6">
                <q-icon name="person" size="16px" class="q-mr-xs" />
                <span class="text-caption">{{ t('adminJobs.construction.customerLabel') }}</span>
              </div>
              <div class="text-weight-bold text-body2">{{ job.customerName }}</div>
              <div class="text-caption text-primary q-mt-xs">
                <q-icon name="phone" size="13px" class="q-mr-xs" />
                {{ job.customerPhone }}<template v-if="job.customerPhone2"> | {{ job.customerPhone2 }}</template><template v-if="job.customerPhone3"> | {{ job.customerPhone3 }}</template>
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                {{ t('adminJobs.construction.emailPrefix') }} {{ job.customerEmail }}<template v-if="job.customerEmail2"> | {{ job.customerEmail2 }}</template><template v-if="job.customerEmail3"> | {{ job.customerEmail3 }}</template>
              </div>
            </div>

            <!-- ผู้ประสานงาน -->
            <div class="col-6">
              <div class="row items-center q-mb-xs text-grey-6">
                <q-icon name="contacts" size="16px" class="q-mr-xs" />
                <span class="text-caption">{{ t('adminJobs.construction.coordinatorLabel') }}</span>
              </div>
              <div class="text-weight-bold text-body2">{{ job.coordName }}</div>
              <div class="text-caption text-primary q-mt-xs">
                <q-icon name="phone" size="13px" class="q-mr-xs" />
                {{ job.coordPhone }}
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">{{ t('adminJobs.construction.emailPrefix') }} {{ job.coordEmail }}</div>
              <div class="text-caption text-grey-7 q-mt-xs">{{ t('adminJobs.construction.lineIdPrefix') }} {{ job.coordLine }}</div>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <!-- House Plan -->
          <div class="row items-center justify-between">
            <div
              v-if="job.housePlanImage"
              class="plan-thumb relative-position cursor-pointer"
              @click="viewPlan"
            >
              <q-img loading="eager" :src="job.housePlanImage" class="plan-img" fit="cover" />
            </div>
            <div
              v-else
              class="plan-thumb-empty row items-center justify-center bg-grey-2 rounded-borders"
            >
              <q-icon name="architecture" size="40px" color="grey-4" />
            </div>

            <q-btn
              unelevated
              color="primary"
              :label="t('adminJobs.construction.viewPlan')"
              icon="grid_view"
              class="plan-btn"
              no-caps
              @click="viewPlan"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Contractor Progress Section -->
      <div v-if="inspectionRounds.length > 0 && job.status === 'COMPLETED'" class="q-mb-lg">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle2 text-weight-bold">{{ t('adminJobs.construction.contractorProgressTitle') }}</div>
          <div class="text-caption text-weight-bold" :class="job.contractorProgress >= 50 ? 'text-positive' : 'text-orange'">
            {{ Math.round(job.contractorProgress) }}%
          </div>
        </div>
        <q-linear-progress
          rounded
          size="10px"
          :value="job.contractorProgress / 100"
          :color="job.contractorProgress >= 50 ? 'positive' : 'orange'"
          class="q-mb-xs"
        />
        <div class="text-caption text-grey-6 text-right">
          {{ job.contractorProgress >= 50 ? t('adminJobs.construction.readyForRound2') : t('adminJobs.construction.waitFor50Percent') }}
        </div>
      </div>

      <!-- รอบการตรวจ Section -->
      <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ t('adminJobs.construction.roundsTitle') }}</div>
      <q-card flat bordered class="card-round">
        <q-card-section v-if="inspectionRounds.length === 0" class="column items-center q-py-xl">
          <q-icon name="playlist_add_check_circle" size="56px" color="grey-4" class="q-mb-md" />
          <div class="text-body2 text-grey-6 text-center">
            {{ t('adminJobs.construction.noRoundsYet') }}<br />
            {{ t('adminJobs.construction.startFirstRoundHint') }}
          </div>
          <q-btn
            unelevated
            color="primary"
            icon="add_circle"
            :label="t('adminJobs.construction.createNewRound')"
            class="q-mt-lg create-round-btn"
            no-caps
            @click="onCreateRound"
          />
        </q-card-section>

        <template v-else>
          <q-list separator>
            <q-item
              v-for="round in inspectionRounds"
              :key="round.id"
              clickable
              v-ripple
              class="q-py-md"
              @click="openRoundReview(round)"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="36px">
                  {{ round.roundNumber }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium"
                  >{{ t('adminJobs.construction.roundNumberLabel', { number: round.roundNumber }) }}</q-item-label
                >
                <q-item-label caption class="column q-gutter-y-xs">
                  <span>{{ t('adminJobs.construction.datePrefix') }} {{ round.date }}</span>
                  <span v-if="round.inspectors && round.inspectors.length" class="text-primary text-caption text-weight-medium">
                    {{ t('adminJobs.construction.inspectorsPrefix') }} {{ round.inspectors.join(', ') }}
                  </span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip
                  dense
                  :color="getRoundStatusColor(round.status)"
                  text-color="dark"
                  class="text-caption"
                >
                  {{ jobStatusLabel(round.status) }}
                </q-chip>
                <q-icon name="chevron_right" color="grey-5" class="q-mt-xs" />
              </q-item-section>
            </q-item>
          </q-list>
          <div class="q-pa-md">
            <div :class="{ 'cursor-not-allowed': isLatestRoundNotCompleted }">
              <q-btn
                unelevated
                color="primary"
                icon="add_circle"
                :label="t('adminJobs.construction.createNewRound')"
                class="full-width create-round-btn"
                no-caps
                :disable="isLatestRoundNotCompleted"
                :style="isLatestRoundNotCompleted ? 'pointer-events: none;' : ''"
                @click="onCreateRound"
              />
              <q-tooltip v-if="isLatestRoundNotCompleted" class="bg-red text-white" anchor="top middle" self="bottom middle">
                {{ t('adminJobs.construction.closeRoundFirst') }}
              </q-tooltip>
            </div>
          </div>
        </template>
      </q-card>

      <!-- Bottom spacing -->
      <div style="height: 32px" />
    </div>

    <!-- Image Viewer Dialog -->
    <q-dialog v-model="showImageDialog" maximized transition-show="fade" transition-hide="fade">
      <q-card class="bg-black text-white column">
        <q-toolbar class="bg-transparent absolute-top z-top">
          <q-space />
          <q-btn dense flat round icon="close" v-close-popup size="lg" color="white" />
        </q-toolbar>
        <q-card-section class="col flex flex-center q-pa-none">
          <q-img loading="eager" :src="currentImageUrl" fit="contain" class="full-height full-width" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Plan Position Dialog (Read-only) -->
    <PlanPositionDialog
      v-model="showPlanDialog"
      :job-id="jobId"
      :initial-plan-id="selectedDefectPlanId"
      :initial-x="selectedDefect?.planX ?? null"
      :initial-y="selectedDefect?.planY ?? null"
      :initial-zone="selectedDefect?.locationZone ?? null"
      readonly
    />

    <!-- House Plan Viewer (ปุ่ม "ดูแปลน") -->
    <PlanPositionDialog v-model="showHousePlanDialog" :job-id="jobId" readonly />

    <!-- Create New Round Dialog -->
    <q-dialog v-model="showCreateRoundDialog" transition-show="scale" transition-hide="scale">
      <q-card class="create-round-card q-pa-lg">
        <!-- Dialog Header -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold text-dark-blue">{{ t('adminJobs.construction.createNewRound') }}</div>
          <q-btn icon="close" flat round dense v-close-popup class="text-grey-6 close-dialog-btn" />
        </div>

        <div class="row q-col-gutter-md q-mb-md">
          <!-- Inspection Date Field -->
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">{{ t('adminJobs.construction.scheduledDateLabel') }}</div>
            <q-input
              borderless
              dense
              readonly
              :model-value="scheduledDate ? formatDateDisplay(scheduledDate) : ''"
              placeholder="mm/dd/yyyy"
              class="custom-input cursor-pointer"
              @click="showDatePicker = true"
            >
              <template v-slot:prepend>
                <q-icon name="calendar_month" color="primary" size="20px" class="q-ml-sm" />
              </template>
              <q-popup-proxy v-model="showDatePicker" transition-show="scale" transition-hide="scale">
                <q-date v-model="scheduledDate" mask="YYYY-MM-DD" :options="dateOptions" @update:model-value="showDatePicker = false" />
              </q-popup-proxy>
            </q-input>
          </div>

          <!-- Time Field -->
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">{{ t('adminJobs.construction.timeSlotLabel') }}</div>
            <q-btn-toggle
              v-model="timeInput"
              spread
              no-caps
              rounded
              unelevated
              toggle-color="primary"
              color="white"
              text-color="grey-8"
              style="border: 1px solid #e0e0e0"
              :options="[
                {label: t('adminJobs.construction.morningSlot'), value: '09:00:00'},
                {label: t('adminJobs.construction.afternoonSlot'), value: '13:00:00'}
              ]"
            />
          </div>
        </div>

        <!-- Select Team vs Individuals Toggle -->
        <div class="q-mb-md">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">{{ t('adminJobs.construction.assignmentModeLabel') }}</div>
          <q-btn-toggle
            v-model="assignmentMode"
            spread
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            :options="[
              {label: t('adminJobs.construction.assignToTeam'), value: 'team'},
              {label: t('adminJobs.construction.assignToIndividual'), value: 'individual'}
            ]"
            class="q-mb-md border-grey"
            style="border: 1px solid #e0e0e0"
          />
        </div>

        <!-- Select Team -->
        <div v-if="assignmentMode === 'team'" class="q-mb-lg">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">{{ t('adminJobs.construction.selectTeamLabel') }}</div>
          <q-select
            borderless
            dense
            v-model="selectedTeam"
            :options="branchTeamOptions"
            :placeholder="t('adminJobs.construction.searchTeamPlaceholder')"
            class="custom-select"
            popup-content-class="custom-dropdown-popup"
            emit-value
            map-options
          >
            <template v-slot:prepend>
              <q-icon name="groups" color="grey-6" size="20px" class="q-ml-sm" />
            </template>
          </q-select>
        </div>

        <!-- Build Inspection Team Field -->
        <div class="q-mb-lg">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">
            {{ assignmentMode === 'team' ? t('adminJobs.construction.additionalInspectorsLabel') : t('adminJobs.construction.selectIndividualInspectorsLabel') }}
          </div>
          <q-select
            borderless
            dense
            multiple
            use-chips
            use-input
            v-model="selectedInspectors"
            :options="filteredInspectorOptions"
            :placeholder="t('adminJobs.construction.searchInspectorsPlaceholder')"
            class="custom-select"
            @filter="filterInspectors"
            popup-content-class="custom-dropdown-popup"
          >
            <template v-slot:prepend>
              <q-icon name="person_search" color="grey-6" size="20px" class="q-ml-sm" />
            </template>
          </q-select>
          <div class="text-caption text-grey-5 q-mt-xs q-pl-sm font-sub">
            {{ t('adminJobs.construction.startTypingHint') }}
          </div>
        </div>

        <!-- Dialog Actions -->
        <q-card-actions class="row q-col-gutter-x-md q-px-none q-pb-none q-mt-lg">
          <div class="col-6">
            <q-btn
              outline
              :label="t('adminJobs.construction.cancel')"
              class="full-width cancel-btn"
              no-caps
              v-close-popup
            />
          </div>
          <div class="col-6">
            <q-btn
              unelevated
              :label="t('adminJobs.construction.createRoundSubmit')"
              class="full-width submit-btn"
              no-caps
              :loading="isSubmittingRound"
              @click="submitCreateRound"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Review Round / Defect Dialog -->
    <q-dialog v-model="showRoundReviewDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-1 column no-wrap full-height">
        <q-toolbar class="bg-white shadow-1">
          <q-btn flat round dense icon="close" v-close-popup />
          <q-toolbar-title class="text-subtitle1 text-weight-bold">
            {{ t('adminJobs.construction.reviewRoundTitle', { number: selectedRound?.roundNumber ?? '-' }) }}
          </q-toolbar-title>

          <q-btn
            unelevated
            color="warning"
            icon="edit"
            :label="t('adminJobs.construction.editInspection')"
            no-caps
            class="q-mr-sm"
            @click="goToEditConstruction(selectedRound)"
          />

          <q-btn
            unelevated
            color="positive"
            icon="verified"
            :label="approvalButtonLabel"
            no-caps
            :disable="!canApproveSelectedRound"
            :loading="isApprovingRound"
            @click="confirmApproveRound"
          />
        </q-toolbar>

        <q-card-section class="review-dialog-content col q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-5">
              <q-card flat bordered class="card-round review-panel">
                <q-card-section class="row items-center justify-between">
                  <div>
                    <div class="text-subtitle2 text-weight-bold">{{ t('adminJobs.construction.defectListTitle') }}</div>
                    <div class="text-caption text-grey-6">
                      {{ roundDefects.length }} {{ t('adminJobs.construction.itemsSuffix') }}
                    </div>
                  </div>
                  <q-chip v-if="selectedRound" dense :color="getRoundStatusColor(selectedRound.status)" text-color="dark">
                    {{ jobStatusLabel(selectedRound.status) }}
                  </q-chip>
                </q-card-section>


                <div v-if="isLoadingRoundDefects" class="column items-center q-pa-xl">
                  <IconBounceSpinner icon="assignment" size="40px" color="primary" />
                  <div class="text-caption text-grey-6 q-mt-sm">{{ t('adminJobs.construction.loadingDefects') }}</div>
                </div>

                <q-card-section v-else-if="roundDefectsError" class="column items-center q-py-xl">
                  <q-icon name="error_outline" size="48px" color="negative" />
                  <div class="text-body2 text-negative q-mt-sm text-center">{{ t(roundDefectsError) }}</div>
                  <q-btn
                    flat
                    color="primary"
                    icon="refresh"
                    :label="t('adminJobs.construction.retry')"
                    class="q-mt-sm"
                    no-caps
                    @click="retryFetchRoundDefects"
                  />
                </q-card-section>

                <q-card-section v-else-if="roundDefects.length === 0" class="column items-center q-py-xl">
                  <q-icon name="fact_check" size="48px" color="grey-4" />
                  <div class="text-body2 text-grey-6 q-mt-sm text-center">{{ t('adminJobs.construction.noDefectsInRound') }}</div>
                  <div class="text-caption text-grey-5 q-mt-xs text-center">
                    {{ t('adminJobs.construction.checkInspectorSavedDefectsHint') }}
                  </div>
                </q-card-section>

                <div v-else-if="!selectedGroupKey" class="column q-gutter-y-sm q-pa-sm">
                  <InspectionItemCard
                    v-for="item in groupedDefects"
                    :key="item.groupKey"
                    :groupedData="item"
                    @clickCard="selectedGroupKey = item.groupKey"
                  />
                </div>

                <div v-else class="column">
                  <div class="row items-center q-pa-sm bg-grey-2" style="position: sticky; top: 0; z-index: 10;">
                    <q-btn flat round dense icon="arrow_back" color="primary" @click="selectedGroupKey = null" />
                    <div class="text-subtitle2 q-ml-sm text-weight-bold">{{ groupedDefects.find(g => g.groupKey === selectedGroupKey)?.roomName }}</div>
                  </div>
                  <q-list separator>
                    <q-item
                      v-for="defect in paginatedDefects"
                      :key="defect.defectId"
                      clickable
                      v-ripple
                      :active="selectedDefect?.defectId === defect.defectId"
                      active-class="bg-blue-1 text-primary"
                      @click="selectDefect(defect)"
                    >
                      <q-item-section avatar>
                        <q-avatar rounded size="52px" color="grey-2">
                          <q-img loading="eager" v-if="defect.imageUrl" :src="getImageUrl(defect.imageUrl) ?? ''" fit="cover" />
                          <q-icon v-else name="image_not_supported" color="grey-5" />
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium ellipsis">
                          #{{ defect.defectId }} {{ getDefectRoomLabel(defect) }}
                        </q-item-label>
                        <q-item-label caption lines="2">
                          {{ defect.description || '-' }}
                        </q-item-label>
                        <div class="row items-center q-gutter-xs q-mt-xs">
                          <q-chip dense size="sm" :color="defect.severity === 'Major' ? 'red-1' : 'orange-1'" text-color="dark">
                            {{ defect.severity }}
                          </q-chip>
                          <q-chip dense size="sm" color="grey-2" text-color="dark">
                            {{ defectStatusLabel(defect.status) }}
                          </q-chip>
                          <q-icon
                            :name="getDefectPlanId(defect) ? 'place' : 'location_off'"
                            :color="getDefectPlanId(defect) ? 'positive' : 'warning'"
                            size="20px"
                          >
                            <q-tooltip>
                              {{ getDefectPlanId(defect) ? t('adminJobs.construction.planPinned') : t('adminJobs.construction.planNotPinned') }}
                            </q-tooltip>
                          </q-icon>
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>

                  <!-- Pagination -->
                  <div class="row justify-center q-mt-md q-mb-md" v-if="totalPages > 1">
                    <q-pagination
                      v-model="currentPage"
                      :max="totalPages"
                      color="grey-8"
                      active-color="primary"
                      active-text-color="white"
                      boundary-links
                      direction-links
                      gutter="sm"
                    />
                  </div>
                </div>
              </q-card>
            </div>

            <div class="col-12 col-md-7">
              <q-card flat bordered class="card-round review-panel column no-wrap" style="height: 100%;">
                <div class="col scroll">
                  <q-card-section v-if="!selectedDefect" class="column items-center q-py-xl">
                    <q-icon name="edit_note" size="56px" color="grey-4" />
                    <div class="text-body2 text-grey-6 q-mt-sm text-center">
                      {{ roundDefectsError ? t('adminJobs.construction.cannotEditLoadFailed') : t('adminJobs.construction.selectDefectToEdit') }}
                    </div>
                  </q-card-section>

                  <template v-else>
                    <q-card-section>
                      <div class="row items-center justify-between q-mb-md">
                        <div>
                          <div class="text-subtitle2 text-weight-bold">
                            {{ t('adminJobs.construction.editDefectTitle', { id: selectedDefect.defectId }) }}
                          </div>
                          <div class="text-caption text-grey-6">{{ getDefectRoomLabel(selectedDefect) }}</div>
                          <div v-if="selectedDefectPlanId" class="q-mt-xs">
                            <q-btn
                              flat
                              dense
                              no-caps
                              size="sm"
                              color="primary"
                              icon="place"
                              :label="t('components.planPosition.viewButton')"
                              class="bg-blue-1 text-primary q-px-sm"
                              style="border-radius: 6px; font-weight: 500;"
                              @click="showPlanDialog = true"
                            />
                          </div>
                        </div>
                      </div>

                      <div class="q-mb-md text-center">
                        <q-img
                          v-if="selectedDefect.imageUrl"
                          :src="getImageUrl(selectedDefect.imageUrl) ?? ''"
                          style="max-height: 250px; border-radius: 8px; cursor: pointer"
                          fit="contain"
                          @click="viewDefectImage"
                        >
                          <template v-slot:error>
                            <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                              {{ t('adminJobs.construction.imageLoadFailed') }}
                            </div>
                          </template>
                        </q-img>
                        <div v-else class="bg-grey-2 flex flex-center" style="height: 150px; border-radius: 8px">
                          <q-icon name="image_not_supported" size="40px" color="grey-5" />
                        </div>
                      </div>

                      <div class="column q-gutter-md">
                        <q-input
                          outlined
                          dense
                          type="textarea"
                          rows="4"
                          v-model="defectEditForm.description"
                          :label="t('adminJobs.construction.defectDescriptionLabel')"
                        />

                        <q-select
                          outlined
                          dense
                          emit-value
                          map-options
                          v-model="defectEditForm.severity"
                          :options="severityOptions"
                          :label="t('adminJobs.construction.severityLabel')"
                        />

                        <q-select
                          outlined
                          dense
                          multiple
                          use-chips
                          emit-value
                          map-options
                          v-model="defectEditForm.subCategoryIds"
                          :options="defectSubCategoryOptions"
                          :loading="isLoadingDefectMaster"
                          :label="t('adminJobs.construction.defectTypeLabel')"
                        />

                        <q-file
                          outlined
                          dense
                          clearable
                          accept="image/*"
                          v-model="defectEditForm.file"
                          :label="t('adminJobs.construction.changeDefectImage')"
                        >
                          <template #prepend>
                            <q-icon name="image" />
                          </template>
                        </q-file>
                      </div>
                    </q-card-section>

                    <q-separator />

                    <q-card-actions align="right" class="q-pa-md">
                      <q-btn flat color="grey-7" :label="t('adminJobs.construction.cancel')" no-caps @click="resetSelectedDefectForm" />
                      <q-btn
                        unelevated
                        color="primary"
                        icon="save"
                        :label="t('adminJobs.construction.save')"
                        no-caps
                        :loading="isSavingDefect"
                        @click="saveDefectChanges"
                      />
                    </q-card-actions>
                  </template>
                </div>

                <!-- Report Management Section -->
                <div class="col-auto bg-blue-grey-1 q-pa-md" style="border-radius: 0 0 16px 16px;">
                  <div class="row items-center justify-between">
                    <div class="text-subtitle2 text-weight-bold text-primary">{{ t('adminJobs.construction.reportManagementTitle') }}</div>
                    <div class="row q-gutter-x-sm">
                      <q-btn
                        unelevated
                        color="primary"
                        icon="summarize"
                        :label="t('adminJobs.construction.summarizeReport')"
                        class="text-weight-bold"
                        style="border-radius: 8px"
                        no-caps
                        @click="goToSummaryReport(selectedRound)"
                      />
                      <q-btn
                        v-if="selectedRound?.summaryCompletedAt"
                        outline
                        color="primary"
                        icon="visibility"
                        :label="t('adminJobs.construction.viewReportPdf')"
                        class="text-weight-bold"
                        style="border-radius: 8px"
                        no-caps
                        :loading="isLoadingReport"
                        @click="selectedRound && handleViewReport(selectedRound)"
                      />
                    </div>
                  </div>
                </div>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Construction Report Dialog -->
    <q-dialog v-model="showReportDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-1 column no-wrap full-height">
        <q-toolbar class="bg-white shadow-1">
          <q-btn flat round dense icon="close" v-close-popup />
          <q-toolbar-title class="text-subtitle1 text-weight-bold">
            {{ t('adminJobs.construction.dailyConstructionReportTitle', { number: selectedRound?.roundNumber ?? '-' }) }}
          </q-toolbar-title>

          <q-btn
            unelevated
            color="primary"
            icon="download"
            :label="t('adminJobs.construction.downloadPdf')"
            no-caps
            class="q-mr-sm"
            @click="constructionPdfRef?.printPdf()"
          />

          <q-btn
            unelevated
            color="warning"
            icon="edit"
            :label="t('adminJobs.construction.editInspection')"
            no-caps
            class="q-mr-sm"
            @click="goToEditConstruction(selectedRound)"
          />

          <q-btn
            unelevated
            color="positive"
            icon="verified"
            :label="approvalButtonLabel"
            no-caps
            :disable="!canApproveSelectedRound"
            :loading="isApprovingRound"
            @click="confirmApproveRound"
          />
        </q-toolbar>

        <q-card-section class="col q-pa-md" style="overflow-y: auto;">
          <ConstructionReportPdf ref="constructionPdfRef" v-if="selectedConstructionReport" :report="selectedConstructionReport" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import { useUserStore } from '../stores/useUser';
import { useTeamStore } from '../stores/useTeam';
import { useConstructionDailyReportStore } from 'src/stores/useConstructionDailyReport';
import type { ExtendedConstructionReport } from 'src/stores/useConstructionDailyReport';
import ConstructionReportPdf from 'src/components/ConstructionReportPdf.vue';
import type { Defect, HousePlan } from 'src/models';
import InspectionItemCard from '../components/InspectionItemCard.vue';
import PlanPositionDialog from '../components/PlanPositionDialog.vue';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import { useLocalizedField } from 'src/composables/useLocalizedField';
import { buildGoogleMapsUrl, parseCoordinate } from 'src/composables/useMapLocation';
import { useJobStatus, roundStatusCode, jobStatusCode } from 'src/composables/useJobStatus';

const pdfSpinner = createIconSpinner('picture_as_pdf');
const detailSpinner = createIconSpinner('construction');

const { t, locale } = useI18n();
const { jobStatusLabel } = useJobStatus();
const { pickLocalized } = useLocalizedField();
const constructionPdfRef = ref<InstanceType<typeof ConstructionReportPdf> | null>(null);

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

function defectStatusLabel(status: string): string {
  switch (status) {
    case 'verified':
      return t('adminJobs.construction.statusVerified');
    case 'repaired':
      return t('adminJobs.construction.statusRepaired');
    case 'rejected':
      return t('adminJobs.construction.statusRejected');
    case 'pending_repair':
    default:
      return t('adminJobs.construction.statusPendingRepair');
  }
}

const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

interface AddressEntity {
  houseNumber?: string;
  floor?: string;
  soi?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

interface JobApiResponse {
  jobId: number;
  branchId?: number | null;
  projectName: string;
  projectNameEn?: string | null;
  usableArea: number;
  projectImageUrl?: string;
  locationCoordinate?: string | null;
  customer?: {
    fullName?: string;
    phoneNumber?: string;
    phoneNumber2?: string;
    phoneNumber3?: string;
    email?: string;
    email2?: string;
    email3?: string;
    lineId?: string;
  };
  contractor?: { fullName?: string; phoneNumber?: string; email?: string; companyName?: string };
  createdBy?: { fullName?: string; phoneNumber?: string; email?: string; lineId?: string } | null;
  houseType?: { name?: string; nameEn?: string | null };
  address?: AddressEntity;
  createdAt?: string;
  status?: string;
  contractorProgress?: number;
  isReadyForRound2?: boolean;
  rounds?: {
    roundId: number;
    teamMembers?: {
      team?: { team_Id?: number };
    }[];
  }[];
}

interface RoundApiResponse {
  roundId: number;
  roundNumber: number;
  scheduledDate: string;
  status: string;
  teamMember?: {
    inspector?: { fullName?: string };
  };
  teamMembers?: {
    inspector?: { fullName?: string };
    team?: { team_name?: string };
  }[];
  summaryCompletedAt?: string | null;
}

interface RoundView {
  id: number;
  roundNumber: number;
  date: string;
  status: string;
  statusKey: string;
  inspectors?: string[];
  summaryCompletedAt?: string | null;
}

interface DefectCategoryOption {
  label: string;
  value: number;
}

type AdminDefect = Defect & {
  inspector?: { id?: number; fullName?: string };
  round?: { roundId?: number };
};

interface TeamMemberChip {
  id: number;
  fullName: string;
}

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const userStore = useUserStore();
const reportStore = useConstructionDailyReportStore();

const jobId = computed(() => Number(route.params.id));

const showReportDialog = ref(false);
const selectedConstructionReport = ref<ExtendedConstructionReport | null>(null);
const isLoadingReport = ref(false);

const isLatestRoundNotCompleted = computed(() => {
  if (!inspectionRounds.value.length) return false;
  const latestRound = inspectionRounds.value[inspectionRounds.value.length - 1];
  if (!latestRound) return false;
  return latestRound?.statusKey !== 'APPROVED' && latestRound?.statusKey !== 'CANCELLED';
});
const isSubmittingRound = ref(false);
const isLoadingRoundDefects = ref(false);
const isSavingDefect = ref(false);
const isApprovingRound = ref(false);
const isLoadingDefectMaster = ref(false);
const jobData = ref<JobApiResponse | null>(null);
const jobTeamMembers = ref<TeamMemberChip[]>([]);
const roundDefects = ref<AdminDefect[]>([]);
const roundDefectsError = ref('');
const selectedRound = ref<RoundView | null>(null);
const selectedDefect = ref<AdminDefect | null>(null);
const showPlanDialog = ref(false);
// /defects/round/:id doesn't return a flat planId, only the joined `plan` relation — mirrors useDefectlist.ts's fallback
function getDefectPlanId(defect: AdminDefect | null): number | null {
  return defect?.planId ?? defect?.plan?.planId ?? null;
}
const selectedDefectPlanId = computed(() => getDefectPlanId(selectedDefect.value));
const defectSubCategoryOptions = ref<DefectCategoryOption[]>([]);
const showRoundReviewDialog = ref(false);

// Grouping and Pagination State
interface GroupedDefectItem {
  groupKey: string;
  roomName: string;
  roomId: number;
  floorLabel: string;
  roomType: string;
  severity: string;
  totalItems: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  failPercentage: number;
  defects: AdminDefect[];
}

const getFloorLabel = (d: AdminDefect) => d.floor?.label ?? t('adminJobs.construction.floorNotSpecified');
const getRoomName = (d: AdminDefect) =>
  d.subRoom?.roomName ?? d.room?.roomName ?? t('adminJobs.construction.roomNotSpecified');
const getRoomType = (d: AdminDefect) => d.room?.roomName ?? t('adminJobs.construction.roomTypeNotSpecified');

const groupedDefects = computed<GroupedDefectItem[]>(() => {
  const map = new Map<string, GroupedDefectItem>();

  for (const defect of roundDefects.value) {
    const key = `room__${getRoomName(defect)}__${getFloorLabel(defect)}`;

    if (!map.has(key)) {
      map.set(key, {
        groupKey: key,
        roomName: getRoomName(defect),
        roomId: defect.room?.roomId ?? defect.defectId,
        floorLabel: getFloorLabel(defect),
        roomType: getRoomType(defect),
        severity: defect.severity,
        totalItems: 0,
        passCount: 0,
        failCount: 0,
        passPercentage: 0,
        failPercentage: 0,
        defects: [],
      });
    }

    const group = map.get(key)!;
    group.totalItems++;
    group.defects.push(defect);
    if (defect.status === 'verified') group.passCount++;
    else group.failCount++;
  }

  for (const g of map.values()) {
    g.passPercentage = g.totalItems > 0 ? Math.round((g.passCount / g.totalItems) * 100) : 0;
    g.failPercentage = 100 - g.passPercentage;
  }

  return [...map.values()];
});

const selectedGroupKey = ref<string | null>(null);

const currentRoomDefects = computed(() => {
  if (!selectedGroupKey.value) return [];
  const group = groupedDefects.value.find(g => g.groupKey === selectedGroupKey.value);
  return group?.defects ?? [];
});

const currentPage = ref(1);
const itemsPerPage = 10;
const totalPages = computed(() => Math.ceil(currentRoomDefects.value.length / itemsPerPage));

const paginatedDefects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return currentRoomDefects.value.slice(start, start + itemsPerPage);
});

watch(selectedGroupKey, () => {
  currentPage.value = 1;
});

watch(selectedRound, () => {
  selectedGroupKey.value = null;
});

const defectEditForm = ref<{
  description: string;
  severity: string;
  status: string;
  subCategoryIds: number[];
  file: File | null;
}>({
  description: '',
  severity: 'Minor',
  status: 'pending_repair',
  subCategoryIds: [],
  file: null,
});

const severityOptions = [
  { label: 'Minor', value: 'Minor' },
  { label: 'Major', value: 'Major' },
];





const formatRoundDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  const formattedDate = date.toLocaleDateString(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  });

  const hour = date.getHours();
  if (hour === 9) {
    return `${formattedDate} 09:00-12:00 (${t('adminJobs.construction.morningRoundSuffix')})`;
  } else if (hour === 13) {
    return `${formattedDate} 13:00-16:00 (${t('adminJobs.construction.afternoonRoundSuffix')})`;
  }

  return formattedDate;
};

const mapRoundToView = (round: RoundApiResponse) => {
  let inspectors: string[] = [];

  if (round.teamMembers && round.teamMembers.length > 0) {
    inspectors = round.teamMembers.map(member => {
      if (member.team?.team_name) {
        return `[${t('adminJobs.construction.teamTag')}] ${member.team.team_name}`;
      } else if (member.inspector?.fullName) {
        return member.inspector.fullName;
      }
      return t('adminJobs.construction.nameNotSpecified');
    });
  } else if (round.teamMember?.inspector?.fullName) {
    // Fallback for old data structure if any
    inspectors = [round.teamMember.inspector.fullName];
  } else if (jobTeamMembers.value.length > 0) {
    inspectors = jobTeamMembers.value.map((m) => m.fullName);
  } else {
    inspectors = [t('adminJobs.construction.notSpecified')];
  }

  return {
    id: round.roundId,
    roundNumber: round.roundNumber,
    date: formatRoundDate(round.scheduledDate),
    status: roundStatusCode(round.status),
    statusKey: round.status,
    inspectors,
    summaryCompletedAt: round.summaryCompletedAt,
  };
};

async function fetchJobDetails() {
  const { data } = await api.get<JobApiResponse>(`/inspection-jobs/${jobId.value}`);
  jobData.value = data;
}

const housePlans = ref<HousePlan[]>([]);

async function fetchHousePlans() {
  try {
    const { data } = await api.get<HousePlan[]>(`/inspection-jobs/${jobId.value}/house-plans`);
    housePlans.value = data;
  } catch (error) {
    console.error('Failed to fetch house plans', error);
  }
}

async function fetchTeamMembers() {
  const { data } = await api.get<TeamMemberChip[]>(`/assignments/job/${jobId.value}`);
  jobTeamMembers.value = data;
}

async function fetchRounds() {
  const { data } = await api.get<RoundApiResponse[]>(`/daily-reports/${jobId.value}/rounds`);
  return data;
}

function applyRounds(rounds: RoundApiResponse[]) {
  inspectionRounds.value = rounds.map(mapRoundToView);
}

/*
async function fetchDefectMasterData() {
  if (defectSubCategoryOptions.value.length > 0) return;

  isLoadingDefectMaster.value = true;
  try {
    const { data } = await api.get<
      { subCategoryId: number; name: string; category?: { name?: string } }[]
    >('/defect-sub-categories');
    defectSubCategoryOptions.value = data.map((item) => ({
      value: item.subCategoryId,
      label: item.category?.name ? `${item.category.name} - ${item.name}` : item.name,
    }));
  } catch (error) {
    console.error('Failed to load defect master data:', error);
    $q.notify({
      message: 'โหลดประเภท defect ไม่สำเร็จ',
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isLoadingDefectMaster.value = false;
  }
}
*/

async function loadPageData() {
  $q.loading.show({
    spinner: detailSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  try {
    await Promise.all([
      fetchJobDetails(),
      fetchTeamMembers(),
      fetchHousePlans(),
      teamStore.fetchAllTeams() // ดึงข้อมูลทีมทั้งหมดไว้กรองตามสาขาของงาน
    ]);
    const rounds = await fetchRounds();
    applyRounds(rounds);
    await userStore.fetchUsers().catch((err) => {
      console.warn('Failed to fetch users for inspector picker:', err);
    });

    // เข้ามาจากการแจ้งเตือน (มี roundId ใน query) ให้เปิด dialog รีวิวรอบนั้นให้เลย
    const targetRoundId = Number(route.query.roundId);
    if (targetRoundId) {
      const targetRound = inspectionRounds.value.find((r) => r.id === targetRoundId);
      if (targetRound) {
        void openRoundReview(targetRound);
      }
    }
  } catch (error) {
    console.error('Failed to load job detail:', error);
    $q.notify({
      message: t('adminJobs.construction.loadJobDataFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    $q.loading.hide();
  }
}

onMounted(() => {
  void loadPageData();
});

const job = computed(() => {
  const data = jobData.value;
  if (!data) {
    return {
      projectName: '-',
      projectNameEn: '',
      houseType: '-',
      area: '-',
      appointmentDate: '-',
      address: '-',
      customerName: '-',
      customerPhone: '-',
      customerPhone2: '',
      customerPhone3: '',
      customerEmail: '-',
      customerEmail2: '',
      customerEmail3: '',
      coordName: '-',
      coordPhone: '-',
      coordEmail: '-',
      coordLine: '-',
      housePlanImage: null as string | null,
      projectImage: null as string | null,
      status: '-',
      statusKey: '',
      contractorProgress: 0,
      isReadyForRound2: false,
    };
  }

  const formatAddressStr = (addr?: AddressEntity) => {
    if (!addr) return '-';

    const parts = [];
    if (addr.houseNumber) parts.push(t('common.address.houseNumber', { value: addr.houseNumber }));
    if (addr.floor && addr.floor !== '-' && addr.floor !== '') parts.push(t('common.address.floor', { value: addr.floor }));
    if (addr.soi && addr.soi !== '-' && addr.soi !== '') parts.push(t('common.address.soi', { value: addr.soi }));
    if (addr.subDistrict) parts.push(t('common.address.subDistrict', { value: addr.subDistrict }));
    if (addr.district) parts.push(t('common.address.district', { value: addr.district }));
    if (addr.province) parts.push(t('common.address.province', { value: addr.province }));
    if (addr.postalCode) parts.push(`${addr.postalCode}`);

    return parts.length > 0 ? parts.join(' ') : '-';
  };

  const latestRound = inspectionRounds.value[inspectionRounds.value.length - 1];

  return {
    projectName: data.projectName || '-',
    projectNameEn: data.projectNameEn || '',
    houseType: pickLocalized(data.houseType?.name, data.houseType?.nameEn) || '-',
    area: data.usableArea?.toString() || '-',
    appointmentDate: latestRound?.date || (data.createdAt ? new Date(data.createdAt).toLocaleDateString(locale.value) : '-'),
    address: formatAddressStr(data.address),
    customerName: data.customer?.fullName || '-',
    customerPhone: data.customer?.phoneNumber || '-',
    customerPhone2: data.customer?.phoneNumber2 || '',
    customerPhone3: data.customer?.phoneNumber3 || '',
    customerEmail: data.customer?.email || '-',
    customerEmail2: data.customer?.email2 || '',
    customerEmail3: data.customer?.email3 || '',
    coordName: data.createdBy?.fullName || '-',
    coordPhone: data.createdBy?.phoneNumber || '-',
    coordEmail: data.createdBy?.email || '-',
    coordLine: data.createdBy?.lineId || '-',
    housePlanImage: housePlans.value[0] ? getImageUrl(housePlans.value[0].imageUrl) : null,
    projectImage: getImageUrl(data.projectImageUrl),
    status: latestRound?.status || jobStatusCode(data.status) || data.status || '-',
    statusKey: (latestRound?.status || data.status) === 'Active' ? 'in_progress' : 'waiting',
    contractorProgress: data.contractorProgress || 0,
    isReadyForRound2: data.isReadyForRound2 || false,
  };
});

// Reactive inspection rounds
const inspectionRounds = ref<{
  id: number;
  roundNumber: number;
  date: string;
  status: string;
  statusKey: string;
  inspectors?: string[];
}[]>([]);

const canApproveSelectedRound = computed(() => selectedRound.value?.statusKey === 'SUBMITTED');
const approvalButtonLabel = computed(() =>
  selectedRound.value?.statusKey === 'APPROVED'
    ? t('adminJobs.construction.approved')
    : t('adminJobs.construction.approve'),
);

const goBack = async () => {
  await router.push('/admin/work');
};

const goToSummaryReport = (round: { id: number } | null | undefined) => {
  if (!round?.id) return;
  void router.push(`/admin/report/${round.id}`);
};

const goToEditConstruction = (round: { id: number } | null | undefined) => {
  if (!round?.id) return;
  void router.push(`/admin/construction-inspect/${round.id}`);
};

const onEdit = async () => {
  await router.push(`/admin/work/create?editId=${jobId.value}`);
};

const openGoogleMaps = () => {
  if (!jobData.value) return;

  // ถ้าปักหมุดไว้ ให้ไปที่พิกัดนั้นตรงๆ
  const pinned = parseCoordinate(jobData.value.locationCoordinate);
  if (pinned) {
    window.open(buildGoogleMapsUrl(pinned), '_blank');
    return;
  }

  const projectName = jobData.value.projectName || '';
  const addr = jobData.value.address;

  const addressParts = [
    projectName,
    addr?.houseNumber ? `เลขที่ ${addr.houseNumber}` : '',
    addr?.floor && addr.floor !== '-' ? `ชั้น ${addr.floor}` : '',
    addr?.soi && addr.soi !== '-' ? `ซอย ${addr.soi}` : '',
    addr?.subDistrict ? `ต.${addr.subDistrict}` : '',
    addr?.district ? `อ.${addr.district}` : '',
    addr?.province ? `จ.${addr.province}` : '',
    addr?.postalCode || ''
  ];

  const searchQuery = addressParts.filter(Boolean).join(' ');

  if (searchQuery.trim() && (projectName || addr?.province)) {
    const encodedQuery = encodeURIComponent(searchQuery);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    window.open(mapsUrl, '_blank');
  } else {
    $q.notify({
      message: t('adminJobs.construction.noAddressForMapSearch'),
      color: 'warning',
      position: 'top',
      icon: 'warning'
    });
  }
};

const showImageDialog = ref(false);
const currentImageUrl = ref('');

const viewProjectImage = () => {
  if (job.value.projectImage) {
    currentImageUrl.value = job.value.projectImage;
    showImageDialog.value = true;
  }
};


const viewDefectImage = () => {
  if (!selectedDefect.value?.imageUrl) return;
  currentImageUrl.value = getImageUrl(selectedDefect.value.imageUrl) ?? selectedDefect.value.imageUrl;
  showImageDialog.value = true;
};

function getDefectRoomLabel(defect: AdminDefect) {
  const floor = defect.floor?.label;
  const room = defect.room?.roomName;
  const subRoom = defect.subRoom?.roomName;
  return [floor, room, subRoom].filter(Boolean).join(' / ') || t('adminJobs.construction.roomNotSpecified');
}

async function openRoundReview(round: RoundView) {
  selectedRound.value = round;
  selectedDefect.value = null;
  roundDefects.value = [];
  roundDefectsError.value = '';
  showRoundReviewDialog.value = true;

  await fetchRoundDefects(round.id);
}

async function handleViewReport(round: RoundView) {
  if (!round.summaryCompletedAt) {
    $q.notify({ type: 'warning', message: t('adminJobs.construction.summarizeReportFirst') });
    return;
  }
  isLoadingReport.value = true;
  $q.loading.show({
    spinner: pdfSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  try {
    const reportData = await reportStore.fetchReportByRound(round.id);
    if (reportData) {
      selectedConstructionReport.value = {
        ...reportData,
        round: {
          roundNumber: round.roundNumber,
          job: jobData.value,
        },
        contractorName:
          jobData.value?.contractor?.fullName ||
          jobData.value?.contractor?.companyName ||
          '-',
        reporterName: round.inspectors?.join(', ') || '-',
      };
      showReportDialog.value = true;
    } else {
      $q.notify({
        message: t('adminJobs.construction.noConstructionReportFound'),
        color: 'warning',
        icon: 'warning',
        position: 'top',
      });
    }
  } catch (err) {
    console.error(err);
    $q.notify({
      message: t('adminJobs.construction.loadReportFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    $q.loading.hide();
    isLoadingReport.value = false;
  }
}

const showHousePlanDialog = ref(false);

const viewPlan = () => {
  if (housePlans.value.length) {
    showHousePlanDialog.value = true;
  } else {
    $q.notify({
      message: t('adminJobs.construction.noHousePlanImage'),
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
  }
};

async function fetchRoundDefects(roundId: number) {
  isLoadingRoundDefects.value = true;
  roundDefectsError.value = '';
  try {
    const { data } = await api.get<AdminDefect[]>(`/defects/round/${roundId}`);
    roundDefects.value = data;
    selectedDefect.value = null;
  } catch (error) {
    console.error('Failed to load round defects:', error);
    roundDefects.value = [];
    selectedDefect.value = null;
    roundDefectsError.value = 'adminJobs.construction.loadDefectsFailed';
    $q.notify({
      message: t('adminJobs.construction.loadDefectsFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isLoadingRoundDefects.value = false;
  }
}

function retryFetchRoundDefects() {
  if (!selectedRound.value) return;
  void fetchRoundDefects(selectedRound.value.id);
}

function selectDefect(defect: AdminDefect) {
  selectedDefect.value = defect;
  defectEditForm.value = {
    description: defect.description || '',
    severity: defect.severity || 'Minor',
    status: defect.status || 'pending_repair',
    subCategoryIds: defect.subCategories?.map((item) => item.subCategoryId) ?? [],
    file: null,
  };
}

function resetSelectedDefectForm() {
  if (selectedDefect.value) {
    selectDefect(selectedDefect.value);
  }
}

async function saveDefectChanges() {
  if (!selectedDefect.value) return;

  isSavingDefect.value = true;
  try {
    const formData = new FormData();
    formData.append('description', defectEditForm.value.description || '-');
    formData.append('severity', defectEditForm.value.severity);
    formData.append('status', defectEditForm.value.status);
    defectEditForm.value.subCategoryIds.forEach((id) => {
      formData.append('subCategoryIds', String(id));
    });
    if (defectEditForm.value.file) {
      formData.append('file', defectEditForm.value.file);
    }

    await api.patch(`/defects/${selectedDefect.value.defectId}`, formData);

    if (selectedRound.value) {
      await fetchRoundDefects(selectedRound.value.id);
      const updated = roundDefects.value.find((d) => d.defectId === selectedDefect.value?.defectId);
      if (updated) selectDefect(updated);
    }

    $q.notify({
      message: t('adminJobs.construction.saveDefectSuccess'),
      color: 'positive',
      icon: 'check_circle',
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to update defect:', error);
    $q.notify({
      message: t('adminJobs.construction.saveDefectFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isSavingDefect.value = false;
  }
}

function confirmApproveRound() {
  if (!selectedRound.value) return;

  $q.dialog({
    title: t('adminJobs.construction.confirmApproveTitle'),
    message: t('adminJobs.construction.confirmApproveMessage', {
      number: selectedRound.value.roundNumber,
    }),
    ok: { label: t('adminJobs.construction.approve'), color: 'positive' },
    cancel: { label: t('adminJobs.construction.cancel'), flat: true, color: 'grey-7' },
    persistent: true,
  }).onOk(() => {
    void approveSelectedRound();
  });
}

async function approveSelectedRound() {
  if (!selectedRound.value) return;

  isApprovingRound.value = true;
  try {
    await api.patch(`/inspection-rounds/${selectedRound.value.id}/approve`);
    const rounds = await fetchRounds();
    applyRounds(rounds);
    await fetchJobDetails(); // Fetch job details to update job status
    const updatedRound = inspectionRounds.value.find((round) => round.id === selectedRound.value?.id);
    selectedRound.value = updatedRound ?? null;

    $q.notify({
      message: t('adminJobs.construction.approveRoundSuccess'),
      color: 'positive',
      icon: 'verified',
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to approve round:', error);
    $q.notify({
      message: t('adminJobs.construction.approveRoundFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isApprovingRound.value = false;
  }
}

// Dialog form state
const showCreateRoundDialog = ref(false);
const scheduledDate = ref('');
const showDatePicker = ref(false);
const timeInput = ref('09:00:00');

const dateOptions = (dateStr: string) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}/${month}/${day}`;
  return dateStr >= todayStr;
};
const assignmentMode = ref<'team' | 'individual'>('team');
const selectedTeam = ref<number | null>(null);
const selectedInspectors = ref<{ label: string; value: number }[]>([]);
const teamStore = useTeamStore();

// ทีมที่เลือกได้ต้องอยู่สาขาเดียวกับงาน (งานที่ไม่ระบุสาขาเลือกได้ทุกทีม)
const branchTeamOptions = computed(() => {
  const jobBranchId = jobData.value?.branchId ?? null;
  return teamStore.allTeams
    .filter(
      (team) =>
        jobBranchId === null || team.branchId === jobBranchId || team.team_Id === selectedTeam.value,
    )
    .map((team) => ({ label: team.team_name, value: team.team_Id }));
});

// Predefined inspector options list
const inspectorOptions = computed(() => {
  const storeInspectors = userStore.users
    .filter((u) => u.role === 'inspector' || String(u.role).toLowerCase() === 'inspector')
    .map((u) => ({
      label: u.fullName,
      value: u.id,
    }));

  if (storeInspectors.length > 0) {
    return storeInspectors;
  }

  const assignedInspectors = jobTeamMembers.value.map((m) => ({
    label: m.fullName,
    value: m.id,
  }));

  return assignedInspectors;
});

const filteredInspectorOptions = ref<{ label: string; value: number }[]>([]);

const filterInspectors = (val: string, update: (callback: () => void) => void) => {
  update(() => {
    const needle = val.toLowerCase().trim();
    if (!needle) {
      filteredInspectorOptions.value = inspectorOptions.value;
    } else {
      filteredInspectorOptions.value = inspectorOptions.value.filter(
        (v) => v.label.toLowerCase().indexOf(needle) > -1
      );
    }
  });
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const [datePart = '', timePart = ''] = dateStr.split(' ');
  if (!datePart) return dateStr;
  const parts = datePart.replace(/\//g, '-').split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${month}/${day}/${year}` + (timePart ? ` ${timePart}` : '');
};

const onCreateRound = () => {
  // เดิมเทียบกับสถานะของรอบล่าสุดเท่านั้น — เช็คว่ามีรอบก่อน กันงานที่ยังไม่มีรอบแต่ job.status เป็น Completed
  if (inspectionRounds.value.length > 0 && job.value.status === 'COMPLETED' && job.value.contractorProgress < 50) {
    $q.dialog({
      title: t('adminJobs.construction.confirmCreateRoundTitle'),
      message: t('adminJobs.construction.confirmCreateRoundMessage', {
        percent: Math.round(job.value.contractorProgress),
      }),
      cancel: { label: t('adminJobs.construction.cancel'), flat: true, color: 'grey-7' },
      ok: { label: t('adminJobs.construction.confirmCreate'), color: 'primary' },
      persistent: true,
    }).onOk(() => {
      openCreateRoundDialog();
    });
  } else {
    openCreateRoundDialog();
  }
};

const openCreateRoundDialog = () => {
  scheduledDate.value = '';
  timeInput.value = '09:00:00';
  selectedInspectors.value = [];
  
  // Try to pre-fill from latest round if it exists
  const latestRoundRaw = jobData.value?.rounds?.sort((a: { roundId: number }, b: { roundId: number }) => b.roundId - a.roundId)[0];
  if (latestRoundRaw && latestRoundRaw.teamMembers && latestRoundRaw.teamMembers.length > 0) {
    const teamMember = latestRoundRaw.teamMembers[0];
    if (teamMember && teamMember.team && teamMember.team.team_Id) {
      assignmentMode.value = 'team';
      selectedTeam.value = teamMember.team.team_Id;
    } else {
      assignmentMode.value = 'individual';
      selectedTeam.value = null;
    }
  } else {
    assignmentMode.value = 'team';
    selectedTeam.value = null;
  }

  showCreateRoundDialog.value = true;
};

const submitCreateRound = async () => {
  if (!scheduledDate.value) {
    $q.notify({
      message: t('adminJobs.construction.selectDateRequired'),
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  if (assignmentMode.value === 'team' && !selectedTeam.value && selectedInspectors.value.length === 0) {
    $q.notify({
      message: t('adminJobs.construction.selectTeamOrInspectorRequired'),
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  if (assignmentMode.value === 'individual' && selectedInspectors.value.length === 0) {
    $q.notify({
      message: t('adminJobs.construction.selectInspectorRequired'),
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  isSubmittingRound.value = true;
  try {
    // 1. สร้างรอบการตรวจ โดยอิงจากโหมด
    interface RoundPayload {
      scheduledDate: string;
      status: string;
      teamId?: number;
      inspectorId?: number;
    }

    const startTime = timeInput.value.split(' - ')[0];

    const roundPayload: RoundPayload = {
      scheduledDate: startTime ? `${scheduledDate.value} ${startTime}` : scheduledDate.value,
      status: 'SCHEDULED',
    };

    if (assignmentMode.value === 'team' && selectedTeam.value) {
      roundPayload.teamId = selectedTeam.value;
    } else if (selectedInspectors.value.length > 0) {
      // ถ้าไม่มีทีมให้เอาคนแรกเป็นตัวแทนสร้างรอบ
      const firstInspector = selectedInspectors.value[0];
      if (firstInspector) {
        roundPayload.inspectorId = firstInspector.value;
      }
    }

    const { data: createdRoundResp } = await api.post(`/daily-reports/${jobId.value}/rounds`, roundPayload);

    // 2. สำหรับคนที่เหลือ ให้ยิงเข้า /assignments พร้อม roundId ของรอบที่เพิ่งสร้าง
    // เพื่อผูกสิทธิ์เฉพาะรอบนี้ ไม่ปลดล็อกทั้ง job
    let extraInspectors = selectedInspectors.value;
    if (assignmentMode.value === 'individual' || (!selectedTeam.value && assignmentMode.value === 'team')) {
      // ตัดคนแรกออก เพราะถูกส่งไปสร้างรอบแล้ว
      extraInspectors = selectedInspectors.value.slice(1);
    }

    for (const inspector of extraInspectors) {
      await api.post('/assignments', {
        jobId: jobId.value,
        inspectorId: inspector.value,
        roundId: createdRoundResp.roundId,
      });
    }

    await fetchTeamMembers();
    const rounds = await fetchRounds();
    applyRounds(rounds);
    await fetchJobDetails();

    const createdRound = inspectionRounds.value[inspectionRounds.value.length - 1];
    $q.notify({
      message: t('adminJobs.construction.createRoundSuccess', {
        number: createdRound?.roundNumber ?? '',
      }),
      color: 'positive',
      icon: 'check_circle',
      position: 'top',
    });

    showCreateRoundDialog.value = false;
  } catch (error) {
    console.error('Failed to create round:', error);
    $q.notify({
      message: t('adminJobs.construction.createRoundFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isSubmittingRound.value = false;
  }
};

// status คือรหัสจาก useJobStatus (IN_PROGRESS/PENDING_APPROVAL/COMPLETED) ไม่ใช่ข้อความที่แสดง
function getRoundStatusColor(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'orange-2';
    case 'PENDING_APPROVAL':
      return 'blue-2';
    case 'COMPLETED':
      return 'green-2';
    default:
      return 'grey-3';
  }
}
</script>

<style scoped>
.header-bar {
  position: sticky;
  top: 0;
  z-index: 100;
}

.job-back-icon {
  position: relative;
  z-index: 2;
}

.job-detail-title {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
  font-size: 21px;
  letter-spacing: 0.01em;
}

.detail-content {
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
}
@media (min-width: 1024px) {
  .detail-content {
    max-width: 820px;
    padding: 24px 32px;
  }
}
@media (min-width: 1440px) {
  .detail-content {
    max-width: 920px;
  }
}

.review-dialog-content {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  overflow-y: auto;
}

.review-panel {
  min-height: 280px;
}

.card-round {
  border-radius: 16px;
  border-color: #eeeeee;
}

.house-image-wrapper {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.house-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.house-img-placeholder {
  width: 100%;
  height: 200px;
}

@media (min-width: 1024px) {
  .house-image-wrapper,
  .house-img,
  .house-img-placeholder {
    height: 280px;
  }
}

.map-btn {
  background: #e8f0fe;
  color: var(--q-primary);
  border-radius: 12px;
  width: 40px;
  height: 40px;
}

.plan-thumb {
  width: 100px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.plan-img {
  width: 100%;
  height: 100%;
}
.custom-toggle {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.custom-toggle :deep(.q-btn) {
  font-weight: 500;
}
.plan-thumb-empty {
  width: 100px;
  height: 80px;
  border-radius: 12px;
  border: 1.5px dashed #e0e0e0;
}

.plan-btn {
  border-radius: 50px;
  padding: 0 20px;
  height: 40px;
}

.create-round-btn {
  border-radius: 50px;
  height: 48px;
  font-size: 15px;
}

/* Create Round Dialog styling matching the mockup precisely */
.create-round-card {
  border-radius: 24px !important;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.text-dark-blue {
  color: #1E293B;
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
}

.close-dialog-btn {
  font-size: 11px;
}

.field-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #475569;
  letter-spacing: 0.2px;
}

.font-sub {
  font-size: 11px;
  color: #64748B;
}

/* Custom Outlined Inputs with rounded edges and grey background */
.custom-input, .custom-select {
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  background-color: #F8FAFC;
  padding: 2px 8px;
  transition: all 0.2s ease-in-out;
}

.custom-input:hover, .custom-select:hover {
  border-color: #CBD5E1;
}

.custom-input.q-field--focused, .custom-select.q-field--focused {
  border-color: #3B82F6;
  background-color: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

/* Customize Chips */
.custom-select :deep(.q-chip) {
  background: #E2E8F0;
  color: #1E293B;
  font-weight: 500;
  border-radius: 6px;
}

/* Custom Buttons matching screenshot */
.cancel-btn {
  border: 1px solid #E2E8F0 !important;
  color: #475569 !important;
  border-radius: 50px !important;
  font-weight: 600;
  height: 48px;
  font-size: 14px;
}

.cancel-btn:hover {
  background-color: #F8FAFC !important;
  border-color: #CBD5E1 !important;
}

.submit-btn {
  background: #2563EB !important; /* Vibrant primary blue from the mockup */
  color: white !important;
  border-radius: 50px !important;
  font-weight: 600;
  height: 48px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.submit-btn:hover {
  background: #1D4ED8 !important;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

/* Style the dropdown menu items */
.custom-dropdown-popup {
  border-radius: 12px !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #E2E8F0;
}
</style>
