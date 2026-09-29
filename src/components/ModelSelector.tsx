'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProviderType } from '@/types/chat';
import { PROVIDERS, CANONICAL_DEFAULTS } from '@/lib/models';
import { Cpu, ChevronDown, Check, ShieldCheck, Zap, Layers, Sparkles, Lock } from 'lucide-react';

interface ModelSelectorProps {
  forcedProvider: 'auto' | ProviderType;
  selectedModel?: string;
  privacyMode: boolean;
  onSelectProvider: (provider: 'auto' | ProviderType) => void;
  onSelectModel: (modelId: string | undefined) => void;
  onTogglePrivacy: () => void;
  theme?: 'dark' | 'light';
  bypassToDefault?: boolean;
}

export function ModelSelector({
  forcedProvider,
  selectedModel,
  privacyMode,
  onSelectProvider,
  onSelectModel,
  onTogglePrivacy,
  theme = 'dark',
  bypassToDefault = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLight = theme === 'light';

  // Display label for active selection
  let currentLabel = 'Cascade: Auto';
  if (privacyMode) {
    currentLabel = 'Gemini (Private)';
  } else if (bypassToDefault) {
    currentLabel = `Default (${CANONICAL_DEFAULTS.openai})`;
  } else if (selectedModel) {
    // Find model name
    for (const p of Object.values(PROVIDERS)) {
      const match = p.availableModels.find((m) => m.id === selectedModel);
      if (match) {
        currentLabel = match.name;
        break;
      }
    }
  } else if (forcedProvider !== 'auto') {
    currentLabel = PROVIDERS[forcedProvider]?.name || forcedProvider;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Privacy Mode Quick Toggle Button */}
      <button
        type="button"
        onClick={onTogglePrivacy}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
          privacyMode
            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 shadow-sm'
            : isLight
            ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:text-slate-200 hover:bg-slate-700/60'
        }`}
        title={
          privacyMode
            ? 'Privacy Mode ACTIVE: Exclusively routed to Google Gemini paid key (zero data retention guarantee)'
            : 'Click to enable Privacy Mode (Routes to Gemini Paid Tier with zero data training retention)'
        }
      >
        <ShieldCheck className={`w-3.5 h-3.5 ${privacyMode ? 'text-emerald-500' : 'text-slate-400'}`} />
        <span className="hidden sm:inline">{privacyMode ? 'Zero-Training (Gemini)' : 'Privacy'}</span>
        {privacyMode && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      </button>

      {/* Model Cascade Dropdown */}
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all shadow-sm ${
            isLight
              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
              : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
          }`}
          title="Select model or auto cascade"
        >
          {privacyMode ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-sky-600 dark:text-sky-300 truncate max-w-[130px]">
                Gemini Paid
              </span>
            </>
          ) : bypassToDefault ? (
            <>
              <Lock className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[130px]">
                Env Default
              </span>
            </>
          ) : selectedModel ? (
            <>
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[140px]">
                {currentLabel}
              </span>
            </>
          ) : forcedProvider === 'auto' ? (
            <>
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium text-slate-600 dark:text-slate-400">Cascade:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[90px]">
                {CANONICAL_DEFAULTS.openai}
              </span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-semibold capitalize text-indigo-600 dark:text-indigo-300">
                {currentLabel}
              </span>
            </>
          )}
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div
            className={`absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl border shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[490px] overflow-y-auto ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
          >
            <div
              className={`px-3 py-2 border-b mb-1.5 flex items-center justify-between ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <span
                className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-blue-500" />
                Select AI Model or Strategy
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Failover Ready</span>
            </div>

            {bypassToDefault && (
              <div
                className={`p-3 rounded-xl my-1 border ${
                  isLight
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-blue-950/50 border-blue-800/60 text-blue-200'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs">
                  <Lock className="w-4 h-4 text-blue-500 shrink-0" />
                  Default Model Bypass Active
                </div>
                <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                  Server environment variables have enforced canonical default models for all providers. Client model overrides are bypassed.
                </p>
              </div>
            )}

            {privacyMode ? (
              <div
                className={`p-3 rounded-xl my-1 border ${
                  isLight
                    ? 'bg-sky-50 border-sky-200 text-sky-900'
                    : 'bg-sky-950/50 border-sky-800/60 text-sky-200'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs">
                  <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
                  Privacy Lock Active
                </div>
                <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                  Third-party providers are bypassed. All messages route strictly to Google Gemini (zero data retention guarantee).
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Auto Cascade Option */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectProvider('auto');
                    onSelectModel(undefined);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between ${
                    forcedProvider === 'auto' && !selectedModel
                      ? isLight
                        ? 'bg-blue-50 border border-blue-300 text-blue-900'
                        : 'bg-blue-600/20 border border-blue-500/40 text-white'
                      : isLight
                      ? 'hover:bg-slate-100 border border-transparent text-slate-700'
                      : 'hover:bg-slate-800/70 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div
                        className={`font-semibold text-xs flex items-center gap-1.5 ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      >
                        Smart Auto-Cascade
                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full font-mono font-medium">
                          Recommended
                        </span>
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        OpenAI (gpt-5.4-mini) ➜ Gemini ➜ NVIDIA ➜ Groq
                      </p>
                    </div>
                  </div>
                  {forcedProvider === 'auto' && !selectedModel && (
                    <Check className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                </button>

                {/* Model Groups */}
                {(['openai', 'gemini', 'nvidia', 'groq'] as ProviderType[]).map((prov) => {
                  const meta = PROVIDERS[prov];
                  return (
                    <div key={prov} className="pt-1.5 space-y-1">
                      <div
                        className={`px-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        <span>{meta.name}</span>
                        <span className="text-[9px] lowercase opacity-75">{meta.privacyTier}</span>
                      </div>

                      <div className="space-y-0.5">
                        {meta.availableModels.map((m) => {
                          const isSelected = selectedModel === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                onSelectModel(m.id);
                                onSelectProvider(m.provider);
                                setIsOpen(false);
                              }}
                              className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs ${
                                isSelected
                                  ? isLight
                                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold'
                                    : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold'
                                  : isLight
                                  ? 'hover:bg-slate-100 text-slate-800'
                                  : 'hover:bg-slate-800/70 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                                <div>
                                  <span className="font-mono text-xs">{m.name}</span>
                                  {m.isDefault && (
                                    <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-sans">
                                      default
                                    </span>
                                  )}
                                  {m.vision && (
                                    <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono">
                                      vision
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
