'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProviderType } from '@/types/chat';
import { PROVIDERS } from '@/lib/models';
import { Cpu, ChevronDown, Check, ShieldCheck, Zap, Layers } from 'lucide-react';

interface ModelSelectorProps {
  forcedProvider: 'auto' | ProviderType;
  privacyMode: boolean;
  onSelectProvider: (provider: 'auto' | ProviderType) => void;
  onTogglePrivacy: () => void;
  customOpenAiModel?: string;
  customGeminiModel?: string;
}

export function ModelSelector({
  forcedProvider,
  privacyMode,
  onSelectProvider,
  onTogglePrivacy,
  customOpenAiModel,
  customGeminiModel,
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

  const openAiModelName = customOpenAiModel || PROVIDERS.openai.defaultModel;
  const geminiModelName = customGeminiModel || PROVIDERS.gemini.defaultModel;

  return (
    <div className="flex items-center gap-2">
      {/* Privacy Mode Quick Toggle Button */}
      <button
        type="button"
        onClick={onTogglePrivacy}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
          privacyMode
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
            : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:text-slate-200 hover:bg-slate-700/60'
        }`}
        title={
          privacyMode
            ? 'Privacy Mode ACTIVE: Exclusively routed to Gemini (Zero-training paid tier), In-memory only'
            : 'Click to enable Privacy Mode (Routes to Gemini Paid Tier with zero data training retention)'
        }
      >
        <ShieldCheck className={`w-3.5 h-3.5 ${privacyMode ? 'text-emerald-400' : 'text-slate-400'}`} />
        <span className="hidden sm:inline">{privacyMode ? 'Zero-Training (Gemini)' : 'Privacy'}</span>
        {privacyMode && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      </button>

      {/* Model Cascade Dropdown */}
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 transition-all shadow-sm"
          title="Model Routing & Failover"
        >
          {privacyMode ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-sky-300">Gemini Paid (Private)</span>
            </>
          ) : forcedProvider === 'auto' ? (
            <>
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium text-slate-200">Cascade:</span>
              <span className="font-semibold text-emerald-400 truncate max-w-[90px]">{openAiModelName}</span>
              <span className="text-[10px] text-slate-400 hidden md:inline">➜ Gem ➜ Nv ➜ Groq</span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold capitalize text-indigo-300">{forcedProvider}</span>
            </>
          )}
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-800 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                Model Routing Strategy
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatic failover ensures zero downtime if any provider limits are hit.
              </p>
            </div>

            {privacyMode ? (
              <div className="p-3 bg-sky-950/40 border border-sky-800/50 rounded-xl my-1">
                <div className="flex items-center gap-2 text-sky-300 font-medium text-xs">
                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  Privacy Lock Active
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  OpenAI and third-party models are bypassed. Routed exclusively to your paid Google Gemini key (zero training data retention guarantee).
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Auto Cascade Option */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectProvider('auto');
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between ${
                    forcedProvider === 'auto'
                      ? 'bg-blue-600/15 border border-blue-500/30 text-white'
                      : 'hover:bg-slate-800/70 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                        Smart Auto-Cascade
                        <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-400 rounded">Default</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {openAiModelName} ➜ {geminiModelName} ➜ NVIDIA ➜ Groq
                      </p>
                    </div>
                  </div>
                  {forcedProvider === 'auto' && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                </button>

                <div className="pt-1.5 pb-0.5 px-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Or Force Specific Provider
                  </span>
                </div>

                {/* Individual Providers */}
                {(['openai', 'gemini', 'nvidia', 'groq'] as ProviderType[]).map((prov) => {
                  const meta = PROVIDERS[prov];
                  const isSelected = forcedProvider === prov;
                  return (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => {
                        onSelectProvider(prov);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-800 border border-slate-600 text-white'
                          : 'hover:bg-slate-800/50 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-200">{meta.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({prov === 'openai' ? openAiModelName : prov === 'gemini' ? geminiModelName : meta.defaultModel})
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    </button>
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
