import { supabase } from './supabase';

export interface LogoFetchResult {
  logo: string | null;
  officialName: string | null;
  websiteStatus: 'reachable' | 'unreachable';
  error?: string;
}

export interface WebsiteValidationResult {
  isValid: boolean;
  canProceed: boolean;
  status: 'valid' | 'warning' | 'blocked';
  message: string;
}

/**
 * Generate a URL-safe slug from a tool name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalize tool name (handle common variations)
 */
const NORMALIZATIONS: Record<string, string> = {
  'reactjs': 'React',
  'react.js': 'React',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'vuejs': 'Vue.js',
  'vue.js': 'Vue.js',
  'angularjs': 'AngularJS',
  'angular.js': 'AngularJS',
  'sveltejs': 'Svelte',
  'svelte.js': 'Svelte',
  'expressjs': 'Express.js',
  'express.js': 'Express.js',
  'nestjs': 'NestJS',
  'nest.js': 'NestJS',
  'nuxtjs': 'Nuxt',
  'nuxt.js': 'Nuxt',
  'remixjs': 'Remix',
  'remix.js': 'Remix',
};

export function normalizeToolName(name: string): string {
  const lower = name.toLowerCase().trim();
  if (NORMALIZATIONS[lower]) {
    return NORMALIZATIONS[lower];
  }
  
  // Auto-capitalize proper nouns (simple heuristic)
  // Capitalize first letter of each word
  return name
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Check if image URL exists (client-side)
 */
async function imageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    // Timeout after 3 seconds
    setTimeout(() => resolve(false), 3000);
  });
}

/**
 * Get domain from URL
 */
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Fetch logo using hybrid approach (client-side first, Edge Function fallback)
 */
export async function fetchToolLogo(websiteUrl: string, toolName: string): Promise<LogoFetchResult> {
  if (!websiteUrl) {
    return {
      logo: null,
      officialName: null,
      websiteStatus: 'unreachable',
      error: 'Website URL is required',
    };
  }

  const domain = getDomain(websiteUrl);
  if (!domain) {
    return {
      logo: null,
      officialName: null,
      websiteStatus: 'unreachable',
      error: 'Invalid URL format',
    };
  }

  // Try CORS-enabled services first (client-side, fast)
  // Run all services in parallel and return first successful one
  const corsFreeSources = [
    `https://logo.clearbit.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  ];

  try {
    // Race all logo services - first one to succeed wins
    const logoPromises = corsFreeSources.map(async (url) => {
      const exists = await imageExists(url);
      if (exists) return url;
      throw new Error('Logo not found');
    });

    // Wait for first successful result (with 10s overall timeout)
    const logo = await Promise.race([
      Promise.any(logoPromises),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Logo fetch timeout')), 10000)
      ),
    ]);

    return {
      logo,
      officialName: null,
      websiteStatus: 'reachable',
    };
  } catch (error) {
    // All services failed or timed out, continue to Edge Function
    console.warn('All logo services failed, trying Edge Function');
  }

  // Fallback to Edge Function for website scraping
  try {
    const { data, error } = await supabase.functions.invoke('fetch-logo', {
      body: { websiteUrl },
    });

    if (error) {
      throw error;
    }

    return data as LogoFetchResult;
  } catch (error) {
    console.error('Error fetching logo from Edge Function:', error);
    // Generate placeholder as last resort
    return {
      logo: generatePlaceholderLogo(toolName),
      officialName: null,
      websiteStatus: 'unreachable',
      error: error instanceof Error ? error.message : 'Failed to fetch logo',
    };
  }
}

/**
 * Generate placeholder logo (SVG with first letter)
 */
function generatePlaceholderLogo(toolName: string): string {
  const firstLetter = toolName.charAt(0).toUpperCase();
  const svg = `
    <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
      <rect width="128" height="128" fill="#f97316" rx="16"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="64" font-weight="bold" 
            fill="white" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Validate website URL (soft validation)
 */
export function validateWebsiteUrl(url: string): WebsiteValidationResult {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      canProceed: false,
      status: 'blocked',
      message: 'Website URL is required',
    };
  }

  // Check URL format
  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch {
    return {
      isValid: false,
      canProceed: false,
      status: 'blocked',
      message: 'Invalid URL format',
    };
  }

  const hostname = urlObj.hostname.toLowerCase();

  // Block localhost and private IPs
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
    hostname.includes('.local')
  ) {
    return {
      isValid: false,
      canProceed: false,
      status: 'blocked',
      message: 'Localhost and private IPs are not allowed',
    };
  }

  // Block obviously malicious patterns
  if (hostname.match(/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/)) {
    return {
      isValid: false,
      canProceed: false,
      status: 'blocked',
      message: 'IP addresses are not allowed. Please use a domain name.',
    };
  }

  // Valid URL format
  return {
    isValid: true,
    canProceed: true,
    status: 'valid',
    message: 'Valid URL',
  };
}

/**
 * Check if website is reachable (async validation)
 */
export async function checkWebsiteReachability(url: string): Promise<WebsiteValidationResult> {
  const formatValidation = validateWebsiteUrl(url);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'StackRoast-Bot/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        isValid: true,
        canProceed: true,
        status: 'valid',
        message: 'Website is reachable',
      };
    } else if (response.status === 403 || response.status === 503) {
      // Bot protection or temporary downtime - allow with warning
      return {
        isValid: true,
        canProceed: true,
        status: 'warning',
        message: `Website returned ${response.status}. This might be temporary.`,
      };
    } else if (response.status === 404) {
      return {
        isValid: true,
        canProceed: true,
        status: 'warning',
        message: 'Website returned 404. Please verify the URL is correct.',
      };
    } else {
      return {
        isValid: true,
        canProceed: true,
        status: 'warning',
        message: `Website returned ${response.status}. Proceeding anyway.`,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        isValid: true,
        canProceed: true,
        status: 'warning',
        message: 'Website request timed out. This might be temporary.',
      };
    }

    // Network error or other issue - allow with warning
    return {
      isValid: true,
      canProceed: true,
      status: 'warning',
      message: 'Could not verify website. Proceeding anyway.',
    };
  }
}

/**
 * Check for duplicate tools (case-insensitive)
 */
export async function checkDuplicateTool(name: string, excludeId?: string): Promise<{
  isDuplicate: boolean;
  existingTool?: { id: string; name: string; slug: string };
}> {
  const { data, error } = await supabase
    .from('tools')
    .select('id, name, slug')
    .ilike('name', name.trim())
    .maybeSingle();

  if (error) {
    console.error('Error checking duplicate:', error);
    return { isDuplicate: false };
  }

  if (data && data.id !== excludeId) {
    console.log('🔍 Duplicate tool detected:', {
      attempted: name.trim(),
      existing: data.name,
      existingId: data.id,
    });
    return {
      isDuplicate: true,
      existingTool: data,
    };
  }

  console.log('✅ No duplicate found for:', name.trim());
  return { isDuplicate: false };
}

/**
 * Ensure slug is unique (append number if needed)
 */
export async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from('tools')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!data || data.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
