'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Attachment, AgentConfig } from '@/types/chat';
import { processFileToAttachment } from '@/lib/file-utils';
import { AttachmentManager } from './AttachmentManager';
import { AgentSelector } from './AgentSelector';
import { Paperclip, Send, Square, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onStop: () => void;
  selectedAgentId: string;
  onSelectAgent: (agent: AgentConfig) => void;
  privacyMode: boolean;
}

export function ChatInput({
  onSendMessage,
  isLoading,
  onStop,
  selectedAgentId,
  onSelectAgent,
  privacyMode,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  // Handle file input selection
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

  // Drag and drop events
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

  // Clipboard paste support (e.g. pasting screenshots directly)
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
      className={`relative rounded-2xl border transition-all ${
        isDragging
          ? 'border-blue-400 bg-blue-950/20 shadow-lg shadow-blue-500/20 ring-2 ring-blue-400'
          : 'border-slate-700/80 bg-slate-900/90 shadow-lg focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/50'
      }`}
    >
      {/* Dragging overlay hint */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-sm z-30 rounded-2xl flex items-center justify-center border-2 border-dashed border-blue-400 pointer-events-none">
          <span className="font-semibold text-sm text-blue-300 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 animate-bounce" />
            Drop your images or documents here (Multiple files supported!)
          </span>
        </div>
      )}

      {/* Attachment Chips Bar */}
      <AttachmentManager
        attachments={attachments}
        onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
        onClearAll={() => setAttachments([])}
      />

      {/* Top mini-bar for quick agent plugin selection */}
      <div className="px-3 pt-2 pb-1 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Active Plugin:</span>
          <AgentSelector selectedAgentId={selectedAgentId} onSelectAgent={onSelectAgent} compact />
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          {privacyMode ? (
            <span className="text-emerald-400 font-medium">🔒 Gemini Paid (Private)</span>
          ) : (
            <span>Multiple attachments enabled</span>
          )}
        </div>
      </div>

      {/* Main text area */}
      <div className="flex items-end gap-2 p-2 sm:p-3">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*,.pdf,.txt,.csv,.json,.sql,.py,.md"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        {/* Attachment Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors shrink-0"
          title="Attach multiple images, reports, homework, or documents"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            attachments.length > 0
              ? 'Ask anything about the attached files (or press Enter to analyze)...'
              : 'Message or ask questions (Paste images, attach multiple files, or type here)...'
          }
          rows={1}
          className="flex-1 max-h-48 resize-none bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none py-1.5 px-1 leading-relaxed"
        />

        {/* Send / Stop button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isLoading && !text.trim() && attachments.length === 0}
          className={`p-2 sm:p-2.5 rounded-xl transition-all shrink-0 ${
            isLoading
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
              : !text.trim() && attachments.length === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25'
          }`}
          title={isLoading ? 'Stop generation' : 'Send message (Enter)'}
        >
          {isLoading ? <Square className="w-4 h-4 fill-current" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
