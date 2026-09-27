import { get, set, del, keys } from 'idb-keyval';
import { ChatSession, UserApiKeys } from '@/types/chat';

const SESSIONS_STORE_PREFIX = 'prash_session_';
const SETTINGS_KEY = 'prash_user_settings_v1';
const ACTIVE_SESSION_KEY = 'prash_active_session_id';

export async function saveSession(session: ChatSession): Promise<void> {
  // If session is temporary or in privacy mode, DO NOT save to IndexedDB!
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
    const sessionKeys = allKeys.filter((k) =>
      typeof k === 'string' && k.startsWith(SESSIONS_STORE_PREFIX)
    ) as string[];

    const sessions: ChatSession[] = [];
    for (const key of sessionKeys) {
      const session = await get<ChatSession>(key);
      if (session) {
        sessions.push(session);
      }
    }

    // Sort descending by updatedAt
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

export async function exportAllData(): Promise<string> {
  const sessions = await getAllSessions();
  const settings = getUserSettings();
  const exportPayload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    sessions,
    settings: {
      openaiModel: settings.openaiModel,
      geminiModel: settings.geminiModel,
      nvidiaModel: settings.nvidiaModel,
      groqModel: settings.groqModel,
      forcedProvider: settings.forcedProvider,
    },
  };
  return JSON.stringify(exportPayload, null, 2);
}

export async function importData(jsonContent: string): Promise<number> {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed || !Array.isArray(parsed.sessions)) {
      throw new Error('Invalid backup file format');
    }
    let count = 0;
    for (const session of parsed.sessions) {
      if (session.id && session.messages) {
        await saveSession(session);
        count++;
      }
    }
    return count;
  } catch (err) {
    console.error('Failed to import backup:', err);
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
