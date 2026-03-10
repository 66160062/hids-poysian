import { reactive } from 'vue'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ReportField {
  label?:       string
  type:         'radio' | 'checkbox' | 'textarea'
  options?:     string[]
  selected?:    string | string[]
  value?:       string
  placeholder?: string
}

export interface ReportItem {
  heading: string
  fields:  ReportField[]
}

export interface ReportSection {
  title: string
  items: ReportItem[]
}

// ── Composable ────────────────────────────────────────────────────────────────
export function useReport() {

  // ── Mock data (จะมาจาก API ทีหลัง) ─────────────────────────────────────────
  const reportSections = reactive<ReportSection[]>([
    {
      title: 'ทิศทางของบ้าน',
      items: [
        {
          heading: 'ทิศทาง',
          fields: [
            {
              type: 'radio',
              options: ['ตะวันออกเฉียงเหนือ', 'ตะวันออก', 'ตะวันออกเฉียงใต้', 'ใต้', 'ตะวันตกเฉียงใต้', 'ตะวันตก', 'ตะวันตกเฉียงเหนือ', 'เหนือ'],
              selected: 'ตะวันออกเฉียงเหนือ',
            },
          ],
        },
      ],
    },
    {
      title: 'งานโครงสร้าง',
      items: [
        {
          heading: 'โครงสร้างของบ้าน',
          fields: [
            { label: 'รูปแบบโครงสร้าง', type: 'checkbox', options: ['ผนังก่ออิฐฉาบปูน'],                              selected: ['ผนังก่ออิฐฉาบปูน'] },
            { label: 'รายละเอียด',        type: 'radio',    options: ['ไม่พบปัญหาทางด้านโครงสร้าง', 'พบปัญหา'],        selected: 'ไม่พบปัญหาทางด้านโครงสร้าง' },
          ],
        },
        {
          heading: 'ลานซักล้าง',
          fields: [
            { type: 'radio', options: ['ไม่พบปัญหาทางด้านโครงสร้าง', 'พบปัญหา'], selected: 'ไม่พบปัญหาทางด้านโครงสร้าง' },
          ],
        },
        {
          heading: 'ฐานราก',
          fields: [
            { type: 'radio', options: ['ไม่พบปัญหาการทรุดตัว', 'พบปัญหา'], selected: 'ไม่พบปัญหาการทรุดตัว' },
          ],
        },
        {
          heading: 'โครงสร้างของหลังคา',
          fields: [
            { label: 'ชนิดโครงสร้าง',              type: 'radio', options: ['โครงสร้างหลังคาสำเร็จรูป', 'อื่นๆ'],   selected: 'โครงสร้างหลังคาสำเร็จรูป' },
            { label: 'แผ่นสะท้อนความร้อน/แผ่นกันความร้อน', type: 'radio', options: ['มีการติดตั้ง', 'ไม่มี'], selected: 'มีการติดตั้ง' },
            { label: 'การติดตั้ง',                  type: 'radio', options: ['ติดตั้งเรียบร้อย', 'ยังไม่ติดตั้ง'],   selected: 'ติดตั้งเรียบร้อย' },
          ],
        },
        {
          heading: 'บันได, ราวบันได',
          fields: [
            { type: 'radio', options: ['ไม่พบปัญหาด้านโครงสร้าง', 'พบปัญหา'], selected: 'ไม่พบปัญหาด้านโครงสร้าง' },
          ],
        },
      ],
    },
    {
      title: 'งานประปาและสุขาภิบาล',
      items: [
        {
          heading: 'มิเตอร์ประปา',
          fields: [
            { type: 'radio', options: ['ติดตั้งเรียบร้อย', 'ยังไม่ติดตั้ง'], selected: 'ติดตั้งเรียบร้อย' },
          ],
        },
        {
          heading: 'งานระบบประปา',
          fields: [
            { label: 'การติดตั้ง', type: 'radio', options: ['ติดตั้งเรียบร้อย', 'ยังไม่ติดตั้ง'],    selected: 'ติดตั้งเรียบร้อย' },
            { label: 'การติดตั้ง', type: 'radio', options: ['ตรวจสอบทุกจุดไม่พบปัญหา', 'พบปัญหา'], selected: 'ตรวจสอบทุกจุดไม่พบปัญหา' },
          ],
        },
        {
          heading: 'งานสุขาภิบาล',
          fields: [
            { label: 'การติดตั้ง', type: 'radio',    options: ['ติดตั้งเรียบร้อย พร้อมใช้งาน', 'ยังไม่ติดตั้ง'], selected: 'ติดตั้งเรียบร้อย พร้อมใช้งาน' },
            { label: 'การติดตั้ง', type: 'radio',    options: ['ตรวจสอบทุกจุดพบปัญหา', 'ไม่พบปัญหา'],           selected: 'ตรวจสอบทุกจุดพบปัญหา' },
            { label: 'หมายเหตุ',   type: 'textarea', placeholder: 'น้ำไม่ระบายออกบ่อสาธารณะหมู่บ้าน',           value: '' },
          ],
        },
        {
          heading: 'ตรวจสอบสโลปห้องน้ำ',
          fields: [
            { type: 'radio', options: ['ไม่พบปัญหาน้ำขัง', 'พบปัญหา'], selected: 'ไม่พบปัญหาน้ำขัง' },
          ],
        },
        {
          heading: 'ตรวจสอบการรั่วซึมจากพื้นห้องน้ำ',
          fields: [
            { type: 'radio',    options: ['ไม่พบปัญหารั่วซึม', 'พบปัญหารั่วซึม'], selected: 'พบปัญหารั่วซึม' },
            { label: 'หมายเหตุ', type: 'textarea', placeholder: 'รั่วซึมจากท่อน้ำทิ้ง Floor Drain ห้องน้ำ ห้องนอนชั้น 1 ชั้น 2', value: '' },
          ],
        },
      ],
    },
    {
      title: 'งานระบบไฟฟ้า',
      items: [
        {
          heading: 'มิเตอร์ไฟฟ้า',
          fields: [
            { type: 'radio', options: ['ติดตั้งเรียบร้อย', 'ยังไม่ติดตั้ง'], selected: 'ติดตั้งเรียบร้อย' },
          ],
        },
        {
          heading: 'เมนเบรกเกอร์',
          fields: [
            { type: 'radio',    options: ['ติดตั้งเรียบร้อย', 'ยังไม่ติดตั้ง'], selected: 'ติดตั้งเรียบร้อย' },
            { label: 'ขนาดเมนเบรกเกอร์', type: 'radio',    options: ['อื่นๆ', '100A', '150A', '200A'],           selected: 'อื่นๆ' },
            { label: 'หมายเหตุ',          type: 'textarea', placeholder: '150 Amp',                                value: '' },
            { label: 'จำนวนสายไฟ',        type: 'radio',    options: ['3 Pole', '1 Pole'],                         selected: '3 Pole' },
            { label: 'ปลั๊ก/สวิตซ์',      type: 'radio',    options: ['ตรวจสอบครบทุกจุด', 'ไม่ครบ'],              selected: 'ตรวจสอบครบทุกจุด' },
            { label: 'การติดตั้ง',         type: 'radio',    options: ['ไม่พบปัญหา', 'พบปัญหา'],                   selected: 'ไม่พบปัญหา' },
          ],
        },
        {
          heading: 'เครื่องป้องกันไฟรั่ว',
          fields: [
            { type: 'radio', options: ['ตรวจสอบครบทุกจุด', 'ไม่ครบ'], selected: 'ตรวจสอบครบทุกจุด' },
            { label: 'การติดตั้ง', type: 'radio', options: ['ไม่พบปัญหา', 'พบปัญหา'], selected: 'ไม่พบปัญหา' },
          ],
        },
      ],
    },
    {
      title: 'งานอื่นๆ',
      items: [
        {
          heading: 'ระบบป้องกันปลวก',
          fields: [
            { type: 'radio', options: ['ติดตั้งเรียบร้อย', 'ยังไม่ติดตั้ง'], selected: 'ติดตั้งเรียบร้อย' },
          ],
        },
      ],
    },
    {
      title: 'ความสะอาดและความเรียบร้อย',
      items: [
        {
          heading: 'การเข้าอยู่อาศัย',
          fields: [
            { type: 'radio', options: ['บ้านพร้อมเข้าอยู่อาศัย', 'บ้านยังไม่พร้อมเข้าอยู่อาศัย'], selected: 'บ้านยังไม่พร้อมเข้าอยู่อาศัย' },
          ],
        },
      ],
    },
  ])

  // ── ตอนเชื่อม backend uncomment ส่วนนี้ ─────────────────────────────────────
  // const fetchReport = async () => {
  //   const res  = await fetch('/api/report')
  //   const data = await res.json()
  //   reportSections.splice(0, reportSections.length, ...data.sections)
  // }
  // onMounted(fetchReport)

  return {
    reportSections,
  }
}