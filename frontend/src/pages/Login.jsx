import { useState } from 'react';
import { login } from '../supabase';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, X } from 'lucide-react';

export default function Login({ onLogin, onBack }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(() => localStorage.getItem('savedEmail') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('savedPassword') || '');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('savedEmail') ? true : false);
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await login(email, password);
      if (data.status === 'success') {
        if (rememberMe) {
          localStorage.setItem('savedEmail', email);
          localStorage.setItem('savedPassword', password);
        } else {
          localStorage.removeItem('savedEmail');
          localStorage.removeItem('savedPassword');
        }
        onLogin();
      } else {
        alert(data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้องครับ');
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อระบบหลังบ้าน');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#030610] transition-colors duration-500 overflow-hidden font-sans relative p-4 sm:p-6 lg:p-12">

      {/* ── Static Ambient Background (ไม่กระพริบ) ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800A_1px,transparent_1px),linear-gradient(to_bottom,#8080800A_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      {/* Edge glow – static, no animation */}
      <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-blue-500/25 via-purple-500/8 dark:from-blue-500/18 to-transparent blur-[40px] pointer-events-none z-10 opacity-70" />
      <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-purple-500/25 via-blue-500/8 dark:from-purple-500/18 to-transparent blur-[40px] pointer-events-none z-10 opacity-70" />
      <div className="absolute top-0 left-0 w-[30vw] h-full bg-gradient-to-r from-blue-500/20 dark:from-blue-600/15 to-transparent blur-[50px] pointer-events-none z-10 opacity-60" />
      <div className="absolute top-0 right-0 w-[30vw] h-full bg-gradient-to-l from-purple-500/20 dark:from-purple-600/15 to-transparent blur-[50px] pointer-events-none z-10 opacity-60" />

      {/* Corner orbs */}
      <div className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-[15%] right-[0%] w-[40%] h-[50%] rounded-full bg-indigo-600/20 blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />

      {/* ── Main HUD Container ── */}
      <div className="w-full h-full max-w-[1400px] flex flex-col lg:flex-row rounded-[30px] lg:rounded-[40px] overflow-hidden z-10 animate-fade-in-up border border-slate-200/50 dark:border-white/5 bg-white/30 dark:bg-[#060A13]/40 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_80px_rgba(0,0,0,0.5)] relative">

        {/* Top / Bottom edge rail */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent z-20" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent z-20" />

        {/* ═══════════════════════════════════════
            LEFT — Branding
        ═══════════════════════════════════════ */}
        <div className="hidden lg:flex w-1/2 p-8 xl:p-12 2xl:p-16 flex-col justify-between relative overflow-hidden border-r border-slate-200/50 dark:border-white/5 group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-purple-100/30 dark:from-blue-900/10 dark:to-purple-900/10 z-0" />

          <div className="relative z-10 flex flex-col flex-1 justify-center items-center text-center">

            {/* Logo */}
            <div className="relative mb-6 xl:mb-8 transition-transform duration-700 z-10 flex justify-center items-center group-hover:-translate-y-2">
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-50 blur-[30px] group-hover:opacity-80 group-hover:blur-[45px] transition-all duration-700"></div>
              <div className="w-56 h-56 xl:w-64 xl:h-64 2xl:w-72 2xl:h-72 relative z-10">
                <img
                  src="/logo.png?v=6"
                  alt="Logo"
                  className="w-full h-full object-contain scale-[1.35] drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-700"
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-3xl xl:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 uppercase tracking-tighter drop-shadow-sm filter flex flex-col items-center">
                <span>The House of</span>
                <span className="text-[0.7em] tracking-[0.1em] mt-2">worship and pray</span>
              </h1>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            RIGHT — Login Form
        ═══════════════════════════════════════ */}
        <div className="w-full h-full lg:w-1/2 p-8 sm:p-12 xl:p-14 flex flex-col justify-center relative bg-white/40 dark:bg-[#0B1121]/40 overflow-y-auto">

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="absolute top-6 right-6 xl:top-8 xl:right-8 w-10 h-10 xl:w-12 xl:h-12 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-rose-500 dark:text-[#94A3B8] dark:hover:text-rose-400 hover:bg-white dark:hover:bg-white/10 hover:shadow-[0_4px_20px_rgba(244,63,94,0.15)] transition-all duration-300 hover:rotate-90 hover:scale-110 z-50"
              title="ยกเลิก / กลับไปหน้าหลัก"
            >
              <X size={20} className="xl:w-6 xl:h-6" />
            </button>
          )}

          <div className="max-w-[440px] mx-auto w-full relative z-10">

            {/* Mobile logo */}
            <div className="lg:hidden flex flex-col items-center justify-center mb-6 pt-2">
              <div className="relative mb-3 transition-transform duration-700 z-10 flex justify-center items-center group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-50 blur-[20px]"></div>
                <div className="w-40 h-40 sm:w-48 sm:h-48 relative z-10 flex items-center justify-center">
                  <img src="/logo.png?v=6" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" />
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 uppercase tracking-tighter drop-shadow-sm flex flex-col items-center">
                <span>The House of</span>
                <span className="text-[0.65em] tracking-[0.1em] mt-1 font-bold">worship and pray</span>
              </h1>
            </div>

            {/* Header */}
            <div className="text-center mb-10 xl:mb-14 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 mb-6 relative overflow-hidden group">
                <div className="absolute inset-0 w-1/4 h-full bg-white/50 skew-x-[-20deg] translate-x-[-200%] group-hover:translate-x-[500%] transition-transform duration-1000" />
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 relative z-10" />
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest relative z-10">จำเป็นต้องเข้าสู่ระบบ</span>
              </div>
              <h2 className="text-3xl xl:text-4xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">เข้าสู่ระบบ</h2>
              <p className="text-slate-500 dark:text-[#94A3B8] font-bold text-sm tracking-wide">กรุณายืนยันตัวตนเพื่อเข้าใช้งาน</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] ml-2 uppercase tracking-[0.2em]">อีเมลผู้ใช้งาน</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail className="text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused('')}
                    placeholder="กรอกอีเมลของคุณ..."
                    required
                    autoComplete="email"
                    style={{
                      WebkitBoxShadow: focused === 'email'
                        ? '0 0 0 1000px #05091a inset'
                        : '0 0 0 1000px #05091a inset',
                      WebkitTextFillColor: '#e2e8f0',
                      caretColor: '#e2e8f0',
                    }}
                    className="w-full pl-14 pr-6 py-4 xl:py-5 bg-white/80 dark:bg-[#060A13]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[18px] text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-bold tracking-wide shadow-inner text-sm"
                  />
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 transition-colors group-focus-within:bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] opacity-0 group-focus-within:opacity-100" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] ml-2 uppercase tracking-[0.2em]">รหัสผ่าน</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock className="text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    style={{
                      WebkitBoxShadow: '0 0 0 1000px #05091a inset',
                      WebkitTextFillColor: '#e2e8f0',
                      caretColor: '#e2e8f0',
                    }}
                    className="w-full pl-14 pr-16 py-4 xl:py-5 bg-white/80 dark:bg-[#060A13]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[18px] text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-black tracking-widest shadow-inner text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between pt-1 pb-4 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0B1121] transition-all group-hover:border-blue-500 shadow-inner overflow-hidden">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-500 scale-0 opacity-0 peer-checked:scale-100 peer-checked:opacity-100 transition-all duration-300" />
                    <svg className="w-3 h-3 text-white relative z-10 opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 transition-all duration-300 delay-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] tracking-[0.1em] uppercase transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">จดจำการเข้าสู่ระบบ</span>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-2 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 xl:py-5 rounded-[18px] font-black text-xs uppercase tracking-[0.3em] shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_10px_40px_0_rgba(79,70,229,0.7)] hover:-translate-y-1 active:scale-95 transition-all duration-500 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"
                    style={{ background: 'linear-gradient(45deg,transparent 25%,rgba(255,255,255,0.15) 50%,transparent 75%)' }}
                  />
                  <div className="absolute inset-[-2px] rounded-[20px] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500 z-0 pointer-events-none" />
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="relative z-20">กำลังตรวจสอบ...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-20 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">เข้าสู่ระบบ</span>
                      <div className="relative z-20 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-all duration-500 group-hover:translate-x-3">
                        <ArrowRight size={12} className="transition-transform duration-500" />
                      </div>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}