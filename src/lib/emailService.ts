// Email service for StackRoast
// This module handles sending emails through Supabase Edge Functions or direct API calls

import { supabase } from './supabase';
import {
  getWelcomeEmail,
  getRoastNotificationEmail,
  getFriendRoastNotificationEmail,
  getWeeklyDigestEmail,
  type EmailTemplate,
} from './emailTemplates';

// Site URL for email links
const SITE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'https://stackroast.dev';

// Replace placeholder in templates
function processTemplate(template: EmailTemplate): EmailTemplate {
  return {
    subject: template.subject,
    html: template.html.replace(/\{\{siteUrl\}\}/g, SITE_URL),
    text: template.text.replace(/\{\{siteUrl\}\}/g, SITE_URL),
  };
}

// Email types for tracking
export type EmailType = 
  | 'welcome'
  | 'roast_notification'
  | 'friend_roast_complete'
  | 'weekly_digest';

interface SendEmailOptions {
  to: string;
  template: EmailTemplate;
  emailType: EmailType;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// Main email sending function
async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const { to, template, emailType, userId, metadata } = options;
  const processedTemplate = processTemplate(template);

  try {
    // First, check if user has opted out of this email type
    if (userId) {
      const preferences = await getEmailPreferences(userId);
      if (!preferences[emailType]) {
        console.log(`User ${userId} has opted out of ${emailType} emails`);
        return { success: true }; // Silent success - user opted out
      }
    }

    // Try to send via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject: processedTemplate.subject,
        html: processedTemplate.html,
        text: processedTemplate.text,
        emailType,
        metadata,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      // Log the attempt for debugging
      await logEmailAttempt(to, emailType, false, error.message);
      return { success: false, error: error.message };
    }

    // Log successful send
    await logEmailAttempt(to, emailType, true);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email send error:', errorMessage);
    await logEmailAttempt(to, emailType, false, errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Log email attempts for analytics
async function logEmailAttempt(
  email: string,
  emailType: EmailType,
  success: boolean,
  errorMessage?: string
) {
  try {
    await supabase.from('email_logs').insert({
      email,
      email_type: emailType,
      success,
      error_message: errorMessage,
      sent_at: new Date().toISOString(),
    });
  } catch (e) {
    // Silent fail - logging shouldn't break the app
    console.log('Email logging skipped (table may not exist)');
  }
}

// Get user email preferences
export async function getEmailPreferences(userId: string): Promise<Record<EmailType, boolean>> {
  const defaults: Record<EmailType, boolean> = {
    welcome: true,
    roast_notification: true,
    friend_roast_complete: true,
    weekly_digest: true,
  };

  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return defaults;
    }

    return {
      welcome: data.welcome ?? true,
      roast_notification: data.roast_notification ?? true,
      friend_roast_complete: data.friend_roast_complete ?? true,
      weekly_digest: data.weekly_digest ?? true,
    };
  } catch {
    return defaults;
  }
}

// Update user email preferences
export async function updateEmailPreferences(
  userId: string,
  preferences: Partial<Record<EmailType, boolean>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('email_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// ============================================
// Public email sending functions
// ============================================

// Send welcome email to new user
export async function sendWelcomeEmail(
  email: string,
  username: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const template = getWelcomeEmail(username);
  return sendEmail({
    to: email,
    template,
    emailType: 'welcome',
    userId,
    metadata: { username },
  });
}

// Send roast notification email
export async function sendRoastNotificationEmail(
  email: string,
  username: string,
  stackName: string,
  burnScore: number,
  roastPreview: string,
  stackSlug: string,
  persona: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const template = getRoastNotificationEmail(
    username,
    stackName,
    burnScore,
    roastPreview,
    stackSlug,
    persona
  );
  return sendEmail({
    to: email,
    template,
    emailType: 'roast_notification',
    userId,
    metadata: { stackName, burnScore, stackSlug },
  });
}

// Send notification when friend completes roast challenge
export async function sendFriendRoastCompleteEmail(
  senderEmail: string,
  senderName: string,
  recipientName: string,
  stackName: string,
  burnScore: number,
  roastPreview: string,
  stackSlug: string,
  senderId?: string
): Promise<{ success: boolean; error?: string }> {
  const template = getFriendRoastNotificationEmail(
    senderName,
    recipientName,
    stackName,
    burnScore,
    roastPreview,
    stackSlug
  );
  return sendEmail({
    to: senderEmail,
    template,
    emailType: 'friend_roast_complete',
    userId: senderId,
    metadata: { recipientName, stackName, burnScore },
  });
}

// Send weekly digest email
export async function sendWeeklyDigestEmail(
  email: string,
  username: string,
  topRoasts: Array<{ stackName: string; burnScore: number; slug: string }>,
  totalRoastsThisWeek: number,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const template = getWeeklyDigestEmail(username, topRoasts, totalRoastsThisWeek);
  return sendEmail({
    to: email,
    template,
    emailType: 'weekly_digest',
    userId,
    metadata: { totalRoastsThisWeek },
  });
}

// ============================================
// Email preview for testing/debugging
// ============================================

export function previewEmail(
  type: EmailType,
  data: Record<string, unknown>
): EmailTemplate {
  switch (type) {
    case 'welcome':
      return processTemplate(getWelcomeEmail(data.username as string || 'TestUser'));
    case 'roast_notification':
      return processTemplate(getRoastNotificationEmail(
        data.username as string || 'TestUser',
        data.stackName as string || 'My Test Stack',
        data.burnScore as number || 75,
        data.roastPreview as string || 'This is a preview of a roast...',
        data.stackSlug as string || 'test-stack',
        data.persona as string || 'Cynical Senior'
      ));
    case 'friend_roast_complete':
      return processTemplate(getFriendRoastNotificationEmail(
        data.senderName as string || 'Sender',
        data.recipientName as string || 'Recipient',
        data.stackName as string || 'Friend Stack',
        data.burnScore as number || 85,
        data.roastPreview as string || 'Your friend got destroyed...',
        data.stackSlug as string || 'friend-stack'
      ));
    case 'weekly_digest':
      return processTemplate(getWeeklyDigestEmail(
        data.username as string || 'TestUser',
        (data.topRoasts as Array<{ stackName: string; burnScore: number; slug: string }>) || [
          { stackName: 'Stack 1', burnScore: 95, slug: 'stack-1' },
          { stackName: 'Stack 2', burnScore: 87, slug: 'stack-2' },
        ],
        data.totalRoastsThisWeek as number || 42
      ));
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}
