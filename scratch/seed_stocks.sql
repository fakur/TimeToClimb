-- 1. Create Tables
CREATE TABLE IF NOT EXISTS mst_stocks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nama_barang VARCHAR(255) NOT NULL UNIQUE,
    satuan VARCHAR(50) NOT NULL,
    keterangan TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_opname (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    jam TIME NOT NULL DEFAULT CURRENT_TIME,
    checker VARCHAR(255) NOT NULL,
    created_user_id BIGINT REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'selesai')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_opname_details (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    opname_id BIGINT NOT NULL REFERENCES stock_opname(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES mst_stocks(id) ON DELETE RESTRICT,
    stock_freezer NUMERIC(15, 2) DEFAULT 0,
    stock_chiller NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Disable RLS
ALTER TABLE mst_stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opname DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opname_details DISABLE ROW LEVEL SECURITY;

-- 3. Seed initial 56 items
INSERT INTO mst_stocks (nama_barang, satuan, keterangan) VALUES
('Burger Bun', 'Pcs', '1 pack isi 6 pcs'),
('Sausage Bun', 'Pcs', '1 pack isi 4 pcs'),
('Beef Patty Small', 'Pcs', '1 pack isi 20 pcs'),
('Beef Patty Large', 'Pcs', '1 pack isi 20 pcs'),
('Sosis', 'Pcs', '1 Pack isi 15pcs'),
('Ayam Crispy', 'Pcs', '1 Pack isi 10pcs'),
('Dori Crispy', 'Pcs', '1 pack isi 10 pcs'),
('Spicy Chicken Nugget', 'Pcs', '1 pack berat 1000 gram'),
('Chicken Nugget', 'Pcs', '1 pack berat 500 gram'),
('Spicy Chicken Patty', 'Pcs', '1 Pack isi 14 Pcs'),
('Bangor Fried Chicken', 'Pcs', '1 Pack isi 10 Pcs'),
('Sliced Beef', 'Pcs', '1 pack berat 500 gram'),
('Smoke Beef Slice', 'Pcs', '1 pack isi 20 pcs'),
('Chicken Wings', 'Pcs', '1 pack isi 42 pcs'),
('Cheese Slice', 'Pcs', '1 pack isi 84 pcs'),
('Kentang Goreng (Kentang Kecil)', 'Pack', '1 bungkus isi 20 pack'),
('Kentang Goreng McCain (Kentang Gede)', 'Pack', '1 bungkus isi 10 pack'),
('Thousand Island Mayonaise', 'Pack', '1 pack berat 500 gram'),
('Butter', 'Pack', '1 Pack'),
('BBQ Sauce', 'Pack', '1 pack berat 500 gram'),
('BBQ Spicy', 'Pack', '1 pack berat 501 gram'),
('Bolognese Sauce', 'Pack', '1 pack berat 500 gram'),
('Cheese Sauce', 'Pack', '1 pack berat 1 Kg'),
('Nachos Sauce', 'Pack', '1 pack berat 500 gram'),
('Mayonaise Garlic', 'Pack', '1 pack'),
('Saos Sambel Sachet', 'Pack', '1 dus isi 4 pack'),
('Saus Tomat Delmonte', 'Pack', '1 Pack berat 1kg'),
('Lemon Tea', 'Pack', '1 pack berat 1 kg'),
('Minyak Padat', 'Kardus', '1 dus berat 15 kg'),
('Kertas Nasi/Burger', 'Lembar', '1 pack isi 1000 lembar'),
('Kertas Kentang', 'Lembar', '1 ikat isi 50 lembar'),
('Paper Tray Kentang', 'Lembar', '1 ikat 50 pcs'),
('Paper Bag', 'Lembar', '1 ikat isi 50 lembar'),
('Packaging Box', 'Pcs', '1 ikat isi 50 pcs'),
('Packaging Hotdog', 'Pcs', '1 ikat isi 50 pcs'),
('Dus Hampers', 'Pack', '1 pcs'),
('Sticker Labelling', 'Pcs', 'isi 200pcs'),
('Grill Box dan Inner nya', 'Pcs', '1 pcs'),
('Bangor Crazy Bucket', 'Set', '1 Pack isi 12 Set'),
('Coca Cola/Sprite/Fanta 250ml', 'Botol', '1 krat isi 12 botol'),
('Freshtea 350ml', 'Botol', '1 krat isi 12 botol'),
('Air Mineral 330ml', 'Botol', '1 kardus isi 24'),
('Telur', 'Butir', '-'),
('Kertas Printer', 'Roll', '1 pack isi 10 roll'),
('Gelas Cup + Tutup', 'Pack', '1 pack isi 50 pasang'),
('Sedotan', 'Pack', '1 pack'),
('Kresek Kecil', 'Pack', '1 pack'),
('Kresek Besar', 'Pack', '1 pack'),
('Kresek Gelas', 'Pack', '1 pack'),
('Cup Sauce 35 ml', 'Pcs', '1 pack isi 50 pcs'),
('Tissue', 'Pack', '1 pack'),
('Hand Gloves', 'Bungkus', '1 kotak'),
('Plester/Selotip', 'Pack', '1 pack'),
('Listrik', 'Kwh', '-'),
('Tas Spunbond', 'Pcs', '1 pack isi 50 pcs'),
('Lap (Merah)(Kuning)(Hijau)(Biru)(Coklat)(Serbet)', 'Lembar', '-');
