// Supabase Edge Function for sending saved stack reminder emails
// This function runs daily via cron job to remind users about saved stacks
// Deploy with: supabase functions deploy send-reminders
// Set up cron: supabase functions cron send-reminders "0 10 * * *" (runs daily at 10 AM UTC)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "StackRoast <noreply@stackroast.dev>";
const SITE_URL = Deno.env.get("SITE_URL") || "https://stackroast.dev";

// Allowed origins for CORS (production and development)
const ALLOWED_ORIGINS = [
  "https://stackroast.dev",
  "https://www.stackroast.dev",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

interface SavedStackReminder {
  id: string;
  user_id: string;
  stack_id: string;
  reminder_scheduled_for: string;
  stack: {
    name: string;
    slug: string;
    view_count?: number;
    ai_alternatives?: any;
  }[];
  profile: {
    email?: string;
    username: string;
  }[];
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key exists
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query saved stacks that need reminders
    const now = new Date().toISOString();
    const { data: savedStacks, error: queryError } = await supabase
      .from("saved_stacks")
      .select(`
        id,
        user_id,
        stack_id,
        reminder_scheduled_for,
        stack:stacks (
          name,
          slug,
          view_count,
          ai_alternatives
        ),
        profile:profiles!saved_stacks_user_id_fkey (
          email,
          username
        )
      `)
      .eq("reminder_sent", false)
      .lte("reminder_scheduled_for", now)
      .limit(100); // Process in batches

    if (queryError) {
      console.error("Error querying saved stacks:", queryError);
      return new Response(
        JSON.stringify({ error: "Failed to query saved stacks" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!savedStacks || savedStacks.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No reminders to send",
          count: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each saved stack
    for (const savedStack of savedStacks as SavedStackReminder[]) {
      try {
        const profile = savedStack.profile?.[0];
        const email = profile?.email;
        if (!email) {
          console.log(`Skipping user ${savedStack.user_id} - no email`);
          continue;
        }

        const stack = savedStack.stack?.[0];
        if (!stack) {
          console.log(`Skipping saved stack ${savedStack.id} - stack not found`);
          continue;
        }

        // Calculate savings if alternatives exist
        const alternatives = stack.ai_alternatives;
        const savings = alternatives?.total_savings;
        const savingsText = savings
          ? `💰 Potential savings: ${savings.yearly_money || savings.monthly_money || ""}`
          : "";

        // Get view count increase (mock for now - could track this)
        const viewCountIncrease = stack.view_count || 0;
        const viewText =
          viewCountIncrease > 0
            ? `🔥 Update: ${viewCountIncrease} developers viewed this stack this week`
            : "";

        // Build email content
        const subject = `Your saved stack: ${stack.name}`;
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🔥 StackRoast</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Your saved stack: "${stack.name}"</h2>
    
    <p style="color: #6b7280; font-size: 16px;">
      You saved "${stack.name}" 3 days ago. Here's what's happening:
    </p>
    
    ${viewText ? `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">${viewText}</p>
    </div>` : ""}
    
    ${savingsText ? `<div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #065f46; font-size: 14px;">${savingsText}</p>
    </div>` : ""}
    
    <div style="margin: 30px 0;">
      <a href="${SITE_URL}/stack/${stack.slug}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Your Stack →
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
      Not interested? <a href="${SITE_URL}/saved" style="color: #667eea; text-decoration: none;">Manage your saved stacks</a>
    </p>
    
    <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
      You're receiving this because you saved a stack on StackRoast. 
      <a href="${SITE_URL}/settings/email" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from reminders</a>
    </p>
  </div>
</body>
</html>
        `;

        const text = `
StackRoast Reminder

Your saved stack: "${stack.name}"

You saved "${stack.name}" 3 days ago.

${viewText || ""}
${savingsText || ""}

View your stack: ${SITE_URL}/stack/${stack.slug}

Manage saved stacks: ${SITE_URL}/saved
        `;

        // Send email via Resend with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        let emailResponse;
        try {
          emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: [email],
              subject,
              html,
              text,
              tags: [{ name: "type", value: "saved_stack_reminder" }],
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
          throw new Error(emailResult.message || "Failed to send email");
        }

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from("saved_stacks")
          .update({ reminder_sent: true })
          .eq("id", savedStack.id);

        if (updateError) {
          console.error(
            `Failed to mark reminder as sent for ${savedStack.id}:`,
            updateError
          );
        }

        successCount++;
        console.log(`Reminder sent to ${email} for stack ${stack.name}`);
      } catch (error) {
        errorCount++;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Stack ${savedStack.id}: ${errorMsg}`);
        console.error(`Error processing saved stack ${savedStack.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: savedStacks.length,
        sent: successCount,
        errors: errorCount,
        errorDetails: errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
