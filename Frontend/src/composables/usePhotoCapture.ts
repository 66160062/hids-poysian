import imageCompression from 'browser-image-compression';

// ถ่ายรูป/เลือกรูปผ่านจุดเดียว — ตอนนี้ใช้ <input type="file" capture> ของเบราว์เซอร์
// เมื่อห่อเป็นแอป iOS ด้วย Capacitor ให้เปลี่ยนเฉพาะ pickRaw() เป็น @capacitor/camera
// (Camera.getPhoto แล้วแปลง webPath เป็น File) ส่วนที่เรียกใช้ไม่ต้องแก้

export type PhotoSource = 'camera' | 'gallery';

function pickRaw(source: PhotoSource): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // capture = เปิดกล้องหลังทันทีบนมือถือ (เดสก์ท็อปจะเปิดตัวเลือกไฟล์ตามปกติ)
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.style.display = 'none';
    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(file);
    };
    input.addEventListener('change', () => finish(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => finish(null));
    document.body.appendChild(input);
    input.click();
  });
}

// บีบอัดตั้งแต่ตอนถ่าย: ฉบับร่างในเครื่องเล็กลง และตอนส่งบนเน็ตหน้างานไม่ต้องรอบีบอัดอีก
async function compress(file: File): Promise<File> {
  try {
    const out = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true });
    return new File([out], file.name || 'photo.jpg', { type: out.type || file.type || 'image/jpeg' });
  } catch {
    return file;
  }
}

export function usePhotoCapture() {
  /**
   * onProcessing ถูกเรียกเมื่อได้รูปแล้วและกำลังบีบอัด — ใช้แสดง loading ช่วงนี้เท่านั้น
   * (เบราว์เซอร์รุ่นเก่าไม่ส่ง event ตอนกดยกเลิกกล้อง ถ้าแสดง loading ตั้งแต่เปิดกล้องจะค้างได้)
   */
  async function takePhoto(source: PhotoSource = 'camera', onProcessing?: () => void): Promise<File | null> {
    const file = await pickRaw(source);
    if (!file) return null;
    onProcessing?.();
    return compress(file);
  }
  return { takePhoto };
}
