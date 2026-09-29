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
  Download,
  RotateCcw,
  AlertTriangle,
  Sun,
  Moon,
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
  selectedModel?: string;
  privacyMode: boolean;
  onSelectProvider: (provider: 'auto' | ProviderType) => void;
  onSelectModel: (modelId: string | undefined) => void;
  onTogglePrivacy: () => void;
  onOpenWorksheetPrint: (content: string) => void;
  onExportCurrentChat?: () => void;
  error?: string | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  bypassToDefault?: boolean;
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
  selectedModel,
  privacyMode,
  onSelectProvider,
  onSelectModel,
  onTogglePrivacy,
  onOpenWorksheetPrint,
  onExportCurrentChat,
  error,
  theme,
  onToggleTheme,
  bypassToDefault = false,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handlePrintFullChat = () => {
    window.print();
  };

  return (
    <div
      className={`chat-area-container flex-1 flex flex-col h-full relative overflow-hidden transition-colors ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Navigation Bar */}
      <header
        className={`chat-header-bar h-14 border-b px-3 sm:px-6 flex items-center justify-between backdrop-blur-md z-20 shrink-0 ${
          isLight
            ? 'bg-white/90 border-slate-200 shadow-xs'
            : 'bg-slate-950/80 border-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className={`p-1.5 rounded-lg lg:hidden ${
              isLight
                ? 'text-slate-600 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Switch Agent Plugin Dropdown (Available anytime in middle of chat without horizontal scrolling) */}
          <AgentSelector
            selectedAgentId={selectedAgent.id}
            onSelectAgent={onSelectAgent}
            theme={theme}
          />
        </div>

        {/* Right side controls: Model selector, Export, Print, Theme */}
        <div className="flex items-center gap-2 no-print">
          {/* Quick Chat Actions */}
          {messages.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 border-r pr-2 mr-1 border-slate-300 dark:border-slate-800">
              {onExportCurrentChat && (
                <button
                  type="button"
                  onClick={onExportCurrentChat}
                  className={`p-1.5 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all ${
                    isLight
                      ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                      : 'border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Export this conversation as JSON and resume later"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                  <span className="hidden md:inline">Export</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrintFullChat}
                className={`p-1.5 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all ${
                  isLight
                    ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                    : 'border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-300'
                }`}
                title="Print this entire conversation to paper or PDF"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden md:inline">Print Chat</span>
              </button>
            </div>
          )}

          {/* Model Selector & Privacy Mode Switch */}
          <ModelSelector
            forcedProvider={forcedProvider}
            selectedModel={selectedModel}
            privacyMode={privacyMode}
            onSelectProvider={onSelectProvider}
            onSelectModel={onSelectModel}
            onTogglePrivacy={onTogglePrivacy}
            theme={theme}
            bypassToDefault={bypassToDefault}
          />

          {/* Theme Quick Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`p-1.5 rounded-xl border transition-colors ${
              isLight
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-xs'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title={theme === 'dark' ? 'Switch to Day Mode (Light)' : 'Switch to Night Mode (Dark)'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>
        </div>
      </header>

      {/* Main Messages & Empty State Container (Fills all space!) */}
      <div className="flex-1 overflow-y-auto w-full">
        {messages.length === 0 ? (
          /* Empty State / Agent Introduction */
          <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
            {/* Agent Hero Banner */}
            <div className="text-center space-y-3">
              <div
                className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-xl bg-gradient-to-br ${selectedAgent.gradient} text-white`}
              >
                <span>{selectedAgent.badgeEmoji}</span>
              </div>
              <div>
                <h2
                  className={`text-xl sm:text-2xl font-bold flex items-center justify-center gap-2 ${
                    isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  {selectedAgent.name}
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono font-medium">
                    Active Agent
                  </span>
                </h2>
                <p className={`text-sm mt-1 max-w-lg mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {selectedAgent.description}
                </p>
              </div>

              {selectedAgent.attachmentTips && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-700'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                  <span>{selectedAgent.attachmentTips}</span>
                </div>
              )}
            </div>

            {/* Suggested Starter Prompts */}
            <div className="space-y-2.5">
              <span className={`text-xs font-semibold uppercase tracking-wider block px-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Suggested Starters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedAgent.starterPrompts.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendMessage(s.prompt, [])}
                    className={`p-3.5 text-left rounded-2xl border transition-all shadow-xs group ${
                      isLight
                        ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs text-blue-600 dark:text-blue-400 group-hover:text-blue-500 flex items-center justify-between">
                      <span>{s.label}</span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <p
                      className={`text-xs mt-1 line-clamp-2 ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {s.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Switch to Other Agents in Empty State */}
            <div
              className={`space-y-2 pt-4 border-t ${
                isLight ? 'border-slate-200' : 'border-slate-800/80'
              }`}
            >
              <span className={`text-xs font-semibold uppercase tracking-wider block px-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Explore All 14 Built-In Agents
              </span>
              <div className="flex flex-wrap gap-2">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => onSelectAgent(agent)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                      agent.id === selectedAgent.id
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-600 dark:text-white font-medium'
                        : isLight
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs'
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
          /* Message Stream (Full page width up to max-w-7xl) */
          <div className="chat-messages-container py-2 space-y-1 w-full">
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onOpenWorksheetPrint={onOpenWorksheetPrint}
                theme={theme}
              />
            ))}

            {/* Live Streaming Indicator */}
            {isLoading && (
              <div
                className={`py-4 px-3 sm:px-6 border-y ${
                  isLight
                    ? 'bg-blue-50/60 border-blue-100'
                    : 'bg-slate-900/80 border-slate-800/40'
                }`}
              >
                <div className="max-w-7xl mx-auto flex items-center gap-3 px-2 sm:px-4">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br ${selectedAgent.gradient} text-white flex items-center justify-center shadow-md text-base shrink-0 animate-pulse`}
                  >
                    <span>{selectedAgent.badgeEmoji}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {selectedAgent.name} is thinking & analyzing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner with Retry */}
            {error && (
              <div className="max-w-7xl mx-auto my-3 px-4">
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onRetryLast}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-100 font-medium transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Chat Input Bar (Full page max-w-7xl width) */}
      <footer className="chat-composer-container p-3 sm:p-4 max-w-7xl w-full mx-auto">
        <ChatInput
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          onStop={onStop}
          selectedAgentId={selectedAgent.id}
          onSelectAgent={onSelectAgent}
          privacyMode={privacyMode}
          theme={theme}
        />
        <div className={`text-[10px] text-center mt-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Personal Multi-Agent Hub • Auto failover routing • Voice dictation & speech • Zero-training privacy option.
        </div>
      </footer>
    </div>
  );
}
