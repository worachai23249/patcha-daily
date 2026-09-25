import { useState, useEffect, useRef } from 'react';
import {
  getTransactions,
  getCategories,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addCategory,
  updateCategory,
  deleteCategory,
  getNewTransactions,
  checkAuth,
  logout,
  sendOneSignalPush
} from './supabase';

import {
  LayoutDashboard, ArrowLeftRight, Tags, PieChart as PieChartIcon,
  Sun, Moon, LogOut, X, Trash2, Upload, Lock, AlertTriangle, CheckCircle, Menu, Camera, Bell
} from 'lucide-react';

import Overview from './pages/Overview';
import Record from './pages/Record';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Login from './pages/Login';
import NotificationToast from './components/NotificationToast';
import NotificationSettingsModal from './components/NotificationSettingsModal';
import { sendTransactionNotification, isInKindTransaction, cleanTransactionNote } from './services/notificationService';

const CATEGORY_COLORS = ['#EF4444', '#F87171', '#F97316', '#EAB308', '#84CC16', '#10B981', '#059669', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#64748B'];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('isLoggedIn') === 'true');
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, type: '', title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });
  const [toasts, setToasts] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const lastIdRef = useRef(null);

  const showSuccess = (title, message) => {
    setSuccessModal({ isOpen: true, title, message });
    setTimeout(() => setSuccessModal(prev => ({ ...prev, isOpen: false })), 2500);
  };

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const playAppNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
  };

  const setUnreadBadge = (count) => {
    if ('setAppBadge' in navigator) {
      if (count > 0) navigator.setAppBadge(count).catch(() => {});
      else navigator.clearAppBadge().catch(() => {});
    }
  };

  const setupPWAWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  };

  // ส่ง Web Notification จริงไปยัง notification bar ของมือถือ/คอม
  const sendWebNotification = (title, body) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      // ใช้ Service Worker showNotification (รองรับมือถือดีกว่า new Notification)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            body,
            icon: '/logo.png?v=6',
            badge: '/pwa-192x192.png',
            vibrate: [200, 100, 200],
            tag: 'patcha-daily-transaction',
            renotify: true,
            data: { url: '/' }
          });
        }).catch(() => {
          new Notification(title, { body, icon: '/logo.png?v=6' });
        });
      } else {
        new Notification(title, { body, icon: '/logo.png?v=6', vibrate: [200, 100, 200] });
      }
    } catch(e) {}
  };

  const requestNotificationPermission = async () => {
    try {
      setupPWAWorker();
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch(e) {}
  };

  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(() => sessionStorage.getItem('activeMenu') || 'overview');
  
  useEffect(() => { sessionStorage.setItem('activeMenu', activeMenu); }, [activeMenu]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [donationType, setDonationType] = useState('CASH'); // 'CASH' or 'IN_KIND'
  const [formData, setFormData] = useState({ transaction_date: new Date().toISOString().split('T')[0], type: 'EXPENSE', description: '', amount: '', note: '' });
  const [categoryFormData, setCategoryFormData] = useState({ id: null, name: '', type: 'EXPENSE', color: CATEGORY_COLORS[11] });
  const [imagePreview, setImagePreview] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.setAttribute('content', isDarkMode ? '#060A13' : '#F8FAFC');
  }, [isDarkMode]);

  const fetchTransactions = () => {
    return getTransactions().then(data => setTransactions(data));
  };

  const fetchCategories = () => {
    return getCategories().then(data => setCategories(data));
  };

  useEffect(() => {
    const authCheck = checkAuth()
      .then(data => {
        if (data.is_logged_in) {
          setIsLoggedIn(true);
          sessionStorage.setItem('isLoggedIn', 'true');
        } else {
          setIsLoggedIn(false);
          sessionStorage.removeItem('isLoggedIn');
        }
      })
      .catch(() => console.error('Auth check failed'));

    Promise.all([fetchTransactions(), fetchCategories(), authCheck])
      .finally(() => setLoading(false));

    // Register Service Worker + ขอสิทธิ์แจ้งเตือนอัตโนมัติ
    setupPWAWorker();
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => requestNotificationPermission(), 3000);
    }
  }, []);

  // ── เคลียร์ badge เมื่อผู้ใช้เปิดแอพ/โฟกัสที่หน้าต่าง ──
  useEffect(() => {
    const clearOnFocus = () => {
      setNotifCount(0);
      if ('clearAppBadge' in navigator) navigator.clearAppBadge().catch(() => {});
    };
    const onVisibility = () => { if (!document.hidden) clearOnFocus(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', clearOnFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', clearOnFocus);
    };
  }, []);

  // ── Set initial lastId once transactions load ──
  useEffect(() => {
    if (lastIdRef.current === null && transactions.length > 0) {
      lastIdRef.current = Math.max(...transactions.map(t => parseInt(t.id) || 0));
    }
  }, [transactions]);

  // ── Poll for new transactions every 30s ──
  useEffect(() => {
    let interval;
    const startPolling = () => {
      interval = setInterval(async () => {
        if (lastIdRef.current === null) return;
        try {
          const data = await getNewTransactions(lastIdRef.current);
          if (Array.isArray(data) && data.length > 0) {
            const maxId = Math.max(...data.map(t => parseInt(t.id) || 0));
            lastIdRef.current = maxId;
            playAppNotificationSound();
            const newCount = data.length;
            setNotifCount(prev => {
              const total = prev + newCount;
              setUnreadBadge(total);
              return total;
            });
            // ส่ง Web Notification เข้า notification bar มือถือ
            const first = data[0];
            const typeLabel = first.type === 'INCOME' ? 'รายรับใหม่' : 'รายจ่ายใหม่';
            const amountLabel = `฿${Number(first.amount).toLocaleString('th-TH')}`;
            sendWebNotification(
              `Patcha Daily — ${typeLabel}${newCount > 1 ? ` (+${newCount} รายการ)` : ''}`,
              `${first.description}: ${amountLabel}`
            );
            setToasts(prev => [
              ...prev.slice(-4),
              ...data.map(t => ({ ...t, id: `toast-${t.id}-${Date.now()}` }))
            ]);
            fetchTransactions();
          }
        } catch(e) {}
      }, 30000);
    };
    const timeout = setTimeout(startPolling, 5000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, []);

  const handleOpenAddTransaction = () => {
    setEditingId(null); 
    setDonationType('CASH');
    setFormData({ transaction_date: new Date().toISOString().split('T')[0], type: 'EXPENSE', description: '', amount: '', note: '' });
    setImagePreview(null); 
    setIsFormOpen(true);
  };

  const handleOpenEditTransaction = (tx) => {
    setEditingId(tx.id);
    setDonationType(isInKindTransaction(tx) ? 'IN_KIND' : 'CASH');
    setFormData({ 
      transaction_date: tx.transaction_date, 
      type: tx.type, 
      description: tx.description, 
      amount: tx.amount, 
      note: cleanTransactionNote(tx.note) 
    });
    setImagePreview(tx.image_url || null); 
    setIsFormOpen(true);
  };

  const handleDeleteTransaction = (id) => {
    setDeleteModal({
      isOpen: true,
      id: id,
      type: 'TRANSACTION',
      title: 'ต้องการลบรายการนี้?',
      message: 'การลบรายการนี้จะไม่สามารถกู้คืนได้ กรุณายืนยันการดำเนินการ'
    });
  };

  const confirmDelete = async () => {
    if (deleteModal.type === 'TRANSACTION') {
      const res = await deleteTransaction(deleteModal.id);
      if (res.status === 'success') {
        fetchTransactions();
        showSuccess('ลบสำเร็จ', 'ข้อมูลรายการถูกลบเรียบร้อยแล้ว');
      } else {
        alert(res.message || "เกิดข้อผิดพลาด");
      }
    } else if (deleteModal.type === 'CATEGORY') {
      const res = await deleteCategory(deleteModal.id);
      if (res.status === 'success') {
        fetchCategories();
        showSuccess('ลบสำเร็จ', 'หมวดหมู่ถูกลบเรียบร้อยแล้ว');
      } else {
        alert(res.message || "เกิดข้อผิดพลาด");
      }
    }
    setDeleteModal({ ...deleteModal, isOpen: false });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 600; let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setImagePreview(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    const isEdit = !!editingId;
    try {
      const rawNote = cleanTransactionNote(formData.note);
      const finalNote = (formData.type === 'INCOME' && donationType === 'IN_KIND')
        ? `[สิ่งของ/จ่ายให้] ${rawNote}`.trim()
        : rawNote;

      const payload = { ...formData, note: finalNote, image_url: imagePreview };

      let res;
      if (isEdit) {
        res = await updateTransaction(editingId, payload);
      } else {
        res = await addTransaction(payload);
      }

      if (res.status === 'success') {
        fetchTransactions();
        setIsFormOpen(false);
        showSuccess(isEdit ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ', isEdit ? 'ข้อมูลรายการถูกอัปเดตเรียบร้อยแล้ว' : 'สร้างรายการใหม่เรียบร้อยแล้ว');
        
        // ส่งการแจ้งเตือนอัตโนมัติเข้า LINE (ทุกรายการพร้อมแนบรูปสลิป)
        sendTransactionNotification(payload, isEdit ? 'UPDATE' : 'ADD');

        // ส่ง Web Notification เข้า notification bar มือถือ
        if (!isEdit) {
          const typeLabel = formData.type === 'INCOME' ? 'บันทึกรายรับ' : 'บันทึกรายจ่าย';
          const amountLabel = `฿${Number(formData.amount).toLocaleString('th-TH')}`;
          sendWebNotification(
            `Patcha Daily — ${typeLabel}สำเร็จ`,
            `${formData.description}: ${amountLabel}`
          );
          setNotifCount(prev => {
            const total = prev + 1;
            setUnreadBadge(total);
            return total;
          });
        }
      } else {
        alert("ไม่สามารถบันทึกได้: " + (res.message || JSON.stringify(res)));
      }
    } catch (err) {
      console.error(err);
      alert("เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่");
    }
  };

  const handleOpenAddCategory = () => { setCategoryFormData({ id: null, name: '', type: 'EXPENSE', color: CATEGORY_COLORS[11] }); setIsCategoryFormOpen(true); };
  const handleOpenEditCategory = (cat) => { setCategoryFormData(cat); setIsCategoryFormOpen(true); };
  const handleDeleteCategory = (id) => {
    setDeleteModal({
      isOpen: true,
      id: id,
      type: 'CATEGORY',
      title: 'ต้องการลบหมวดหมู่นี้?',
      message: 'การลบหมวดหมู่จะไม่สามารถกู้คืนได้ กรุณายืนยันการดำเนินการ'
    });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!categoryFormData.id;
    try {
      let res;
      if (isEdit) {
        res = await updateCategory(categoryFormData.id, categoryFormData);
      } else {
        res = await addCategory(categoryFormData);
      }

      if (res.status === 'success') {
        fetchCategories();
        setIsCategoryFormOpen(false);
        showSuccess(isEdit ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ', `หมวดหมู่ "${categoryFormData.name}" ${isEdit ? 'ถูกแก้ไขเรียบร้อยแล้ว' : 'ถูกสร้างเรียบร้อยแล้ว'}`);
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert("บันทึกไม่สำเร็จ");
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('th-TH');
  const formatThaiDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  if (loading) return (
    <div className={`h-screen ${isDarkMode ? 'bg-[#060A13] text-white' : 'bg-slate-50 text-slate-800'} flex flex-col items-center justify-center gap-6 overflow-hidden relative select-none transition-colors duration-500`}>
      {/* Background grid for light mode */}
      {!isDarkMode && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#F9A8D412_1px,transparent_1px),linear-gradient(to_bottom,#F9A8D412_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      )}

      {/* Ambient background aura */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full ${isDarkMode ? 'bg-pink-500/10 blur-[140px]' : 'bg-gradient-to-r from-blue-400/15 via-purple-400/15 to-indigo-400/15 blur-[120px]'} pointer-events-none`} />

      {/* Logo with smooth pulse */}
      <div className="relative flex items-center justify-center">
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 ${isDarkMode ? 'opacity-25' : 'opacity-20'} blur-[40px]`} />
        <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-[380px] lg:h-[380px] xl:w-[440px] xl:h-[440px] relative z-10 flex items-center justify-center">
          <img
            src="/logo.png?v=6"
            alt="Logo"
            className={`w-full h-full object-contain ${isDarkMode ? 'drop-shadow-[0_0_25px_rgba(244,114,182,0.5)]' : 'drop-shadow-[0_10px_30px_rgba(244,114,182,0.25)]'} transition-transform duration-700 hover:scale-105`}
          />
        </div>
      </div>

      {/* Church title */}
      <div className={`font-black text-transparent bg-clip-text ${isDarkMode ? 'bg-gradient-to-r from-pink-300 via-rose-300 to-pink-400' : 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500'} flex flex-col items-center text-center`}>
        <span className="text-sm md:text-base leading-[1.6em] tracking-[0.25em] uppercase">Patcha Daily</span>
      </div>

      {/* Smooth Loading Indicator */}
      <div className="flex flex-col items-center gap-3 mt-2">
        <div className={`w-48 h-1.5 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-200/90 border-slate-300/60 shadow-inner'} rounded-full overflow-hidden border relative`}>
          <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full" />
        </div>
        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500 font-bold">กำลังโหลดระบบ...</p>
      </div>
    </div>
  );
  if (!isLoggedIn && showLoginScreen) return <Login onLogin={() => { 
    sessionStorage.setItem('isLoggedIn', 'true'); 
    setIsLoggedIn(true); 
    setShowLoginScreen(false); 
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      setTimeout(() => requestNotificationPermission(), 500);
    }
  }} onBack={() => setShowLoginScreen(false)} />;

  return (
    <div className="h-screen bg-[#FDF2F8] dark:bg-[#060A13] text-gray-800 dark:text-white font-sans flex overflow-hidden relative">

      {/* Background & Aura Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>
      <div className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-pink-400/5 dark:bg-pink-500/10 blur-[180px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-pink-400/5 dark:bg-pink-500/10 blur-[180px] pointer-events-none"></div>

      {/* Sidebar ล็อกติดหน้าจอ (Hi-Tech Version) & Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 dark:bg-black/40 backdrop-blur-sm z-[90] animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside className={`w-72 h-full border-r border-pink-100 dark:border-white/5 bg-[#FFF0F5]/95 dark:bg-[#030610]/95 backdrop-blur-2xl flex flex-col justify-between shrink-0 z-[100] shadow-[10px_0_30px_-10px_rgba(0,0,0,0.1)] fixed lg:relative transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} left-0 overflow-y-auto custom-scrollbar`}>
        <div>
          <div className="p-8 border-b border-pink-100 dark:border-white/5 flex flex-col items-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/10 dark:from-blue-600/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

            <div className="relative mb-6 transition-transform duration-700 z-10 flex justify-center items-center group-hover:-translate-y-2">
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 opacity-50 blur-[30px] group-hover:opacity-80 group-hover:blur-[40px] transition-all duration-700"></div>
              <div className="w-56 h-56 xl:w-64 xl:h-64 relative z-10">
                <img src="/logo.png?v=6" alt="Logo" className="w-full h-full object-contain scale-[1.35] drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-700" />
              </div>
            </div>

            <h1 className="text-center font-black uppercase relative z-10 w-full px-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 dark:from-pink-300 dark:via-rose-300 dark:to-pink-400 drop-shadow-sm flex flex-col items-center group-hover:drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] transition-all duration-500">
              <span className="text-[14px] leading-[1.2em] tracking-[0.15em] mt-0.5">Patcha Daily</span>
            </h1>
          </div>

          <div className="p-5 space-y-3">
            {[
              { id: 'overview', icon: LayoutDashboard, label: 'ภาพรวม' },
              ...(isLoggedIn ? [
                { id: 'record', icon: ArrowLeftRight, label: 'บันทึกการเงิน' },
                { id: 'categories', icon: Tags, label: 'ประเภทรายการ' }
              ] : []),
              { id: 'reports', icon: PieChartIcon, label: 'รายงานการเงิน' }
            ].map(menu => {
              const isActive = activeMenu === menu.id;
              const Icon = menu.icon;
              return (
                <button
                  key={menu.id}
                  onClick={() => { setActiveMenu(menu.id); setIsMobileMenuOpen(false); }}
                  className={`group relative w-full flex items-center space-x-4 px-5 py-3.5 rounded-[18px] transition-all duration-500 overflow-hidden font-black tracking-[0.15em] text-[11px] uppercase ${isActive ? 'text-pink-500 dark:text-white border border-pink-400/40 dark:border-pink-400/30 shadow-[0_5px_20px_-5px_rgba(244,114,182,0.2)] bg-pink-50/80 dark:bg-pink-900/10' : 'text-gray-500 dark:text-[#64748B] hover:text-gray-800 dark:hover:text-white border border-transparent hover:border-pink-100 dark:hover:border-white/10 hover:bg-pink-50/50 dark:hover:bg-white/[0.03]'}`}
                >
                  {/* Indicator Edge Rail */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3/4 bg-pink-500 dark:bg-blue-400 shadow-[0_0_15px_rgba(244,114,182,0.8)] rounded-r-full z-10 transition-all duration-500"></div>
                  )}

                  {/* Glass Background Slide */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-white/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0"></div>
                  )}

                  {/* Icon Container Plate */}
                  <div className={`relative z-10 flex items-center justify-center p-2.5 rounded-[12px] transition-all duration-500 ${isActive ? 'bg-pink-100 dark:bg-pink-400/20 shadow-inner' : 'bg-transparent group-hover:bg-slate-200/60 dark:group-hover:bg-white/10'}`}>
                    <Icon size={18} className={`transition-all duration-500 ${isActive ? 'text-pink-500 dark:text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.4)] scale-110' : 'group-hover:scale-110 group-hover:rotate-[8deg] group-hover:text-pink-500 dark:group-hover:text-pink-400'}`} />
                  </div>

                  <span className={`relative z-10 translate-y-[1px] transition-colors duration-500 ${isActive ? 'text-pink-600 dark:text-white' : ''}`}>{menu.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-4 border-t border-pink-100 dark:border-white/5 bg-gradient-to-b from-transparent to-slate-100/50 dark:to-[#060A13]/80 backdrop-blur-md">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="group relative w-full flex items-center space-x-4 px-5 py-4 rounded-[18px] bg-[#FFF0F5]/80 dark:bg-[#0A101D]/80 border border-pink-200 dark:border-white/5 text-gray-600 dark:text-slate-400 font-black overflow-hidden transition-all duration-500 hover:border-pink-400/50 dark:hover:border-pink-400/30 hover:shadow-[0_0_20px_rgba(244,114,182,0.15)] hover:bg-white dark:hover:bg-[#0F172A]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-pink-400/0 to-pink-400/5 dark:to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex items-center justify-center p-2 rounded-[12px] bg-transparent group-hover:bg-pink-50 dark:group-hover:bg-pink-400/20 transition-all duration-500">
              <div className={`transition-transform duration-700 ${isDarkMode ? 'rotate-[360deg]' : 'rotate-0'}`}>
                {isDarkMode ? <Sun size={18} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" /> : <Moon size={18} className="text-pink-500 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]" />}
              </div>
            </div>
            <span className="relative z-10 text-[10px] uppercase tracking-[0.2em] group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors translate-y-[1px]">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>





          {isLoggedIn && (
            <button
              onClick={() => { setIsNotifModalOpen(true); setIsMobileMenuOpen(false); }}
              className="group relative w-full flex items-center space-x-4 px-5 py-4 rounded-[18px] bg-[#FFF0F5]/80 dark:bg-[#0A101D]/80 border border-pink-200 dark:border-white/5 text-gray-600 dark:text-slate-400 font-black overflow-hidden transition-all duration-500 hover:border-emerald-400/50 dark:hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:bg-white dark:hover:bg-[#0F172A]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 to-emerald-500/5 dark:to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex items-center justify-center p-2 rounded-[12px] bg-transparent group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/20 transition-all duration-500">
                <Bell size={18} className="text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span className="relative z-10 text-[10px] uppercase tracking-[0.2em] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors translate-y-[1px]">แจ้งเตือน LINE</span>
            </button>
          )}

          {!isLoggedIn ? (
            <button
              onClick={() => { setShowLoginScreen(true); setIsMobileMenuOpen(false); }}
              className="group relative w-full flex items-center space-x-4 px-5 py-4 rounded-[18px] bg-[#FFF0F5]/80 dark:bg-[#0A101D]/80 border border-pink-200 dark:border-white/5 text-gray-600 dark:text-slate-400 font-black overflow-hidden transition-all duration-500 hover:border-pink-400/50 dark:hover:border-pink-400/30 hover:shadow-[0_0_20px_rgba(244,114,182,0.15)] hover:bg-white dark:hover:bg-[#0F172A]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-pink-400/0 to-pink-400/5 dark:to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex items-center justify-center p-2 rounded-[12px] bg-transparent group-hover:bg-pink-50 dark:group-hover:bg-pink-400/20 transition-all duration-500">
                <Lock size={18} className="group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span className="relative z-10 text-[10px] uppercase tracking-[0.2em] group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors translate-y-[1px]">สำหรับเจ้าหน้าที่</span>
            </button>
          ) : (
            <button
              onClick={async () => { 
                await logout();
                setIsLoggedIn(false); 
                setActiveMenu('overview'); 
                setIsMobileMenuOpen(false); 
              }}
              className="group relative w-full flex items-center space-x-4 px-5 py-4 rounded-[18px] bg-[#FFF0F5]/80 dark:bg-[#0A101D]/80 border border-pink-200 dark:border-white/5 text-gray-600 dark:text-slate-400 font-black overflow-hidden transition-all duration-500 hover:border-rose-400/50 dark:hover:border-rose-500/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:bg-white dark:hover:bg-[#0F172A]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-rose-500/0 to-rose-500/5 dark:to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex items-center justify-center p-2 rounded-[12px] bg-transparent group-hover:bg-rose-50 dark:group-hover:bg-rose-500/20 transition-all duration-500">
                <LogOut size={18} className="group-hover:-translate-x-1 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span className="relative z-10 text-[10px] uppercase tracking-[0.2em] group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors translate-y-[1px]">ออกจากระบบ</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#FFF0F5]/90 dark:bg-[#030610]/90 backdrop-blur-xl border-b border-pink-100 dark:border-white/5 z-[80] flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-slate-300 hover:text-pink-400">
            <Menu size={24} />
          </button>
          <img src="/logo.png?v=6" alt="Logo" className="w-8 h-8 object-contain ml-2 shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
          <span className="ml-2 text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 dark:from-pink-300 dark:via-rose-300 dark:to-pink-400 whitespace-nowrap">Patcha Daily</span>
        </div>
        {isLoggedIn && (
          <button onClick={() => setIsNotifModalOpen(true)} className="p-2 text-emerald-500 hover:scale-110 transition-transform">
            <Bell size={20} />
          </button>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto p-4 lg:p-8 pt-20 lg:pt-8 pb-8 lg:pb-8 relative z-10 custom-scrollbar w-full">
        {activeMenu === 'overview' && <Overview transactions={transactions} categories={categories} formatThaiDate={formatThaiDate} fmt={fmt} handleViewImage={(url) => { setViewImageUrl(url); setIsImageModalOpen(true); }} setActiveMenu={setActiveMenu} isLoggedIn={isLoggedIn} />}
        {activeMenu === 'record' && <Record transactions={transactions} formatThaiDate={formatThaiDate} fmt={fmt} handleViewImage={(url) => { setViewImageUrl(url); setIsImageModalOpen(true); }} handleOpenAddTransaction={handleOpenAddTransaction} handleOpenEditTransaction={handleOpenEditTransaction} handleDeleteTransaction={handleDeleteTransaction} />}
        {activeMenu === 'categories' && <Categories categories={categories} transactions={transactions} handleOpenAddCategory={handleOpenAddCategory} handleOpenEditCategory={handleOpenEditCategory} handleDeleteCategory={handleDeleteCategory} />}
        {activeMenu === 'reports' && <Reports transactions={transactions} categories={categories} fmt={fmt} formatThaiDate={formatThaiDate} handleViewImage={(url) => { setViewImageUrl(url); setIsImageModalOpen(true); }} handleOpenEditTransaction={handleOpenEditTransaction} handleDeleteTransaction={handleDeleteTransaction} isLoggedIn={isLoggedIn} />}
      </main>

      {/* Real-time Toast Notifications */}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} />

      {/* 1. Modal บันทึกรายการ */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-[#060A13]/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-panel w-[92vw] sm:w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] rounded-[24px] md:rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.2)] animate-fade-in-up">
            <div className="flex justify-between items-center p-5 md:p-8 border-b border-pink-100 dark:border-white/10 shrink-0 bg-white/90 dark:bg-[#0F172A]/30">
              <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white tracking-tight">{editingId ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 md:p-3 bg-white dark:bg-[#1E293B] border border-pink-200 dark:border-transparent text-gray-500 dark:text-[#94A3B8] rounded-full hover:text-white hover:bg-slate-800 dark:hover:bg-[#334155] hover:rotate-90 transition-all shadow-sm"><X size={18} className="md:w-5 md:h-5" /></button>
            </div>
            <form onSubmit={handleSubmitTransaction} className="p-5 md:p-8 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar bg-white/95 dark:bg-transparent">
              <div className="flex bg-white/70 dark:bg-[#0F172A]/80 border border-pink-100 dark:border-[#1E293B] rounded-[16px] md:rounded-2xl p-1 md:p-1.5 shadow-inner">
                <button type="button" onClick={() => setFormData({ ...formData, type: 'INCOME', description: '' })} className={`flex-1 py-3 md:py-3.5 rounded-xl md:rounded-xl text-xs md:text-sm font-black tracking-widest uppercase transition-all duration-300 ${formData.type === 'INCOME' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-gray-500 dark:text-[#64748B] hover:text-emerald-500'}`}>รายรับ</button>
                <button type="button" onClick={() => setFormData({ ...formData, type: 'EXPENSE', description: '' })} className={`flex-1 py-3 md:py-3.5 rounded-xl md:rounded-xl text-xs md:text-sm font-black tracking-widest uppercase transition-all duration-300 ${formData.type === 'EXPENSE' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'text-gray-500 dark:text-[#64748B] hover:text-rose-500'}`}>รายจ่าย</button>
              </div>

              {formData.type === 'INCOME' && (
                <div className="bg-white/60 dark:bg-[#060A13]/60 border border-slate-200/60 dark:border-white/10 rounded-[18px] p-2.5 shadow-sm space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider">รูปแบบการถวาย / รายรับ</span>
                    {donationType === 'IN_KIND' && (
                      <span className="text-[10px] font-black text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/70 border border-purple-300/50 dark:border-purple-800/50 px-2.5 py-0.5 rounded-full">
                        ✨ ไม่รวมในยอดเงินสด
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDonationType('CASH')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 ${donationType === 'CASH' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 text-gray-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      <span>💵 ถวายเป็นเงินสด</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonationType('IN_KIND')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 ${donationType === 'IN_KIND' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30' : 'bg-slate-100 dark:bg-white/5 text-gray-600 dark:text-slate-400 hover:text-purple-500'}`}
                    >
                      <span>🎁 สิ่งของ / จ่ายให้</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label className="block text-[10px] font-black text-gray-500 dark:text-[#64748B] uppercase tracking-[0.2em]">
                    {formData.type === 'INCOME' && donationType === 'IN_KIND' ? 'มูลค่าประเมินสิ่งของ / ยอดชำระให้ (บาท)' : 'จำนวนเงิน (บาท)'}
                  </label>
                  {formData.type === 'INCOME' && donationType === 'IN_KIND' && (
                    <span className="text-[10px] font-bold text-purple-500 dark:text-purple-400">*ไม่นำไปรวมเงินสดคงเหลือ</span>
                  )}
                </div>
                <input 
                  type="number" 
                  value={formData.amount} 
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                  required 
                  className={`w-full py-4 md:py-5 text-3xl md:text-4xl font-black text-center bg-white/60 dark:bg-[#060A13]/60 backdrop-blur-md border rounded-[16px] md:rounded-[20px] outline-none text-gray-800 dark:text-white transition-all shadow-sm font-sans ${formData.type === 'INCOME' && donationType === 'IN_KIND' ? 'border-purple-500/50 focus:ring-2 focus:ring-purple-500/50 text-purple-600 dark:text-purple-300' : 'border-pink-100 dark:border-white/10 focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400'}`} 
                  placeholder="0.00" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 dark:text-[#64748B] mb-2 uppercase tracking-[0.2em] ml-1">หมวดหมู่</label>
                  <select value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required className="w-full p-3.5 md:p-4 bg-white/60 dark:bg-[#060A13]/60 backdrop-blur-md border border-pink-100 dark:border-white/10 rounded-[16px] md:rounded-[20px] outline-none text-gray-800 dark:text-white focus:ring-2 focus:ring-pink-400/50 transition-all shadow-sm font-bold text-sm md:text-base">
                    <option value="">เลือก...</option>
                    {categories.filter(c => c.type === formData.type).map(c => (<option key={c.id} value={c.name}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 dark:text-[#64748B] mb-2 uppercase tracking-[0.2em] ml-1">วันที่</label>
                  <input type="date" value={formData.transaction_date} onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })} required className="w-full p-3.5 md:p-4 bg-white/60 dark:bg-[#060A13]/60 backdrop-blur-md border border-pink-100 dark:border-white/10 rounded-[16px] md:rounded-[20px] outline-none text-gray-800 dark:text-white focus:ring-2 focus:ring-pink-400/50 transition-all shadow-sm font-bold text-sm md:text-base [color-scheme:light_dark]" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-[#64748B] mb-2 uppercase tracking-[0.2em] ml-1">หมายเหตุ</label>
                <input type="text" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="ระบุรายละเอียดเพิ่มเติม..." className="w-full p-3.5 md:p-4 bg-white/60 dark:bg-[#060A13]/60 backdrop-blur-md border border-pink-100 dark:border-white/10 rounded-[16px] md:rounded-[20px] outline-none text-gray-800 dark:text-white focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400 transition-all shadow-sm font-bold text-sm md:text-base" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-[#64748B] mb-3 uppercase tracking-[0.2em] ml-1">หลักฐานการทำรายการ</label>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleImageChange} />
                {!imagePreview && (
                  <div className="flex gap-2 w-full">
                    <div onClick={() => fileInputRef.current.click()} className="flex-1 py-8 bg-white/95 dark:bg-[#060A13]/40 border-2 border-slate-300 dark:border-[#1E293B] border-dashed rounded-[20px] flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all group backdrop-blur-sm hover:shadow-[0_0_20px_rgba(244,114,182,0.1)]">
                      <Upload size={28} className="text-gray-400 dark:text-[#334155] mb-2 group-hover:text-pink-400 group-hover:animate-bounce transition-colors" />
                      <span className="text-[10px] font-black text-gray-500 dark:text-[#64748B] uppercase tracking-[0.1em] group-hover:text-pink-400 px-2 text-center">อัปโหลดสลิป</span>
                    </div>
                    <div onClick={() => cameraInputRef.current.click()} className="flex-1 py-8 bg-white/95 dark:bg-[#060A13]/40 border-2 border-slate-300 dark:border-[#1E293B] border-dashed rounded-[20px] flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all group backdrop-blur-sm hover:shadow-[0_0_20px_rgba(244,114,182,0.1)]">
                      <Camera size={28} className="text-gray-400 dark:text-[#334155] mb-2 group-hover:text-pink-400 group-hover:animate-bounce transition-colors" />
                      <span className="text-[10px] font-black text-gray-500 dark:text-[#64748B] uppercase tracking-[0.1em] group-hover:text-pink-400 px-2 text-center">ถ่ายรูป</span>
                    </div>
                  </div>
                )}
                {imagePreview && (
                  <div className="relative w-full h-48 mt-4 rounded-[20px] overflow-hidden border-2 border-pink-100 dark:border-[#1E293B] group shadow-sm">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                      <button type="button" onClick={() => setImagePreview(null)} className="p-3 bg-rose-500 text-white rounded-xl font-black tracking-wider uppercase text-xs shadow-[0_0_20px_rgba(244,63,94,0.5)] flex items-center space-x-2 hover:bg-rose-600 transition-colors hover:scale-105 active:scale-95"><Trash2 size={16} /><span>ลบรูปภาพ</span></button>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-[20px] font-black tracking-widest uppercase text-sm shadow-[0_0_20px_rgba(244,114,182,0.4)] hover:shadow-[0_0_30px_rgba(244,114,182,0.6)] hover:-translate-y-1 active:scale-95 transition-all duration-300">
                บันทึกข้อมูล
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal จัดการหมวดหมู่ */}
      {isCategoryFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-[#060A13]/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-panel w-[92vw] sm:w-full max-w-md rounded-[24px] md:rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-fade-in-up">

            <div className="flex justify-between items-center p-5 md:p-8 border-b border-pink-100 dark:border-[#1E293B] bg-white/90 dark:bg-[#0F172A]/30">
              <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white tracking-tight">{categoryFormData.id ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</h3>
              <button onClick={() => setIsCategoryFormOpen(false)} className="p-2 md:p-3 bg-white dark:bg-[#1E293B] border border-pink-200 dark:border-transparent text-gray-500 dark:text-[#94A3B8] rounded-full hover:text-white hover:bg-slate-800 dark:hover:bg-[#334155] hover:rotate-90 transition-all shadow-sm"><X size={18} className="md:w-5 md:h-5" /></button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-5 md:p-8 space-y-6 md:space-y-8 bg-white/95 dark:bg-transparent">

              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-[#64748B] mb-3 uppercase tracking-[0.2em] ml-1">ชื่อหมวดหมู่</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="เช่น อาหาร, ถุงถวาย"
                  required
                  className="w-full p-3.5 md:p-4 bg-white/60 dark:bg-[#060A13]/60 backdrop-blur-md border border-pink-100 dark:border-white/10 rounded-[16px] md:rounded-[20px] text-gray-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-pink-400/50 transition-colors shadow-sm text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-[#64748B] mb-3 uppercase tracking-[0.2em] ml-1">ประเภท</label>
                <div className="flex bg-white/70 dark:bg-[#0F172A]/80 border border-pink-100 dark:border-[#1E293B] rounded-[16px] md:rounded-2xl p-1 md:p-1.5 shadow-inner">
                  <button type="button" onClick={() => setCategoryFormData({ ...categoryFormData, type: 'INCOME' })} className={`flex-1 py-3 md:py-3.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all duration-300 ${categoryFormData.type === 'INCOME' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-gray-500 dark:text-[#64748B] hover:text-emerald-500'}`}>รายรับ</button>
                  <button type="button" onClick={() => setCategoryFormData({ ...categoryFormData, type: 'EXPENSE' })} className={`flex-1 py-3 md:py-3.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all duration-300 ${categoryFormData.type === 'EXPENSE' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'text-gray-500 dark:text-[#64748B] hover:text-rose-500'}`}>รายจ่าย</button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-[#64748B] mb-4 uppercase tracking-[0.2em] ml-1 text-center">เลือกสีประจำหมวดหมู่</label>
                <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
                  {CATEGORY_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryFormData({ ...categoryFormData, color: color })}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-[12px] md:rounded-[16px] transition-all duration-300 relative group overflow-hidden ${categoryFormData.color === color ? 'scale-110 shadow-lg' : 'hover:scale-110 opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: color }}
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {categoryFormData.color === color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 border-[3px] border-white/80 rounded-[12px]"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-5 bg-gradient-to-r from-[#60A5FA] to-[#A855F7] hover:from-[#3B82F6] hover:to-[#9333EA] text-white rounded-[20px] font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:-translate-y-1 active:scale-95 transition-all duration-300"
              >
                {categoryFormData.id ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* 4. Modal ยืนยันการลบ (แทน window.confirm) */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#030610]/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-[92vw] sm:w-full max-w-md overflow-hidden flex flex-col rounded-[24px] md:rounded-[32px] bg-[#13151c] border border-white/5 shadow-[0_0_80px_rgba(255,42,95,0.15)] animate-fade-in-up">

            {/* Ambient Red Glow Behind */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#ff2a5f]/10 blur-[120px] pointer-events-none"></div>

            <div className="flex justify-end p-4 md:p-5 pb-0 relative z-10">
              <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="w-8 h-8 md:w-10 md:h-10 bg-[#1e202b] border border-[#2a2d3c] text-slate-400 rounded-full flex items-center justify-center hover:text-white hover:bg-[#282b3a] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:rotate-90 transition-all duration-300"><X size={16} /></button>
            </div>

            <div className="p-6 md:p-8 pt-0 pb-8 md:pb-10 flex flex-col items-center text-center relative z-10">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#ff2a5f]/10 border-2 border-[#ff2a5f]/40 shadow-[0_0_40px_rgba(255,42,95,0.3),inset_0_0_20px_rgba(255,42,95,0.4)] flex items-center justify-center mb-6 md:mb-8 relative group">
                <div className="absolute inset-0 rounded-full bg-[#ff2a5f] blur-2xl opacity-30 animate-pulse"></div>
                <AlertTriangle size={36} className="text-[#ff2a5f] drop-shadow-[0_0_12px_rgba(255,42,95,0.8)] relative z-10 w-8 md:w-10" />
              </div>

              <h3 className="text-xl md:text-2xl font-black text-[#ff2a5f] tracking-tight mb-3 md:mb-4 drop-shadow-[0_0_15px_rgba(255,42,95,0.6)]">
                {deleteModal.title}
              </h3>

              <p className="text-xs md:text-sm text-[#94a3b8] leading-relaxed max-w-[280px] mx-auto mb-8 font-bold">
                {deleteModal.message}
              </p>

              <div className="grid grid-cols-2 gap-3 md:gap-4 w-full px-2">
                <button
                  onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                  className="w-full py-3.5 md:py-4 px-2 bg-[#212431] hover:bg-[#2a2e3d] border border-[#2d3142] text-white rounded-[16px] md:rounded-[20px] font-black uppercase tracking-widest text-[12px] md:text-[13px] transition-all shadow-sm active:scale-95"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmDelete}
                  className="w-full py-3.5 md:py-4 px-2 bg-[#ff2a5f] hover:bg-[#ff154d] border border-[#ff2a5f]/50 text-white rounded-[16px] md:rounded-[20px] font-black uppercase tracking-widest text-[12px] md:text-[13px] shadow-[0_0_30px_rgba(255,42,95,0.4)] hover:shadow-[0_0_40px_rgba(255,42,95,0.6)] hover:-translate-y-1 active:scale-95 transition-all outline-none"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal ดูรูปภาพ */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 dark:bg-[#060A13]/95 backdrop-blur-2xl animate-fade-in" onClick={() => setIsImageModalOpen(false)}>
          <div className="relative flex flex-col items-center justify-center max-w-5xl w-full animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsImageModalOpen(false)} className="fixed top-6 right-6 md:top-8 md:right-8 z-[110] w-14 h-14 bg-white/10 hover:bg-rose-500 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-90 shadow-[0_0_20px_rgba(0,0,0,0.3)]"><X size={28} /></button>
            <img src={viewImageUrl} alt="Full View" className="max-w-full max-h-[90vh] object-contain rounded-[20px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 dark:border-white/5" />
          </div>
        </div>
      )}

      {/* 5. Modal แจ้งเตือนสำเร็จ (Jesus Image - Clean & Soothing Edition) */}
      {successModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#060A13]/85 backdrop-blur-md animate-fade-in" onClick={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="relative w-[92vw] sm:w-full max-w-[390px] flex flex-col items-center animate-fade-in-up" onClick={e => e.stopPropagation()}>
            
            {/* Soft, calm background aura behind Jesus (steady, no flashing) */}
            <div className="absolute top-[20px] w-[260px] h-[260px] bg-emerald-500/20 dark:bg-emerald-500/25 rounded-full blur-[60px] pointer-events-none z-0" />

            {/* Jesus Image (Clean floating presentation) */}
            <div className="relative z-10 w-[240px] sm:w-[280px] -mb-10 drop-shadow-[0_15px_25px_rgba(0,0,0,0.3)] transition-transform duration-500 hover:scale-105 pointer-events-none">
              <img src="/jesus.png" alt="Jesus Blessing" className="w-full h-auto object-contain" />
            </div>

            {/* Main Card */}
            <div className="w-full bg-white dark:bg-[#0F172A] border border-emerald-500/30 dark:border-emerald-500/30 rounded-[32px] shadow-2xl p-6 pt-10 sm:p-7 sm:pt-11 flex flex-col items-center text-center relative z-20 overflow-hidden">
              
              {/* Soft Check Badge */}
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-sm">
                <CheckCircle size={24} strokeWidth={2.5} />
              </div>

              {/* Title & Message */}
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white mb-1 tracking-tight">
                {successModal.title}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-300 leading-relaxed mb-3">
                {successModal.message}
              </p>

              {/* Subtle shrinking countdown line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-[progress-shrink_2.5s_linear_forwards] w-full origin-left" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal ตั้งค่าการแจ้งเตือน LINE/Telegram */}
      <NotificationSettingsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        transactions={transactions}
        fmt={fmt}
        showSuccess={showSuccess}
      />
    </div>
  );
}

export default App;