import { supabase } from './supabaseClient';

export interface User {
  id: number;
  username: string;
  role: 'kasir' | 'manager' | 'owner';
  datastatus?: string;
}

export interface KategoriTransaksi {
  id: number;
  nama_kategori: string;
  tipe: 'pemasukan' | 'pengeluaran';
  is_active: boolean;
  created_at?: string;
  datastatus?: string;
}

export interface MasterTransaksi {
  id: number;
  tanggal: string; // YYYY-MM-DD
  shift: 'pagi' | 'siang' | 'malam' | 'operational';
  user_id: number;
  saldo_awal: number;
  saldo_akhir: number;
  created_at: string;
  created_user_id: number;
  edited_at?: string;
  edited_user_id?: number;
  datastatus?: string;
  // Join field
  user?: User;
}

export interface DetailTransaksi {
  id: number;
  master_transaksi_id: number;
  kategori_id: number;
  nominal: number;
  keterangan?: string;
  created_at: string;
  created_user_id: number;
  edited_at?: string;
  edited_user_id?: number;
  datastatus?: string;
}

// Backwards-compatible view type representing DetailTransaksi joined with MasterTransaksi
export interface TransaksiHarian {
  id: number; // detail ID
  master_transaksi_id: number;
  kategori_id: number;
  nominal: number;
  keterangan?: string;
  created_at: string;
  created_user_id: number;
  edited_at?: string;
  edited_user_id?: number;
  datastatus?: string;
  
  // Flattened master properties
  tanggal: string;
  shift: 'pagi' | 'siang' | 'malam' | 'operational';
  user_id: number; // master user_id
  saldo_akhir: number;
  
  // Joined fields
  master?: MasterTransaksi;
  kategori?: KategoriTransaksi;
  user?: User;
}

export interface LogHistory {
  id: number;
  transaksi_id: number;
  aksi: 'EDIT' | 'DELETE';
  user_id: number; // Who performed the edit/delete
  detail_sebelum: string; // JSON string of transaction before change
  detail_sesudah?: string; // JSON string of transaction after change (for edit)
  created_at: string;
  datastatus?: string;
  user?: User;
}

export interface GroupedCategoryReport {
  nama_kategori: string;
  tipe: 'pemasukan' | 'pengeluaran';
  total_nominal: number;
}

export interface MonthlyReportSummary {
  total_pemasukan: number;
  total_pengeluaran: number;
  laba_bersih: number;
  grouped_categories: GroupedCategoryReport[];
}

export interface SessionInfo {
  saldo_awal: number;
}

export interface MstStock {
  id: number;
  nama_barang: string;
  satuan: string;
  keterangan?: string;
  is_active: boolean;
  created_at?: string;
  datastatus?: string;
}

export interface StockOpnameDetail {
  id: number;
  opname_id: number;
  item_id: number;
  stock_freezer: number;
  stock_chiller: number;
  created_at?: string;
  datastatus?: string;
  // Join field
  item?: MstStock;
}

export interface StockOpname {
  id: number;
  tanggal: string; // DATE
  jam: string; // TIME
  checker: string;
  created_user_id?: number;
  status: 'draft' | 'selesai';
  created_at?: string;
  datastatus?: string;
  // Join fields
  details?: StockOpnameDetail[];
  user?: User;
}

// Connection check helpers
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch (e) {
    return false;
  }
};

export const isSupabaseConfigured = (): boolean => {
  return true;
};

// 1. User & Auth
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : require('crypto').webcrypto;
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const loginUser = async (username: string, password?: string): Promise<User | null> => {
  const cleanUsername = username.trim().toLowerCase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', cleanUsername)
    .neq('datastatus', 'DELETE')
    .maybeSingle();
  if (error || !data) return null;
  
  if (password !== undefined) {
    const hashed = await hashPassword(password);
    // Allow fallback to plain text password for backward compatibility during transition
    if (data.password !== password && data.password !== hashed) {
      return null;
    }
  }

  return {
    id: data.id,
    username: data.username,
    role: data.role
  };
};

// 1b. User CRUD (Owner Only)
export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .neq('datastatus', 'DELETE')
    .order('id', { ascending: true });
  if (error) {
    console.error('Supabase getUsers error:', error);
    return [];
  }
  return data || [];
};

export const createUser = async (
  username: string,
  role: 'kasir' | 'manager' | 'owner',
  password?: string
): Promise<User> => {
  const cleanUsername = username.trim().toLowerCase();
  const rawPassword = password && password.trim() ? password : cleanUsername;
  const passwordHash = await hashPassword(rawPassword);
  const { data, error } = await supabase
    .from('users')
    .insert([{ username: cleanUsername, role, password: passwordHash }])
    .select()
    .single();

  if (error) {
    console.error('Supabase createUser error:', error);
    throw new Error(error.message);
  }
  return data;
};

export const updateUserPassword = async (id: number, passwordHash: string): Promise<boolean> => {
  const { error } = await supabase
    .from('users')
    .update({ password: passwordHash })
    .eq('id', id);
  if (error) {
    console.error('Supabase updateUserPassword error:', error);
    throw new Error(error.message);
  }
  return true;
};

export const updateUser = async (
  id: number,
  updates: Partial<Omit<User, 'id'>>
): Promise<boolean> => {
  if (updates.username) {
    updates.username = updates.username.trim().toLowerCase();
  }
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id);
  if (error) {
    console.error('Supabase updateUser error:', error);
    throw new Error(error.message);
  }
  return true;
};

export const deleteUser = async (id: number): Promise<boolean> => {
  const { error } = await supabase
    .from('users')
    .update({ datastatus: 'DELETE' })
    .eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
  return true;
};

// 2. Kategori Transaksi CRUD
export const getCategories = async (): Promise<KategoriTransaksi[]> => {
  const { data, error } = await supabase
    .from('kategori_transaksi')
    .select('*')
    .neq('datastatus', 'DELETE')
    .order('id', { ascending: true });
  if (error) {
    console.error('Supabase getCategories error:', error);
    return [];
  }
  return data || [];
};

export const createCategory = async (
  nama_kategori: string,
  tipe: 'pemasukan' | 'pengeluaran',
  id?: number
): Promise<KategoriTransaksi> => {
  const payload: any = { nama_kategori, tipe };
  if (id !== undefined && id !== null) {
    payload.id = id;
  }

  const { data, error } = await supabase
    .from('kategori_transaksi')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Supabase createCategory error:', error);
    if (error.code === '23505') {
      throw new Error('ID Kategori sudah digunakan. Silakan gunakan ID yang unik.');
    }
    throw new Error(error.message);
  }
  return data;
};

export const updateCategory = async (
  oldId: number,
  updates: {
    id?: number;
    nama_kategori?: string;
    tipe?: 'pemasukan' | 'pengeluaran';
  }
): Promise<boolean> => {
  const { error } = await supabase
    .from('kategori_transaksi')
    .update(updates)
    .eq('id', oldId);
  if (error) {
    console.error('Supabase updateCategory error:', error);
    if (error.code === '23505') {
      throw new Error('ID Kategori sudah digunakan. Silakan gunakan ID yang unik.');
    }
    if (error.code === '23503') {
      throw new Error('Gagal mengubah ID Kategori karena kategori ini sudah digunakan dalam transaksi.');
    }
    throw new Error(error.message);
  }
  return true;
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  const { error } = await supabase
    .from('kategori_transaksi')
    .update({ datastatus: 'DELETE' })
    .eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
  return true;
};

// 3. Transaksi Harian CRUD (Mendukung Master-Detail)
export const getTransactions = async (): Promise<TransaksiHarian[]> => {
  const { data, error } = await supabase
    .from('detail_transaksi')
    .select(`
      *,
      master:master_transaksi(*, user:users!master_transaksi_user_id_fkey(*)),
      kategori:kategori_transaksi(*)
    `)
    .neq('datastatus', 'DELETE')
    .order('id', { ascending: false });
  
  if (error) {
    console.error('Supabase getTransactions error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    master_transaksi_id: d.master_transaksi_id,
    kategori_id: d.kategori_id,
    nominal: d.nominal,
    keterangan: d.keterangan,
    created_at: d.created_at,
    created_user_id: d.created_user_id,
    edited_at: d.edited_at,
    edited_user_id: d.edited_user_id,
    
    tanggal: d.master?.tanggal || '',
    shift: d.master?.shift || 'pagi',
    user_id: d.master?.user_id || 0,
    saldo_akhir: d.master?.saldo_akhir || 0,
    
    master: d.master,
    kategori: d.kategori,
    user: d.master?.user
  }));
};

export const createTransaction = async (
  tanggal: string,
  kategori_id: number,
  nominal: number,
  keterangan: string,
  user_id: number,
  shift: 'pagi' | 'siang' | 'malam' | 'operational',
  created_user_id: number
): Promise<TransaksiHarian | null> => {
  let masterId: number;
  const { data: existingMaster, error: mFindError } = await supabase
    .from('master_transaksi')
    .select('id')
    .eq('user_id', user_id)
    .eq('tanggal', tanggal)
    .eq('shift', shift)
    .maybeSingle();
    
  if (mFindError) throw mFindError;
  
  if (existingMaster) {
    masterId = existingMaster.id;
  } else {
    const { data: newMaster, error: mError } = await supabase
      .from('master_transaksi')
      .insert([{
        tanggal,
        shift,
        user_id,
        saldo_awal: 0,
        saldo_akhir: 0,
        created_at: new Date().toISOString(),
        created_user_id
      }])
      .select()
      .single();
    if (mError || !newMaster) throw mError;
    masterId = newMaster.id;
  }
  
  const { data: newDetail, error: dError } = await supabase
    .from('detail_transaksi')
    .insert([{
      master_transaksi_id: masterId,
      kategori_id,
      nominal,
      keterangan,
      created_at: new Date().toISOString(),
      created_user_id
    }])
    .select()
    .single();
  if (dError || !newDetail) throw dError;
  
  await recalculateMasterSaldoAkhir(masterId);
  
  const txs = await getTransactions();
  return txs.find(t => t.id === newDetail.id) || null;
};

export const updateTransaction = async (
  id: number,
  updates: Partial<Omit<TransaksiHarian, 'id' | 'created_at'>>,
  edited_user_id: number
): Promise<boolean> => {
  const { data: detail, error: detailErr } = await supabase
    .from('detail_transaksi')
    .select('*, master:master_transaksi(*)')
    .eq('id', id)
    .single();
  if (detailErr || !detail) return false;
  
  let newMasterId = detail.master_transaksi_id;
  const newDate = updates.tanggal !== undefined ? updates.tanggal : detail.master?.tanggal;
  const newShift = updates.shift !== undefined ? updates.shift : detail.master?.shift;
  const newUserId = updates.user_id !== undefined ? updates.user_id : detail.master?.user_id;
  
  if (newDate !== detail.master?.tanggal || newShift !== detail.master?.shift || newUserId !== detail.master?.user_id) {
    const { data: existingMaster } = await supabase
      .from('master_transaksi')
      .select('id')
      .eq('user_id', newUserId)
      .eq('tanggal', newDate)
      .eq('shift', newShift)
      .maybeSingle();
      
    if (existingMaster) {
      newMasterId = existingMaster.id;
    } else {
      const { data: newMaster, error: mError } = await supabase
        .from('master_transaksi')
        .insert([{
          tanggal: newDate,
          shift: newShift,
          user_id: newUserId,
          saldo_awal: 0,
          saldo_akhir: 0,
          created_at: new Date().toISOString(),
          created_user_id: edited_user_id
        }])
        .select()
        .single();
      if (mError || !newMaster) throw mError;
      newMasterId = newMaster.id;
    }
  }
  
  const detailUpdates = {
    master_transaksi_id: newMasterId,
    kategori_id: updates.kategori_id !== undefined ? updates.kategori_id : detail.kategori_id,
    nominal: updates.nominal !== undefined ? updates.nominal : detail.nominal,
    keterangan: updates.keterangan !== undefined ? updates.keterangan : detail.keterangan,
    edited_at: new Date().toISOString(),
    edited_user_id
  };
  
  const { error } = await supabase
    .from('detail_transaksi')
    .update(detailUpdates)
    .eq('id', id);
    
  if (error) throw error;
  
  const oldMasterId = detail.master_transaksi_id;
  await recalculateMasterSaldoAkhir(oldMasterId);
  if (newMasterId !== oldMasterId) {
    await recalculateMasterSaldoAkhir(newMasterId);
  }
  
  return true;
};

export const deleteTransaction = async (id: number): Promise<boolean> => {
  const { data: detail } = await supabase
    .from('detail_transaksi')
    .select('master_transaksi_id')
    .eq('id', id)
    .single();
  const masterId = detail?.master_transaksi_id;

  const { error } = await supabase
    .from('detail_transaksi')
    .update({ datastatus: 'DELETE' })
    .eq('id', id);
  
  if (error) {
    console.error('Supabase deleteTransaction error:', error);
    throw new Error(error.message);
  }
  
  if (masterId) {
    await recalculateMasterSaldoAkhir(masterId);
  }
  return true;
};

// 4. Laporan Rekapitulasi Bulanan & Grafik
export const getMonthlyReport = async (month: number, year: number): Promise<MonthlyReportSummary> => {
  const transactions = await getTransactions();
  const filtered = transactions.filter(t => {
    if (!t.tanggal) return false;
    const parts = t.tanggal.split('-'); // YYYY-MM-DD
    const txYear = parseInt(parts[0]);
    const txMonth = parseInt(parts[1]);
    return txYear === year && txMonth === month;
  });
  
  let total_pemasukan = 0;
  let total_pengeluaran = 0;
  const categoryMap: { [key: string]: GroupedCategoryReport } = {};
  
  filtered.forEach(t => {
    const isPemasukan = t.kategori?.tipe === 'pemasukan';
    if (isPemasukan) {
      total_pemasukan += t.nominal;
    } else {
      total_pengeluaran += t.nominal;
    }
    
    const catName = t.kategori?.nama_kategori || 'Kategori Tidak Diketahui';
    const catType = t.kategori?.tipe || 'pengeluaran';
    
    if (!categoryMap[catName]) {
      categoryMap[catName] = {
        nama_kategori: catName,
        tipe: catType,
        total_nominal: 0
      };
    }
    categoryMap[catName].total_nominal += t.nominal;
  });
  
  const grouped_categories = Object.values(categoryMap).sort((a, b) => b.total_nominal - a.total_nominal);
  const laba_bersih = total_pemasukan - total_pengeluaran;
  
  return {
    total_pemasukan,
    total_pengeluaran,
    laba_bersih,
    grouped_categories
  };
};

// 5. Log History / Audit Trail CRUD (Manager/Owner Only)
export const getLogHistory = async (): Promise<LogHistory[]> => {
  const { data, error } = await supabase
    .from('log_history')
    .select('*, user:users(*)')
    .order('id', { ascending: false });
  if (error) {
    console.error('Supabase log_history read failed:', error);
    return [];
  }
  return data || [];
};

export const createLogHistory = async (
  transaksi_id: number,
  aksi: 'EDIT' | 'DELETE',
  user_id: number,
  detail_sebelum: any,
  detail_sesudah?: any
): Promise<boolean> => {
  const logEntry = {
    transaksi_id,
    aksi,
    user_id,
    detail_sebelum: JSON.stringify(detail_sebelum),
    detail_sesudah: detail_sesudah ? JSON.stringify(detail_sesudah) : null,
    created_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('log_history')
    .insert([logEntry]);
  if (error) {
    console.error('Supabase log_history insert failed:', error);
    return false;
  }
  return true;
};

// 6. Saldo per Master Transaksi (Shift) Helpers
export const getLastSessionEndingBalance = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('master_transaksi')
    .select('saldo_akhir')
    .order('tanggal', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!error && data) {
    return Number(data.saldo_akhir);
  }
  return 0;
};

export const getSessionInfo = async (
  userId: number,
  tanggal: string,
  shift: 'pagi' | 'siang' | 'malam' | 'operational'
): Promise<SessionInfo> => {
  const { data, error } = await supabase
    .from('master_transaksi')
    .select('saldo_awal')
    .eq('user_id', userId)
    .eq('tanggal', tanggal)
    .eq('shift', shift)
    .maybeSingle();
  if (!error && data) {
    return {
      saldo_awal: Number(data.saldo_awal)
    };
  }
  const lastEndingBalance = await getLastSessionEndingBalance();
  return { saldo_awal: lastEndingBalance };
};

export const saveSessionInfo = async (
  userId: number,
  tanggal: string,
  shift: 'pagi' | 'siang' | 'malam' | 'operational',
  saldoAwal: number,
  currentUserId: number
): Promise<boolean> => {
  const { data: existing, error: findError } = await supabase
    .from('master_transaksi')
    .select('id')
    .eq('user_id', userId)
    .eq('tanggal', tanggal)
    .eq('shift', shift)
    .maybeSingle();
    
  if (findError) throw findError;
  
  let masterId: number;
  if (existing) {
    masterId = existing.id;
    const { error: updateError } = await supabase
      .from('master_transaksi')
      .update({
        saldo_awal: saldoAwal,
        edited_at: new Date().toISOString(),
        edited_user_id: currentUserId
      })
      .eq('id', masterId);
    if (updateError) throw updateError;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('master_transaksi')
      .insert([{
        tanggal,
        shift,
        user_id: userId,
        saldo_awal: saldoAwal,
        saldo_akhir: saldoAwal,
        created_at: new Date().toISOString(),
        created_user_id: currentUserId
      }])
      .select('id')
      .single();
    if (insertError || !inserted) throw insertError || new Error('Insert master failed');
    masterId = inserted.id;
  }
  
  await recalculateMasterSaldoAkhir(masterId);
  return true;
};

// 7. Auto-recalculation helper for Master Saldo Akhir
export const recalculateMasterSaldoAkhir = async (masterId: number): Promise<number> => {
  const { data: master, error: mErr } = await supabase
    .from('master_transaksi')
    .select('saldo_awal')
    .eq('id', masterId)
    .single();
  if (mErr || !master) return 0;
  
  const saldoAwal = Number(master.saldo_awal);
  
  const { data: details, error: dErr } = await supabase
    .from('detail_transaksi')
    .select('nominal, kategori:kategori_transaksi(tipe)')
    .eq('master_transaksi_id', masterId);
    
  if (dErr) return saldoAwal;
  
  let totalPemasukan = 0;
  let totalPengeluaran = 0;
  
  (details || []).forEach((d: any) => {
    if (d.kategori?.tipe === 'pemasukan') {
      totalPemasukan += Number(d.nominal);
    } else {
      totalPengeluaran += Number(d.nominal);
    }
  });
  
  const saldoAkhir = saldoAwal + totalPemasukan - totalPengeluaran;
  
  await supabase
    .from('master_transaksi')
    .update({ saldo_akhir: saldoAkhir })
    .eq('id', masterId);
    
  return saldoAkhir;
};

// 8. Transaksi Detail (trx_dtl) CRUD & Recalculate
export interface TrxDtl {
  id: number;
  kategori_id: number;
  nominal: number;
  keterangan?: string;
  tanggal: string; // YYYY-MM-DD
  saldo_awal: number;
  saldo_akhir: number;
  created_at: string;
  created_user_id?: number;
  edited_at?: string;
  edited_user_id?: number;
  
  // Joined fields
  kategori?: KategoriTransaksi;
  user?: User;
}

export const getTrxDetails = async (): Promise<TrxDtl[]> => {
  const { data, error } = await supabase
    .from('trx_dtl')
    .select(`
      *,
      kategori:kategori_transaksi(*)
    `)
    .neq('datastatus', 'DELETE')
    .order('tanggal', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    console.error('Supabase getTrxDetails error:', error);
    return [];
  }

  // Map users manually to avoid missing foreign key issues
  const users = await getUsers();

  return (data || []).map((d: any) => ({
    id: d.id,
    kategori_id: d.kategori_id,
    nominal: Number(d.nominal),
    keterangan: d.keterangan || '',
    tanggal: d.tanggal || '',
    saldo_awal: Number(d.saldo_awal || 0),
    saldo_akhir: Number(d.saldo_akhir || 0),
    created_at: d.created_at,
    created_user_id: d.created_user_id,
    edited_at: d.edited_at,
    edited_user_id: d.edited_user_id,
    
    kategori: d.kategori,
    user: users.find(u => u.id === d.created_user_id)
  }));
};

export const createTrxDetail = async (
  tanggal: string,
  kategori_id: number,
  nominal: number,
  keterangan: string,
  created_user_id: number
): Promise<TrxDtl | null> => {
  const { data: newRow, error } = await supabase
    .from('trx_dtl')
    .insert([{
      tanggal,
      kategori_id,
      nominal,
      keterangan,
      created_user_id,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error || !newRow) {
    console.error('Supabase createTrxDetail error:', error);
    throw new Error(error ? error.message : 'Gagal membuat transaksi baru');
  }

  await recalculateTrxDtlBalances();

  const all = await getTrxDetails();
  return all.find(x => x.id === newRow.id) || null;
};

export const updateTrxDetail = async (
  id: number,
  updates: {
    tanggal?: string;
    kategori_id?: number;
    nominal?: number;
    keterangan?: string;
  },
  edited_user_id: number
): Promise<boolean> => {
  const { error } = await supabase
    .from('trx_dtl')
    .update({
      ...updates,
      edited_user_id,
      edited_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Supabase updateTrxDetail error:', error);
    throw new Error(error.message);
  }

  await recalculateTrxDtlBalances();
  return true;
};

export const deleteTrxDetail = async (id: number): Promise<boolean> => {
  const { error } = await supabase
    .from('trx_dtl')
    .update({ datastatus: 'DELETE' })
    .eq('id', id);

  if (error) {
    console.error('Supabase deleteTrxDetail error:', error);
    throw new Error(error.message);
  }

  await recalculateTrxDtlBalances();
  return true;
};

export const recalculateTrxDtlBalances = async (): Promise<void> => {
  const { data: rows, error } = await supabase
    .from('trx_dtl')
    .select('*, kategori:kategori_transaksi(tipe)')
    .neq('datastatus', 'DELETE')
    .order('tanggal', { ascending: true })
    .order('id', { ascending: true });

  if (error || !rows) {
    console.error('Supabase recalculateTrxDtlBalances select error:', error);
    return;
  }

  let runningBalance = 0;
  for (const r of rows) {
    const nominal = Number(r.nominal) || 0;
    const isPemasukan = r.kategori?.tipe === 'pemasukan';
    const saldoAwal = runningBalance;
    const saldoAkhir = isPemasukan ? (saldoAwal + nominal) : (saldoAwal - nominal);
    runningBalance = saldoAkhir;

    if (Number(r.saldo_awal || 0) !== saldoAwal || Number(r.saldo_akhir || 0) !== saldoAkhir) {
      const { error: updErr } = await supabase
        .from('trx_dtl')
        .update({
          saldo_awal: saldoAwal,
          saldo_akhir: saldoAkhir
        })
        .eq('id', r.id);
      
      if (updErr) {
        console.error(`Error updating saldo_awal/akhir for row ID ${r.id}:`, updErr);
      }
    }
  }
};

// 8. Master Barang Persediaan (mst_stocks) CRUD
export const getStockItems = async (): Promise<MstStock[]> => {
  const { data, error } = await supabase
    .from('mst_stocks')
    .select('*')
    .neq('datastatus', 'DELETE')
    .order('id', { ascending: true });
  if (error) {
    console.error('Supabase getStockItems error:', error);
    return [];
  }
  return data || [];
};

export const createStockItem = async (
  nama_barang: string,
  satuan: string,
  keterangan?: string
): Promise<MstStock> => {
  const { data, error } = await supabase
    .from('mst_stocks')
    .insert([{ nama_barang, satuan, keterangan }])
    .select()
    .single();

  if (error) {
    console.error('Supabase createStockItem error:', error);
    if (error.code === '23505') {
      throw new Error('Nama barang sudah terdaftar. Silakan gunakan nama yang unik.');
    }
    throw new Error(error.message);
  }
  return data;
};

export const updateStockItem = async (
  id: number,
  updates: {
    nama_barang?: string;
    satuan?: string;
    keterangan?: string;
    is_active?: boolean;
  }
): Promise<boolean> => {
  const { error } = await supabase
    .from('mst_stocks')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Supabase updateStockItem error:', error);
    if (error.code === '23505') {
      throw new Error('Nama barang sudah terdaftar. Silakan gunakan nama yang unik.');
    }
    throw new Error(error.message);
  }
  return true;
};

export const deleteStockItem = async (id: number): Promise<boolean> => {
  const { error } = await supabase
    .from('mst_stocks')
    .update({ datastatus: 'DELETE' })
    .eq('id', id);

  if (error) {
    console.error('Supabase deleteStockItem error:', error);
    throw new Error(error.message);
  }
  return true;
};

// 9. Sesi Stock Opname Harian CRUD
export const getStockOpnames = async (): Promise<StockOpname[]> => {
  const { data, error } = await supabase
    .from('stock_opname')
    .select(`
      *,
      user:users(*),
      details:stock_opname_details(
        *,
        item:mst_stocks(*)
      )
    `)
    .neq('datastatus', 'DELETE')
    .order('tanggal', { ascending: false })
    .order('jam', { ascending: false });

  if (error) {
    console.error('Supabase getStockOpnames error:', error);
    return [];
  }
  return data || [];
};

export const createStockOpname = async (
  tanggal: string,
  jam: string,
  checker: string,
  created_user_id: number,
  status: 'draft' | 'selesai',
  details: Array<{ item_id: number; stock_freezer: number; stock_chiller: number }>
): Promise<boolean> => {
  // 1. Insert Stock Opname Header
  const { data: header, error: hErr } = await supabase
    .from('stock_opname')
    .insert([{ tanggal, jam, checker, created_user_id, status }])
    .select()
    .single();

  if (hErr || !header) {
    console.error('Supabase createStockOpname header error:', hErr);
    throw new Error(hErr ? hErr.message : 'Gagal membuat sesi stock opname');
  }

  // 2. Prepare Details Payload
  const detailsPayload = details.map(d => ({
    opname_id: header.id,
    item_id: d.item_id,
    stock_freezer: d.stock_freezer,
    stock_chiller: d.stock_chiller
  }));

  // 3. Insert Details
  const { error: dErr } = await supabase
    .from('stock_opname_details')
    .insert(detailsPayload);

  if (dErr) {
    console.error('Supabase createStockOpname details error:', dErr);
    // Attempt to rollback by deleting the header
    await supabase.from('stock_opname').delete().eq('id', header.id);
    throw new Error(dErr.message);
  }

  return true;
};

export const updateStockOpname = async (
  id: number,
  updates: {
    tanggal?: string;
    jam?: string;
    checker?: string;
    status?: 'draft' | 'selesai';
  },
  details?: Array<{ item_id: number; stock_freezer: number; stock_chiller: number }>
): Promise<boolean> => {
  // 1. Check if the session is draft
  const { data: current, error: checkErr } = await supabase
    .from('stock_opname')
    .select('status')
    .eq('id', id)
    .single();

  if (checkErr || !current) {
    throw new Error('Sesi stock opname tidak ditemukan.');
  }

  if (current.status === 'selesai') {
    throw new Error('Sesi stock opname yang sudah selesai tidak dapat diubah.');
  }

  // 2. Update stock_opname header
  const { error: hErr } = await supabase
    .from('stock_opname')
    .update(updates)
    .eq('id', id);

  if (hErr) {
    console.error('Supabase updateStockOpname header error:', hErr);
    throw new Error(hErr.message);
  }

  // 3. Update details if provided
  if (details) {
    // Delete existing details first
    const { error: dDelErr } = await supabase
      .from('stock_opname_details')
      .delete()
      .eq('opname_id', id);

    if (dDelErr) {
      console.error('Supabase updateStockOpname delete details error:', dDelErr);
      throw new Error(dDelErr.message);
    }

    // Insert new details
    const detailsPayload = details.map(d => ({
      opname_id: id,
      item_id: d.item_id,
      stock_freezer: d.stock_freezer,
      stock_chiller: d.stock_chiller
    }));

    const { error: dInsErr } = await supabase
      .from('stock_opname_details')
      .insert(detailsPayload);

    if (dInsErr) {
      console.error('Supabase updateStockOpname insert details error:', dInsErr);
      throw new Error(dInsErr.message);
    }
  }

  return true;
};

export const deleteStockOpname = async (id: number): Promise<boolean> => {
  const { error } = await supabase
    .from('stock_opname')
    .update({ datastatus: 'DELETE' })
    .eq('id', id);

  if (error) {
    console.error('Supabase deleteStockOpname error:', error);
    throw new Error(error.message);
  }
  return true;
};
