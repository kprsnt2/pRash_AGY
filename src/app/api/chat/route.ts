import { NextRequest, NextResponse } from 'next/server';
import { Attachment, FailoverAttempt, Message, ProviderType } from '@/types/chat';
import { PROVIDERS, getProviderCascade } from '@/lib/models';

interface RequestBody {
  messages: Message[];
  agentSystemPrompt: string;
  attachments?: Attachment[];
  privacyMode?: boolean;
  forcedProvider?: 'auto' | ProviderType;
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
  try {
    const body: RequestBody = await req.json();
    const {
      messages,
      agentSystemPrompt,
      attachments = [],
      privacyMode = false,
      forcedProvider = 'auto',
      customKeys = {},
    } = body;

    // Determine cascade sequence
    const cascade = getProviderCascade(privacyMode, forcedProvider);
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
          const apiKey = customKeys.openaiApiKey || process.env.OPENAI_API_KEY;
          const model = customKeys.openaiModel || process.env.OPENAI_MODEL_DEFAULT || PROVIDERS.openai.defaultModel;
          attempt.model = model;

          if (!apiKey) {
            attempt.status = 'failed';
            attempt.error = 'No OpenAI API Key configured';
            failoverChain.push(attempt);
            continue;
          }

          const stream = await callOpenAICompatible({
            apiKey,
            model,
            endpoint: process.env.OPENAI_BASE_URL || PROVIDERS.openai.endpoint,
            systemPrompt: agentSystemPrompt,
            messages,
            attachments,
            providerName: 'OpenAI',
          });

          attempt.status = 'success';
          failoverChain.push(attempt);

          return createStreamResponse(stream, {
            provider: 'openai',
            model,
            failoverChain,
            privacyMode,
          });
        }

        if (provider === 'gemini') {
          const apiKey = customKeys.geminiApiKey || process.env.GEMINI_API_KEY;
          const model = customKeys.geminiModel || process.env.GEMINI_MODEL_DEFAULT || PROVIDERS.gemini.defaultModel;
          attempt.model = model;

          if (!apiKey) {
            attempt.status = 'failed';
            attempt.error = 'No Gemini API Key configured';
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
          failoverChain.push(attempt);

          return createStreamResponse(stream, {
            provider: 'gemini',
            model,
            failoverChain,
            privacyMode,
          });
        }

        if (provider === 'nvidia') {
          const apiKey = customKeys.nvidiaApiKey || process.env.NVIDIA_API_KEY;
          const model = customKeys.nvidiaModel || process.env.NVIDIA_MODEL_DEFAULT || PROVIDERS.nvidia.defaultModel;
          attempt.model = model;

          if (!apiKey) {
            attempt.status = 'failed';
            attempt.error = 'No NVIDIA API Key configured';
            failoverChain.push(attempt);
            continue;
          }

          const stream = await callOpenAICompatible({
            apiKey,
            model,
            endpoint: process.env.NVIDIA_BASE_URL || PROVIDERS.nvidia.endpoint,
            systemPrompt: agentSystemPrompt,
            messages,
            attachments,
            providerName: 'NVIDIA',
          });

          attempt.status = 'success';
          failoverChain.push(attempt);

          return createStreamResponse(stream, {
            provider: 'nvidia',
            model,
            failoverChain,
            privacyMode,
          });
        }

        if (provider === 'groq') {
          const apiKey = customKeys.groqApiKey || process.env.GROQ_API_KEY;
          const model = customKeys.groqModel || process.env.GROQ_MODEL_DEFAULT || PROVIDERS.groq.defaultModel;
          attempt.model = model;

          if (!apiKey) {
            attempt.status = 'failed';
            attempt.error = 'No Groq API Key configured';
            failoverChain.push(attempt);
            continue;
          }

          const stream = await callOpenAICompatible({
            apiKey,
            model,
            endpoint: process.env.GROQ_BASE_URL || PROVIDERS.groq.endpoint,
            systemPrompt: agentSystemPrompt,
            messages,
            attachments,
            providerName: 'Groq',
          });

          attempt.status = 'success';
          failoverChain.push(attempt);

          return createStreamResponse(stream, {
            provider: 'groq',
            model,
            failoverChain,
            privacyMode,
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
    return NextResponse.json(
      {
        error: 'All configured model providers failed or are missing API keys.',
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
 * Call OpenAI, NVIDIA, or Groq (all OpenAI-compatible chat completion APIs)
 */
async function callOpenAICompatible({
  apiKey,
  model,
  endpoint,
  systemPrompt,
  messages,
  attachments,
  providerName,
}: {
  apiKey: string;
  model: string;
  endpoint: string;
  systemPrompt: string;
  messages: Message[];
  attachments: Attachment[];
  providerName: string;
}): Promise<ReadableStream<Uint8Array>> {
  // Build OpenAI formatted messages
  const formattedMessages: any[] = [];

  if (systemPrompt) {
    formattedMessages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  // Add conversation history
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLastUserMessage = i === messages.length - 1 && msg.role === 'user';

    if (msg.role === 'user') {
      const parts: any[] = [];

      // Include text content
      if (msg.content) {
        parts.push({ type: 'text', text: msg.content });
      }

      // If this is the last user message, attach current attachments
      const msgAttachments = isLastUserMessage ? [...(msg.attachments || []), ...attachments] : msg.attachments || [];

      for (const att of msgAttachments) {
        if (att.type === 'image') {
          parts.push({
            type: 'image_url',
            image_url: {
              url: att.data,
              detail: 'high',
            },
          });
        } else if (att.extractedText) {
          parts.push({
            type: 'text',
            text: `\n[Attached File: ${att.name}]\n\`\`\`\n${att.extractedText}\n\`\`\`\n`,
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
      errDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {}
    throw new Error(`${providerName} Error (${response.status}): ${errDetail}`);
  }

  if (!response.body) {
    throw new Error(`${providerName} returned empty response body`);
  }

  // Parse SSE chunks and extract content delta
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  let buffer = '';

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
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // Ignore parse errors from malformed SSE chunks
              }
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

/**
 * Call Google Gemini via direct REST API with Multimodal Vision & Streaming
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
  // Normalize model name (e.g. gemini-flash-latest -> gemini-1.5-flash if needed)
  const effectiveModel = model === 'gemini-flash-latest' ? 'gemini-1.5-flash' : model;
  const endpoint = `${PROVIDERS.gemini.endpoint}/models/${effectiveModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const contents: any[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLastUserMessage = i === messages.length - 1 && msg.role === 'user';
    const role = msg.role === 'assistant' ? 'model' : 'user';

    const parts: any[] = [];

    if (msg.content) {
      parts.push({ text: msg.content });
    }

    const msgAttachments = isLastUserMessage ? [...(msg.attachments || []), ...attachments] : msg.attachments || [];

    for (const att of msgAttachments) {
      if (att.type === 'image') {
        // Strip data:image/...;base64,
        const base64Data = att.data.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
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
      contents.push({ role, parts });
    }
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
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errDetail = `${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      errDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {}
    throw new Error(`Gemini Error (${response.status}): ${errDetail}`);
  }

  if (!response.body) {
    throw new Error('Gemini returned empty response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

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
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const candidates = parsed.candidates || [];
                const textPart = candidates[0]?.content?.parts?.[0]?.text;
                if (textPart) {
                  controller.enqueue(encoder.encode(textPart));
                }
              } catch {
                // Ignore parse errors from partial JSON chunks
              }
            }
          }
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
  }
) {
  const headers = new Headers();
  headers.set('Content-Type', 'text/plain; charset=utf-8');
  headers.set('Cache-Control', 'no-cache, no-transform');
  headers.set('X-Prash-Provider', meta.provider);
  headers.set('X-Prash-Model', meta.model);
  headers.set('X-Prash-Failover-Chain', encodeURIComponent(JSON.stringify(meta.failoverChain)));
  headers.set('X-Prash-Privacy-Mode', meta.privacyMode ? 'true' : 'false');

  return new NextResponse(stream, { headers });
}
