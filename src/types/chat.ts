export type AttachmentType = 'image' | 'pdf' | 'document' | 'code' | 'other';

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  mimeType: string;
  size: number;
  data: string; // Base64 data or text data URL
  extractedText?: string;
}

export type ProviderType = 'openai' | 'gemini' | 'nvidia' | 'groq';

export interface FailoverAttempt {
  provider: ProviderType;
  model: string;
  status: 'attempted' | 'failed' | 'success';
  error?: string;
  latencyMs?: number;
}

export interface MessageMetadata {
  isWorksheet?: boolean;
  worksheetTitle?: string;
  grade?: string;
  hasAnswerKey?: boolean;
  isDoctorReport?: boolean;
  prescriptionsFound?: string[];
  abnormalLabsFound?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string;
  providerUsed?: ProviderType;
  modelUsed?: string;
  failoverChain?: FailoverAttempt[];
  attachments?: Attachment[];
  timestamp: number;
  latencyMs?: number;
  tokenCount?: number;
  isError?: boolean;
  metadata?: MessageMetadata;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  agentId: string;
  messages: Message[];
  isTemporary?: boolean;
  isPrivacyMode?: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
  badgeEmoji: string;
  gradient: string;
  accentColor: string;
  systemPrompt: string;
  starterPrompts: { label: string; prompt: string; icon?: string }[];
  attachmentTips?: string;
  enablePrintView?: boolean;
  enableMedicalLayout?: boolean;
}

export interface UserApiKeys {
  openaiApiKey?: string;
  openaiModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  nvidiaApiKey?: string;
  nvidiaModel?: string;
  groqApiKey?: string;
  groqModel?: string;
  forcedProvider?: 'auto' | ProviderType;
  selectedModel?: string; // specific selected model override
  privacyMode?: boolean;
}
