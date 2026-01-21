import { GoogleGenerativeAI } from '@google/generative-ai';
import { ROAST_PERSONAS, getRandomPersona, type PersonaKey } from './roastPersonas';

const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.warn('VITE_GOOGLE_AI_API_KEY is not set. AI roast generation will fail.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

interface Tool {
  name: string;
  category?: string;
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
    if (!genAI) {
      throw new Error('Google AI API key is not configured. Please set VITE_GOOGLE_AI_API_KEY in your .env file.');
    }

    console.log('Calling Gemini API with model: gemini-2.0-flash-exp');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const roastText = response.text();

    if (!roastText) {
      throw new Error('Gemini returned empty response');
    }

    console.log('Gemini response received, length:', roastText.length);
    const burnScore = calculateBurnScore(roastText, tools);

    return {
      roastText,
      burnScore,
      persona: persona.name,
      personaKey: selectedPersona,
    };
  } catch (error: any) {
    console.error('Error generating roast:', error);
    throw new Error(error?.message || 'Failed to generate roast. Please try again.');
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
    if (!genAI) {
      throw new Error('Google AI API key is not configured. Please set VITE_GOOGLE_AI_API_KEY in your .env file.');
    }

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
  } catch (error: any) {
    console.error('Error generating roast (streaming):', error);
    callbacks.onError(new Error(error?.message || 'Failed to generate roast. Please try again.'));
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
    throw new Error(error?.message || 'Failed to analyze image. Please try again.');
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
    callbacks.onError(new Error(error?.message || 'Failed to analyze image. Please try again.'));
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