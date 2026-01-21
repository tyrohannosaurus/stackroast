import { supabase } from './src/lib/supabase.js';

const { data, error } = await supabase.from('tools').select('*').limit(3);
console.log('Tools:', data);
console.log('Error:', error);
