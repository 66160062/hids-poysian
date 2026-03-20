<template>
  <q-page class="report-page bg-white">

    <div class="q-px-md q-pb-xl">

      <!-- Filter Button -->
      <div class="row justify-end q-mb-md">
        <q-btn
          outline
          color="primary"
          icon="filter_list"
          label="ตัวกรอง"
          size="sm"
          rounded
          class="filter-btn"
        />
      </div>

      <!-- Sections -->
      <div v-for="section in reportSections" :key="section.title" class="q-mb-lg">

        <q-card flat bordered class="info-card">

          <!-- Section Header -->
          <q-card-section class="section-title">
            {{ section.title }}
          </q-card-section>

          <q-separator />

          <!-- Items -->
          <q-card-section
            v-for="item in section.items"
            :key="item.heading"
            class="item-section"
          >

            <!-- Heading -->
            <div class="item-heading">
              {{ item.heading }}
            </div>

            <!-- Fields -->
            <div
              v-for="field in item.fields"
              :key="field.label"
              class="field-block"
            >

              <!-- Label -->
              <div v-if="field.label" class="field-label">
                {{ field.label }}
              </div>

              <!-- Radio -->
              <div
                v-if="field.type === 'radio'"
                class="option-group"
              >
                <q-radio
                  v-for="opt in field.options"
                  :key="opt"
                  v-model="field.selected"
                  :val="opt"
                  :label="opt"
                  color="primary"
                  dense
                />
              </div>

              <!-- Checkbox -->
              <div
                v-if="field.type === 'checkbox'"
                class="option-group"
              >
                <q-checkbox
                  v-for="opt in field.options"
                  :key="opt"
                  v-model="field.selected"
                  :val="opt"
                  :label="opt"
                  color="primary"
                  dense
                />
              </div>

              <!-- Textarea -->
              <q-input
                v-if="field.type === 'textarea'"
                v-model="field.value"
                type="textarea"
                outlined
                dense
                rows="3"
                bg-color="grey-1"
                placeholder="หมายเหตุ..."
                class="note-input"
              />

            </div>

          </q-card-section>

        </q-card>

      </div>

    </div>

  </q-page>
</template>

<script setup lang="ts">
import { useReport } from 'src/stores/useCustomerReport'

const { reportSections } = useReport()
</script>

<style scoped>

.report-page {
  max-width: 480px;
  margin: 0 auto;
}

.page-header{
  font-size:18px;
  font-weight:700;
  text-align:center;
  padding:16px;
  background:white;
  border-bottom:1px solid #eee;
}

.filter-btn{
  border-radius:12px;
}

.info-card{
  border-radius:16px;
  border:1px solid #e9e9e9;
}

.section-title{
  text-align:center;
  font-weight:700;
  font-size:15px;
}

.item-section{
  padding-top:12px;
}

.item-heading{
  font-size:15px;
  font-weight:700;
  color:#1976D2;
  margin-bottom:8px;
}

.field-block{
  margin-bottom:14px;
}

.field-label{
  font-size:13px;
  color:#666;
  margin-bottom:6px;
}

.option-group{
  display:flex;
  flex-direction:column;
  gap:6px;
}

.note-input{
  margin-top:6px;
}

.q-radio :deep(.q-radio__label){
  font-size:13px;
}

.q-checkbox :deep(.q-checkbox__label){
  font-size:13px;
}

</style>