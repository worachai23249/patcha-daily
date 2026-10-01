// Notification Service for LINE (Webhook & Messaging API) and Telegram Automation

const SETTINGS_KEY = 'patcha_daily_notification_settings';

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: false,
  notify_all: false,
  line_webhook_url: '',
  line_access_token: '',
  line_target_id: '',
  telegram_bot_token: '',
  telegram_chat_id: '',
};

// Upload removed - Google Apps Script handles image hosting via Google Drive directly

export function getNotificationSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...parsed,
        enabled: false,
        notify_all: false,
        line_webhook_url: parsed.line_webhook_url && parsed.line_webhook_url.trim() ? parsed.line_webhook_url.trim() : DEFAULT_NOTIFICATION_SETTINGS.line_webhook_url
      };
    }
  } catch (e) {
    console.error("Failed to load notification settings:", e);
  }
  return { ...DEFAULT_NOTIFICATION_SETTINGS };
}

export function saveNotificationSettings(settings) {
  try {
    const updated = { ...getNotificationSettings(), ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to save notification settings:", e);
    return null;
  }
}

// ========== Send raw text/payload to configured platforms ==========
export async function sendPlatformMessage() {
  return { status: 'disabled', line: false, telegram: false };
}



// ========== In-Kind (สิ่งของ/จ่ายให้) Helpers ==========
export function isInKindTransaction(tx) {
  if (!tx || tx.type !== 'INCOME') return false;
  const note = (tx.note || '').trim();
  return note.includes('[สิ่งของ/จ่ายให้]') || note.includes('[ถวายสิ่งของ]') || note.includes('[IN_KIND]');
}

export function isCashTransaction(tx) {
  return !isInKindTransaction(tx);
}

export function getPaymentMethod(tx) {
  const note = (tx && tx.note) || '';
  if (note.includes('[เงินโอน]')) return 'TRANSFER';
  return 'CASH';
}

export function cleanTransactionNote(note) {
  if (!note) return '';
  return note
    .replace(/\[เงินสด\]/g, '')
    .replace(/\[เงินโอน\]/g, '')
    .replace(/\[สิ่งของ\/จ่ายให้\]/g, '')
    .replace(/\[ถวายสิ่งของ\]/g, '')
    .replace(/\[IN_KIND\]/g, '')
    .trim();
}

// ========== Format & Send Transaction Alert (ทุกรายการ) ==========
export async function sendTransactionNotification() {
  return;
}

// ========== Format & Send Monthly Summary (สรุปรายเดือน) ==========
export async function sendMonthlySummaryNotification() {
  return { line: false, telegram: false, status: 'disabled' };
}

// ========== Send Test Notification ==========
export async function sendTestNotification() {
  return { line: false, telegram: false, status: 'disabled' };
}
