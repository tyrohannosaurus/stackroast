// Script to create system user for hardcoded stack kits
// Run with: node scripts/create-system-user.js
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to read from .env file if it exists
let supabaseUrl = process.env.SUPABASE_URL || '';
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Try to read from .env file
try {
  const envPath = join(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=') && !supabaseUrl) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=') && !supabaseServiceKey) {
      supabaseServiceKey = line.split('=')[1].trim();
    }
  }
} catch (err) {
  // .env file doesn't exist or can't be read, that's okay
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('');
  console.error('Please provide SUPABASE_SERVICE_ROLE_KEY:');
  console.error('  1. Go to Supabase Dashboard > Settings > API');
  console.error('  2. Copy the "service_role" key (secret)');
  console.error('  3. Add it to .env file: SUPABASE_SERVICE_ROLE_KEY=your-key-here');
  console.error('  4. Or set it as environment variable: export SUPABASE_SERVICE_ROLE_KEY=your-key-here');
  console.error('');
  console.error('Alternatively, create the user manually via Dashboard:');
  console.error('  Authentication > Users > Add User');
  console.error('  User UID: 00000000-0000-0000-0000-000000000001');
  console.error('  Email: system@stackroast.app');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
const SYSTEM_EMAIL = 'system@stackroast.app';

async function createSystemUser() {
  try {
    console.log('Creating system user...');

    // Check if auth user already exists
    const { data: existingAuthUser, error: authCheckError } = await supabase.auth.admin.getUserById(SYSTEM_USER_ID);
    
    if (existingAuthUser?.user) {
      console.log('✅ Auth user already exists');
    } else {
      // Create auth user using Admin API
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        id: SYSTEM_USER_ID,
        email: SYSTEM_EMAIL,
        email_confirm: true,
        user_metadata: {
          username: 'StackRoast',
          name: 'StackRoast System'
        },
        app_metadata: {
          provider: 'system',
          providers: ['system']
        }
      });

      if (authError) {
        // If user already exists, that's fine
        if (authError.message.includes('already exists') || authError.message.includes('duplicate')) {
          console.log('✅ Auth user already exists (from error message)');
        } else {
          throw authError;
        }
      } else {
        console.log('✅ Auth user created:', authUser.user.id);
      }
    }

    // Create or update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: SYSTEM_USER_ID,
        username: 'StackRoast',
        karma_points: 0,
        avatar_url: null,
        bio: 'Official StackRoast curated stack kits',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    console.log('✅ System profile created/updated:', profile.username);
    console.log('\n✅ System user setup complete!');
    console.log(`   User ID: ${SYSTEM_USER_ID}`);
    console.log(`   Username: StackRoast`);
    
  } catch (error) {
    console.error('❌ Error creating system user:', error);
    process.exit(1);
  }
}

createSystemUser();
