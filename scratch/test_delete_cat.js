const { createClient } = require('@supabase/supabase-js');

const url = 'https://qpcaommapqxvtlqpfmwt.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwY2FvbW1hcHF4dnRscXBmbXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjcxNDQsImV4cCI6MjA5Nzg0MzE0NH0.CnciEeQZ5I4aKsJereHVTxBDxwZvydd3P-xN0DYnIRU';

const supabase = createClient(url, key);

async function main() {
  try {
    console.log('1. Creating a new category...');
    const { data: cat, error: insErr } = await supabase
      .from('kategori_transaksi')
      .insert([{ nama_kategori: 'Test Unused Delete Category', tipe: 'pemasukan' }])
      .select()
      .single();

    if (insErr) {
      console.log('Insert error:', insErr);
      return;
    }
    console.log('Inserted category:', cat);

    console.log('2. Trying to delete it...');
    const { error: delErr } = await supabase
      .from('kategori_transaksi')
      .delete()
      .eq('id', cat.id);

    if (delErr) {
      console.log('Delete error:', delErr);
    } else {
      console.log('Delete success!');
    }
  } catch (e) {
    console.error(e);
  }
}

main();
