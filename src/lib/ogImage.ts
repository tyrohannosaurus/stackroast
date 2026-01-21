import { supabase } from './supabase';

interface OGImageData {
  stackName: string;
  burnScore: number;
  roastText: string;
  persona: string;
  username: string;
  toolCount: number;
  stackSlug: string;
}

// Generate OG image using Canvas and upload to Supabase Storage
export async function generateAndUploadOGImage(data: OGImageData): Promise<string | null> {
  try {
    // Check if OG image already exists
    const existingUrl = await getOGImageUrl(data.stackSlug);
    if (existingUrl) {
      return existingUrl;
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // OG image dimensions
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // Draw the OG image
    drawOGImage(ctx, width, height, data);

    // Convert to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png', 1);
    });

    if (!blob) return null;

    // Upload to Supabase Storage
    const fileName = `og-images/${data.stackSlug}.png`;
    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading OG image:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('public')
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('Error generating OG image:', error);
    return null;
  }
}

// Get existing OG image URL
export async function getOGImageUrl(stackSlug: string): Promise<string | null> {
  try {
    const { data } = supabase.storage
      .from('public')
      .getPublicUrl(`og-images/${stackSlug}.png`);

    // Check if file exists by trying to fetch it
    if (data?.publicUrl) {
      const response = await fetch(data.publicUrl, { method: 'HEAD' });
      if (response.ok) {
        return data.publicUrl;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Draw the OG image on canvas
function drawOGImage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: OGImageData
) {
  const { stackName, burnScore, roastText, persona, username, toolCount } = data;

  // Background gradient - Fire & Ash theme
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#09090b');
  gradient.addColorStop(0.5, '#18181b');
  gradient.addColorStop(1, '#09090b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle fire glow effect
  const fireGlow = ctx.createRadialGradient(width * 0.3, height * 0.7, 0, width * 0.3, height * 0.7, 400);
  fireGlow.addColorStop(0, 'rgba(249, 115, 22, 0.15)');
  fireGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = fireGlow;
  ctx.fillRect(0, 0, width, height);

  // Border with orange glow
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Inner subtle border
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  // Logo and brand
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.fillText('🔥 StackRoast', 60, 75);

  // Stack name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  const maxNameWidth = width - 320;
  let displayName = stackName;
  if (ctx.measureText(stackName).width > maxNameWidth) {
    while (ctx.measureText(displayName + '...').width > maxNameWidth && displayName.length > 0) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '...';
  }
  ctx.fillText(displayName, 60, 145);

  // Username and tool count
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '22px system-ui, -apple-system, sans-serif';
  ctx.fillText(`by @${username} • ${toolCount} tools`, 60, 190);

  // Burn Score circle
  const scoreX = width - 180;
  const scoreY = 130;
  const scoreRadius = 85;

  // Score background
  ctx.beginPath();
  ctx.arc(scoreX, scoreY, scoreRadius, 0, Math.PI * 2);
  const scoreGradient = ctx.createRadialGradient(scoreX, scoreY, 0, scoreX, scoreY, scoreRadius);
  if (burnScore >= 80) {
    scoreGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    scoreGradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
  } else if (burnScore >= 60) {
    scoreGradient.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
    scoreGradient.addColorStop(1, 'rgba(249, 115, 22, 0.1)');
  } else {
    scoreGradient.addColorStop(0, 'rgba(234, 179, 8, 0.4)');
    scoreGradient.addColorStop(1, 'rgba(234, 179, 8, 0.1)');
  }
  ctx.fillStyle = scoreGradient;
  ctx.fill();

  // Score border
  ctx.strokeStyle = burnScore >= 80 ? '#ef4444' : burnScore >= 60 ? '#f97316' : '#eab308';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Score text
  ctx.fillStyle = burnScore >= 80 ? '#ef4444' : burnScore >= 60 ? '#f97316' : '#eab308';
  ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(burnScore.toString(), scoreX, scoreY + 20);

  ctx.fillStyle = '#71717a';
  ctx.font = '18px system-ui, -apple-system, sans-serif';
  ctx.fillText('/100 BURN', scoreX, scoreY + 50);
  ctx.textAlign = 'left';

  // Roast text box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  roundRect(ctx, 48, 235, width - 96, 270, 16);
  ctx.fill();

  ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Persona label
  ctx.fillStyle = '#f97316';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  const personaEmoji = getPersonaEmoji(persona);
  ctx.fillText(`${personaEmoji} ${persona} says:`, 80, 285);

  // Roast text with word wrap
  ctx.fillStyle = '#e4e4e7';
  ctx.font = 'italic 26px system-ui, -apple-system, sans-serif';

  const maxWidth = width - 180;
  const lineHeight = 38;
  const words = roastText.split(' ');
  let line = '"';
  let y = 335;
  const maxLines = 4;
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && line !== '"') {
      ctx.fillText(line, 80, y);
      line = words[i] + ' ';
      y += lineHeight;
      lineCount++;

      if (lineCount >= maxLines - 1) {
        const remaining = words.slice(i).join(' ');
        if (remaining.length > 40) {
          ctx.fillText(remaining.substring(0, 37) + '..."', 80, y);
        } else {
          ctx.fillText(remaining + '"', 80, y);
        }
        break;
      }
    } else {
      line = testLine;
    }

    if (i === words.length - 1 && lineCount < maxLines) {
      ctx.fillText(line.trim() + '"', 80, y);
    }
  }

  // Footer
  ctx.fillStyle = '#71717a';
  ctx.font = '20px system-ui, -apple-system, sans-serif';
  ctx.fillText('stackroast.dev', 60, height - 45);

  // Burn intensity badge
  let intensityLabel = '❄️ MILD';
  let intensityColor = '#22c55e';
  if (burnScore >= 80) {
    intensityLabel = '🔥🔥🔥 SAVAGE';
    intensityColor = '#ef4444';
  } else if (burnScore >= 60) {
    intensityLabel = '🔥🔥 SPICY';
    intensityColor = '#f97316';
  } else if (burnScore >= 40) {
    intensityLabel = '🔥 WARM';
    intensityColor = '#eab308';
  }

  ctx.fillStyle = intensityColor;
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(intensityLabel, width - 60, height - 45);
  ctx.textAlign = 'left';
}

// Helper to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getPersonaEmoji(persona: string): string {
  const p = persona?.toLowerCase() || '';
  if (p.includes('vc') || p.includes('silicon')) return '💼';
  if (p.includes('rust')) return '🦀';
  if (p.includes('senior') || p.includes('cynical')) return '👴';
  if (p.includes('linux') || p.includes('purist')) return '🐧';
  if (p.includes('startup') || p.includes('founder')) return '🚀';
  if (p.includes('security')) return '🔒';
  return '🤖';
}

// Generate OG image as data URL (for immediate use without upload)
export function generateOGImageDataUrl(data: OGImageData): string | null {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    drawOGImage(ctx, width, height, data);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating OG image data URL:', error);
    return null;
  }
}
