import { ProviderType } from '@/types/chat';

export interface ModelOption {
  id: string;
  name: string;
  provider: ProviderType;
  description: string;
  vision: boolean;
  isDefault?: boolean;
}

export interface ProviderMeta {
  id: ProviderType;
  name: string;
  defaultModel: string;
  availableModels: ModelOption[];
  endpoint: string;
  privacyTier: 'zero-training' | 'standard';
  badgeColor: string;
}

/** Canonical defaults as listed in specification */
export const CANONICAL_DEFAULTS: Record<ProviderType, string> = {
  openai: 'gpt-5.4-mini',
  gemini: 'gemini-flash-latest',
  nvidia: 'meta/llama-3.2-90b-vision-instruct',
  groq: 'meta-llama/llama-4-scout-17b-16e-instruct',
};

/**
 * Check if environment mandates bypassing user-selected models
 * and forcing the server configured default model for all calls.
 */
export function shouldBypassToDefaultModel(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    const val =
      process.env.BYPASS_TO_DEFAULT_MODEL ||
      process.env.FORCE_DEFAULT_MODEL ||
      process.env.BYPASS_MODEL_SELECTION;
    return val === 'true' || val === '1';
  }
  return false;
}

/** Get default model respecting environment variable overrides */
export function getDefaultModelForProvider(provider: ProviderType): string {
  if (typeof process !== 'undefined' && process.env) {
    if (provider === 'openai') {
      const val =
        process.env.OPENAI_MODEL ||
        process.env.OPENAI_MODEL_DEFAULT ||
        process.env.OPENAI_DEFAULT_MODEL;
      if (val?.trim()) return val.trim();
    }
    if (provider === 'gemini') {
      const val =
        process.env.GEMINI_MODEL ||
        process.env.GOOGLE_MODEL ||
        process.env.GEMINI_MODEL_DEFAULT ||
        process.env.GEMINI_DEFAULT_MODEL;
      if (val?.trim()) return val.trim();
    }
    if (provider === 'nvidia') {
      const val =
        process.env.NVIDIA_MODEL ||
        process.env.NVIDIA_MODEL_DEFAULT ||
        process.env.NVIDIA_DEFAULT_MODEL;
      if (val?.trim()) return val.trim();
    }
    if (provider === 'groq') {
      const val =
        process.env.GROQ_MODEL ||
        process.env.GROQ_MODEL_DEFAULT ||
        process.env.GROQ_DEFAULT_MODEL;
      if (val?.trim()) return val.trim();
    }
  }
  return CANONICAL_DEFAULTS[provider];
}

/**
 * Normalizes OpenAI-compatible base URLs to ensure /chat/completions is appended.
 * Prevents 404/405 errors when users configure e.g. https://api.openai.com/v1 in .env
 */
export function ensureChatCompletionsEndpoint(
  baseUrl?: string,
  defaultEndpoint: string = 'https://api.openai.com/v1/chat/completions'
): string {
  if (!baseUrl?.trim()) return defaultEndpoint;
  let clean = baseUrl.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/chat/completions')) {
    clean += '/chat/completions';
  }
  return clean;
}

/**
 * Canonical listed models only — updated to 2026 specifications
 */
export const PROVIDERS: Record<ProviderType, ProviderMeta> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: CANONICAL_DEFAULTS.openai,
    availableModels: [
      { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', provider: 'openai', description: 'Fast, high-intelligence default model', vision: true, isDefault: true },
      { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano', provider: 'openai', description: 'Ultra-lightweight and rapid response', vision: true },
    ],
    endpoint: 'https://api.openai.com/v1/chat/completions',
    privacyTier: 'standard',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    defaultModel: CANONICAL_DEFAULTS.gemini,
    availableModels: [
      { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', provider: 'gemini', description: 'Fast multimodal zero-training flagship', vision: true, isDefault: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', description: 'Next-gen multimodal speed & power', vision: true },
    ],
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    privacyTier: 'zero-training',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  },
  nvidia: {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    defaultModel: CANONICAL_DEFAULTS.nvidia,
    availableModels: [
      { id: 'meta/llama-3.2-90b-vision-instruct', name: 'Llama 3.2 90B Vision', provider: 'nvidia', description: 'High-power accelerated multimodal vision', vision: true, isDefault: true },
      { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', provider: 'nvidia', description: 'NVIDIA accelerated open frontier reasoning', vision: false },
    ],
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    privacyTier: 'standard',
    badgeColor: 'bg-green-500/10 text-green-400 border-green-500/30',
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    defaultModel: CANONICAL_DEFAULTS.groq,
    availableModels: [
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', provider: 'groq', description: 'Next-gen MoE frontier architecture on Groq LPU', vision: true, isDefault: true },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'groq', description: '500+ tokens/sec lightning speed', vision: false },
    ],
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    privacyTier: 'standard',
    badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  },
};

/** Get provider for a specific model ID */
export function getProviderForModel(modelId: string): ProviderType {
  for (const prov of Object.keys(PROVIDERS) as ProviderType[]) {
    if (PROVIDERS[prov].availableModels.some((m) => m.id === modelId)) {
      return prov;
    }
  }
  // Fallback heuristics
  if (modelId.startsWith('gpt-')) return 'openai';
  if (modelId.startsWith('gemini-')) return 'gemini';
  if (modelId.includes('groq') || modelId.startsWith('llama-') || modelId.startsWith('meta-llama/')) return 'groq';
  return 'nvidia';
}

/**
 * Returns failover provider sequence.
 * If privacyMode is enabled: only returns ['gemini'] (zero training data retention).
 * Otherwise: returns cascade sequence starting with preferred provider if given.
 */
export function getProviderCascade(privacyMode: boolean, forcedProvider?: ProviderType | 'auto'): ProviderType[] {
  if (privacyMode) {
    return ['gemini']; // Strictly locked to Gemini paid tier!
  }
  if (forcedProvider && forcedProvider !== 'auto') {
    const remaining = (['openai', 'gemini', 'nvidia', 'groq'] as ProviderType[]).filter(p => p !== forcedProvider);
    return [forcedProvider, ...remaining];
  }
  return ['openai', 'gemini', 'nvidia', 'groq'];
}
