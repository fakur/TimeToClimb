import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './lib/supabaseClient';
import {
  loginUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
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
  deleteStockOpname,
  getMonthlyReport,
  User,
  KategoriTransaksi,
  TrxDtl,
  MstStock,
  StockOpname
} from './lib/db';
import { generateOpnamePDF } from './lib/pdf';

// Screen dimensions
const { width, height } = Dimensions.get('window');

type ActiveTab = 
  | 'dashboard' 
  | 'transaction' 
  | 'transaction_dtl' 
  | 'stock_opname' 
  | 'history' 
  | 'categories' 
  | 'stock_items' 
  | 'reports' 
  | 'users';

export default function App() {
  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Connection Indicator
  const [isConnected, setIsConnected] = useState(true);

  // Global Data States
  const [usersList, setUsersList] = useState<User[]>([]);
  const [categories, setCategories] = useState<KategoriTransaksi[]>([]);
  const [stockItems, setStockItems] = useState<MstStock[]>([]);
  const [stockOpnames, setStockOpnames] = useState<StockOpname[]>([]);
  const [trxDetails, setTrxDetails] = useState<TrxDtl[]>([]);

  // Selected date filter for transactions & opname
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Form Modals Active states
  const [isTrxModalOpen, setIsTrxModalOpen] = useState(false);
  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStockItemModalOpen, setIsStockItemModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Input states for Cash Flow transaction
  const [trxShift, setTrxShift] = useState<'pagi' | 'siang' | 'malam' | 'operational'>('pagi');
  const [trxCategory, setTrxCategory] = useState<string>('');
  const [trxNominal, setTrxNominal] = useState('');
  const [trxKeterangan, setTrxKeterangan] = useState('');
  const [trxSaldoAwal, setTrxSaldoAwal] = useState('0');
  const [editingTrx, setEditingTrx] = useState<TrxDtl | null>(null);

  // Input states for Stock Opname
  const [opnameChecker, setOpnameChecker] = useState('');
  const [opnameCounts, setOpnameCounts] = useState<Record<number, { freezer: string; chiller: string }>>({});
  const [isDraftMode, setIsDraftMode] = useState(true);
  const [editingOpname, setEditingOpname] = useState<StockOpname | null>(null);
  const [expandedOpnameId, setExpandedOpnameId] = useState<number | null>(null);

  // Input states for Master Items
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [categoryIdInput, setCategoryIdInput] = useState('');
  const [editingCategory, setEditingCategory] = useState<KategoriTransaksi | null>(null);

  const [stockItemName, setStockItemName] = useState('');
  const [stockItemUnit, setStockItemUnit] = useState('Pcs');
  const [stockItemDesc, setStockItemDesc] = useState('');
  const [editingStockItem, setEditingStockItem] = useState<MstStock | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState<'kasir' | 'manager' | 'owner'>('kasir');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Monthly Report State
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  // Load Session on startup
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user_session');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkSession();
  }, []);

  // Fetch all basic data once authenticated
  useEffect(() => {
    if (currentUser) {
      fetchGlobalData();
    }
  }, [currentUser]);

  const fetchGlobalData = async () => {
    setLoading(true);
    try {
      const [cats, items, opnames, trxs, users] = await Promise.all([
        getCategories(),
        getStockItems(),
        getStockOpnames(),
        getTrxDetails(),
        getUsers()
      ]);
      setCategories(cats);
      setStockItems(items);
      setStockOpnames(opnames);
      setTrxDetails(trxs);
      setUsersList(users);
      setIsConnected(true);
    } catch (err) {
      setIsConnected(false);
      Alert.alert('Koneksi Gagal', 'Gagal memuat data dari Supabase online.');
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (username: string) => {
    if (!username.trim()) {
      Alert.alert('Error', 'Silakan masukkan nama pengguna.');
      return;
    }
    setLoading(true);
    try {
      const user = await loginUser(username);
      if (user) {
        await AsyncStorage.setItem('user_session', JSON.stringify(user));
        setCurrentUser(user);
      } else {
        Alert.alert('Login Gagal', 'Nama pengguna tidak terdaftar.');
      }
    } catch (err) {
      Alert.alert('Error', 'Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    Alert.alert('Konfirmasi', 'Apakah Anda yakin ingin keluar dari sistem?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('user_session');
          setCurrentUser(null);
          setUsersList([]);
          setCategories([]);
          setStockItems([]);
          setStockOpnames([]);
          setTrxDetails([]);
        }
      }
    ]);
  };

  // Financial Calculators
  const getSummary = () => {
    const todayTrxs = trxDetails.filter(t => t.created_at.startsWith(selectedDate));
    
    let pemasukan = 0;
    let pengeluaran = 0;
    
    todayTrxs.forEach(t => {
      const cat = categories.find(c => c.id === t.kategori_id);
      if (cat) {
        if (cat.tipe === 'pemasukan') pemasukan += Number(t.nominal);
        else pengeluaran += Number(t.nominal);
      }
    });

    const saldoHariIni = pemasukan - pengeluaran;
    
    // Total global cash calculated
    let totalAllPemasukan = 0;
    let totalAllPengeluaran = 0;
    
    trxDetails.forEach(t => {
      const cat = categories.find(c => c.id === t.kategori_id);
      if (cat) {
        if (cat.tipe === 'pemasukan') totalAllPemasukan += Number(t.nominal);
        else totalAllPengeluaran += Number(t.nominal);
      }
    });

    return {
      todayPemasukan: pemasukan,
      todayPengeluaran: pengeluaran,
      todaySaldo: saldoHariIni,
      globalSaldo: totalAllPemasukan - totalAllPengeluaran
    };
  };

  const formatIDR = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  // CRUD Actions
  // 1. Save cash flow
  const handleSaveTransaction = async () => {
    if (!trxCategory || !trxNominal) {
      Alert.alert('Error', 'Silakan pilih Kategori dan isi Nominal.');
      return;
    }

    setLoading(true);
    try {
      if (editingTrx) {
        // Edit flow
        await updateTrxDetail(editingTrx.id, {
          kategori_id: Number(trxCategory),
          nominal: Number(trxNominal),
          keterangan: trxKeterangan
        }, currentUser?.id || 1);
        Alert.alert('Sukses', 'Transaksi berhasil diubah.');
      } else {
        // Create flow
        await createTrxDetail(
          selectedDate,
          Number(trxCategory),
          Number(trxNominal),
          trxKeterangan,
          currentUser?.id || 1
        );
        Alert.alert('Sukses', 'Aliran kas berhasil dicatat.');
      }
      setIsTrxModalOpen(false);
      setEditingTrx(null);
      setTrxNominal('');
      setTrxKeterangan('');
      fetchGlobalData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrx = (id: number) => {
    Alert.alert('Hapus Transaksi', 'Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini akan tercatat dalam log audit.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await deleteTrxDetail(id);
            Alert.alert('Sukses', 'Transaksi berhasil dihapus.');
            fetchGlobalData();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  // 2. Save Stock Opname
  const handleSaveOpname = async () => {
    if (!opnameChecker.trim()) {
      Alert.alert('Error', 'Silakan isi nama Checker.');
      return;
    }

    // Prepare details array
    const details = stockItems.map(item => {
      const counts = opnameCounts[item.id] || { freezer: '0', chiller: '0' };
      return {
        item_id: item.id,
        stock_freezer: Number(counts.freezer) || 0,
        stock_chiller: Number(counts.chiller) || 0
      };
    });

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    setLoading(true);
    try {
      await createStockOpname(
        selectedDate,
        timeStr,
        opnameChecker,
        currentUser?.id || 1,
        isDraftMode ? 'draft' : 'selesai',
        details
      );
      Alert.alert('Sukses', `Stock Opname berhasil disimpan sebagai ${isDraftMode ? 'Draft' : 'Selesai'}.`);
      setIsOpnameModalOpen(false);
      setOpnameChecker('');
      setOpnameCounts({});
      fetchGlobalData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOpname = (id: number) => {
    Alert.alert('Hapus Opname', 'Apakah Anda yakin ingin menghapus riwayat opname ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await deleteStockOpname(id);
            Alert.alert('Sukses', 'Sesi stock opname berhasil dihapus.');
            fetchGlobalData();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  // 3. Save Category (Master)
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Nama kategori tidak boleh kosong.');
      return;
    }
    setLoading(true);
    try {
      if (editingCategory) {
        // Update flow
        const payload: any = { tipe: categoryType };
        if (editingCategory.nama_kategori !== categoryName) {
          payload.nama_kategori = categoryName;
        }
        await updateCategory(editingCategory.id, payload);
        Alert.alert('Sukses', 'Kategori berhasil diupdate.');
      } else {
        // Create flow
        await createCategory(
          categoryName,
          categoryType,
          categoryIdInput ? Number(categoryIdInput) : undefined
        );
        Alert.alert('Sukses', 'Kategori berhasil ditambahkan.');
      }
      setIsCategoryModalOpen(false);
      setCategoryName('');
      setCategoryIdInput('');
      setEditingCategory(null);
      fetchGlobalData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Save Stock Item (Master)
  const handleSaveStockItem = async () => {
    if (!stockItemName.trim()) {
      Alert.alert('Error', 'Nama barang tidak boleh kosong.');
      return;
    }
    setLoading(true);
    try {
      if (editingStockItem) {
        await updateStockItem(editingStockItem.id, {
          nama_barang: stockItemName,
          satuan: stockItemUnit,
          keterangan: stockItemDesc
        });
        Alert.alert('Sukses', 'Barang berhasil diupdate.');
      } else {
        await createStockItem(stockItemName, stockItemUnit, stockItemDesc);
        Alert.alert('Sukses', 'Barang berhasil ditambahkan.');
      }
      setIsStockItemModalOpen(false);
      setStockItemName('');
      setStockItemDesc('');
      setEditingStockItem(null);
      fetchGlobalData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. Save User (Admin)
  const handleSaveUser = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Nama pengguna tidak boleh kosong.');
      return;
    }
    setLoading(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          username: newUsername,
          role: newUserRole
        });
        Alert.alert('Sukses', 'Akun pengguna berhasil diupdate.');
      } else {
        await createUser(newUsername, newUserRole);
        Alert.alert('Sukses', 'Akun pengguna baru berhasil dibuat.');
      }
      setIsUserModalOpen(false);
      setNewUsername('');
      setEditingUser(null);
      fetchGlobalData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render Functions for Views
  const renderLoginScreen = () => {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.loginCard}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>⛰️</Text>
          </View>
          <Text style={styles.loginTitle}>TIME TO CLIMB</Text>
          <Text style={styles.loginSubtitle}>Sistem Keuangan Harian</Text>

          <TextInput
            placeholder="Masukkan Nama Pengguna"
            placeholderTextColor="#64748b"
            value={usernameInput}
            onChangeText={setUsernameInput}
            style={styles.loginInput}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => handleLogin(usernameInput)}
          >
            <Text style={styles.loginButtonText}>Masuk</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>SIMULASI AKUN DEMO</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.demoButtonsContainer}>
            <TouchableOpacity
              style={[styles.demoButton, { borderColor: '#10b981' }]}
              onPress={() => { setUsernameInput('budi'); handleLogin('budi'); }}
            >
              <Text style={[styles.demoButtonText, { color: '#10b981' }]}>Budi (Kasir)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoButton, { borderColor: '#6366f1' }]}
              onPress={() => { setUsernameInput('rudi'); handleLogin('rudi'); }}
            >
              <Text style={[styles.demoButtonText, { color: '#6366f1' }]}>Rudi (Manager)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoButton, { borderColor: '#8b5cf6' }]}
              onPress={() => { setUsernameInput('anton'); handleLogin('anton'); }}
            >
              <Text style={[styles.demoButtonText, { color: '#8b5cf6' }]}>Anton (Owner)</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };

  const renderDashboard = () => {
    const summary = getSummary();
    return (
      <ScrollView style={styles.viewScroll}>
        {/* Connection status warning */}
        {!isConnected && (
          <View style={styles.offlineWarning}>
            <Text style={styles.offlineText}>Koneksi Offline (Database Bermasalah)</Text>
          </View>
        )}

        {/* Global Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Saat Ini (Kas Usaha)</Text>
          <Text style={[styles.balanceValue, { color: summary.globalSaldo >= 0 ? '#34d399' : '#f87171' }]}>
            {formatIDR(summary.globalSaldo)}
          </Text>
          <Text style={styles.balanceDesc}>Total pemasukan bersih dikurangi pengeluaran operasional toko.</Text>
        </View>

        {/* Summary Info Cards */}
        <Text style={styles.sectionHeader}>RINCIAN HARI INI ({selectedDate})</Text>
        
        <View style={styles.rowCards}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>PEMASUKAN</Text>
            <Text style={[styles.infoCardVal, { color: '#38bdf8' }]}>{formatIDR(summary.todayPemasukan)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>PENGELUARAN</Text>
            <Text style={[styles.infoCardVal, { color: '#fb923c' }]}>{formatIDR(summary.todayPengeluaran)}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { marginTop: 12, width: '100%' }]}>
          <Text style={styles.infoCardLabel}>LABA BERSIH HARIAN</Text>
          <Text style={[styles.infoCardVal, { fontSize: 20, color: summary.todaySaldo >= 0 ? '#34d399' : '#f87171' }]}>
            {formatIDR(summary.todaySaldo)}
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderTransactionTab = () => {
    const todayDetails = trxDetails.filter(t => t.created_at.startsWith(selectedDate));
    return (
      <View style={styles.tabContainer}>
        <View style={styles.tabHeaderRow}>
          <Text style={styles.tabTitle}>Pencatatan Closing Harian</Text>
          <TouchableOpacity
            style={styles.primaryAddBtn}
            onPress={() => {
              setEditingTrx(null);
              setTrxNominal('');
              setTrxKeterangan('');
              setIsTrxModalOpen(true);
            }}
          >
            <Text style={styles.primaryAddBtnText}>+ Catat Kas</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.tabScroll}>
          {todayDetails.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada catatan aliran kas hari ini.</Text>
          ) : (
            todayDetails.map(t => {
              const cat = categories.find(c => c.id === t.kategori_id);
              const isPemasukan = cat?.tipe === 'pemasukan';
              return (
                <View key={t.id} style={styles.itemCard}>
                  <View style={styles.itemCardHeader}>
                    <Text style={[styles.itemCardCategory, { color: isPemasukan ? '#38bdf8' : '#fb923c' }]}>
                      {cat?.nama_kategori || 'Kategori ' + t.kategori_id}
                    </Text>
                    <Text style={[styles.itemCardNominal, { color: isPemasukan ? '#34d399' : '#f87171' }]}>
                      {isPemasukan ? '+' : '-'} {formatIDR(t.nominal)}
                    </Text>
                  </View>
                  <Text style={styles.itemCardDesc}>{t.keterangan || '-'}</Text>
                  <View style={styles.itemCardFooter}>
                    <Text style={styles.itemCardUser}>Oleh: {currentUser?.username}</Text>
                    <View style={styles.itemCardActions}>
                      <TouchableOpacity 
                        style={styles.editBtn}
                        onPress={() => {
                          setEditingTrx(t);
                          setTrxCategory(String(t.kategori_id));
                          setTrxNominal(String(t.nominal));
                          setTrxKeterangan(t.keterangan || '');
                          setIsTrxModalOpen(true);
                        }}
                      >
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteTrx(t.id)}
                      >
                        <Text style={styles.deleteBtnText}>Hapus</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  const renderStockOpnameTab = () => {
    return (
      <View style={styles.tabContainer}>
        <View style={styles.tabHeaderRow}>
          <Text style={styles.tabTitle}>Pencatatan Stock Opname</Text>
          <TouchableOpacity
            style={styles.primaryAddBtn}
            onPress={() => {
              setOpnameCounts({});
              setOpnameChecker(currentUser?.username || '');
              setIsDraftMode(true);
              setIsOpnameModalOpen(true);
            }}
          >
            <Text style={styles.primaryAddBtnText}>+ Catat Opname</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.tabScroll}>
          {stockOpnames.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada riwayat stock opname harian.</Text>
          ) : (
            stockOpnames.map(op => {
              const isExpanded = expandedOpnameId === op.id;
              const dateParts = op.tanggal.split('-');
              const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : op.tanggal;
              
              return (
                <View key={op.id} style={styles.opnameItemCard}>
                  <TouchableOpacity
                    style={styles.opnameItemHeader}
                    onPress={() => setExpandedOpnameId(isExpanded ? null : op.id)}
                  >
                    <View>
                      <Text style={styles.opnameDateText}>{dateFormatted} - {op.jam.slice(0, 5)} WIB</Text>
                      <Text style={styles.opnameCheckerText}>Checker: {op.checker}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.statusBadge, { backgroundColor: op.status === 'draft' ? '#f59e0b20' : '#10b98120' }]}>
                        <Text style={[styles.statusBadgeText, { color: op.status === 'draft' ? '#f59e0b' : '#10b981' }]}>
                          {op.status.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.expanderIcon}>{isExpanded ? '▲' : '▼'}</Text>
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.opnameDetailsBlock}>
                      {op.details?.map(dtl => {
                        const itemObj = dtl.item || (dtl as any).mst_stocks;
                        const total = Number(dtl.stock_freezer) + Number(dtl.stock_chiller);
                        return (
                          <View key={dtl.id} style={styles.opnameDetailRow}>
                            <Text style={styles.opnameItemName}>{itemObj?.nama_barang}</Text>
                            <Text style={styles.opnameItemQty}>
                              Fz: {dtl.stock_freezer} | Ch: {dtl.stock_chiller} | Tot: {total} {itemObj?.satuan}
                            </Text>
                          </View>
                        );
                      })}

                      <View style={styles.opnameActionsRow}>
                        <TouchableOpacity
                          style={styles.printGcpBtn}
                          onPress={() => generateOpnamePDF(op)}
                        >
                          <Text style={styles.printGcpBtnText}>📄 PDF / Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.deleteBtn, { paddingHorizontal: 12, paddingVertical: 8 }]}
                          onPress={() => handleDeleteOpname(op.id)}
                        >
                          <Text style={styles.deleteBtnText}>Hapus</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  const renderMoreMenuOverlay = () => {
    return (
      <Modal
        visible={isMoreMenuOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsMoreMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsMoreMenuOpen(false)}
        >
          <View style={styles.bottomSheetContainer}>
            <View style={styles.sheetHeaderHandle} />
            <Text style={styles.sheetTitle}>Administrasi & Lainnya</Text>

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => { setActiveTab('history'); setIsMoreMenuOpen(false); }}
            >
              <Text style={styles.sheetItemText}>Riwayat Closing</Text>
            </TouchableOpacity>

            {(currentUser?.role === 'manager' || currentUser?.role === 'owner') && (
              <>
                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => { setActiveTab('reports'); setIsMoreMenuOpen(false); }}
                >
                  <Text style={styles.sheetItemText}>Laporan Bulanan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => { setActiveTab('categories'); setIsMoreMenuOpen(false); }}
                >
                  <Text style={styles.sheetItemText}>Master Jenis Transaksi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => { setActiveTab('stock_items'); setIsMoreMenuOpen(false); }}
                >
                  <Text style={styles.sheetItemText}>Master Barang</Text>
                </TouchableOpacity>
              </>
            )}

            {currentUser?.role === 'owner' && (
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => { setActiveTab('users'); setIsMoreMenuOpen(false); }}
              >
                <Text style={styles.sheetItemText}>Kelola Pengguna</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.sheetItem, { marginTop: 12, borderTopWidth: 1, borderColor: '#334155' }]}
              onPress={handleLogout}
            >
              <Text style={[styles.sheetItemText, { color: '#f87171' }]}>Keluar Akun</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'transaction':
        return renderTransactionTab();
      case 'stock_opname':
        return renderStockOpnameTab();
      default:
        // Render fallback view placeholder for the other admin items
        return (
          <View style={styles.tabContainer}>
            <Text style={styles.tabTitle}>
              Menu: {activeTab.toUpperCase().replace('_', ' ')}
            </Text>
            <Text style={styles.emptyText}>Fitur menu administratif saat ini sedang ditranslasikan penuh ke layout mobile.</Text>
            <TouchableOpacity
              style={[styles.primaryAddBtn, { alignSelf: 'center', marginTop: 24 }]}
              onPress={() => setActiveTab('dashboard')}
            >
              <Text style={styles.primaryAddBtnText}>Kembali ke Dasbor</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  // Modals JSX
  const renderTrxModal = () => {
    return (
      <Modal
        visible={isTrxModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsTrxModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>{editingTrx ? 'Ubah Aliran Kas' : 'Pencatatan Keuangan'}</Text>

            <Text style={styles.inputLabel}>Shift Kerja</Text>
            <View style={styles.radioGroup}>
              {['pagi', 'siang', 'malam', 'operational'].map(sh => (
                <TouchableOpacity
                  key={sh}
                  style={[styles.radioButton, trxShift === sh && styles.radioButtonActive]}
                  onPress={() => setTrxShift(sh as any)}
                >
                  <Text style={styles.radioText}>{sh.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Pilih Kategori</Text>
            <ScrollView horizontal style={{ maxHeight: 50, marginBottom: 12 }}>
              {categories.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.tagButton, trxCategory === String(c.id) && styles.tagButtonActive]}
                  onPress={() => setTrxCategory(String(c.id))}
                >
                  <Text style={styles.tagText}>{c.nama_kategori}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Nominal (Rupiah)</Text>
            <TextInput
              placeholder="Jumlah Rupiah"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              value={trxNominal}
              onChangeText={setTrxNominal}
              style={styles.modalInput}
            />

            <Text style={styles.inputLabel}>Keterangan</Text>
            <TextInput
              placeholder="Detail catatan"
              placeholderTextColor="#64748b"
              value={trxKeterangan}
              onChangeText={setTrxKeterangan}
              style={styles.modalInput}
            />

            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setIsTrxModalOpen(false)}
              >
                <Text style={styles.btnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSave}
                onPress={handleSaveTransaction}
              >
                <Text style={styles.btnSaveText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderOpnameModal = () => {
    return (
      <Modal
        visible={isOpnameModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOpnameModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={[styles.formContainer, { maxHeight: '90%', width: '95%' }]}>
            <Text style={styles.formTitle}>Formulir Stock Opname</Text>

            <Text style={styles.inputLabel}>Checker</Text>
            <TextInput
              value={opnameChecker}
              onChangeText={opnameChecker => setOpnameChecker(opnameChecker)}
              style={styles.modalInput}
            />

            <Text style={styles.inputLabel}>Mode Simpan</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, isDraftMode && styles.radioButtonActive]}
                onPress={() => setIsDraftMode(true)}
              >
                <Text style={styles.radioText}>DRAFT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, !isDraftMode && styles.radioButtonActive]}
                onPress={() => setIsDraftMode(false)}
              >
                <Text style={styles.radioText}>SELESAI / KUNCI</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Daftar Fisik Barang</Text>
            <ScrollView style={{ flex: 1, marginBottom: 12 }}>
              {stockItems.map(item => {
                const vals = opnameCounts[item.id] || { freezer: '', chiller: '' };
                return (
                  <View key={item.id} style={styles.opnameFormRow}>
                    <Text style={styles.opnameFormItemName}>{item.nama_barang}</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TextInput
                        placeholder="Fz"
                        placeholderTextColor="#475569"
                        keyboardType="decimal-pad"
                        value={vals.freezer}
                        onChangeText={txt => {
                          setOpnameCounts(prev => ({
                            ...prev,
                            [item.id]: { ...vals, freezer: txt }
                          }));
                        }}
                        style={styles.opnameInputSmall}
                      />
                      <TextInput
                        placeholder="Ch"
                        placeholderTextColor="#475569"
                        keyboardType="decimal-pad"
                        value={vals.chiller}
                        onChangeText={txt => {
                          setOpnameCounts(prev => ({
                            ...prev,
                            [item.id]: { ...vals, chiller: txt }
                          }));
                        }}
                        style={styles.opnameInputSmall}
                      />
                      <Text style={styles.opnameUnitText}>{item.satuan}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setIsOpnameModalOpen(false)}
              >
                <Text style={styles.btnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSave}
                onPress={handleSaveOpname}
              >
                <Text style={styles.btnSaveText}>Simpan Opname</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  // Main Return JSX
  if (!currentUser) {
    return renderLoginScreen();
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="light-content" />
      {/* Header bar */}
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.appHeaderBrand}>TIME TO CLIMB</Text>
          <Text style={styles.appHeaderRole}>{currentUser.username} ({currentUser.role.toUpperCase()})</Text>
        </View>
        <TouchableOpacity
          style={styles.reloadBtn}
          onPress={fetchGlobalData}
        >
          <Text style={styles.reloadBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Main Screen Container */}
      <View style={styles.mainContentContainer}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Sinkronisasi Supabase...</Text>
          </View>
        ) : (
          renderActiveView()
        )}
      </View>

      {/* Bottom Tabs Nav Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={[styles.tabBarItem, activeTab === 'dashboard' && styles.tabBarItemActive]}
          onPress={() => { setActiveTab('dashboard'); setIsMoreMenuOpen(false); }}
        >
          <Text style={styles.tabBarIcon}>🏠</Text>
          <Text style={styles.tabBarLabel}>Dasbor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBarItem, activeTab === 'transaction' && styles.tabBarItemActive]}
          onPress={() => { setActiveTab('transaction'); setIsMoreMenuOpen(false); }}
        >
          <Text style={styles.tabBarIcon}>📝</Text>
          <Text style={styles.tabBarLabel}>Catat Kas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBarItem, activeTab === 'stock_opname' && styles.tabBarItemActive]}
          onPress={() => { setActiveTab('stock_opname'); setIsMoreMenuOpen(false); }}
        >
          <Text style={styles.tabBarIcon}>📦</Text>
          <Text style={styles.tabBarLabel}>Opname</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          onPress={() => setIsMoreMenuOpen(true)}
        >
          <Text style={styles.tabBarIcon}>⚙️</Text>
          <Text style={styles.tabBarLabel}>Lainnya</Text>
        </TouchableOpacity>
      </View>

      {/* More Options bottom sheet Modal */}
      {renderMoreMenuOverlay()}

      {/* Transaction & Stock Opname Entry Modals */}
      {renderTrxModal()}
      {renderOpnameModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Global Setup
  appContainer: {
    flex: 1,
    backgroundColor: '#020617', // Dark theme background
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a80',
  },
  appHeaderBrand: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  appHeaderRole: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  reloadBtn: {
    padding: 6,
  },
  reloadBtnText: {
    fontSize: 16,
  },
  mainContentContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 10,
  },

  // Login Visuals
  loginContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCard: {
    width: '88%',
    backgroundColor: '#0f172a80',
    borderWidth: 1,
    borderColor: '#33415550',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 32,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  loginSubtitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
    marginBottom: 24,
  },
  loginInput: {
    width: '100%',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#33415550',
  },
  dividerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
    marginHorizontal: 10,
    letterSpacing: 1,
  },
  demoButtonsContainer: {
    width: '100%',
    gap: 8,
  },
  demoButton: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Dashboard Visuals
  viewScroll: {
    padding: 16,
  },
  offlineWarning: {
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef444440',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  offlineText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: '#0f172ab0',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
  },
  balanceDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 12,
    lineHeight: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 12,
  },
  rowCards: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#0f172ab0',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
  },
  infoCardLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  infoCardVal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },

  // Common Tabs Visuals
  tabContainer: {
    flex: 1,
    padding: 16,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  primaryAddBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryAddBtnText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tabScroll: {
    flex: 1,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
  },

  // Cash Flow Item Card
  itemCard: {
    backgroundColor: '#0f172ab0',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCardCategory: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  itemCardNominal: {
    fontSize: 14,
    fontWeight: '900',
  },
  itemCardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
  },
  itemCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#1e293b80',
  },
  itemCardUser: {
    fontSize: 10,
    color: '#64748b',
  },
  itemCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editBtnText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#f43f5e20',
    borderWidth: 1,
    borderColor: '#f43f5e30',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteBtnText: {
    color: '#fb7185',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Stock Opname History Items
  opnameItemCard: {
    backgroundColor: '#0f172ab0',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  opnameItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  opnameDateText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  opnameCheckerText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  expanderIcon: {
    color: '#94a3b8',
    fontSize: 10,
  },
  opnameDetailsBlock: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: '#1e293b50',
  },
  opnameDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#1e293b30',
  },
  opnameItemName: {
    fontSize: 11,
    color: '#cbd5e1',
    textTransform: 'capitalize',
  },
  opnameItemQty: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  opnameActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  printGcpBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  printGcpBtnText: {
    color: '#020617',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Modals Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 24,
    width: '90%',
    padding: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  radioButton: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  radioButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#10b98115',
  },
  radioText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  tagButton: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    alignSelf: 'center',
  },
  tagButtonActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#38bdf815',
  },
  tagText: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  formActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 12,
  },
  btnSave: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSaveText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Stock Opname Form details
  opnameFormRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#1e293b40',
  },
  opnameFormItemName: {
    fontSize: 12,
    color: '#cbd5e1',
    textTransform: 'capitalize',
    flex: 1,
    marginRight: 8,
  },
  opnameInputSmall: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    width: 50,
    paddingVertical: 4,
    paddingHorizontal: 6,
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  opnameUnitText: {
    fontSize: 10,
    color: '#64748b',
    width: 45,
    textAlign: 'left',
    alignSelf: 'center',
    marginLeft: 4,
  },

  // Bottom navigation menu sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#33415550',
    padding: 24,
    maxHeight: '60%',
  },
  sheetHeaderHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  sheetItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },

  // Bottom Navigation Bar Layout
  bottomTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    height: 60,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarItemActive: {
    backgroundColor: '#1e293b40',
  },
  tabBarIcon: {
    fontSize: 18,
  },
  tabBarLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 4,
  },
});
