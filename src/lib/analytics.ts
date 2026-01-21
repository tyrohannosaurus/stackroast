// Analytics tracking for monetization features
import { supabase } from './supabase';

/**
 * Track a click on an alternative tool suggestion
 * This is used for affiliate revenue tracking
 */
export async function trackAlternativeClick(
  stackId: string,
  toolName: string,
  alternativeName: string,
  affiliateUrl: string,
  userId?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('alternative_clicks')
      .insert({
        stack_id: stackId,
        tool_name: toolName,
        alternative_name: alternativeName,
        affiliate_url: affiliateUrl,
        user_id: userId || null,
      });

    if (error) {
      console.error('Error tracking alternative click:', error);
      // Don't throw - we don't want to block user navigation
    }
  } catch (error) {
    console.error('Error tracking alternative click:', error);
    // Silently fail - analytics shouldn't block user experience
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
