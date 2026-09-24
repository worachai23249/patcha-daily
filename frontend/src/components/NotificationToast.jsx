import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

/* ── Single Toast Card ── */
function ToastCard({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const isIncome = toast.type === 'INCOME';

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 350);
  };

  useEffect(() => {
    const t = setTimeout(dismiss, 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`relative flex items-start gap-3 w-80 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl overflow-hidden transition-all duration-350
        ${isIncome
          ? 'bg-emerald-950/90 border-emerald-500/30 shadow-emerald-900/40'
          : 'bg-rose-950/90 border-rose-500/30 shadow-rose-900/40'}
        ${exiting ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}
      `}
      style={{ animation: exiting ? '' : 'toastSlideIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}
    >
      {/* Left glow bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${isIncome ? 'bg-emerald-400' : 'bg-rose-400'}`} />

      {/* Icon */}
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-inner
        ${isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
        {isIncome
          ? <TrendingUp size={18} />
          : <TrendingDown size={18} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isIncome ? '📥 รายรับใหม่' : '📤 รายจ่ายใหม่'}
        </p>
        <p className="text-white font-bold text-sm truncate">{toast.description}</p>
        <p className={`text-lg font-black mt-0.5 ${isIncome ? 'text-emerald-300' : 'text-rose-300'}`}>
          {isIncome ? '+' : '-'}฿{Number(toast.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Close */}
      <button
        onClick={dismiss}
        className="shrink-0 text-white/40 hover:text-white transition-colors mt-0.5"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div className={`absolute bottom-0 left-0 h-[3px] rounded-full ${isIncome ? 'bg-emerald-400' : 'bg-rose-400'}`}
        style={{ animation: 'toastProgress 5s linear forwards' }}
      />

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(80px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)   scale(1);   }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/* ── Toast Container ── */
export default function NotificationToast({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
