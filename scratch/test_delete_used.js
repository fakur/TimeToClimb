const { createClient } = require('@supabase/supabase-js');

const url = 'https://qpcaommapqxvtlqpfmwt.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwY2FvbW1hcHF4dnRscXBmbXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjcxNDQsImV4cCI6MjA5Nzg0MzE0NH0.CnciEeQZ5I4aKsJereHVTxBDxwZvydd3P-xN0DYnIRU';

const supabase = createClient(url, key);

async function deleteCategory(id) {
  const { data: detailUsed, error: err1 } = await supabase
    .from('detail_transaksi')
    .select('id')
    .eq('kategori_id', id)
    .limit(1);

  if (err1) {
    throw new Error(err1.message);
  } else if (detailUsed && detailUsed.length > 0) {
    throw new Error('Jenis transaksi ini tidak dapat dihapus karena ID nya sudah digunakan di tabel detail_transaksi.');
  }

  const { data: dtlUsed, error: err2 } = await supabase
    .from('trx_dtl')
    .select('id')
    .eq('kategori_id', id)
    .limit(1);

  if (err2) {
    throw new Error(err2.message);
  } else if (dtlUsed && dtlUsed.length > 0) {
    throw new Error('Jenis transaksi ini tidak dapat dihapus karena ID nya sudah digunakan di tabel trx_dtl.');
  }

  const { error } = await supabase
    .from('kategori_transaksi')
    .delete()
    .eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
  return true;
}

async function main() {
  try {
    console.log('Testing deletion of in-use category ID 13...');
    try {
      await deleteCategory(13);
      console.log('Delete succeeded (expected failure!)');
    } catch (e) {
      console.log('Expected error received successfully:', e.message);
    }
  } catch (e) {
    console.error(e);
  }
}

main();
