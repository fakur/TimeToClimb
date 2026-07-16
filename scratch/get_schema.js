const { createClient } = require('@supabase/supabase-js');

const url = 'https://qpcaommapqxvtlqpfmwt.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwY2FvbW1hcHF4dnRscXBmbXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjcxNDQsImV4cCI6MjA5Nzg0MzE0NH0.CnciEeQZ5I4aKsJereHVTxBDxwZvydd3P-xN0DYnIRU';

const supabase = createClient(url, key);

async function main() {
  try {
    console.log('Testing update on kategori_transaksi...');
    // We try to update category ID 2 name to the same name "Penjualan Minuman" but change nothing else, to see if it fails.
    const { data, error } = await supabase
      .from('kategori_transaksi')
      .update({ nama_kategori: 'Penjualan Minuman', tipe: 'pemasukan' })
      .eq('id', 2);
    
    if (error) {
      console.log('Error updating:', error);
    } else {
      console.log('Success! Updated data:', data);
    }
  } catch (e) {
    console.error(e);
  }
}

main();
