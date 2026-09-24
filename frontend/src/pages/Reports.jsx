import { useState, useRef } from 'react';
import { addTransaction } from '../supabase';
import { sendMonthlySummaryNotification, isCashTransaction, isInKindTransaction, cleanTransactionNote } from '../services/notificationService';

import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Activity, ArrowLeft, Edit, Trash2, Image as ImageIcon, PieChart as PieIcon, LineChart, Download, Upload, Calendar, CalendarDays, CheckCircle2, ChevronDown, ListFilter, ArrowRight, MessageSquare, Gift } from 'lucide-react';
import Papa from 'papaparse';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const FULL_MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export default function Reports({ transactions, fmt, formatThaiDate, handleViewImage, handleOpenEditTransaction, handleDeleteTransaction, isLoggedIn = true }) {
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYearNum);
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState('all'); // 'all' or 1, 2, 3, 4, 5
  const [detailFilterType, setDetailFilterType] = useState('ALL'); // 'ALL' | 'INCOME' | 'EXPENSE' | 'IN_KIND'
  const fileInputRef = useRef(null);

  const reportTransactions = transactions.filter(t => t.transaction_date.startsWith(selectedYear.toString()));
  const reportYearlyIncome = reportTransactions.filter(t => t.type === 'INCOME' && isCashTransaction(t)).reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const reportYearlyExpense = reportTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const reportYearlyBalance = reportYearlyIncome - reportYearlyExpense;
  const reportSavingsRate = reportYearlyIncome > 0 ? ((reportYearlyBalance / reportYearlyIncome) * 100).toFixed(1) : 0;

  const reportMonthlyStats = MONTHS_TH.map((monthName, index) => {
    const monthIndexStr = (index + 1).toString().padStart(2, '0');
    const monthTx = reportTransactions.filter(t => t.transaction_date.startsWith(`${selectedYear}-${monthIndexStr}`));
    let inc = 0, exp = 0;
    monthTx.forEach(t => { 
      if (t.type === 'INCOME') {
        if (isCashTransaction(t)) inc += parseFloat(t.amount);
      } else {
        exp += parseFloat(t.amount);
      }
    });
    const net = inc - exp;
    return { 
      name: monthName, 
      income: inc, 
      expense: exp, 
      balance: net,
      displayBalance: Math.abs(net),
      isNegative: net < 0
    };
  });

const DAY_NAMES_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const FULL_DAY_NAMES_TH = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

  // ========== Month & Weekly Calculations (ตามปฏิทินจริง) ==========
  let detailMonthName = "";
  let totalDaysInMonth = 31;
  let weeksData = [];
  let allMonthTransactions = [];
  let activeTransactions = [];
  let activeIncome = 0;
  let activeExpense = 0;
  let activeBalance = 0;
  let activeLabel = "";
  let activeDateRangeSubtitle = "";

  if (selectedMonthDetail) {
    const monthIndexStr = selectedMonthDetail.toString().padStart(2, '0');
    detailMonthName = FULL_MONTHS_TH[selectedMonthDetail - 1];
    totalDaysInMonth = new Date(selectedYear, selectedMonthDetail, 0).getDate();

    // All transactions in the selected month
    allMonthTransactions = reportTransactions
      .filter(t => t.transaction_date.startsWith(`${selectedYear}-${monthIndexStr}`))
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

    // คำนวณสัปดาห์ตามปฏิทินจริงโดยตัดตามขอบเขตของเดือน (เริ่มวันที่ 1 จนถึงวันอาทิตย์แรก และจบที่วันสิ้นเดือน)
    const daysInMonth = totalDaysInMonth;
    let currentStart = 1;
    let weekIndex = 1;
    const computedWeeks = [];

    while (currentStart <= daysInMonth) {
      const startDateObj = new Date(selectedYear, selectedMonthDetail - 1, currentStart);
      const startDayOfWeek = startDateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

      // วันสิ้นสุดสัปดาห์คือ วันอาทิตย์ถัดไป หรือวันสิ้นเดือน
      // ถ้าเริ่มวันอาทิตย์ (0) -> ตัดแค่วันอาทิตย์นั้นเลย (0 วัน)
      // ถ้าเริ่มวันจันทร์ (1) -> วันอาทิตย์อีก 6 วัน
      // ถ้าเริ่มวันเสาร์ (6) -> วันอาทิตย์อีก 1 วัน
      const daysUntilSunday = (7 - startDayOfWeek) % 7;
      const currentEnd = Math.min(daysInMonth, currentStart + daysUntilSunday);
      const endDateObj = new Date(selectedYear, selectedMonthDetail - 1, currentEnd);
      const endDayOfWeek = endDateObj.getDay();

      const startDayName = DAY_NAMES_TH[startDayOfWeek];
      const endDayName = DAY_NAMES_TH[endDayOfWeek];

      const startDayStr = currentStart.toString().padStart(2, '0');
      const endDayStr = currentEnd.toString().padStart(2, '0');
      const startDateStr = `${selectedYear}-${monthIndexStr}-${startDayStr}`;
      const endDateStr = `${selectedYear}-${monthIndexStr}-${endDayStr}`;

      // กรองรายการธุรกรรมภายในช่วงสัปดาห์นี้
      const txs = allMonthTransactions.filter(t => {
        return t.transaction_date >= startDateStr && t.transaction_date <= endDateStr;
      });

      let inc = 0;
      let exp = 0;
      txs.forEach(t => {
        if (t.type === 'INCOME') {
          if (isCashTransaction(t)) inc += parseFloat(t.amount);
        } else {
          exp += parseFloat(t.amount);
        }
      });
      const bal = inc - exp;

      const shortRangeText = currentStart === currentEnd
        ? `${currentStart} ${MONTHS_TH[selectedMonthDetail - 1]} (${startDayName})`
        : `${currentStart} - ${currentEnd} ${MONTHS_TH[selectedMonthDetail - 1]} (${startDayName} - ${endDayName})`;

      const fullRangeText = currentStart === currentEnd
        ? `${FULL_DAY_NAMES_TH[startDayOfWeek]}ที่ ${currentStart} ${FULL_MONTHS_TH[selectedMonthDetail - 1]} ${selectedYear}`
        : `วันที่ ${currentStart} (${startDayName}) - ${currentEnd} (${endDayName}) ${FULL_MONTHS_TH[selectedMonthDetail - 1]} ${selectedYear}`;

      computedWeeks.push({
        weekNum: weekIndex,
        title: `สัปดาห์ที่ ${weekIndex}`,
        shortRange: currentStart === currentEnd ? `${currentStart} ${MONTHS_TH[selectedMonthDetail - 1]}` : `${currentStart} - ${currentEnd} ${MONTHS_TH[selectedMonthDetail - 1]}`,
        shortRangeWithDays: shortRangeText,
        fullRange: fullRangeText,
        startDay: currentStart,
        endDay: currentEnd,
        startDayName,
        endDayName,
        startDate: startDateStr,
        endDate: endDateStr,
        transactions: txs,
        income: inc,
        expense: exp,
        balance: bal,
        count: txs.length
      });

      currentStart = currentEnd + 1;
      weekIndex++;
    }

    weeksData = computedWeeks;

    if (selectedWeek === 'all') {
      activeTransactions = allMonthTransactions;
      allMonthTransactions.forEach(t => {
        if (t.type === 'INCOME') {
          if (isCashTransaction(t)) activeIncome += parseFloat(t.amount);
        } else {
          activeExpense += parseFloat(t.amount);
        }
      });
      activeBalance = activeIncome - activeExpense;
      activeLabel = `ทั้งเดือน${detailMonthName}`;
      activeDateRangeSubtitle = `1 - ${totalDaysInMonth} ${detailMonthName} ${selectedYear}`;
    } else {
      const currentWeekObj = weeksData.find(w => w.weekNum === Number(selectedWeek)) || weeksData[0];
      activeTransactions = currentWeekObj ? currentWeekObj.transactions : [];
      activeIncome = currentWeekObj ? currentWeekObj.income : 0;
      activeExpense = currentWeekObj ? currentWeekObj.expense : 0;
      activeBalance = currentWeekObj ? currentWeekObj.balance : 0;
      activeLabel = currentWeekObj ? currentWeekObj.title : `สัปดาห์ที่ ${selectedWeek}`;
      activeDateRangeSubtitle = currentWeekObj ? currentWeekObj.fullRange : "";
    }
  }

  // ========== Export CSV function ==========
  const handleExportCSV = (txList = reportTransactions, filename = `worship_report_${selectedYear}`) => {
    if (!txList || txList.length === 0) {
      alert("ไม่มีข้อมูลที่จะส่งออก");
      return;
    }

    const exportData = txList.map(t => ({
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
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ========== Import CSV function ==========
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

        const formattedData = data.map(row => {
          let dateStr = row['วันที่'] || new Date().toISOString().split('T')[0];
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
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
            image_url: null
          };
        });

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

        e.target.value = null;
      },
      error: (error) => {
        alert("อ่านไฟล์ไม่สำเร็จ: " + error.message);
      }
    });
  };

  // --- Render Month Details View ---
  if (selectedMonthDetail) {
    const monthIndexStr = selectedMonthDetail.toString().padStart(2, '0');
    const exportFilePrefix = selectedWeek === 'all' 
      ? `worship_data_${selectedYear}_${monthIndexStr}_all_month` 
      : `worship_data_${selectedYear}_${monthIndexStr}_week_${selectedWeek}`;

    return (
      <div className="max-w-7xl mx-auto pb-20 mt-2 xl:mt-0 font-sans">
        {/* Header */}
        <div className="mb-5 relative animate-fade-in-up">
          <div className="flex flex-col gap-3.5 relative z-10">
            
            {/* Top Row: Back button + Title */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setSelectedMonthDetail(null); setSelectedWeek('all'); }} 
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 dark:bg-[#0B1121]/70 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-slate-600 dark:text-[#94A3B8] hover:text-blue-500 dark:hover:text-blue-400 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm shrink-0"
                title="กลับไปหน้ารวม 12 เดือน"
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 tracking-tight drop-shadow-sm truncate">
                  รายละเอียดประจำเดือน
                </h1>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                  <span className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-black tracking-wide flex items-center gap-1">
                    <Calendar size={12} className="text-blue-500 shrink-0" />
                    {detailMonthName} {selectedYear}
                  </span>
                  <span className="text-slate-400 dark:text-white/30 text-xs">•</span>
                  <span className="text-slate-500 dark:text-[#94A3B8] text-[11px] sm:text-xs font-bold truncate">
                    {activeDateRangeSubtitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar on Mobile (Month Switcher + Action Buttons) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
              
              {/* Previous / Next Month Navigation */}
              <div className="glass-panel p-1 rounded-2xl flex items-center justify-between sm:justify-start shadow-sm shrink-0">
                <button
                  disabled={selectedMonthDetail <= 1}
                  onClick={() => { setSelectedMonthDetail(m => m - 1); setSelectedWeek('all'); }}
                  className={`p-2 rounded-xl transition-all ${selectedMonthDetail <= 1 ? 'opacity-30 cursor-not-allowed text-slate-400' : 'text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-3 text-xs sm:text-sm font-black text-slate-700 dark:text-white whitespace-nowrap text-center flex-1 sm:flex-none">
                  {MONTHS_TH[selectedMonthDetail - 1]} {selectedYear}
                </span>
                <button
                  disabled={selectedMonthDetail >= 12}
                  onClick={() => { setSelectedMonthDetail(m => m + 1); setSelectedWeek('all'); }}
                  className={`p-2 rounded-xl transition-all ${selectedMonthDetail >= 12 ? 'opacity-30 cursor-not-allowed text-slate-400' : 'text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                  title="เดือนถัดไป"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Action Buttons: 2 columns on mobile */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                {/* Export Button */}
                <button
                  onClick={() => handleExportCSV(activeTransactions, exportFilePrefix)}
                  className="flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white px-3 py-2.5 rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm"
                  title="ดาวน์โหลดไฟล์ CSV"
                >
                  <Download size={14} className="text-blue-400 shrink-0" />
                  <span className="whitespace-nowrap">ส่งออก CSV</span>
                </button>

                {/* Send Monthly Summary to LINE Button */}
                <button
                  onClick={async () => {
                    try {
                      const res = await sendMonthlySummaryNotification(selectedYear, selectedMonthDetail, transactions, fmt);
                      if (res.line) {
                        alert(`ส่งสรุปรายงานประจำเดือน ${FULL_MONTHS_TH[selectedMonthDetail - 1]} ${selectedYear} เข้า LINE เรียบร้อยแล้ว!`);
                      } else {
                        alert('กรุณาตั้งค่า LINE Webhook ในเมนู "แจ้งเตือน LINE" ก่อนส่งรายงาน');
                      }
                    } catch (e) {
                      alert('เกิดข้อผิดพลาด: ' + e.message);
                    }
                  }}
                  className="flex items-center justify-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-3 py-2.5 rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-md shadow-emerald-500/20"
                  title="ส่งสรุปรายงานประจำเดือนเข้า LINE"
                >
                  <MessageSquare size={14} className="text-white shrink-0" />
                  <span className="whitespace-nowrap">ส่งสรุปเข้า LINE</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= Weekly & All Filter Tabs Bar ================= */}
        <div className="mb-5 animate-fade-in-up">
          <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-sm">
            
            {/* Tab: All Month */}
            <button
              onClick={() => setSelectedWeek('all')}
              className={`flex-1 min-w-[125px] sm:min-w-0 py-2 px-3 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-0.5 text-center shrink-0 sm:shrink
                ${selectedWeek === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/20 scale-[1.01]'
                  : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-1 font-black text-xs sm:text-sm whitespace-nowrap">
                <CalendarDays size={13} className={selectedWeek === 'all' ? 'text-white' : 'text-blue-500'} />
                <span>ทั้งเดือน</span>
              </div>
              <span className={`text-[10px] font-bold ${selectedWeek === 'all' ? 'text-blue-100' : 'text-slate-400 dark:text-[#64748B]'}`}>
                {allMonthTransactions.length} รายการ ({MONTHS_TH[selectedMonthDetail - 1]})
              </span>
            </button>

            {/* Tabs: Week 1 to 5 */}
            {weeksData.map((w) => {
              const isActive = selectedWeek === w.weekNum;
              const hasTx = w.count > 0;
              return (
                <button
                  key={w.weekNum}
                  onClick={() => setSelectedWeek(w.weekNum)}
                  className={`flex-1 min-w-[115px] sm:min-w-0 py-2 px-2.5 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-0.5 text-center shrink-0 sm:shrink
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/20 scale-[1.01]'
                      : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-1 font-black text-xs sm:text-sm whitespace-nowrap">
                    <span>สัปดาห์ที่ {w.weekNum}</span>
                    {hasTx && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : (w.balance >= 0 ? 'bg-emerald-500' : 'bg-rose-500')}`}></span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-[#64748B]'}`}>
                      {w.shortRangeWithDays || w.shortRange}
                    </span>
                    {hasTx && (
                      <span className={`text-[9px] px-1 py-0.2 rounded-full font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                        {w.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= Detailed KPI Summary Cards ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 animate-fade-in-up">
          {/* Card 1: Total Income */}
          <div className="glass-panel p-3.5 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between mb-1.5 relative z-10">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.7)]"></div>
                <span className="text-slate-500 dark:text-[#94A3B8] text-[10px] sm:text-xs font-black uppercase tracking-wider truncate">รายรับ</span>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <TrendingUp size={14} className="sm:w-4 sm:h-4" />
              </div>
            </div>
            <span className="text-lg sm:text-2xl lg:text-3xl font-black text-emerald-500 tracking-tight drop-shadow-sm relative z-10 truncate">
              +{fmt(activeIncome)}
            </span>
          </div>

          {/* Card 2: Total Expense */}
          <div className="glass-panel p-3.5 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between mb-1.5 relative z-10">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.7)]"></div>
                <span className="text-slate-500 dark:text-[#94A3B8] text-[10px] sm:text-xs font-black uppercase tracking-wider truncate">รายจ่าย</span>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <TrendingDown size={14} className="sm:w-4 sm:h-4" />
              </div>
            </div>
            <span className="text-lg sm:text-2xl lg:text-3xl font-black text-rose-500 tracking-tight drop-shadow-sm relative z-10 truncate">
              -{fmt(activeExpense)}
            </span>
          </div>

          {/* Card 3: Net Balance */}
          <div className="glass-panel p-3.5 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between mb-1.5 relative z-10">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${activeBalance >= 0 ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.7)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'}`}></div>
                <span className="text-slate-500 dark:text-[#94A3B8] text-[10px] sm:text-xs font-black uppercase tracking-wider truncate">คงเหลือสุทธิ</span>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 shrink-0">
                <Wallet size={14} className="sm:w-4 sm:h-4" />
              </div>
            </div>
            <span className={`text-lg sm:text-2xl lg:text-3xl font-black tracking-tight drop-shadow-sm relative z-10 truncate ${activeBalance >= 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'text-rose-500'}`}>
              ฿{fmt(activeBalance)}
            </span>
          </div>

          {/* Card 4: Transaction Count */}
          <div className="glass-panel p-3.5 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between mb-1.5 relative z-10">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.7)]"></div>
                <span className="text-slate-500 dark:text-[#94A3B8] text-[10px] sm:text-xs font-black uppercase tracking-wider truncate">จำนวนรายการ</span>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                <Activity size={14} className="sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 relative z-10">
              <span className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {activeTransactions.length}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase">รายการ</span>
            </div>
          </div>
        </div>

        {/* ================= Weekly Breakdown Cards Grid (Shown when 'all' is selected) ================= */}
        {selectedWeek === 'all' && (
          <div className="mb-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-gradient-to-b from-blue-400 to-purple-600 rounded-full shrink-0"></div>
                <h3 className="text-xs sm:text-base font-black text-slate-800 dark:text-white">
                  เปรียบเทียบรายสัปดาห์ ({weeksData.length} สัปดาห์)
                </h3>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold ml-3.5 sm:ml-0">คลิกสัปดาห์เพื่อกรองดูเฉพาะช่วง</span>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${weeksData.length === 4 ? 'lg:grid-cols-4' : weeksData.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-3 xl:grid-cols-6'} gap-2.5 sm:gap-3`}>
              {weeksData.map((w) => {
                const hasTx = w.count > 0;
                return (
                  <div
                    key={w.weekNum}
                    onClick={() => setSelectedWeek(w.weekNum)}
                    className="glass-panel p-3.5 sm:p-4 rounded-2xl cursor-pointer hover:border-blue-400/60 dark:hover:border-blue-500/50 hover:scale-[1.01] transition-all duration-200 group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-xs sm:text-sm text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors">
                          {w.title}
                        </span>
                        <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-lg font-black border ${w.balance >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-500/20'}`}>
                          {w.balance >= 0 ? 'สุทธิบวก' : 'สุทธิลบ'}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold mb-2.5">{w.shortRangeWithDays || w.shortRange}</p>

                      <div className="space-y-1 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#060A13]/50 border border-slate-100 dark:border-white/5 text-xs">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 dark:text-[#94A3B8] font-bold">รับ</span>
                          <span className="font-black text-emerald-500">+{fmt(w.income)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 dark:text-[#94A3B8] font-bold">จ่าย</span>
                          <span className="font-black text-rose-500">-{fmt(w.expense)}</span>
                        </div>
                        <div className="w-full h-px bg-slate-200/50 dark:bg-white/5 my-0.5"></div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 dark:text-[#94A3B8] font-bold">คงเหลือ</span>
                          <span className={`font-black ${w.balance >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-500'}`}>
                            ฿{fmt(w.balance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] sm:text-[11px] font-black text-blue-500 group-hover:text-blue-600">
                      <span>{w.count} รายการ</span>
                      <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        ดูรายการ <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= Transaction List Grid ================= */}
        {(() => {
          const displayedTransactions = activeTransactions.filter(t => {
            if (detailFilterType === 'INCOME') return t.type === 'INCOME' && isCashTransaction(t);
            if (detailFilterType === 'EXPENSE') return t.type === 'EXPENSE';
            if (detailFilterType === 'IN_KIND') return isInKindTransaction(t);
            return true;
          });

          const incomeCount = activeTransactions.filter(t => t.type === 'INCOME' && isCashTransaction(t)).length;
          const expenseCount = activeTransactions.filter(t => t.type === 'EXPENSE').length;
          const inKindCount = activeTransactions.filter(t => isInKindTransaction(t)).length;

          return (
            <div className="glass-panel rounded-[28px] overflow-hidden animate-fade-in-up">
              <div className="px-4 sm:px-5 py-4 border-b border-slate-200/50 dark:border-white/10 flex flex-col gap-3 bg-slate-50/50 dark:bg-[#0B1121]/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-5 bg-gradient-to-b from-blue-400 to-purple-600 rounded-full shrink-0"></div>
                    <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
                      รายการธุรกรรม: {activeLabel}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-bold">
                      {activeDateRangeSubtitle}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black border border-blue-200/50 dark:border-blue-500/20">
                      {displayedTransactions.length} รายการ
                    </span>
                  </div>
                </div>

                {/* Filter Buttons: ทั้งหมด / รายรับ / รายจ่าย / ถวายพิเศษ */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                  {[
                    { key: 'ALL', label: 'ทั้งหมด', count: activeTransactions.length, color: 'blue' },
                    { key: 'INCOME', label: 'รายรับ', count: incomeCount, color: 'emerald' },
                    { key: 'EXPENSE', label: 'รายจ่าย', count: expenseCount, color: 'rose' },
                    { key: 'IN_KIND', label: '🎁 ถวายพิเศษ', count: inKindCount, color: 'purple' },
                  ].map(f => {
                    const isSelected = detailFilterType === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => setDetailFilterType(f.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          isSelected
                            ? f.color === 'emerald'
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                              : f.color === 'rose'
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                              : f.color === 'purple'
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                              : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/5'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                          {f.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {displayedTransactions.length === 0 ? (
                <div className="p-12 flex flex-col items-center text-slate-400 space-y-3">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 dark:border-[#334155] flex items-center justify-center text-slate-400 dark:text-[#64748B]">
                    <Activity size={22} />
                  </div>
                  <p className="text-sm font-black text-slate-600 dark:text-slate-300">
                    ไม่มีรายการ{detailFilterType === 'INCOME' ? 'รายรับ' : detailFilterType === 'EXPENSE' ? 'รายจ่าย' : detailFilterType === 'IN_KIND' ? 'ถวายพิเศษ' : ''}ใน{activeLabel}
                  </p>
                  <p className="text-xs text-slate-400">
                    ช่วงวันที่ {activeDateRangeSubtitle}
                  </p>
                </div>
              ) : (
                <div className="px-3 pb-4 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayedTransactions.map((t) => {
                    const isIncome = t.type === 'INCOME';
                    const inKind = isInKindTransaction(t);
                    const cleanNote = cleanTransactionNote(t.note);

                    return (
                      <div
                        key={t.id}
                        className={`glass-panel relative rounded-[22px] overflow-hidden
                        border ${inKind ? 'border-purple-400/50 dark:border-purple-500/40 bg-purple-950/10' : (isIncome ? 'border-emerald-400/40 dark:border-emerald-500/30' : 'border-rose-400/40 dark:border-rose-500/30')}`}
                      >
                        <div className={`absolute top-0 left-0 right-0 h-[2px] ${inKind ? 'bg-gradient-to-r from-transparent via-purple-400 to-transparent' : (isIncome ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-400 to-transparent')}`} />
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
                              <span className={`text-sm font-black tracking-[0.25em] uppercase ${isIncome ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                {isIncome ? 'รายรับ' : 'รายจ่าย'}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-slate-500 dark:text-white font-bold tracking-wide">
                            {formatThaiDate(t.transaction_date)}
                          </span>
                        </div>

                        <div className={`mx-5 h-px ${inKind ? 'bg-gradient-to-r from-transparent via-purple-500/30 to-transparent' : (isIncome ? 'bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-500/30 to-transparent')}`} />

                        {/* BODY */}
                        <div className="relative flex items-center justify-between px-5 py-4">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-base font-black text-slate-800 dark:text-white mb-1.5 truncate tracking-tight">
                              {t.description}
                            </p>
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
                            {t.image_url ? <img src={t.image_url} alt="Evidence" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-400 dark:text-white/30" />}
                          </button>
                        </div>

                        <div className={`mx-5 h-px ${inKind ? 'bg-gradient-to-r from-transparent via-purple-500/20 to-transparent' : (isIncome ? 'bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-500/20 to-transparent')}`} />

                        {/* FOOTER */}
                        <div className="flex items-center justify-between px-5 py-3.5">
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            <span className="text-slate-400 dark:text-white/25 text-[10px] font-black uppercase tracking-widest shrink-0">NOTE</span>
                            <span className="text-xs text-slate-500 dark:text-white/60 font-medium truncate">{cleanNote || (inKind ? 'ถวายสิ่งของ/ชำระให้โดยตรง' : '—')}</span>
                          </div>
                          {isLoggedIn && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={(e) => { e.stopPropagation(); handleOpenEditTransaction(t); }} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-400 dark:text-white/50 hover:text-blue-500 hover:border-blue-400/50 active:scale-95 transition-all"><Edit size={13} /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(t.id); }} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-400 dark:text-white/50 hover:text-rose-500 hover:border-rose-400/50 active:scale-95 transition-all"><Trash2 size={13} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  }

  // --- Main Reports View ---
  return (
    <div className="max-w-7xl mx-auto pb-20 mt-4 xl:mt-0 font-sans animate-fade-in" id="reports-main">

      {/* Header section with Year Selector */}
      <div className="mb-10 relative">
        <div className="absolute -left-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-pulse-glow"></div>
        <div className="absolute top-0 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2 pb-2 tracking-tighter drop-shadow-sm">Financial Analytics</h1>
            <p className="text-slate-500 dark:text-[#94A3B8] text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2">
              <PieIcon size={14} className="text-blue-500" />
              รายงานสรุปการเงินคริสตจักร ประจำปี
            </p>
          </div>

          {/* Glass Year Selector */}
          <div className="flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0">
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => handleExportCSV(reportTransactions, `worship_data_yearly_${selectedYear}`)}
                className="group relative flex flex-1 md:flex-none items-center justify-center space-x-2 bg-white hover:bg-slate-50 border border-slate-200 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white px-4 py-3 md:py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-95 shadow-sm"
              >
                <Download size={14} className="text-blue-400 group-hover:translate-y-1 transition-transform duration-300" />
                <span className="whitespace-nowrap">ส่งออกรายปี</span>
              </button>
            </div>

            <div className="glass-panel p-1 rounded-2xl flex items-center justify-between md:justify-start w-full md:w-auto shadow-lg shadow-blue-500/5">
              <button
                onClick={() => setSelectedYear(y => y - 1)}
                className="p-4 md:p-3 text-slate-400 dark:text-[#64748B] hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all duration-300"
              >
                <ChevronLeft size={24} className="md:w-5 md:h-5" />
              </button>
              <div className="px-4 md:px-8 font-black text-2xl md:text-2xl text-slate-800 dark:text-white tracking-widest text-glow-emerald">
                {selectedYear}
              </div>
              <button
                onClick={() => setSelectedYear(y => y + 1)}
                className="p-4 md:p-3 text-slate-400 dark:text-[#64748B] hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all duration-300"
              >
                <ChevronRight size={24} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Yearly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">

        <div className="glass-panel glass-panel-hover p-6 rounded-[24px] flex justify-between items-start group relative overflow-hidden animate-fade-in-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <div className="text-slate-500 dark:text-[#94A3B8] text-xs font-black uppercase tracking-[0.15em] whitespace-nowrap">รายรับรวมทั้งปี</div>
            </div>
            <div className="text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700 dark:from-emerald-400 dark:to-emerald-500">฿{fmt(reportYearlyIncome)}</div>
          </div>
          <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500  shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <TrendingUp size={24} className="text-emerald-500" />
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-6 rounded-[24px] flex justify-between items-start group relative overflow-hidden animate-fade-in-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              <div className="text-slate-500 dark:text-[#94A3B8] text-xs font-black uppercase tracking-[0.15em] whitespace-nowrap">รายจ่ายรวมทั้งปี</div>
            </div>
            <div className="text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-700 dark:from-rose-400 dark:to-rose-500">฿{fmt(reportYearlyExpense)}</div>
          </div>
          <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400/20 to-rose-600/5 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
            <TrendingDown size={24} className="text-rose-500" />
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-6 rounded-[24px] flex justify-between items-start group relative overflow-hidden animate-fade-in-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1.5 h-1.5 rounded-full ${reportYearlyBalance >= 0 ? 'bg-violet-500' : 'bg-rose-500'}`}></div>
              <div className="text-slate-500 dark:text-[#94A3B8] text-xs font-black uppercase tracking-[0.15em] whitespace-nowrap">ยอดคงเหลือสุทธิปีนี้</div>
            </div>
            <div className={`text-3xl lg:text-4xl font-black tracking-tight ${reportYearlyBalance >= 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'text-rose-500'}`}>฿{fmt(reportYearlyBalance)}</div>
          </div>
          <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400/20 to-violet-600/5 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            <Wallet size={24} className="text-violet-500 dark:text-[#A78BFA]" />
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-6 rounded-[24px] flex justify-between items-start group relative overflow-hidden animate-fade-in-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              <div className="text-slate-500 dark:text-[#94A3B8] text-xs font-black uppercase tracking-[0.15em] whitespace-nowrap">อัตราการออมสุทธิ</div>
            </div>
            <div className="flex items-baseline gap-1">
              <div className={`text-3xl lg:text-4xl font-black tracking-tight ${reportSavingsRate >= 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400' : 'text-rose-500'}`}>{reportSavingsRate > 0 ? '+' : ''}{reportSavingsRate}</div>
              <span className="text-lg font-bold text-slate-500">%</span>
            </div>
          </div>
          <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400/20 to-blue-600/5 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Activity size={24} className="text-blue-500 dark:text-[#60A5FA]" />
          </div>
        </div>

      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">

        {/* Area Chart: Income vs Expense Trend */}
        <div className="glass-panel p-5 md:p-8 rounded-[24px] md:rounded-[32px] h-[340px] md:h-[450px] flex flex-col relative animate-fade-in-up">
          <div className="absolute top-0 right-0 w-[80%] h-full bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none rounded-r-[32px]"></div>
          <div className="mb-8 relative z-10">
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              <span className="w-2 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></span>
              แนวโน้มรายรับ-รายจ่าย (12 เดือน)
            </h3>
            <p className="text-xs text-slate-500 ml-5 mt-1 font-bold uppercase tracking-widest">Yearly Trend Analysis</p>
          </div>

          <div className="flex-1 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportMonthlyStats} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorIncAreaLine" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34D399" stopOpacity={0.4} /><stop offset="95%" stopColor="#34D399" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorExpAreaLine" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FB7185" stopOpacity={0.4} /><stop offset="95%" stopColor="#FB7185" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-[#1E293B]" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  dy={8}
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} textAnchor="middle" fill="#64748B" fontWeight={700} fontSize={isMobile ? 9 : 11} style={{ fontFamily: 'inherit' }}>
                          {payload.value}
                        </text>
                      </g>
                    );
                  }}
                />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontWeight: 700 }} tickFormatter={(val) => val >= 1000 ? (val / 1000) + 'k' : val} dx={-10} />
                <RechartsTooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '4 4' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
                          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-3">{label}</p>
                          <div className="space-y-2.5">
                            {payload.map((entry, index) => (
                              <div key={`item-${index}`} className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}` }}></div>
                                <span className="text-slate-200 font-bold text-xs">{entry.name}: <span className="font-black text-white ml-1">฿{fmt(entry.value)}</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="income" name="รายรับ" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncAreaLine)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981', style: { filter: 'drop-shadow(0px 0px 5px rgba(16,185,129,0.8))' } }} animationDuration={600} animationEasing="ease-out" />
                <Area type="monotone" dataKey="expense" name="รายจ่าย" stroke="#F43F5E" strokeWidth={4} fillOpacity={1} fill="url(#colorExpAreaLine)" activeDot={{ r: 6, strokeWidth: 0, fill: '#F43F5E', style: { filter: 'drop-shadow(0px 0px 5px rgba(244,63,94,0.8))' } }} animationDuration={600} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Monthly Balances */}
        <div className="glass-panel p-5 md:p-8 rounded-[24px] md:rounded-[32px] h-[340px] md:h-[450px] flex flex-col relative animate-fade-in-up">
          <div className="absolute top-0 left-0 w-[80%] h-full bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none rounded-l-[32px]"></div>
          <div className="mb-8 relative z-10">
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              <span className="w-2 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></span>
              เงินคงเหลือรายเดือนสุทธิ
            </h3>
            <p className="text-xs text-slate-500 ml-5 mt-1 font-bold uppercase tracking-widest">Monthly Net Balance</p>
          </div>
          <div className="flex-1 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportMonthlyStats} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-[#1E293B]" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  dy={8}
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} textAnchor="middle" fill="#64748B" fontWeight={700} fontSize={isMobile ? 9 : 11} style={{ fontFamily: 'inherit' }}>
                          {payload.value}
                        </text>
                      </g>
                    );
                  }}
                />
                <YAxis domain={[0, 'auto']} fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontWeight: 700 }} tickFormatter={(val) => val >= 1000 ? (val / 1000) + 'k' : val} dx={-10} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const isPos = item.balance >= 0;
                      return (
                        <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
                          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-3">{label}</p>
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isPos ? '#8B5CF6' : '#F43F5E', boxShadow: `0 0 10px ${isPos ? '#8B5CF6' : '#F43F5E'}` }}></div>
                            <span className="text-slate-200 font-bold text-xs">{isPos ? 'คงเหลือสุทธิ' : 'ขาดทุนสุทธิ'}: <span className={`font-black ml-1 ${isPos ? 'text-violet-400' : 'text-rose-400'}`}>{isPos ? '+' : '-'}฿{fmt(Math.abs(item.balance))}</span></span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="displayBalance" name="คงเหลือ" radius={[6, 6, 0, 0]} maxBarSize={24} animationDuration={600} animationEasing="ease-out">
                  {reportMonthlyStats.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.balance >= 0 ? '#8B5CF6' : '#F43F5E'} className="drop-shadow-sm hover:opacity-80 transition-opacity" />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Summary Grids (12 Cards) */}
      <div className="mb-6 mt-8 md:mt-0 relative animate-fade-in-up">
        <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          <LineChart className="text-blue-500 md:w-6 md:h-6" size={20} /> สรุปละเอียดรายเดือน
        </h3>
        <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 ml-8 md:ml-9">Monthly Breakdown Panel (คลิกเพื่อดูรายละเอียด)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-12 animate-fade-in-up">
        {reportMonthlyStats.map((month, index) => {
          const isCurrentMonth = (index + 1) === currentMonthNum && selectedYear === currentYearNum;
          const hasData = month.income > 0 || month.expense > 0;

          return (
            <div
              key={index}
              onClick={() => { setSelectedMonthDetail(index + 1); setSelectedWeek('all'); }}
              className={`glass-panel p-5 rounded-[24px] relative overflow-hidden transition-all duration-300 group
                cursor-pointer hover:border-blue-400/50 dark:hover:border-blue-500/50
                ${!hasData ? 'opacity-70 grayscale-[50%] hover:opacity-100 hover:grayscale-0' : ''} 
                ${isCurrentMonth ? 'border-blue-400/50 dark:border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20 shadow-inner' : ''}`}
            >
              {isCurrentMonth && (
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full blur-xl pointer-events-none"></div>
              )}

              <div className="flex justify-between items-center mb-5 relative z-10">
                <h4 className={`font-black text-lg tracking-wide transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-400 ${isCurrentMonth ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                  {month.name}
                </h4>
                <div className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${month.balance >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-500/20'}`}>
                  {month.balance >= 0 ? 'สุทธิบวก' : 'สุทธิลบ'}
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060A13]/50 border border-slate-100 dark:border-white/5 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">รายรับ</span>
                    <span className="text-emerald-500 dark:text-[#4ADE80] font-black text-sm tracking-wide">+{fmt(month.income)}</span>
                  </div>
                  <div className="w-full h-px bg-slate-200/50 dark:bg-white/5"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">รายจ่าย</span>
                    <span className="text-rose-500 dark:text-[#FB7185] font-black text-sm tracking-wide">-{fmt(month.expense)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end px-1">
                  <span className="text-slate-400 dark:text-[#64748B] text-[10px] font-bold uppercase tracking-widest">ยอดสุทธิ</span>
                  <span className={`font-black tracking-tight ${month.balance >= 0 ? 'text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors' : 'text-rose-500'}`}>
                    ฿{fmt(month.balance)}
                  </span>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}