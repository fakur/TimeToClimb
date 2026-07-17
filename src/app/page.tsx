'use client';

import React, { useState, useEffect } from 'react';
import {
  isSupabaseConfigured,
  checkSupabaseConnection,
  loginUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlyReport,
  getLogHistory,
  createLogHistory,
  getSessionInfo,
  saveSessionInfo,
  getTrxDetails,
  createTrxDetail,
  updateTrxDetail,
  deleteTrxDetail,
  getStockItems,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  getStockOpnames,
  createStockOpname,
  updateStockOpname,
  deleteStockOpname,
  User,
  KategoriTransaksi,
  TransaksiHarian,
  MonthlyReportSummary,
  LogHistory,
  TrxDtl,
  MstStock,
  StockOpname,
  StockOpnameDetail
} from '@/lib/db';

export default function Home() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Main Data States
  const [categories, setCategories] = useState<KategoriTransaksi[]>([]);
  const [transactions, setTransactions] = useState<TransaksiHarian[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportSummary | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transaction' | 'history' | 'transaction_dtl' | 'categories' | 'reports' | 'users' | 'stock_opname' | 'stock_items'>('dashboard');
  const [activeDropdown, setActiveDropdown] = useState<'reports' | 'master' | null>(null);

  // Connection Mode Indicator
  const [dbMode, setDbMode] = useState<'Supabase (Online)' | 'Supabase (Offline)'>('Supabase (Online)');

  // Main Data States untuk Transaksi (trx_dtl)
  const [trxDetails, setTrxDetails] = useState<TrxDtl[]>([]);

  // Main Data States untuk Stock Opname & Master Barang
  const [stockItems, setStockItems] = useState<MstStock[]>([]);
  const [stockOpnames, setStockOpnames] = useState<StockOpname[]>([]);

  // Form States (Transaksi - trx_dtl)
  const [dtlTanggal, setDtlTanggal] = useState<string>('');
  const [dtlCategory, setDtlCategory] = useState<string>('');
  const [dtlNominal, setDtlNominal] = useState<string>('');
  const [dtlKeterangan, setDtlKeterangan] = useState<string>('');
  const [dtlError, setDtlError] = useState<string>('');
  const [dtlSuccess, setDtlSuccess] = useState<string>('');
  const [editingDtl, setEditingDtl] = useState<TrxDtl | null>(null);
  const [isTrxDtlModalOpen, setIsTrxDtlModalOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isClosingTxModalOpen, setIsClosingTxModalOpen] = useState<boolean>(false);

  // Modal States untuk Master Barang (mst_stocks)
  const [isStockItemModalOpen, setIsStockItemModalOpen] = useState<boolean>(false);
  const [editingStockItem, setEditingStockItem] = useState<MstStock | null>(null);
  const [stockItemName, setStockItemName] = useState<string>('');
  const [stockItemUnit, setStockItemUnit] = useState<string>('');
  const [stockItemDesc, setStockItemDesc] = useState<string>('');
  const [stockItemError, setStockItemError] = useState<string>('');

  // Modal States untuk Stock Opname Harian
  const [isStockOpnameModalOpen, setIsStockOpnameModalOpen] = useState<boolean>(false);
  const [editingStockOpname, setEditingStockOpname] = useState<StockOpname | null>(null);
  const [printOpname, setPrintOpname] = useState<StockOpname | null>(null);
  const [opnameDate, setOpnameDate] = useState<string>('');
  const [opnameTime, setOpnameTime] = useState<string>('');
  const [opnameChecker, setOpnameChecker] = useState<string>('');
  const [opnameCounts, setOpnameCounts] = useState<Record<number, { freezer: string; chiller: string }>>({});
  const [opnameError, setOpnameError] = useState<string>('');
  const [expandedOpnameId, setExpandedOpnameId] = useState<number | null>(null);
  const [filterOpnameStart, setFilterOpnameStart] = useState<string>('');
  const [filterOpnameEnd, setFilterOpnameEnd] = useState<string>('');

  // Custom Confirmation Modal States
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [confirmTitle, setConfirmTitle] = useState<string>('');
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void | Promise<void>) | null>(null);

  // Filter States (Transaksi - trx_dtl)
  const [filterDtlStart, setFilterDtlStart] = useState<string>('');
  const [filterDtlEnd, setFilterDtlEnd] = useState<string>('');
  const [filterDtlCategory, setFilterDtlCategory] = useState<string>('');

  // Form States (New Transaction)
  const [txCategory, setTxCategory] = useState<string>('');
  const [txNominal, setTxNominal] = useState<string>('');
  const [txDate, setTxDate] = useState<string>('');
  const [txShift, setTxShift] = useState<'pagi' | 'siang' | 'malam' | 'operational'>('pagi');
  const [txKeterangan, setTxKeterangan] = useState<string>('');
  const [txError, setTxError] = useState<string>('');
  const [txSuccess, setTxSuccess] = useState<string>('');
  const [txUserId, setTxUserId] = useState<string>('');
  const [txSaldoAwal, setTxSaldoAwal] = useState<string>('0');

  // Form States (New Category)
  const [catName, setCatName] = useState<string>('');
  const [catType, setCatType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [catError, setCatError] = useState<string>('');
  const [catIdInput, setCatIdInput] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<KategoriTransaksi | null>(null);

  // Filter States (History)
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [expandedCategoriesGroup, setExpandedCategoriesGroup] = useState<Record<string, boolean>>({
    pemasukan: true,
    pengeluaran: true
  });

  // Filter States (Report)
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  // Edit Transaction State (Owner Only)
  const [editingTx, setEditingTx] = useState<TransaksiHarian | null>(null);
  const [editNominal, setEditNominal] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editShift, setEditShift] = useState<'pagi' | 'siang' | 'malam' | 'operational'>('pagi');
  const [editKeterangan, setEditKeterangan] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');

  // General Loading UI
  const [loading, setLoading] = useState(false);

  // User Management State (Owner Only)
  const [users, setUsers] = useState<User[]>([]);
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState<'kasir' | 'manager' | 'owner'>('kasir');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserRole, setEditUserRole] = useState<'kasir' | 'manager' | 'owner'>('kasir');

  // Log History State
  const [logHistory, setLogHistory] = useState<LogHistory[]>([]);

  // Get Today's Date String in YYYY-MM-DD format
  const getTodayDateString = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const todayStr = getTodayDateString();

  // Check DB connection mode and load initial user context
  useEffect(() => {
    const verifyConnection = async () => {
      const isAlive = await checkSupabaseConnection();
      setDbMode(isAlive ? 'Supabase (Online)' : 'Supabase (Offline)');
    };
    verifyConnection();

    // Check if user session is saved in localStorage
    const savedUser = localStorage.getItem('tb_current_session');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch user list (Loaded for everyone to populate dropdowns)
  const loadUsersData = async () => {
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (e) {
      console.error('Error loading users:', e);
    }
  };

  // Fetch log history
  const loadLogHistoryData = async () => {
    try {
      const logs = await getLogHistory();
      setLogHistory(logs);
    } catch (e) {
      console.error('Error loading logs:', e);
    }
  };

  // Fetch core data once user is authenticated
  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await checkSupabaseConnection();
      const fetchedCats = await getCategories();
      const fetchedTxs = await getTransactions();
      const fetchedDetails = await getTrxDetails();
      const fetchedStockItems = await getStockItems();
      const fetchedStockOpnames = await getStockOpnames();

      setCategories(fetchedCats);
      setTransactions(fetchedTxs);
      setTrxDetails(fetchedDetails);
      setStockItems(fetchedStockItems);
      setStockOpnames(fetchedStockOpnames);

      // Load default category selection
      if (fetchedCats.length > 0) {
        setTxCategory(String(fetchedCats[0].id));
        setDtlCategory(String(fetchedCats[0].id));
      }

      // Load users list
      await loadUsersData();

      // Load logs
      await loadLogHistoryData();
    } catch (e) {
      console.error('Error loading app data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Load Monthly Report when Month/Year filter changes
  useEffect(() => {
    const loadReport = async () => {
      if (!currentUser) return;
      await checkSupabaseConnection();
      const report = await getMonthlyReport(reportMonth, reportYear);
      setMonthlyReport(report);
    };
    loadReport();
  }, [reportMonth, reportYear, transactions, currentUser]);

  // Set default form date & user based on role
  useEffect(() => {
    if (currentUser) {
      setTxDate(todayStr);
      setTxUserId(String(currentUser.id));
      setDtlTanggal(todayStr);
    }
  }, [currentUser, activeTab]);

  // Auto-reload categories when entering category tab
  useEffect(() => {
    if (activeTab === 'categories' && currentUser) {
      const reloadCategories = async () => {
        try {
          const fetchedCats = await getCategories();
          setCategories(fetchedCats);
        } catch (e) {
          console.error(e);
        }
      };
      reloadCategories();
    }
  }, [activeTab, currentUser]);

  // Auto-reload trxDetails when entering transaction_dtl tab
  useEffect(() => {
    if (activeTab === 'transaction_dtl' && currentUser) {
      const reloadTrxDetails = async () => {
        try {
          const fetchedDetails = await getTrxDetails();
          setTrxDetails(fetchedDetails);
        } catch (e) {
          console.error(e);
        }
      };
      reloadTrxDetails();
    }
  }, [activeTab, currentUser]);

  // Auto-reload stock items when entering stock_items tab
  useEffect(() => {
    if (activeTab === 'stock_items' && currentUser) {
      const reloadStockItems = async () => {
        try {
          const fetchedItems = await getStockItems();
          setStockItems(fetchedItems);
        } catch (e) {
          console.error(e);
        }
      };
      reloadStockItems();
    }
  }, [activeTab, currentUser]);

  // Auto-reload stock opnames when entering stock_opname tab
  useEffect(() => {
    if (activeTab === 'stock_opname' && currentUser) {
      const reloadStockOpnames = async () => {
        try {
          const fetchedOpnames = await getStockOpnames();
          setStockOpnames(fetchedOpnames);
        } catch (e) {
          console.error(e);
        }
      };
      reloadStockOpnames();
    }
  }, [activeTab, currentUser]);

  // Redirect if unauthorized tab is active for current role
  useEffect(() => {
    if (currentUser) {
      const isKasir = currentUser.role === 'kasir';
      const isManager = currentUser.role === 'manager';

      if (isKasir && (activeTab === 'categories' || activeTab === 'reports' || activeTab === 'users' || activeTab === 'stock_items')) {
        setActiveTab('dashboard');
      } else if (isManager && (activeTab === 'users')) {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser, activeTab]);

  // Safeguard: reset shift ke pagi jika kasir login dan shift bernilai 'operational'
  useEffect(() => {
    if (currentUser && currentUser.role !== 'owner' && txShift === 'operational') {
      setTxShift('pagi');
    }
  }, [currentUser, txShift]);

  // Sesi Shift Helper Functions (Saldo Awal - Database backed)
  const loadSessionInfo = async (userId: number, dateStr: string, shift: 'pagi' | 'siang' | 'malam' | 'operational') => {
    try {
      const info = await getSessionInfo(userId, dateStr, shift);
      setTxSaldoAwal(String(info.saldo_awal));
    } catch (e) {
      console.error(e);
    }
  };

  // Sync Sesi Shift Info when User/Date/Shift selection changes
  useEffect(() => {
    if (txUserId && txDate && txShift) {
      loadSessionInfo(parseInt(txUserId), txDate, txShift);
    }
  }, [txUserId, txDate, txShift]);

  // Permission Check Helpers (With new 2-hour window rule for Cashier)
  const canModifyTx = (tx: TransaksiHarian) => {
    if (!currentUser) return false;
    if (currentUser.role === 'manager' || currentUser.role === 'owner') return true;

    // Cashier: can edit/delete if it is their own transaction AND created within 2 hours
    if (currentUser.role === 'kasir' && tx.user_id === currentUser.id && tx.created_at) {
      const ageInMs = Date.now() - new Date(tx.created_at).getTime();
      const ageInHours = ageInMs / (1000 * 60 * 60);
      return ageInHours < 2;
    }
    return false;
  };

  const canModifyGroup = (group: any) => {
    if (!currentUser) return false;
    if (currentUser.role === 'manager' || currentUser.role === 'owner') return true;

    // Cashier: can edit (redirect to individual list) if it is their own group
    return currentUser.role === 'kasir' && group.user_id === currentUser.id;
  };

  const canDeleteGroup = (group: any) => {
    if (!currentUser) return false;
    if (currentUser.role === 'manager' || currentUser.role === 'owner') return true;

    // Cashier: can delete group if it is their own AND all transactions inside are modifiable (under 2 hours)
    if (currentUser.role === 'kasir' && group.user_id === currentUser.id) {
      return group.transactions.every((tx: TransaksiHarian) => canModifyTx(tx));
    }
    return false;
  };

  // Date and Time formatter helper
  const formatDateTime = (tanggalStr: string, createdAtStr?: string) => {
    if (!tanggalStr) return '-';

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const dateObj = new Date(tanggalStr);
    const dayName = days[dateObj.getDay()];
    const dateParts = tanggalStr.split('-'); // YYYY-MM-DD
    const displayDate = dateParts.length === 3
      ? `${dateParts[2]} ${months[parseInt(dateParts[1]) - 1]} ${dateParts[0]}`
      : tanggalStr;

    let timeStr = '';
    if (createdAtStr) {
      const timeObj = new Date(createdAtStr);
      const hours = String(timeObj.getHours()).padStart(2, '0');
      const minutes = String(timeObj.getMinutes()).padStart(2, '0');
      timeStr = ` (${hours}:${minutes})`;
    }

    return `${dayName}, ${displayDate}${timeStr}`;
  };

  const handleDeleteGroup = (group: any) => {
    if (!canDeleteGroup(group)) {
      alert('Anda tidak memiliki wewenang untuk menghapus riwayat transaksi ini.');
      return;
    }
    showConfirm('Hapus Semua Transaksi Sesi', `Apakah Anda yakin ingin menghapus semua (${group.transactions.length}) transaksi untuk ${group.username} pada tanggal ${group.tanggal}?`, async () => {
      try {
        setLoading(true);
        for (const tx of group.transactions) {
          // Log delete audit
          await createLogHistory(
            tx.id,
            'DELETE',
            currentUser?.id || 1,
            tx
          );
          await deleteTransaction(tx.id);
        }
        const fetchedTxs = await getTransactions();
        setTransactions(fetchedTxs);
        await loadLogHistoryData();
        alert('Seluruh transaksi dalam sesi berhasil dihapus!');
      } catch (err: any) {
        alert(`Gagal menghapus riwayat transaksi: ${err.message}`);
      } finally {
        setLoading(false);
      }
    });
  };

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!usernameInput.trim()) {
      setLoginError('Nama pengguna harus diisi');
      return;
    }
    if (!passwordInput.trim()) {
      setLoginError('Kata sandi harus diisi');
      return;
    }

    const user = await loginUser(usernameInput, passwordInput);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('tb_current_session', JSON.stringify(user));
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setLoginError('Nama pengguna atau kata sandi salah.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tb_current_session');
  };

  // Dev Quick-Switch Role
  const handleDevRoleSwitch = async (role: 'kasir' | 'manager' | 'owner') => {
    const mockUsernames = {
      kasir: 'budi',
      manager: 'rudi',
      owner: 'anton'
    };
    const user = await loginUser(mockUsernames[role]);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('tb_current_session', JSON.stringify(user));
    }
  };

  // Create Transaction Handler
  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError('');
    setTxSuccess('');

    const nominalNum = parseFloat(txNominal);
    if (isNaN(nominalNum) || nominalNum <= 0) {
      setTxError('Nominal harus berupa angka valid di atas 0');
      return;
    }

    if (!txCategory) {
      setTxError('Kategori harus dipilih');
      return;
    }

    if (!txDate) {
      setTxError('Tanggal harus diisi');
      return;
    }

    // Role business rule: Cashier date and user must be locked to current cashier
    const finalDate = currentUser?.role === 'kasir' ? todayStr : txDate;
    const finalUserId = currentUser?.role === 'kasir' ? (currentUser.id) : (parseInt(txUserId) || currentUser?.id || 1);

    try {
      setLoading(true);

      // Auto-save session info (saldo awal) for the active shift
      const valSaldo = parseFloat(txSaldoAwal) || 0;
      await saveSessionInfo(finalUserId, finalDate, txShift, valSaldo, currentUser?.id || 1);

      const newTx = await createTransaction(
        finalDate,
        parseInt(txCategory),
        nominalNum,
        txKeterangan,
        finalUserId,
        txShift,
        currentUser?.id || 1
      );

      if (newTx) {
        alert('Transaksi berhasil dicatat!');
        setTxNominal('');
        setTxKeterangan('');
        setIsClosingTxModalOpen(false);
        // Reload transactions
        const fetchedTxs = await getTransactions();
        setTransactions(fetchedTxs);
      }
    } catch (err: any) {
      setTxError(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  // Create or Update Category Handler (Owner Only)
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');

    if (currentUser?.role !== 'owner') {
      setCatError('Hanya Owner yang memiliki wewenang mengelola jenis transaksi.');
      return;
    }

    if (!catName.trim()) {
      setCatError('Nama jenis transaksi tidak boleh kosong');
      return;
    }

    const customId = catIdInput.trim() ? parseInt(catIdInput.trim()) : undefined;
    if (customId !== undefined && (isNaN(customId) || customId <= 0)) {
      setCatError('ID harus berupa angka bulat positif');
      return;
    }

    try {
      setLoading(true);
      if (editingCategory) {
        // Update mode - build dynamic updates to fix uniqueness check when name is unchanged
        const updates: any = {};
        if (catName.trim() !== editingCategory.nama_kategori) {
          updates.nama_kategori = catName.trim();
        }
        if (customId !== undefined && customId !== editingCategory.id) {
          updates.id = customId;
        }
        if (catType !== editingCategory.tipe) {
          updates.tipe = catType;
        }

        // Only call update if there is actually a change
        if (Object.keys(updates).length > 0) {
          await updateCategory(editingCategory.id, updates);
        }
        alert('Jenis transaksi berhasil diperbarui!');
        setEditingCategory(null);
      } else {
        // Create mode
        await createCategory(catName.trim(), catType, customId);
        alert('Jenis transaksi berhasil ditambahkan!');
      }

      // Reset form and close modal
      setCatName('');
      setCatIdInput('');
      setCatError('');
      setIsCategoryModalOpen(false);

      // Reload categories
      const fetchedCats = await getCategories();
      setCategories(fetchedCats);
      if (fetchedCats.length > 0) {
        setTxCategory(String(fetchedCats[0].id));
      }
    } catch (err: any) {
      setCatError(err.message || 'Gagal menyimpan jenis transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatIdInput('');
    setCatError('');
    setIsCategoryModalOpen(false);
  };

  const showConfirm = (title: string, message: string, action: () => void | Promise<void>) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setOnConfirmAction(() => action);
    setIsConfirmOpen(true);
  };

  // Delete Category Handler (Owner Only)
  const handleDeleteCategory = (id: number) => {
    if (currentUser?.role !== 'owner') {
      alert('Hanya Owner yang memiliki wewenang mengelola jenis transaksi.');
      return;
    }

    showConfirm('Hapus Jenis Transaksi', 'Apakah Anda yakin ingin menghapus jenis transaksi ini?', async () => {
      try {
        setLoading(true);
        await deleteCategory(id);
        const fetchedCats = await getCategories();
        setCategories(fetchedCats);
        // reset selection if needed
        if (fetchedCats.length > 0) {
          setTxCategory(String(fetchedCats[0].id));
        } else {
          setTxCategory('');
        }
        alert('Jenis transaksi berhasil dihapus!');
      } catch (err: any) {
        alert(`Gagal menghapus: ${err.message}`);
      } finally {
        setLoading(false);
      }
    });
  };

  // --- TRANSAKSI DETAIL (trx_dtl) CRUD HANDLERS ---

  const handleCreateOrUpdateTrxDtl = async (e: React.FormEvent) => {
    e.preventDefault();
    setDtlError('');
    setDtlSuccess('');

    const nominalNum = parseFloat(dtlNominal);
    if (isNaN(nominalNum) || nominalNum <= 0) {
      setDtlError('Nominal harus berupa angka valid di atas 0');
      return;
    }

    if (!dtlCategory) {
      setDtlError('Kategori harus dipilih');
      return;
    }

    if (!dtlTanggal) {
      setDtlError('Tanggal harus diisi');
      return;
    }

    try {
      setLoading(true);
      if (editingDtl) {
        // Update mode
        await updateTrxDetail(editingDtl.id, {
          tanggal: dtlTanggal,
          kategori_id: parseInt(dtlCategory),
          nominal: nominalNum,
          keterangan: dtlKeterangan
        }, currentUser?.id || 1);
        alert('Transaksi berhasil diperbarui!');
        setEditingDtl(null);
      } else {
        // Create mode
        await createTrxDetail(
          dtlTanggal,
          parseInt(dtlCategory),
          nominalNum,
          dtlKeterangan,
          currentUser?.id || 1
        );
        alert('Transaksi berhasil ditambahkan!');
      }

      // Reset form fields and close modal
      setDtlNominal('');
      setDtlKeterangan('');
      setIsTrxDtlModalOpen(false);

      // Reload details data
      const fetchedDetails = await getTrxDetails();
      setTrxDetails(fetchedDetails);
    } catch (err: any) {
      setDtlError(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTrxDtl = (item: TrxDtl) => {
    setEditingDtl(item);
    setDtlTanggal(item.tanggal);
    setDtlCategory(String(item.kategori_id));
    setDtlNominal(String(item.nominal));
    setDtlKeterangan(item.keterangan || '');
    setDtlError('');
    setDtlSuccess('');
    setIsTrxDtlModalOpen(true);
  };

  const handleCancelEditTrxDtl = () => {
    setEditingDtl(null);
    setDtlTanggal(todayStr);
    if (categories.length > 0) {
      setDtlCategory(String(categories[0].id));
    } else {
      setDtlCategory('');
    }
    setDtlNominal('');
    setDtlKeterangan('');
    setDtlError('');
    setDtlSuccess('');
    setIsTrxDtlModalOpen(false);
  };

  const handleDeleteTrxDtl = (id: number) => {
    showConfirm('Hapus Transaksi', 'Apakah Anda yakin ingin menghapus transaksi ini?', async () => {
      try {
        setLoading(true);
        await deleteTrxDetail(id);
        const fetchedDetails = await getTrxDetails();
        setTrxDetails(fetchedDetails);
        alert('Transaksi berhasil dihapus!');
      } catch (err: any) {
        alert(`Gagal menghapus transaksi: ${err.message}`);
      } finally {
        setLoading(false);
      }
    });
  };

  // --- USER CRUD HANDLERS (Owner Only) ---

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (currentUser?.role !== 'owner') {
      setUserError('Hanya Owner yang dapat membuat pengguna baru.');
      return;
    }

    if (!newUserUsername.trim()) {
      setUserError('Username tidak boleh kosong');
      return;
    }

    try {
      setLoading(true);
      const created = await createUser(newUserUsername, newUserRole);
      if (created) {
        alert(`Pengguna ${created.username} berhasil dibuat!`);
        setNewUserUsername('');
        setNewUserRole('kasir');
        setIsUserModalOpen(false);
        await loadUsersData();
      }
    } catch (err: any) {
      setUserError(err.message || 'Gagal membuat pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditUser = (user: User) => {
    if (currentUser?.role !== 'owner') {
      alert('Hanya Owner yang dapat mengubah data pengguna.');
      return;
    }
    setEditingUser(user);
    setEditUserUsername(user.username);
    setEditUserRole(user.role);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (currentUser?.role !== 'owner') {
      alert('Hanya Owner yang dapat mengubah data pengguna.');
      return;
    }

    if (!editUserUsername.trim()) {
      alert('Username tidak boleh kosong');
      return;
    }

    try {
      setLoading(true);

      // Mencegah owner merubah role-nya sendiri dari owner ke kasir/manager jika dia owner terakhir
      if (editingUser.id === currentUser.id && editUserRole !== 'owner') {
        const ownerCount = users.filter(u => u.role === 'owner').length;
        if (ownerCount <= 1) {
          alert('Gagal: Anda adalah satu-satunya Owner di sistem. Tidak dapat mengubah peran Anda sendiri.');
          return;
        }
      }

      const success = await updateUser(editingUser.id, {
        username: editUserUsername,
        role: editUserRole
      });

      if (success) {
        if (editingUser.id === currentUser.id) {
          const updatedCurrentUser = { ...currentUser, username: editUserUsername.trim().toLowerCase(), role: editUserRole };
          setCurrentUser(updatedCurrentUser);
          localStorage.setItem('tb_current_session', JSON.stringify(updatedCurrentUser));
        }
        setEditingUser(null);
        await loadUsersData();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (id: number) => {
    if (currentUser?.role !== 'owner') {
      alert('Hanya Owner yang dapat menghapus pengguna.');
      return;
    }

    if (id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif!');
      return;
    }

    const targetUser = users.find(u => u.id === id);
    if (targetUser?.role === 'owner') {
      const ownerCount = users.filter(u => u.role === 'owner').length;
      if (ownerCount <= 1) {
        alert('Gagal: Tidak dapat menghapus Owner terakhir di sistem.');
        return;
      }
    }

    showConfirm('Hapus Pengguna', 'Apakah Anda yakin ingin menghapus pengguna ini?', async () => {
      try {
        setLoading(true);
        await deleteUser(id);
        await loadUsersData();
        alert('Pengguna berhasil dihapus!');
      } catch (err: any) {
        alert(`Gagal menghapus pengguna: ${err.message}`);
      } finally {
        setLoading(false);
      }
    });
  };

  // Delete Transaction Handler
  const handleDeleteTx = (id: number) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    if (!canModifyTx(tx)) {
      alert('Anda tidak memiliki wewenang untuk melakukan koreksi/penghapusan pada transaksi ini.');
      return;
    }

    showConfirm('Hapus Transaksi Closing', 'Apakah Anda yakin ingin menghapus transaksi keuangan ini?', async () => {
      try {
        setLoading(true);
        // Log delete action
        await createLogHistory(
          tx.id,
          'DELETE',
          currentUser?.id || 1,
          tx
        );
        await deleteTransaction(id);
        const fetchedTxs = await getTransactions();
        setTransactions(fetchedTxs);
        await loadLogHistoryData();
        alert('Transaksi berhasil dihapus!');
      } catch (err: any) {
        alert(`Gagal menghapus transaksi: ${err.message}`);
      } finally {
        setLoading(false);
      }
    });
  };

  // --- MASTER BARANG (mst_stocks) CRUD HANDLERS (Owner/Manager Only) ---

  const handleCreateOrUpdateStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setStockItemError('');

    if (currentUser?.role !== 'owner' && currentUser?.role !== 'manager') {
      setStockItemError('Hanya Owner/Manager yang dapat mengelola master barang.');
      return;
    }

    if (!stockItemName.trim()) {
      setStockItemError('Nama barang tidak boleh kosong.');
      return;
    }

    if (!stockItemUnit.trim()) {
      setStockItemError('Satuan tidak boleh kosong.');
      return;
    }

    try {
      setLoading(true);
      if (editingStockItem) {
        // Update
        await updateStockItem(editingStockItem.id, {
          nama_barang: stockItemName.trim(),
          satuan: stockItemUnit.trim(),
          keterangan: stockItemDesc.trim() || undefined
        });
        alert('Master barang berhasil diperbarui!');
      } else {
        // Create
        await createStockItem(
          stockItemName.trim(),
          stockItemUnit.trim(),
          stockItemDesc.trim() || undefined
        );
        alert('Master barang baru berhasil ditambahkan!');
      }

      setStockItemName('');
      setStockItemUnit('');
      setStockItemDesc('');
      setEditingStockItem(null);
      setIsStockItemModalOpen(false);

      const items = await getStockItems();
      setStockItems(items);
    } catch (err: any) {
      setStockItemError(err.message || 'Gagal menyimpan barang.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditStockItem = (item: MstStock) => {
    if (currentUser?.role !== 'owner' && currentUser?.role !== 'manager') {
      alert('Hanya Owner/Manager yang dapat mengedit master barang.');
      return;
    }
    setEditingStockItem(item);
    setStockItemName(item.nama_barang);
    setStockItemUnit(item.satuan);
    setStockItemDesc(item.keterangan || '');
    setStockItemError('');
    setIsStockItemModalOpen(true);
  };

  const handleCancelEditStockItem = () => {
    setEditingStockItem(null);
    setStockItemName('');
    setStockItemUnit('');
    setStockItemDesc('');
    setStockItemError('');
    setIsStockItemModalOpen(false);
  };

  const handleDeleteStockItem = (id: number) => {
    if (currentUser?.role !== 'owner' && currentUser?.role !== 'manager') {
      alert('Hanya Owner/Manager yang memiliki wewenang menghapus master barang.');
      return;
    }

    showConfirm('Hapus Barang Persediaan', 'Apakah Anda yakin ingin menghapus barang ini dari master data?', async () => {
      try {
        setLoading(true);
        await deleteStockItem(id);
        const items = await getStockItems();
        setStockItems(items);
        alert('Barang berhasil dihapus dari master!');
      } catch (err: any) {
        alert(`Gagal menghapus: ${err.message}`);
      } finally {
        setLoading(false);
      }
    });
  };

  // --- DAILY STOCK OPNAME CRUD HANDLERS ---

  const [opnameStatusSubmit, setOpnameStatusSubmit] = useState<'draft' | 'selesai'>('draft');

  const handleOpenCreateStockOpname = () => {
    setEditingStockOpname(null);
    setOpnameDate(todayStr);

    // Get current local time HH:MM
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setOpnameTime(timeStr);

    setOpnameChecker(currentUser?.username || '');

    // Prefill opname counts with empty inputs
    const initialCounts: Record<number, { freezer: string; chiller: string }> = {};
    stockItems.forEach(item => {
      initialCounts[item.id] = { freezer: '', chiller: '' };
    });
    setOpnameCounts(initialCounts);
    setOpnameError('');
    setIsStockOpnameModalOpen(true);
  };

  const handleOpenEditStockOpname = (opname: StockOpname) => {
    if (opname.status === 'selesai') {
      alert('Sesi stock opname yang sudah selesai tidak dapat diedit/diubah.');
      return;
    }
    setEditingStockOpname(opname);
    setOpnameDate(opname.tanggal);
    setOpnameTime(opname.jam.slice(0, 5));
    setOpnameChecker(opname.checker);

    const counts: Record<number, { freezer: string; chiller: string }> = {};
    stockItems.forEach(item => {
      const det = opname.details?.find(d => d.item_id === item.id);
      counts[item.id] = {
        freezer: det ? String(det.stock_freezer) : '',
        chiller: det ? String(det.stock_chiller) : ''
      };
    });
    setOpnameCounts(counts);
    setOpnameError('');
    setIsStockOpnameModalOpen(true);
  };

  const handleCreateStockOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpnameError('');

    if (!opnameDate) {
      setOpnameError('Tanggal opname harus diisi.');
      return;
    }

    if (!opnameTime) {
      setOpnameError('Waktu/Jam opname harus diisi.');
      return;
    }

    if (!opnameChecker.trim()) {
      setOpnameError('Checker/Pemeriksa harus diisi.');
      return;
    }

    // Map counts to details array payload
    const details = stockItems.map(item => {
      const counts = opnameCounts[item.id] || { freezer: '', chiller: '' };
      return {
        item_id: item.id,
        stock_freezer: counts.freezer === '' ? 0 : Number(counts.freezer),
        stock_chiller: counts.chiller === '' ? 0 : Number(counts.chiller)
      };
    });

    try {
      setLoading(true);
      if (editingStockOpname) {
        // Update existing opname (if it was draft)
        await updateStockOpname(
          editingStockOpname.id,
          {
            tanggal: opnameDate,
            jam: opnameTime.length === 5 ? opnameTime + ':00' : opnameTime,
            checker: opnameChecker.trim(),
            status: opnameStatusSubmit
          },
          details
        );
        alert(opnameStatusSubmit === 'selesai' ? 'Catatan Stock Opname berhasil diselesaikan!' : 'Draft Stock Opname berhasil diperbarui!');
      } else {
        // Create new opname
        await createStockOpname(
          opnameDate,
          opnameTime.length === 5 ? opnameTime + ':00' : opnameTime,
          opnameChecker.trim(),
          currentUser?.id || 1,
          opnameStatusSubmit,
          details
        );
        alert(opnameStatusSubmit === 'selesai' ? 'Catatan Stock Opname berhasil disimpan!' : 'Draft Stock Opname berhasil disimpan!');
      }

      setIsStockOpnameModalOpen(false);
      setEditingStockOpname(null);

      const opnames = await getStockOpnames();
      setStockOpnames(opnames);
    } catch (err: any) {
      setOpnameError(err.message || 'Gagal menyimpan stock opname.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStockOpname = (id: number) => {
    if (currentUser?.role !== 'owner' && currentUser?.role !== 'manager') {
      alert('Hanya Owner/Manager yang dapat menghapus riwayat stock opname.');
      return;
    }

    showConfirm('Hapus Sesi Stock Opname', 'Apakah Anda yakin ingin menghapus sesi stock opname ini?', async () => {
      try {
        setLoading(true);
        await deleteStockOpname(id);
        const opnames = await getStockOpnames();
        setStockOpnames(opnames);
        alert('Sesi stock opname berhasil dihapus!');
      } catch (err: any) {
        alert(`Gagal menghapus: ${err.message}`);
      } finally {
        setLoading(false);
      }
    });
  };

  const handlePrintOpname = (opname: StockOpname) => {
    setPrintOpname(opname);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  useEffect(() => {
    if (printOpname) {
      const handleAfterPrint = () => {
        setPrintOpname(null);
      };
      window.addEventListener('afterprint', handleAfterPrint);
      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [printOpname]);

  const handleExcelKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    itemId: number,
    field: 'freezer' | 'chiller',
    index: number,
    filteredItems: MstStock[]
  ) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      // Move to the same field in the next row
      const nextIndex = index + 1;
      if (nextIndex < filteredItems.length) {
        const nextItemId = filteredItems[nextIndex].id;
        const nextInput = document.getElementById(`input-${nextItemId}-${field}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
          (nextInput as HTMLInputElement).select();
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Move to the same field in the previous row
      const prevIndex = index - 1;
      if (prevIndex >= 0) {
        const prevItemId = filteredItems[prevIndex].id;
        const prevInput = document.getElementById(`input-${prevItemId}-${field}`);
        if (prevInput) {
          (prevInput as HTMLInputElement).focus();
          (prevInput as HTMLInputElement).select();
        }
      }
    } else if (e.key === 'ArrowRight') {
      if (field === 'freezer') {
        e.preventDefault();
        // Move to chiller in the same row
        const nextInput = document.getElementById(`input-${itemId}-chiller`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
          (nextInput as HTMLInputElement).select();
        }
      } else {
        // Move to next row freezer
        const nextIndex = index + 1;
        if (nextIndex < filteredItems.length) {
          e.preventDefault();
          const nextItemId = filteredItems[nextIndex].id;
          const nextInput = document.getElementById(`input-${nextItemId}-freezer`);
          if (nextInput) {
            (nextInput as HTMLInputElement).focus();
            (nextInput as HTMLInputElement).select();
          }
        }
      }
    } else if (e.key === 'ArrowLeft') {
      if (field === 'chiller') {
        e.preventDefault();
        // Move to freezer in the same row
        const prevInput = document.getElementById(`input-${itemId}-freezer`);
        if (prevInput) {
          (prevInput as HTMLInputElement).focus();
          (prevInput as HTMLInputElement).select();
        }
      } else {
        // Move to previous row chiller
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          e.preventDefault();
          const prevItemId = filteredItems[prevIndex].id;
          const prevInput = document.getElementById(`input-${prevItemId}-chiller`);
          if (prevInput) {
            (prevInput as HTMLInputElement).focus();
            (prevInput as HTMLInputElement).select();
          }
        }
      }
    }
  };

  // Open Edit Dialog Handler
  const handleOpenEdit = (tx: TransaksiHarian) => {
    if (!canModifyTx(tx)) {
      alert('Anda tidak memiliki wewenang untuk mengoreksi data transaksi ini.');
      return;
    }
    setEditingTx(tx);
    setEditNominal(String(tx.nominal));
    setEditDate(tx.tanggal);
    setEditShift(tx.shift || 'pagi');
    setEditKeterangan(tx.keterangan || '');
    setEditCategory(String(tx.kategori_id));
  };

  // Save Edited Transaction Handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const nominalNum = parseFloat(editNominal);
    if (isNaN(nominalNum) || nominalNum <= 0) {
      alert('Nominal harus valid');
      return;
    }

    try {
      setLoading(true);
      const updatedDetail = {
        tanggal: editDate,
        shift: editShift,
        kategori_id: parseInt(editCategory),
        nominal: nominalNum,
        keterangan: editKeterangan
      };
      // Log edit action
      await createLogHistory(
        editingTx.id,
        'EDIT',
        currentUser?.id || 1,
        editingTx,
        updatedDetail
      );
      await updateTransaction(editingTx.id, updatedDetail, currentUser?.id || 1);
      setEditingTx(null);
      // Reload
      const fetchedTxs = await getTransactions();
      setTransactions(fetchedTxs);
      await loadLogHistoryData();
    } catch (err: any) {
      alert(`Gagal menyimpan perubahan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- CALCULATION LOGICS ---

  // 1. Dashboard summary
  const getDashboardSummary = () => {
    // Current date transactions
    const todayTxs = transactions.filter(t => t.tanggal === todayStr);

    let totalPemasukanHariIni = 0;
    let totalPengeluaranHariIni = 0;

    todayTxs.forEach(t => {
      if (t.kategori?.tipe === 'pemasukan') {
        totalPemasukanHariIni += t.nominal;
      } else {
        totalPengeluaranHariIni += t.nominal;
      }
    });

    // Total balance (all time sum)
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    transactions.forEach(t => {
      if (t.kategori?.tipe === 'pemasukan') {
        totalPemasukan += t.nominal;
      } else {
        totalPengeluaran += t.nominal;
      }
    });

    const saldoSaatIni = totalPemasukan - totalPengeluaran;

    return {
      saldoSaatIni,
      totalPemasukanHariIni,
      totalPengeluaranHariIni
    };
  };

  const summary = getDashboardSummary();

  // 2. Filter transactions based on rules & selections
  const getFilteredTransactions = () => {
    let list = transactions;

    // Filter by category
    if (filterCategory !== 'all') {
      list = list.filter(t => String(t.kategori_id) === filterCategory);
    }

    // Filter by type
    if (filterType !== 'all') {
      list = list.filter(t => t.kategori?.tipe === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        (t.keterangan?.toLowerCase().includes(q)) ||
        (t.kategori?.nama_kategori.toLowerCase().includes(q)) ||
        (t.user?.username.toLowerCase().includes(q))
      );
    }

    return list;
  };

  const filteredTxs = getFilteredTransactions();

  interface GroupedTransaction {
    key: string;
    tanggal: string;
    shift: 'pagi' | 'siang' | 'malam' | 'operational';
    user_id: number;
    username: string;
    totalPemasukan: number;
    totalPengeluaran: number;
    saldoAwal: number;
    saldoAkhir: number;
    transactions: TransaksiHarian[];
  }

  const getGroupedTransactions = (): GroupedTransaction[] => {
    const list = getFilteredTransactions();

    const groupsMap: { [key: string]: GroupedTransaction } = {};

    list.forEach(t => {
      const uId = t.user_id;
      const date = t.tanggal;
      const shift = t.shift || 'pagi';
      const key = `${uId}_${date}_${shift}`;
      const username = t.user?.username || 'staf';

      if (!groupsMap[key]) {
        const sAwal = t.master?.saldo_awal || 0;
        groupsMap[key] = {
          key,
          tanggal: date,
          shift,
          user_id: uId,
          username,
          totalPemasukan: 0,
          totalPengeluaran: 0,
          saldoAwal: sAwal,
          saldoAkhir: sAwal,
          transactions: []
        };
      }

      groupsMap[key].transactions.push(t);
      if (t.kategori?.tipe === 'pemasukan') {
        groupsMap[key].totalPemasukan += t.nominal;
      } else {
        groupsMap[key].totalPengeluaran += t.nominal;
      }
    });

    Object.values(groupsMap).forEach(g => {
      g.saldoAkhir = g.saldoAwal + g.totalPemasukan - g.totalPengeluaran;
    });

    const groupedList = Object.values(groupsMap).sort((a, b) => {
      if (a.tanggal !== b.tanggal) {
        return b.tanggal.localeCompare(a.tanggal);
      }
      if (a.username !== b.username) {
        return a.username.localeCompare(b.username);
      }
      return a.shift.localeCompare(b.shift);
    });

    return groupedList;
  };

  const groupedTransactions = getGroupedTransactions();

  // Helper formatting IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Color palette list for expense chart
  const chartColors = [
    '#10b981', '#6366f1', '#f43f5e', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'
  ];

  return (
    <div className="min-h-screen bg-[#070b13] text-[#e2e8f0] font-sans antialiased selection:bg-emerald-500 selection:text-white pb-10">
      <div id="main-app-content" className="print:hidden print-hidden-fallback">
        {/* Background radial effects */}
        <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl -z-10 animate-pulse"></div>


        {/* LOGIN OVERLAY GATE */}
        {!currentUser ? (
          <div className="flex items-center justify-center min-h-[85vh] px-4">
            <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden border border-slate-800/80">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-950/40">
                  <svg className="w-8 h-8 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">MASUK KE SISTEM</h2>
                <p className="text-xs text-slate-400 mt-1">Sistem Keuangan Harian Time to Climb</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nama Pengguna (Username)</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Masukkan nama pengguna"
                    className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Kata Sandi (Password)</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                  />
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 leading-relaxed">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-950/20 hover:from-emerald-400 hover:to-teal-400 transition-all duration-200"
                >
                  Masuk
                </button>
              </form>

              <div className="mt-8 border-t border-slate-800/80 pt-6">
                <span className="block text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Akun Simulasi Demo</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setUsernameInput('budi'); setPasswordInput('budi'); }}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-center transition-all group"
                  >
                    <span className="block font-bold text-xs text-emerald-400 group-hover:text-emerald-300">budi</span>
                    <span className="block text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">Kasir</span>
                  </button>
                  <button
                    onClick={() => { setUsernameInput('rudi'); setPasswordInput('rudi'); }}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-center transition-all group"
                  >
                    <span className="block font-bold text-xs text-indigo-400 group-hover:text-indigo-300">rudi</span>
                    <span className="block text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">Manager</span>
                  </button>
                  <button
                    onClick={() => { setUsernameInput('anton'); setPasswordInput('anton'); }}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500/30 text-center transition-all group"
                  >
                    <span className="block font-bold text-xs text-violet-400 group-hover:text-violet-300">anton</span>
                    <span className="block text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">Owner</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // DASHBOARD CONTENT
          <div>
            {/* Header */}
            <header className="border-b border-slate-800 bg-[#070b13]/80 backdrop-blur-md sticky top-0 z-40">
              <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

                {/* Brand */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/25">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-white">TIME TO CLIMB</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Aplikasi Keuangan Harian</p>
                  </div>
                </div>

                {/* User Session Info */}
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <span className="block text-xs font-semibold text-white capitalize">{currentUser.username}</span>
                    <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded mt-0.5 border ${currentUser.role === 'kasir'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : currentUser.role === 'manager'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                      }`}>
                      {currentUser.role}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 transition-all"
                    title="Logout"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>

              </div>
            </header>

            {/* Backdrop untuk menutup dropdown saat klik di luar area */}
            {activeDropdown && (
              <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setActiveDropdown(null)} />
            )}

            {/* Navigation Bar */}
            <div className="max-w-6xl mx-auto px-6 mt-8 relative z-40">
              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/50 rounded-2xl border border-slate-850">
                <button
                  onClick={() => { setActiveTab('dashboard'); setActiveDropdown(null); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'dashboard'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Dasbor
                </button>

                <button
                  onClick={() => { setActiveTab('transaction'); setActiveDropdown(null); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'transaction'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Input Closing
                </button>

                <button
                  onClick={() => { setActiveTab('transaction_dtl'); setActiveDropdown(null); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'transaction_dtl'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Transaksi
                </button>

                <button
                  onClick={() => { setActiveTab('stock_opname'); setActiveDropdown(null); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'stock_opname'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Stock Opname
                </button>

                {/* Laporan & Riwayat Dropdown / Button */}
                {currentUser.role === 'manager' || currentUser.role === 'owner' ? (
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === 'reports' ? null : 'reports')}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'history' || activeTab === 'reports'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      <span>Laporan & Riwayat</span>
                      <svg className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'reports' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {activeDropdown === 'reports' && (
                      <div className="absolute left-0 mt-1.5 w-48 bg-[#0b101f] border border-slate-800 rounded-xl p-1 shadow-2xl z-50 animate-in fade-in duration-100">
                        <button
                          onClick={() => { setActiveTab('history'); setActiveDropdown(null); }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'history' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
                            }`}
                        >
                          Riwayat Closing
                        </button>
                        <button
                          onClick={() => { setActiveTab('reports'); setActiveDropdown(null); }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'reports' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
                            }`}
                        >
                          Laporan Bulanan
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => { setActiveTab('history'); setActiveDropdown(null); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'history'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Riwayat Closing
                  </button>
                )}

                {/* Master Data & Admin Dropdown */}
                {(currentUser.role === 'manager' || currentUser.role === 'owner') && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === 'master' ? null : 'master')}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'categories' || activeTab === 'stock_items' || activeTab === 'users'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      <span>Master Data</span>
                      <svg className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'master' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {activeDropdown === 'master' && (
                      <div className="absolute left-0 mt-1.5 w-52 bg-[#0b101f] border border-slate-800 rounded-xl p-1 shadow-2xl z-50 animate-in fade-in duration-100">
                        <button
                          onClick={() => { setActiveTab('categories'); setActiveDropdown(null); }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'categories' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
                            }`}
                        >
                          Master Jenis Transaksi
                        </button>
                        <button
                          onClick={() => { setActiveTab('stock_items'); setActiveDropdown(null); }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'stock_items' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
                            }`}
                        >
                          Master Barang
                        </button>
                        {currentUser.role === 'owner' && (
                          <button
                            onClick={() => { setActiveTab('users'); setActiveDropdown(null); }}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
                              }`}
                          >
                            Kelola Pengguna
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Core Content Container */}
            <main className="max-w-6xl mx-auto px-6 mt-8">

              {/* TAB: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">

                  {/* Balance & Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Saldo Saat Ini */}
                    <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px] border border-slate-800/80">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Saldo Saat Ini (Kas Usaha)</span>
                        <h3 className={`text-2xl font-black mt-2 tracking-tight ${summary.saldoSaatIni >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatIDR(summary.saldoSaatIni)}
                        </h3>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed mt-4">
                        Total Pemasukan bersih dikurangi total pengeluaran operasional toko.
                      </p>
                    </div>

                    {/* Total Pemasukan Hari Ini */}
                    <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px] border border-slate-800/80">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl"></div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pemasukan Hari Ini</span>
                        <h3 className="text-2xl font-black text-sky-400 mt-2 tracking-tight">
                          {formatIDR(summary.totalPemasukanHariIni)}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-4">
                        <span>Hari Ini: {todayStr}</span>
                      </div>
                    </div>

                    {/* Total Pengeluaran Hari Ini */}
                    <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px] border border-slate-800/80">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pengeluaran Hari Ini</span>
                        <h3 className="text-2xl font-black text-rose-400 mt-2 tracking-tight">
                          {formatIDR(summary.totalPengeluaranHariIni)}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-4">
                        <span>Hari Ini: {todayStr}</span>
                      </div>
                    </div>

                  </div>

                  {/* Dashboard layout main content */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Input Quick Link & RBAC info */}
                    <div className="lg:col-span-1 space-y-6">

                      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80">
                        <h4 className="text-sm font-bold text-white mb-3">Hak Akses Anda</h4>
                        <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                          <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                            <span>Input Closing Harian</span>
                            <span className="text-emerald-400 font-semibold">BISA</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                            <span>Kelola Kategori Uang</span>
                            {currentUser.role === 'kasir' ? (
                              <span className="text-rose-400 font-semibold">TIDAK</span>
                            ) : (
                              <span className="text-emerald-400 font-semibold">BISA</span>
                            )}
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                            <span>Lihat Riwayat Laporan</span>
                            {currentUser.role === 'kasir' ? (
                              <span className="text-slate-500 font-semibold">Hari Ini Saja</span>
                            ) : (
                              <span className="text-emerald-400 font-semibold">Semua Data</span>
                            )}
                          </div>
                          <div className="flex justify-between items-center pb-1">
                            <span>Koreksi Transaksi Lama</span>
                            {currentUser.role === 'owner' ? (
                              <span className="text-emerald-400 font-semibold">BISA</span>
                            ) : (
                              <span className="text-rose-400 font-semibold">TIDAK</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80">
                        <h4 className="text-sm font-bold text-white mb-2">Bantuan Cepat</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          Gunakan tombol di bawah untuk mencatat kas masuk/keluar sekarang.
                        </p>
                        <button
                          onClick={() => setActiveTab('transaction')}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all text-center block"
                        >
                          Mulai Mencatat
                        </button>
                      </div>

                    </div>

                    {/* Right: Recent activity list */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800/80">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-white">
                          {currentUser.role === 'kasir' ? 'Aktivitas Transaksi Hari Ini' : 'Aktivitas Keuangan Terbaru'}
                        </h4>
                        <button
                          onClick={() => setActiveTab('history')}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                        >
                          Lihat Semua
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {filteredTxs.slice(0, 5).length === 0 ? (
                          <div className="text-center py-10 text-slate-500 text-xs">
                            Belum ada transaksi terdaftar untuk ditampilkan.
                          </div>
                        ) : (
                          filteredTxs.slice(0, 5).map((tx) => (
                            <div
                              key={tx.id}
                              className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-2xl flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl shrink-0 ${tx.kategori?.tipe === 'pemasukan'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-rose-500/10 text-rose-400'
                                  }`}>
                                  {tx.kategori?.tipe === 'pemasukan' ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-white block truncate">{tx.keterangan || tx.kategori?.nama_kategori}</span>
                                  <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                                    {tx.kategori?.nama_kategori} • Oleh {tx.user?.username} • {tx.tanggal}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-xs font-black text-right shrink-0 ${tx.kategori?.tipe === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {tx.kategori?.tipe === 'pemasukan' ? '+' : '-'} {formatIDR(tx.nominal)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB: TRANSACTION FORM */}
              {activeTab === 'transaction' && (
                <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-200">

                  {/* STATIC PANEL: INFORMASI SESI SHIFT KERJA */}
                  <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                      <span className="w-1.5 h-3 bg-emerald-500 rounded animate-pulse"></span>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">I. Informasi Sesi Shift Kerja</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Shift Kerja */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Shift Kerja</label>
                        <select
                          value={txShift}
                          onChange={(e) => setTxShift(e.target.value as any)}
                          className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                        >
                          <option value="pagi" className="bg-[#0a0f1d] text-slate-350">Shift Pagi</option>
                          <option value="siang" className="bg-[#0a0f1d] text-slate-350">Shift Siang</option>
                          <option value="malam" className="bg-[#0a0f1d] text-slate-350">Shift Malam</option>
                          {currentUser?.role === 'owner' && (
                            <option value="operational" className="bg-[#0a0f1d] text-slate-350">Shift Operasional</option>
                          )}
                        </select>
                      </div>

                      {/* Saldo Awal */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Saldo Awal</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 text-xs font-semibold">
                            Rp
                          </div>
                          <input
                            type="number"
                            placeholder="0"
                            value={txSaldoAwal}
                            readOnly
                            className="w-full bg-[#0d1222]/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-400 cursor-not-allowed font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* I. MODAL POP-UP UNTUK CATAT ALIRAN KAS */}
                  {isClosingTxModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      <div className="w-full max-w-lg bg-[#0a0f1d] border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">

                        {/* Close button */}
                        <button
                          onClick={() => setIsClosingTxModalOpen(false)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
                          <span className="w-1.5 h-3 bg-emerald-500 rounded animate-pulse"></span>
                          <h3 className="text-base font-bold text-white">Formulir Pencatatan Keuangan</h3>
                        </div>

                        <form onSubmit={handleCreateTx} className="space-y-4">
                          {/* SECTION 2: DETAIL TRANSAKSI (ALIRAN KAS MASUK/KELUAR) */}
                          <div className="bg-[#090d16]/50 border border-slate-800/60 p-4 rounded-xl space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
                              <span className="w-1.5 h-3 bg-emerald-500 rounded"></span>
                              <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Catat Item Aliran Kas</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {/* Kategori dengan Grouping */}
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Kategori</label>
                                <select
                                  value={txCategory}
                                  onChange={(e) => setTxCategory(e.target.value)}
                                  className="w-full bg-[#0d1222] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                                >
                                  <optgroup label="PEMASUKAN" className="bg-[#0a0f1d] text-emerald-400 font-bold text-[10px]">
                                    {categories.filter(c => c.tipe === 'pemasukan').map((c) => (
                                      <option key={c.id} value={c.id} className="bg-[#0a0f1d] text-slate-300 font-normal">
                                        {c.nama_kategori}
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="PENGELUARAN" className="bg-[#0a0f1d] text-rose-400 font-bold text-[10px]">
                                    {categories.filter(c => c.tipe === 'pengeluaran').map((c) => (
                                      <option key={c.id} value={c.id} className="bg-[#0a0f1d] text-slate-300 font-normal">
                                        {c.nama_kategori}
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                              </div>

                              {/* Nominal */}
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nominal Uang</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs font-semibold">
                                    Rp
                                  </div>
                                  <input
                                    type="number"
                                    placeholder="Contoh: 150000"
                                    value={txNominal}
                                    onChange={(e) => setTxNominal(e.target.value)}
                                    className="w-full bg-[#0d1222] border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Keterangan */}
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Keterangan Opsional</label>
                              <input
                                type="text"
                                placeholder="Contoh: Shift Pagi 20 Porsi Burger Combo"
                                value={txKeterangan}
                                onChange={(e) => setTxKeterangan(e.target.value)}
                                className="w-full bg-[#0d1222] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>

                          {txError && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                              {txError}
                            </div>
                          )}

                          <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4 mt-5">
                            <button
                              type="button"
                              onClick={() => setIsClosingTxModalOpen(false)}
                              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-955 transition-all shadow-md shadow-emerald-950/20"
                            >
                              Simpan Transaksi
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* MASTER: CURRENT ENTRIES LIST */}
                  <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-white">Master Transaksi Saat Ini</h3>
                          <button
                            onClick={() => {
                              setTxNominal('');
                              setTxKeterangan('');
                              setTxError('');
                              setTxSuccess('');
                              setIsClosingTxModalOpen(true);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Catat Aliran Kas
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">
                          Menampilkan transaksi terinput untuk petugas <strong className="text-emerald-400 capitalize">{users.find(u => String(u.id) === txUserId)?.username || 'staf'}</strong> pada tanggal <strong className="text-emerald-400 font-mono">{txDate}</strong> (Shift: <strong className="text-emerald-400 capitalize">{txShift}</strong>).
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-slate-300">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 px-3">Waktu</th>
                            <th className="py-2.5 px-3">Kategori</th>
                            <th className="py-2.5 px-3">Tipe</th>
                            <th className="py-2.5 px-3">Nominal</th>
                            <th className="py-2.5 px-3">Keterangan</th>
                            <th className="py-2.5 px-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const masterTxs = transactions.filter(t =>
                              String(t.user_id) === txUserId && t.tanggal === txDate && t.shift === txShift
                            );
                            if (masterTxs.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="text-center py-8 text-slate-500">
                                    Belum ada transaksi finansial yang diinput untuk kombinasi user, tanggal, dan shift ini.
                                  </td>
                                </tr>
                              );
                            }
                            return masterTxs.map((tx) => {
                              const canEdit = canModifyTx(tx);
                              return (
                                <tr key={tx.id} className="border-b border-slate-850 hover:bg-slate-900/20 transition-all">
                                  <td className="py-3 px-3 font-semibold text-slate-400 font-mono">{formatDateTime(tx.tanggal, tx.created_at)}</td>
                                  <td className="py-3 px-3 font-semibold text-white">{tx.kategori?.nama_kategori || 'Kategori'}</td>
                                  <td className="py-3 px-3">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${tx.kategori?.tipe === 'pemasukan'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                                      }`}>
                                      {tx.kategori?.tipe}
                                    </span>
                                  </td>
                                  <td className={`py-3 px-3 font-bold ${tx.kategori?.tipe === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                                    }}`}>
                                    {tx.kategori?.tipe === 'pemasukan' ? '+' : '-'} {formatIDR(tx.nominal)}
                                  </td>
                                  <td className="py-3 px-3 text-slate-400 truncate max-w-xs">{tx.keterangan || '-'}</td>
                                  <td className="py-3 px-3 text-right">
                                    {canEdit ? (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => handleOpenEdit(tx)}
                                          className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded hover:bg-amber-500/20 text-[9px] font-semibold transition-all"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTx(tx.id)}
                                          className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/15 rounded hover:bg-rose-500/20 text-[9px] font-semibold transition-all"
                                        >
                                          Hapus
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-600">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Block */}
                    {(() => {
                      const masterTxs = transactions.filter(t =>
                        String(t.user_id) === txUserId && t.tanggal === txDate
                      );
                      const sAwal = parseFloat(txSaldoAwal) || 0;
                      let totalPem = 0;
                      let totalPen = 0;
                      masterTxs.forEach(t => {
                        if (t.kategori?.tipe === 'pemasukan') {
                          totalPem += t.nominal;
                        } else {
                          totalPen += t.nominal;
                        }
                      });
                      const sAkhir = sAwal + totalPem - totalPen;
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/40 border border-slate-850 p-4 rounded-2xl mt-4">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-semibold block">Saldo Awal</span>
                            <span className="text-xs font-bold text-white mt-1 block">{formatIDR(sAwal)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-semibold block">Total Pemasukan</span>
                            <span className="text-xs font-bold text-emerald-400 mt-1 block">+{formatIDR(totalPem)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-semibold block">Total Pengeluaran</span>
                            <span className="text-xs font-bold text-rose-400 mt-1 block">-{formatIDR(totalPen)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-semibold block">Saldo Akhir</span>
                            <span className={`text-xs font-extrabold mt-1 block ${sAkhir >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatIDR(sAkhir)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB: HISTORY & AUDIT LOG */}
              {activeTab === 'history' && (
                <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-6">

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Riwayat Closing Finansial</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {currentUser.role === 'kasir'
                          ? 'Menampilkan transaksi kasir khusus hari ini.'
                          : 'Menampilkan seluruh riwayat audit log transaksi keuangan.'}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center gap-3">

                      {/* Search */}
                      <input
                        type="text"
                        placeholder="Cari transaksi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/30 text-white min-w-[150px]"
                      />

                      {/* Category Filter */}
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">Semua Jenis Transaksi</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.nama_kategori}</option>
                        ))}
                      </select>

                      {/* Type Filter */}
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">Semua Tipe</option>
                        <option value="pemasukan">Pemasukan (+)</option>
                        <option value="pengeluaran">Pengeluaran (-)</option>
                      </select>

                    </div>
                  </div>

                  {/* Audit Warning */}
                  {currentUser.role === 'kasir' && (
                    <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-850 text-[10px] text-slate-400 leading-relaxed">
                      <strong>Informasi Koreksi Data:</strong> Peran Kasir hanya diperbolehkan mengedit/menghapus transaksi milik sendiri yang <strong>umurnya belum lewat dari 2 jam</strong> sejak diinput. Transaksi di luar kriteria tersebut hanya dapat direvisi oleh <strong>Manager</strong> atau <strong>Owner</strong>.
                    </div>
                  )}

                  {/* Table list */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-4">Tanggal</th>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Shift</th>
                          <th className="py-3 px-4 text-slate-400">Saldo Awal</th>
                          <th className="py-3 px-4 text-rose-400">Pengeluaran</th>
                          <th className="py-3 px-4 text-emerald-400">Pemasukan</th>
                          <th className="py-3 px-4 text-slate-300">Saldo Akhir</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-10 text-slate-500">
                              Tidak ada transaksi finansial yang cocok dengan kriteria filter.
                            </td>
                          </tr>
                        ) : (
                          groupedTransactions.map((group) => {
                            const canEditGroup = canModifyGroup(group);
                            const canDeleteGrp = canDeleteGroup(group);

                            return (
                              <React.Fragment key={group.key}>
                                <tr
                                  onClick={() => toggleGroupExpand(group.key)}
                                  className="border-b border-slate-850 hover:bg-slate-900/30 transition-all cursor-pointer"
                                >
                                  <td className="py-3.5 px-4 font-mono font-medium text-slate-200 flex items-center gap-2">
                                    <span className="text-slate-500 text-[10px] transition-transform duration-200" style={{
                                      transform: expandedGroups[group.key] ? 'rotate(90deg)' : 'rotate(0deg)',
                                      display: 'inline-block'
                                    }}>
                                      ▶
                                    </span>
                                    {formatDateTime(group.tanggal)}
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-white capitalize">{group.username}</td>
                                  <td className="py-3.5 px-4">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800/80 text-slate-300 border border-slate-700/60">
                                      {group.shift}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-slate-400">
                                    {formatIDR(group.saldoAwal)}
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-rose-400">
                                    {formatIDR(group.totalPengeluaran)}
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-emerald-400">
                                    {formatIDR(group.totalPemasukan)}
                                  </td>
                                  <td className={`py-3.5 px-4 font-bold ${group.saldoAkhir >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }}`}>
                                    {formatIDR(group.saldoAkhir)}
                                  </td>
                                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-2">
                                      {canEditGroup ? (
                                        <button
                                          onClick={() => {
                                            setTxDate(group.tanggal);
                                            setTxUserId(String(group.user_id));
                                            setTxShift(group.shift);
                                            setActiveTab('transaction');
                                          }}
                                          className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded hover:bg-amber-500/20 text-[10px] font-semibold transition-all"
                                        >
                                          Edit
                                        </button>
                                      ) : (
                                        <button
                                          disabled
                                          className="px-2.5 py-1 bg-slate-800 text-slate-600 border border-slate-800 rounded text-[10px] font-semibold opacity-40 cursor-not-allowed"
                                        >
                                          Edit
                                        </button>
                                      )}
                                      {canDeleteGrp ? (
                                        <button
                                          onClick={() => handleDeleteGroup(group)}
                                          className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/15 rounded hover:bg-rose-500/20 text-[10px] font-semibold transition-all"
                                        >
                                          Hapus
                                        </button>
                                      ) : (
                                        <button
                                          disabled
                                          className="px-2.5 py-1 bg-slate-800 text-slate-600 border border-slate-800 rounded text-[10px] font-semibold opacity-40 cursor-not-allowed"
                                        >
                                          Hapus
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                {expandedGroups[group.key] && (
                                  <tr className="bg-slate-950/60 border-b border-slate-850">
                                    <td colSpan={8} className="p-4" onClick={(e) => e.stopPropagation()}>
                                      <div className="bg-[#090d18] border border-slate-800/80 rounded-2xl overflow-hidden p-4 space-y-3">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                                          <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            Rincian Aliran Kas Sesi ini ({group.transactions.length} Item)
                                          </h4>
                                          <span className="text-[10px] text-slate-500 font-medium">
                                            Saldo Awal: <strong className="text-slate-300 font-bold">{formatIDR(group.saldoAwal)}</strong>
                                          </span>
                                        </div>

                                        <table className="w-full text-left text-[11px]">
                                          <thead>
                                            <tr className="text-slate-500 border-b border-slate-850 font-bold uppercase text-[9px] tracking-wider">
                                              <th className="py-2 px-3">Waktu Masuk</th>
                                              <th className="py-2 px-3">Kategori</th>
                                              <th className="py-2 px-3">Tipe</th>
                                              <th className="py-2 px-3">Nominal</th>
                                              <th className="py-2 px-3">Keterangan</th>
                                              <th className="py-2 px-3 text-right">Aksi</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {group.transactions.map((tx) => {
                                              const canEditTxItem = canModifyTx(tx);
                                              const timeString = tx.created_at ? new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
                                              return (
                                                <tr key={tx.id} className="border-b border-slate-850/40 hover:bg-slate-900/10 text-slate-300">
                                                  <td className="py-2.5 px-3 font-mono font-medium text-slate-400">{timeString}</td>
                                                  <td className="py-2.5 px-3 font-bold text-white">{tx.kategori?.nama_kategori || 'Tanpa Kategori'}</td>
                                                  <td className="py-2.5 px-3">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${tx.kategori?.tipe === 'pemasukan'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                      }`}>
                                                      {tx.kategori?.tipe}
                                                    </span>
                                                  </td>
                                                  <td className={`py-2.5 px-3 font-bold ${tx.kategori?.tipe === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                                                    }`}>
                                                    {tx.kategori?.tipe === 'pemasukan' ? '+' : '-'}{formatIDR(tx.nominal)}
                                                  </td>
                                                  <td className="py-2.5 px-3 text-slate-400 italic max-w-xs truncate" title={tx.keterangan || '-'}>
                                                    {tx.keterangan || '-'}
                                                  </td>
                                                  <td className="py-2.5 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                      {canEditTxItem ? (
                                                        <button
                                                          onClick={() => handleOpenEdit(tx)}
                                                          className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded hover:bg-amber-500/20 text-[9px] font-semibold transition-all"
                                                        >
                                                          Ubah
                                                        </button>
                                                      ) : (
                                                        <button
                                                          disabled
                                                          className="px-2 py-0.5 bg-slate-800 text-slate-600 border border-slate-800 rounded text-[9px] font-semibold opacity-40 cursor-not-allowed"
                                                        >
                                                          Ubah
                                                        </button>
                                                      )}
                                                      {canEditTxItem ? (
                                                        <button
                                                          onClick={() => handleDeleteTx(tx.id)}
                                                          className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/15 rounded hover:bg-rose-500/20 text-[9px] font-semibold transition-all"
                                                        >
                                                          Hapus
                                                        </button>
                                                      ) : (
                                                        <button
                                                          disabled
                                                          className="px-2 py-0.5 bg-slate-800 text-slate-600 border border-slate-800 rounded text-[9px] font-semibold opacity-40 cursor-not-allowed"
                                                        >
                                                          Hapus
                                                        </button>
                                                      )}
                                                    </div>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* AUDIT LOG HISTORY SECTION */}
                  <div className="border-t border-slate-800 pt-6 mt-8 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Log Audit Perubahan Data (Audit Trail)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Mencatat setiap tindakan koreksi (edit/hapus) data transaksi harian untuk akuntabilitas sistem.
                      </p>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {logHistory.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs bg-slate-900/25 border border-slate-850 rounded-2xl">
                          Belum ada riwayat perubahan atau penghapusan data yang tercatat.
                        </div>
                      ) : (
                        logHistory.map((log) => {
                          const before = JSON.parse(log.detail_sebelum || '{}');
                          const after = log.detail_sesudah ? JSON.parse(log.detail_sesudah) : null;
                          const logDate = formatDateTime(log.created_at.split('T')[0], log.created_at);

                          return (
                            <div
                              key={log.id}
                              className="p-4 bg-[#0d1222]/80 border border-slate-850 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs"
                            >
                              <div className="space-y-1.5 w-full">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${log.aksi === 'EDIT'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                                    }`}>
                                    {log.aksi}
                                  </span>
                                  <span className="text-slate-400">
                                    Oleh <strong className="text-white capitalize">{log.user?.username || 'staf'}</strong>
                                  </span>
                                  <span className="text-[10px] text-slate-500">• {logDate}</span>
                                </div>

                                <div className="text-slate-300 leading-relaxed">
                                  {log.aksi === 'DELETE' ? (
                                    <span>
                                      Menghapus Transaksi #{log.transaksi_id} (Nominal: <strong className="text-rose-400">{formatIDR(before.nominal)}</strong>, Keterangan: "{before.keterangan || '-'}")
                                    </span>
                                  ) : (
                                    <div className="space-y-1">
                                      <span>Mengedit Transaksi #{log.transaksi_id}:</span>
                                      <ul className="list-disc list-inside pl-2 space-y-0.5 text-slate-450 text-[11px]">
                                        {before.nominal !== after.nominal && (
                                          <li>Nominal: <del className="text-rose-400/80">{formatIDR(before.nominal)}</del> &rarr; <strong className="text-emerald-400">{formatIDR(after.nominal)}</strong></li>
                                        )}
                                        {before.tanggal !== after.tanggal && (
                                          <li>Tanggal: <del>{before.tanggal}</del> &rarr; <strong>{after.tanggal}</strong></li>
                                        )}
                                        {before.kategori_id !== after.kategori_id && (
                                          <li>Kategori ID: <del>{before.kategori_id}</del> &rarr; <strong>{after.kategori_id}</strong></li>
                                        )}
                                        {before.keterangan !== after.keterangan && (
                                          <li>Keterangan: <del>"{before.keterangan || '-'}"</del> &rarr; <strong>"{after.keterangan || '-'}"</strong></li>
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: TRANSAKSI MANDIRI (trx_dtl) */}
              {activeTab === 'transaction_dtl' && (
                <div className="space-y-8 animate-in fade-in duration-200">

                  {/* 1. MODAL POP-UP UNTUK INPUT-EDIT DATA */}
                  {isTrxDtlModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      <div className="w-full max-w-lg bg-[#0a0f1d] border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">

                        {/* Close Button */}
                        <button
                          onClick={handleCancelEditTrxDtl}
                          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
                          <span className="w-1.5 h-3 bg-emerald-500 rounded animate-pulse"></span>
                          <h3 className="text-base font-bold text-white">
                            {editingDtl ? `Ubah Data Transaksi (ID: ${editingDtl.id})` : 'Input Transaksi Baru'}
                          </h3>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCreateOrUpdateTrxDtl} className="space-y-5">
                          <div className="space-y-4">
                            {/* Tanggal */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tanggal</label>
                              <input
                                type="date"
                                value={dtlTanggal}
                                onChange={(e) => setDtlTanggal(e.target.value)}
                                className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                              />
                            </div>

                            {/* Kategori */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Kategori</label>
                              <select
                                value={dtlCategory}
                                onChange={(e) => setDtlCategory(e.target.value)}
                                className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                              >
                                <option value="">-- Pilih Kategori --</option>
                                <optgroup label="PEMASUKAN" className="bg-slate-900 text-emerald-400 font-bold">
                                  {categories.filter(c => c.tipe === 'pemasukan').map(c => (
                                    <option key={c.id} value={c.id} className="bg-slate-900 text-slate-355 font-normal">
                                      {c.nama_kategori}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="PENGELUARAN" className="bg-slate-900 text-rose-450 font-bold">
                                  {categories.filter(c => c.tipe === 'pengeluaran').map(c => (
                                    <option key={c.id} value={c.id} className="bg-slate-900 text-slate-355 font-normal">
                                      {c.nama_kategori}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>

                            {/* Nominal */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nominal</label>
                              <input
                                type="number"
                                placeholder="Contoh: 50000"
                                value={dtlNominal}
                                onChange={(e) => setDtlNominal(e.target.value)}
                                className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                              />
                            </div>

                            {/* Keterangan */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Keterangan</label>
                              <input
                                type="text"
                                placeholder="Masukkan keterangan transaksi (opsional)"
                                value={dtlKeterangan}
                                onChange={(e) => setDtlKeterangan(e.target.value)}
                                className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                              />
                            </div>
                          </div>

                          {dtlError && (
                            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
                              {dtlError}
                            </div>
                          )}

                          <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4 mt-5">
                            <button
                              type="button"
                              onClick={handleCancelEditTrxDtl}
                              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-955 transition-all shadow-md shadow-emerald-950/20"
                            >
                              {editingDtl ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* 2. SEKSYEN BAWAH: DAFTAR DATA & FILTER */}
                  <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 max-w-6xl mx-auto space-y-6">

                    {/* Header & Filter */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-white">Daftar Transaksi Detail</h3>
                          <button
                            onClick={() => {
                              setEditingDtl(null);
                              setDtlTanggal(todayStr);
                              if (categories.length > 0) {
                                setDtlCategory(String(categories[0].id));
                              } else {
                                setDtlCategory('');
                              }
                              setDtlNominal('');
                              setDtlKeterangan('');
                              setDtlError('');
                              setDtlSuccess('');
                              setIsTrxDtlModalOpen(true);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Tambah Transaksi
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Menampilkan tabel transaksi mandiri dengan saldo berjalan terhitung otomatis.</p>
                      </div>

                      {/* Filter controls */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Range Tanggal */}
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={filterDtlStart}
                            onChange={(e) => setFilterDtlStart(e.target.value)}
                            placeholder="Mulai"
                            className="bg-[#0d1222] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                          />
                          <span className="text-slate-500 text-xs">s/d</span>
                          <input
                            type="date"
                            value={filterDtlEnd}
                            onChange={(e) => setFilterDtlEnd(e.target.value)}
                            placeholder="Sampai"
                            className="bg-[#0d1222] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                          />
                        </div>

                        {/* Dropdown Kategori */}
                        <select
                          value={filterDtlCategory}
                          onChange={(e) => setFilterDtlCategory(e.target.value)}
                          className="bg-[#0d1222] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                        >
                          <option value="">Semua Kategori</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.nama_kategori} ({c.tipe.toUpperCase()})</option>
                          ))}
                        </select>

                        {/* Reset filter button */}
                        {(filterDtlStart || filterDtlEnd || filterDtlCategory) && (
                          <button
                            onClick={() => {
                              setFilterDtlStart('');
                              setFilterDtlEnd('');
                              setFilterDtlCategory('');
                            }}
                            className="text-[10px] uppercase font-bold text-rose-400 hover:text-rose-355 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
                          >
                            Reset Filter
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-4">Tanggal</th>
                            <th className="py-3 px-4">Kategori</th>
                            <th className="py-3 px-4 text-right">Nominal</th>
                            <th className="py-3 px-4 text-right">Saldo Awal</th>
                            <th className="py-3 px-4 text-right">Saldo Akhir</th>
                            <th className="py-3 px-4">Keterangan</th>
                            <th className="py-3 px-4">Petugas</th>
                            <th className="py-3 px-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-xs">
                          {(() => {
                            const filtered = trxDetails.filter(item => {
                              if (filterDtlCategory && String(item.kategori_id) !== filterDtlCategory) return false;
                              if (filterDtlStart && item.tanggal < filterDtlStart) return false;
                              if (filterDtlEnd && item.tanggal > filterDtlEnd) return false;
                              return true;
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                                    Tidak ada data transaksi detail ditemukan.
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((item) => {
                              const isPemasukan = item.kategori?.tipe === 'pemasukan';
                              return (
                                <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                                  <td className="py-3.5 px-4 font-medium text-slate-300">{item.tanggal}</td>
                                  <td className="py-3.5 px-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isPemasukan ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                                      }`}>
                                      {item.kategori?.nama_kategori || `ID: ${item.kategori_id}`}
                                    </span>
                                  </td>
                                  <td className={`py-3.5 px-4 text-right font-semibold ${isPemasukan ? 'text-emerald-400' : 'text-rose-450'}`}>
                                    {isPemasukan ? '+' : '-'}{formatIDR(item.nominal)}
                                  </td>
                                  <td className="py-3.5 px-4 text-right text-slate-455 font-mono">{formatIDR(item.saldo_awal)}</td>
                                  <td className="py-3.5 px-4 text-right text-slate-200 font-mono font-medium">{formatIDR(item.saldo_akhir)}</td>
                                  <td className="py-3.5 px-4 text-slate-400 max-w-[200px] truncate">{item.keterangan || '-'}</td>
                                  <td className="py-3.5 px-4 text-slate-400">{item.user?.username || `ID: ${item.created_user_id}`}</td>
                                  <td className="py-3.5 px-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => handleEditTrxDtl(item)}
                                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTrxDtl(item.id)}
                                        className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/20 transition-all"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: MASTER JENIS TRANSAKSI (Manager/Owner Only) */}
              {activeTab === 'categories' && (currentUser.role === 'manager' || currentUser.role === 'owner') && (
                <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-200">

                  {/* Left: Create Form (Popup Modal) */}
                  {isCategoryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      <div className="w-full max-w-md bg-[#0a0f1d] border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">

                        {/* Close button */}
                        <button
                          onClick={handleCancelEditCategory}
                          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
                          <span className="w-1.5 h-3 bg-emerald-500 rounded animate-pulse"></span>
                          <h3 className="text-base font-bold text-white">
                            {editingCategory ? 'Ubah Jenis Transaksi' : 'Tambah Jenis Transaksi Baru'}
                          </h3>
                        </div>

                        <form onSubmit={handleCreateCategory} className="space-y-4">
                          {/* ID Jenis Transaksi */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">ID Jenis Transaksi (ID)</label>
                            <input
                              type="number"
                              placeholder={editingCategory ? "ID Baru (misal: 12)" : "Contoh: 10 (Opsional)"}
                              value={catIdInput}
                              onChange={(e) => setCatIdInput(e.target.value)}
                              disabled={currentUser?.role !== 'owner'}
                              className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            />
                          </div>

                          {/* Nama Jenis Transaksi */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nama Jenis Transaksi</label>
                            <input
                              type="text"
                              placeholder="Contoh: Pembelian Roti Bun"
                              value={catName}
                              onChange={(e) => setCatName(e.target.value)}
                              disabled={currentUser?.role !== 'owner'}
                              className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tipe Transaksi</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={currentUser?.role !== 'owner'}
                                onClick={() => setCatType('pemasukan')}
                                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${catType === 'pemasukan'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-[#0d1222] text-slate-400 border-slate-800 hover:text-white'
                                  }`}
                              >
                                Pemasukan (+)
                              </button>
                              <button
                                type="button"
                                disabled={currentUser?.role !== 'owner'}
                                onClick={() => setCatType('pengeluaran')}
                                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${catType === 'pengeluaran'
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                    : 'bg-[#0d1222] text-slate-400 border-slate-800 hover:text-white'
                                  }`}
                              >
                                Pengeluaran (-)
                              </button>
                            </div>
                          </div>

                          {currentUser?.role !== 'owner' && (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 leading-normal font-medium">
                              Hanya user dengan role OWNER yang memiliki hak akses untuk mengubah ID dan nama jenis transaksi.
                            </div>
                          )}

                          {catError && (
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 font-medium">
                              {catError}
                            </div>
                          )}

                          <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4 mt-5">
                            <button
                              type="button"
                              onClick={handleCancelEditCategory}
                              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={loading || currentUser?.role !== 'owner'}
                              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-955 transition-all shadow-md shadow-emerald-950/20"
                            >
                              {loading ? 'Menyimpan...' : 'Simpan'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Right: Category List */}
                  <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-white font-mono">Master Jenis Transaksi Terdaftar</h3>
                          {currentUser?.role === 'owner' && (
                            <button
                              onClick={() => {
                                setEditingCategory(null);
                                setCatName('');
                                setCatIdInput('');
                                setCatType('pemasukan');
                                setCatError('');
                                setIsCategoryModalOpen(true);
                              }}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              Tambah Jenis Transaksi
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">
                          Menyimpan tipe mutasi dana untuk pelaporan keuangan usaha.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* GROUP 1: PEMASUKAN */}
                      <div className="border border-slate-800 rounded-2xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedCategoriesGroup(prev => ({ ...prev, pemasukan: !prev.pemasukan }))}
                          className="w-full bg-[#0d1222]/80 hover:bg-[#131b31]/80 px-5 py-3.5 flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 transition-all focus:outline-none"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase font-extrabold">Pemasukan</span>
                            <span className="text-xs text-slate-300">Jenis Pendapatan Usaha</span>
                          </div>
                          <span className="text-slate-400 text-xs transition-transform duration-200">
                            {expandedCategoriesGroup.pemasukan ? '▼' : '▶'}
                          </span>
                        </button>

                        {expandedCategoriesGroup.pemasukan && (
                          <div className="p-4 bg-slate-900/40">
                            {categories.filter(c => c.tipe === 'pemasukan').length === 0 ? (
                              <p className="text-slate-500 text-xs text-center py-4">Belum ada jenis transaksi pemasukan.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-800/80 text-slate-400">
                                      <th className="py-2.5 px-3 font-semibold w-16">ID</th>
                                      <th className="py-2.5 px-3 font-semibold">Nama Jenis Transaksi</th>
                                      <th className="py-2.5 px-3 font-semibold w-24 text-right">Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/40">
                                    {categories.filter(c => c.tipe === 'pemasukan').map((c) => (
                                      <tr key={c.id} className="hover:bg-slate-800/20 text-slate-300">
                                        <td className="py-3 px-3 font-mono text-slate-500">{c.id}</td>
                                        <td className="py-3 px-3 font-medium text-white">{c.nama_kategori}</td>
                                        <td className="py-3 px-3 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            {currentUser?.role === 'owner' && (
                                              <button
                                                onClick={() => {
                                                  setEditingCategory(c);
                                                  setCatName(c.nama_kategori);
                                                  setCatIdInput(String(c.id));
                                                  setCatType(c.tipe);
                                                  setCatError('');
                                                  setIsCategoryModalOpen(true);
                                                }}
                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-750"
                                                title="Edit Jenis Transaksi"
                                              >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                              </button>
                                            )}
                                            <button
                                              onClick={() => handleDeleteCategory(c.id)}
                                              className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all border border-rose-500/15"
                                              title="Hapus Jenis Transaksi"
                                            >
                                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* GROUP 2: PENGELUARAN */}
                      <div className="border border-slate-800 rounded-2xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedCategoriesGroup(prev => ({ ...prev, pengeluaran: !prev.pengeluaran }))}
                          className="w-full bg-[#0d1222]/80 hover:bg-[#131b31]/80 px-5 py-3.5 flex items-center justify-between text-rose-400 font-bold border-b border-slate-800 transition-all focus:outline-none"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded font-mono uppercase font-extrabold">Pengeluaran</span>
                            <span className="text-xs text-slate-300">Jenis Pengeluaran Operasional</span>
                          </div>
                          <span className="text-slate-400 text-xs transition-transform duration-200">
                            {expandedCategoriesGroup.pengeluaran ? '▼' : '▶'}
                          </span>
                        </button>

                        {expandedCategoriesGroup.pengeluaran && (
                          <div className="p-4 bg-slate-900/40">
                            {categories.filter(c => c.tipe === 'pengeluaran').length === 0 ? (
                              <p className="text-slate-500 text-xs text-center py-4">Belum ada jenis transaksi pengeluaran.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-800/80 text-slate-400">
                                      <th className="py-2.5 px-3 font-semibold w-16">ID</th>
                                      <th className="py-2.5 px-3 font-semibold">Nama Jenis Transaksi</th>
                                      <th className="py-2.5 px-3 font-semibold w-24 text-right">Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/40">
                                    {categories.filter(c => c.tipe === 'pengeluaran').map((c) => (
                                      <tr key={c.id} className="hover:bg-slate-800/20 text-slate-300">
                                        <td className="py-3 px-3 font-mono text-slate-500">{c.id}</td>
                                        <td className="py-3 px-3 font-medium text-white">{c.nama_kategori}</td>
                                        <td className="py-3 px-3 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            {currentUser?.role === 'owner' && (
                                              <button
                                                onClick={() => {
                                                  setEditingCategory(c);
                                                  setCatName(c.nama_kategori);
                                                  setCatIdInput(String(c.id));
                                                  setCatType(c.tipe);
                                                  setCatError('');
                                                  setIsCategoryModalOpen(true);
                                                }}
                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-750"
                                                title="Edit Jenis Transaksi"
                                              >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                              </button>
                                            )}
                                            <button
                                              onClick={() => handleDeleteCategory(c.id)}
                                              className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all border border-rose-500/15"
                                              title="Hapus Jenis Transaksi"
                                            >
                                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: MONTHLY REPORT & CHART (Manager/Owner Only) */}
              {activeTab === 'reports' && (currentUser.role === 'manager' || currentUser.role === 'owner') && (
                <div className="space-y-6">

                  {/* Filters */}
                  <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Visualisasi Performa Laba & Pengeluaran</h3>
                      <p className="text-xs text-slate-400 mt-1">Laporan rekapitulasi data agregat bulanan.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Month Select */}
                      <select
                        value={reportMonth}
                        onChange={(e) => setReportMonth(parseInt(e.target.value))}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m}>Bulan {m}</option>
                        ))}
                      </select>

                      {/* Year Select */}
                      <select
                        value={reportYear}
                        onChange={(e) => setReportYear(parseInt(e.target.value))}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                      </select>
                    </div>
                  </div>

                  {monthlyReport && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                      {/* Left: Aggregate Cards & List */}
                      <div className="lg:col-span-1 space-y-6">

                        {/* Laba Bersih Card */}
                        <div className="p-6 rounded-3xl bg-[#0e1628] border border-slate-800/80 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Laba Bersih Bulanan</span>
                            <h3 className={`text-2xl font-black mt-2 tracking-tight ${monthlyReport.laba_bersih >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatIDR(monthlyReport.laba_bersih)}
                            </h3>
                          </div>
                          <div className="border-t border-slate-800/60 mt-4 pt-4 space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Total Pemasukan</span>
                              <span className="text-emerald-400 font-semibold">{formatIDR(monthlyReport.total_pemasukan)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Total Pengeluaran</span>
                              <span className="text-rose-400 font-semibold">{formatIDR(monthlyReport.total_pengeluaran)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Expense Breakdown List */}
                        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Pengelompokan Biya</h4>
                          <div className="space-y-3">
                            {monthlyReport.grouped_categories.length === 0 ? (
                              <p className="text-slate-500 text-xs text-center py-4">Belum ada transaksi di bulan ini.</p>
                            ) : (
                              monthlyReport.grouped_categories.map((cat, idx) => (
                                <div key={cat.nama_kategori} className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                                      <span
                                        className="inline-block w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                                      ></span>
                                      {cat.nama_kategori}
                                    </span>
                                    <span className="font-bold text-white">{formatIDR(cat.total_nominal)}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 text-right capitalize">
                                    Tipe: {cat.tipe}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Right: SVG Chart Graphic */}
                      <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border border-slate-800/80 flex flex-col items-center justify-center min-h-[350px]">
                        <h4 className="text-sm font-bold text-white self-start mb-6">Proporsi Distribusi Pengeluaran & Pemasukan</h4>

                        {monthlyReport.grouped_categories.length === 0 ? (
                          <div className="text-center py-10 text-slate-500 text-xs">
                            Tidak ada data nominal transaksi untuk dirender sebagai grafik bulan ini.
                          </div>
                        ) : (
                          <div className="w-full flex flex-col md:flex-row items-center justify-center gap-10">

                            {/* SVG Donut Chart */}
                            <div className="relative w-48 h-48 shrink-0">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                {/* Background Gray Ring */}
                                <circle
                                  className="text-slate-850"
                                  strokeWidth="4"
                                  stroke="currentColor"
                                  fill="transparent"
                                  r="16"
                                  cx="18"
                                  cy="18"
                                />

                                {/* Generate Circle Segments */}
                                {(() => {
                                  const total = monthlyReport.grouped_categories.reduce((acc, curr) => acc + curr.total_nominal, 0);
                                  let accumulatedPercent = 0;

                                  return monthlyReport.grouped_categories.map((cat, idx) => {
                                    const percentage = (cat.total_nominal / total) * 100;
                                    const strokeDasharray = `${percentage} ${100 - percentage}`;
                                    const strokeDashoffset = 100 - accumulatedPercent;
                                    accumulatedPercent += percentage;

                                    return (
                                      <circle
                                        key={cat.nama_kategori}
                                        stroke={chartColors[idx % chartColors.length]}
                                        strokeWidth="4"
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        fill="transparent"
                                        r="16"
                                        cx="18"
                                        cy="18"
                                        className="transition-all duration-300 hover:stroke-[5] cursor-pointer"
                                      >
                                        <title>{`${cat.nama_kategori}: ${percentage.toFixed(1)}%`}</title>
                                      </circle>
                                    );
                                  });
                                })()}
                              </svg>

                              {/* Inner hole labels */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perputaran</span>
                                <span className="text-sm font-black text-white mt-0.5">
                                  {formatIDR(
                                    monthlyReport.grouped_categories.reduce((acc, curr) => acc + curr.total_nominal, 0)
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Legend / Bar percentages */}
                            <div className="flex-1 w-full space-y-3">
                              {(() => {
                                const total = monthlyReport.grouped_categories.reduce((acc, curr) => acc + curr.total_nominal, 0);
                                return monthlyReport.grouped_categories.map((cat, idx) => {
                                  const pct = total > 0 ? (cat.total_nominal / total) * 100 : 0;
                                  return (
                                    <div key={cat.nama_kategori} className="space-y-1">
                                      <div className="flex justify-between text-xs font-medium text-slate-400">
                                        <span>{cat.nama_kategori}</span>
                                        <span className="font-bold text-white">{pct.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all duration-500"
                                          style={{
                                            width: `${pct}%`,
                                            backgroundColor: chartColors[idx % chartColors.length]
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>

                          </div>
                        )}

                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* TAB: USER MANAGEMENT (Owner Only) */}
              {activeTab === 'users' && currentUser.role === 'owner' && (
                <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-200">

                  {/* Left: Create Form (Popup Modal) */}
                  {isUserModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      <div className="w-full max-w-md bg-[#0a0f1d] border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">

                        {/* Close button */}
                        <button
                          onClick={() => setIsUserModalOpen(false)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
                          <span className="w-1.5 h-3 bg-emerald-500 rounded animate-pulse"></span>
                          <h3 className="text-base font-bold text-white">Tambah Pengguna Baru</h3>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                          {/* Username */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nama Pengguna (Username)</label>
                            <input
                              type="text"
                              placeholder="Contoh: agus"
                              value={newUserUsername}
                              onChange={(e) => setNewUserUsername(e.target.value)}
                              className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                            />
                          </div>

                          {/* Role */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Peran Akses (Role)</label>
                            <select
                              value={newUserRole}
                              onChange={(e) => setNewUserRole(e.target.value as 'kasir' | 'manager' | 'owner')}
                              className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                            >
                              <option value="kasir" className="bg-[#0a0f1d] text-slate-300">KASIR</option>
                              <option value="manager" className="bg-[#0a0f1d] text-slate-300">MANAGER</option>
                              <option value="owner" className="bg-[#0a0f1d] text-slate-300">OWNER (PEMILIK)</option>
                            </select>
                          </div>

                          {userError && (
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 font-medium">
                              {userError}
                            </div>
                          )}

                          <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4 mt-5">
                            <button
                              type="button"
                              onClick={() => setIsUserModalOpen(false)}
                              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-955 transition-all shadow-md shadow-emerald-950/20"
                            >
                              Tambah Pengguna
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Right: User List & Role Matrix */}
                  <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-white">Daftar Pengguna & Manajemen Peran</h3>
                          <button
                            onClick={() => {
                              setNewUserUsername('');
                              setNewUserRole('kasir');
                              setUserError('');
                              setUserSuccess('');
                              setIsUserModalOpen(true);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Tambah Pengguna
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 font-medium">
                          Atur peran dan detail akun pengguna terdaftar secara dinamis.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-slate-300">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-3 px-4">ID</th>
                            <th className="py-3 px-4">Username</th>
                            <th className="py-3 px-4">Peran Aktif</th>
                            <th className="py-3 px-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-10 text-slate-500">
                                Tidak ada data pengguna terdaftar.
                              </td>
                            </tr>
                          ) : (
                            users.map((u) => (
                              <tr key={u.id} className="border-b border-slate-855 hover:bg-slate-900/30 transition-all">
                                <td className="py-3.5 px-4 font-mono font-medium text-slate-400">#{u.id}</td>
                                <td className="py-3.5 px-4 font-bold text-white capitalize flex items-center gap-2">
                                  {u.username}
                                  {u.id === currentUser.id && (
                                    <span className="text-[8px] bg-slate-800 text-slate-400 font-extrabold uppercase px-1.5 py-0.5 rounded border border-slate-700">
                                      Anda
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${u.role === 'kasir'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : u.role === 'manager'
                                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                        : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                    }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleOpenEditUser(u)}
                                      className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded hover:bg-amber-500/20 text-[10px] font-semibold transition-all"
                                    >
                                      Ubah Peran
                                    </button>
                                    {u.id !== currentUser.id && (
                                      <button
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/15 rounded hover:bg-rose-500/20 text-[10px] font-semibold transition-all"
                                      >
                                        Hapus
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: STOCK ITEMS MASTER DATA (Owner/Manager Only) */}
              {activeTab === 'stock_items' && (currentUser.role === 'manager' || currentUser.role === 'owner') && (
                <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-200">

                  {/* MODAL POP-UP UNTUK TAMBAH/EDIT BARANG */}
                  {isStockItemModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      <div className="w-full max-w-md bg-[#0a0f1d] border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">

                        {/* Close button */}
                        <button
                          onClick={handleCancelEditStockItem}
                          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
                          <span className="w-1.5 h-3 bg-emerald-500 rounded animate-pulse"></span>
                          <h3 className="text-base font-bold text-white">
                            {editingStockItem ? 'Ubah Detail Barang' : 'Tambah Barang Baru'}
                          </h3>
                        </div>

                        <form onSubmit={handleCreateOrUpdateStockItem} className="space-y-4">
                          {/* Nama Barang */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nama Barang</label>
                            <input
                              type="text"
                              placeholder="Contoh: Burger Bun"
                              value={stockItemName}
                              onChange={(e) => setStockItemName(e.target.value)}
                              className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                            />
                          </div>

                          {/* Satuan */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Satuan</label>
                            <select
                              value={stockItemUnit}
                              onChange={(e) => setStockItemUnit(e.target.value)}
                              className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                            >
                              <option value="" className="bg-[#0a0f1d]">Pilih Satuan...</option>
                              <option value="Pcs" className="bg-[#0a0f1d]">Pcs</option>
                              <option value="Pack" className="bg-[#0a0f1d]">Pack</option>
                              <option value="Kardus" className="bg-[#0a0f1d]">Kardus</option>
                              <option value="Lembar" className="bg-[#0a0f1d]">Lembar</option>
                              <option value="Botol" className="bg-[#0a0f1d]">Botol</option>
                              <option value="Butir" className="bg-[#0a0f1d]">Butir</option>
                              <option value="Roll" className="bg-[#0a0f1d]">Roll</option>
                              <option value="Bungkus" className="bg-[#0a0f1d]">Bungkus</option>
                              <option value="Kwh" className="bg-[#0a0f1d]">Kwh</option>
                              <option value="Set" className="bg-[#0a0f1d]">Set</option>
                            </select>
                          </div>

                          {/* Keterangan */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Keterangan Kemasan</label>
                            <input
                              type="text"
                              placeholder="Contoh: 1 pack isi 6 pcs"
                              value={stockItemDesc}
                              onChange={(e) => setStockItemDesc(e.target.value)}
                              className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                            />
                          </div>

                          {stockItemError && (
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 font-medium">
                              {stockItemError}
                            </div>
                          )}

                          <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4 mt-5">
                            <button
                              type="button"
                              onClick={handleCancelEditStockItem}
                              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-955 transition-all shadow-md shadow-emerald-950/20"
                            >
                              {editingStockItem ? 'Simpan Perubahan' : 'Tambah Barang'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* BARANG LIST CONTAINER */}
                  <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-white">Master Data Barang Persediaan</h3>
                          <button
                            onClick={() => {
                              setStockItemName('');
                              setStockItemUnit('');
                              setStockItemDesc('');
                              setStockItemError('');
                              setEditingStockItem(null);
                              setIsStockItemModalOpen(true);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Tambah Barang
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 font-medium">
                          Kelola daftar bahan baku burger dan persediaan logistik toko.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-slate-300">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-3 px-4 w-12">ID</th>
                            <th className="py-3 px-4">Nama Barang</th>
                            <th className="py-3 px-4 w-28">Satuan</th>
                            <th className="py-3 px-4">Keterangan Kemasan</th>
                            <th className="py-3 px-4 text-right w-36">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockItems.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-10 text-slate-500">
                                Tidak ada data barang terdaftar.
                              </td>
                            </tr>
                          ) : (
                            stockItems.map((item) => (
                              <tr key={item.id} className="border-b border-slate-855 hover:bg-slate-900/30 transition-all">
                                <td className="py-3.5 px-4 font-mono font-medium text-slate-400">#{item.id}</td>
                                <td className="py-3.5 px-4 font-bold text-white capitalize">{item.nama_barang}</td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-800 text-slate-350 border border-slate-700">
                                    {item.satuan}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-400 font-medium">{item.keterangan || '-'}</td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleOpenEditStockItem(item)}
                                      className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded-lg hover:bg-amber-500/20 text-[10px] font-bold transition-all"
                                    >
                                      Ubah
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStockItem(item.id)}
                                      className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/15 rounded-lg hover:bg-rose-500/20 text-[10px] font-bold transition-all"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: STOCK OPNAME DAILY RECORD */}
              {activeTab === 'stock_opname' && (
                <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-200">

                  {/* MODAL POP-UP UNTUK CATAT STOCK OPNAME */}
                  {isStockOpnameModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      <div className="w-full max-w-3xl bg-[#0a0f1d] border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                        {/* Close button */}
                        <button
                          onClick={() => setIsStockOpnameModalOpen(false)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 shrink-0">
                          <span className="w-1.5 h-3 bg-emerald-500 rounded animate-pulse"></span>
                          <h3 className="text-base font-bold text-white">Catat Stock Opname Harian</h3>
                        </div>

                        <form onSubmit={handleCreateStockOpname} className="space-y-5 flex flex-col flex-1 overflow-hidden">
                          {/* Header Fields Grid */}
                          <div className="grid grid-cols-3 gap-4 bg-[#090d16]/50 border border-slate-800/60 p-4 rounded-2xl shrink-0">
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tanggal</label>
                              <input
                                type="date"
                                value={opnameDate}
                                onChange={(e) => setOpnameDate(e.target.value)}
                                className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Waktu/Jam</label>
                              <input
                                type="time"
                                value={opnameTime}
                                onChange={(e) => setOpnameTime(e.target.value)}
                                className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Pemeriksa (Checker)</label>
                              <input
                                type="text"
                                placeholder="Checker name"
                                value={opnameChecker}
                                onChange={(e) => setOpnameChecker(e.target.value)}
                                className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Items Inputs Container - Excel-like Grid */}
                          <div className="flex-1 overflow-y-auto border border-slate-850 rounded-2xl bg-[#090d16]/30">
                            <table className="w-full text-xs text-left text-slate-300 border-collapse border border-slate-850">
                              <thead className="bg-[#0b101f] sticky top-0 z-10 border-b border-slate-800">
                                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-850">
                                  <th className="py-2.5 px-4 w-12 text-center border-r border-slate-850">No</th>
                                  <th className="py-2.5 px-4 border-r border-slate-850">Nama Barang</th>
                                  <th className="py-2.5 px-4 w-32 border-r border-slate-850 text-center">Stok Freezer</th>
                                  <th className="py-2.5 px-4 w-32 border-r border-slate-850 text-center">Stok Chiller</th>
                                  <th className="py-2.5 px-4 w-20 border-r border-slate-850 text-center">Satuan</th>
                                  <th className="py-2.5 px-4">Keterangan/Kemasan</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const activeItems = stockItems.filter(item => item.is_active);
                                  return activeItems.map((item, idx) => {
                                    const counts = opnameCounts[item.id] || { freezer: '', chiller: '' };
                                    return (
                                      <tr key={item.id} className="border-b border-slate-850 hover:bg-slate-900/10 focus-within:bg-emerald-950/10">
                                        <td className="py-2 px-4 text-center text-slate-500 font-mono border-r border-slate-850">{idx + 1}</td>
                                        <td className="py-2 px-4 font-bold text-white border-r border-slate-850 capitalize">{item.nama_barang}</td>
                                        <td className="p-0 w-32 border-r border-slate-850">
                                          <input
                                            id={`input-${item.id}-freezer`}
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={counts.freezer}
                                            onChange={(e) => setOpnameCounts({
                                              ...opnameCounts,
                                              [item.id]: { ...counts, freezer: e.target.value }
                                            })}
                                            onKeyDown={(e) => handleExcelKeyDown(e, item.id, 'freezer', idx, activeItems)}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full h-full bg-transparent px-3 py-2 text-xs text-white focus:outline-none focus:bg-emerald-500/10 focus:ring-1 focus:ring-emerald-500/30 text-right transition-all font-mono"
                                          />
                                        </td>
                                        <td className="p-0 w-32 border-r border-slate-850">
                                          <input
                                            id={`input-${item.id}-chiller`}
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={counts.chiller}
                                            onChange={(e) => setOpnameCounts({
                                              ...opnameCounts,
                                              [item.id]: { ...counts, chiller: e.target.value }
                                            })}
                                            onKeyDown={(e) => handleExcelKeyDown(e, item.id, 'chiller', idx, activeItems)}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full h-full bg-transparent px-3 py-2 text-xs text-white focus:outline-none focus:bg-emerald-500/10 focus:ring-1 focus:ring-emerald-500/30 text-right transition-all font-mono"
                                          />
                                        </td>
                                        <td className="py-2 px-4 text-center border-r border-slate-850">
                                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                                            {item.satuan}
                                          </span>
                                        </td>
                                        <td className="py-2 px-4 text-slate-500 text-[10px] italic">{item.keterangan || '-'}</td>
                                      </tr>
                                    );
                                  });
                                })()}
                              </tbody>
                            </table>
                          </div>

                          {opnameError && (
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 font-medium shrink-0">
                              {opnameError}
                            </div>
                          )}

                          <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4 shrink-0">
                            <button
                              type="button"
                              onClick={() => setIsStockOpnameModalOpen(false)}
                              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              onClick={() => setOpnameStatusSubmit('draft')}
                              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all"
                            >
                              {editingStockOpname ? 'Simpan Draft' : 'Simpan sebagai Draft'}
                            </button>
                            <button
                              type="submit"
                              onClick={() => setOpnameStatusSubmit('selesai')}
                              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-955 transition-all shadow-md shadow-emerald-950/20"
                            >
                              Selesaikan Opname
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* OPNAME HISTORY LIST CONTAINER */}
                  <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-white">Riwayat Stock Opname Harian</h3>
                          <button
                            onClick={handleOpenCreateStockOpname}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            + Catat Stock Opname
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 font-medium">
                          Rekam data sisa persediaan di lemari es (Freezer) dan pendingin (Chiller) harian.
                        </p>
                      </div>

                      {/* Filter Range Tanggal */}
                      <div className="flex items-center gap-2 bg-[#090d16]/30 border border-slate-800/50 p-2 rounded-2xl">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          <span>Filter:</span>
                        </div>
                        <input
                          type="date"
                          value={filterOpnameStart}
                          onChange={(e) => setFilterOpnameStart(e.target.value)}
                          className="bg-[#0d1222] border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none"
                        />
                        <span className="text-xs text-slate-600">-</span>
                        <input
                          type="date"
                          value={filterOpnameEnd}
                          onChange={(e) => setFilterOpnameEnd(e.target.value)}
                          className="bg-[#0d1222] border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none"
                        />
                        {(filterOpnameStart || filterOpnameEnd) && (
                          <button
                            onClick={() => { setFilterOpnameStart(''); setFilterOpnameEnd(''); }}
                            className="text-[10px] font-bold text-rose-400 hover:text-rose-350 ml-1.5"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {(() => {
                        const filtered = stockOpnames.filter(op => {
                          if (filterOpnameStart && op.tanggal < filterOpnameStart) return false;
                          if (filterOpnameEnd && op.tanggal > filterOpnameEnd) return false;
                          return true;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="text-center py-10 text-slate-500 text-xs">
                              Tidak ada riwayat catatan stock opname harian yang cocok.
                            </div>
                          );
                        }

                        return filtered.map((op) => {
                          const isExpanded = expandedOpnameId === op.id;
                          const dateParts = op.tanggal.split('-');
                          const indonesianDate = dateParts.length === 3
                            ? `${dateParts[2]} ${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][parseInt(dateParts[1]) - 1]} ${dateParts[0]}`
                            : op.tanggal;

                          return (
                            <div
                              key={op.id}
                              className="bg-[#090d16]/30 border border-slate-855 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-800"
                            >
                              {/* Sesi Header Row */}
                              <div
                                className="px-6 py-4 flex items-center justify-between cursor-pointer select-none bg-[#0a0f1d]/20"
                                onClick={() => setExpandedOpnameId(isExpanded ? null : op.id)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`p-2.5 rounded-xl border transition-all ${isExpanded ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                                    }`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="block text-xs font-black text-white">{indonesianDate}</span>
                                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${op.status === 'selesai'
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>
                                        {op.status === 'selesai' ? 'SELESAI' : 'DRAFT'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                      <span>Jam: {op.jam.slice(0, 5)} WIB</span>
                                      <span>Checker: {op.checker}</span>
                                      <span>Jumlah Barang: {op.details?.length || 0}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                  {op.status === 'draft' && (
                                    <button
                                      onClick={() => handleOpenEditStockOpname(op)}
                                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/15 text-xs font-bold transition-all"
                                    >
                                      Ubah Draft
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handlePrintOpname(op)}
                                    className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/15 text-xs font-bold transition-all flex items-center gap-1.5"
                                    title="Cetak Hasil Stock Opname ke PDF"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.821V21h10.56v-7.179m-12-6.042A2 2 0 017.2 4.5h9.6a2 2 0 012 2.379m-13.2 0A2.5 2.5 0 003 9.3v5.4a2.5 2.5 0 002.5 2.5h13a2.5 2.5 0 002.5-2.5V9.3a2.5 2.5 0 00-2.5-2.5m-13.2 0h13.2" />
                                    </svg>
                                    Cetak
                                  </button>

                                  <button
                                    onClick={() => setExpandedOpnameId(isExpanded ? null : op.id)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
                                  >
                                    {isExpanded ? 'Tutup Detail' : 'Lihat Detail'}
                                    <svg className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>

                                  {(currentUser.role === 'owner' || currentUser.role === 'manager') && (
                                    <button
                                      onClick={() => handleDeleteStockOpname(op.id)}
                                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/15 transition-all"
                                      title="Hapus Sesi Stock Opname"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Details Grid Expansion */}
                              {isExpanded && (
                                <div className="border-t border-slate-850/80 bg-[#090d16]/40 p-5 animate-in slide-in-from-top-2 duration-200">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2 flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daftar Rincian Stok Persediaan</h4>
                                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${op.status === 'selesai'
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>
                                        STATUS: {op.status === 'selesai' ? 'SELESAI' : 'DRAFT'}
                                      </span>
                                    </div>

                                    <div className="col-span-1 md:col-span-2 overflow-x-auto">
                                      <table className="w-full text-xs text-left text-slate-350">
                                        <thead>
                                          <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                                            <th className="py-2 px-3">Nama Barang</th>
                                            <th className="py-2 px-3 text-right">Stok Freezer</th>
                                            <th className="py-2 px-3 text-right">Stok Chiller</th>
                                            <th className="py-2 px-3 text-right">Total Stok</th>
                                            <th className="py-2 px-3">Satuan</th>
                                            <th className="py-2 px-3">Keterangan</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {op.details?.map((dtl) => {
                                            const freezer = Number(dtl.stock_freezer) || 0;
                                            const chiller = Number(dtl.stock_chiller) || 0;
                                            const total = freezer + chiller;
                                            return (
                                              <tr key={dtl.id} className="border-b border-slate-850/40 hover:bg-slate-900/20">
                                                <td className="py-2 px-3 font-bold text-white capitalize">{dtl.item?.nama_barang || `Barang ID ${dtl.item_id}`}</td>
                                                <td className="py-2 px-3 text-right font-mono font-medium text-slate-400">{freezer}</td>
                                                <td className="py-2 px-3 text-right font-mono font-medium text-slate-400">{chiller}</td>
                                                <td className="py-2 px-3 text-right font-mono font-black text-emerald-400">{total}</td>
                                                <td className="py-2 px-3">
                                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-750">
                                                    {dtl.item?.satuan || 'Pcs'}
                                                  </span>
                                                </td>
                                                <td className="py-2 px-3 text-slate-500 text-[10px] italic">{dtl.item?.keterangan || '-'}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                </div>
              )}

            </main>
          </div>
        )}

        {/* EDIT MODAL (Owner Only) */}
        {editingTx && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl relative">
              <h3 className="text-base font-bold text-white mb-2">Koreksi Data Transaksi</h3>
              <p className="text-xs text-slate-400 mb-4">Pengeditan data transaksi masa lalu (Owner Mode).</p>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tanggal</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Shift</label>
                    <select
                      value={editShift}
                      onChange={(e) => setEditShift(e.target.value as any)}
                      className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="pagi">Pagi</option>
                      <option value="siang">Siang</option>
                      <option value="malam">Malam</option>
                      {(currentUser?.role === 'owner' || editShift === 'operational') && (
                        <option value="operational">Operasional</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kategori</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nama_kategori}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nominal</label>
                  <input
                    type="number"
                    value={editNominal}
                    onChange={(e) => setEditNominal(e.target.value)}
                    className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Keterangan</label>
                  <input
                    type="text"
                    value={editKeterangan}
                    onChange={(e) => setEditKeterangan(e.target.value)}
                    className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTx(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-400 transition-all"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT USER MODAL (Owner Only) */}
        {editingUser && currentUser?.role === 'owner' && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl relative">
              <h3 className="text-base font-bold text-white mb-2">Manajemen Peran & Detail Pengguna</h3>
              <p className="text-xs text-slate-400 mb-4 font-medium">Ubah kredensial atau peran otorisasi pengguna.</p>

              <form onSubmit={handleSaveEditUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama Pengguna (Username)</label>
                  <input
                    type="text"
                    value={editUserUsername}
                    onChange={(e) => setEditUserUsername(e.target.value)}
                    className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Peran Akses (Role)</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as 'kasir' | 'manager' | 'owner')}
                    className="w-full bg-[#0d1222] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                  >
                    <option value="kasir">KASIR</option>
                    <option value="manager">MANAGER</option>
                    <option value="owner">OWNER (PEMILIK)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-400 transition-all"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CUSTOM CONFIRMATION DIALOG MODAL */}
        {isConfirmOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#090d16] border border-rose-500/20 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              {/* Warning icon */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto mb-4 border border-rose-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <h3 className="text-base font-extrabold text-white text-center mb-2">{confirmTitle}</h3>
              <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">{confirmMessage}</p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmOpen(false);
                    setOnConfirmAction(null);
                  }}
                  className="w-1/2 py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 transition-all active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsConfirmOpen(false);
                    if (onConfirmAction) {
                      await onConfirmAction();
                    }
                    setOnConfirmAction(null);
                  }}
                  className="w-1/2 py-2.5 bg-rose-500 text-slate-950 text-xs font-extrabold rounded-xl hover:bg-rose-400 hover:shadow-lg hover:shadow-rose-500/10 transition-all active:scale-95"
                >
                  Hapus Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="max-w-6xl mx-auto px-6 mt-16 text-center text-xs text-slate-600">
          <p>Aplikasi Pencatatan Serba Serbi © 2026. Semua Hak Dilindungi.</p>
          <p className="mt-1">Dibuat menggunakan Next.js, Tailwind CSS, dan Supabase.</p>
        </footer>

      </div> {/* Closing print:hidden wrapper */}

      {/* STYLE SHEET PRINT PERMANEN DI DOM UNTUK MENCEGAH RACE CONDITION */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #main-app-content, .print-hidden-fallback {
            display: none !important;
          }
          #print-section {
            display: block !important;
            position: relative !important;
            width: 8.5in !important;
            height: 10.5in !important;
            padding: 0px 0.45in 0.35in 0.45in !important;
            margin: 0 auto !important;
            background: white !important;
            color: black !important;
            box-sizing: border-box !important;
            font-family: Arial, sans-serif !important;
          }
          #print-section * {
            color: #000000 !important;
            background-color: transparent !important;
            border-color: #000000 !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 0px !important;
            border-bottom: none !important;
          }
          .print-table tr:last-child td {
            border-bottom: none !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #000000 !important;
            padding: 2.2px 6px !important;
            font-size: 10.5px !important;
            line-height: 1.15 !important;
          }
          .print-table th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
          }
          @page {
            size: letter portrait !important;
            margin: 0 !important;
          }
        }
      `}} />

      {/* SECTION UNTUK CETAK PDF (Letter Size, 1 Halaman, Format Sesuai PDF Template) */}
      {printOpname && (
        <div id="print-section" className="hidden print:block text-black bg-white">
          {/* Header Title */}
          <div className="text-center m-0 p-0" style={{ marginTop: '-2px' }}>
            <h1 className="text-[15px] font-bold uppercase tracking-wide text-black underline m-0 p-0" style={{ textDecoration: 'underline' }}>
              STOCK OPNAME
            </h1>
          </div>

          {/* Metadata Row */}
          <div className="flex justify-between text-[11px] text-black font-medium pb-1 mb-0">
            <div>
              <span>Hari - Tanggal - Jam : </span>
              <span className="font-bold">
                {(() => {
                  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                  const dateObj = new Date(printOpname.tanggal);
                  const dayName = days[dateObj.getDay()] || 'Hari';

                  const dateParts = printOpname.tanggal.split('-');
                  const formattedDate = dateParts.length === 3
                    ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
                    : printOpname.tanggal;

                  return `${dayName}, ${formattedDate} - ${printOpname.jam.slice(0, 5)} WIB`;
                })()}
              </span>
            </div>
            <div>
              <span>Checker : </span>
              <span className="font-bold capitalize">{printOpname.checker}</span>
            </div>
          </div>

          {/* Single Table (Fits 56 items on 1 Letter Page) */}
          <table className="print-table w-full border-collapse border border-black text-black">
            <thead>
              <tr className="bg-gray-150 font-bold border-b border-black text-[11px]">
                <th className="border border-black px-2 py-1 text-left w-72">Nama Barang</th>
                <th className="border border-black px-2 py-1 text-center w-[82px]">Stock Freezer</th>
                <th className="border border-black px-2 py-1 text-center w-[82px]">Stock Chiller</th>
                <th className="border border-black px-2 py-1 text-center w-16">Satuan</th>
                <th className="border border-black px-2 py-1 text-left w-32">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {printOpname.details?.map((dtl) => {
                const freezer = Number(dtl.stock_freezer) || 0;
                const chiller = Number(dtl.stock_chiller) || 0;
                const itemObj = dtl.item || (dtl as any).mst_stocks;
                const name = itemObj?.nama_barang || `Barang ID ${dtl.item_id}`;
                const unit = itemObj?.satuan || 'Pcs';
                const desc = itemObj?.keterangan || '-';

                // Special name formatting for Lap row to match the PDF
                const displayName = name.toLowerCase().includes('lap (')
                  ? `${name} : ( ) ( ) ( ) ( ) ( ) ( )`
                  : name;

                return (
                  <tr key={dtl.id} className="border-b border-black">
                    <td className="border border-black px-2 py-0.5 capitalize font-medium">{displayName}</td>
                    <td className="border border-black px-2 py-0.5 text-center font-mono">{freezer}</td>
                    <td className="border border-black px-2 py-0.5 text-center font-mono">{chiller}</td>
                    <td className="border border-black px-2 py-0.5 text-center">{unit}</td>
                    <td className="border border-black px-2 py-0.5 text-left text-[10.5px] italic text-gray-700">{desc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
