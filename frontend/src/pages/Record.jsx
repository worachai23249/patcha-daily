import { useState, useRef } from 'react';
import { addTransaction } from '../supabase';
import { isInKindTransaction, cleanTransactionNote } from '../services/notificationService';
import { Plus, Edit, Trash2, Image as ImageIcon, Database, Filter, Download, Upload, FileSpreadsheet, Gift } from 'lucide-react';
import Papa from 'papaparse';

export default function Record({ transactions, formatThaiDate, fmt, handleViewImage, handleOpenAddTransaction, handleOpenEditTransaction, handleDeleteTransaction }) {
  const [filterType, setFilterType] = useState('ALL');
  const fileInputRef = useRef(null);

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'ALL') return true;
    if (filterType === 'IN_KIND') return isInKindTransaction(t);
    if (filterType === 'INCOME') return t.type === 'INCOME' && !isInKindTransaction(t);
    return t.type === filterType;
  });

  // ========== ฟังก์ชัน Export ข้อมูล (ดาวน์โหลดเป็น CSV) ==========
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("ไม่มีข้อมูลที่จะส่งออก");
      return;
    }

    // แปลงข้อมูลเพื่อส่งออก (เอาพวก ID หรือ Field ที่ไม่จำเป็นออก)
    const exportData = filteredTransactions.map(t => ({
      วันที่: new Date(t.transaction_date).toLocaleDateString('th-TH'),
      ประเภท: t.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย',
      หมวดหมู่: t.description,
      จำนวนเงิน: Number(t.amount).toFixed(2),
      หมายเหตุ: t.note || '',
      รูปภาพ: t.image_url ? '[มีรูปภาพแนบ]' : '-'
    }));

    // แปลง Object เป็นโครงสร้าง CSV (รองรับภาษาไทย)
    const csv = Papa.unparse(exportData);
    // เติม BOM เพื่อให้ Excel ภาษาไทยอ่านออก ไม่เป็นต่างดาว
    const csvData = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });

    // สร้างลิงก์ลับเพื่อสั่งให้เบราว์เซอร์ดาวน์โหลด
    const link = document.createElement('a');
    link.href = URL.createObjectURL(csvData);
    link.setAttribute('download', `worship_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ========== ฟังก์ชัน Import ข้อมูล (อัปโหลดจาก CSV) ==========
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        if (data.length === 0) {
          alert("ไม่พบข้อมูลในไฟล์ หรือไฟล์ผิดรูปแบบ");
          return;
        }

        // แปลงหัวตารางภาษาไทยกลับเป็นรูปแบบที่ฐานข้อมูลเราต้องการ
        const formattedData = data.map(row => {
          // พยายามแปลงวันที่ให้เป็น YYYY-MM-DD
          let dateStr = row['วันที่'] || new Date().toISOString().split('T')[0];
          // เผื่อคนพิมพ์วันที่ไทยมา เช่น 28/2/2569
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              // สมมติว่ารูปแบบเป็น DD/MM/YYYY(ค.ศ.) แต่ถ้าเป็น พ.ศ. เอามาลบ 543
              let year = parseInt(parts[2]);
              if (year > 2500) year -= 543;
              dateStr = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }

          return {
            transaction_date: dateStr,
            type: row['ประเภท'] === 'รายรับ' ? 'INCOME' : 'EXPENSE',
            description: row['หมวดหมู่'] || 'Uncategorized',
            amount: parseFloat(row['จำนวนเงิน']?.toString().replace(/,/g, '') || 0),
            note: row['หมายเหตุ'] || '',
            image_url: null // ไม่รองรับการนำเข้ารูปจาก Excel เพราะยาวเกินไป
          };
        });

        // ส่งข้อมูลทั้งก้อนไปให้ Supabase ทีเดียว
        try {
          const resData = await addTransaction(formattedData);
          if (resData.status === 'success') {
            alert(resData.message);
            window.location.reload();
          } else {
            alert("เกิดข้อผิดพลาด: " + resData.message);
          }
        } catch (err) {
          console.error(err);
          alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        }

        // ล้างอินพุตเพื่อให้เลือกไฟล์เดิมใหม่ได้ถ้ามีแก้
        e.target.value = null;
      },
      error: (error) => {
        alert("อ่านไฟล์ไม่สำเร็จ: " + error.message);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 mt-4 xl:mt-0">
      {/* Header */}
      <div className="mb-8 relative animate-fade-in-up">
        <div className="absolute -left-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-pulse-glow"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2 pb-1 tracking-tighter drop-shadow-sm">Transaction Logs</h1>
            <p className="text-slate-500 dark:text-[#94A3B8] text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2">
              <Database size={14} className="text-blue-500" />
              บันทึกการเงินและรายการทั้งหมด
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={handleExportCSV}
              className="group relative flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 border border-slate-200 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white px-5 py-3.5 md:py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-95 shadow-sm"
            >
              <Download size={16} className="text-blue-400 group-hover:translate-y-1 transition-transform duration-300" />
              <span>ส่งออก</span>
            </button>
            <button
              onClick={handleOpenAddTransaction}
              className="group relative flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3.5 md:py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] hover:-translate-y-1 active:scale-95 overflow-hidden w-full md:w-auto"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300 relative z-10" />
              <span className="relative z-10">บันทึกรายการ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white/70 dark:bg-[#0B1121]/60 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-[20px] p-1 mb-6 max-w-xl shadow-sm animate-fade-in-up">
        <button onClick={() => setFilterType('ALL')} className={`group flex-1 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 ${filterType === 'ALL' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-800 dark:hover:text-white'}`}>
          <Filter size={12} className={filterType === 'ALL' ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} />
          ทั้งหมด
        </button>
        <button onClick={() => setFilterType('INCOME')} className={`flex-1 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 ${filterType === 'INCOME' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm' : 'text-slate-500 dark:text-[#94A3B8] hover:text-emerald-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${filterType === 'INCOME' ? 'bg-white' : 'bg-emerald-500'}`}></span>
          รายรับ
        </button>
        <button onClick={() => setFilterType('EXPENSE')} className={`flex-1 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 ${filterType === 'EXPENSE' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm' : 'text-slate-500 dark:text-[#94A3B8] hover:text-rose-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${filterType === 'EXPENSE' ? 'bg-white' : 'bg-rose-500'}`}></span>
          รายจ่าย
        </button>
        <button onClick={() => setFilterType('IN_KIND')} className={`flex-1 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 ${filterType === 'IN_KIND' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20' : 'text-slate-500 dark:text-[#94A3B8] hover:text-purple-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${filterType === 'IN_KIND' ? 'bg-white' : 'bg-purple-500'}`}></span>
          🎁 สิ่งของ
        </button>
      </div>

      {/* Premium Card Grid — All screens */}
      <div className="animate-fade-in-up">
        {filteredTransactions.length === 0 ? (
          <div className="glass-panel rounded-[24px] p-12 flex flex-col items-center text-slate-400 space-y-4">
            <div className="w-14 h-14 rounded-full border-2 border-slate-300 dark:border-[#334155] border-t-blue-500 flex items-center justify-center"><Database size={20} className="text-slate-400" /></div>
            <span className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-[#94A3B8]">No Data Found</span>
            <span className="text-xs text-slate-400">ไม่พบข้อมูลในหมวดหมู่นี้</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-0">
            {filteredTransactions.map((t) => {
              const isIncome = t.type === 'INCOME';
              const inKind = isInKindTransaction(t);
              const cleanNote = cleanTransactionNote(t.note);

              return (
                <div
                  key={t.id}
                  className={`glass-panel relative rounded-[22px] overflow-hidden
                    border ${inKind ? 'border-purple-400/50 dark:border-purple-500/40 bg-purple-950/10' : (isIncome ? 'border-emerald-400/40 dark:border-emerald-500/30' : 'border-rose-400/40 dark:border-rose-500/30')}`}
                >
                  {/* Top shimmer line */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] ${inKind ? 'bg-gradient-to-r from-transparent via-purple-400 to-transparent' : (isIncome ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-400 to-transparent')}`} />
                  {/* Ambient glow */}
                  <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl pointer-events-none opacity-0 dark:opacity-100 ${inKind ? 'bg-purple-500/25' : (isIncome ? 'bg-emerald-500/20' : 'bg-rose-500/20')}`} />

                  {/* HEADER */}
                  <div className="relative flex items-center justify-between px-5 pt-4 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${inKind ? 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.9)]' : (isIncome ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.9)]')}`} />
                      {inKind ? (
                        <span className="text-xs md:text-sm font-black tracking-[0.15em] uppercase text-purple-400 flex items-center gap-1">
                          🎁 ถวายสิ่งของ/จ่ายให้
                        </span>
                      ) : (
                        <span className={`text-sm font-black tracking-[0.25em] uppercase ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>{isIncome ? 'รายรับ' : 'รายจ่าย'}</span>
                      )}
                    </div>
                    <span className="text-sm text-slate-500 dark:text-white font-bold tracking-wide">{formatThaiDate(t.transaction_date)}</span>
                  </div>

                  {/* Divider */}
                  <div className={`mx-5 h-px ${inKind ? 'bg-gradient-to-r from-transparent via-purple-500/30 to-transparent' : (isIncome ? 'bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-500/30 to-transparent')}`} />

                  {/* BODY */}
                  <div className="relative flex items-center justify-between px-5 py-4">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-base font-black text-slate-800 dark:text-white mb-1.5 truncate tracking-tight">{t.description}</p>
                      {inKind ? (
                        <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-300">
                          ฿{fmt(t.amount)}
                        </span>
                      ) : (
                        <span className={`text-2xl font-black tracking-tight ${isIncome ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-300 dark:to-emerald-500' : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-600 dark:from-rose-300 dark:to-rose-500'}`}>
                          {isIncome ? '+' : '-'}฿{fmt(t.amount)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => t.image_url && handleViewImage(t.image_url)}
                      className={`relative w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 active:scale-95
                        ${t.image_url
                          ? `cursor-pointer border-2 ${inKind ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : (isIncome ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]')}`
                          : 'border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 cursor-default opacity-40'}`}
                    >
                      {t.image_url ? <img src={t.image_url} alt="Receipt" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-400 dark:text-white/30" />}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className={`mx-5 h-px ${inKind ? 'bg-gradient-to-r from-transparent via-purple-500/20 to-transparent' : (isIncome ? 'bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-500/20 to-transparent')}`} />

                  {/* FOOTER */}
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className="text-slate-400 dark:text-white/25 text-[10px] font-black uppercase tracking-widest shrink-0">NOTE</span>
                      <span className="text-xs text-slate-500 dark:text-white/60 font-medium truncate">{cleanNote || (inKind ? 'ถวายสิ่งของ/ชำระให้โดยตรง' : '—')}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); handleOpenEditTransaction(t); }} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-400 dark:text-white/50 hover:text-blue-500 hover:border-blue-400/50 active:scale-95 transition-all"><Edit size={13} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(t.id); }} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-400 dark:text-white/50 hover:text-rose-500 hover:border-rose-400/50 active:scale-95 transition-all"><Trash2 size={13} /></button>
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