// ============================================================
// RootX Design Engine V1 — Multi-Model Router & Usage Logger
// Routes tasks to specific AI models via OpenRouter based on task type.
// Tracks latency, token count, estimated cost, and fallback usage.
// ============================================================

import type { TaskType, ModelLog } from '../website-builder-types';

export interface RouteTarget {
  modelId: string;
  vendor: string;
  costPer1kInput: number;
  costPer1kOutput: number;
}

export const TASK_MODEL_ROUTING: Record<TaskType, RouteTarget> = {
  product_analysis: {
    modelId: 'deepseek/deepseek-chat',
    vendor: 'DeepSeek',
    costPer1kInput: 0.00014,
    costPer1kOutput: 0.00028,
  },
  brand_naming: {
    modelId: 'anthropic/claude-sonnet-4',
    vendor: 'Anthropic',
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  marketing_copy: {
    modelId: 'anthropic/claude-sonnet-4',
    vendor: 'Anthropic',
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  layout_validation: {
    modelId: 'qwen/qwen3-coder',
    vendor: 'Alibaba',
    costPer1kInput: 0.0002,
    costPer1kOutput: 0.0004,
  },
  category_detection: {
    modelId: 'deepseek/deepseek-chat',
    vendor: 'DeepSeek',
    costPer1kInput: 0.00014,
    costPer1kOutput: 0.00028,
  },
  faq_generation: {
    modelId: 'google/gemini-2.5-pro',
    vendor: 'Google',
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
  },
  feature_extraction: {
    modelId: 'openai/gpt-5.5',
    vendor: 'OpenAI',
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
  },
  fallback: {
    modelId: 'openai/gpt-5.5',
    vendor: 'OpenAI',
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
  },
};

export function getModelForTask(taskType: TaskType): RouteTarget {
  return TASK_MODEL_ROUTING[taskType] || TASK_MODEL_ROUTING.fallback;
}

export function logModelCall(
  taskType: TaskType,
  target: RouteTarget,
  latencyMs: number,
  promptTokens: number,
  completionTokens: number,
  fallbackUsed: boolean = false
): ModelLog {
  const inputCost = (promptTokens / 1000) * target.costPer1kInput;
  const outputCost = (completionTokens / 1000) * target.costPer1kOutput;
  const estimatedCost = Number((inputCost + outputCost).toFixed(6));

  return {
    taskType,
    selectedModel: target.modelId,
    vendor: target.vendor,
    latencyMs,
    promptTokens,
    completionTokens,
    estimatedCost,
    fallbackUsed,
    timestamp: new Date().toISOString(),
  };
}
