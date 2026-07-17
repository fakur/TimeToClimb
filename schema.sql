-- =========================================================================
-- SQL MIGRATION: TRANSACTION MASTER-DETAIL REFACTOR & SOFT DELETE SUPPORT
-- =========================================================================
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda untuk memperbarui
-- skema database sesuai dengan model transaksi terbaru dan mendukung Soft Delete.
-- =========================================================================

-- 1. Membuat tabel master_transaksi (Sesi Shift Kerja)
CREATE TABLE IF NOT EXISTS master_transaksi (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tanggal DATE NOT NULL,
    shift VARCHAR(20) NOT NULL CHECK (shift IN ('pagi', 'siang', 'malam', 'operational')),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    saldo_awal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    saldo_akhir NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_user_id BIGINT REFERENCES users(id),
    edited_at TIMESTAMPTZ,
    edited_user_id BIGINT REFERENCES users(id),
    datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
    CONSTRAINT unique_user_date_shift UNIQUE (user_id, tanggal, shift)
);

-- 2. Membuat tabel detail_transaksi (Item Aliran Kas)
CREATE TABLE IF NOT EXISTS detail_transaksi (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    master_transaksi_id BIGINT NOT NULL REFERENCES master_transaksi(id) ON DELETE CASCADE,
    kategori_id BIGINT NOT NULL REFERENCES kategori_transaksi(id) ON DELETE RESTRICT,
    nominal NUMERIC(15, 2) NOT NULL CHECK (nominal >= 0),
    keterangan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_user_id BIGINT REFERENCES users(id),
    edited_at TIMESTAMPTZ,
    edited_user_id BIGINT REFERENCES users(id),
    datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
);

-- 3. Blok Migrasi Data Otomatis & Pencadangan Tabel Lama
DO $$
BEGIN
    -- Hanya berjalan jika tabel lama 'transaksi_harian' masih ada
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transaksi_harian') THEN
        
        -- A. Masukkan data master transaksi dari grouping tanggal & user (diasumsikan Shift Pagi)
        INSERT INTO master_transaksi (tanggal, shift, user_id, saldo_awal, saldo_akhir, created_at, created_user_id)
        SELECT DISTINCT 
            tanggal::DATE, 
            'pagi'::VARCHAR, 
            user_id, 
            0::NUMERIC, 
            0::NUMERIC,
            COALESCE(MIN(created_at), NOW()), 
            user_id
        FROM transaksi_harian
        ON CONFLICT (user_id, tanggal, shift) DO NOTHING;

        -- B. Masukkan detail transaksi yang terhubung ke master data yang baru dibuat
        INSERT INTO detail_transaksi (master_transaksi_id, kategori_id, nominal, keterangan, created_at, created_user_id)
        SELECT 
            m.id, 
            t.kategori_id, 
            t.nominal, 
            t.keterangan, 
            COALESCE(t.created_at, NOW()), 
            t.user_id
        FROM transaksi_harian t
        JOIN master_transaksi m 
            ON m.tanggal = t.tanggal::DATE 
            AND m.user_id = t.user_id 
            AND m.shift = 'pagi';
            
        -- C. Ubah nama tabel lama menjadi 'transaksi_harian_old' sebagai cadangan aman
        ALTER TABLE transaksi_harian RENAME TO transaksi_harian_old;
        
        RAISE NOTICE 'Migrasi skema transaksi harian ke Master-Detail berhasil dilakukan.';
    ELSE
        RAISE NOTICE 'Tabel transaksi_harian tidak ditemukan atau sudah pernah dimigrasikan.';
    END IF;
END $$;

-- 4. Membuat tabel trx_dtl (Transaksi Detail Independen)
CREATE TABLE IF NOT EXISTS trx_dtl (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kategori_id BIGINT NOT NULL REFERENCES kategori_transaksi(id) ON DELETE RESTRICT,
    nominal NUMERIC(15, 2) NOT NULL CHECK (nominal >= 0),
    keterangan TEXT,
    tanggal DATE NOT NULL,
    saldo_awal NUMERIC(15, 2) DEFAULT 0,
    saldo_akhir NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_user_id BIGINT REFERENCES users(id),
    edited_at TIMESTAMPTZ,
    edited_user_id BIGINT REFERENCES users(id),
    datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
);

-- 5. Membuat tabel log_history (Audit Trail Log)
CREATE TABLE IF NOT EXISTS log_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    transaksi_id BIGINT NOT NULL,
    aksi VARCHAR(20) NOT NULL CHECK (aksi IN ('EDIT', 'DELETE')),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    detail_sebelum TEXT NOT NULL,
    detail_sesudah TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
);

-- 6. Membuat tabel mst_stocks (Master Data Barang Persediaan)
CREATE TABLE IF NOT EXISTS mst_stocks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nama_barang VARCHAR(255) NOT NULL UNIQUE,
    satuan VARCHAR(50) NOT NULL,
    keterangan TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
);

-- 7. Membuat tabel stock_opname (Sesi Stock Opname Harian)
CREATE TABLE IF NOT EXISTS stock_opname (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    jam TIME NOT NULL DEFAULT CURRENT_TIME,
    checker VARCHAR(255) NOT NULL,
    created_user_id BIGINT REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'selesai')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
);

-- 8. Membuat tabel stock_opname_details (Detail Item Stock Opname)
CREATE TABLE IF NOT EXISTS stock_opname_details (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    opname_id BIGINT NOT NULL REFERENCES stock_opname(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES mst_stocks(id) ON DELETE RESTRICT,
    stock_freezer NUMERIC(15, 2) DEFAULT 0,
    stock_chiller NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
);

-- =========================================================================
-- OPTIONAL: KONFIGURASI ROW LEVEL SECURITY (RLS) DI DASHBOARD SUPABASE
-- =========================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE kategori_transaksi DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_transaksi DISABLE ROW LEVEL SECURITY;
ALTER TABLE detail_transaksi DISABLE ROW LEVEL SECURITY;
ALTER TABLE log_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE trx_dtl DISABLE ROW LEVEL SECURITY;
ALTER TABLE mst_stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opname DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opname_details DISABLE ROW LEVEL SECURITY;

-- =========================================================================
-- MIGRATION QUERY: JALANKAN INI DI SQL EDITOR SUPABASE UNTUK DATABASE AKTIF
-- =========================================================================
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;
-- ALTER TABLE kategori_transaksi ADD COLUMN IF NOT EXISTS datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;
-- ALTER TABLE master_transaksi ADD COLUMN IF NOT EXISTS datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;
-- ALTER TABLE detail_transaksi ADD COLUMN IF NOT EXISTS datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;
-- ALTER TABLE trx_dtl ADD COLUMN IF NOT EXISTS datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;
-- ALTER TABLE log_history ADD COLUMN IF NOT EXISTS datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;
-- ALTER TABLE mst_stocks ADD COLUMN IF NOT EXISTS datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;
-- ALTER TABLE stock_opname ADD COLUMN IF NOT EXISTS datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;
-- ALTER TABLE stock_opname_details ADD COLUMN IF NOT EXISTS datastatus VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;
