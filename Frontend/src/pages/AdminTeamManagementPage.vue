<template>
  <q-page class="admin-team-page bg-grey-1 q-pb-xl">
    <!-- Header Section -->
    <div class="q-px-md q-pt-md q-pb-sm text-dark header-bg">
      <div class="q-mb-md">
        <!-- <div class="text-h6 text-weight-bold text-dark">
          {{ t('adminManage.teamManagement.title') }}
        </div> -->
        <div class="text-caption text-weight">
          {{ t('adminManage.teamManagement.subtitle') }}
        </div>
      </div>

      <!-- KPI Summary Cards (2 Cards) -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-6">
          <q-card
            flat
            bordered
            class="kpi-card bg-white shadow-1 cursor-pointer"
            :class="{ 'kpi-card--active': viewMode === 'teams' && selectedBranchId === null }"
            v-ripple
            tabindex="0"
            role="button"
            @click="showTeamsView"
            @keyup.enter="showTeamsView"
          >
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar color="blue-1" text-color="primary" icon="groups" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.teamManagement.kpiTotalTeams') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ totalTeamsCount }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-6">
          <q-card
            flat
            bordered
            class="kpi-card bg-white shadow-1 cursor-pointer"
            :class="{ 'kpi-card--active': viewMode === 'branches' }"
            v-ripple
            tabindex="0"
            role="button"
            @click="showBranchesView"
            @keyup.enter="showBranchesView"
          >
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar color="deep-purple-1" text-color="deep-purple-9" icon="business" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.teamManagement.kpiTotalBranches') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ branchStore.branches.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Search Bar & Round Tune Filter Button -->
      <div class="row q-gutter-x-sm no-wrap items-center">
        <q-input
          v-model="searchQuery"
          dense
          borderless
          rounded
          :placeholder="
            viewMode === 'branches'
              ? t('adminManage.teamManagement.searchBranchPlaceholder')
              : t('adminManage.teamManagement.searchPlaceholder')
          "
          class="col search-input"
          hide-bottom-space
        >
          <template #prepend>
            <q-icon name="search" color="grey-7" />
          </template>
          <template #append v-if="searchQuery">
            <q-icon name="close" class="cursor-pointer" @click="searchQuery = ''" />
          </template>
        </q-input>

        <!-- Round Tune Filter Button -->
        <q-btn
          v-if="viewMode === 'teams'"
          round
          unelevated
          :color="selectedBranchId !== null ? 'primary' : 'white'"
          :text-color="selectedBranchId !== null ? 'white' : 'primary'"
          icon="tune"
          class="shadow-1 shrink-0"
          style="height: 44px; width: 44px; min-height: 44px; min-width: 44px"
        >
          <q-badge
            v-if="selectedBranchId !== null"
            color="red"
            floating
            rounded
            style="top: 2px; right: 2px"
          >
            1
          </q-badge>

          <q-menu anchor="bottom right" self="top right" :offset="[0, 8]" class="rounded-borders shadow-3">
            <q-list style="min-width: 220px" class="q-py-xs">
              <q-item-label header class="text-caption text-weight-bold text-grey-7">
                {{ t('adminManage.teamManagement.branchLabel') }}
              </q-item-label>
              <q-item
                v-for="chip in branchFilterChips"
                :key="String(chip.value)"
                clickable
                v-close-popup
                :active="selectedBranchId === chip.value"
                active-class="bg-blue-1 text-primary text-weight-bold"
                @click="selectedBranchId = chip.value"
              >
                <q-item-section avatar min-width="24px">
                  <q-icon name="business" size="18px" :color="selectedBranchId === chip.value ? 'primary' : 'grey-7'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ chip.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="selectedBranchId === chip.value ? 'primary' : 'grey-3'"
                    :text-color="selectedBranchId === chip.value ? 'white' : 'dark'"
                    rounded
                  >
                    {{ chip.count }}
                  </q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>

      <!-- Action Buttons Row: full width on mobile, inline right on desktop -->
      <div class="row q-col-gutter-xs q-mt-sm items-center justify-end">
        <div class="col-12 col-sm-auto">
          <q-btn
            unelevated
            color="primary"
            icon="add"
            :label="
              viewMode === 'branches'
                ? t('adminManage.branchManagement.addBranch')
                : t('adminManage.teamManagement.addNewTeam')
            "
            class="full-width action-btn-primary shadow-1"
            no-caps
            @click="viewMode === 'branches' ? openBranchForm() : openCreateForm()"
          />
        </div>
      </div>
    </div>

    <!-- Active Filter Removers (if needed) -->
    <div
      v-if="viewMode === 'teams' && selectedBranchId !== null"
      class="row items-center q-gutter-x-sm q-px-md q-my-xs"
    >
      <span class="text-caption text-grey-7 q-mr-xs">{{ t('adminManage.teamManagement.filteringLabel') }}</span>
      <q-chip
        removable
        @remove="selectedBranchId = null"
        color="blue-1"
        text-color="primary"
        dense
        class="text-weight-medium"
      >
        {{ branchOptions.find((b) => b.value === selectedBranchId)?.label }}
      </q-chip>
    </div>

    <!-- Main Content Grid -->
    <div v-if="viewMode === 'branches'" class="q-px-md q-pt-sm q-pb-md">
      <div v-if="filteredBranches.length === 0" class="text-center q-py-xl text-grey-6">
        <q-icon name="business" size="64px" class="q-mb-md" />
        <div>{{ t('adminManage.teamManagement.noBranchesFound') }}</div>
      </div>
      <div v-else class="row q-col-gutter-md">
        <div v-for="branch in filteredBranches" :key="branch.branchId" class="col-12 col-sm-6 col-md-4 card-stagger">
          <q-card
            flat
            bordered
            tabindex="0"
            role="button"
            class="branch-card cursor-pointer"
            v-ripple
            @click="openBranchForm(branch)"
            @keyup.enter="openBranchForm(branch)"
          >
            <q-card-section class="row items-center no-wrap q-pa-md">
              <q-avatar size="48px" color="indigo-1" text-color="indigo-9">
                <img v-if="branch.logoUrl" :src="getImageUrl(branch.logoUrl)" />
                <q-icon v-else name="business" />
              </q-avatar>
              <div class="col q-ml-md" style="min-width: 0">
                <div class="text-weight-bold text-dark ellipsis" style="font-size: 17px">
                  {{ branch.branchName || t('adminManage.teamManagement.branchFallbackLabel', { id: branch.branchId }) }}
                </div>
                <div class="text-caption text-grey-6 ellipsis">
                  {{ t('adminManage.branchManagement.jobMappingHint') }}
                </div>
              </div>
              <q-btn flat round dense icon="edit" color="blue" class="q-ml-sm" @click.stop="openBranchForm(branch)" />
            </q-card-section>
            <q-separator color="grey-2" inset />
            <q-card-actions class="row q-px-md q-py-sm q-gutter-x-sm">
              <q-badge color="blue-1" text-color="blue-9" class="tag-badge">
                <q-icon name="groups" size="14px" class="q-mr-xs" />
                {{ t('adminManage.teamManagement.branchTeamCount', { n: branchTeamCount(branch.branchId) }) }}
              </q-badge>
              <q-badge color="grey-2" text-color="grey-8" class="tag-badge">
                <q-icon name="person" size="14px" class="q-mr-xs" />
                {{ t('adminManage.teamManagement.branchMemberCount', { n: branchMemberCount(branch.branchId) }) }}
              </q-badge>
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>

    <div v-else class="q-px-md q-pt-sm q-pb-md">
      <div v-if="!teamStore.isLoading && teamStore.teams.length === 0" class="text-center q-py-xl text-grey-6">
        <q-icon name="groups" size="64px" class="q-mb-md" />
        <div>{{ t('adminManage.teamManagement.noTeamsFound') }}</div>
      </div>
      <div v-else class="row q-col-gutter-md">
        <div
          v-for="team in teamStore.teams"
          :key="team.team_Id"
          class="col-12 col-sm-6 col-md-4 card-stagger"
        >
          <AdminTeamCard
            :team="team"
            :memberCount="getTeamMembers(team.team_Id).length"
            @edit="openEditForm"
            @delete="confirmDelete"
          />
        </div>
      </div>
    </div>

    <!-- Integrated Branch Management Dialog -->
    <q-dialog v-model="showBranchManagementDialog">
      <q-card style="width: 100%; max-width: 540px; border-radius: 20px" class="q-pa-md">
        <q-card-section class="row items-center justify-between q-pb-xs">
          <div class="row items-center">
            <q-avatar color="indigo-1" text-color="indigo-9" icon="business" size="40px" class="q-mr-sm" />
            <div>
              <div class="text-subtitle1 text-weight-bold text-dark">
                {{ editingBranchId !== null ? t('adminManage.branchManagement.editTitle') : t('adminManage.branchManagement.addTitle') }}
              </div>
              <div class="text-caption text-grey-6">{{ t('adminManage.teamManagement.manageBranchesSubtitle') }}</div>
            </div>
          </div>
          <q-btn flat round dense icon="close" color="grey-6" v-close-popup />
        </q-card-section>

        <q-separator class="q-my-sm" />

        <!-- Add/Edit Branch Form inside Dialog -->
        <q-card-section>
          <q-form class="q-gutter-sm" @submit="handleSaveBranch">
            <q-input
              v-model="branchNameInput"
              outlined
              dense
              bg-color="white"
              :label="t('adminManage.branchManagement.nameLabel')"
              :rules="[(val) => !!val.trim() || t('adminManage.userManagement.fillRequiredFields')]"
              hide-bottom-space
            />
            <q-file
              v-model="branchLogoFileInput"
              outlined
              dense
              bg-color="white"
              accept="image/*"
              :label="t('adminManage.branchManagement.logoLabel')"
              clearable
              hide-bottom-space
            >
              <template #prepend>
                <q-icon name="image" />
              </template>
            </q-file>

            <div class="row justify-end q-gutter-x-sm q-mt-xs">
              <q-btn
                flat
                color="grey-7"
                :label="t('adminManage.teamManagement.cancelLabel')"
                v-close-popup
              />
              <q-btn
                type="submit"
                color="primary"
                unelevated
                :label="editingBranchId !== null ? t('adminManage.teamManagement.saveButton') : t('adminManage.branchManagement.addBranch')"
                :loading="savingBranch"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Standard Team Form Dialog -->
    <q-dialog v-model="isFormMode" persistent>
      <q-card class="dialog-card">
        <q-card-section class="dialog-header row items-center no-wrap">
          <div class="dialog-header-icon">
            <q-icon :name="isEditing ? 'edit' : 'group_add'" size="24px" />
          </div>
          <div class="col q-ml-md">
            <div class="dialog-title text-weight-bold text-dark">
              {{ isEditing ? t('adminManage.teamManagement.editTeamTitle') : t('adminManage.teamManagement.addTeamTitle') }}
            </div>
          </div>
          <q-btn icon="close" flat round dense class="dialog-close-btn" v-close-popup />
        </q-card-section>
        <q-separator />

        <q-card-section class="dialog-body">
          <q-form @submit="onSave" class="q-gutter-md" id="team-edit-form">
            <div class="upload-zone row items-center">
              <div class="relative-position q-mr-md">
                <q-avatar size="64px" class="bg-grey-3">
                  <img
                    v-if="localForm.logo_url"
                    class="avatar-img"
                    :src="
                      localForm.logo_url && localForm.logo_url.startsWith('blob')
                        ? localForm.logo_url
                        : getImageUrl(localForm.logo_url)
                    "
                  />
                  <q-icon name="groups" size="lg" color="grey-5" v-else />
                </q-avatar>
                <q-btn
                  v-if="localForm.logo_url"
                  icon="close"
                  round
                  dense
                  size="xs"
                  color="negative"
                  text-color="white"
                  class="absolute-top-right"
                  style="transform: translate(30%, -30%)"
                  @click="removeLogo"
                >
                  <q-tooltip>{{ t('adminManage.teamManagement.removeLogoTooltip') }}</q-tooltip>
                </q-btn>
              </div>
              <div class="col">
                <div class="dialog-field-label">
                  {{ t('adminManage.teamManagement.teamLogoLabel') }} <span class="text-grey-5">({{ t('adminManage.teamManagement.optionalLabel') }})</span>
                </div>
                <q-file
                  v-model="pickedLogoFile"
                  outlined
                  dense
                  filled
                  clearable
                  accept="image/*"
                  :label="t('adminManage.teamManagement.chooseLogoFileLabel')"
                  hide-bottom-space
                  @update:model-value="onImageFileChange"
                >
                  <template #prepend>
                    <q-icon name="image" />
                  </template>
                </q-file>
              </div>
            </div>

            <div>
              <div class="dialog-field-label">
                {{ t('adminManage.teamManagement.teamNameLabel') }} <span class="text-negative">*</span>
              </div>
              <q-input
                v-model="localForm.team_name"
                outlined
                dense
                filled
                :rules="[(val) => !!val || t('adminManage.teamManagement.teamNameRequired')]"
                hide-bottom-space
              />
            </div>

            <div>
              <div class="dialog-field-label">{{ t('adminManage.teamManagement.contactInfoLabel') }}</div>
              <q-input v-model="localForm.contact_info" outlined dense filled hide-bottom-space />
            </div>

            <div>
              <div class="dialog-field-label">{{ t('adminManage.teamManagement.branchLabel') }}</div>
              <q-select
                v-model="localForm.branchId"
                :options="branchFormOptions"
                emit-value
                map-options
                outlined
                dense
                filled
                :disable="isEditing && selectedTeamMembers.length > 0"
                hide-bottom-space
              />
              <div
                v-if="isEditing && selectedTeamMembers.length > 0"
                class="text-caption text-negative q-mt-xs row items-center"
              >
                <q-icon name="lock" size="14px" class="q-mr-xs" />
                ไม่สามารถเปลี่ยนสาขาได้เนื่องจากทีมนี้มีสมาชิกอยู่ {{ selectedTeamMembers.length }} คน (ต้องย้ายหรือถอดสมาชิกออกจากทีมทั้งหมดก่อนจึงจะเปลี่ยนสาขาได้)
              </div>
            </div>

            <!-- Initial Members for New Team -->
            <div v-if="!isEditing">
              <div class="dialog-field-label">
                {{ t('adminManage.teamManagement.initialMembersLabel') }} <span class="text-negative">*</span>
              </div>
              <q-select
                v-model="newTeamMemberIds"
                :options="unassignedInspectorOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                multiple
                use-chips
                outlined
                dense
                filled
                :label="t('adminManage.teamManagement.selectMembersLabel')"
                hide-bottom-space
                :rules="[(val: number[]) => (Array.isArray(val) && val.length > 0) || t('adminManage.teamManagement.selectAtLeastOneMember')]"
                :loading="userStore.isLoading"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey-6">{{ t('adminManage.teamManagement.noUnassignedInspectors') }}</q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Members Management for Existing Team -->
            <div v-if="isEditing">
              <q-separator class="q-mb-md" />
              <div class="dialog-field-label">
                <q-icon name="groups" size="xs" class="q-mr-xs" />
                {{ t('adminManage.teamManagement.teamMembersLabel') }}
              </div>

              <div class="row items-center q-gutter-sm q-mb-md">
                <q-select
                  v-model="newMemberId"
                  :options="availableInspectorOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  outlined
                  dense
                  filled
                  class="col"
                  :label="t('adminManage.teamManagement.addMemberLabel')"
                  hide-bottom-space
                  :loading="userStore.isLoading"
                >
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey-6">{{ t('adminManage.teamManagement.noAvailableInspectors') }}</q-item-section>
                    </q-item>
                  </template>
                </q-select>
                <q-btn
                  color="primary"
                  icon="person_add"
                  round
                  unelevated
                  :disable="!newMemberId"
                  @click="addMember"
                />
              </div>

              <div v-if="selectedTeamMembers.length === 0" class="text-center q-py-md text-grey-6">
                {{ t('adminManage.teamManagement.noMembersInTeam') }}
              </div>
              <q-list v-else separator bordered class="dialog-member-list">
                <q-item v-for="user in selectedTeamMembers" :key="user.id">
                  <q-item-section avatar>
                    <q-avatar>
                      <img v-if="user.imageUrl && !user.imageUrl.includes('unknown.jpg')" :src="getImageUrl(user.imageUrl)" />
                      <span v-else class="bg-primary text-white">{{ user.fullName?.charAt(0).toUpperCase() || 'U' }}</span>
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ user.fullName }}</q-item-label>
                    <q-item-label caption>{{ user.phoneNumber || user.email }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      icon="person_remove"
                      color="negative"
                      flat
                      round
                      dense
                      size="sm"
                      @click="confirmRemoveMember(user)"
                    >
                      <q-tooltip>{{ t('adminManage.teamManagement.removeMemberTooltip') }}</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-form>
        </q-card-section>

        <q-separator />
        <q-card-actions class="dialog-footer q-gutter-sm">
          <q-btn
            :label="t('adminManage.teamManagement.backButton')"
            color="grey-8"
            flat
            no-caps
            @click="closeForm"
            class="col dialog-btn dialog-btn--cancel"
          />
          <q-btn
            :label="t('adminManage.teamManagement.saveButton')"
            type="submit"
            form="team-edit-form"
            color="primary"
            unelevated
            no-caps
            class="col dialog-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Crop Dialog -->
    <q-dialog v-model="showCropDialog" persistent>
      <q-card style="width: 480px; max-width: 90vw; border-radius: 16px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">{{ t('adminManage.teamManagement.cropLogoTitle') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="cancelCrop" />
        </q-card-section>
        <q-card-section class="q-pt-md">
          <div class="text-caption text-grey-7 q-mb-sm">
            {{ t('adminManage.teamManagement.cropHint') }}
          </div>
          <cropper
            v-if="cropSourceUrl"
            ref="cropperRef"
            class="logo-cropper"
            :src="cropSourceUrl"
            :stencil-props="{ aspectRatio: 1 }"
          />
          <div class="row justify-end q-mt-md q-gutter-sm">
            <q-btn :label="t('adminManage.teamManagement.cropCancel')" color="grey-6" flat @click="cancelCrop" style="border-radius: 8px" />
            <q-btn :label="t('adminManage.teamManagement.cropConfirm')" color="primary" unelevated @click="confirmCrop" style="border-radius: 8px" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useTeamStore } from 'src/stores/useTeam';
import { useUserStore } from 'src/stores/useUser';
import { useBranchStore, type Branch } from 'src/stores/useBranch';
import AdminTeamCard from 'src/components/AdminTeamCard.vue';
import ConfirmActionDialog from 'src/components/ConfirmActionDialog.vue';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import type { Team, User } from 'src/models';

const teamSpinner = createIconSpinner('groups');

const { t, locale } = useI18n({ useScope: 'global' });
const $q = useQuasar();
const teamStore = useTeamStore();
const userStore = useUserStore();
const branchStore = useBranchStore();

const isFormMode = ref(false);
const isEditing = ref(false);
const editTeamId = ref<number | null>(null);

const searchQuery = ref('');
const selectedBranchId = ref<number | null>(null);
const viewMode = ref<'teams' | 'branches'>('teams');

function showTeamsView() {
  viewMode.value = 'teams';
  selectedBranchId.value = null;
}

function showBranchesView() {
  viewMode.value = 'branches';
}

const allTeamsList = computed(() => (teamStore.allTeams.length > 0 ? teamStore.allTeams : teamStore.teams));
const allUsersList = computed(() => (userStore.allUsers.length > 0 ? userStore.allUsers : userStore.users));

const totalTeamsCount = computed(() => allTeamsList.value.length);

const selectedTeamMembers = computed(() => {
  if (editTeamId.value === null) return [];
  return getTeamMembers(editTeamId.value);
});

const newMemberId = ref<number | null>(null);
const availableInspectorOptions = computed(() => {
  const currentBranchId = localForm.value.branchId;
  return allUsersList.value
    .filter((u) => {
      if (u.role !== 'inspector') return false;
      // ต้องไม่มีสังกัดทีมใดๆ เท่านั้น
      if (u.teamId ?? u.team?.team_Id) return false;
      // ต้องอยู่สาขาเดียวกันกับทีม
      if (currentBranchId) {
        const uBranchId = u.branchId ?? u.branch?.branchId;
        if (uBranchId !== currentBranchId) return false;
      }
      return true;
    })
    .map((u) => ({ label: u.fullName, value: u.id }));
});

const newTeamMemberIds = ref<number[]>([]);
const unassignedInspectorOptions = computed(() => {
  const currentBranchId = localForm.value.branchId;
  return allUsersList.value
    .filter((u) => {
      if (u.role !== 'inspector') return false;
      // ต้องไม่มีสังกัดทีมใดๆ เท่านั้น
      if (u.teamId ?? u.team?.team_Id) return false;
      // ต้องอยู่สาขาเดียวกันกับทีม
      if (currentBranchId) {
        const uBranchId = u.branchId ?? u.branch?.branchId;
        if (uBranchId !== currentBranchId) return false;
      }
      return true;
    })
    .map((u) => ({ label: u.fullName, value: u.id }));
});

const loadTeams = async () => {
  try {
    await teamStore.fetchTeams({
      all: true,
      search: searchQuery.value.trim() || undefined,
      branchId: selectedBranchId.value ?? undefined,
    });
  } catch (err) {
    console.error('Fetch teams error:', err);
    $q.notify({ type: 'negative', message: t('adminManage.teamManagement.fetchTeamsFailed'), position: 'top' });
  }
};

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (viewMode.value !== 'teams') return;
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    void loadTeams();
  }, 400);
});

watch(selectedBranchId, () => {
  void loadTeams();
});

const localForm = ref<{
  team_name: string;
  logo_url: string;
  contact_info: string;
  branchId: number | null;
}>({
  team_name: '',
  logo_url: '',
  contact_info: '',
  branchId: null,
});
const logoFile = ref<File | null>(null);

const branchOptions = computed(() => {
  void locale.value;
  return [
    { label: t('adminManage.teamManagement.allBranchesOption'), value: null },
    ...branchStore.branches.map((branch) => ({
      label: branch.branchName || t('adminManage.teamManagement.branchFallbackLabel', { id: branch.branchId }),
      value: branch.branchId,
    })),
  ];
});

const branchFormOptions = computed(() => {
  void locale.value;
  return [
    { label: t('adminManage.teamManagement.noBranchOption'), value: null },
    ...branchStore.branches.map((branch) => ({
      label: branch.branchName || t('adminManage.teamManagement.branchFallbackLabel', { id: branch.branchId }),
      value: branch.branchId,
    })),
  ];
});

const branchFilterChips = computed(() => {
  void locale.value;
  return [
    { label: t('adminManage.teamManagement.allBranchesOption'), value: null, count: teamStore.teams.length },
    ...branchStore.branches.map((b) => ({
      label: b.branchName || t('adminManage.teamManagement.branchFallbackLabel', { id: b.branchId }),
      value: b.branchId,
      count: teamStore.teams.filter((t) => t.branchId === b.branchId).length,
    })),
  ];
});

// Integrated Branch Management Dialog State
const showBranchManagementDialog = ref(false);
const editingBranchId = ref<number | null>(null);
const branchNameInput = ref('');
const branchLogoFileInput = ref<File | null>(null);
const savingBranch = ref(false);

function openBranchForm(branch?: Branch) {
  editingBranchId.value = branch?.branchId ?? null;
  branchNameInput.value = branch?.branchName || '';
  branchLogoFileInput.value = null;
  showBranchManagementDialog.value = true;
}

async function handleSaveBranch() {
  if (!branchNameInput.value.trim()) return;
  savingBranch.value = true;
  try {
    await branchStore.saveBranch(editingBranchId.value, branchNameInput.value.trim(), branchLogoFileInput.value);
    $q.notify({ type: 'positive', message: t('adminManage.branchManagement.saveSuccess') });
    showBranchManagementDialog.value = false;
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: t('adminManage.branchManagement.saveFailed') });
  } finally {
    savingBranch.value = false;
  }
}

const pickedLogoFile = ref<File | null>(null);
const showCropDialog = ref(false);
const cropSourceUrl = ref('');
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null);

onMounted(async () => {
  $q.loading.show({
    spinner: teamSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  void branchStore.fetchBranches().catch(() => {
    $q.notify({ type: 'negative', message: t('adminManage.teamManagement.fetchBranchesFailed'), position: 'top' });
  });
  try {
    await Promise.all([
      teamStore.fetchAllTeams(),
      loadTeams(),
      userStore.fetchAllUsers(),
    ]);
  } finally {
    $q.loading.hide();
  }
});

const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${import.meta.env.VITE_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const filteredBranches = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  if (!keyword) return branchStore.branches;
  return branchStore.branches.filter((b) => (b.branchName || '').toLowerCase().includes(keyword));
});

const branchTeamCount = (branchId: number) =>
  allTeamsList.value.filter((team) => team.branchId === branchId).length;

const branchMemberCount = (branchId: number) =>
  allUsersList.value.filter((user) => (user.branchId ?? user.branch?.branchId) === branchId).length;

const getTeamMembers = (teamId: number) => {
  return allUsersList.value.filter((user) => user.teamId === teamId || user.team?.team_Id === teamId);
};

const addMember = () => {
  if (!newMemberId.value || editTeamId.value === null) return;
  const targetTeam = teamStore.teams.find((t) => t.team_Id === editTeamId.value);
  const inspector = userStore.users.find((u) => u.id === newMemberId.value);
  if (!inspector || !targetTeam) return;

  $q.loading.show({ message: t('adminManage.teamManagement.addingMember') });
  userStore
    .updateUser(inspector.id, {
      form: {
        teamId: targetTeam.team_Id,
        branchId: targetTeam.branchId ?? undefined,
      },
      file: null,
    })
    .then(() => {
      $q.notify({ type: 'positive', message: t('adminManage.teamManagement.addMemberSuccess'), icon: 'check_circle', position: 'top' });
      newMemberId.value = null;
      void loadTeams();
      void teamStore.fetchAllTeams();
      void userStore.fetchAllUsers();
    })
    .catch(() => {
      $q.notify({ type: 'negative', message: t('adminManage.teamManagement.addMemberFailed'), position: 'top' });
    })
    .finally(() => {
      $q.loading.hide();
    });
};

const confirmRemoveMember = (user: User) => {
  $q.dialog({
    title: t('adminManage.teamManagement.removeMemberConfirmTitle'),
    message: t('adminManage.teamManagement.removeMemberConfirmMessage', { name: user.fullName }),
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    $q.loading.show({ message: t('adminManage.teamManagement.removingMember') });
    userStore
      .updateUser(user.id, { form: { teamId: 0 }, file: null })
      .then(() => {
        $q.notify({ type: 'positive', message: t('adminManage.teamManagement.removeMemberSuccess'), icon: 'check_circle', position: 'top' });
        void loadTeams();
        void teamStore.fetchAllTeams();
        void userStore.fetchAllUsers();
      })
      .catch(() => {
        $q.notify({ type: 'negative', message: t('adminManage.teamManagement.removeMemberFailed'), position: 'top' });
      })
      .finally(() => {
        $q.loading.hide();
      });
  });
};

function onImageFileChange(file: File | null) {
  if (!file) {
    cropSourceUrl.value = '';
    return;
  }
  if (cropSourceUrl.value) {
    URL.revokeObjectURL(cropSourceUrl.value);
  }
  cropSourceUrl.value = URL.createObjectURL(file);
  showCropDialog.value = true;
}

function cancelCrop() {
  showCropDialog.value = false;
  if (cropSourceUrl.value) {
    URL.revokeObjectURL(cropSourceUrl.value);
    cropSourceUrl.value = '';
  }
  pickedLogoFile.value = null;
}

function confirmCrop() {
  const cropper = cropperRef.value;
  if (!cropper) return;
  const result = cropper.getResult();
  if (!result.canvas) return;

  result.canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const file = new File([blob], pickedLogoFile.value?.name || 'logo.png', {
        type: 'image/png',
      });
      logoFile.value = file;
      if (localForm.value.logo_url && localForm.value.logo_url.startsWith('blob:')) {
        URL.revokeObjectURL(localForm.value.logo_url);
      }
      localForm.value.logo_url = URL.createObjectURL(file);
      showCropDialog.value = false;
      if (cropSourceUrl.value) {
        URL.revokeObjectURL(cropSourceUrl.value);
        cropSourceUrl.value = '';
      }
    },
    'image/png',
    0.9,
  );
}

function removeLogo() {
  if (localForm.value.logo_url && localForm.value.logo_url.startsWith('blob:')) {
    URL.revokeObjectURL(localForm.value.logo_url);
  }
  localForm.value.logo_url = '';
  logoFile.value = null;
  pickedLogoFile.value = null;
}

function openCreateForm() {
  isEditing.value = false;
  editTeamId.value = null;
  removeLogo();
  localForm.value = { team_name: '', logo_url: '', contact_info: '', branchId: null };
  newTeamMemberIds.value = [];
  newMemberId.value = null;
  isFormMode.value = true;
}

function openEditForm(team: Team) {
  isEditing.value = true;
  editTeamId.value = team.team_Id;
  removeLogo();
  localForm.value = {
    team_name: team.team_name,
    logo_url: team.logo_url || '',
    contact_info: team.contact_info || '',
    branchId: team.branchId ?? null,
  };
  newTeamMemberIds.value = [];
  newMemberId.value = null;
  isFormMode.value = true;
}

function closeForm() {
  removeLogo();
  isFormMode.value = false;
}

async function onSave() {
  if (!localForm.value.team_name.trim()) {
    $q.notify({ type: 'warning', message: t('adminManage.teamManagement.teamNameRequired'), position: 'top' });
    return;
  }
  if (!isEditing.value && newTeamMemberIds.value.length === 0) {
    $q.notify({ type: 'warning', message: t('adminManage.teamManagement.selectAtLeastOneMember'), position: 'top' });
    return;
  }

  $q.loading.show({ message: t('adminManage.teamManagement.saving') });
  try {
    if (isEditing.value && editTeamId.value !== null) {
      await teamStore.updateTeam(editTeamId.value, {
        form: {
          team_name: localForm.value.team_name,
          contact_info: localForm.value.contact_info,
          branchId: localForm.value.branchId,
        },
        file: logoFile.value,
      });
      $q.notify({ type: 'positive', message: t('adminManage.teamManagement.editTeamSuccess'), icon: 'check_circle', position: 'top' });
    } else {
      const createdTeam = await teamStore.createTeam({
        form: {
          team_name: localForm.value.team_name,
          contact_info: localForm.value.contact_info,
          branchId: localForm.value.branchId,
        },
        file: logoFile.value,
      });
      if (createdTeam && newTeamMemberIds.value.length > 0) {
        await Promise.all(
          newTeamMemberIds.value.map((userId) =>
            userStore.updateUser(userId, {
              form: {
                teamId: createdTeam.team_Id,
                branchId: createdTeam.branchId ?? undefined,
              },
              file: null,
            }),
          ),
        );
      }
      $q.notify({ type: 'positive', message: t('adminManage.teamManagement.createTeamSuccess'), icon: 'check_circle', position: 'top' });
    }
    closeForm();
    void loadTeams();
    void teamStore.fetchAllTeams();
    void userStore.fetchAllUsers();
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: t('adminManage.teamManagement.saveErrorApiCheck'), position: 'top' });
  } finally {
    $q.loading.hide();
  }
}

function confirmDelete(team: Team) {
  $q.dialog({
    component: ConfirmActionDialog,
    componentProps: {
      title: t('adminManage.teamManagement.deactivateConfirmTitle'),
      message: t('adminManage.teamManagement.deactivateConfirmMessage', { name: team.team_name }),
      confirmLabel: t('adminManage.teamManagement.deactivateConfirmLabel'),
      cancelLabel: t('adminManage.teamManagement.cancelLabel'),
      color: 'negative',
      icon: 'warning',
    },
  }).onOk(() => {
    $q.loading.show({ message: t('adminManage.teamManagement.deactivating') });
    teamStore
      .deleteTeam(team.team_Id)
      .then(() => {
        $q.notify({ type: 'positive', message: t('adminManage.teamManagement.deactivateSuccess'), icon: 'check_circle', position: 'top' });
        void loadTeams();
        void teamStore.fetchAllTeams();
      })
      .catch(() => {
        $q.notify({ type: 'negative', message: t('adminManage.teamManagement.deactivateFailed'), position: 'top' });
      })
      .finally(() => {
        $q.loading.hide();
      });
  });
}
</script>

<style scoped>
.admin-team-page {
  max-width: 1200px;
  margin: 0 auto;
}

.header-bg {
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}

.kpi-card {
  border-radius: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
}

.kpi-card.kpi-card--active {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: -1px;
}

.kpi-card:focus-visible {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: 2px;
}

.kpi-card.cursor-pointer {
  user-select: none;
  -webkit-user-select: none;
  caret-color: transparent;
  -webkit-tap-highlight-color: transparent;
}

.branch-card {
  border-radius: 18px;
  border-color: #f0f0f0;
  height: 100%;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.03),
    0 2px 6px rgba(0, 0, 0, 0.03);
  transition: box-shadow 200ms ease, border-color 200ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .branch-card:hover {
    border-color: #e4e4e4;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 8px 20px rgba(0, 0, 0, 0.07);
  }
}

.branch-card:focus-visible {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: 2px;
}

.tag-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
}

.search-input {
  background: #ffffff;
  border-radius: 24px;
  padding: 4px 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.action-btn-primary {
  height: 42px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 13px;
}

.scroll-container {
  max-width: 100%;
}

.filter-chip {
  min-height: 42px;
  padding: 6px 14px;
  border-radius: 21px;
  white-space: nowrap;
  font-size: 13px;
  transition: all 0.2s ease;
}

.filter-text {
  white-space: nowrap;
}

.shrink-0 {
  flex-shrink: 0;
}

.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.dialog-card {
  width: 100%;
  max-width: 580px;
  border-radius: 20px;
  overflow: hidden;
}

@media (min-width: 1024px) {
  .dialog-card {
    max-width: 640px;
  }
}

.dialog-header {
  padding: 20px 24px;
}

.dialog-header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1976d2;
  flex-shrink: 0;
}

.dialog-title {
  font-size: 18px;
  line-height: 1.3;
}

.dialog-close-btn {
  background-color: #f2f4f7;
  transition: background-color 0.15s ease;
}

.dialog-close-btn:hover {
  background-color: #e7ebf0;
}

.dialog-body {
  padding: 22px 24px;
  max-height: 62vh;
  overflow-y: auto;
}

.dialog-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #55606e;
  margin-bottom: 6px;
}

.upload-zone {
  padding: 14px;
  border: 1.5px dashed #d7dee6;
  border-radius: 16px;
  background-color: #fafbfc;
}

.dialog-member-list {
  border-radius: 12px;
  border-color: #eef0f2;
}

.dialog-body :deep(.q-field__control) {
  border-radius: 12px;
}

.dialog-footer {
  padding: 16px 24px;
  background-color: #fafbfc;
}

.dialog-btn {
  border-radius: 12px;
  height: 44px;
  font-weight: 600;
  min-width: 120px;
}

.dialog-btn--cancel {
  border: 1px solid #e3e6ea;
  background-color: #ffffff;
}

.logo-cropper {
  height: 280px;
  background: #222;
  border-radius: 12px;
}
</style>
