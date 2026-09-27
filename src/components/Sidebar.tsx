'use client';

import React, { useState } from 'react';
import { ChatSession } from '@/types/chat';
import { getAgentById } from '@/lib/agents';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Settings,
  ShieldCheck,
  ChevronLeft,
  X,
  FileCheck,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenSettings,
  privacyMode,
  onTogglePrivacy,
  isOpen,
  onClose,
}: SidebarProps) {
  const [search, setSearch] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md font-bold text-sm">
              pR
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-100 tracking-tight">pRash Hub</h1>
              <p className="text-[10px] text-slate-400">All-in-One Multi-Agent</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: New Chat */}
        <div className="p-3 space-y-2">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          {/* Privacy Mode Quick Toggle Bar */}
          <button
            type="button"
            onClick={onTogglePrivacy}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs border transition-all ${
              privacyMode
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${privacyMode ? 'text-emerald-400' : 'text-slate-400'}`} />
              <div className="text-left">
                <p className="font-semibold text-[11px] leading-tight">
                  {privacyMode ? 'Privacy Mode Active' : 'Standard Mode'}
                </p>
                <p className="text-[9px] text-slate-400">
                  {privacyMode ? 'Gemini Paid • Zero Training' : 'Cascades OpenAI ➜ Gemini'}
                </p>
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                privacyMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              {search ? 'No matching chats found' : 'No saved conversations yet'}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const agent = getAgentById(session.agentId);

              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800/90 text-white font-medium shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <span className="text-sm shrink-0">{agent.badgeEmoji}</span>
                    <span className="truncate">{session.title || 'New Conversation'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all shrink-0"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Bar: Settings */}
        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition-colors w-full"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="font-medium">Settings & API Keys</span>
          </button>
        </div>
      </aside>
    </>
  );
}
