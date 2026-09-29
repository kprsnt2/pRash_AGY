import { NextRequest, NextResponse } from 'next/server';
import { Attachment, FailoverAttempt, Message, ProviderType } from '@/types/chat';
import {
  PROVIDERS,
  getDefaultModelForProvider,
  getProviderCascade,
  getProviderForModel,
  shouldBypassToDefaultModel,
  ensureChatCompletionsEndpoint,
} from '@/lib/models';

interface RequestBody {
  messages: Message[];
  agentSystemPrompt: string;
  attachments?: Attachment[];
  privacyMode?: boolean;
  forcedProvider?: 'auto' | ProviderType;
  selectedModel?: string;
  customKeys?: {
    openaiApiKey?: string;
    openaiModel?: string;
    geminiApiKey?: string;
    geminiModel?: string;
    nvidiaApiKey?: string;
    nvidiaModel?: string;
    groqApiKey?: string;
    groqModel?: string;
  };
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout on Vercel

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body: RequestBody = await req.json();
    const {
      messages,
      agentSystemPrompt,
      attachments = [],
      privacyMode = false,
      forcedProvider = 'auto',
      selectedModel,
      customKeys = {},
    } = body;

    const bypassToDefault = shouldBypassToDefaultModel();

    // Determine cascade sequence & models
    let cascade: ProviderType[];
    let targetModelForProvider: Partial<Record<ProviderType, string>> = {};

    if (privacyMode) {
      cascade = ['gemini'];
      targetModelForProvider.gemini =
        !bypassToDefault && selectedModel && getProviderForModel(selectedModel) === 'gemini'
          ? selectedModel
          : customKeys.geminiModel || getDefaultModelForProvider('gemini');
    } else if (!bypassToDefault && selectedModel) {
      const preferredProvider = getProviderForModel(selectedModel);
      cascade = getProviderCascade(false, preferredProvider);
      targetModelForProvider[preferredProvider] = selectedModel;
    } else {
      cascade = getProviderCascade(false, forcedProvider);
    }

    const failoverChain: FailoverAttempt[] = [];

    // Attempt cascade
    for (const provider of cascade) {
      const attempt: FailoverAttempt = {
        provider,
        model: '',
        status: 'attempted',
      };

      try {
        if (provider === 'openai') {
          const apiKey = (customKeys.openaiApiKey || process.env.OPENAI_API_KEY)?.trim();
          const model =
            (bypassToDefault ? null : targetModelForProvider.openai) ||
            customKeys.openaiModel ||
            getDefaultModelForProvider('openai');
          attempt.model = model;

          if (!apiKey) {
            attempt.status = 'failed';
            attempt.error = 'No OpenAI API Key configured';
            failoverChain.push(attempt);
            continue;
          }

          const endpoint = ensureChatCompletionsEndpoint(
            process.env.OPENAI_BASE_URL,
            PROVIDERS.openai.endpoint
          );

          const stream = await callOpenAICompatible({
            apiKey,
            model,
            endpoint,
            systemPrompt: agentSystemPrompt,
            messages,
            attachments,
            providerName: 'OpenAI',
            supportsVision: true,
          });

          attempt.status = 'success';
          attempt.latencyMs = Date.now() - startTime;
          failoverChain.push(attempt);

          return createStreamResponse(stream, {
            provider: 'openai',
            model,
            failoverChain,
            privacyMode,
            latencyMs: Date.now() - startTime,
          });
        }

        if (provider === 'gemini') {
          const apiKey = (customKeys.geminiApiKey || process.env.GEMINI_API_KEY)?.trim();
          const model =
            (bypassToDefault ? null : targetModelForProvider.gemini) ||
            customKeys.geminiModel ||
            getDefaultModelForProvider('gemini');
          attempt.model = model;

          if (!apiKey) {
            attempt.status = 'failed';
            attempt.error = 'No Google Gemini API Key configured';
            failoverChain.push(attempt);
            continue;
          }

          const stream = await callGemini({
            apiKey,
            model,
            systemPrompt: agentSystemPrompt,
            messages,
            attachments,
          });

          attempt.status = 'success';
          attempt.latencyMs = Date.now() - startTime;
          failoverChain.push(attempt);

          return createStreamResponse(stream, {
            provider: 'gemini',
            model,
            failoverChain,
            privacyMode,
            latencyMs: Date.now() - startTime,
          });
        }

        if (provider === 'nvidia') {
          const apiKey = (customKeys.nvidiaApiKey || process.env.NVIDIA_API_KEY)?.trim();
          const model =
            (bypassToDefault ? null : targetModelForProvider.nvidia) ||
            customKeys.nvidiaModel ||
            getDefaultModelForProvider('nvidia');
          attempt.model = model;

          if (!apiKey) {
            attempt.status = 'failed';
            attempt.error = 'No NVIDIA NIM API Key configured';
            failoverChain.push(attempt);
            continue;
          }

          const endpoint = ensureChatCompletionsEndpoint(
            process.env.NVIDIA_BASE_URL,
            PROVIDERS.nvidia.endpoint
          );

          const supportsVision = model.includes('vision');

          const stream = await callOpenAICompatible({
            apiKey,
            model,
            endpoint,
            systemPrompt: agentSystemPrompt,
            messages,
            attachments,
            providerName: 'NVIDIA NIM',
            supportsVision,
          });

          attempt.status = 'success';
          attempt.latencyMs = Date.now() - startTime;
          failoverChain.push(attempt);

          return createStreamResponse(stream, {
            provider: 'nvidia',
            model,
            failoverChain,
            privacyMode,
            latencyMs: Date.now() - startTime,
          });
        }

        if (provider === 'groq') {
          const apiKey = (customKeys.groqApiKey || process.env.GROQ_API_KEY)?.trim();
          const model =
            (bypassToDefault ? null : targetModelForProvider.groq) ||
            customKeys.groqModel ||
            getDefaultModelForProvider('groq');
          attempt.model = model;

          if (!apiKey) {
            attempt.status = 'failed';
            attempt.error = 'No Groq API Key configured';
            failoverChain.push(attempt);
            continue;
          }

          const endpoint = ensureChatCompletionsEndpoint(
            process.env.GROQ_BASE_URL,
            PROVIDERS.groq.endpoint
          );

          const supportsVision = model.includes('scout') || model.includes('vision');

          const stream = await callOpenAICompatible({
            apiKey,
            model,
            endpoint,
            systemPrompt: agentSystemPrompt,
            messages,
            attachments,
            providerName: 'Groq Cloud',
            supportsVision,
          });

          attempt.status = 'success';
          attempt.latencyMs = Date.now() - startTime;
          failoverChain.push(attempt);

          return createStreamResponse(stream, {
            provider: 'groq',
            model,
            failoverChain,
            privacyMode,
            latencyMs: Date.now() - startTime,
          });
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`Provider ${provider} attempt failed: ${errorMsg}`);
        attempt.status = 'failed';
        attempt.error = errorMsg;
        failoverChain.push(attempt);
        // Continue to next provider in cascade!
      }
    }

    // If all providers in cascade failed
    const reasons = failoverChain.map((f) => `${f.provider}: ${f.error || 'Failed'}`).join('; ');
    return NextResponse.json(
      {
        error: `All configured model providers failed: ${reasons}`,
        failoverChain,
      },
      { status: 502 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * Call OpenAI, NVIDIA, or Groq (OpenAI-compatible chat completion APIs)
 */
async function callOpenAICompatible({
  apiKey,
  model,
  endpoint,
  systemPrompt,
  messages,
  attachments,
  providerName,
  supportsVision = true,
}: {
  apiKey: string;
  model: string;
  endpoint: string;
  systemPrompt: string;
  messages: Message[];
  attachments: Attachment[];
  providerName: string;
  supportsVision?: boolean;
}): Promise<ReadableStream<Uint8Array>> {
  const formattedMessages: any[] = [];

  if (systemPrompt) {
    formattedMessages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLastUserMessage = i === messages.length - 1 && msg.role === 'user';

    if (msg.role === 'user') {
      const parts: any[] = [];

      if (msg.content) {
        parts.push({ type: 'text', text: msg.content });
      }

      const msgAttachments = isLastUserMessage
        ? [...(msg.attachments || []), ...attachments]
        : msg.attachments || [];

      for (const att of msgAttachments) {
        if (att.type === 'image' && supportsVision && att.data) {
          parts.push({
            type: 'image_url',
            image_url: {
              url: att.data,
              detail: 'high',
            },
          });
        } else if (att.type === 'image') {
          parts.push({
            type: 'text',
            text: `\n[Attached Image: ${att.name}]\n`,
          });
        } else if (att.extractedText) {
          parts.push({
            type: 'text',
            text: `\n[Attached File: ${att.name}]\n\`\`\`\n${att.extractedText}\n\`\`\`\n`,
          });
        } else if (att.type === 'pdf') {
          parts.push({
            type: 'text',
            text: `\n[Attached PDF Document: ${att.name}]\n`,
          });
        }
      }

      formattedMessages.push({
        role: 'user',
        content: parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts,
      });
    } else if (msg.role === 'assistant') {
      formattedMessages.push({
        role: 'assistant',
        content: msg.content,
      });
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      stream: true,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    let errDetail = `${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      errDetail = errJson.error?.message || errJson.message || JSON.stringify(errJson);
    } catch {}
    throw new Error(`${providerName} Error (${response.status}): ${errDetail}`);
  }

  if (!response.body) {
    throw new Error(`${providerName} returned empty response body`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const processLine = (line: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'data: [DONE]') return;

    let jsonStr = trimmed;
    if (trimmed.startsWith('data: ')) {
      jsonStr = trimmed.slice(6).trim();
    }

    if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // Ignore partial parse
        return;
      }

      if (parsed.error) {
        const errMsg = parsed.error.message || JSON.stringify(parsed.error);
        throw new Error(errMsg);
      }

      const delta =
        parsed.choices?.[0]?.delta?.content ??
        parsed.choices?.[0]?.delta?.reasoning_content ??
        parsed.choices?.[0]?.text;
      if (delta) {
        controller.enqueue(encoder.encode(delta));
      }
    }
  };

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            processLine(line, controller);
          }
        }
        if (buffer.trim()) {
          processLine(buffer, controller);
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

/**
 * Call Google Gemini via direct REST API with Multimodal Vision, PDF & Streaming
 */
async function callGemini({
  apiKey,
  model,
  systemPrompt,
  messages,
  attachments,
}: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: Message[];
  attachments: Attachment[];
}): Promise<ReadableStream<Uint8Array>> {
  // Normalize model name for standard Google AI Studio endpoint
  const effectiveModel =
    model === 'gemini-flash-latest' ? 'gemini-1.5-flash' : model;
  const baseUrl = (process.env.GEMINI_BASE_URL || PROVIDERS.gemini.endpoint).replace(/\/+$/, '');
  const endpoint = `${baseUrl}/models/${encodeURIComponent(effectiveModel)}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const rawContents: { role: 'user' | 'model'; parts: any[] }[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLastUserMessage = i === messages.length - 1 && msg.role === 'user';
    const role: 'user' | 'model' = msg.role === 'assistant' ? 'model' : 'user';

    const parts: any[] = [];

    if (msg.content) {
      parts.push({ text: msg.content });
    }

    const msgAttachments = isLastUserMessage
      ? [...(msg.attachments || []), ...attachments]
      : msg.attachments || [];

    for (const att of msgAttachments) {
      if (att.type === 'image' && att.data) {
        const base64Data = att.data.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: att.mimeType || 'image/jpeg',
            data: base64Data,
          },
        });
      } else if (att.type === 'pdf' && att.data) {
        // Native Gemini PDF support via inlineData!
        const base64Data = att.data.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data,
          },
        });
      } else if (att.extractedText) {
        parts.push({
          text: `\n[Attached File: ${att.name}]\n\`\`\`\n${att.extractedText}\n\`\`\`\n`,
        });
      }
    }

    if (parts.length > 0) {
      rawContents.push({ role, parts });
    }
  }

  // Gemini requires strict alternating turns (user -> model -> user) and first turn must be user.
  // Merge consecutive turns with the same role to prevent 400 Bad Request error.
  const contents: { role: 'user' | 'model'; parts: any[] }[] = [];
  for (const item of rawContents) {
    if (contents.length > 0 && contents[contents.length - 1].role === item.role) {
      contents[contents.length - 1].parts.push(...item.parts);
    } else {
      contents.push({ role: item.role, parts: [...item.parts] });
    }
  }

  if (contents.length > 0 && contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  const payload: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
    },
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errDetail = `${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      errDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {}
    throw new Error(`Google Gemini Error (${response.status}): ${errDetail}`);
  }

  if (!response.body) {
    throw new Error('Google Gemini returned empty response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const processGeminiLine = (line: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'data: [DONE]') return;

    let jsonStr = trimmed;
    if (trimmed.startsWith('data: ')) {
      jsonStr = trimmed.slice(6).trim();
    }

    if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // Ignore partial parse
        return;
      }

      if (parsed.error) {
        const errMsg = parsed.error.message || JSON.stringify(parsed.error);
        throw new Error(errMsg);
      }

      const candidates = parsed.candidates || [];
      const textPart = candidates[0]?.content?.parts?.[0]?.text;
      if (textPart) {
        controller.enqueue(encoder.encode(textPart));
      }
    }
  };

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            processGeminiLine(line, controller);
          }
        }
        if (buffer.trim()) {
          processGeminiLine(buffer, controller);
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

function createStreamResponse(
  stream: ReadableStream<Uint8Array>,
  meta: {
    provider: ProviderType;
    model: string;
    failoverChain: FailoverAttempt[];
    privacyMode: boolean;
    latencyMs: number;
  }
) {
  const headers = new Headers();
  headers.set('Content-Type', 'text/plain; charset=utf-8');
  headers.set('Cache-Control', 'no-cache, no-transform');
  headers.set('X-Prash-Provider', meta.provider);
  headers.set('X-Prash-Model', meta.model);
  headers.set('X-Prash-Failover-Chain', encodeURIComponent(JSON.stringify(meta.failoverChain)));
  headers.set('X-Prash-Privacy-Mode', meta.privacyMode ? 'true' : 'false');
  headers.set('X-Prash-Latency-Ms', String(meta.latencyMs));

  return new NextResponse(stream, { headers });
}
