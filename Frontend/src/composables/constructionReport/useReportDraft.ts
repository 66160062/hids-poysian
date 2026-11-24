// ฉบับร่างรายงานก่อสร้างในเครื่อง (IndexedDB) — เก็บทั้งฟอร์มและรูป เพื่อให้ปิดแอป/เน็ตหลุดแล้วข้อมูลไม่หาย
// ใช้ IndexedDB แทน localStorage เพราะต้องเก็บไฟล์รูป (Blob) และ localStorage จำกัดราว 5 MB
// ทำงานได้ทั้งในเบราว์เซอร์และใน WKWebView ของ Capacitor
import type { ReportForm } from './reportForm';

const DB_NAME = 'hids-drafts';
const STORE = 'construction-daily-report';
const DRAFT_VERSION = 1;

export interface DraftPhoto {
  id: string;
  workId: string | null;
  isPanorama: boolean;
  name: string;
  type: string;
  blob: Blob;
}

export interface ReportDraft {
  version: number;
  roundId: number;
  savedAt: number;
  step: number;
  form: ReportForm;
  photos: DraftPhoto[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    });
  } finally {
    db.close();
  }
}

const keyFor = (roundId: number) => `round-${roundId}`;

export async function loadDraft(roundId: number): Promise<ReportDraft | null> {
  try {
    const draft = await withStore<ReportDraft | undefined>('readonly', (s) => s.get(keyFor(roundId)) as IDBRequest<ReportDraft | undefined>);
    if (!draft || draft.version !== DRAFT_VERSION) return null;
    return draft;
  } catch {
    return null;
  }
}

export async function saveDraft(draft: Omit<ReportDraft, 'version'>): Promise<boolean> {
  try {
    await withStore('readwrite', (s) => s.put({ ...draft, version: DRAFT_VERSION }, keyFor(draft.roundId)));
    return true;
  } catch {
    return false;
  }
}

export async function clearDraft(roundId: number): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.delete(keyFor(roundId)));
  } catch {
    // ลบไม่ได้ก็ไม่เป็นไร ร่างเก่าจะถูกเขียนทับรอบหน้า
  }
}
