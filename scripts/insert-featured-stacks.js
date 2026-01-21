// Node.js script to insert featured stacks
// Run with: node scripts/insert-featured-stacks.js
// Make sure to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertFeaturedStacks() {
  try {
    // Step 1: Get top stacks by view count
    console.log('Fetching top stacks...');
    const { data: stacks, error: stacksError } = await supabase
      .from('stacks')
      .select('id, slug, name, view_count, burn_score')
      .order('view_count', { ascending: false })
      .limit(10);

    if (stacksError) throw stacksError;

    if (!stacks || stacks.length === 0) {
      console.log('No stacks found. Please create some stacks first.');
      return;
    }

    console.log(`Found ${stacks.length} stacks:`);
    stacks.forEach((stack, index) => {
      console.log(`  ${index + 1}. ${stack.name} (${stack.slug}) - ${stack.view_count} views`);
    });

    // Step 2: Insert featured stacks
    const sponsors = [
      { name: 'Railway', logo: 'https://railway.app/brand/logo-light.svg', priority: 1 },
      { name: 'Vercel', logo: 'https://vercel.com/favicon.ico', priority: 2 },
      { name: 'Supabase', logo: 'https://supabase.com/favicon.ico', priority: 3 },
    ];

    const featuredStacks = [];
    for (let i = 0; i < Math.min(3, stacks.length); i++) {
      const stack = stacks[i];
      const sponsor = sponsors[i];

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // 7 days from now

      featuredStacks.push({
        stack_id: stack.id,
        sponsor_name: sponsor.name,
        sponsor_logo_url: sponsor.logo,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        priority: sponsor.priority,
        active: true,
        cta_text: 'View Stack',
      });
    }

    console.log('\nInserting featured stacks...');
    const { data: inserted, error: insertError } = await supabase
      .from('featured_stacks')
      .upsert(featuredStacks, {
        onConflict: 'stack_id',
        ignoreDuplicates: false,
      })
      .select();

    if (insertError) throw insertError;

    console.log(`\n✅ Successfully inserted ${inserted.length} featured stacks:`);
    inserted.forEach((fs) => {
      const stack = stacks.find((s) => s.id === fs.stack_id);
      console.log(`  - ${stack?.name} sponsored by ${fs.sponsor_name} (Priority: ${fs.priority})`);
    });

    // Step 3: Verify
    console.log('\nVerifying featured stacks...');
    const { data: verified, error: verifyError } = await supabase
      .from('featured_stacks')
      .select(`
        id,
        sponsor_name,
        priority,
        start_date,
        end_date,
        active,
        stack:stacks(name, slug)
      `)
      .eq('active', true)
      .order('priority', { ascending: true });

    if (verifyError) throw verifyError;

    console.log(`\n✅ Active featured stacks: ${verified.length}`);
    verified.forEach((fs) => {
      console.log(`  - ${fs.stack.name} by ${fs.sponsor_name} (Priority: ${fs.priority})`);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

insertFeaturedStacks();
