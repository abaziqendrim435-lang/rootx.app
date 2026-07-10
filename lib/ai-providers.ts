// ============================================================
// RootX — Shared AI Provider Utilities
// Robust JSON parsing, retry, fallback provider chain
// Supports: OpenAI, Claude, Gemini, Kimi, Auto Best
// ============================================================

import type { AIProvider } from '@/lib/website-builder-types';

// ── Types ────────────────────────────────────────────────────

/** A concrete provider (excludes 'auto') */
export type ConcreteProvider = Exclude<AIProvider, 'auto'>;

export interface ProviderConfig {
  provider: ConcreteProvider;
  apiKey: string;
}

export interface CallResult {
  raw: string;
  provider: ConcreteProvider;
}

// ── JSON Parsing ─────────────────────────────────────────────

/**
 * Robustly extract and parse JSON from an AI model response.
 *
 * Handles:
 * - Clean JSON
 * - ```json ... ``` fenced blocks (with or without language tag)
 * - Multiple code fences (takes the largest one)
 * - Preamble/postscript text around JSON
 * - Nested backticks
 * - Trailing commas (common AI mistake)
 * - UTF-8 BOM
 */
export function parseJsonRobust(raw: string): Record<string, unknown> {
  if (!raw || raw.trim().length === 0) {
    throw new Error('Empty AI response — no content to parse');
  }

  let text = raw.trim();

  // Strip UTF-8 BOM
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  // Strategy 1: Direct parse (cleanest case)
  try {
    return JSON.parse(text);
  } catch { /* continue */ }

  // Strategy 2: Extract from code fences (```json ... ``` or ``` ... ```)
  const fenceRegex = /```(?:json)?\s*\n?([\s\S]*?)```/gi;
  const fenceMatches: string[] = [];
  let fenceMatch: RegExpExecArray | null;
  while ((fenceMatch = fenceRegex.exec(text)) !== null) {
    fenceMatches.push(fenceMatch[1].trim());
  }

  // Try fenced blocks, largest first (most likely the full JSON)
  fenceMatches.sort((a, b) => b.length - a.length);
  for (const block of fenceMatches) {
    try {
      return JSON.parse(block);
    } catch { /* continue */ }
    // Try fixing trailing commas
    try {
      return JSON.parse(fixTrailingCommas(block));
    } catch { /* continue */ }
  }

  // Strategy 3: Find JSON object boundaries { ... }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonCandidate);
    } catch { /* continue */ }
    try {
      return JSON.parse(fixTrailingCommas(jsonCandidate));
    } catch { /* continue */ }
  }

  throw new Error(`Could not parse JSON from AI response. First 200 chars: ${text.slice(0, 200)}`);
}

/**
 * Remove trailing commas before } or ] (common AI JSON error).
 */
function fixTrailingCommas(json: string): string {
  return json.replace(/,\s*([}\]])/g, '$1');
}

// ── Error Helpers ────────────────────────────────────────────

const PROVIDER_NAMES: Record<ConcreteProvider, string> = {
  openai: 'OpenAI',
  claude: 'Anthropic',
  gemini: 'Gemini',
  kimi: 'Kimi (Moonshot)',
};

export function friendlyError(provider: ConcreteProvider, status: number, body: string): string {
  const providerName = PROVIDER_NAMES[provider] || provider;
  if (status === 401 || status === 403)
    return `${providerName} API key is invalid or missing.`;
  if (status === 429)
    return `${providerName} rate limit or quota exceeded.`;
  if (status === 500 || status === 503)
    return `${providerName} service is temporarily unavailable.`;
  // Include truncated body for debugging
  const truncatedBody = body.length > 200 ? body.slice(0, 200) + '...' : body;
  return `${providerName} error ${status}: ${truncatedBody}`;
}

// ── Provider API Calls ───────────────────────────────────────

/**
 * Call OpenAI Chat Completions with JSON mode enabled.
 */
export async function callOpenAI(
  prompt: string,
  apiKey: string,
  maxTokens: number = 8000,
  temperature: number = 0.7,
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a JSON-only response generator. Always respond with valid JSON. Never include markdown formatting, code fences, or explanatory text.' },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(friendlyError('openai', response.status, errBody));
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;

  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    const finish = data.choices?.[0]?.finish_reason ?? 'unknown';
    throw new Error(`OpenAI returned empty content (finish_reason: ${finish}). The prompt may be too large — try reducing input length.`);
  }

  return raw;
}

/**
 * Call Anthropic Claude Messages API.
 */
export async function callClaude(
  prompt: string,
  apiKey: string,
  maxTokens: number = 8000,
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(friendlyError('claude', response.status, errBody));
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text;

  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    const stopReason = data.stop_reason ?? 'unknown';
    throw new Error(`Claude returned empty content (stop_reason: ${stopReason}). The prompt may be too large.`);
  }

  return raw;
}

/**
 * Call Google Gemini generateContent API.
 */
export async function callGemini(
  prompt: string,
  apiKey: string,
  maxTokens: number = 8000,
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(friendlyError('gemini', response.status, errBody));
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    const finishReason = data.candidates?.[0]?.finishReason ?? 'unknown';
    throw new Error(`Gemini returned empty content (finishReason: ${finishReason}). The prompt may be too large.`);
  }

  return raw;
}

/**
 * Call Kimi (Moonshot AI) — OpenAI-compatible API.
 * Uses model: kimi-k2 with long context window.
 * Endpoint: https://api.moonshot.ai/v1/chat/completions
 */
export async function callKimi(
  prompt: string,
  apiKey: string,
  maxTokens: number = 8000,
  temperature: number = 0.7,
): Promise<string> {
  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'kimi-k2',
      messages: [
        { role: 'system', content: 'You are a JSON-only response generator. Always respond with valid JSON. Never include markdown formatting, code fences, or explanatory text.' },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(friendlyError('kimi', response.status, errBody));
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;

  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    const finish = data.choices?.[0]?.finish_reason ?? 'unknown';
    throw new Error(`Kimi returned empty content (finish_reason: ${finish}). The prompt may be too large.`);
  }

  return raw;
}

// ── Retry + Fallback Dispatch ────────────────────────────────

/**
 * Auto Best fallback order: Gemini → Claude → Kimi → OpenAI
 */
const AUTO_BEST_ORDER: ConcreteProvider[] = ['gemini', 'claude', 'kimi', 'openai'];

/**
 * All concrete providers.
 */
const ALL_PROVIDERS: ConcreteProvider[] = ['openai', 'claude', 'gemini', 'kimi'];

/**
 * Determine which API keys are available.
 *
 * When preferred is 'auto', uses the Auto Best order.
 * Otherwise, puts the preferred provider first, then fills with remaining available providers.
 */
export function getAvailableProviders(preferred: AIProvider): ProviderConfig[] {
  const keyMap: Record<ConcreteProvider, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    kimi: process.env.KIMI_API_KEY,
  };

  const isReal = (key: string | undefined): key is string =>
    !!key &&
    !key.startsWith('sk-your') &&
    !key.startsWith('sk-ant-your') &&
    key !== 'YOUR_KEY_HERE';

  let ordered: ConcreteProvider[];

  if (preferred === 'auto') {
    // Auto Best: use the optimal fallback order
    ordered = [...AUTO_BEST_ORDER];
  } else {
    // Specific provider first, then fill with remaining in auto-best order
    const concrete = preferred as ConcreteProvider;
    ordered = [concrete, ...AUTO_BEST_ORDER.filter((p) => p !== concrete)];
  }

  return ordered
    .filter((p) => isReal(keyMap[p]))
    .map((p) => ({ provider: p, apiKey: keyMap[p]! }));
}

/**
 * Call a specific provider.
 */
async function callProvider(
  provider: ConcreteProvider,
  prompt: string,
  apiKey: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
  switch (provider) {
    case 'openai':
      return callOpenAI(prompt, apiKey, maxTokens, temperature);
    case 'claude':
      return callClaude(prompt, apiKey, maxTokens);
    case 'gemini':
      return callGemini(prompt, apiKey, maxTokens);
    case 'kimi':
      return callKimi(prompt, apiKey, maxTokens, temperature);
  }
}

/**
 * Try calling the AI with the preferred provider, retry once on parse failure,
 * then fall through to alternative providers.
 *
 * @param prompt - The AI prompt
 * @param preferred - User's preferred provider (or 'auto' for best routing)
 * @param maxTokens - Max tokens for the response
 * @param logPrefix - Logging prefix for console output
 * @returns Parsed JSON object and the provider that succeeded
 */
export async function callWithRetryAndFallback(
  prompt: string,
  preferred: AIProvider,
  maxTokens: number,
  logPrefix: string,
  temperature: number = 0.7,
): Promise<{ parsed: Record<string, unknown>; provider: ConcreteProvider }> {
  const providers = getAvailableProviders(preferred);

  if (providers.length === 0) {
    // Signal to caller that no providers are available — will trigger mock
    return { parsed: {}, provider: 'openai' };
  }

  const errors: string[] = [];

  for (const { provider, apiKey } of providers) {
    // Try up to 2 attempts per provider (original + 1 retry)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`${logPrefix} Attempt ${attempt} with ${provider}${preferred === 'auto' ? ' (Auto Best)' : ''}`);

        const raw = await callProvider(provider, prompt, apiKey, maxTokens, temperature);

        console.log(`${logPrefix} Got ${raw.length} chars from ${provider}`);

        const parsed = parseJsonRobust(raw);
        console.log(`${logPrefix} Successfully parsed JSON from ${provider}`);
        return { parsed, provider };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`${logPrefix} ${provider} attempt ${attempt} failed: ${msg}`);
        errors.push(`${provider}[${attempt}]: ${msg}`);

        // Don't retry on auth/rate-limit errors — try next provider instead
        if (msg.includes('API key') || msg.includes('rate limit') || msg.includes('quota')) {
          break;
        }

        // Brief delay before retry
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }

  // All providers failed
  throw new Error(`All AI providers failed.\n${errors.join('\n')}`);
}
