import { GoogleGenerativeAI } from '@google/generative-ai';
import { ROAST_PERSONAS, getRandomPersona, type PersonaKey } from './roastPersonas';
import { AFFILIATE_LINKS, SPONSORED_TOOLS, getAffiliateLink, isSponsoredTool } from '@/data/affiliateLinks';
import { callAIWithFallback } from './aiProvider';

const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.warn('VITE_GOOGLE_AI_API_KEY is not set. AI roast generation will use backup provider if configured.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

interface Tool {
  name: string;
  category?: string;
  base_price?: number;
}

// Helper function to normalize error messages
function normalizeError(error: any): string {
  const errorMessage = error?.message || error?.toString() || '';
  const errorString = JSON.stringify(error || {}).toLowerCase();
  const fullErrorText = (errorMessage + ' ' + errorString).toLowerCase();
  
  // Check for rate limit / quota errors (429 status or quota-related messages)
  if (
    error?.status === 429 ||
    errorMessage.includes('429') ||
    fullErrorText.includes('quota') ||
    fullErrorText.includes('rate limit') ||
    fullErrorText.includes('rate-limit') ||
    fullErrorText.includes('exceeded your current quota') ||
    fullErrorText.includes('quota exceeded')
  ) {
    return 'Rate limit exceeded. Please try again in a few moments.';
  }
  
  // Check for API key errors
  if (
    error?.status === 401 ||
    fullErrorText.includes('api key') ||
    fullErrorText.includes('authentication') ||
    fullErrorText.includes('invalid api key')
  ) {
    return 'API key is invalid or missing. Please check your configuration.';
  }
  
  // Return original message for other errors, but clean it up
  return errorMessage || 'An unexpected error occurred. Please try again.';
}

interface RoastResult {
  roastText: string;
  burnScore: number;
  persona: string;
  personaKey: PersonaKey;
}

interface VisualRoastResult {
  roastText: string;
  burnScore: number;
  persona: string;
  personaKey: PersonaKey;
  detectedTech: string[];
  imageAnalysis: string;
}

interface StreamCallbacks {
  onChunk: (chunk: string, fullText: string) => void;
  onComplete: (result: RoastResult) => void;
  onError: (error: Error) => void;
}

interface VisualStreamCallbacks {
  onChunk: (chunk: string, fullText: string) => void;
  onComplete: (result: VisualRoastResult) => void;
  onError: (error: Error) => void;
}

// Helper to build the prompt
function buildPrompt(stackName: string, tools: Tool[], persona: { prompt: string }): string {
  const toolsWithCategories = tools
    .map(t => `${t.name}${t.category ? ` (${t.category})` : ''}`)
    .join(', ');

  return `${persona.prompt}

Now roast this tech stack:
Stack Name: "${stackName}"
Tools: ${toolsWithCategories}

Generate a witty, savage roast in your style. Keep it under 200 words. Be funny and reference specific tools.`;
}

// Non-streaming version (for backwards compatibility)
export async function generateRoast(
  stackName: string,
  tools: Tool[],
  personaKey?: PersonaKey
): Promise<RoastResult> {
  const selectedPersona = personaKey || getRandomPersona();
  const persona = ROAST_PERSONAS[selectedPersona];
  const prompt = buildPrompt(stackName, tools, persona);

  try {
    console.log('Calling AI API for roast generation...');
    const { text: roastText, provider } = await callAIWithFallback(prompt, {
      model: 'gemini-2.0-flash-exp', // Will be auto-mapped for Groq if needed
      temperature: 0.8,
      maxTokens: 1000,
    });

    console.log(`${provider === 'gemini' ? 'Gemini' : 'Groq'} response received, length:`, roastText.length);
    const burnScore = calculateBurnScore(roastText, tools);

    return {
      roastText,
      burnScore,
      persona: persona.name,
      personaKey: selectedPersona,
    };
  } catch (error: any) {
    console.error('Error generating roast:', error);
    const normalizedError = normalizeError(error);
    throw new Error(normalizedError);
  }
}

// Streaming version - shows text as it's generated
export async function generateRoastStreaming(
  stackName: string,
  tools: Tool[],
  callbacks: StreamCallbacks,
  personaKey?: PersonaKey
): Promise<void> {
  const selectedPersona = personaKey || getRandomPersona();
  const persona = ROAST_PERSONAS[selectedPersona];
  const prompt = buildPrompt(stackName, tools, persona);

  try {
    // For streaming, we'll use Gemini if available, otherwise fall back to non-streaming
    if (genAI) {
      try {
        console.log('Calling Gemini API (streaming) with model: gemini-2.0-flash-exp');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
        const result = await model.generateContentStream(prompt);
        
        let fullText = '';
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          callbacks.onChunk(chunkText, fullText);
        }

        if (!fullText) {
          throw new Error('Gemini returned empty response');
        }

        console.log('Streaming complete, total length:', fullText.length);
        const burnScore = calculateBurnScore(fullText, tools);

        callbacks.onComplete({
          roastText: fullText,
          burnScore,
          persona: persona.name,
          personaKey: selectedPersona,
        });
        return;
      } catch (error: any) {
        console.warn('Gemini streaming failed, falling back to non-streaming:', error.message);
        // Fall through to non-streaming backup
      }
    }

    // Fallback: Use non-streaming API with fallback
    console.log('Using non-streaming fallback...');
    const { text: fullText, provider } = await callAIWithFallback(prompt, {
      model: 'gemini-2.0-flash-exp', // Will be auto-mapped for Groq if needed
      temperature: 0.8,
      maxTokens: 1000,
    });

    // Simulate streaming by sending chunks
    const words = fullText.split(' ');
    let accumulated = '';
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
      accumulated += chunk;
      callbacks.onChunk(chunk, accumulated);
      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    console.log(`${provider} response complete, total length:`, fullText.length);
    const burnScore = calculateBurnScore(fullText, tools);

    callbacks.onComplete({
      roastText: fullText,
      burnScore,
      persona: persona.name,
      personaKey: selectedPersona,
    });
  } catch (error: any) {
    console.error('Error generating roast (streaming):', error);
    const normalizedError = normalizeError(error);
    callbacks.onError(new Error(normalizedError));
  }
}

function calculateBurnScore(roastText: string, tools: Tool[]): number {
  let score = 50; // Base score

  // Factors that increase burn score:
  
  // 1. Length of roast (longer = more savage)
  const wordCount = roastText.split(' ').length;
  if (wordCount > 150) score += 10;
  else if (wordCount > 100) score += 5;

  // 2. Mentions specific tools (shows attention to detail)
  const toolMentions = tools.filter(tool => 
    roastText.toLowerCase().includes(tool.name.toLowerCase())
  ).length;
  score += Math.min(toolMentions * 5, 20);

  // 3. Contains spicy keywords
  const spicyWords = ['bold', 'brave', 'interesting choice', 'enjoy', 'chaos', 'dangerous', 'ambitious'];
  const spicyCount = spicyWords.filter(word => 
    roastText.toLowerCase().includes(word)
  ).length;
  score += spicyCount * 3;

  // 4. Has questions (rhetorical = more savage)
  const questionCount = (roastText.match(/\?/g) || []).length;
  score += Math.min(questionCount * 4, 12);

  // 5. Random variation
  score += Math.floor(Math.random() * 10) - 5;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// Calculate burn score for visual roasts (no tool list)
function calculateVisualBurnScore(roastText: string): number {
  let score = 55; // Base score slightly higher for visual

  const wordCount = roastText.split(' ').length;
  if (wordCount > 200) score += 12;
  else if (wordCount > 150) score += 8;
  else if (wordCount > 100) score += 4;

  // Spicy words for architecture/visual roasts
  const spicyWords = [
    'chaos', 'spaghetti', 'nightmare', 'disaster', 'monolith', 
    'over-engineered', 'under-engineered', 'legacy', 'debt',
    'brave', 'ambitious', 'interesting', 'creative', 'unique'
  ];
  const spicyCount = spicyWords.filter(word => 
    roastText.toLowerCase().includes(word)
  ).length;
  score += spicyCount * 4;

  const questionCount = (roastText.match(/\?/g) || []).length;
  score += Math.min(questionCount * 3, 15);

  // Exclamation points = more savage
  const exclamationCount = (roastText.match(/!/g) || []).length;
  score += Math.min(exclamationCount * 2, 10);

  score += Math.floor(Math.random() * 10) - 5;

  return Math.max(0, Math.min(100, score));
}

// ============================================
// VISUAL ANALYSIS (Gemini Vision)
// ============================================

// Build prompt for visual analysis
function buildVisualPrompt(persona: { prompt: string; name: string }, context?: string): string {
  return `${persona.prompt}

You are analyzing an image of a tech stack, architecture diagram, code screenshot, or development-related visual.

Your task:
1. First, identify what technologies, tools, frameworks, or patterns you can see in this image
2. Then roast it mercilessly in your unique style
3. Be specific about what you see - reference actual elements from the image
4. Keep your roast under 250 words but make every word count

${context ? `Additional context from the user: "${context}"` : ''}

Format your response as:
**What I See:** [Brief description of the image and detected technologies]

**The Roast:** [Your savage critique]`;
}

// Convert File to base64 for Gemini Vision API
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Get MIME type from file
function getMimeType(file: File): string {
  const type = file.type;
  // Gemini supports: image/png, image/jpeg, image/webp, image/heic, image/heif
  if (['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'].includes(type)) {
    return type === 'image/jpg' ? 'image/jpeg' : type;
  }
  // Default to jpeg if unknown
  return 'image/jpeg';
}

// Non-streaming visual roast
export async function generateVisualRoast(
  imageFile: File,
  context?: string,
  personaKey?: PersonaKey
): Promise<VisualRoastResult> {
  const selectedPersona = personaKey || getRandomPersona();
  const persona = ROAST_PERSONAS[selectedPersona];
  const prompt = buildVisualPrompt(persona, context);

  try {
    if (!genAI) {
      throw new Error('Google AI API key is not configured. Please set VITE_GOOGLE_AI_API_KEY in your .env file.');
    }

    // Convert image to base64
    const base64Data = await fileToBase64(imageFile);
    const mimeType = getMimeType(imageFile);

    console.log('Calling Gemini Vision API with model: gemini-2.0-flash-exp');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    const roastText = response.text();

    if (!roastText) {
      throw new Error('Gemini returned empty response');
    }

    // Parse the response to extract detected tech and the roast
    const { detectedTech, imageAnalysis, roast } = parseVisualResponse(roastText);
    const burnScore = calculateVisualBurnScore(roast);

    return {
      roastText: roast,
      burnScore,
      persona: persona.name,
      personaKey: selectedPersona,
      detectedTech,
      imageAnalysis,
    };
  } catch (error: any) {
    console.error('Error generating visual roast:', error);
    const normalizedError = normalizeError(error);
    throw new Error(normalizedError);
  }
}

// Streaming visual roast
export async function generateVisualRoastStreaming(
  imageFile: File,
  callbacks: VisualStreamCallbacks,
  context?: string,
  personaKey?: PersonaKey
): Promise<void> {
  const selectedPersona = personaKey || getRandomPersona();
  const persona = ROAST_PERSONAS[selectedPersona];
  const prompt = buildVisualPrompt(persona, context);

  try {
    if (!genAI) {
      throw new Error('Google AI API key is not configured. Please set VITE_GOOGLE_AI_API_KEY in your .env file.');
    }

    // Convert image to base64
    const base64Data = await fileToBase64(imageFile);
    const mimeType = getMimeType(imageFile);

    console.log('Calling Gemini Vision API (streaming) with model: gemini-2.0-flash-exp');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContentStream([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    let fullText = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      callbacks.onChunk(chunkText, fullText);
    }

    if (!fullText) {
      throw new Error('Gemini returned empty response');
    }

    console.log('Visual streaming complete, total length:', fullText.length);

    // Parse the response
    const { detectedTech, imageAnalysis, roast } = parseVisualResponse(fullText);
    const burnScore = calculateVisualBurnScore(roast);

    callbacks.onComplete({
      roastText: roast,
      burnScore,
      persona: persona.name,
      personaKey: selectedPersona,
      detectedTech,
      imageAnalysis,
    });
  } catch (error: any) {
    console.error('Error generating visual roast (streaming):', error);
    const normalizedError = normalizeError(error);
    callbacks.onError(new Error(normalizedError));
  }
}

// Parse the visual response to extract sections
function parseVisualResponse(response: string): { 
  detectedTech: string[]; 
  imageAnalysis: string; 
  roast: string; 
} {
  let imageAnalysis = '';
  let roast = response;
  const detectedTech: string[] = [];

  // Try to extract "What I See" section
  const whatISeeMatch = response.match(/\*\*What I See:\*\*\s*([\s\S]*?)(?=\*\*The Roast:\*\*|$)/i);
  if (whatISeeMatch) {
    imageAnalysis = whatISeeMatch[1].trim();
  }

  // Try to extract "The Roast" section
  const roastMatch = response.match(/\*\*The Roast:\*\*\s*([\s\S]*?)$/i);
  if (roastMatch) {
    roast = roastMatch[1].trim();
  }

  // Extract detected technologies from the analysis
  const techPatterns = [
    /react/gi, /next\.?js/gi, /vue/gi, /angular/gi, /svelte/gi,
    /node\.?js/gi, /express/gi, /django/gi, /flask/gi, /fastapi/gi,
    /python/gi, /javascript/gi, /typescript/gi, /java/gi, /golang/gi, /rust/gi,
    /docker/gi, /kubernetes/gi, /aws/gi, /azure/gi, /gcp/gi, /vercel/gi,
    /postgres/gi, /mysql/gi, /mongodb/gi, /redis/gi, /graphql/gi,
    /tailwind/gi, /bootstrap/gi, /sass/gi, /css/gi,
    /git/gi, /github/gi, /gitlab/gi, /jenkins/gi, /terraform/gi,
    /nginx/gi, /apache/gi, /cloudflare/gi,
    /vscode/gi, /vim/gi, /neovim/gi, /intellij/gi,
    /microservices/gi, /monolith/gi, /serverless/gi, /rest\s?api/gi,
  ];

  techPatterns.forEach(pattern => {
    const matches = response.match(pattern);
    if (matches) {
      const tech = matches[0].charAt(0).toUpperCase() + matches[0].slice(1).toLowerCase();
      if (!detectedTech.includes(tech)) {
        detectedTech.push(tech);
      }
    }
  });

  return { detectedTech, imageAnalysis, roast };
}

// ============================================
// AI-POWERED ALTERNATIVE SUGGESTIONS
// ============================================

export interface WeakTool {
  tool_name: string;
  current_cost: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
  time_waste: string;
}

export interface AlternativeSuggestion {
  name: string;
  reason: string;
  estimated_cost: string;
  savings: {
    money: string;
    time: string;
  };
  priority: number;
  affiliate_url?: string | null;
  commission?: number;
  is_sponsored?: boolean;
}

export interface AlternativeCategory {
  category: string;
  current_tool: string;
  suggestions: AlternativeSuggestion[];
}

export interface StackAlternativesResult {
  weak_tools: WeakTool[];
  alternatives: AlternativeCategory[];
  total_savings: {
    monthly_money: string;
    yearly_money: string;
    monthly_hours: string;
  };
}

interface UserContext {
  budget?: string;
  scale?: string;
  priorities?: string[];
}

// Build prompt for generating stack improvements (for Fix My Stack)
function buildImprovementsPrompt(
  stackName: string,
  tools: Tool[]
): string {
  const toolsList = tools
    .map(t => {
      const cost = t.base_price ? `$${t.base_price}/month` : 'Free';
      return `- ${t.name}${t.category ? ` (${t.category})` : ''} - ${cost}`;
    })
    .join('\n');

  return `You are an expert tech stack consultant. Analyze this tech stack and identify missing critical tools, optimization opportunities, and areas for improvement.

Stack Name: "${stackName}"
Current Tools:
${toolsList}

Your task:
1. Identify 2-5 critical missing tools or categories (e.g., authentication, monitoring, analytics, payments, email, CI/CD, database backups, etc.)
2. For each missing/weak area, provide:
   - A clear issue description
   - A specific recommendation
   - The category it belongs to
   - Severity level: "high" (critical, should add immediately), "medium" (important for production), "low" (nice to have)

Focus on:
- Security essentials (auth, security scanning)
- Production readiness (monitoring, error tracking, logging)
- Business essentials (analytics, payments, email)
- Developer experience (CI/CD, testing tools)
- Performance (caching, CDN, optimization)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "suggestions": [
    {
      "issue": "Missing authentication service",
      "recommendation": "Add an authentication service like Clerk or Supabase Auth to secure user accounts and manage sessions",
      "category": "Authentication",
      "severity": "high",
      "tool_name": "Clerk"
    }
  ]
}

Be specific and actionable. Prioritize production-critical tools.`;
}

// Generate stack improvements using Gemini AI (for Fix My Stack feature)
export async function generateStackImprovements(
  stackName: string,
  tools: Tool[]
): Promise<{ suggestions: Array<{
  issue: string;
  recommendation: string;
  category: string;
  severity: string;
  tool_name: string;
}> }> {
  const prompt = buildImprovementsPrompt(stackName, tools);

  try {
    console.log('Calling AI API for stack improvements...');
    const { text, provider } = await callAIWithFallback(prompt, {
      model: 'gemini-2.0-flash-exp', // Will be auto-mapped for Groq if needed
      temperature: 0.7,
      maxTokens: 2048,
    });

    console.log(`${provider === 'gemini' ? 'Gemini' : 'Groq'} response received`);

    // Parse JSON from response (remove markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const improvements = JSON.parse(jsonText);
    return improvements;
  } catch (error: any) {
    console.error('Error generating stack improvements:', error);
    
    const normalizedError = normalizeError(error);
    
    // If JSON parsing fails, try to extract JSON from the response
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      const text = error.response?.text() || error.message || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const improvements = JSON.parse(jsonMatch[0]);
          return improvements;
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
        }
      }
    }
    
    throw new Error(normalizedError);
  }
}

// Build prompt for generating stack alternatives
function buildAlternativesPrompt(
  stackName: string,
  tools: Tool[],
  userContext?: UserContext
): string {
  const toolsList = tools
    .map(t => {
      const cost = t.base_price ? `$${t.base_price}/month` : 'Free';
      return `- ${t.name}${t.category ? ` (${t.category})` : ''} - ${cost}`;
    })
    .join('\n');

  const contextInfo = userContext
    ? `\nUser Context:\n- Budget: ${userContext.budget || 'Not specified'}\n- Scale: ${userContext.scale || 'Not specified'}\n- Priorities: ${userContext.priorities?.join(', ') || 'Not specified'}`
    : '';

  return `You are a brutal but accurate tech stack consultant. Analyze this tech stack and identify weak, outdated, or overpriced tools. Then suggest better alternatives with specific cost and time savings.

Stack Name: "${stackName}"
Tools:
${toolsList}${contextInfo}

Your task:
1. Identify 1-3 weak/outdated/overpriced tools from the stack
2. For each weak tool, suggest 2-3 better alternatives
3. Calculate realistic savings:
   - Monthly cost difference (be specific: "$15/month → $5/month")
   - Time saved (setup time, maintenance hours/month)
   - Be honest and accurate - don't exaggerate
4. Rate severity: high (critical issue), medium (could be better), low (minor optimization)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "weak_tools": [
    {
      "tool_name": "Tool Name",
      "current_cost": "$X/month",
      "reason": "One-sentence brutal critique explaining why it's weak",
      "severity": "high|medium|low",
      "time_waste": "~X hours/month on [specific issue]"
    }
  ],
  "alternatives": [
    {
      "category": "category_name",
      "current_tool": "Weak Tool Name",
      "suggestions": [
        {
          "name": "Alternative Tool Name",
          "reason": "Why it's better (specific benefits, not generic)",
          "estimated_cost": "$X/month (free tier available)",
          "savings": {
            "money": "$X/month ($Y/year)",
            "time": "X hours/month (specific benefit)"
          },
          "priority": 1
        }
      ]
    }
  ],
  "total_savings": {
    "monthly_money": "$X",
    "yearly_money": "$Y",
    "monthly_hours": "X hours"
  }
}

Be brutal but fair. Focus on real savings and improvements.`;
}

// Generate stack alternatives using Gemini AI
export async function generateStackAlternatives(
  stackName: string,
  tools: Tool[],
  userContext?: UserContext
): Promise<StackAlternativesResult> {
  const prompt = buildAlternativesPrompt(stackName, tools, userContext);

  try {
    console.log('Calling AI API for stack alternatives...');
    const { text, provider } = await callAIWithFallback(prompt, {
      model: 'gemini-2.0-flash-exp', // Will be auto-mapped for Groq if needed
      temperature: 0.7,
      maxTokens: 2048,
    });

    console.log(`${provider === 'gemini' ? 'Gemini' : 'Groq'} response received`);

    // Parse JSON from response (remove markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const alternatives: StackAlternativesResult = JSON.parse(jsonText);

    // Inject affiliate links into alternatives and prioritize sponsored tools
    alternatives.alternatives = alternatives.alternatives.map(category => {
      const sponsoredTool = SPONSORED_TOOLS[category.category.toLowerCase()];
      
      return {
        ...category,
        suggestions: category.suggestions
          .map(suggestion => {
            const affiliateLink = getAffiliateLink(suggestion.name);
            const isSponsored = isSponsoredTool(suggestion.name, category.category);
            
            // If this is the sponsored tool for this category, ensure it's in top 3
            let priority = suggestion.priority;
            if (isSponsored && sponsoredTool) {
              // Sponsored tools get highest priority (1-3 range)
              priority = Math.min(3, Math.max(1, suggestion.priority));
            }
            
            return {
              ...suggestion,
              affiliate_url: affiliateLink?.url || null,
              commission: affiliateLink?.commission || 0,
              is_sponsored: isSponsored,
              priority,
            };
          })
          .sort((a, b) => {
            // Sort by: sponsored first, then priority
            if (a.is_sponsored && !b.is_sponsored) return -1;
            if (!a.is_sponsored && b.is_sponsored) return 1;
            return a.priority - b.priority;
          })
          .slice(0, 3), // Limit to top 3 suggestions per category
      };
    });

    return alternatives;
  } catch (error: any) {
    console.error('Error generating stack alternatives:', error);
    
    // Check for rate limit first
    const normalizedError = normalizeError(error);
    if (normalizedError.includes('Rate limit')) {
      throw new Error(normalizedError);
    }
    
    // If JSON parsing fails, try to extract JSON from the response
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      const text = error.response?.text() || error.message || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const alternatives: StackAlternativesResult = JSON.parse(jsonMatch[0]);
          return alternatives;
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
        }
      }
    }
    
    throw new Error(normalizedError);
  }
}