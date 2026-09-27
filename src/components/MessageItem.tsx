'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message, Attachment } from '@/types/chat';
import { getAgentById } from '@/lib/agents';
import { PROVIDERS } from '@/lib/models';
import { formatFileSize } from '@/lib/file-utils';
import {
  Copy,
  Check,
  Printer,
  Sparkles,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Zap,
  Info,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  onOpenWorksheetPrint?: (content: string) => void;
  onPreviewAttachment?: (attachment: Attachment) => void;
}

export function MessageItem({ message, onOpenWorksheetPrint, onPreviewAttachment }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [showFailoverDetail, setShowFailoverDetail] = useState(false);

  const isUser = message.role === 'user';
  const agent = getAgentById(message.agentId || 'general');

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isWorksheet =
    message.agentId === 'printnova' ||
    message.agentId === 'worksheet' ||
    message.content.includes('[School / Home Study Worksheet]') ||
    message.content.includes('Student Name:') ||
    message.content.includes('Answer Key');

  const hasFailover = (message.failoverChain?.length || 0) > 1;
  const failedAttempts = message.failoverChain?.filter((a) => a.status === 'failed') || [];

  return (
    <div className={`py-4 px-3 sm:px-6 transition-colors ${isUser ? 'bg-slate-900/30' : 'bg-slate-900/80 border-y border-slate-800/40'}`}>
      <div className="max-w-4xl mx-auto flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-semibold text-slate-200">
              You
            </div>
          ) : (
            <div
              className={`w-8 h-8 rounded-xl bg-gradient-to-br ${agent.gradient} text-white flex items-center justify-center shadow-md text-base`}
            >
              <span>{agent.badgeEmoji}</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-200">
                {isUser ? 'You' : agent.name}
              </span>

              {!isUser && message.modelUsed && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  {message.modelUsed}
                </span>
              )}

              {/* Failover Badge */}
              {!isUser && hasFailover && (
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setShowFailoverDetail(!showFailoverDetail)}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 transition-colors cursor-pointer"
                    title="Cascade failover occurred"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Failover active ({failedAttempts.length} bypassed)</span>
                  </button>

                  {showFailoverDetail && (
                    <div className="absolute left-0 mt-1 w-72 p-2.5 rounded-xl bg-slate-950 border border-amber-500/40 shadow-xl z-20 text-[11px] space-y-1.5 animate-in fade-in zoom-in-95">
                      <div className="font-semibold text-amber-300 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        Cascade Log
                      </div>
                      {message.failoverChain?.map((f, idx) => (
                        <div key={idx} className="flex items-start justify-between border-b border-slate-800 pb-1">
                          <span className="capitalize text-slate-300 font-mono">{f.provider}</span>
                          <span
                            className={`font-mono text-[10px] ${
                              f.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {f.status === 'success' ? '✓ Responded' : `✗ ${f.error || 'Failed'}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5">
              {!isUser && isWorksheet && onOpenWorksheetPrint && (
                <button
                  type="button"
                  onClick={() => onOpenWorksheetPrint(message.content)}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                  title="Print worksheet in classroom / test format"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print Worksheet</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Copy text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* User Attachments Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  onClick={() => onPreviewAttachment && onPreviewAttachment(att)}
                  className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-1.5 pr-2.5 text-xs text-slate-200 hover:bg-slate-700/80 cursor-pointer transition-colors max-w-xs"
                >
                  {att.type === 'image' ? (
                    <img src={att.data} alt={att.name} className="w-7 h-7 rounded object-cover border border-slate-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  )}
                  <span className="truncate max-w-[140px]">{att.name}</span>
                  <span className="text-[10px] text-slate-400">({formatFileSize(att.size)})</span>
                </div>
              ))}
            </div>
          )}

          {/* Markdown Content */}
          <div className="prose-dark text-sm sm:text-base leading-relaxed break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
