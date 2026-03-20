<template>
  <q-layout view="lHh Lpr lFf">

    <q-header class="bg-white text-black">
      <q-toolbar>
        <q-btn flat round dense icon="arrow_back_ios" color="primary" @click="goBack" />
        <q-toolbar-title class="text-center text-weight-bold text-subtitle1">
          ห้องนอนใหญ่
        </q-toolbar-title>
        <div style="width: 32px"></div>
      </q-toolbar>
      <q-separator color="grey-3" />
    </q-header>

    <q-page-container>
      <q-page class="q-pa-md bg-white">

        <div class="row justify-end q-mb-md">
          <q-btn outline rounded color="primary" icon="filter_list" label="ตัวกรอง" size="sm"
            class="q-px-md text-weight-bold bg-white" />
        </div>

        <div class="column q-gutter-y-md">
          <DefectDetailCard v-for="(item, index) in defectList" :key="index" :defect="item" />
        </div>

      </q-page>
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DefectDetailCard from '../components/DefectDetailCard.vue'

const goBack = () => {
  console.log('ย้อนกลับไปหน้า InspectionPage')
  // ถ้าใช้ Vue Router จะเป็น router.push('/inspection') หรือ router.back()
}

const defectList = ref([
  {
    imageUrl: 'https://picsum.photos/seed/1/200/150',
    locationLabel: 'ห้องนั่งเล่น, -, ชั้น1',
    category: 'ผนัง',
    severity: 'Major',
    tags: ['ผิวไม่เสมอ', 'สีด่าง']
  },
  {
    imageUrl: 'https://picsum.photos/seed/2/200/150',
    locationLabel: 'ห้องนอน, -, ชั้น1',
    category: 'ผนัง',
    severity: 'Major',
    tags: ['สีด่าง']
  },
  {
    imageUrl: 'https://picsum.photos/seed/3/200/150',
    locationLabel: 'ห้องน้ำ, -, ชั้น2',
    category: 'กระเบื้อง',
    severity: 'Major',
    tags: ['ร้าว', 'ยาแนวไม่เต็มร่อง']
  },
  {
    imageUrl: 'https://picsum.photos/seed/4/200/150',
    locationLabel: 'ห้องน้ำ, -, ชั้น2',
    category: 'กระเบื้อง',
    severity: 'Minor',
    tags: ['ยาแนวหลุดร่อน']
  },
  {
    imageUrl: 'https://picsum.photos/seed/1/200/150',
    locationLabel: 'ห้องนั่งเล่น, -, ชั้น1',
    category: 'ผนัง',
    severity: 'Major',
    tags: ['ผิวไม่เสมอ', 'สีด่าง']
  },
  {
    imageUrl: 'https://picsum.photos/seed/2/200/150',
    locationLabel: 'ห้องนอน, -, ชั้น1',
    category: 'ผนัง',
    severity: 'Major',
    tags: ['สีด่าง']
  },
  {
    imageUrl: 'https://picsum.photos/seed/3/200/150',
    locationLabel: 'ห้องน้ำ, -, ชั้น2',
    category: 'กระเบื้อง',
    severity: 'Major',
    tags: ['ร้าว', 'ยาแนวไม่เต็มร่อง']
  },
  {
    imageUrl: 'https://picsum.photos/seed/4/200/150',
    locationLabel: 'ห้องน้ำ, -, ชั้น2',
    category: 'กระเบื้อง',
    severity: 'Minor',
    tags: ['ยาแนวหลุดร่อน']
  },
  {
    imageUrl: 'https://picsum.photos/seed/1/200/150',
    locationLabel: 'ห้องนั่งเล่น, -, ชั้น1',
    category: 'ผนัง',
    severity: 'Major',
    tags: ['ผิวไม่เสมอ', 'สีด่าง']
  },
  {
    imageUrl: 'https://picsum.photos/seed/2/200/150',
    locationLabel: 'ห้องนอน, -, ชั้น1',
    category: 'ผนัง',
    severity: 'Major',
    tags: ['สีด่าง']
  },
  {
    imageUrl: 'https://picsum.photos/seed/3/200/150',
    locationLabel: 'ห้องน้ำ, -, ชั้น2',
    category: 'กระเบื้อง',
    severity: 'Major',
    tags: ['ร้าว', 'ยาแนวไม่เต็มร่อง']
  },
  {
    imageUrl: 'https://picsum.photos/seed/4/200/150',
    locationLabel: 'ห้องน้ำ, -, ชั้น2',
    category: 'กระเบื้อง',
    severity: 'Minor',
    tags: ['ยาแนวหลุดร่อน']
  }
])
</script>
