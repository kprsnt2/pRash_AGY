'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AGENTS } from '@/lib/agents';
import { AgentConfig } from '@/types/chat';
import { AgentIcon } from './AgentIcon';
import { ChevronDown, Check, Sparkles } from 'lucide-react';

interface AgentSelectorProps {
  selectedAgentId: string;
  onSelectAgent: (agent: AgentConfig) => void;
  compact?: boolean;
}

export function AgentSelector({ selectedAgentId, onSelectAgent, compact = false }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl transition-all border font-medium text-left ${
          compact
            ? 'px-2.5 py-1.5 text-xs bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 shadow-sm'
            : 'px-3 py-2 text-sm bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-100 shadow-sm'
        }`}
        title="Switch Agent Plugin"
      >
        <span className="text-base leading-none">{currentAgent.badgeEmoji}</span>
        <span className="font-semibold truncate max-w-[140px]">{currentAgent.name}</span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">Agent</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[480px] overflow-y-auto">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Select Specialized Agent
            </span>
            <span className="text-[11px] text-slate-500 font-mono">{AGENTS.length} agents ready</span>
          </div>

          <div className="space-y-1">
            {AGENTS.map((agent) => {
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
                      ? 'bg-blue-600/15 border border-blue-500/30 text-white'
                      : 'hover:bg-slate-800/70 border border-transparent text-slate-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 bg-gradient-to-br ${agent.gradient} text-white shadow-md`}
                  >
                    <span>{agent.badgeEmoji}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-100 flex items-center gap-1.5">
                        {agent.name}
                        {agent.enablePrintView && (
                          <span className="text-[10px] px-1 py-0.2 bg-emerald-500/20 text-emerald-400 rounded">Print</span>
                        )}
                        {agent.enableMedicalLayout && (
                          <span className="text-[10px] px-1 py-0.2 bg-rose-500/20 text-rose-400 rounded">Rx/Labs</span>
                        )}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{agent.tagline}</p>
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
