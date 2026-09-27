'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AgentConfig, Attachment, ChatSession, Message, ProviderType, UserApiKeys } from '@/types/chat';
import { AGENTS, getAgentById } from '@/lib/agents';
import {
  saveSession,
  getSession,
  deleteSession,
  getAllSessions,
  saveUserSettings,
  getUserSettings,
  saveActiveSessionId,
  getActiveSessionId,
} from '@/lib/storage';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { SettingsModal } from '@/components/SettingsModal';
import { WorksheetPrintModal } from '@/components/WorksheetPrintModal';

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig>(AGENTS[0]);
  const [forcedProvider, setForcedProvider] = useState<'auto' | ProviderType>('auto');
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [userSettings, setUserSettings] = useState<UserApiKeys>({});

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [worksheetPrintContent, setWorksheetPrintContent] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Initial load from storage
  useEffect(() => {
    async function init() {
      const settings = getUserSettings();
      setUserSettings(settings);
      if (settings.forcedProvider) setForcedProvider(settings.forcedProvider);
      if (settings.privacyMode) setPrivacyMode(settings.privacyMode);

      const loadedSessions = await getAllSessions();
      setSessions(loadedSessions);

      const savedActiveId = getActiveSessionId();
      if (savedActiveId && loadedSessions.some((s) => s.id === savedActiveId)) {
        setActiveSessionId(savedActiveId);
        const active = await getSession(savedActiveId);
        if (active) {
          setMessages(active.messages);
          setSelectedAgent(getAgentById(active.agentId));
          if (active.isPrivacyMode) setPrivacyMode(true);
        }
      }
    }
    init();
  }, []);

  // Save session when messages change (unless temporary / privacy mode)
  const persistSession = async (updatedMessages: Message[], title?: string) => {
    if (privacyMode) return; // Zero-training privacy mode: not saved to IndexedDB

    let sessionId = activeSessionId;
    let currentTitle = title;

    if (!sessionId) {
      sessionId = `session_${Date.now()}`;
      setActiveSessionId(sessionId);
      saveActiveSessionId(sessionId);
    }

    if (!currentTitle) {
      const existing = sessions.find((s) => s.id === sessionId);
      currentTitle =
        existing?.title ||
        (updatedMessages[0]?.content
          ? updatedMessages[0].content.slice(0, 36) + (updatedMessages[0].content.length > 36 ? '...' : '')
          : 'New Conversation');
    }

    const session: ChatSession = {
      id: sessionId,
      title: currentTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      agentId: selectedAgent.id,
      messages: updatedMessages,
      isPrivacyMode: privacyMode,
    };

    await saveSession(session);

    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      return [session, ...filtered];
    });
  };

  const handleSelectSession = async (id: string) => {
    if (isLoading) {
      abortControllerRef.current?.abort();
      setIsLoading(false);
    }
    setActiveSessionId(id);
    saveActiveSessionId(id);
    const session = await getSession(id);
    if (session) {
      setMessages(session.messages);
      setSelectedAgent(getAgentById(session.agentId));
      if (session.isPrivacyMode) {
        setPrivacyMode(true);
      }
    }
    setError(null);
  };

  const handleNewChat = () => {
    if (isLoading) {
      abortControllerRef.current?.abort();
      setIsLoading(false);
    }
    setActiveSessionId(null);
    saveActiveSessionId(null);
    setMessages([]);
    setError(null);
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      handleNewChat();
    }
  };

  const handleTogglePrivacy = () => {
    const nextVal = !privacyMode;
    setPrivacyMode(nextVal);
    const updatedSettings = { ...userSettings, privacyMode: nextVal };
    setUserSettings(updatedSettings);
    saveUserSettings(updatedSettings);
  };

  const handleSelectProvider = (prov: 'auto' | ProviderType) => {
    setForcedProvider(prov);
    const updatedSettings = { ...userSettings, forcedProvider: prov };
    setUserSettings(updatedSettings);
    saveUserSettings(updatedSettings);
  };

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    setError(null);
    const userMessage: Message = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text,
      agentId: selectedAgent.id,
      attachments,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Placeholder for streaming assistant message
    const assistantMessageId = `msg_${Date.now()}_a`;
    const placeholderAssistant: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      agentId: selectedAgent.id,
      timestamp: Date.now(),
    };

    setMessages([...newMessages, placeholderAssistant]);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages,
          agentSystemPrompt: selectedAgent.systemPrompt,
          attachments,
          privacyMode,
          forcedProvider,
          customKeys: {
            openaiApiKey: userSettings.openaiApiKey,
            openaiModel: userSettings.openaiModel,
            geminiApiKey: userSettings.geminiApiKey,
            geminiModel: userSettings.geminiModel,
            nvidiaApiKey: userSettings.nvidiaApiKey,
            nvidiaModel: userSettings.nvidiaModel,
            groqApiKey: userSettings.groqApiKey,
            groqModel: userSettings.groqModel,
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${response.status}`);
      }

      // Read meta headers
      const providerUsed = (response.headers.get('X-Prash-Provider') || 'gemini') as ProviderType;
      const modelUsed = response.headers.get('X-Prash-Model') || '';
      const rawFailover = response.headers.get('X-Prash-Failover-Chain');
      let failoverChain = [];
      if (rawFailover) {
        try {
          failoverChain = JSON.parse(decodeURIComponent(rawFailover));
        } catch {}
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: accumulated,
                    providerUsed,
                    modelUsed,
                    failoverChain,
                  }
                : msg
            )
          );
        }
      }

      const finalMessages = newMessages.concat({
        id: assistantMessageId,
        role: 'assistant',
        content: accumulated,
        agentId: selectedAgent.id,
        providerUsed,
        modelUsed,
        failoverChain,
        timestamp: Date.now(),
      });

      setMessages(finalMessages);
      await persistSession(finalMessages);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User aborted intentionally
        return;
      }
      const errMsg = err instanceof Error ? err.message : 'Unknown communication error';
      setError(errMsg);
      // Remove empty assistant placeholder if failed
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId || m.content.length > 0));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleRetryLast = () => {
    if (messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content, lastUserMsg.attachments || []);
    }
  };

  const refreshSessionsList = async () => {
    const list = await getAllSessions();
    setSessions(list);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        privacyMode={privacyMode}
        onTogglePrivacy={handleTogglePrivacy}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <ChatArea
        messages={messages}
        isLoading={isLoading}
        selectedAgent={selectedAgent}
        onSelectAgent={setSelectedAgent}
        onSendMessage={handleSendMessage}
        onStop={handleStop}
        onRetryLast={handleRetryLast}
        onOpenMobileSidebar={() => setIsSidebarOpen(true)}
        forcedProvider={forcedProvider}
        privacyMode={privacyMode}
        onSelectProvider={handleSelectProvider}
        onTogglePrivacy={handleTogglePrivacy}
        onOpenWorksheetPrint={(content) => setWorksheetPrintContent(content)}
        customOpenAiModel={userSettings.openaiModel}
        customGeminiModel={userSettings.geminiModel}
        error={error}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={userSettings}
          onSaveSettings={(newSettings) => {
            setUserSettings(newSettings);
            saveUserSettings(newSettings);
          }}
          onClose={() => setIsSettingsOpen(false)}
          onDataChanged={refreshSessionsList}
        />
      )}

      {/* Worksheet Print Preview Modal */}
      {worksheetPrintContent && (
        <WorksheetPrintModal
          content={worksheetPrintContent}
          onClose={() => setWorksheetPrintContent(null)}
        />
      )}
    </div>
  );
}
