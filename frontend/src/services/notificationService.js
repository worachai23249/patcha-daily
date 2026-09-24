// Notification Service for LINE (Webhook & Messaging API) and Telegram Automation

const SETTINGS_KEY = 'patcha_daily_notification_settings';

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  notify_all: true, // แจ้งเตือนทุกรายการตามความต้องการของผู้ใช้
  line_webhook_url: 'https://script.google.com/macros/s/AKfycbzctnaoRU2nh_s9nSzXwKy0pBzx3TPk_vgkxluj9k44K06aMR3lf4NtLsykqesdEZbB/exec',
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
export async function sendPlatformMessage(messageText, rawData = {}) {
  const settings = getNotificationSettings();
  if (!settings.enabled) return { status: 'disabled' };

  const results = { line: false, telegram: false };

  // 1. Send via LINE Webhook (Make / Zapier / Google Apps Script / Custom Webhook)
  if (settings.line_webhook_url && settings.line_webhook_url.trim()) {
    try {
      const targetUrl = settings.line_webhook_url.trim();
      const payload = JSON.stringify({
        message: messageText,
        text: messageText,
        imageUrl: rawData.imageUrl || null,
        base64Image: rawData.base64Image || null,
        timestamp: new Date().toISOString()
      });

      // Try sending with no-cors mode for Google Apps Script compatibility
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload
      });
      results.line = true;
    } catch (err) {
      console.warn("LINE Webhook error:", err);
    }
  }

  // 2. Send via LINE Messaging API (Direct Channel Access Token)
  if (settings.line_access_token && settings.line_target_id) {
    try {
      await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.line_access_token.trim()}`
        },
        body: JSON.stringify({
          to: settings.line_target_id.trim(),
          messages: [{ type: 'text', text: messageText }]
        })
      });
      results.line = true;
    } catch (err) {
      console.warn("LINE Messaging API error:", err);
    }
  }

  // 3. Send via Telegram Bot API
  if (settings.telegram_bot_token && settings.telegram_chat_id) {
    try {
      const url = `https://api.telegram.org/bot${settings.telegram_bot_token.trim()}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegram_chat_id.trim(),
          text: messageText,
          parse_mode: 'HTML'
        })
      });
      results.telegram = true;
    } catch (err) {
      console.warn("Telegram Bot error:", err);
    }
  }

  return results;
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

export function cleanTransactionNote(note) {
  if (!note) return '';
  return note
    .replace(/\[สิ่งของ\/จ่ายให้\]/g, '')
    .replace(/\[ถวายสิ่งของ\]/g, '')
    .replace(/\[IN_KIND\]/g, '')
    .trim();
}

// ========== Format & Send Transaction Alert (ทุกรายการ) ==========
export async function sendTransactionNotification(tx, actionType = 'ADD') {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.notify_all) return;

  const isIncome = tx.type === 'INCOME';
  const inKind = isInKindTransaction(tx);
  
  let typeLabel = isIncome ? 'รายรับ' : 'รายจ่าย';
  if (inKind) {
    typeLabel = 'รายรับ (ถวายพิเศษ)';
  }

  const actionTitle = actionType === 'ADD' ? '🔔 มีการบันทึกรายการใหม่' : '🔔 มีการแก้ไขรายการ';
  const formattedAmount = Number(tx.amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cleanNote = cleanTransactionNote(tx.note);
  
  let dateFormatted = tx.transaction_date;
  try {
    dateFormatted = new Date(tx.transaction_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {}

  const msg = [
    actionTitle,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📌 ประเภท: ${typeLabel}`,
    inKind ? `💰 มูลค่า: ฿${formattedAmount} บาท` : `💰 จำนวนเงิน: ฿${formattedAmount} บาท`,
    `📂 หมวดหมู่: ${tx.description || 'ไม่ระบุ'}`,
    `📅 วันที่: ${dateFormatted}`,
    cleanNote ? `📝 หมายเหตุ: ${cleanNote}` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🌐 Patcha Daily`
  ].filter(Boolean).join('\n');

  return await sendPlatformMessage(msg, { 
    transaction: tx, 
    action: actionType,
    base64Image: tx.image_url || null,
    imageUrl: tx.image_url && tx.image_url.startsWith('https://') ? tx.image_url : null
  });
}

// ========== Format & Send Monthly Summary (สรุปรายเดือน) ==========
export async function sendMonthlySummaryNotification(year, monthNum, allTransactions, fmt) {
  const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const monthName = MONTHS_TH[monthNum - 1];
  const monthStr = monthNum.toString().padStart(2, '0');

  // Filter transactions for this month
  const monthTx = allTransactions.filter(t => t.transaction_date.startsWith(`${year}-${monthStr}`));
  
  let totalIncome = 0;
  let totalExpense = 0;
  monthTx.forEach(t => {
    if (t.type === 'INCOME') {
      if (isCashTransaction(t)) totalIncome += parseFloat(t.amount);
    } else {
      totalExpense += parseFloat(t.amount);
    }
  });
  const netBalance = totalIncome - totalExpense;

  // Calculate accumulated total balance across all history
  let totalOverallIncome = 0;
  let totalOverallExpense = 0;
  allTransactions.forEach(t => {
    if (t.type === 'INCOME') {
      if (isCashTransaction(t)) totalOverallIncome += parseFloat(t.amount);
    } else {
      totalOverallExpense += parseFloat(t.amount);
    }
  });
  const accumulatedBalance = totalOverallIncome - totalOverallExpense;

  const msg = [
    `📊 สรุปการเงินเดือน ${monthName} ${year}`,
    `🌐 Patcha Daily`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🟢 รายรับรวม:  +฿${fmt ? fmt(totalIncome) : totalIncome.toLocaleString('th-TH')} บาท`,
    `🔴 รายจ่ายรวม: -฿${fmt ? fmt(totalExpense) : totalExpense.toLocaleString('th-TH')} บาท`,
    `⚡ คงเหลือสุทธิ:  ${netBalance >= 0 ? '+' : '-'}฿${fmt ? fmt(Math.abs(netBalance)) : Math.abs(netBalance).toLocaleString('th-TH')} บาท`,
    `🏦 คงเหลือในคริสตจักร: ฿${fmt ? fmt(accumulatedBalance) : accumulatedBalance.toLocaleString('th-TH')} บาท`,
    `📋 รายการทั้งหมด: ${monthTx.length} รายการ`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🌐 เข้าดูระบบเพิ่มเติม: https://church-accounting.pages.dev`,
    `🙏 ขอพระเจ้าทรงอวยพระพรทุกท่าน`
  ].join('\n');

  return await sendPlatformMessage(msg, { year, monthNum, monthName, totalIncome, totalExpense, netBalance, accumulatedBalance });
}

// ========== Send Test Notification ==========
export async function sendTestNotification() {
  const msg = [
    `🧪 [Patcha Daily] ทดสอบการเชื่อมต่อการแจ้งเตือน`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `✅ ระบบแจ้งเตือน LINE / Telegram ทำงานถูกต้องเรียบร้อยแล้ว!`,
    `⏰ เวลาทดสอบ: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🌐 Patcha Daily`
  ].join('\n');

  return await sendPlatformMessage(msg, { test: true });
}
