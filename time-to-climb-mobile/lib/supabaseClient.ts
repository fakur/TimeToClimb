import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase Credentials for React Native (direct connection)
const supabaseUrl = 'https://qpcaommapqxvtlqpfmwt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwY2FvbW1hcHF4dnRscXBmbXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjcxNDQsImV4cCI6MjA5Nzg0MzE0NH0.CnciEeQZ5I4aKsJereHVTxBDxwZvydd3P-xN0DYnIRU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
