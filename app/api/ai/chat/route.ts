import { NextRequest, NextResponse } from 'next/server';
import {
  callOpenRouter,
  OPENROUTER_MODELS,
  OPENROUTER_MODEL_IDS,
  autoSelectModel,
  type OpenRouterModelId,
} from '@/lib/openrouter';

// ============================================================
// POST /api/ai/chat
//
// General-purpose AI chat endpoint powered by OpenRouter.
// Supports model selection, auto-routing, and multi-turn
// conversations. The API key never leaves the server.
// ============================================================

export interface ChatRequest {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  model?: OpenRouterModelId | 'auto';
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  modelLabel: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const LOG = '[/api/ai/chat]';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured. Add OPENROUTER_API_KEY to your environment variables.' },
        { status: 500 },
      );
    }

    const body = (await req.json()) as ChatRequest;
    const { messages, model = 'auto', maxTokens = 4096, temperature = 0.7, jsonMode = false } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required and must contain at least one message.' },
        { status: 400 },
      );
    }

    // Validate model
    if (model !== 'auto' && !OPENROUTER_MODEL_IDS.includes(model)) {
      return NextResponse.json(
        { error: `Invalid model: ${model}. Valid models: auto, ${OPENROUTER_MODEL_IDS.join(', ')}` },
        { status: 400 },
      );
    }

    // Resolve the actual model for logging
    const resolvedModel = model === 'auto'
      ? autoSelectModel(messages.map((m) => m.content).join(' '))
      : model;

    console.log(`${LOG} model=${model} → resolved=${resolvedModel} messages=${messages.length} maxTokens=${maxTokens}`);

    const result = await callOpenRouter(messages, apiKey, {
      model,
      maxTokens,
      temperature,
      jsonMode,
    });

    const modelInfo = OPENROUTER_MODELS[resolvedModel as OpenRouterModelId];

    const response: ChatResponse = {
      content: result.content,
      model: result.model,
      modelLabel: modelInfo?.label || result.model,
      usage: result.usage,
    };

    console.log(`${LOG} ✓ ${result.model} → ${result.content.length} chars`);

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`${LOG} ERROR:`, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// GET /api/ai/chat — returns available models
export async function GET() {
  const hasKey = !!process.env.OPENROUTER_API_KEY;
  return NextResponse.json({
    available: hasKey,
    models: Object.entries(OPENROUTER_MODELS).map(([id, info]) => ({
      id,
      label: info.label,
      vendor: info.vendor,
      strengths: info.strengths,
    })),
    autoRouting: true,
  });
}
