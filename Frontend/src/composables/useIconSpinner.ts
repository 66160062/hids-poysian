import { defineComponent, h } from 'vue';
import IconBounceSpinner from 'src/components/IconBounceSpinner.vue';

// สร้าง component spinner ที่ผูก icon ไว้ตายตัว สำหรับส่งเข้า $q.loading.show({ spinner })
// เพราะ Quasar Loading plugin ส่งต่อให้แค่ prop color/size เท่านั้น ไม่รองรับ prop เพิ่มเติมอย่าง icon
export function createIconSpinner(icon: string) {
  return defineComponent({
    name: 'IconSpinnerPreset',
    props: {
      color: String,
      size: [String, Number],
    },
    setup(props) {
      return () =>
        h(IconBounceSpinner, {
          icon,
          color: props.color ?? 'primary',
          size: props.size ?? '2em',
        });
    },
  });
}
