'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Attachment, AgentConfig } from '@/types/chat';
import { processFileToAttachment } from '@/lib/file-utils';
import { AttachmentManager } from './AttachmentManager';
import { AgentSelector } from './AgentSelector';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';
import {
  Paperclip,
  Send,
  Square,
  Sparkles,
  Mic,
  MicOff,
  Image as ImageIcon,
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onStop: () => void;
  selectedAgentId: string;
  onSelectAgent: (agent: AgentConfig) => void;
  privacyMode: boolean;
  theme?: 'dark' | 'light';
}

export function ChatInput({
  onSendMessage,
  isLoading,
  onStop,
  selectedAgentId,
  onSelectAgent,
  privacyMode,
  theme = 'dark',
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice speech recognition
  const speech = useSpeechRecognition({
    onFinal: (transcript) => {
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    },
    onInterim: (interim) => {
      // Live visual hint could be added
    },
    onError: (err) => {
      console.warn('Speech error:', err);
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const att = await processFileToAttachment(files[i]);
        newAttachments.push(att);
      } catch (err) {
        console.error('Failed to process file:', files[i].name, err);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      const newAttachments: Attachment[] = [];
      for (const file of files) {
        try {
          const att = await processFileToAttachment(file);
          newAttachments.push(att);
        } catch (err) {
          console.error('Failed to process pasted file:', err);
        }
      }
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  const handleSubmit = () => {
    if (isLoading) {
      onStop();
      return;
    }
    if (speech.listening) {
      speech.stop();
    }
    if (!text.trim() && attachments.length === 0) return;

    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-3xl border transition-all shadow-lg ${
        isDragging
          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-400'
          : theme === 'light'
          ? 'border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50'
          : 'border-slate-700/80 bg-slate-900/90 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/50'
      }`}
    >
      {/* Dragging hint */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-600/15 backdrop-blur-sm z-30 rounded-3xl flex items-center justify-center border-2 border-dashed border-blue-400 pointer-events-none">
          <span className="font-semibold text-sm text-blue-400 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 animate-bounce" />
            Drop images, PDFs, or code files here
          </span>
        </div>
      )}

      {/* Attachment Chips Bar */}
      <AttachmentManager
        attachments={attachments}
        onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
        onClearAll={() => setAttachments([])}
      />

      {/* Top mini-bar for quick agent plugin selection & voice hint */}
      <div
        className={`px-3 pt-2 pb-1 flex items-center justify-between border-b ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800/70'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Active Agent:</span>
          <AgentSelector
            selectedAgentId={selectedAgentId}
            onSelectAgent={onSelectAgent}
            compact
            theme={theme}
          />
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          {speech.listening && (
            <span className="flex items-center gap-1.5 text-rose-500 font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Listening...
            </span>
          )}
          {privacyMode ? (
            <span className="text-emerald-500 font-medium">🔒 Gemini (Zero-Training)</span>
          ) : (
            <span className="hidden sm:inline">Multi-file attach enabled</span>
          )}
        </div>
      </div>

      {/* Main text area & action buttons */}
      <div className="flex items-end gap-2 p-2.5 sm:p-3">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*,.pdf,.txt,.csv,.json,.sql,.py,.md,.ts,.tsx,.js"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        {/* Attachment Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 rounded-xl transition-colors shrink-0 ${
            theme === 'light'
              ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}
          title="Attach multiple images, reports, homework, or files"
        >
          <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Voice Input (Microphone Dictation) Button */}
        {speech.supported && (
          <button
            type="button"
            onClick={speech.toggle}
            className={`p-2 rounded-xl transition-all shrink-0 ${
              speech.listening
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse'
                : theme === 'light'
                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
            }`}
            title={speech.listening ? 'Stop voice recording' : 'Dictate message with voice'}
          >
            {speech.listening ? (
              <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        )}

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            speech.listening
              ? 'Listening to your voice...'
              : attachments.length > 0
              ? 'Ask anything about the attached files (or press Enter)...'
              : 'Message or prompt (Speak, paste images, attach multiple files, or type)...'
          }
          rows={1}
          className={`flex-1 max-h-48 resize-none bg-transparent text-sm sm:text-base focus:outline-none py-1.5 px-1 leading-relaxed ${
            theme === 'light'
              ? 'text-slate-900 placeholder-slate-400'
              : 'text-slate-100 placeholder-slate-500'
          }`}
        />

        {/* Send / Stop button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isLoading && !text.trim() && attachments.length === 0}
          className={`p-2 sm:p-2.5 rounded-2xl transition-all shrink-0 ${
            isLoading
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
              : !text.trim() && attachments.length === 0
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25'
          }`}
          title={isLoading ? 'Stop generation' : 'Send message (Enter)'}
        >
          {isLoading ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
