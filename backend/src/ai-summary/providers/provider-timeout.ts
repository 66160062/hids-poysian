// Timeout ร่วมสำหรับ provider ที่เป็น cloud API — กัน fetch ค้างไม่รู้จบถ้า provider เน็ตช้า/ไม่ตอบ
// เพื่อให้ fallback chain ใน AiSummaryService ไปลอง provider ถัดไปได้เร็ว แทนที่จะรอเฉยๆ
export const PROVIDER_TIMEOUT_MS = 30_000;

// Ollama รันโมเดลบนเครื่องเอง (มักเป็น CPU) ช้ากว่า cloud API ปกติมาก โดยเฉพาะโมเดลใหญ่ๆ
// รอบแรกที่โมเดลยังไม่ถูกโหลดขึ้น RAM/VRAM อาจกินเวลาหลายสิบวินาทีถึงเป็นนาที ให้ timeout นานกว่า
export const OLLAMA_TIMEOUT_MS = 120_000;
