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

export async function generateRoast(
  stackName: string,
  tools: Tool[],
  personaKey?: PersonaKey
): Promise<RoastResult> {
  // Use provided persona or pick random one
  const selectedPersona = personaKey || getRandomPersona();
  const persona = ROAST_PERSONAS[selectedPersona];

  // Build the tools list
  const toolsList = tools.map(t => t.name).join(', ');
  const toolsWithCategories = tools
    .map(t => `${t.name}${t.category ? ` (${t.category})` : ''}`)
    .join(', ');

  // Construct the prompt
  const prompt = `${persona.prompt}

Now roast this tech stack:
Stack Name: "${stackName}"
Tools: ${toolsWithCategories}

Generate a witty, savage roast in your style. Keep it under 200 words. Be funny and reference specific tools.`;

  try {
    if (!genAI) {
      throw new Error('Google AI API key is not configured. Please set VITE_GOOGLE_AI_API_KEY in your .env file.');
    }

    console.log('Calling Gemini API with model: gemini-2.5-flash');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const roastText = response.text();

    if (!roastText) {
      throw new Error('Gemini returned empty response');
    }

    console.log('Gemini response received, length:', roastText.length);

    // Calculate burn score (0-100) based on various factors
    const burnScore = calculateBurnScore(roastText, tools);

    return {
      roastText,
      burnScore,
      persona: persona.name,
      personaKey: selectedPersona,
    };
  } catch (error: any) {
    console.error('Error generating roast:', error);
    console.error('Error details:', error?.message, error?.stack);
    throw new Error(error?.message || 'Failed to generate roast. Please try again.');
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