import { supabase } from './supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  message: string;
}

export interface UserTrustLevel {
  level: 'new' | 'trusted' | 'superTrusted';
  approvedTools: number;
  totalTools: number;
  rejectionRate: number;
}

/**
 * Get user's trust level and limits
 */
export async function getUserTrustLevel(userId: string): Promise<{
  trustLevel: UserTrustLevel;
  dailyLimit: number;
  hourlyLimit: number;
}> {
  // Get approved tools count
  const { data: approvedData } = await supabase
    .from('tools')
    .select('id', { count: 'exact' })
    .eq('created_by', userId)
    .eq('status', 'approved');

  const approvedTools = approvedData?.length || 0;

  // Get total tools count
  const { data: totalData } = await supabase
    .from('tools')
    .select('id', { count: 'exact' })
    .eq('created_by', userId);

  const totalTools = totalData?.length || 0;

  // Calculate rejection rate
  const rejectionRate = totalTools > 0 
    ? ((totalTools - approvedTools) / totalTools) * 100 
    : 0;

  // Get account age
  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', userId)
    .single();

  const accountAgeDays = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Determine trust level
  let level: 'new' | 'trusted' | 'superTrusted' = 'new';
  let dailyLimit = 5;
  let hourlyLimit = 3;

  if (approvedTools >= 10) {
    level = 'trusted';
    dailyLimit = 20;
    hourlyLimit = 5;

    // Super trusted: 10+ approved, <10% rejection, 30+ days old
    if (rejectionRate < 10 && accountAgeDays >= 30) {
      level = 'superTrusted';
      dailyLimit = 50;
      hourlyLimit = 10;
    }
  }

  return {
    trustLevel: {
      level,
      approvedTools,
      totalTools,
      rejectionRate,
    },
    dailyLimit,
    hourlyLimit,
  };
}

/**
 * Check rate limit for user
 */
export async function checkRateLimit(userId: string | null): Promise<RateLimitResult> {
  // Anonymous users
  if (!userId) {
    // Check localStorage for session limit
    const sessionKey = 'tool_additions_session';
    const sessionData = localStorage.getItem(sessionKey);
    const sessionLimit = 2;

    if (sessionData) {
      const additions = JSON.parse(sessionData);
      const count = additions.length;
      const remaining = Math.max(0, sessionLimit - count);

      if (count >= sessionLimit) {
        return {
          allowed: false,
          remaining: 0,
          limit: sessionLimit,
          message: 'Sign in to add more tools today!',
        };
      }

      return {
        allowed: true,
        remaining,
        limit: sessionLimit,
        message: `You've added ${count} tools this session. ${remaining} remaining.`,
      };
    }

    return {
      allowed: true,
      remaining: sessionLimit,
      limit: sessionLimit,
      message: `You can add ${sessionLimit} tools this session. Sign in for more!`,
    };
  }

  // Authenticated users
  const { trustLevel, dailyLimit } = await getUserTrustLevel(userId);

  // Get today's additions
  const { data: todayAdditions, error } = await supabase
    .rpc('get_today_tool_additions', { user_uuid: userId });

  if (error) {
    console.error('Error checking rate limit:', error);
    // Fail open - allow if we can't check
    return {
      allowed: true,
      remaining: dailyLimit,
      limit: dailyLimit,
      message: '',
    };
  }

  const count = todayAdditions || 0;
  const remaining = Math.max(0, dailyLimit - count);

  if (count >= dailyLimit) {
    return {
      allowed: false,
      remaining: 0,
      limit: dailyLimit,
      message: `You've added ${count} tools today (limit: ${dailyLimit}). Try again tomorrow!`,
    };
  }

  return {
    allowed: true,
    remaining,
    limit: dailyLimit,
    message: `You've added ${count} tools today. ${remaining} remaining.`,
  };
}

/**
 * Record tool addition (for rate limiting)
 */
export async function recordToolAddition(
  userId: string | null,
  toolId: string
): Promise<void> {
  if (!userId) {
    // Store in localStorage for anonymous users
    const sessionKey = 'tool_additions_session';
    const sessionData = localStorage.getItem(sessionKey);
    const additions = sessionData ? JSON.parse(sessionData) : [];
    additions.push({ toolId, addedAt: new Date().toISOString() });
    localStorage.setItem(sessionKey, JSON.stringify(additions));
    return;
  }

  // Store in database for authenticated users
  await supabase.from('user_tool_additions').insert({
    user_id: userId,
    tool_id: toolId,
  });
}
