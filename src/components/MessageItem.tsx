'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Attachment, Message } from '@/types/chat';
import { getAgentById } from '@/lib/agents';
import { formatFileSize } from '@/lib/file-utils';
import { isSpeechSynthesisSupported, speakText, cancelSpeech } from '@/lib/speech';
import { sanitizeMessageContent } from '@/lib/storage';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Printer,
  FileText,
  Clock,
  BarChart,
  Zap,
  Cpu,
  Layers,
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  onOpenWorksheetPrint?: (content: string) => void;
  onPreviewAttachment?: (attachment: Attachment) => void;
  theme?: 'dark' | 'light';
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
        <span className="uppercase text-[11px] font-semibold text-slate-300">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-sans">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px] font-sans">Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-3.5 overflow-x-auto text-xs sm:text-sm font-mono text-slate-100 leading-relaxed bg-slate-950/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MessageItem({
  message,
  onOpenWorksheetPrint,
  onPreviewAttachment,
  theme = 'dark',
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showFailoverDetail, setShowFailoverDetail] = useState(false);

  const isUser = message.role === 'user';
  const isLight = theme === 'light';
  const agent = getAgentById(message.agentId || 'general');

  // Sanitize any raw SSE chunk JSON strings that might have leaked
  const cleanContent = sanitizeMessageContent(message.content);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(cleanContent);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = cleanContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      cancelSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const success = speakText(cleanContent, {
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
      if (!success) {
        setIsSpeaking(false);
      }
    }
  };

  const isWorksheet =
    message.agentId === 'printnova' ||
    message.agentId === 'worksheet' ||
    message.agentId === 'printmatrix' ||
    cleanContent.includes('[School / Home Study Worksheet]') ||
    cleanContent.includes('Student Name:') ||
    /answer\s*key/i.test(cleanContent) ||
    cleanContent.includes('--- [ANSWER KEY');

  const hasFailover = (message.failoverChain?.length || 0) > 1;
  const failedAttempts = message.failoverChain?.filter((a) => a.status === 'failed') || [];

  // Estimated token count based on content length
  const tokenCount =
    message.tokenCount || (cleanContent ? Math.max(1, Math.round(cleanContent.length / 3.8)) : 0);

  // Formatted latency
  const latencyDisplay = message.latencyMs
    ? `${(message.latencyMs / 1000).toFixed(2)}s`
    : null;

  // Tokens per second throughput calculation
  const speedDisplay =
    message.latencyMs && message.latencyMs > 0 && tokenCount > 0
      ? `${(tokenCount / (message.latencyMs / 1000)).toFixed(1)} tok/s`
      : null;

  return (
    <div
      className={`message-item py-4 px-3 sm:px-6 border-b transition-colors ${
        isUser
          ? 'bg-transparent border-transparent'
          : isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-slate-900/70 border-slate-800/50 text-slate-100'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto flex items-start gap-3 sm:gap-4 px-1 sm:px-3">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
              You
            </div>
          ) : (
            <div
              className={`w-8 h-8 rounded-xl bg-gradient-to-br ${agent.gradient} text-white flex items-center justify-center shadow-md text-base`}
              title={`${agent.name} (${agent.tagline})`}
            >
              <span>{agent.badgeEmoji}</span>
            </div>
          )}
        </div>

        {/* Main Body */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-semibold text-xs sm:text-sm ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {isUser ? 'You' : agent.name}
              </span>

              {!isUser && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono font-medium">
                  {agent.badgeEmoji} {agent.id}
                </span>
              )}

              {/* Provider & Model Badge */}
              {!isUser && (message.modelUsed || message.providerUsed) && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                  <Cpu className="w-3 h-3 text-emerald-500" />
                  <span>{message.modelUsed || message.providerUsed}</span>
                </span>
              )}

              {/* Failover Status Tag */}
              {!isUser && hasFailover && (
                <div className="relative inline-block no-print">
                  <button
                    type="button"
                    onClick={() => setShowFailoverDetail(!showFailoverDetail)}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors cursor-pointer font-medium"
                    title="Cascade failover occurred: click to view route logs"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Auto-routed ({failedAttempts.length} bypassed)</span>
                  </button>

                  {showFailoverDetail && (
                    <div
                      className={`absolute left-0 mt-1 w-80 p-3 rounded-2xl border shadow-2xl z-30 text-[11px] space-y-2 animate-in fade-in zoom-in-95 ${
                        isLight
                          ? 'bg-white border-amber-500/40 text-slate-800'
                          : 'bg-slate-900 border-amber-500/40 text-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-amber-600 dark:text-amber-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          Cascade Failover Trace
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {message.failoverChain?.length} attempts
                        </span>
                      </div>
                      <div className="space-y-1 pt-1">
                        {message.failoverChain?.map((f, idx) => (
                          <div
                            key={idx}
                            className={`p-1.5 rounded-lg border flex items-center justify-between ${
                              isLight
                                ? 'bg-slate-50 border-slate-200'
                                : 'bg-slate-950/70 border-slate-800'
                            }`}
                          >
                            <span className="capitalize font-mono font-medium">{f.provider}</span>
                            <span
                              className={`font-mono text-[10px] ${
                                f.status === 'success' ? 'text-emerald-500 font-semibold' : 'text-rose-500'
                              }`}
                            >
                              {f.status === 'success' ? '✓ Responded' : `✗ ${f.error || 'Failed'}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Action Tools */}
            <div className="flex items-center gap-1.5 no-print">
              {/* Print Button (Worksheet Studio or Document PDF) */}
              {!isUser && onOpenWorksheetPrint && (
                <button
                  type="button"
                  onClick={() => onOpenWorksheetPrint(cleanContent)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-medium shadow-sm transition-all cursor-pointer ${
                    isWorksheet
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={isWorksheet ? "Print formatted worksheet with optional Answer Key" : "Print message as PDF"}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isWorksheet ? 'Print Worksheet' : 'Print / PDF'}</span>
                </button>
              )}

              {/* Read Aloud / Speaking Button */}
              {!isUser && isSpeechSynthesisSupported() && (
                <button
                  type="button"
                  onClick={handleToggleSpeak}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                    isSpeaking
                      ? 'bg-blue-600 text-white shadow-sm animate-pulse'
                      : isLight
                      ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={isSpeaking ? 'Stop speaking' : 'Read reply aloud'}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              {/* Copy Message Button */}
              <button
                type="button"
                onClick={handleCopyMessage}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Copy entire message"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* User Attachments Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-1">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  onClick={() => onPreviewAttachment && onPreviewAttachment(att)}
                  className={`flex items-center gap-2 border rounded-xl p-1.5 pr-2.5 text-xs cursor-pointer transition-colors max-w-xs ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700/80'
                  }`}
                >
                  {att.type === 'image' ? (
                    <img
                      src={att.data}
                      alt={att.name}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-300 dark:border-slate-600"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                  <span className="truncate max-w-[130px] font-medium">{att.name}</span>
                  <span className="text-[10px] text-slate-400">({formatFileSize(att.size)})</span>
                </div>
              ))}
            </div>
          )}

          {/* Markdown Content */}
          <div className="prose-content text-sm sm:text-base leading-relaxed break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ node, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  const isMultiline = codeString.includes('\n');

                  if (match || isMultiline) {
                    return <CodeBlock language={match ? match[1] : ''} code={codeString} />;
                  }

                  return (
                    <code
                      className={`px-1.5 py-0.5 rounded font-mono text-xs ${
                        isLight
                          ? 'bg-slate-100 border border-slate-300 text-slate-900'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>

          {/* Failover Explanation Note at the end of chat if failover occurred */}
          {!isUser && hasFailover && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[11px]">
                  ⚡ Auto-routed to {message.providerUsed?.toUpperCase()} ({message.modelUsed})
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Earlier providers in cascade were skipped due to:{' '}
                  {failedAttempts.map((f) => `${f.provider} (${f.error || 'unavailable'})`).join(', ')}.
                </p>
              </div>
            </div>
          )}

          {/* Message Stats Footer (Response time, tokens, speed, timestamp) */}
          {!isUser && (
            <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800/60 font-mono">
              {latencyDisplay && (
                <span className="flex items-center gap-1" title="Generation latency">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{latencyDisplay}</span>
                </span>
              )}
              {tokenCount > 0 && (
                <span className="flex items-center gap-1" title="Estimated token count">
                  <BarChart className="w-3 h-3 text-slate-400" />
                  <span>~{tokenCount} tokens</span>
                </span>
              )}
              {speedDisplay && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold" title="Generation throughput">
                  <Zap className="w-3 h-3" />
                  <span>{speedDisplay}</span>
                </span>
              )}
              <span>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
