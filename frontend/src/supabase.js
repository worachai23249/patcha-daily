import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ohgczlnqwwlnwlnawwnp.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oZ2N6bG5xd3dsbndsbmF3d25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMzczMzIsImV4cCI6MjEwNTgxMzMzMn0.OAzWlTgIJWCTx6nM38bavow8uVClFdMhNnXxNv0vQ6g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Push notification via OneSignal
export async function sendOneSignalPush(title, message) {
  try {
    const appId = "39818e43-6833-4b71-8add-d96a5df08fb8";
    const restApiKey = "os_v2_app_hgay4q3ignfxdcw53fvf34epxdfgfbu5c4veez4zdaxnqvtsqnrfzo3wynkvqtsmoxwzabytqwkgpirzav5yteswolq7qpv7qmnckqi";

    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + restApiKey,
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ["All"],
        contents: { en: message, th: message },
        headings: { en: title, th: title }
      })
    });
  } catch (e) {
    console.warn("OneSignal push error:", e);
  }
}

// ========== TRANSACTIONS ==========

export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
  return data || [];
}

export async function getNewTransactions(lastId) {
  if (!lastId) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gt('id', lastId)
    .order('id', { ascending: false });

  if (error) {
    console.error("Error fetching new transactions:", error);
    return [];
  }
  return data || [];
}

export async function addTransaction(tx) {
  const isArray = Array.isArray(tx);
  const rows = isArray ? tx : [tx];

  // หา ID สูงสุดปัจจุบันเพื่อป้องกัน sequence id ชนกันใน Postgres/Supabase
  let nextId = 1;
  try {
    const { data: maxRow } = await supabase
      .from('transactions')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    if (maxRow && maxRow.length > 0 && maxRow[0].id) {
      nextId = Number(maxRow[0].id) + 1;
    }
  } catch (e) {
    console.warn("Could not fetch max id:", e);
  }

  const formattedRows = rows.map((r, idx) => ({
    id: nextId + idx,
    transaction_date: r.transaction_date,
    type: r.type,
    description: r.description,
    amount: parseFloat(r.amount) || 0,
    note: r.note || '',
    image_url: r.image_url || null
  }));

  let { data, error } = await supabase
    .from('transactions')
    .insert(formattedRows)
    .select();

  // Retry fallback if race condition
  if (error && error.message && error.message.includes('transactions_pkey')) {
    const { data: allRows } = await supabase.from('transactions').select('id').order('id', { ascending: false }).limit(20);
    const maxVal = allRows && allRows.length > 0 ? Math.max(...allRows.map(i => Number(i.id) || 0)) : nextId + 10;
    const retryRows = rows.map((r, idx) => ({
      id: maxVal + 1 + idx,
      transaction_date: r.transaction_date,
      type: r.type,
      description: r.description,
      amount: parseFloat(r.amount) || 0,
      note: r.note || '',
      image_url: r.image_url || null
    }));
    const retryRes = await supabase.from('transactions').insert(retryRows).select();
    if (!retryRes.error) {
      data = retryRes.data;
      error = null;
    } else {
      error = retryRes.error;
    }
  }

  if (error) {
    console.error("Error adding transaction:", error);
    return { status: 'error', message: error.message };
  }

  // Trigger push notification for single adds
  if (!isArray) {
    const typeLabel = tx.type === 'INCOME' ? 'บันทึกรายรับ' : 'บันทึกรายจ่าย';
    const amountLabel = `฿${Number(tx.amount).toLocaleString('th-TH')}`;
    sendOneSignalPush(`Patcha Daily — ${typeLabel}สำเร็จ`, `${tx.description}: ${amountLabel}`);
  }

  return { status: 'success', message: isArray ? `นำเข้า ${rows.length} รายการสำเร็จ` : 'สร้างรายการใหม่เรียบร้อยแล้ว', data };
}

export async function updateTransaction(id, tx) {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      transaction_date: tx.transaction_date,
      type: tx.type,
      description: tx.description,
      amount: parseFloat(tx.amount) || 0,
      note: tx.note || '',
      image_url: tx.image_url !== undefined ? tx.image_url : null
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error("Error updating transaction:", error);
    return { status: 'error', message: error.message };
  }
  return { status: 'success', message: 'ข้อมูลรายการถูกอัปเดตเรียบร้อยแล้ว', data };
}

export async function deleteTransaction(id) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting transaction:", error);
    return { status: 'error', message: error.message };
  }
  return { status: 'success', message: 'ลบรายการเรียบร้อยแล้ว' };
}

// ========== CATEGORIES ==========

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('type', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data || [];
}

export async function addCategory(category) {
  const { data, error } = await supabase
    .from('categories')
    .insert([{
      name: category.name,
      type: category.type,
      color: category.color || '#3B82F6'
    }])
    .select();

  if (error) {
    console.error("Error adding category:", error);
    return { status: 'error', message: error.message };
  }
  return { status: 'success', message: 'สร้างหมวดหมู่ใหม่เรียบร้อยแล้ว', data };
}

export async function updateCategory(id, category) {
  const { data, error } = await supabase
    .from('categories')
    .update({
      name: category.name,
      type: category.type,
      color: category.color || '#3B82F6'
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error("Error updating category:", error);
    return { status: 'error', message: error.message };
  }
  return { status: 'success', message: 'แก้ไขหมวดหมู่เรียบร้อยแล้ว', data };
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting category:", error);
    return { status: 'error', message: error.message };
  }
  return { status: 'success', message: 'ลบหมวดหมู่เรียบร้อยแล้ว' };
}

// ========== AUTHENTICATION ==========

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '123456';

export async function login(email, password) {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('admin_email', email);
    return { status: 'success', message: 'เข้าสู่ระบบสำเร็จ' };
  }
  return { status: 'error', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
}

export async function checkAuth() {
  const isLogged = sessionStorage.getItem('isLoggedIn') === 'true';
  return { is_logged_in: isLogged };
}

export async function logout() {
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('admin_email');
  return { status: 'success' };
}
