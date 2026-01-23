/**
 * AI Provider Abstraction with Fallback Support
 * 
 * Primary: Google Gemini
 * Backup: Groq (free tier, fast, no credit card required)
 * 
 * Automatically falls back to backup provider if primary fails due to:
 * - Rate limits (429)
 * - Quota exceeded
 * - API errors
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Primary: Google Gemini
const geminiApiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// Backup: Groq (free tier, fast, no credit card)
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

export type AIProvider = 'gemini' | 'groq';

export interface AIResponse {
  text: string;
  provider: AIProvider;
}

export interface AICallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Check if an error is a rate limit or quota error
 */
function isRateLimitError(error: any): boolean {
  const errorMessage = error?.message || error?.toString() || '';
  const errorString = JSON.stringify(error || {}).toLowerCase();
  const fullErrorText = (errorMessage + ' ' + errorString).toLowerCase();
  
  return (
    error?.status === 429 ||
    errorMessage.includes('429') ||
    fullErrorText.includes('quota') ||
    fullErrorText.includes('rate limit') ||
    fullErrorText.includes('rate-limit') ||
    fullErrorText.includes('exceeded your current quota') ||
    fullErrorText.includes('quota exceeded') ||
    fullErrorText.includes('resource exhausted')
  );
}

/**
 * Call Gemini API
 */
async function callGemini(
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  if (!genAI) {
    throw new Error('Gemini API key is not configured');
  }

  const model = genAI.getGenerativeModel({ 
    model: options.model || 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 2048,
    },
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  return { text, provider: 'gemini' };
}

/**
 * Call Groq API (backup provider)
 */
async function callGroq(
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  if (!groqApiKey) {
    throw new Error('Groq API key is not configured. Set VITE_GROQ_API_KEY in .env');
  }

  // Map Gemini model names to Groq models, or use default Groq model
  // Current available Groq models (as of 2025):
  // - llama-3.3-70b-versatile (latest, recommended, 280 tokens/sec)
  // - llama-3.1-8b-instant (faster, smaller, 560 tokens/sec)
  let model = options.model || 'llama-3.3-70b-versatile';
  
  // If it's a Gemini model name, use default Groq model instead
  if (model.includes('gemini') || model.includes('flash') || model.includes('llama-3.1-70b')) {
    model = 'llama-3.3-70b-versatile'; // Latest Groq model (replaces deprecated llama-3.1-70b-versatile)
    console.log(`🔄 [AI] Mapped model name to current Groq model: ${model}`);
  }
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || 
      `Groq API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Groq returned empty response');
  }

  return { text, provider: 'groq' };
}

/**
 * Call AI with automatic fallback
 * Tries Gemini first, falls back to Groq on rate limit/quota errors
 */
export async function callAIWithFallback(
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  // Try Gemini first (primary)
  if (genAI) {
    try {
      console.log('🤖 [AI] Attempting Gemini (primary)...');
      const result = await callGemini(prompt, options);
      console.log('✅ [AI] Success with Gemini');
      return result;
    } catch (error: any) {
      console.warn('⚠️ [AI] Gemini failed:', error.message);
      
      // If it's a rate limit/quota error, try backup
      if (isRateLimitError(error)) {
        console.log('🔄 [AI] Rate limit detected, switching to backup provider...');
      } else {
        // For other errors, still try backup as fallback
        console.log('🔄 [AI] Error with Gemini, trying backup provider...');
      }
    }
  } else {
    console.warn('⚠️ [AI] Gemini not configured, using backup provider...');
  }

  // Fallback to Groq - remove Gemini-specific model name
  if (groqApiKey) {
    try {
      console.log('🤖 [AI] Attempting Groq (backup)...');
      // Create new options with Groq-compatible model name
      const groqOptions: AICallOptions = {
        ...options,
        // Override with Groq model if Gemini model was specified
        model: (options.model?.includes('gemini') || options.model?.includes('flash'))
          ? 'llama-3.3-70b-versatile'
          : (options.model || 'llama-3.3-70b-versatile'),
      };
      const result = await callGroq(prompt, groqOptions);
      console.log('✅ [AI] Success with Groq backup');
      return result;
    } catch (error: any) {
      console.error('❌ [AI] Groq backup also failed:', error.message);
      throw new Error(
        `Both AI providers failed. Gemini: ${genAI ? 'configured' : 'not configured'}, ` +
        `Groq: ${groqApiKey ? 'failed' : 'not configured'}. ` +
        `Last error: ${error.message}`
      );
    }
  }

  // No providers available
  throw new Error(
    'No AI providers configured. Please set VITE_GOOGLE_AI_API_KEY or VITE_GROQ_API_KEY in .env'
  );
}

/**
 * Check which providers are available
 */
export function getAvailableProviders(): { gemini: boolean; groq: boolean } {
  return {
    gemini: !!genAI,
    groq: !!groqApiKey,
  };
}
