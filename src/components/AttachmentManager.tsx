'use client';

import React, { useState } from 'react';
import { Attachment } from '@/types/chat';
import { formatFileSize } from '@/lib/file-utils';
import { X, FileText, Image as ImageIcon, FileCode, Maximize2, Trash2, Eye } from 'lucide-react';

interface AttachmentManagerProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export function AttachmentManager({ attachments, onRemove, onClearAll }: AttachmentManagerProps) {
  const [activePreview, setActivePreview] = useState<Attachment | null>(null);

  if (attachments.length === 0) return null;

  return (
    <>
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 mb-2 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {attachments.length} {attachments.length === 1 ? 'Attachment' : 'Attachments'} ready for analysis
          </span>
          {attachments.length > 1 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Scrollable grid of attachments */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg p-1.5 pr-2.5 shrink-0 max-w-[200px] transition-all"
            >
              {/* Thumbnail or File Icon */}
              {att.type === 'image' ? (
                <div
                  className="w-9 h-9 rounded bg-slate-950 overflow-hidden relative cursor-pointer shrink-0 border border-slate-700"
                  onClick={() => setActivePreview(att)}
                  title="Click to zoom image"
                >
                  <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              ) : att.type === 'code' ? (
                <div className="w-9 h-9 rounded bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center text-indigo-400 shrink-0">
                  <FileCode className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded bg-sky-950/60 border border-sky-700/50 flex items-center justify-center text-sky-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
              )}

              {/* Name and size */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 truncate">{att.name}</p>
                <p className="text-[10px] text-slate-400">{formatFileSize(att.size)}</p>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => onRemove(att.id)}
                className="w-5 h-5 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors shrink-0"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Attachment Full Preview Modal */}
      {activePreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-sm text-slate-200 truncate max-w-md">{activePreview.name}</span>
                <span className="text-xs text-slate-400">({formatFileSize(activePreview.size)})</span>
              </div>
              <button
                onClick={() => setActivePreview(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-slate-950/50">
              {activePreview.type === 'image' ? (
                <img
                  src={activePreview.data}
                  alt={activePreview.name}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-[60vh] overflow-y-auto w-full p-4 bg-slate-900 rounded-lg">
                  {activePreview.extractedText || 'Preview not available for this file type'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
