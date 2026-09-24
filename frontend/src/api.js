// api.js — ไฟล์กลางสำหรับ URL ของ PHP API
// VITE_API_URL = Clever Cloud URL (CC_WEBROOT=/church_api → ไม่ต้องใส่ prefix)
// Local dev (XAMPP) → ใช้ ./church_api/ relative path เหมือนเดิม
const API_BASE = import.meta.env.VITE_API_URL || '';

export const api = (endpoint) =>
  API_BASE
    ? `${API_BASE}/${endpoint}`          // Clever Cloud: web root = church_api แล้ว
    : `./church_api/${endpoint}`;         // Local XAMPP: ต้องใส่ path เต็ม
