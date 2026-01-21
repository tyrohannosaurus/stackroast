// Email templates for StackRoast notifications
// These templates are used by the email service to send formatted emails

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Brand colors and styles
const brandColors = {
  primary: '#f97316', // Orange-500
  secondary: '#ef4444', // Red-500
  background: '#09090b', // Zinc-950
  cardBg: '#18181b', // Zinc-900
  text: '#fafafa', // Zinc-50
  muted: '#a1a1aa', // Zinc-400
};

const baseStyles = `
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: ${brandColors.background};
    color: ${brandColors.text};
    margin: 0;
    padding: 0;
    line-height: 1.6;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  .card {
    background-color: ${brandColors.cardBg};
    border-radius: 12px;
    padding: 32px;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .logo {
    text-align: center;
    margin-bottom: 24px;
  }
  .logo-text {
    font-size: 24px;
    font-weight: bold;
    color: ${brandColors.text};
  }
  .logo-text span {
    color: ${brandColors.primary};
  }
  h1 {
    color: ${brandColors.text};
    font-size: 28px;
    margin-bottom: 16px;
  }
  p {
    color: ${brandColors.muted};
    font-size: 16px;
    margin-bottom: 16px;
  }
  .highlight {
    color: ${brandColors.primary};
    font-weight: 600;
  }
  .btn {
    display: inline-block;
    background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
    color: white !important;
    text-decoration: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 16px 0;
  }
  .btn:hover {
    opacity: 0.9;
  }
  .score-badge {
    display: inline-block;
    background: rgba(249, 115, 22, 0.2);
    color: ${brandColors.primary};
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 24px;
    margin: 16px 0;
  }
  .roast-box {
    background: rgba(0,0,0,0.3);
    border-left: 4px solid ${brandColors.primary};
    padding: 16px;
    margin: 16px 0;
    border-radius: 0 8px 8px 0;
  }
  .roast-text {
    font-style: italic;
    color: ${brandColors.text};
  }
  .footer {
    text-align: center;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  .footer p {
    font-size: 12px;
    color: ${brandColors.muted};
  }
  .footer a {
    color: ${brandColors.primary};
    text-decoration: none;
  }
`;

// Welcome email template
export function getWelcomeEmail(username: string): EmailTemplate {
  const subject = `Welcome to StackRoast, ${username}! 🔥`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">🔥 Stack<span>Roast</span></span>
      </div>
      
      <h1>Welcome to the Roast, ${username}!</h1>
      
      <p>You've joined the community of developers who embrace brutal honesty about their tech stacks. We're excited to have you!</p>
      
      <p>Here's what you can do:</p>
      
      <ul style="color: ${brandColors.muted}; padding-left: 20px;">
        <li><strong style="color: ${brandColors.text};">Submit your stack</strong> - Get AI-powered roasts on your tech choices</li>
        <li><strong style="color: ${brandColors.text};">Import from GitHub</strong> - We'll auto-detect your stack from your repos</li>
        <li><strong style="color: ${brandColors.text};">Roast a friend</strong> - Challenge your colleagues to get roasted</li>
        <li><strong style="color: ${brandColors.text};">Earn Logs</strong> - Build reputation by participating</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="{{siteUrl}}" class="btn">🔥 Get Your First Roast</a>
      </div>
      
      <p style="text-align: center; margin-top: 24px;">
        Think your stack can handle the heat?
      </p>
      
      <div class="footer">
        <p>You're receiving this because you signed up for StackRoast.</p>
        <p><a href="{{siteUrl}}/dashboard">Manage preferences</a> | <a href="{{siteUrl}}">Visit StackRoast</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Welcome to StackRoast, ${username}! 🔥

You've joined the community of developers who embrace brutal honesty about their tech stacks.

Here's what you can do:
- Submit your stack - Get AI-powered roasts on your tech choices
- Import from GitHub - We'll auto-detect your stack from your repos  
- Roast a friend - Challenge your colleagues to get roasted
- Earn Logs - Build reputation by participating

Visit {{siteUrl}} to get your first roast!

Think your stack can handle the heat?

---
You're receiving this because you signed up for StackRoast.
  `;

  return { subject, html, text };
}

// Roast notification email template
export function getRoastNotificationEmail(
  username: string,
  stackName: string,
  burnScore: number,
  roastPreview: string,
  stackSlug: string,
  persona: string
): EmailTemplate {
  const intensity = burnScore >= 80 ? '🔥🔥🔥 SAVAGE' : burnScore >= 60 ? '🔥🔥 SPICY' : burnScore >= 40 ? '🔥 WARM' : '❄️ MILD';
  const scoreColor = burnScore >= 80 ? '#ef4444' : burnScore >= 60 ? '#f97316' : burnScore >= 40 ? '#eab308' : '#22c55e';
  
  const subject = `Your "${stackName}" stack just got roasted! ${burnScore}/100 🔥`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">🔥 Stack<span>Roast</span></span>
      </div>
      
      <h1>Your Stack Got Roasted!</h1>
      
      <p>Hey ${username}, the AI has spoken about <span class="highlight">"${stackName}"</span>:</p>
      
      <div style="text-align: center;">
        <div class="score-badge" style="color: ${scoreColor}; background: ${scoreColor}20;">
          ${burnScore}/100
        </div>
        <p style="margin: 8px 0; font-weight: bold; color: ${scoreColor};">${intensity}</p>
      </div>
      
      <div class="roast-box">
        <p style="color: ${brandColors.primary}; font-size: 14px; margin-bottom: 8px;">
          🤖 ${persona} says:
        </p>
        <p class="roast-text">"${roastPreview}"</p>
      </div>
      
      <div style="text-align: center;">
        <a href="{{siteUrl}}/stack/${stackSlug}" class="btn">View Full Roast</a>
      </div>
      
      <p style="text-align: center; color: ${brandColors.muted}; font-size: 14px;">
        Share this roast with your friends and see who has the most roastable stack!
      </p>
      
      <div class="footer">
        <p>You're receiving this because your stack was roasted on StackRoast.</p>
        <p><a href="{{siteUrl}}/dashboard">Manage notifications</a> | <a href="{{siteUrl}}">Visit StackRoast</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Your Stack Got Roasted! 🔥

Hey ${username}, the AI has spoken about "${stackName}":

BURN SCORE: ${burnScore}/100 - ${intensity}

${persona} says:
"${roastPreview}"

View the full roast: {{siteUrl}}/stack/${stackSlug}

Share this with your friends and see who has the most roastable stack!

---
You're receiving this because your stack was roasted on StackRoast.
Manage notifications: {{siteUrl}}/dashboard
  `;

  return { subject, html, text };
}

// Friend roast invite notification
export function getFriendRoastNotificationEmail(
  senderName: string,
  recipientName: string,
  stackName: string,
  burnScore: number,
  roastPreview: string,
  stackSlug: string
): EmailTemplate {
  const subject = `${recipientName} accepted your roast challenge! 🔥`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">🔥 Stack<span>Roast</span></span>
      </div>
      
      <h1>Your Friend Got Roasted!</h1>
      
      <p>Hey ${senderName}! <span class="highlight">${recipientName}</span> accepted your roast challenge and their stack got destroyed:</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <p style="font-size: 20px; font-weight: bold; color: ${brandColors.text};">"${stackName}"</p>
        <div class="score-badge">
          ${burnScore}/100
        </div>
      </div>
      
      <div class="roast-box">
        <p class="roast-text">"${roastPreview}"</p>
      </div>
      
      <div style="text-align: center;">
        <a href="{{siteUrl}}/stack/${stackSlug}" class="btn">See The Carnage</a>
      </div>
      
      <p style="text-align: center; color: ${brandColors.muted}; font-size: 14px;">
        Think you can do better? Submit your own stack and show them how it's done!
      </p>
      
      <div class="footer">
        <p>You're receiving this because ${recipientName} completed your roast invite.</p>
        <p><a href="{{siteUrl}}/dashboard">Manage notifications</a> | <a href="{{siteUrl}}">Visit StackRoast</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Your Friend Got Roasted! 🔥

Hey ${senderName}! ${recipientName} accepted your roast challenge and their stack got destroyed:

Stack: "${stackName}"
Burn Score: ${burnScore}/100

"${roastPreview}"

See the full roast: {{siteUrl}}/stack/${stackSlug}

Think you can do better? Submit your own stack!

---
You're receiving this because ${recipientName} completed your roast invite.
  `;

  return { subject, html, text };
}

// Weekly digest email
export function getWeeklyDigestEmail(
  username: string,
  topRoasts: Array<{ stackName: string; burnScore: number; slug: string }>,
  totalRoastsThisWeek: number
): EmailTemplate {
  const subject = `🔥 This Week's Hottest Roasts - StackRoast Digest`;
  
  const roastListHtml = topRoasts.map(roast => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <a href="{{siteUrl}}/stack/${roast.slug}" style="color: ${brandColors.text}; text-decoration: none; font-weight: 500;">${roast.stackName}</a>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
        <span style="color: ${roast.burnScore >= 80 ? '#ef4444' : roast.burnScore >= 60 ? '#f97316' : '#eab308'}; font-weight: bold;">${roast.burnScore}/100</span>
      </td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">🔥 Stack<span>Roast</span></span>
      </div>
      
      <h1>Weekly Roast Roundup</h1>
      
      <p>Hey ${username}! Here's what went down in the StackRoast community this week:</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <div class="score-badge">
          ${totalRoastsThisWeek}
        </div>
        <p style="color: ${brandColors.muted};">stacks roasted this week</p>
      </div>
      
      <h2 style="color: ${brandColors.text}; font-size: 18px; margin-top: 32px;">🏆 Top Roasts This Week</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 12px; border-bottom: 2px solid ${brandColors.primary}; color: ${brandColors.muted};">Stack</th>
            <th style="text-align: right; padding: 12px; border-bottom: 2px solid ${brandColors.primary}; color: ${brandColors.muted};">Burn Score</th>
          </tr>
        </thead>
        <tbody>
          ${roastListHtml}
        </tbody>
      </table>
      
      <div style="text-align: center; margin-top: 32px;">
        <a href="{{siteUrl}}" class="btn">Submit Your Stack</a>
      </div>
      
      <div class="footer">
        <p>You're receiving this weekly digest from StackRoast.</p>
        <p><a href="{{siteUrl}}/dashboard">Unsubscribe</a> | <a href="{{siteUrl}}">Visit StackRoast</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
🔥 Weekly Roast Roundup - StackRoast

Hey ${username}! Here's what went down this week:

${totalRoastsThisWeek} stacks roasted this week!

Top Roasts:
${topRoasts.map(r => `- ${r.stackName}: ${r.burnScore}/100`).join('\n')}

Submit your stack: {{siteUrl}}

---
Unsubscribe: {{siteUrl}}/dashboard
  `;

  return { subject, html, text };
}
