export const AVAILABLE_FONTS = [
  {
    id: 'lmf-itim',
    name: 'ไอติม (LMF Itim)',
    family: "'Lmf_itim', cursive, sans-serif",
    category: 'handwriting',
    categoryName: 'ลายมือ',
    description: 'ฟอนต์ลายมือน่ารักเฉพาะตัว โดย ลายมือเฟิร์ส',
    tag: 'แนะนำ 💖',
    sampleTh: 'น่ารักสดใส บันทึกการเงิน ฿1,250',
    sampleEn: 'Patcha Daily Accounting'
  },
  {
    id: 'itim',
    name: 'Itim (Google Fonts)',
    family: "'Itim', cursive, sans-serif",
    category: 'handwriting',
    categoryName: 'ลายมือ',
    description: 'ฟอนต์ลายมือกลมมน สดใส ยอดนิยมจาก Google Fonts',
    tag: 'ยอดนิยม ✨',
    sampleTh: 'ความสุขของการออมเงินทุกวัน ฿2,500',
    sampleEn: 'Happy Saving Every Day'
  },
  {
    id: 'mali',
    name: 'Mali (มะลิ)',
    family: "'Mali', cursive, sans-serif",
    category: 'handwriting',
    categoryName: 'ลายมือ',
    description: 'ฟอนต์ลายมือน่ารักสไตล์เด็กนักเรียน สดใสเป็นกันเอง',
    tag: 'น่ารัก 🌸',
    sampleTh: 'บันทึกความสุขในทุกๆ วัน ฿3,400',
    sampleEn: 'Sweet & Friendly Daily Record'
  },
  {
    id: 'kodchasan',
    name: 'Kodchasan (คชสาร)',
    family: "'Kodchasan', cursive, sans-serif",
    category: 'handwriting',
    categoryName: 'ลายมือ',
    description: 'ฟอนต์ลายมือวัยรุ่น สดชื่น โค้งมน มีสไตล์เฉพาะตัว',
    tag: 'สดใส 🎀',
    sampleTh: 'การเงินเป็นเรื่องง่ายและสนุก ฿4,500',
    sampleEn: 'Cute & Playful Handwriting'
  },
  {
    id: 'charm',
    name: 'Charm (ชาร์ม)',
    family: "'Charm', cursive, sans-serif",
    category: 'handwriting',
    categoryName: 'ลายมือ',
    description: 'ฟอนต์ลายมือไทยประดิษฐ์ พลิ้วไหว อ่อนหวานละมุน',
    tag: 'อ่อนหวาน 🌷',
    sampleTh: 'รายรับ รายจ่าย และเงินออม ฿5,600',
    sampleEn: 'Elegant Script Lifestyle'
  },
  {
    id: 'kanit',
    name: 'Kanit (คณิต)',
    family: "'Kanit', sans-serif",
    category: 'modern',
    categoryName: 'โมเดิร์น',
    description: 'ฟอนต์ยอดนิยมอันดับ 1 ของไทย คมชัด ทันสมัย เป็นระเบียบ',
    tag: 'โมเดิร์น 💼',
    sampleTh: 'ระบบบริหารจัดการการเงินอัจฉริยะ ฿6,700',
    sampleEn: 'Modern Geometric Typography'
  },
  {
    id: 'mitr',
    name: 'Mitr (มิตร)',
    family: "'Mitr', sans-serif",
    category: 'modern',
    categoryName: 'โมเดิร์น',
    description: 'ฟอนต์สไตล์มินิมอล ไม่มีหัว สะอาดตา สบายตา',
    tag: 'มินิมอล 🌿',
    sampleTh: 'สรุปภาพรวมรายรับรายจ่าย ฿7,800',
    sampleEn: 'Minimal & Clean Aesthetics'
  },
  {
    id: 'pridi',
    name: 'Pridi (ปรีดี)',
    family: "'Pridi', serif",
    category: 'classic',
    categoryName: 'เรียบหรู',
    description: 'ฟอนต์สไตล์ Serif มีเชิง เรียบหรู คลาสสิก น่าเชื่อถือ',
    tag: 'เรียบหรู 👑',
    sampleTh: 'งบการเงินและรายงานประจำเดือน ฿8,900',
    sampleEn: 'Classic Serif Presentation'
  },
  {
    id: 'chonburi',
    name: 'Chonburi (ชลบุรี)',
    family: "'Chonburi', cursive, serif",
    category: 'display',
    categoryName: 'โดดเด่น',
    description: 'ฟอนต์หัวข้อสไตล์ดิสเพลย์ เส้นหนาสลับบาง โดดเด่นสะดุดตา',
    tag: 'สะดุดตา ⭐',
    sampleTh: 'PATCHA DAILY สรุปรายรับ ฿9,200',
    sampleEn: 'Bold & High Contrast Display'
  },
  {
    id: 'sarabun',
    name: 'Sarabun (สารบรรณ)',
    family: "'Sarabun', sans-serif",
    category: 'formal',
    categoryName: 'มาตรฐาน',
    description: 'ฟอนต์ทางการมาตรฐานของไทย อ่านง่าย ชัดเจนที่สุด',
    tag: 'ทางการ 📄',
    sampleTh: 'รายงานสรุปธุรกรรมทางการเงิน ฿10,000',
    sampleEn: 'Standard Official Typography'
  },
];

export const DEFAULT_FONT_ID = 'lmf-itim';

export function getSavedFont() {
  try {
    const savedId = localStorage.getItem('patcha_daily_font');
    if (savedId) {
      const found = AVAILABLE_FONTS.find(f => f.id === savedId);
      if (found) return found;
    }
  } catch {
    // ignore localStorage errors
  }
  return AVAILABLE_FONTS[0];
}

export function applyFont(fontId) {
  const font = AVAILABLE_FONTS.find(f => f.id === fontId) || AVAILABLE_FONTS[0];
  document.documentElement.style.setProperty('--app-font-family', font.family);
  try {
    localStorage.setItem('patcha_daily_font', font.id);
    localStorage.setItem('patcha_daily_font_family', font.family);
  } catch {
    // ignore localStorage errors
  }
  return font;
}
