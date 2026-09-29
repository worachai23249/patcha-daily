import { useState } from 'react';
import { cleanTransactionNote } from '../services/notificationService';
import { Plus, Edit, Trash2, Image as ImageIcon, Database, Filter, Download } from 'lucide-react';
import Papa from 'papaparse';

export default function Record({ transactions, formatThaiDate, fmt, handleViewImage, handleOpenAddTransaction, handleOpenEditTransaction, handleDeleteTransaction }) {
  const [filterType, setFilterType] = useState('ALL');

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'ALL') return true;
    if (filterType === 'TRANSFER') return (t.note || '').includes('[เงินโอน]');
    if (filterType === 'CASH') return (t.note || '').includes('[เงินสด]') || !(t.note || '').includes('[เงินโอน]');
    return t.type === filterType;
  });

  // ========== ฟังก์ชัน Export ข้อมูล (ดาวน์โหลดเป็น CSV) ==========
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("ไม่มีข้อมูลที่จะส่งออก");
      return;
    }

    const exportData = filteredTransactions.map(t => ({
      วันที่: new Date(t.transaction_date).toLocaleDateString('th-TH'),
      ประเภท: t.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย',
      หมวดหมู่: t.description,
      จำนวนเงิน: Number(t.amount).toFixed(2),
      หมายเหตุ: t.note || '',
      รูปภาพ: t.image_url ? '[มีรูปภาพแนบ]' : '-'
    }));

    const csv = Papa.unparse(exportData);
    const csvData = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(csvData);
    link.setAttribute('download', `patcha_daily_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 mt-4 xl:mt-0">
      {/* Header */}
      <div className="mb-8 relative animate-fade-in-up">
        <div className="absolute -left-6 -top-6 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl animate-pulse-glow"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 dark:from-pink-300 dark:via-rose-300 dark:to-pink-400 mb-2 pb-1 tracking-tighter drop-shadow-sm flex items-center gap-2">
              📝 Transaction Records ✨
            </h1>
            <p className="text-gray-500 dark:text-[#94A3B8] text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2">
              <Database size={14} className="text-pink-400" />
              บันทึกการเงินและรายการทั้งหมด 🌸
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={handleExportCSV}
              className="group relative flex items-center justify-center space-x-2 glass-panel glass-panel-hover border border-white/80 dark:border-white/10 text-gray-700 dark:text-white px-5 py-3.5 md:py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-95 shadow-sm"
            >
              <Download size={16} className="text-pink-400 group-hover:translate-y-1 transition-transform duration-300" />
              <span>📥 ส่งออก CSV 🌸</span>
            </button>
            <button
              onClick={handleOpenAddTransaction}
              className="group relative flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 hover:from-pink-600 hover:to-rose-500 text-white px-6 py-3.5 md:py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-[0_8px_25px_-5px_rgba(244,114,182,0.45)] hover:shadow-[0_12px_30px_-5px_rgba(244,114,182,0.6)] hover:-translate-y-0.5 active:scale-95 overflow-hidden w-full md:w-auto"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300 relative z-10" />
              <span className="relative z-10">➕ บันทึกรายการ ✨</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex glass-panel border border-white/80 dark:border-white/5 rounded-2xl p-1.5 mb-6 max-w-xl shadow-sm animate-fade-in-up">
        <button onClick={() => setFilterType('ALL')} className={`group flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 ${filterType === 'ALL' ? 'bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white shadow-sm' : 'text-gray-500 dark:text-[#94A3B8] hover:text-pink-500 dark:hover:text-white'}`}>
          <Filter size={12} className={filterType === 'ALL' ? 'text-white' : 'text-gray-400 group-hover:text-pink-400'} />
          🌸 ทั้งหมด
        </button>
        <button onClick={() => setFilterType('INCOME')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 ${filterType === 'INCOME' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm' : 'text-gray-500 dark:text-[#94A3B8] hover:text-emerald-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${filterType === 'INCOME' ? 'bg-white' : 'bg-emerald-500'}`}></span>
          รายรับ
        </button>
        <button onClick={() => setFilterType('EXPENSE')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 ${filterType === 'EXPENSE' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm' : 'text-gray-500 dark:text-[#94A3B8] hover:text-rose-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${filterType === 'EXPENSE' ? 'bg-white' : 'bg-rose-500'}`}></span>
          รายจ่าย
        </button>
        <button onClick={() => setFilterType('TRANSFER')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 ${filterType === 'TRANSFER' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/25' : 'text-gray-500 dark:text-[#94A3B8] hover:text-blue-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${filterType === 'TRANSFER' ? 'bg-white' : 'bg-blue-500'}`}></span>
          💳 เงินโอน
        </button>
        <button onClick={() => setFilterType('CASH')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 ${filterType === 'CASH' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/20' : 'text-gray-500 dark:text-[#94A3B8] hover:text-emerald-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${filterType === 'CASH' ? 'bg-white' : 'bg-emerald-500'}`}></span>
          💵 เงินสด
        </button>
      </div>

      {/* Premium Card Grid — All screens */}
      <div className="animate-fade-in-up">
        {filteredTransactions.length === 0 ? (
          <div className="glass-panel rounded-[24px] p-12 flex flex-col items-center text-gray-400 space-y-4">
            <div className="w-14 h-14 rounded-full border-2 border-pink-300 dark:border-[#334155] border-t-blue-500 flex items-center justify-center"><Database size={20} className="text-gray-400" /></div>
            <span className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-[#94A3B8]">No Data Found</span>
            <span className="text-xs text-gray-400">ไม่พบข้อมูลในหมวดหมู่นี้</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-0">
            {filteredTransactions.map((t) => {
              const isIncome = t.type === 'INCOME';
              const isTransfer = (t.note || '').includes('[เงินโอน]');
              const cleanNote = cleanTransactionNote(t.note);

              let theme = {
                border: 'border-emerald-400/50 dark:border-emerald-500/40 bg-emerald-500/5',
                shimmer: 'via-emerald-400',
                glow: 'bg-emerald-500/20',
                dot: 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]',
                badge: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300/60 dark:border-emerald-800/60',
                badgeText: '💵 เงินสด',
                typeText: 'text-emerald-600 dark:text-emerald-400',
                typeLabel: 'รายรับ',
                amountGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-300 dark:to-teal-400',
                sign: '+'
              };

              if (!isIncome) {
                theme = {
                  border: 'border-rose-400/50 dark:border-rose-500/40 bg-rose-500/5',
                  shimmer: 'via-rose-400',
                  glow: 'bg-rose-500/20',
                  dot: 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.9)]',
                  badge: isTransfer ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/70 border border-blue-300/60 dark:border-blue-800/60' : 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 border border-rose-300/60 dark:border-rose-800/60',
                  badgeText: isTransfer ? '💳 เงินโอน' : '💵 เงินสด',
                  typeText: 'text-rose-600 dark:text-rose-400',
                  typeLabel: 'รายจ่าย',
                  amountGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-600 dark:from-rose-300 dark:to-rose-500',
                  sign: '-'
                };
              } else if (isTransfer) {
                theme = {
                  border: 'border-cyan-400/50 dark:border-cyan-500/40 bg-cyan-500/5',
                  shimmer: 'via-cyan-400',
                  glow: 'bg-cyan-500/25',
                  dot: 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)]',
                  badge: 'text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-300/60 dark:border-cyan-800/60',
                  badgeText: '💳 เงินโอน',
                  typeText: 'text-cyan-600 dark:text-cyan-400',
                  typeLabel: 'รายรับ',
                  amountGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 dark:from-cyan-300 dark:via-blue-300 dark:to-indigo-300',
                  sign: '+'
                };
              }

              return (
                <div
                  key={t.id}
                  className={`glass-panel relative rounded-[22px] overflow-hidden border ${theme.border}`}
                >
                  {/* Top shimmer line */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${theme.shimmer} to-transparent`} />
                  {/* Ambient glow */}
                  <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl pointer-events-none opacity-0 dark:opacity-100 ${theme.glow}`} />

                  {/* HEADER */}
                  <div className="relative flex items-center justify-between px-5 pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                      <span className={`text-sm font-black tracking-[0.2em] uppercase ${theme.typeText}`}>
                        {theme.typeLabel}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${theme.badge}`}>
                        {theme.badgeText}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-white font-bold tracking-wide">{formatThaiDate(t.transaction_date)}</span>
                  </div>

                  {/* Divider */}
                  <div className="mx-5 h-px bg-pink-100 dark:bg-white/10" />

                  {/* BODY */}
                  <div className="relative flex items-center justify-between px-5 py-4">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-base font-black text-gray-800 dark:text-white mb-1.5 truncate tracking-tight">{t.description}</p>
                      <span className={`text-2xl font-black tracking-tight ${theme.amountGradient}`}>
                        {theme.sign}฿{fmt(t.amount)}
                      </span>
                    </div>
                    <button
                      onClick={() => t.image_url && handleViewImage(t.image_url)}
                      className={`relative w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 active:scale-95
                        ${t.image_url ? 'cursor-pointer border-2 border-pink-300/50 dark:border-white/20 shadow-md' : 'border border-pink-200 dark:border-white/10 bg-pink-50 dark:bg-pink-50/60 cursor-default opacity-40'}`}
                    >
                      {t.image_url ? <img src={t.image_url} alt="Receipt" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-400 dark:text-white/30" />}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="mx-5 h-px bg-pink-100 dark:bg-white/10" />

                  {/* FOOTER */}
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className="text-gray-400 dark:text-white/25 text-[10px] font-black uppercase tracking-widest shrink-0">NOTE</span>
                      <span className="text-xs text-gray-500 dark:text-white/60 font-medium truncate">{cleanNote || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); handleOpenEditTransaction(t); }} className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-50/80 border border-pink-200 dark:border-white/15 flex items-center justify-center text-gray-400 dark:text-white/50 hover:text-pink-400 hover:border-pink-400/50 active:scale-95 transition-all"><Edit size={13} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(t.id); }} className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-50/80 border border-pink-200 dark:border-white/15 flex items-center justify-center text-gray-400 dark:text-white/50 hover:text-rose-500 hover:border-rose-400/50 active:scale-95 transition-all"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}