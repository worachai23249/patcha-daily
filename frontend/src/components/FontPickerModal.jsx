import { useState } from 'react';
import { X, Search, Check, Sparkles, Type, Palette } from 'lucide-react';
import { AVAILABLE_FONTS } from '../services/fontService';

export default function FontPickerModal({ isOpen, onClose, currentFontId, onSelectFont }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: `ทั้งหมด (${AVAILABLE_FONTS.length})` },
    { id: 'handwriting', label: `✍️ ลายมือ/น่ารัก (${AVAILABLE_FONTS.filter(f => f.category === 'handwriting').length})` },
    { id: 'modern', label: `✨ โมเดิร์น (${AVAILABLE_FONTS.filter(f => f.category === 'modern').length})` },
    { id: 'classic', label: `👑 เรียบหรู (${AVAILABLE_FONTS.filter(f => f.category === 'classic').length})` },
    { id: 'display', label: `⭐ โดดเด่น (${AVAILABLE_FONTS.filter(f => f.category === 'display').length})` },
    { id: 'formal', label: `📄 ทางการ (${AVAILABLE_FONTS.filter(f => f.category === 'formal').length})` },
  ];

  const filteredFonts = AVAILABLE_FONTS.filter(font => {
    const matchesSearch = font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          font.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || font.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-[#030610]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative glass-panel w-full max-w-2xl rounded-[28px] md:rounded-[36px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-pink-200/80 dark:border-white/10 animate-fade-in-up">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-pink-100 dark:border-white/10 bg-white/70 dark:bg-[#0B1121]/70 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white shadow-md shadow-pink-400/20">
              <Palette size={20} className="drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                เลือกแบบฟอนต์ที่ชอบ 🎨
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40">
                  {AVAILABLE_FONTS.length} แบบ
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                มีฟอนต์สวยน่ารักให้เลือก {AVAILABLE_FONTS.length} แบบ สลับเปลี่ยนบรรยากาศได้ตามใจสไตล์ Canva ✨
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 md:p-5 border-b border-pink-100/60 dark:border-white/5 bg-pink-50/40 dark:bg-white/[0.01] space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="ค้นหาชื่อฟอนต์ (เช่น ไอติม, Mali, Kanit)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-[#060A13]/60 border border-pink-200/80 dark:border-white/10 text-xs md:text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-pink-400 dark:focus:border-pink-500 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-sm shadow-pink-400/20 scale-[1.02]'
                    : 'bg-white/70 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-pink-100/60 dark:hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar">
          {filteredFonts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Type size={32} className="mx-auto mb-2 opacity-40 text-pink-400" />
              <p className="text-sm font-bold">ไม่พบฟอนต์ที่ค้นหา</p>
              <p className="text-xs mt-1">ลองพิมพ์ชื่ออื่น เช่น Mali หรือ ไอติม</p>
            </div>
          ) : (
            filteredFonts.map((font) => {
              const isSelected = font.id === currentFontId;
              return (
                <div
                  key={font.id}
                  onClick={() => onSelectFont(font.id)}
                  className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-500/10 via-rose-400/10 to-pink-500/15 border-pink-400 dark:border-pink-500/60 shadow-md shadow-pink-400/10 scale-[1.01]'
                      : 'bg-white/60 dark:bg-white/[0.02] border-pink-100 dark:border-white/5 hover:border-pink-300 dark:hover:border-pink-500/30 hover:bg-white/90 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 
                        className="font-preview-scope font-black text-base md:text-lg text-gray-800 dark:text-white"
                        style={{ '--preview-font-family': font.family, fontFamily: font.family }}
                      >
                        {font.name}
                      </h3>
                      {font.tag && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40">
                          {font.tag}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && (
                        <div className="flex items-center gap-1 text-xs font-black text-pink-500 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/80 px-2.5 py-1 rounded-full border border-pink-300/60">
                          <Check size={14} className="stroke-[3]" />
                          <span>กำลังใช้งาน</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2.5">
                    {font.description}
                  </p>

                  {/* Live Font Preview Box */}
                  <div 
                    className="font-preview-scope p-3.5 rounded-xl bg-pink-50/70 dark:bg-[#060A13]/60 border border-pink-200/60 dark:border-white/10 space-y-1 shadow-sm"
                    style={{ '--preview-font-family': font.family, fontFamily: font.family }}
                  >
                    <div 
                      className="font-preview-scope text-lg md:text-xl font-bold text-gray-900 dark:text-pink-100 tracking-wide"
                      style={{ '--preview-font-family': font.family, fontFamily: font.family }}
                    >
                      {font.sampleTh}
                    </div>
                    <div 
                      className="font-preview-scope text-xs md:text-sm text-gray-600 dark:text-gray-300"
                      style={{ '--preview-font-family': font.family, fontFamily: font.family }}
                    >
                      {font.sampleEn}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-pink-100 dark:border-white/10 bg-white/70 dark:bg-[#0B1121]/70 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-bold">
            <Sparkles size={14} className="text-pink-400 animate-pulse" />
            <span>ฟอนต์ที่เลือกจะถูกบันทึกไว้ใช้งานตลอดไป</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-md shadow-pink-400/20 hover:scale-[1.02] transition-transform cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}
