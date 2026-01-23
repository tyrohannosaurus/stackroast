/**
 * Check if an error is a CORS/network/access control error
 */
export function isCorsOrNetworkError(error: any): boolean {
  if (!error) return false;
  
  const errorStr = error.toString() || error.message || '';
  return (
    errorStr.includes('access control') ||
    errorStr.includes('CORS') ||
    errorStr.includes('Load failed') ||
    errorStr.includes('Could not connect') ||
    errorStr.includes('NetworkError') ||
    errorStr.includes('Failed to fetch') ||
    error?.code === 'ERR_NETWORK' ||
    error?.name === 'TypeError' && errorStr.includes('fetch')
  );
}

/**
 * Get a user-friendly error message for CORS/network errors
 */
export function getCorsErrorMessage(): string {
  return "Cannot connect to database. Possible causes:\n1. Supabase project is paused\n2. CORS not configured for your domain\n3. Network connectivity issue\n\nCheck your Supabase project at https://app.supabase.com";
}
