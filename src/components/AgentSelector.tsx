'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AGENTS } from '@/lib/agents';
import { AgentConfig } from '@/types/chat';
import { ChevronDown, Check, Sparkles, Search } from 'lucide-react';

interface AgentSelectorProps {
  selectedAgentId: string;
  onSelectAgent: (agent: AgentConfig) => void;
  compact?: boolean;
  theme?: 'dark' | 'light';
}

export function AgentSelector({
  selectedAgentId,
  onSelectAgent,
  compact = false,
  theme = 'dark',
}: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentAgent = AGENTS.find((a) => a.id === selectedAgentId) || AGENTS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAgents = AGENTS.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tagline.toLowerCase().includes(search.toLowerCase())
  );

  const isLight = theme === 'light';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl transition-all border font-medium text-left shadow-sm ${
          compact
            ? isLight
              ? 'px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'px-2.5 py-1 text-xs bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
            : isLight
            ? 'px-3 py-1.5 text-xs sm:text-sm bg-white hover:bg-slate-100 border-slate-300 text-slate-900'
            : 'px-3 py-1.5 text-xs sm:text-sm bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-100'
        }`}
        title="Switch Agent Plugin (Available anytime in middle of chat without horizontal scrolling)"
      >
        <span className="text-base leading-none">{currentAgent.badgeEmoji}</span>
        <span className="font-semibold truncate max-w-[130px] sm:max-w-[160px]">
          {currentAgent.name}
        </span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono font-medium">
          Agent
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[500px] flex flex-col ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          <div
            className={`px-2 pb-2 border-b flex items-center justify-between mb-2 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}
          >
            <span
              className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Switch Active Agent Mid-Chat
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{AGENTS.length} plugins</span>
          </div>

          {/* Search agents */}
          <div className="px-1 mb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search agent plugins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border focus:outline-none focus:border-blue-500 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950 border-slate-700 text-slate-200 placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredAgents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    onSelectAgent(agent);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 ${
                    isSelected
                      ? isLight
                        ? 'bg-blue-50 border border-blue-300 text-blue-900'
                        : 'bg-blue-600/20 border border-blue-500/40 text-white'
                      : isLight
                      ? 'hover:bg-slate-100 border border-transparent text-slate-700'
                      : 'hover:bg-slate-800/70 border border-transparent text-slate-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 bg-gradient-to-br ${agent.gradient} text-white shadow-md`}
                  >
                    <span>{agent.badgeEmoji}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-semibold text-xs sm:text-sm flex items-center gap-1.5 ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      >
                        {agent.name}
                        {agent.enablePrintView && (
                          <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded font-mono font-medium">
                            Print
                          </span>
                        )}
                        {agent.enableMedicalLayout && (
                          <span className="text-[9px] px-1 py-0.2 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded font-mono font-medium">
                            Rx/Labs
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                    </div>
                    <p
                      className={`text-[11px] line-clamp-1 mt-0.5 ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {agent.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
