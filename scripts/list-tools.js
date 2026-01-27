#!/usr/bin/env node

/**
 * Script to list all tools from StackRoast database
 * Usage: node scripts/list-tools.js [--json]
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Warning: Could not read .env file:', error.message);
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTools() {
  const { data: tools, error } = await supabase
    .from('tools')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Error fetching tools:', error);
    process.exit(1);
  }

  if (process.argv.includes('--json')) {
    // Output as JSON
    const jsonOutput = JSON.stringify(tools, null, 2);
    writeFileSync('tools-export.json', jsonOutput);
    console.log(`✅ Exported ${tools.length} tools to tools-export.json`);
  } else {
    // Output formatted list
    console.log(`\n📋 Total Tools: ${tools.length}\n`);
    console.log('='.repeat(80));
    
    tools.forEach((tool, index) => {
      console.log(`\n${index + 1}. ${tool.name}`);
      console.log(`   ID: ${tool.id}`);
      console.log(`   Slug: ${tool.slug}`);
      console.log(`   Category: ${tool.category || 'N/A'}`);
      if (tool.website_url) {
        console.log(`   Website: ${tool.website_url}`);
      }
      if (tool.logo_url) {
        console.log(`   Logo: ${tool.logo_url}`);
      }
      console.log(`   Status: ${tool.status || 'approved'}`);
    });
    
    console.log('\n' + '='.repeat(80));
  }
}

listTools().catch(console.error);
