const { createClient } = require('@supabase/supabase-js');

const url = 'https://qpcaommapqxvtlqpfmwt.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwY2FvbW1hcHF4dnRscXBmbXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjcxNDQsImV4cCI6MjA5Nzg0MzE0NH0.CnciEeQZ5I4aKsJereHVTxBDxwZvydd3P-xN0DYnIRU';

const supabase = createClient(url, key);

async function main() {
  try {
    console.log('Testing insert and delete user...');
    const username = 'test_delete_user';
    const { data: user, error: insErr } = await supabase
      .from('users')
      .insert([{ username, role: 'kasir', password: username }])
      .select()
      .single();
    
    if (insErr) {
      console.log('Insert error:', insErr);
      return;
    }
    console.log('Inserted user:', user);

    console.log('Deleting user...');
    const { error: delErr } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);
    
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
