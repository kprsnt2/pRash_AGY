import { NextResponse } from 'next/server';
import { getDefaultModelForProvider, PROVIDERS, shouldBypassToDefaultModel } from '@/lib/models';
import { authEnabled } from '@/lib/auth';

export async function GET() {
  const defaults = {
    openai: getDefaultModelForProvider('openai'),
    gemini: getDefaultModelForProvider('gemini'),
    nvidia: getDefaultModelForProvider('nvidia'),
    groq: getDefaultModelForProvider('groq'),
  };

  const configuredProviders = {
    openai: !!(process.env.OPENAI_API_KEY),
    gemini: !!(process.env.GEMINI_API_KEY),
    nvidia: !!(process.env.NVIDIA_API_KEY),
    groq: !!(process.env.GROQ_API_KEY),
  };

  return NextResponse.json({
    defaults,
    configuredProviders,
    authRequired: authEnabled(),
    bypassToDefault: shouldBypassToDefaultModel(),
    providers: PROVIDERS,
  });
}
