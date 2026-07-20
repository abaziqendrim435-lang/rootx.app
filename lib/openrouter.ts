// ============================================================
// RootX — OpenRouter AI Provider
// Unified gateway to GPT-5.5, Claude Sonnet 4, Gemini 2.5 Pro,
// DeepSeek Chat, and Qwen3-Coder via OpenRouter.
// ============================================================

// ── Supported Models ─────────────────────────────────────────

export const OPENROUTER_MODELS = {
  'openai/gpt-5.5': {
    id: 'openai/gpt-5.5',
    label: 'GPT-5.5',
    vendor: 'OpenAI',
    strengths: ['general', 'reasoning', 'structured-output'],
  },
  'anthropic/claude-sonnet-4': {
    id: 'anthropic/claude-sonnet-4',
    label: 'Claude Sonnet 4',
    vendor: 'Anthropic',
    strengths: ['copywriting', 'long-context', 'creative'],
  },
  'google/gemini-2.5-pro': {
    id: 'google/gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    vendor: 'Google',
    strengths: ['general', 'fast', 'multimodal'],
  },
  'deepseek/deepseek-chat': {
    id: 'deepseek/deepseek-chat',
    label: 'DeepSeek Chat',
    vendor: 'DeepSeek',
    strengths: ['coding', 'reasoning', 'math'],
  },
  'qwen/qwen3-coder': {
    id: 'qwen/qwen3-coder',
    label: 'Qwen3 Coder',
    vendor: 'Alibaba',
    strengths: ['coding', 'structured-output', 'fast'],
  },
} as const;

export type OpenRouterModelId = keyof typeof OPENROUTER_MODELS;

export const OPENROUTER_MODEL_IDS = Object.keys(OPENROUTER_MODELS) as OpenRouterModelId[];

// ── Auto Model Selection ─────────────────────────────────────

const TASK_MODEL_MAP: { keywords: string[]; model: OpenRouterModelId }[] = [
  { keywords: ['code', 'function', 'debug', 'program', 'refactor', 'script', 'api', 'sql', 'html', 'css', 'javascript', 'typescript', 'python', 'developer'],
    model: 'qwen/qwen3-coder' },
  { keywords: ['write', 'copy', 'blog', 'article', 'email', 'marketing', 'brand', 'creative', 'story', 'content', 'caption', 'headline'],
    model: 'anthropic/claude-sonnet-4' },
  { keywords: ['analyze', 'math', 'reason', 'logic', 'calculate', 'solve', 'proof', 'algorithm'],
    model: 'deepseek/deepseek-chat' },
  { keywords: ['website', 'ecommerce', 'store', 'product', 'shopify', 'business', 'generate', 'json'],
    model: 'google/gemini-2.5-pro' },
];

/**
 * Pick the best model based on the prompt content.
 * Falls back to GPT-5.5 as the best general-purpose model.
 */
export function autoSelectModel(prompt: string): OpenRouterModelId {
  const lower = prompt.toLowerCase();
  for (const rule of TASK_MODEL_MAP) {
    const matchCount = rule.keywords.filter((kw) => lower.includes(kw)).length;
    if (matchCount >= 2) return rule.model;
  }
  return 'openai/gpt-5.5';
}

// ── Core API Call ────────────────────────────────────────────

export interface OpenRouterOptions {
  model?: OpenRouterModelId | 'auto';
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  jsonMode?: boolean;
}

export interface OpenRouterResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call OpenRouter's chat completions API.
 *
 * @param messages - Array of {role, content} messages
 * @param apiKey - OpenRouter API key (server-side only)
 * @param options - Model selection, tokens, temperature
 */
export async function callOpenRouter(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  apiKey: string,
  options: OpenRouterOptions = {},
): Promise<OpenRouterResponse> {
  const {
    model = 'auto',
    maxTokens = 8000,
    temperature = 0.7,
    jsonMode = false,
  } = options;

  // Resolve model
  const resolvedModel = model === 'auto'
    ? autoSelectModel(messages.map((m) => m.content).join(' '))
    : model;

  const body: Record<string, unknown> = {
    model: resolvedModel,
    messages,
    max_tokens: maxTokens,
    temperature,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://rootxai.dev',
      'X-Title': 'RootX AI Platform',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    const status = response.status;

    if (status === 401 || status === 403)
      throw new Error('OpenRouter API key is invalid or missing.');
    if (status === 429)
      throw new Error('OpenRouter rate limit or quota exceeded.');
    if (status === 402)
      throw new Error('OpenRouter: insufficient credits. Please top up your account.');
    if (status >= 500)
      throw new Error('OpenRouter service is temporarily unavailable.');

    const truncated = errText.length > 300 ? errText.slice(0, 300) + '...' : errText;
    throw new Error(`OpenRouter error ${status}: ${truncated}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    const finish = data.choices?.[0]?.finish_reason ?? 'unknown';
    throw new Error(
      `OpenRouter (${resolvedModel}) returned empty content (finish_reason: ${finish}). The prompt may be too large.`,
    );
  }

  return {
    content,
    model: data.model || resolvedModel,
    usage: data.usage,
  };
}

// ── Convenience: prompt-in, text-out ─────────────────────────

/**
 * Simple prompt → response call for use in the existing ai-providers chain.
 * Matches the same signature as callOpenAI / callClaude / etc.
 */
export async function callOpenRouterSimple(
  prompt: string,
  apiKey: string,
  maxTokens: number = 8000,
  temperature: number = 0.7,
): Promise<string> {
  const { content } = await callOpenRouter(
    [
      {
        role: 'system',
        content:
          'You are a JSON-only response generator. Always respond with valid JSON. Never include markdown formatting, code fences, or explanatory text.',
      },
      { role: 'user', content: prompt },
    ],
    apiKey,
    {
      model: 'auto',
      maxTokens,
      temperature,
      jsonMode: true,
    },
  );
  return content;
}

/**
 * Call OpenRouter using task-specific model routing and return content along with usage logs
 */
export async function callOpenRouterWithTaskType(
  taskType: keyof typeof import('./design-engine/model-router').TASK_MODEL_ROUTING,
  prompt: string,
  apiKey: string,
  maxTokens: number = 8000
) {
  const { getModelForTask, logModelCall } = await import('./design-engine/model-router');
  const target = getModelForTask(taskType);
  const startTime = Date.now();

  const response = await callOpenRouter(
    [
      {
        role: 'system',
        content: 'You are a JSON-only response generator. Always respond with valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    apiKey,
    {
      model: target.modelId as OpenRouterModelId,
      maxTokens,
      jsonMode: true,
    }
  );

  const latency = Date.now() - startTime;
  const promptTokens = response.usage?.prompt_tokens || 200;
  const completionTokens = response.usage?.completion_tokens || 350;

  const log = logModelCall(taskType, target, latency, promptTokens, completionTokens, false);

  return {
    content: response.content,
    log,
  };
}

