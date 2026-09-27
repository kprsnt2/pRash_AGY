import { ProviderType } from '@/types/chat';

export interface ProviderMeta {
  id: ProviderType;
  name: string;
  defaultModel: string;
  availableModels: { id: string; name: string; description: string; vision: boolean }[];
  endpoint: string;
  privacyTier: 'zero-training' | 'standard';
  badgeColor: string;
}

export const PROVIDERS: Record<ProviderType, ProviderMeta> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-5.4-mini',
    availableModels: [
      { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', description: 'Fast, high-intelligence default model', vision: true },
      { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano', description: 'Ultra-lightweight and rapid response', vision: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Widely deployed fast multimodal model', vision: true },
      { id: 'gpt-4o', name: 'GPT-4o Flagship', description: 'High-tier multimodal reasoning', vision: true },
    ],
    endpoint: 'https://api.openai.com/v1/chat/completions',
    privacyTier: 'standard',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    defaultModel: 'gemini-1.5-flash',
    availableModels: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast multimodal with 1M token context', vision: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Next-gen multimodal speed & power', vision: true },
      { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', description: 'Auto-updating fast flagship', vision: true },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Deep reasoning with massive context', vision: true },
    ],
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    privacyTier: 'zero-training',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  },
  nvidia: {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    defaultModel: 'meta/llama-3.3-70b-instruct',
    availableModels: [
      { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (NVIDIA)', description: 'NVIDIA accelerated open frontier model', vision: false },
      { id: 'mistralai/mixtral-8x7b-instruct-v0.1', name: 'Mixtral 8x7B (NVIDIA)', description: 'Fast mixture of experts', vision: false },
      { id: 'nvidia/neva-22b', name: 'NeVA 22B Vision', description: 'NVIDIA accelerated visual model', vision: true },
    ],
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    privacyTier: 'standard',
    badgeColor: 'bg-green-500/10 text-green-400 border-green-500/30',
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    defaultModel: 'llama-3.3-70b-versatile',
    availableModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', description: '500+ tokens/sec lightning speed', vision: false },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Sub-second instant generation', vision: false },
      { id: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 11B Vision', description: 'Fast multimodal vision on Groq LPU', vision: true },
    ],
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    privacyTier: 'standard',
    badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  },
};

/**
 * Returns failover provider sequence.
 * If privacyMode is enabled: only returns ['gemini'] (zero training data retention).
 * Otherwise: returns ['openai', 'gemini', 'nvidia', 'groq'] cascade.
 */
export function getProviderCascade(privacyMode: boolean, forcedProvider?: ProviderType | 'auto'): ProviderType[] {
  if (privacyMode) {
    return ['gemini']; // Strictly locked to Gemini paid tier!
  }
  if (forcedProvider && forcedProvider !== 'auto') {
    // If user explicitly forced a provider, put that first, then fall back to the rest
    const remaining = (['openai', 'gemini', 'nvidia', 'groq'] as ProviderType[]).filter(p => p !== forcedProvider);
    return [forcedProvider, ...remaining];
  }
  return ['openai', 'gemini', 'nvidia', 'groq'];
}
