#!/usr/bin/env node

/**
 * Script to add new tools from markdown list to StackRoast database
 * Usage: node scripts/add-new-tools.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

// Generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Ensure unique slug
async function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data } = await supabase
      .from('tools')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (!data) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Parse tools from the provided list
const toolsToAdd = [
  // SEO & MARKETING TOOLS
  { name: 'SEMrush', website: 'https://semrush.com', category: 'SEO Tools', description: 'All-in-one SEO and marketing toolkit for keyword research, competitor analysis, content optimization, and rank tracking' },
  { name: 'Ahrefs', website: 'https://ahrefs.com', category: 'SEO Tools', description: 'Comprehensive SEO toolset focused on backlink analysis, keyword research, competitor research, and rank tracking' },
  { name: 'Surfer SEO', website: 'https://surferseo.com', category: 'SEO Tools', description: 'Data-driven content optimization platform that analyzes top-ranking pages to help you create SEO-optimized content' },
  { name: 'Mangools', website: 'https://mangools.com', category: 'SEO Tools', description: 'User-friendly SEO toolkit including KWFinder, SERPChecker, and LinkMiner for keyword research and competitor analysis' },
  { name: 'SE Ranking', website: 'https://seranking.com', category: 'SEO Tools', description: 'All-in-one SEO platform with keyword rank tracking, website audit, backlink monitoring, and competitor analysis' },
  
  // E-COMMERCE PLATFORMS
  { name: 'Shopify', website: 'https://shopify.com', category: 'E-commerce', description: 'Leading e-commerce platform for building online stores with built-in payments, inventory management, and marketing tools' },
  { name: 'BigCommerce', website: 'https://bigcommerce.com', category: 'E-commerce', description: 'Enterprise e-commerce platform with advanced features, no transaction fees, and built-in B2B functionality' },
  { name: 'Wix', website: 'https://wix.com', category: 'Website Builders', description: 'Drag-and-drop website builder with e-commerce capabilities, templates, and built-in marketing tools' },
  
  // HOSTING & INFRASTRUCTURE
  { name: 'Hostinger', website: 'https://hostinger.com', category: 'Web Hosting', description: 'Budget-friendly shared hosting with fast performance, easy-to-use control panel, and good customer support' },
  { name: 'SiteGround', website: 'https://siteground.com', category: 'Web Hosting', description: 'Developer-friendly shared hosting known for excellent support, daily backups, and WordPress optimization' },
  { name: 'Cloudways', website: 'https://cloudways.com', category: 'Managed Hosting', description: 'Managed cloud hosting platform that simplifies deployment on DigitalOcean, AWS, GCP, Vultr, and Linode' },
  { name: 'Vultr', website: 'https://vultr.com', category: 'Cloud Infrastructure', description: 'Developer-friendly cloud VPS provider with global data centers, simple pricing, and one-click app deployments' },
  { name: 'Linode (Akamai Cloud)', website: 'https://linode.com', category: 'Cloud Infrastructure', description: 'Linux-focused cloud hosting with straightforward pricing, excellent documentation, and strong developer community' },
  { name: 'DreamHost', website: 'https://dreamhost.com', category: 'Web Hosting', description: 'Independent web hosting company offering shared hosting, VPS, and managed WordPress with strong privacy stance' },
  { name: 'A2 Hosting', website: 'https://a2hosting.com', category: 'Web Hosting', description: 'Performance-focused web hosting with Turbo servers, SSD storage, and developer-friendly features' },
  { name: 'InMotion Hosting', website: 'https://inmotionhosting.com', category: 'Web Hosting', description: 'Business-grade hosting with excellent uptime, customer support, and free website migration' },
  { name: 'Scala Hosting', website: 'https://scalahosting.com', category: 'VPS Hosting', description: 'VPS hosting specialist with custom SPanel control panel and managed VPS options' },
  { name: 'Kamatera', website: 'https://kamatera.com', category: 'Cloud Infrastructure', description: 'Flexible cloud infrastructure with customizable VPS configurations and global data centers' },
  
  // MANAGED WORDPRESS HOSTING
  { name: 'Kinsta', website: 'https://kinsta.com', category: 'Managed Hosting', description: 'Premium managed WordPress hosting powered by Google Cloud with automatic scaling and expert support' },
  { name: 'WP Engine', website: 'https://wpengine.com', category: 'Managed Hosting', description: 'Enterprise WordPress hosting with advanced security, daily backups, and development/staging environments' },
  { name: 'Liquid Web', website: 'https://liquidweb.com', category: 'Managed Hosting', description: 'High-performance managed hosting for WordPress, WooCommerce, and applications with heroic support' },
  { name: 'Bluehost', website: 'https://bluehost.com', category: 'Web Hosting', description: 'Beginner-friendly WordPress hosting officially recommended by WordPress.org with one-click installation' },
  
  // EMAIL MARKETING
  { name: 'ConvertKit', website: 'https://convertkit.com', category: 'Email Marketing', description: 'Email marketing platform designed for creators with visual automation builder and landing pages' },
  { name: 'ActiveCampaign', website: 'https://activecampaign.com', category: 'Marketing Automation', description: 'Advanced marketing automation platform combining email marketing, CRM, and sales automation' },
  { name: 'GetResponse', website: 'https://getresponse.com', category: 'Email Marketing', description: 'All-in-one marketing platform with email marketing, automation, landing pages, and webinar hosting' },
  { name: 'AWeber', website: 'https://aweber.com', category: 'Email Marketing', description: 'Email marketing platform for small businesses with templates, automation, and analytics' },
  { name: 'Drip', website: 'https://drip.com', category: 'Email Marketing', description: 'E-commerce CRM and email marketing automation platform built for online retailers' },
  { name: 'MailerLite', website: 'https://mailerlite.com', category: 'Email Marketing', description: 'Simple and affordable email marketing with drag-and-drop editor, landing pages, and automation' },
  { name: 'Klaviyo', website: 'https://klaviyo.com', category: 'Email Marketing', description: 'E-commerce marketing automation platform with deep Shopify integration and advanced segmentation' },
  
  // WEBSITE BUILDERS & NO-CODE
  { name: 'Webflow', website: 'https://webflow.com', category: 'Website Builders', description: 'Visual web design tool that generates clean code, popular with designers for building responsive websites' },
  { name: 'Squarespace', website: 'https://squarespace.com', category: 'Website Builders', description: 'All-in-one website builder with beautiful templates, e-commerce, and built-in marketing tools' },
  { name: 'Duda', website: 'https://duda.co', category: 'Website Builders', description: 'Professional website builder designed for agencies and SaaS platforms with white-label options' },
  { name: 'Bubble', website: 'https://bubble.io', category: 'No-Code Platforms', description: 'Visual programming platform for building web applications without code, with database and logic capabilities' },
  { name: 'Softr', website: 'https://softr.io', category: 'No-Code Platforms', description: 'Turn Airtable or Google Sheets into web apps and client portals without coding' },
  
  // DESIGN & CREATIVE
  { name: 'Canva', website: 'https://canva.com', category: 'Design Tools', description: 'User-friendly graphic design platform with templates for social media, presentations, posters, and more' },
  { name: 'Adobe Creative Cloud', website: 'https://adobe.com', category: 'Design Tools', description: 'Industry-standard suite of creative applications including Photoshop, Illustrator, Premiere Pro, and more' },
  { name: 'Envato Elements', website: 'https://elements.envato.com', category: 'Design Assets', description: 'Unlimited downloads of stock photos, graphics, templates, fonts, and creative assets with one subscription' },
  { name: 'Elementor', website: 'https://elementor.com', category: 'WordPress Tools', description: 'Popular WordPress page builder with drag-and-drop interface and extensive widget library' },
  
  // PRODUCTIVITY & COLLABORATION
  { name: 'ClickUp', website: 'https://clickup.com', category: 'Project Management', description: 'All-in-one productivity platform combining tasks, docs, goals, and chat in one customizable workspace' },
  { name: 'Monday.com', website: 'https://monday.com', category: 'Project Management', description: 'Visual work operating system for teams to run projects and workflows with customizable boards' },
  { name: 'Todoist', website: 'https://todoist.com', category: 'Productivity', description: 'Simple yet powerful task management app with natural language input and cross-platform sync' },
  { name: 'Asana', website: 'https://asana.com', category: 'Project Management', description: 'Team collaboration and work management platform for organizing and planning team work' },
  { name: 'Airtable', website: 'https://airtable.com', category: 'Databases', description: 'Spreadsheet-database hybrid with relational data, attachments, and API for building custom workflows' },
  { name: 'Coda', website: 'https://coda.io', category: 'Productivity', description: 'All-in-one doc platform that combines writing, spreadsheets, and building tools into collaborative documents' },
  { name: 'Notion', website: 'https://notion.so', category: 'Productivity', description: 'All-in-one workspace for notes, tasks, wikis, and databases with powerful organization features' },
  { name: 'ClickMeeting', website: 'https://clickmeeting.com', category: 'Video Conferencing', description: 'Webinar and online meeting platform with recording, analytics, and marketing integration' },
  
  // DEVELOPER TOOLS
  { name: 'JetBrains (IntelliJ IDEA)', website: 'https://jetbrains.com', category: 'Development Tools', description: 'Professional IDE for Java, Kotlin, and JVM languages with intelligent code assistance' },
  { name: 'JetBrains (PhpStorm)', website: 'https://jetbrains.com/phpstorm', category: 'Development Tools', description: 'Professional PHP IDE with smart code completion, debugging, and framework support' },
  { name: 'JetBrains (PyCharm)', website: 'https://jetbrains.com/pycharm', category: 'Development Tools', description: 'Python IDE for professional developers with intelligent assistance and scientific tools' },
  { name: 'JetBrains (WebStorm)', website: 'https://jetbrains.com/webstorm', category: 'Development Tools', description: 'JavaScript and TypeScript IDE with advanced coding assistance and built-in tools' },
  { name: 'TablePlus', website: 'https://tableplus.com', category: 'Database Tools', description: 'Modern, native database management tool for multiple databases with clean interface' },
  { name: 'GitKraken', website: 'https://gitkraken.com', category: 'Development Tools', description: 'Cross-platform Git client with visual interface, merge conflict editor, and GitHub/GitLab integration' },
  { name: 'Tower', website: 'https://git-tower.com', category: 'Development Tools', description: 'Git client for Mac and Windows with visual interface and powerful branching workflows' },
  
  // SECURITY & PASSWORD MANAGEMENT
  { name: '1Password', website: 'https://1password.com', category: 'Security', description: 'Password manager for individuals and teams with secure vaults, sharing, and two-factor authentication' },
  { name: 'LastPass', website: 'https://lastpass.com', category: 'Security', description: 'Password management solution with auto-fill, password generator, and secure sharing' },
  { name: 'Dashlane', website: 'https://dashlane.com', category: 'Security', description: 'Password manager with VPN, dark web monitoring, and secure password sharing for businesses' },
  { name: 'NordVPN', website: 'https://nordvpn.com', category: 'Security', description: 'VPN service with thousands of servers worldwide, strong encryption, and no-logs policy' },
  { name: 'ExpressVPN', website: 'https://expressvpn.com', category: 'Security', description: 'Premium VPN service with fast speeds, strong security, and servers in 94 countries' },
  { name: 'Malwarebytes', website: 'https://malwarebytes.com', category: 'Security', description: 'Anti-malware software that detects and removes malware, ransomware, and other threats' },
  
  // ANALYTICS & DATA
  { name: 'Fathom Analytics', website: 'https://usefathom.com', category: 'Analytics', description: 'Privacy-first website analytics with no cookies, GDPR compliant, and simple interface' },
  { name: 'Hotjar', website: 'https://hotjar.com', category: 'Analytics', description: 'Behavior analytics and user feedback tool with heatmaps, session recordings, and surveys' },
  { name: 'Heap', website: 'https://heap.io', category: 'Analytics', description: 'Digital insights platform that automatically captures all user interactions for later analysis' },
  
  // FORMS & SURVEYS
  { name: 'Typeform', website: 'https://typeform.com', category: 'Forms', description: 'Interactive form and survey builder with conversational interface and beautiful design' },
  { name: 'JotForm', website: 'https://jotform.com', category: 'Forms', description: 'Online form builder with 10,000+ templates, payment integration, and workflow automation' },
  { name: 'Paperform', website: 'https://paperform.co', category: 'Forms', description: 'Flexible form builder that feels like a document with payment, booking, and e-signature features' },
  { name: 'SurveyMonkey', website: 'https://surveymonkey.com', category: 'Surveys', description: 'Survey platform with templates, advanced logic, and analytics for market research and feedback' },
  { name: 'Tally', website: 'https://tally.so', category: 'Forms', description: 'Free form builder with unlimited forms and submissions, designed like a document editor' },
  
  // CDN & PERFORMANCE
  { name: 'BunnyCDN', website: 'https://bunny.net', category: 'CDN', description: 'Fast and affordable content delivery network with global edge locations and simple pricing' },
  { name: 'KeyCDN', website: 'https://keycdn.com', category: 'CDN', description: 'High-performance CDN with real-time analytics, instant purging, and developer-friendly features' },
  { name: 'Cloudflare', website: 'https://cloudflare.com', category: 'CDN', description: 'Global CDN with security features, DDoS protection, and performance optimization' },
  { name: 'Fastly', website: 'https://fastly.com', category: 'CDN', description: 'Edge cloud platform for fast, secure, and scalable content delivery and edge computing' },
  
  // VIDEO & CONTENT CREATION
  { name: 'Descript', website: 'https://descript.com', category: 'Video Editing', description: 'Video and podcast editor that works like a document with transcription and AI-powered tools' },
  { name: 'Riverside.fm', website: 'https://riverside.fm', category: 'Recording', description: 'Remote recording platform for podcasts and video with studio-quality audio and video' },
  { name: 'Loom', website: 'https://loom.com', category: 'Video Messaging', description: 'Quick screen and video recording tool for async communication and documentation' },
  { name: 'Wistia', website: 'https://wistia.com', category: 'Video Hosting', description: 'Video hosting platform for businesses with marketing tools, analytics, and customization' },
  { name: 'Vimeo', website: 'https://vimeo.com', category: 'Video Platform', description: 'Video platform for creators and businesses with high-quality hosting and marketing tools' },
  { name: 'Animoto', website: 'https://animoto.com', category: 'Video Creation', description: 'Simple video maker for creating marketing videos from photos, video clips, and text' },
  
  // E-COMMERCE ADD-ONS & APPS
  { name: 'Gorgias', website: 'https://gorgias.com', category: 'Customer Support', description: 'E-commerce helpdesk that centralizes customer support from email, chat, phone, and social media' },
  { name: 'ReCharge', website: 'https://rechargepayments.com', category: 'E-commerce Apps', description: 'Subscription payments platform for Shopify with recurring billing and subscription management' },
  { name: 'Smile.io', website: 'https://smile.io', category: 'E-commerce Apps', description: 'Loyalty and rewards program for e-commerce stores to increase customer retention' },
  { name: 'Yotpo', website: 'https://yotpo.com', category: 'E-commerce Apps', description: 'E-commerce marketing platform for reviews, loyalty, referrals, and SMS marketing' },
  
  // AUTOMATION & INTEGRATION
  { name: 'Zapier', website: 'https://zapier.com', category: 'Automation', description: 'Automation platform that connects 5,000+ apps to automate workflows without coding' },
  { name: 'Make (formerly Integromat)', website: 'https://make.com', category: 'Automation', description: 'Visual automation platform for connecting apps and creating complex workflows' },
  
  // BUSINESS & FINANCE
  { name: 'FreshBooks', website: 'https://freshbooks.com', category: 'Accounting', description: 'Cloud accounting software for small businesses with invoicing, expense tracking, and time tracking' },
  { name: 'Bonsai', website: 'https://hellobonsai.com', category: 'Business Tools', description: 'All-in-one business management for freelancers with contracts, proposals, invoicing, and accounting' },
  { name: 'Pipedrive', website: 'https://pipedrive.com', category: 'CRM', description: 'Sales CRM and pipeline management tool designed for salespeople with visual pipeline' },
  
  // OPEN-SOURCE / NO AFFILIATE
  { name: 'Coolify', website: 'https://coolify.io', category: 'Hosting', description: 'Open-source, self-hostable Heroku/Netlify alternative for deploying apps on your own server' },
  { name: 'PocketBase', website: 'https://pocketbase.io', category: 'Backend', description: 'Open-source backend in a single file with database, authentication, file storage, and admin UI' },
  { name: 'Appwrite', website: 'https://appwrite.io', category: 'Backend', description: 'Open-source backend platform with authentication, databases, storage, and serverless functions' },
  { name: 'n8n', website: 'https://n8n.io', category: 'Automation', description: 'Open-source workflow automation tool with visual editor and 200+ integrations' },
  { name: 'NocoDB', website: 'https://nocodb.com', category: 'Database', description: 'Open-source Airtable alternative that turns databases into smart spreadsheets' },
  { name: 'Umami', website: 'https://umami.is', category: 'Analytics', description: 'Simple, fast, privacy-focused open-source analytics alternative to Google Analytics' },
];

async function addTools() {
  console.log(`🚀 Starting to add ${toolsToAdd.length} tools to database...\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const tool of toolsToAdd) {
    try {
      // Generate slug
      const baseSlug = generateSlug(tool.name);
      const slug = await ensureUniqueSlug(baseSlug);

      // Check if tool already exists by name or slug
      const { data: existing } = await supabase
        .from('tools')
        .select('id, name, slug')
        .or(`name.ilike.${tool.name},slug.eq.${slug}`)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️  Skipping "${tool.name}" - already exists (${existing.name})`);
        skipCount++;
        continue;
      }

      // Insert tool (without description column - it doesn't exist in the schema)
      const { data: newTool, error } = await supabase
        .from('tools')
        .insert({
          name: tool.name.trim(),
          slug: slug,
          category: tool.category,
          website_url: tool.website || null,
          status: 'approved',
          priority_score: 0,
          verified_website: !!tool.website,
          logo_fetched: false,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ Added: ${tool.name} (${tool.category})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error adding "${tool.name}":`, error.message);
      errors.push({ tool: tool.name, error: error.message });
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`⏭️  Skipped (already exists): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(({ tool, error }) => {
      console.log(`  - ${tool}: ${error}`);
    });
  }

  console.log(`\n📊 Total processed: ${toolsToAdd.length}`);
}

addTools().catch(console.error);
