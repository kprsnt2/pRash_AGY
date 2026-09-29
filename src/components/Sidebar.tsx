'use client';

import React, { useState, useRef } from 'react';
import { ChatSession } from '@/types/chat';
import { getAgentById } from '@/lib/agents';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Settings,
  ShieldCheck,
  X,
  Download,
  Upload,
  Sun,
  Moon,
  Lock,
} from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onExportSession: (session: ChatSession) => void;
  onImportFile: (file: File) => void;
  onOpenSettings: () => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLockApp: () => void;
  isAuthEnabled?: boolean;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onExportSession,
  onImportFile,
  onOpenSettings,
  privacyMode,
  onTogglePrivacy,
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  onLockApp,
  isAuthEnabled = false,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const filteredSessions = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Hidden file input for importing chats */}
      <input
        type="file"
        ref={importInputRef}
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          theme === 'light'
            ? 'bg-white border-r border-slate-200 text-slate-800'
            : 'bg-slate-950 border-r border-slate-800/80 text-slate-100'
        }`}
      >
        {/* Top Header */}
        <div
          className={`p-3.5 border-b flex items-center justify-between ${
            theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md font-bold text-sm">
              pR
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                pRash Hub
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-500 font-mono">
                  v2.0
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">All-in-One Multi-Agent AI</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'light'
                  ? 'hover:bg-slate-100 text-slate-600'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Mobile close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Buttons: New Chat & Import */}
        <div className="p-3 space-y-2">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          {/* Quick Import Chat button */}
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs border font-medium transition-all ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Import a previously saved JSON chat session and resume"
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Import Chat & Resume</span>
          </button>

          {/* Privacy Mode Quick Toggle Bar */}
          <button
            type="button"
            onClick={onTogglePrivacy}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs border transition-all ${
              privacyMode
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-600'
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
                  {privacyMode ? 'Gemini Paid • Zero-Training' : 'Auto Failover Cascade'}
                </p>
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                privacyMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'
              }`}
            />
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border focus:outline-none focus:border-blue-500 ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'
                  : 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500'
              }`}
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
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
                      ? theme === 'light'
                        ? 'bg-blue-50 border border-blue-200 text-blue-900 font-semibold shadow-sm'
                        : 'bg-slate-800/90 text-white font-medium shadow-sm border border-slate-700'
                      : theme === 'light'
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
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

                  {/* Actions: Export single chat & Delete */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportSession(session);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shrink-0"
                      title="Export this chat as JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shrink-0"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Bar: Settings & Lock App */}
        <div
          className={`p-3 border-t space-y-1.5 ${
            theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
          }`}
        >
          <button
            type="button"
            onClick={onOpenSettings}
            className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs transition-colors w-full ${
              theme === 'light'
                ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="font-medium">Settings & API Keys</span>
          </button>

          {isAuthEnabled && (
            <button
              type="button"
              onClick={onLockApp}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs transition-colors w-full text-rose-500 hover:bg-rose-500/10`}
            >
              <Lock className="w-4 h-4 text-rose-500" />
              <span className="font-medium">Lock Application</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
