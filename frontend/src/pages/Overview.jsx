import { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Receipt, Image as ImageIcon, Activity, X, Gift } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { isCashTransaction, isInKindTransaction, cleanTransactionNote } from '../services/notificationService';

export default function Overview({ transactions, categories = [], formatThaiDate, fmt, handleViewImage, setActiveMenu, isLoggedIn }) {
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState(null);
  const [selectedIncomeCategory, setSelectedIncomeCategory] = useState(null);
  const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const [y, m] = t.transaction_date.split('-');
    return parseInt(m) === currentMonthNum && parseInt(y) === currentYearNum;
  });

  const totalIncome = currentMonthTransactions.filter(t => t.type === 'INCOME' && isCashTransaction(t)).reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpense = currentMonthTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalInKind = currentMonthTransactions.filter(t => isInKindTransaction(t)).reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const inKindCount = currentMonthTransactions.filter(t => isInKindTransaction(t)).length;
  const balance = totalIncome - totalExpense;
  const transactionCount = currentMonthTransactions.length;

  const monthlyData = (() => {
    const md = {};
    MONTHS_TH.forEach(m => md[m] = { name: m, income: 0, expense: 0 });
    transactions.filter(t => t.transaction_date.startsWith(currentYearNum.toString())).forEach(t => {
      const [, month] = t.transaction_date.split('-');
      const monthName = MONTHS_TH[parseInt(month) - 1];
      if (t.type === 'INCOME' && isCashTransaction(t)) md[monthName].income += parseFloat(t.amount);
      if (t.type === 'EXPENSE') md[monthName].expense += parseFloat(t.amount);
    });
    return Object.values(md).slice(0, 12);
  })();

  const categoryData = (() => {
    const ed = {};
    currentMonthTransactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        const desc = t.description || 'อื่นๆ';
        ed[desc] = (ed[desc] || 0) + parseFloat(t.amount);
      }
    });
    return Object.keys(ed).map(key => {
      const cat = categories.find(c => c.name === key);
      return { name: key, value: ed[key], color: cat ? cat.color : '#94A3B8' };
    }).sort((a, b) => b.value - a.value);
  })();

  const incomeCategoryData = (() => {
    const id = {};
    currentMonthTransactions.forEach(t => {
      if (t.type === 'INCOME' && isCashTransaction(t)) {
        const desc = t.description || 'อื่นๆ';
        id[desc] = (id[desc] || 0) + parseFloat(t.amount);
      }
    });
    return Object.keys(id).map(key => {
      const cat = categories.find(c => c.name === key);
      return { name: key, value: id[key], color: cat ? cat.color : '#34D399' };
    }).sort((a, b) => b.value - a.value);
  })();

  return (
    <div className="max-w-7xl mx-auto pb-20 mt-4 xl:mt-0">
      {/* Header */}
      <div className="mb-8 relative animate-fade-in-up">
        <div className="absolute -left-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-pulse-glow"></div>
        <div className="absolute top-0 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2 pb-1 tracking-tighter drop-shadow-sm">System Overview</h1>
            <p className="text-slate-500 dark:text-[#94A3B8] text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2">
              <Activity size={14} className="text-blue-500" />
              สรุปการเงินเดือนปัจจุบัน <span className="text-blue-600 dark:text-blue-400">({MONTHS_TH[currentMonthNum - 1]} {currentYearNum + 543})</span>
            </p>
          </div>
          <div className="glass-panel px-4 py-2 rounded-full inline-flex items-center gap-2 self-start sm:self-auto">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-black tracking-widest uppercase text-slate-600 dark:text-slate-300">Live Status</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel glass-panel-hover p-4 md:p-6 rounded-[20px] md:rounded-[24px] flex justify-between items-start group relative overflow-hidden animate-fade-in-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/15 transition-colors duration-500 ease-out"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <div className="text-slate-500 dark:text-[#94A3B8] text-[10px] md:text-xs font-black uppercase tracking-widest md:tracking-[0.2em]">รายรับ (Income)</div>
            </div>
            <div className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700 dark:from-emerald-400 dark:to-emerald-500">฿{fmt(totalIncome)}</div>
          </div>
          <div className="relative z-10 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <TrendingUp size={18} className="md:w-6 md:h-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-4 md:p-6 rounded-[20px] md:rounded-[24px] flex justify-between items-start group relative overflow-hidden animate-fade-in-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/15 transition-colors duration-500 ease-out"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              <div className="text-slate-500 dark:text-[#94A3B8] text-[10px] md:text-xs font-black uppercase tracking-widest md:tracking-[0.2em]">รายจ่าย (Expense)</div>
            </div>
            <div className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-700 dark:from-rose-400 dark:to-rose-500">฿{fmt(totalExpense)}</div>
          </div>
          <div className="relative z-10 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-rose-400/20 to-rose-600/5 border border-rose-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <TrendingDown size={18} className="md:w-6 md:h-6 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-4 md:p-6 rounded-[20px] md:rounded-[24px] flex justify-between items-start group relative overflow-hidden animate-fade-in-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/15 transition-colors duration-500 ease-out"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${balance >= 0 ? 'bg-violet-500' : 'bg-rose-500'}`}></div>
              <div className="text-slate-500 dark:text-[#94A3B8] text-[10px] md:text-xs font-black uppercase tracking-widest md:tracking-[0.2em]">คงเหลือ (Balance)</div>
            </div>
            <div className={`text-2xl md:text-3xl lg:text-4xl font-black tracking-tight ${balance >= 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'text-rose-500'}`}>฿{fmt(balance)}</div>
          </div>
          <div className="relative z-10 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-violet-400/20 to-violet-600/5 border border-violet-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Wallet size={18} className="md:w-6 md:h-6 text-violet-500 dark:text-[#A78BFA] drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-4 md:p-6 rounded-[20px] md:rounded-[24px] flex justify-between items-start group relative overflow-hidden animate-fade-in-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/15 transition-colors duration-500 ease-out"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <div className="text-slate-500 dark:text-[#94A3B8] text-[10px] md:text-xs font-black uppercase tracking-widest md:tracking-[0.2em]">รายการทั้งหมด</div>
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">{transactionCount}</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Txns</div>
            </div>
          </div>
          <div className="relative z-10 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-400/20 to-blue-600/5 border border-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Receipt size={18} className="md:w-6 md:h-6 text-blue-500 dark:text-[#60A5FA] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="flex flex-col gap-6 md:gap-8 mb-8 md:mb-10">
        {/* Bar Chart */}
        <div className="glass-panel p-5 md:p-8 rounded-[24px] md:rounded-[32px] h-[340px] md:h-[450px] flex flex-col relative animate-fade-in-up w-full">
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div>
              <h3 className="text-base md:text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
                <span className="w-1.5 md:w-2 h-5 md:h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></span>
                รายรับ-รายจ่าย 12 เดือนล่าสุด
              </h3>
              <p className="text-[10px] text-slate-500 ml-4 md:ml-5 mt-1 font-bold uppercase tracking-widest">Financial Trend (12 Months)</p>
            </div>
          </div>
          <div className="flex-1 w-full relative z-10 overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 5, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FB7185" stopOpacity={1} />
                    <stop offset="100%" stopColor="#E11D48" stopOpacity={0.8} />
                  </linearGradient>
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
                        <text
                          x={0} y={0}
                          textAnchor="middle"
                          fill="#64748B"
                          fontWeight={700}
                          fontSize={isMobile ? 9 : 11}
                          style={{ fontFamily: 'inherit' }}
                        >
                          {payload.value}
                        </text>
                      </g>
                    );
                  }}
                />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontWeight: 700 }} tickFormatter={(val) => val >= 1000 ? (val / 1000) + 'k' : val} dx={-5} />
                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (<div className="bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-3">{label}</p>
                      <div className="space-y-2.5">{payload.map((entry, index) => (<div key={`item-${index}`} className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div><span className="text-slate-200 font-bold text-xs">{entry.name}: <span className="font-black text-white ml-1">฿{fmt(entry.value)}</span></span></div>))}</div>
                    </div>);
                  }
                  return null;
                }} />
                <Bar dataKey="income" name="รายรับ" fill="url(#colorIncome)" radius={[6, 6, 3, 3]} maxBarSize={18} animationDuration={600} animationEasing="ease-out" />
                <Bar dataKey="expense" name="รายจ่าย" fill="url(#colorExpense)" radius={[6, 6, 3, 3]} maxBarSize={18} animationDuration={600} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          {/* Income Pie Chart */}
          <div className="glass-panel p-5 md:p-8 rounded-[24px] md:rounded-[32px] h-[320px] md:h-[450px] flex flex-col relative animate-fade-in-up">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h3 className="text-base md:text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
                  <span className="w-1.5 md:w-2 h-5 md:h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></span>
                  สัดส่วนรายรับ (Income Ratio)
                </h3>
                <p className="text-[10px] text-slate-500 ml-4 md:ml-5 mt-1 font-bold uppercase tracking-widest">Top Income Current Month</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col sm:flex-row items-center relative z-10 gap-4 sm:gap-2 overflow-hidden pb-2 sm:pb-0">
              <div className="w-full sm:w-1/2 h-[140px] sm:h-full relative flex items-center justify-center shrink-0">
                {incomeCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={incomeCategoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={6} dataKey="value" stroke="none" cornerRadius={6} animationDuration={600} onClick={(data) => setSelectedIncomeCategory(data.name)} style={{ cursor: 'pointer' }}>
                        {incomeCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (<div className="bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 py-3 px-4 rounded-2xl flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }}></div><span className="text-slate-200 font-bold text-xs">{payload[0].name}: <span className="font-black text-white ml-1">฿{fmt(payload[0].value)}</span></span></div>);
                        }
                        return null;
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-300 dark:border-[#334155] border-t-blue-500 animate-spin"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">No Data</span>
                  </div>
                )}
                {incomeCategoryData.length > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-800 dark:text-white sm:text-2xl">{fmt(incomeCategoryData.reduce((acc, curr) => acc + curr.value, 0))}</span>
                  </div>
                )}
              </div>
              <div className="w-full sm:w-1/2 flex flex-col justify-start sm:justify-center space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-full">
                {incomeCategoryData.map((entry, index) => (
                  <div key={index} onClick={() => setSelectedIncomeCategory(entry.name)} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-2 flex-1 min-w-0 pr-2">
                      <span className="w-3 h-3 rounded-md shrink-0 group-hover:scale-110 transition-transform duration-200" style={{ backgroundColor: entry.color }}></span>
                      <span className="text-slate-600 dark:text-[#E2E8F0] font-bold text-xs truncate group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{entry.name}</span>
                    </div>
                    <span className="font-black text-slate-800 dark:text-white text-xs shrink-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">฿{fmt(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expense Pie Chart */}
          <div className="glass-panel p-5 md:p-8 rounded-[24px] md:rounded-[32px] h-[320px] md:h-[450px] flex flex-col relative animate-fade-in-up">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h3 className="text-base md:text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
                  <span className="w-1.5 md:w-2 h-5 md:h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></span>
                  สัดส่วนรายจ่าย (Expense Ratio)
                </h3>
                <p className="text-[10px] text-slate-500 ml-4 md:ml-5 mt-1 font-bold uppercase tracking-widest">Top Expenses Current Month</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col sm:flex-row items-center relative z-10 gap-4 sm:gap-2 overflow-hidden pb-2 sm:pb-0">
              <div className="w-full sm:w-1/2 h-[140px] sm:h-full relative flex items-center justify-center shrink-0">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={6} dataKey="value" stroke="none" cornerRadius={6} animationDuration={600} onClick={(data) => setSelectedExpenseCategory(data.name)} style={{ cursor: 'pointer' }}>
                        {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (<div className="bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 py-3 px-4 rounded-2xl flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }}></div><span className="text-slate-200 font-bold text-xs">{payload[0].name}: <span className="font-black text-white ml-1">฿{fmt(payload[0].value)}</span></span></div>);
                        }
                        return null;
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-300 dark:border-[#334155] border-t-purple-500 animate-spin"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">No Data</span>
                  </div>
                )}
                {categoryData.length > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-800 dark:text-white sm:text-2xl">{fmt(categoryData.reduce((acc, curr) => acc + curr.value, 0))}</span>
                  </div>
                )}

              </div>
              <div className="w-full sm:w-1/2 flex flex-col justify-start sm:justify-center space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-full">
                {categoryData.map((entry, index) => (
                  <div key={index} onClick={() => setSelectedExpenseCategory(entry.name)} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-2 flex-1 min-w-0 pr-2">
                      <span className="w-3 h-3 rounded-md shrink-0 group-hover:scale-110 transition-transform duration-200" style={{ backgroundColor: entry.color }}></span>
                      <span className="text-slate-600 dark:text-[#E2E8F0] font-bold text-xs truncate group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{entry.name}</span>
                    </div>
                    <span className="font-black text-slate-800 dark:text-white text-xs shrink-0 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">฿{fmt(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Detail Modal */}
      {
        selectedExpenseCategory && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#030610]/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedExpenseCategory(null)}></div>
            <div className="relative glass-panel w-full max-w-lg rounded-[24px] md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-zoom-in">
              <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-[#0A101D]/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-6 rounded-full" style={{ backgroundColor: categories.find(c => c.name === selectedExpenseCategory)?.color || '#94A3B8' }}></div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">{selectedExpenseCategory}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Expense Details</p>
                  </div>
                </div>
                <button onClick={() => setSelectedExpenseCategory(null)} className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                {currentMonthTransactions.filter(t => t.type === 'EXPENSE' && (t.description === selectedExpenseCategory || (!t.description && selectedExpenseCategory === 'อื่นๆ'))).map((t, idx) => (
                  <div key={idx} className="flex flex-col p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-black text-slate-800 dark:text-white">{formatThaiDate(t.transaction_date)}</span>
                      <span className="font-black text-rose-500 text-lg tracking-tight">-฿{fmt(t.amount)}</span>
                    </div>
                    {t.note && (
                      <div className="flex gap-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">NOTE:</span>
                        <p className="text-xs font-medium text-slate-600 dark:text-white/70">{t.note}</p>
                      </div>
                    )}
                  </div>
                ))}
                {currentMonthTransactions.filter(t => t.type === 'EXPENSE' && (t.description === selectedExpenseCategory || (!t.description && selectedExpenseCategory === 'อื่นๆ'))).length === 0 && (
                  <div className="text-center py-8 text-slate-500 font-black tracking-widest text-sm uppercase">ไม่มีรายการ</div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Income Detail Modal */}
      {
        selectedIncomeCategory && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#030610]/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedIncomeCategory(null)}></div>
            <div className="relative glass-panel w-full max-w-lg rounded-[24px] md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-zoom-in">
              <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-[#0A101D]/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-6 rounded-full" style={{ backgroundColor: categories.find(c => c.name === selectedIncomeCategory)?.color || '#34D399' }}></div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">{selectedIncomeCategory}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Income Details</p>
                  </div>
                </div>
                <button onClick={() => setSelectedIncomeCategory(null)} className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                {currentMonthTransactions.filter(t => t.type === 'INCOME' && (t.description === selectedIncomeCategory || (!t.description && selectedIncomeCategory === 'อื่นๆ'))).map((t, idx) => {
                  const inKind = isInKindTransaction(t);
                  const cleanNote = cleanTransactionNote(t.note);
                  return (
                    <div key={idx} className={`flex flex-col p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border ${inKind ? 'border-purple-400/40 dark:border-purple-500/30' : 'border-slate-200 dark:border-white/5'} hover:border-slate-300 dark:hover:border-white/10 transition-colors`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {inKind && <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">🎁 สิ่งของ</span>}
                          <span className="text-sm font-black text-slate-800 dark:text-white">{formatThaiDate(t.transaction_date)}</span>
                        </div>
                        <span className={`font-black text-lg tracking-tight ${inKind ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-500'}`}>{inKind ? '' : '+'}฿{fmt(t.amount)}</span>
                      </div>
                      {cleanNote && (
                        <div className="flex gap-2">
                          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">NOTE:</span>
                          <p className="text-xs font-medium text-slate-600 dark:text-white/70">{cleanNote}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {currentMonthTransactions.filter(t => t.type === 'INCOME' && (t.description === selectedIncomeCategory || (!t.description && selectedIncomeCategory === 'อื่นๆ'))).length === 0 && (
                  <div className="text-center py-8 text-slate-500 font-black tracking-widest text-sm uppercase">ไม่มีรายการ</div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Recent Transactions — Card on mobile, Table on desktop */}
      <div className="glass-panel rounded-[24px] md:rounded-[32px] overflow-hidden animate-fade-in-up flex flex-col" style={{ animationDelay: '0.7s' }}>
        <div className="px-5 md:px-8 py-4 md:py-6 border-b border-slate-200/50 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-[#0B1121]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-1.5 md:w-2 h-5 md:h-6 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-full"></div>
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white tracking-tight leading-none">บันทึกธุรกรรมล่าสุด</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Recent Transactions History</p>
            </div>
          </div>
          {isLoggedIn && (
            <button onClick={() => setActiveMenu('record')} className="px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider hover:bg-blue-500 hover:text-white transition-all duration-300 border border-transparent hover:border-blue-400 shadow-sm whitespace-nowrap">
              ดูทั้งหมด
            </button>
          )}
        </div>

        {/* Premium Card Grid — All screens */}
        <div className="px-3 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          {transactions.slice(0, 6).map((tx) => {
            const isIncome = tx.type === 'INCOME';
            const inKind = isInKindTransaction(tx);
            const cleanNote = cleanTransactionNote(tx.note);

            return (
              <div
                key={tx.id}
                className={`glass-panel relative rounded-[22px] overflow-hidden
                  border ${inKind ? 'border-purple-400/50 dark:border-purple-500/40 bg-purple-950/10' : (isIncome ? 'border-emerald-400/40 dark:border-emerald-500/30' : 'border-rose-400/40 dark:border-rose-500/30')}`}
              >
                {/* Top shimmer accent line */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] ${inKind
                  ? 'bg-gradient-to-r from-transparent via-purple-400 to-transparent'
                  : (isIncome ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-400 to-transparent')}`}
                />
                {/* Ambient glow orb */}
                <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl pointer-events-none opacity-0 dark:opacity-100 ${inKind ? 'bg-purple-500/25' : (isIncome ? 'bg-emerald-500/20' : 'bg-rose-500/20')}`} />

                {/* ─── HEADER: ประเภท + วันที่ ─── */}
                <div className="relative flex items-center justify-between px-5 pt-4 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${inKind
                      ? 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.9)]'
                      : (isIncome ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.9)]')}`}
                    />
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
                    {formatThaiDate(tx.transaction_date)}
                  </span>
                </div>

                {/* Divider */}
                <div className={`mx-5 h-px ${inKind
                  ? 'bg-gradient-to-r from-transparent via-purple-500/30 to-transparent'
                  : (isIncome ? 'bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-500/30 to-transparent')}`}
                />

                {/* ─── BODY: หมวดหมู่ + จำนวน + รูป ─── */}
                <div className="relative flex items-center justify-between px-5 py-4">
                  {/* Left: category & amount */}
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-base font-black text-slate-800 dark:text-white mb-1.5 truncate tracking-tight">
                      {tx.description}
                    </p>
                    {inKind ? (
                      <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-300">
                        ฿{fmt(tx.amount)}
                      </span>
                    ) : (
                      <span className={`text-2xl font-black tracking-tight ${isIncome
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-300 dark:to-emerald-500'
                        : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-600 dark:from-rose-300 dark:to-rose-500'}`}
                      >
                        {isIncome ? '+' : '-'}฿{fmt(tx.amount)}
                      </span>
                    )}
                  </div>
                  {/* Right: receipt image */}
                  <button
                    onClick={() => tx.image_url && handleViewImage(tx.image_url)}
                    className={`relative w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 active:scale-95
                      ${tx.image_url
                        ? `cursor-pointer border-2 ${inKind ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]' : (isIncome ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)]')}`
                        : 'border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 cursor-default opacity-40'}`}
                  >
                    {tx.image_url
                      ? <img src={tx.image_url} alt="Receipt" className="w-full h-full object-cover" />
                      : <ImageIcon size={20} className="text-slate-400 dark:text-white/30" />
                    }
                  </button>
                </div>

                {/* Divider */}
                <div className={`mx-5 h-px ${inKind
                  ? 'bg-gradient-to-r from-transparent via-purple-500/20 to-transparent'
                  : (isIncome ? 'bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-500/20 to-transparent')}`}
                />

                {/* ─── FOOTER: หมายเหตุ + ดูทั้งหมด ─── */}
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <span className="text-slate-400 dark:text-white/25 text-[10px] font-black uppercase tracking-widest shrink-0">NOTE</span>
                    <span className="text-xs text-slate-500 dark:text-white/60 font-medium truncate">{cleanNote || (inKind ? 'ถวายสิ่งของ/ชำระให้โดยตรง' : '—')}</span>
                  </div>
                  {isLoggedIn && (
                    <button
                      onClick={() => setActiveMenu('record')}
                      className="flex items-center gap-1 text-[11px] font-black text-indigo-500 dark:text-cyan-400 hover:text-indigo-600 dark:hover:text-cyan-300 active:scale-95 transition-all shrink-0"
                    >
                      ดูทั้งหมด
                      <span className="text-[10px]">→</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <div className="p-10 flex flex-col items-center text-slate-400 space-y-3">
              <Receipt size={28} className="text-slate-300 dark:text-slate-600" />
              <span className="text-sm font-bold uppercase tracking-wider">No Transactions Found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}