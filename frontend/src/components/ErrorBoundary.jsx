import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      sessionStorage.setItem('activeMenu', 'overview');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FDF2F8] dark:bg-[#060A13] text-gray-800 dark:text-white font-sans">
          <div className="glass-panel max-w-md w-full p-6 md:p-8 rounded-[32px] border border-pink-200 dark:border-white/10 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-500 shadow-md">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                ขออภัย เกิดข้อผิดพลาด 🌸
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                ระบบพบปัญหาในการแสดงผลหน้านี้ กรุณากดปุ่มด้านล่างเพื่อโหลดใหม่
              </p>
            </div>

            {this.state.error && (
              <div className="w-full p-3 rounded-2xl bg-white/70 dark:bg-black/40 border border-rose-200 dark:border-rose-900/40 text-[11px] font-mono text-rose-600 dark:text-rose-400 text-left overflow-x-auto max-h-28 custom-scrollbar">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-2.5 w-full pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 active:scale-95 transition-all"
              >
                <RefreshCw size={14} />
                <span>รีเฟรชหน้าเว็บ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.setItem('activeMenu', 'overview');
                  } catch {}
                  window.location.href = '/';
                }}
                className="py-3 px-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-pink-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-pink-50 dark:hover:bg-white/10 active:scale-95 transition-all"
              >
                <Home size={14} />
                <span>หน้าหลัก</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
