import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface FetchLogoRequest {
  websiteUrl: string;
}

interface FetchLogoResponse {
  logo: string | null;
  officialName: string | null;
  websiteStatus: 'reachable' | 'unreachable';
  error?: string;
}

// Helper to extract domain from URL
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Helper to check if image URL exists
async function imageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
    return response.ok && (response.headers.get('content-type')?.startsWith('image/') ?? false);
  } catch {
    return false;
  }
}

// Extract logo from HTML meta tags
function extractLogoFromHTML(html: string, baseUrl: string): string | null {
  const baseUrlObj = new URL(baseUrl);
  const base = `${baseUrlObj.protocol}//${baseUrlObj.host}`;

  // Try Open Graph image first
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    const ogImage = ogImageMatch[1];
    // Convert relative URLs to absolute
    if (ogImage.startsWith('http')) return ogImage;
    if (ogImage.startsWith('//')) return `${baseUrlObj.protocol}${ogImage}`;
    if (ogImage.startsWith('/')) return `${base}${ogImage}`;
    return `${base}/${ogImage}`;
  }

  // Try apple-touch-icon
  const appleIconMatch = html.match(/<link\s+rel=["']apple-touch-icon["']\s+href=["']([^"']+)["']/i);
  if (appleIconMatch) {
    const appleIcon = appleIconMatch[1];
    if (appleIcon.startsWith('http')) return appleIcon;
    if (appleIcon.startsWith('//')) return `${baseUrlObj.protocol}${appleIcon}`;
    if (appleIcon.startsWith('/')) return `${base}${appleIcon}`;
    return `${base}/${appleIcon}`;
  }

  // Try favicon
  const faviconMatch = html.match(/<link\s+rel=["'](?:shortcut\s+)?icon["']\s+href=["']([^"']+)["']/i);
  if (faviconMatch) {
    const favicon = faviconMatch[1];
    if (favicon.startsWith('http')) return favicon;
    if (favicon.startsWith('//')) return `${baseUrlObj.protocol}${favicon}`;
    if (favicon.startsWith('/')) return `${base}${favicon}`;
    return `${base}/${favicon}`;
  }

  // Try default favicon.ico
  return `${base}/favicon.ico`;
}

// Extract official name from HTML
function extractOfficialName(html: string): string | null {
  // Try Open Graph title first
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (ogTitleMatch) {
    return ogTitleMatch[1].trim();
  }

  // Try page title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { websiteUrl }: FetchLogoRequest = await req.json();

    if (!websiteUrl || typeof websiteUrl !== 'string') {
      return new Response(
        JSON.stringify({
          logo: null,
          officialName: null,
          websiteStatus: 'unreachable',
          error: 'Invalid website URL',
        } as FetchLogoResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate URL format
    let url: URL;
    try {
      url = new URL(websiteUrl);
    } catch {
      return new Response(
        JSON.stringify({
          logo: null,
          officialName: null,
          websiteStatus: 'unreachable',
          error: 'Invalid URL format',
        } as FetchLogoResponse),
        {
          status: 200, // Don't error, just return null
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Block localhost and private IPs
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.')
    ) {
      return new Response(
        JSON.stringify({
          logo: null,
          officialName: null,
          websiteStatus: 'unreachable',
          error: 'Localhost and private IPs are not allowed',
        } as FetchLogoResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch website HTML with timeout
    let html: string;
    let websiteStatus: 'reachable' | 'unreachable' = 'unreachable';

    try {
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'StackRoast-Bot/1.0 (https://stackroast.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            logo: null,
            officialName: null,
            websiteStatus: 'unreachable',
            error: `Website returned ${response.status}`,
          } as FetchLogoResponse),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      html = await response.text();
      websiteStatus = 'reachable';
    } catch (error) {
      return new Response(
        JSON.stringify({
          logo: null,
          officialName: null,
          websiteStatus: 'unreachable',
          error: error instanceof Error ? error.message : 'Failed to fetch website',
        } as FetchLogoResponse),
        {
          status: 200, // Don't error, just return null
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract logo and official name
    const logo = extractLogoFromHTML(html, websiteUrl);
    const officialName = extractOfficialName(html);

    return new Response(
      JSON.stringify({
        logo,
        officialName,
        websiteStatus,
      } as FetchLogoResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-logo function:', error);
    return new Response(
      JSON.stringify({
        logo: null,
        officialName: null,
        websiteStatus: 'unreachable',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as FetchLogoResponse),
      {
        status: 200, // Don't error, just return null
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
