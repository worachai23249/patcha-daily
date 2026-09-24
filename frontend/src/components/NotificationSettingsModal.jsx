import { useState, useEffect } from 'react';
import { X, Bell, Send, CheckCircle2, Copy, AlertCircle, MessageSquare, ShieldCheck, Sparkles, Lock, Unlock } from 'lucide-react';
import { getNotificationSettings, saveNotificationSettings, sendTestNotification, sendMonthlySummaryNotification } from '../services/notificationService';

export default function NotificationSettingsModal({ isOpen, onClose, transactions = [], fmt, showSuccess }) {
  const [settings, setSettings] = useState(getNotificationSettings());
  const [isUrlLocked, setIsUrlLocked] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingSummary, setIsSendingSummary] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });

  useEffect(() => {
    if (isOpen) {
      setSettings(getNotificationSettings());
      setIsUrlLocked(true);
      setStatusMsg({ text: '', isError: false });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveNotificationSettings(settings);
    if (showSuccess) showSuccess('บันทึกสำเร็จ', 'บันทึกการตั้งค่าการแจ้งเตือน LINE เรียบร้อยแล้ว');
    onClose();
  };

  const handleTest = async () => {
    setIsSendingTest(true);
    setStatusMsg({ text: 'กำลังส่งข้อความทดสอบ...', isError: false });
    saveNotificationSettings(settings);
    try {
      const res = await sendTestNotification();
      if (res.line) {
        setStatusMsg({ text: '✅ ส่งข้อความทดสอบเข้า LINE สำเร็จ!', isError: false });
      } else {
        setStatusMsg({ text: '⚠️ กรุณาตรวจสอบ Webhook URL ที่ตั้งไว้', isError: true });
      }
    } catch (err) {
      setStatusMsg({ text: 'เกิดข้อผิดพลาดในการส่งข้อความ: ' + err.message, isError: true });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendMonthlySummary = async () => {
    setIsSendingSummary(true);
    setStatusMsg({ text: 'กำลังส่งรายงานสรุปประจำเดือน...', isError: false });
    saveNotificationSettings(settings);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const res = await sendMonthlySummaryNotification(currentYear, currentMonth, transactions, fmt);
      if (res.line) {
        setStatusMsg({ text: '✅ ส่งรายงานสรุปประจำเดือนเข้า LINE สำเร็จ!', isError: false });
      } else {
        setStatusMsg({ text: '⚠️ กรุณาตั้งค่า LINE Webhook ก่อนส่งรายงาน', isError: true });
      }
    } catch (err) {
      setStatusMsg({ text: 'เกิดข้อผิดพลาด: ' + err.message, isError: true });
    } finally {
      setIsSendingSummary(false);
    }
  };

  const gasTemplateCode = `// Google Apps Script สำหรับส่งเข้า LINE ผ่าน Messaging API (ฟรี 100%)
function doPost(e) {
  var ACCESS_TOKEN = "ใส่_CHANNEL_ACCESS_TOKEN_ที่นี่";
  var TARGET_ID = "ใส่_GROUP_ID_หรือ_USER_ID_ที่นี่"; // ID ของกลุ่ม LINE หรือ User ID

  var data = JSON.parse(e.postData.contents);
  var message = data.message;

  var url = "https://api.line.me/v2/bot/message/push";
  var payload = {
    "to": TARGET_ID,
    "messages": [{ "type": "text", "text": message }]
  };

  UrlFetchApp.fetch(url, {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + ACCESS_TOKEN
    },
    "payload": JSON.stringify(payload)
  });

  return ContentService.createTextOutput("OK");
};`;

  const copyScript = () => {
    navigator.clipboard.writeText(gasTemplateCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-[#060A13]/80 backdrop-blur-xl animate-fade-in font-sans">
      <div className="glass-panel w-[95vw] sm:w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-[24px] md:rounded-[36px] shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-fade-in-up">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-200/50 dark:border-white/10 shrink-0 bg-white/40 dark:bg-[#0F172A]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] shrink-0">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">
                ระบบแจ้งเตือน LINE อัตโนมัติ
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-bold">
                แจ้งเตือนทุกรายการ + สรุปรายงานรายเดือนเข้ากลุ่มอัตโนมัติ
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-transparent text-slate-500 dark:text-[#94A3B8] rounded-full hover:text-white hover:bg-slate-800 dark:hover:bg-[#334155] hover:rotate-90 transition-all shadow-sm">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 md:p-6 space-y-5 overflow-y-auto custom-scrollbar bg-white/40 dark:bg-transparent flex-1">
          
          {/* Status Message Alert */}
          {statusMsg.text && (
            <div className={`p-3.5 rounded-2xl text-xs font-black flex items-center gap-2.5 animate-fade-in ${statusMsg.isError ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
              {statusMsg.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Master Enable Switch */}
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-500" />
              <div>
                <span className="text-sm font-black text-slate-800 dark:text-white block">เปิดใช้งานระบบแจ้งเตือน LINE</span>
                <span className="text-[11px] text-slate-400 font-bold">เปิด/ปิด การส่งข้อความแจ้งเตือนทั้งหมด</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} className="sr-only" />
              <div className={`w-12 h-6.5 rounded-full transition-all duration-300 relative ${settings.enabled ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-slate-300 dark:bg-white/20'}`}>
                <div className={`w-5.5 h-5.5 bg-white rounded-full transition-transform duration-300 absolute top-[2px] shadow-md ${settings.enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}></div>
              </div>
            </label>
          </div>

          {/* Section 1: LINE Integration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">1. การเชื่อมต่อ LINE Webhook</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsUrlLocked(!isUrlLocked)}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 ${
                  isUrlLocked
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                {isUrlLocked ? <Lock size={12} /> : <Unlock size={12} />}
                {isUrlLocked ? '🔒 ปลดล็อกเพื่อแก้ไข' : '🔓 ล็อกป้องกัน'}
              </button>
            </div>
            
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060A13]/60 border border-slate-200/50 dark:border-white/5 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-black text-slate-500 dark:text-[#64748B] uppercase tracking-widest">
                    LINE Webhook URL (Make / Zapier / Google Apps Script)
                  </label>
                  {isUrlLocked && (
                    <span className="text-[10px] text-amber-500/90 dark:text-amber-400/90 font-bold">
                      * ล็อกป้องกันการเผลอลบ
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.line_webhook_url}
                    readOnly={isUrlLocked}
                    onChange={(e) => setSettings({ ...settings, line_webhook_url: e.target.value })}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className={`w-full p-3 pr-10 border rounded-xl outline-none text-xs font-mono transition-all ${
                      isUrlLocked
                        ? 'bg-slate-100/80 dark:bg-[#0F172A]/50 border-slate-200/80 dark:border-white/5 text-slate-500 dark:text-slate-400 cursor-not-allowed select-all'
                        : 'bg-white dark:bg-[#0F172A] border-emerald-500/50 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/50'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    {isUrlLocked ? <Lock size={14} className="text-amber-500/80" /> : <Unlock size={14} className="text-emerald-500/80" />}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    โค้ดเชื่อมต่อกลุ่ม LINE ฟรี 100% (Google Apps Script):
                  </span>
                  <button type="button" onClick={copyScript} className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 flex items-center gap-1">
                    {copiedScript ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                    {copiedScript ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Notification Rules */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">2. เงื่อนไขการแจ้งเตือน</h4>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060A13]/60 border border-slate-200/50 dark:border-white/5">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-black text-slate-800 dark:text-white block">แจ้งเตือนทุกรายการเมื่อมีการบันทึก</span>
                  <span className="text-[10px] text-slate-400 font-bold">ส่งข้อความทันทีเมื่อบันทึกหรือแก้ไขรายรับ/รายจ่ายทุกรายการ</span>
                </div>
                <input type="checkbox" checked={settings.notify_all} onChange={(e) => setSettings({ ...settings, notify_all: e.target.checked })} className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500" />
              </label>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={isSendingTest}
              className="flex-1 min-w-[140px] py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Send size={14} className={isSendingTest ? 'animate-spin' : ''} />
              <span>{isSendingTest ? 'กำลังทดสอบ...' : '🧪 ทดสอบส่งข้อความ'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendMonthlySummary}
              disabled={isSendingSummary}
              className="flex-1 min-w-[180px] py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <MessageSquare size={14} className={isSendingSummary ? 'animate-spin' : ''} />
              <span>{isSendingSummary ? 'กำลังส่ง...' : '📊 ส่งสรุปประจำเดือนนี้เข้า LINE'}</span>
            </button>
          </div>

          {/* Save Button */}
          <div className="pt-3 border-t border-slate-200/50 dark:border-white/10 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
            >
              บันทึกการตั้งค่า
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
