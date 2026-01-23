// Diagnostic script to check database state
// Run this in your browser console on the StackRoast homepage

async function diagnoseDatabase() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Starting database diagnosis...\n');
  
  // 1. Check stacks count
  try {
    const { count, error } = await supabase
      .from('stacks')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error counting stacks:', error);
    } else {
      console.log(`✅ Total stacks in database: ${count || 0}`);
    }
  } catch (e) {
    console.error('❌ Failed to query stacks:', e);
  }
  
  // 2. Check stacks with is_public filter
  try {
    const { data, error, count } = await supabase
      .from('stacks')
      .select('id, name, is_public', { count: 'exact' })
      .eq('is_public', true)
      .limit(5);
    
    if (error) {
      if (error.message?.includes('column') || error.code === '42703') {
        console.warn('⚠️  is_public column does not exist. Run migration 20250105_fix_stacks_schema.sql');
      } else {
        console.error('❌ Error querying public stacks:', error);
      }
    } else {
      console.log(`✅ Public stacks (is_public = true): ${count || 0}`);
      if (data && data.length > 0) {
        console.log('   Sample stacks:', data);
      }
    }
  } catch (e) {
    console.error('❌ Failed to query public stacks:', e);
  }
  
  // 3. Check stacks without filter
  try {
    const { data, error, count } = await supabase
      .from('stacks')
      .select('id, name, created_at', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying all stacks:', error);
    } else {
      console.log(`✅ Total stacks (no filter): ${count || 0}`);
      if (data && data.length > 0) {
        console.log('   Sample stacks:', data);
      }
    }
  } catch (e) {
    console.error('❌ Failed to query all stacks:', e);
  }
  
  // 4. Check profiles
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error counting profiles:', error);
    } else {
      console.log(`✅ Total profiles: ${count || 0}`);
    }
  } catch (e) {
    console.error('❌ Failed to query profiles:', e);
  }
  
  // 5. Check ai_roasts
  try {
    const { count, error } = await supabase
      .from('ai_roasts')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error counting ai_roasts:', error);
    } else {
      console.log(`✅ Total AI roasts: ${count || 0}`);
    }
  } catch (e) {
    console.error('❌ Failed to query ai_roasts:', e);
  }
  
  // 6. Test RLS by trying to read a stack
  try {
    const { data, error } = await supabase
      .from('stacks')
      .select('id, name')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      if (error.message?.includes('permission') || error.message?.includes('policy')) {
        console.error('❌ RLS Policy Error: Access denied. Check RLS policies.');
        console.error('   Error details:', error);
      } else {
        console.error('❌ Error reading stack:', error);
      }
    } else if (data) {
      console.log('✅ RLS allows reading stacks. Sample:', data);
    } else {
      console.log('⚠️  No stacks found (but RLS allows access)');
    }
  } catch (e) {
    console.error('❌ Failed to test RLS:', e);
  }
  
  console.log('\n✅ Diagnosis complete!');
}

// Run it
diagnoseDatabase();
