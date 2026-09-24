import { useState } from 'react';
import { Plus, Edit2, Trash2, Box, Layers } from 'lucide-react';

export default function Categories({ categories = [], transactions = [], handleOpenAddCategory, handleOpenEditCategory, handleDeleteCategory }) {
  const [categoryTab, setCategoryTab] = useState('INCOME');

  const incomeCategories = categories.filter(c => c.type === 'INCOME');
  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
  const currentCategories = categoryTab === 'INCOME' ? incomeCategories : expenseCategories;

  return (
    <div className="max-w-7xl mx-auto pb-20 mt-4 xl:mt-0 font-sans">

      {/* Header section */}
      <div className="mb-10 relative animate-fade-in-up">
        <div className="absolute -left-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-pulse-glow"></div>
        <div className="absolute top-0 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2 pb-2 tracking-tighter drop-shadow-sm">System Categories</h1>
            <p className="text-slate-500 dark:text-[#94A3B8] text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2">
              <Layers size={14} className="text-blue-500" />
              จัดการหมวดหมู่รายรับรายจ่าย
            </p>
          </div>
          <button
            onClick={handleOpenAddCategory}
            className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-[#60A5FA] to-[#A855F7] hover:from-[#3B82F6] hover:to-[#9333EA] text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:-translate-y-1 active:scale-95 overflow-hidden w-full md:w-auto mt-4 md:mt-0 mt-3 md:mt-0"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300 relative z-10" />
            <span className="relative z-10">เพิ่มหมวดหมู่ใหม่</span>
          </button>
        </div>
      </div>

      {/* Tabs แบบ Glassmorphism */}
      <div className="flex bg-white/70 dark:bg-[#0B1121]/60 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-[24px] p-1 md:p-2 mb-8 max-w-2xl shadow-sm animate-fade-in-up">
        <button
          onClick={() => setCategoryTab('INCOME')}
          className={`flex-1 py-3 md:py-3.5 rounded-[18px] text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 md:gap-3 transition-all duration-200 ${categoryTab === 'INCOME' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm' : 'text-slate-500 dark:text-[#94A3B8] hover:text-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10'}`}>
          <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${categoryTab === 'INCOME' ? 'bg-white' : 'bg-emerald-500'}`}></span>
          <span className="hidden sm:inline">หมวดหมู่รายรับ ({incomeCategories.length})</span><span className="sm:hidden">รายรับ ({incomeCategories.length})</span>
        </button>
        <button
          onClick={() => setCategoryTab('EXPENSE')}
          className={`flex-1 py-3 md:py-3.5 rounded-[18px] text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 md:gap-3 transition-all duration-200 ${categoryTab === 'EXPENSE' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm' : 'text-slate-500 dark:text-[#94A3B8] hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-500/10'}`}>
          <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${categoryTab === 'EXPENSE' ? 'bg-white' : 'bg-rose-500'}`}></span>
          <span className="hidden sm:inline">หมวดหมู่รายจ่าย ({expenseCategories.length})</span><span className="sm:hidden">รายจ่าย ({expenseCategories.length})</span>
        </button>
      </div>

      {/* Grid การ์ดหมวดหมู่ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
        {currentCategories.map((c) => {
          const usageCount = transactions.filter(t => t.description === c.name).length;
          return (
            <div
              key={c.id}
              className="group glass-panel glass-panel-hover p-6 rounded-[28px] flex flex-col justify-between relative overflow-hidden h-[180px]"
            >
              {/* Background gradient flare on hover */}
              <div
                className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ease-in-out"
                style={{ backgroundColor: c.color }}
              ></div>

              <div className="flex justify-between items-start relative z-10">
                {/* ไอคอนกล่องดำ + จุดสีเรืองแสง */}
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-[#060A13] border border-slate-200 dark:border-[#1E293B] shadow-inner flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                  <div className="w-3.5 h-3.5 rounded-full relative z-10" style={{ backgroundColor: c.color, boxShadow: `0 0 10px ${c.color}` }}></div>
                  <div className="absolute inset-0 opacity-15 blur-xl group-hover:opacity-30 transition-opacity duration-200" style={{ backgroundColor: c.color }}></div>
                </div>

                <div className="flex space-x-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleOpenEditCategory(c)}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-400 dark:text-[#94A3B8] hover:text-white dark:hover:text-white hover:bg-blue-500 dark:hover:bg-blue-500 hover:border-blue-500 shadow-sm transition-colors duration-200"
                    title="แก้ไขหมวดหมู่"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-400 dark:text-[#94A3B8] hover:text-white dark:hover:text-white hover:bg-rose-500 dark:hover:bg-rose-500 hover:border-rose-500 shadow-sm transition-colors duration-200"
                    title="ลบหมวดหมู่"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="relative z-10 mt-auto">
                <div className="text-slate-800 dark:text-white font-black text-xl tracking-tight mb-1">{c.name}</div>
                <div className="text-slate-500 dark:text-[#64748B] text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Box size={10} />
                  {usageCount} Used Records
                </div>
              </div>
            </div>
          );
        })}
        {currentCategories.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center glass-panel rounded-[32px]">
            <Layers size={48} className="text-slate-300 dark:text-[#334155] mb-4" />
            <span className="text-sm font-black uppercase tracking-widest block text-slate-500 dark:text-[#94A3B8]">No Categories Found</span>
            <span className="text-xs text-slate-400 mt-2 block">คลิกที่ "เพิ่มหมวดหมู่ใหม่" ด้านบนเพื่อเริ่มสร้าง</span>
          </div>
        )}
      </div>
    </div>
  );
}