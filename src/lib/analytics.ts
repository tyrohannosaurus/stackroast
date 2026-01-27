// Analytics tracking for monetization features
import { supabase } from './supabase';
import { getAffiliateLink } from '@/data/affiliateLinks';

// A/B Test Variants - centralized for easy management
export const AB_TESTS = {
  CTA_VARIANT: {
    name: 'cta_variant',
    variants: ['save_money', 'start_free', 'try_now', 'fix_now'] as const,
  },
  SAVINGS_POSITION: {
    name: 'savings_position',
    variants: ['top', 'bottom', 'both'] as const,
  },
  EMAIL_CAPTURE_TIMING: {
    name: 'email_capture_timing',
    variants: ['immediate', 'delayed_3s', 'delayed_5s', 'on_scroll'] as const,
  },
} as const;

// Get or create user's A/B test assignments
export function getABTestVariant<T extends string>(
  testName: string,
  variants: readonly T[]
): T {
  const storageKey = `ab_test_${testName}`;

  // Check localStorage for existing assignment
  if (typeof window !== 'undefined') {
    const existing = localStorage.getItem(storageKey);
    if (existing && variants.includes(existing as T)) {
      return existing as T;
    }

    // Assign new variant randomly
    const variant = variants[Math.floor(Math.random() * variants.length)];
    localStorage.setItem(storageKey, variant);
    return variant;
  }

  // Server-side fallback
  return variants[0];
}

// Track A/B test event
export async function trackABTestEvent(
  testName: string,
  variant: string,
  eventType: 'impression' | 'click' | 'conversion',
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase.from('ab_test_events').insert({
      test_name: testName,
      variant,
      event_type: eventType,
      metadata,
      created_at: new Date().toISOString(),
      session_id: getSessionId(),
    });

    if (error && error.code !== '42P01') {
      // Ignore table doesn't exist errors
      console.warn('AB test tracking error:', error);
    }
  } catch (error) {
    // Silent fail - don't block user experience
  }
}

// Session ID for tracking user journeys
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  const key = 'stackroast_session_id';
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

/**
 * Track a click on an alternative tool suggestion
 * This is used for affiliate revenue tracking
 */
export async function trackAlternativeClick(
  stackId: string,
  toolName: string,
  alternativeName: string,
  affiliateUrl: string,
  userId?: string,
  metadata?: {
    recType?: string;
    savings?: string;
    ctaVariant?: string;
    position?: number;
    source?: string;
  }
): Promise<void> {
  try {
    // Get affiliate commission info
    const affiliateInfo = getAffiliateLink(alternativeName);
    const estimatedCommission = affiliateInfo?.commission ?? 0;

    const { error } = await supabase
      .from('alternative_clicks')
      .insert({
        stack_id: stackId,
        tool_name: toolName,
        alternative_name: alternativeName,
        affiliate_url: affiliateUrl,
        user_id: userId || null,
        // Enhanced tracking fields
        session_id: getSessionId(),
        rec_type: metadata?.recType || null,
        savings_amount: metadata?.savings || null,
        cta_variant: metadata?.ctaVariant || null,
        position: metadata?.position || null,
        source: metadata?.source || 'recommendations',
        estimated_commission: estimatedCommission,
        referrer: typeof window !== 'undefined' ? window.location.href : null,
      });

    if (error && error.code !== '42P01' && error.code !== '42703') {
      console.error('Error tracking alternative click:', error);
      // Don't throw - we don't want to block user navigation
    }

    // Track A/B test conversion if applicable
    if (metadata?.ctaVariant) {
      await trackABTestEvent(
        AB_TESTS.CTA_VARIANT.name,
        metadata.ctaVariant,
        'conversion',
        { toolName: alternativeName, commission: estimatedCommission }
      );
    }

    // Also track with Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'affiliate_click', {
        event_category: 'monetization',
        event_label: alternativeName,
        value: estimatedCommission,
      });
    }
  } catch (error) {
    console.error('Error tracking alternative click:', error);
    // Silently fail - analytics shouldn't block user experience
  }
}

/**
 * Track a direct affiliate click (stack page, clone stack, kits, fix-my-stack)
 */
export async function trackAffiliateClick(options: {
  toolId?: string | null;
  toolName?: string | null;
  affiliateUrl?: string | null;
  stackId?: string | null;
  userId?: string | null;
  source?: string | null;
}): Promise<void> {
  try {
    const affiliateInfo = options.toolName ? getAffiliateLink(options.toolName) : null;
    const commission = affiliateInfo?.commission ?? 0;

    const { error } = await supabase
      .from('affiliate_clicks')
      .insert({
        tool_id: options.toolId || null,
        tool_name: options.toolName || null,
        affiliate_url: options.affiliateUrl || null,
        stack_id: options.stackId || null,
        user_id: options.userId || null,
        source: options.source || 'stack_page',
        commission,
        referrer: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
      });

    if (error) {
      // Don't throw - analytics should never block user flow
      console.error('Error tracking affiliate click:', error);
    }
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
  }
}

/**
 * Track a featured stack click
 */
export async function trackFeaturedStackClick(
  stackId: string,
  sponsorName?: string,
  userId?: string,
  featuredStackId?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('featured_stack_clicks')
      .insert({
        featured_stack_id: featuredStackId || null,
        stack_id: stackId,
        user_id: userId || null,
        referrer: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
      });

    if (error) {
      console.error('Error tracking featured stack click:', error);
    }
  } catch (error) {
    console.error('Error tracking featured stack click:', error);
  }
}

/**
 * Track a stack kit clone
 */
export async function trackStackKitClone(
  kitId: string,
  kitName: string,
  userId?: string
): Promise<void> {
  try {
    // Try to insert into a tracking table (create if doesn't exist)
    // For now, we'll use a generic approach that won't fail if table doesn't exist
    const { error } = await supabase
      .from('stack_kit_clones')
      .insert({
        kit_id: kitId,
        kit_name: kitName,
        user_id: userId || null,
        cloned_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      // Table might not exist yet - that's okay, just log
      console.log('Stack kit clone tracking (table may not exist):', { kitId, kitName, userId });
    }
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.log('Stack kit clone tracked:', { kitId, kitName, userId });
  }
}

/**
 * Track conversion funnel events
 * Use this to track the user journey from roast → recommendations → click → conversion
 */
export type FunnelStep =
  | 'roast_generated'
  | 'recommendations_viewed'
  | 'recommendations_scrolled'
  | 'cta_clicked'
  | 'email_captured'
  | 'affiliate_clicked'
  | 'kit_viewed'
  | 'kit_cloned';

export async function trackFunnelEvent(
  step: FunnelStep,
  metadata?: {
    stackId?: string;
    userId?: string;
    savingsAmount?: number;
    recommendationCount?: number;
    toolName?: string;
    kitId?: string;
  }
): Promise<void> {
  try {
    const sessionId = getSessionId();

    const { error } = await supabase.from('funnel_events').insert({
      session_id: sessionId,
      step,
      user_id: metadata?.userId || null,
      stack_id: metadata?.stackId || null,
      savings_amount: metadata?.savingsAmount || null,
      recommendation_count: metadata?.recommendationCount || null,
      tool_name: metadata?.toolName || null,
      kit_id: metadata?.kitId || null,
      created_at: new Date().toISOString(),
      referrer: typeof window !== 'undefined' ? document.referrer : null,
      page_url: typeof window !== 'undefined' ? window.location.href : null,
    });

    if (error && error.code !== '42P01') {
      // Ignore table doesn't exist errors
      console.warn('Funnel event tracking error:', error);
    }

    // Also track with Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', step, {
        event_category: 'funnel',
        value: metadata?.savingsAmount || 0,
      });
    }
  } catch (error) {
    // Silent fail
  }
}

/**
 * Track email capture for retargeting
 */
export async function trackEmailCapture(
  email: string,
  source: string,
  metadata?: {
    stackName?: string;
    savingsAmount?: number;
    recommendationCount?: number;
    marketingConsent?: boolean;
  }
): Promise<void> {
  try {
    const { error } = await supabase.from('email_captures').insert({
      email,
      source,
      stack_name: metadata?.stackName || null,
      potential_savings: metadata?.savingsAmount || null,
      recommendation_count: metadata?.recommendationCount || null,
      marketing_consent: metadata?.marketingConsent ?? false,
      session_id: getSessionId(),
      captured_at: new Date().toISOString(),
    });

    if (error && error.code !== '42P01') {
      console.warn('Email capture tracking error:', error);
    }

    // Track funnel event
    await trackFunnelEvent('email_captured', {
      savingsAmount: metadata?.savingsAmount,
      recommendationCount: metadata?.recommendationCount,
    });
  } catch (error) {
    console.warn('Email capture error:', error);
  }
}
