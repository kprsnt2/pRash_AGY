import { get, set, del, keys } from 'idb-keyval';
import { ChatSession, UserApiKeys, Message } from '@/types/chat';
import { getAgentById } from './agents';

const SESSIONS_STORE_PREFIX = 'prash_session_';
const SETTINGS_KEY = 'prash_user_settings_v1';
const ACTIVE_SESSION_KEY = 'prash_active_session_id';
const THEME_KEY = 'prash_theme';

export async function saveSession(session: ChatSession): Promise<void> {
  if (session.isTemporary || session.isPrivacyMode) {
    return;
  }
  try {
    await set(`${SESSIONS_STORE_PREFIX}${session.id}`, session);
  } catch (err) {
    console.error('Failed to save session to IndexedDB:', err);
  }
}

export async function getSession(id: string): Promise<ChatSession | null> {
  try {
    const data = await get<ChatSession>(`${SESSIONS_STORE_PREFIX}${id}`);
    return data || null;
  } catch (err) {
    console.error('Failed to get session from IndexedDB:', err);
    return null;
  }
}

export async function deleteSession(id: string): Promise<void> {
  try {
    await del(`${SESSIONS_STORE_PREFIX}${id}`);
  } catch (err) {
    console.error('Failed to delete session from IndexedDB:', err);
  }
}

export async function getAllSessions(): Promise<ChatSession[]> {
  try {
    const allKeys = await keys();
    const sessionKeys = allKeys.filter(
      (k) => typeof k === 'string' && k.startsWith(SESSIONS_STORE_PREFIX)
    ) as string[];

    const sessions: ChatSession[] = [];
    for (const key of sessionKeys) {
      const session = await get<ChatSession>(key);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.error('Failed to load sessions from IndexedDB:', err);
    return [];
  }
}

export function saveUserSettings(settings: UserApiKeys): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save user settings:', err);
  }
}

export function getUserSettings(): UserApiKeys {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to get user settings:', err);
    return {};
  }
}

export function saveActiveSessionId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (!id) {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } else {
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  }
}

export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function getStoredTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const val = localStorage.getItem(THEME_KEY);
  return val === 'light' ? 'light' : 'dark';
}

export function setStoredTheme(theme: 'dark' | 'light'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
}

/** Export a single session to JSON for downloading/sharing */
export function exportSingleChat(session: ChatSession): string {
  const payload = {
    version: '1.0',
    type: 'prash_single_session',
    exportDate: new Date().toISOString(),
    session,
  };
  return JSON.stringify(payload, null, 2);
}

/** Export all sessions & non-secret settings */
export async function exportAllData(): Promise<string> {
  const sessions = await getAllSessions();
  const settings = getUserSettings();
  const exportPayload = {
    version: '1.0',
    type: 'prash_all_sessions',
    exportDate: new Date().toISOString(),
    sessions,
    settings: {
      openaiModel: settings.openaiModel,
      geminiModel: settings.geminiModel,
      nvidiaModel: settings.nvidiaModel,
      groqModel: settings.groqModel,
      forcedProvider: settings.forcedProvider,
      selectedModel: settings.selectedModel,
    },
  };
  return JSON.stringify(exportPayload, null, 2);
}

export interface ImportResult {
  importedCount: number;
  primarySessionId: string | null;
  primarySession?: ChatSession;
}

/**
 * Sanitizes message content to remove leaked raw SSE chunk JSON strings
 * (e.g. from buggy providers or older chat logs from pRash_OMP).
 */
export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  const trimmed = content.trim();

  // If the content is literally an escaped or unescaped SSE chunk JSON object
  if (
    (trimmed.startsWith('{"id":"chatcmpl-') ||
      trimmed.startsWith('{"object":"chat.completion') ||
      trimmed.startsWith('data: {"id":"chatcmpl-')) &&
    trimmed.endsWith('}')
  ) {
    try {
      const cleanJson = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed;
      const parsed = JSON.parse(cleanJson);
      const extracted =
        parsed.choices?.[0]?.delta?.content ??
        parsed.choices?.[0]?.delta?.text ??
        parsed.choices?.[0]?.text;
      if (typeof extracted === 'string') {
        return extracted;
      }
    } catch {
      // Fallback regex search for delta content
      const match = /"content"\s*:\s*"((?:\\.|[^"\\])*)"/.exec(trimmed);
      if (match && match[1]) {
        try {
          return JSON.parse(`"${match[1]}"`);
        } catch {}
      }
    }
  }
  return content;
}

/**
 * Universal importer: handles single-session exports, pRash multi-session backups,
 * array of sessions, array of messages, and pRash_step / AllChat BackupBundles.
 * Restores and prepares the conversation to immediately resume.
 */
export async function importChatBundle(jsonContent: string): Promise<ImportResult> {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed) throw new Error('Invalid JSON format');

    let sessionsToImport: ChatSession[] = [];

    // Case 1: Single session export wrapper ({ version, type, session: { ... } })
    if (parsed.session && Array.isArray(parsed.session.messages)) {
      sessionsToImport = [parsed.session];
    }
    // Case 2: AllChat / Step BackupBundle ({ app: 'allchat', chats: [...], messages: [...] })
    else if ((parsed.app === 'allchat' || Array.isArray(parsed.chats)) && Array.isArray(parsed.messages)) {
      const messagesByChat = new Map<string, any[]>();
      for (const m of parsed.messages) {
        if (!messagesByChat.has(m.chatId)) messagesByChat.set(m.chatId, []);
        messagesByChat.get(m.chatId)!.push({
          id: m.id,
          role: m.role,
          content: sanitizeMessageContent(m.content || ''),
          agentId: getAgentById(m.agentId || 'general').id,
          timestamp: m.createdAt || Date.now(),
          providerUsed: m.provider,
          modelUsed: m.model,
          attachments: (m.attachments || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            type: a.kind || 'document',
            mimeType: a.mime || 'application/octet-stream',
            size: a.size || 0,
            data: a.dataUrl || '',
            extractedText: a.text,
          })),
        });
      }

      for (const c of parsed.chats) {
        sessionsToImport.push({
          id: c.id,
          title: c.title || 'Imported Chat',
          agentId: getAgentById(c.agentId || 'general').id,
          createdAt: c.createdAt || Date.now(),
          updatedAt: c.updatedAt || Date.now(),
          messages: messagesByChat.get(c.id) || [],
          isPrivacyMode: !!c.privacy,
        });
      }
    }
    // Case 3: Prash multi-session bundle ({ sessions: [...] })
    else if (Array.isArray(parsed.sessions)) {
      sessionsToImport = parsed.sessions.filter(
        (s: any) => s && Array.isArray(s.messages)
      );
    }
    // Case 4: Array of sessions directly ([ { messages: [...] }, ... ])
    else if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0]?.messages)) {
      sessionsToImport = parsed.map((s: any, idx: number) => ({
        id: s.id || `imported_${Date.now()}_${idx}`,
        title: s.title || s.messages[0]?.content?.slice(0, 30) || `Imported Conversation ${idx + 1}`,
        createdAt: s.createdAt || Date.now(),
        updatedAt: s.updatedAt || Date.now(),
        agentId: getAgentById(s.agentId || 'general').id,
        messages: s.messages,
        isPrivacyMode: !!s.isPrivacyMode,
      }));
    }
    // Case 5: Array of messages directly ([ { role: 'user', content: '...' }, ... ])
    else if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0]?.role || parsed[0]?.content)) {
      const firstUserContent = parsed.find((m) => m.role === 'user')?.content || '';
      const sessionObj: ChatSession = {
        id: `imported_${Date.now()}`,
        title: firstUserContent ? firstUserContent.slice(0, 32) : 'Imported Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        agentId: getAgentById('general').id,
        messages: parsed.map((m: any, idx: number) => ({
          id: m.id || `msg_imp_${idx}_${Date.now()}`,
          role: m.role || 'user',
          content: sanitizeMessageContent(m.content || ''),
          timestamp: m.timestamp || Date.now(),
          agentId: m.agentId,
          providerUsed: m.providerUsed,
          modelUsed: m.modelUsed,
        })),
      };
      sessionsToImport = [sessionObj];
    }
    // Case 6: Direct ChatSession object ({ id, title, messages: [...] })
    else if (Array.isArray(parsed.messages)) {
      const sessionObj: ChatSession = {
        id: parsed.id || `imported_${Date.now()}`,
        title: parsed.title || parsed.messages[0]?.content?.slice(0, 30) || 'Imported Conversation',
        createdAt: parsed.createdAt || Date.now(),
        updatedAt: parsed.updatedAt || Date.now(),
        agentId: getAgentById(parsed.agentId || 'general').id,
        messages: parsed.messages,
        isPrivacyMode: !!parsed.isPrivacyMode,
      };
      sessionsToImport = [sessionObj];
    } else {
      throw new Error('Unrecognized backup format. Please provide a valid JSON chat export.');
    }

    if (sessionsToImport.length === 0) {
      throw new Error('No valid conversations found in the uploaded file.');
    }

    let count = 0;
    let firstSession: ChatSession | null = null;

    for (const session of sessionsToImport) {
      const sanitizedMessages: Message[] = (session.messages || []).map((m: any, idx: number) => ({
        id: m.id || `msg_${Date.now()}_${idx}`,
        role: m.role || 'user',
        content: sanitizeMessageContent(m.content || ''),
        agentId: m.agentId ? getAgentById(m.agentId).id : getAgentById(session.agentId).id,
        timestamp: m.timestamp || Date.now(),
        providerUsed: m.providerUsed,
        modelUsed: m.modelUsed,
        failoverChain: m.failoverChain,
        attachments: m.attachments,
        latencyMs: m.latencyMs,
        tokenCount: m.tokenCount,
      }));

      const existing = session.id ? await getSession(session.id) : null;
      const targetSessionId = existing || !session.id
        ? `imported_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        : session.id;

      const sessionToSave: ChatSession = {
        ...session,
        id: targetSessionId,
        title: session.title || sanitizedMessages[0]?.content?.slice(0, 30) || 'Imported Conversation',
        agentId: getAgentById(session.agentId || 'general').id,
        messages: sanitizedMessages,
        updatedAt: Date.now(),
      };

      await saveSession(sessionToSave);
      if (!firstSession) {
        firstSession = sessionToSave;
      }
      count++;
    }

    return {
      importedCount: count,
      primarySessionId: firstSession ? firstSession.id : null,
      primarySession: firstSession || undefined,
    };
  } catch (err) {
    console.error('Failed to import chat bundle:', err);
    throw err;
  }
}

export async function clearAllLocalData(): Promise<void> {
  try {
    const allKeys = await keys();
    for (const key of allKeys) {
      if (typeof key === 'string' && key.startsWith(SESSIONS_STORE_PREFIX)) {
        await del(key);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch (err) {
    console.error('Failed to clear local data:', err);
  }
}
