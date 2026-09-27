'use client';

import React, { useRef, useEffect } from 'react';
import { AgentConfig, Attachment, Message, ProviderType } from '@/types/chat';
import { AGENTS } from '@/lib/agents';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';
import { AgentSelector } from './AgentSelector';
import { ModelSelector } from './ModelSelector';
import {
  Menu,
  Sparkles,
  Paperclip,
  Printer,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  selectedAgent: AgentConfig;
  onSelectAgent: (agent: AgentConfig) => void;
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
  onRetryLast: () => void;
  onOpenMobileSidebar: () => void;
  forcedProvider: 'auto' | ProviderType;
  privacyMode: boolean;
  onSelectProvider: (provider: 'auto' | ProviderType) => void;
  onTogglePrivacy: () => void;
  onOpenWorksheetPrint: (content: string) => void;
  customOpenAiModel?: string;
  customGeminiModel?: string;
  error?: string | null;
}

export function ChatArea({
  messages,
  isLoading,
  selectedAgent,
  onSelectAgent,
  onSendMessage,
  onStop,
  onRetryLast,
  onOpenMobileSidebar,
  forcedProvider,
  privacyMode,
  onSelectProvider,
  onTogglePrivacy,
  onOpenWorksheetPrint,
  customOpenAiModel,
  customGeminiModel,
  error,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between bg-slate-950/70 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Agent Plugin Dropdown */}
          <AgentSelector
            selectedAgentId={selectedAgent.id}
            onSelectAgent={onSelectAgent}
          />
        </div>

        {/* Model Selector & Privacy Mode Switch */}
        <ModelSelector
          forcedProvider={forcedProvider}
          privacyMode={privacyMode}
          onSelectProvider={onSelectProvider}
          onTogglePrivacy={onTogglePrivacy}
          customOpenAiModel={customOpenAiModel}
          customGeminiModel={customGeminiModel}
        />
      </header>

      {/* Main Messages & Empty State Container */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty State / Agent Introduction */
          <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
            {/* Agent Hero Banner */}
            <div className="text-center space-y-3">
              <div
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-xl bg-gradient-to-br ${selectedAgent.gradient} text-white`}
              >
                <span>{selectedAgent.badgeEmoji}</span>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center justify-center gap-2">
                  {selectedAgent.name}
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono">
                    Plugin
                  </span>
                </h2>
                <p className="text-sm text-slate-400 mt-1 max-w-lg mx-auto">
                  {selectedAgent.description}
                </p>
              </div>

              {selectedAgent.attachmentTips && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                  <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                  <span>{selectedAgent.attachmentTips}</span>
                </div>
              )}
            </div>

            {/* Starter Prompts */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block px-1">
                Suggested Starters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedAgent.starterPrompts.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendMessage(s.prompt, [])}
                    className="p-3 text-left rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm group"
                  >
                    <div className="font-semibold text-xs text-blue-400 group-hover:text-blue-300 flex items-center justify-between">
                      {s.label}
                      <Sparkles className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-xs text-slate-400 group-hover:text-slate-300 mt-1 line-clamp-2">
                      {s.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Switch to Other Agents */}
            <div className="space-y-2 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block px-1">
                Explore Other Built-in Agents
              </span>
              <div className="flex flex-wrap gap-2">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => onSelectAgent(agent)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                      agent.id === selectedAgent.id
                        ? 'bg-blue-600/20 border-blue-500/50 text-white font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{agent.badgeEmoji}</span>
                    <span>{agent.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message Stream */
          <div className="py-4 space-y-1">
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onOpenWorksheetPrint={onOpenWorksheetPrint}
              />
            ))}

            {/* Live Streaming Loader */}
            {isLoading && (
              <div className="py-4 px-3 sm:px-6 bg-slate-900/80 border-y border-slate-800/40">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br ${selectedAgent.gradient} text-white flex items-center justify-center shadow-md text-base shrink-0 animate-pulse`}
                  >
                    <span>{selectedAgent.badgeEmoji}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    <span>{selectedAgent.name} is thinking & analyzing...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner with Retry */}
            {error && (
              <div className="max-w-4xl mx-auto my-3 px-4">
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onRetryLast}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-900/50 hover:bg-rose-900 text-rose-200 font-medium transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Chat Input Bar */}
      <footer className="p-3 sm:p-4 max-w-4xl w-full mx-auto">
        <ChatInput
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          onStop={onStop}
          selectedAgentId={selectedAgent.id}
          onSelectAgent={onSelectAgent}
          privacyMode={privacyMode}
        />
        <div className="text-[10px] text-center text-slate-400 mt-2">
          Personal Multi-Agent Hub • Supports multiple attachments, images, PDFs & zero-training privacy routing.
        </div>
      </footer>
    </div>
  );
}
