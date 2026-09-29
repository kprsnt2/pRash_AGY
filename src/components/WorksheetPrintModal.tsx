'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Printer, X, Eye, EyeOff, Copy, Check, FileText } from 'lucide-react';

interface WorksheetPrintModalProps {
  content: string;
  onClose: () => void;
}

/**
 * Robustly splits worksheet content into main exercises and the answer/working sheet.
 * Handles headings like "## Answer Key", "--- [ANSWER KEY & WORKING] ---",
 * "### Solutions & Answers", "### 🔑 TEACHER & PARENT ANSWER KEY", etc.
 */
export function splitWorksheetContent(content: string): {
  mainContent: string;
  answerKeyContent: string;
  hasAnswerKey: boolean;
} {
  if (!content) {
    return { mainContent: '', answerKeyContent: '', hasAnswerKey: false };
  }

  // Regex matching various divider styles case-insensitively, including brackets like [ANSWER KEY & WORKING]
  const dividerRegex = /(?:^|\n)\s*(?:[-*_]{3,}\s*)?(?:#{1,6}\s*)?(?:\*\*|__)?\s*\[?\s*(?:🔑\s*)?(?:teacher\s*(?:&|and)\s*parent\s*)?(?:answer\s*key|answers?(?:\s*(?:&|and)\s*(?:working|solutions|explanations))?|solutions?(?:\s*(?:&|and)\s*working)?|answer\s*sheet)[^\n\r]*?(?:\n|$)/i;

  const match = content.match(dividerRegex);
  if (match && match.index !== undefined) {
    const mainContent = content.slice(0, match.index).trim();
    const answerKeyContent = content.slice(match.index + match[0].length).trim();
    if (mainContent.trim().length > 0 && answerKeyContent.trim().length > 0) {
      return {
        mainContent,
        answerKeyContent,
        hasAnswerKey: true,
      };
    }
  }

  // Literal dividers fallback
  const literalDividers = [
    '--- [ANSWER KEY & WORKING] ---',
    '--- [ANSWER KEY] ---',
    '--- [ANSWERS & WORKING] ---',
    '--- [ANSWERS] ---',
    '--- ANSWER KEY & WORKING ---',
    '--- ANSWER KEY ---',
    '--- ANSWERS & WORKING ---',
    '--- ANSWERS ---',
    '## Answer Key',
    '### Answer Key',
    '#### Answer Key',
    '**Answer Key**',
    '### 🔑 TEACHER & PARENT ANSWER KEY',
  ];

  for (const div of literalDividers) {
    const lower = content.toLowerCase();
    const target = div.toLowerCase();
    const idx = lower.indexOf(target);
    if (idx !== -1) {
      const main = content.slice(0, idx).trim();
      const ans = content.slice(idx + div.length).trim();
      if (main.trim().length > 0 && ans.trim().length > 0) {
        return {
          mainContent: main,
          answerKeyContent: ans,
          hasAnswerKey: true,
        };
      }
    }
  }

  return {
    mainContent: content,
    answerKeyContent: '',
    hasAnswerKey: false,
  };
}

export function WorksheetPrintModal({ content, onClose }: WorksheetPrintModalProps) {
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [copied, setCopied] = useState(false);

  const { mainContent, answerKeyContent, hasAnswerKey } = splitWorksheetContent(content);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    const textToCopy = showAnswerKey || !hasAnswerKey ? content : mainContent;
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto worksheet-modal-backdrop">
      {/* Container */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden worksheet-modal-container">
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/90 gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-lg">📝</span>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                Worksheet Print Studio & PDF Export
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Print Ready
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Formatted educational worksheet with student header and optional answer sheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Toggle Answer Key / Solutions */}
            {hasAnswerKey && (
              <button
                type="button"
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border font-medium transition-all ${
                  showAnswerKey
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title={showAnswerKey ? 'Hide Answer Sheet & Working from student printout' : 'Include Answer Sheet & Working in printout'}
              >
                {showAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showAnswerKey ? 'Hide Answer Sheet' : 'Show Answer Sheet'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Copy markdown text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Worksheet Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-12 bg-white text-slate-900 worksheet-printable-area font-sans">
          {/* Student Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 student-worksheet-header">
            <div className="flex flex-wrap items-center justify-between text-sm font-semibold gap-4 text-slate-900 mb-2">
              <div>
                Name: <span className="inline-block border-b-2 border-dotted border-slate-800 w-44 sm:w-64 ml-1" />
              </div>
              <div>
                Date: <span className="inline-block border-b-2 border-dotted border-slate-800 w-28 sm:w-36 ml-1" />
              </div>
              <div>
                Score: <span className="inline-block border-b-2 border-dotted border-slate-800 w-20 ml-1" />
              </div>
            </div>
          </div>

          {/* Worksheet Exercises Content */}
          <div className="prose prose-slate max-w-none text-slate-900 text-sm sm:text-base leading-relaxed worksheet-content">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {mainContent}
            </ReactMarkdown>

            {/* Teacher / Parent Answer Key & Working (Toggleable and separated by clean page break) */}
            {hasAnswerKey && showAnswerKey && (
              <div className="worksheet-page-break mt-12 pt-8 border-t-2 border-dashed border-slate-400">
                <div className="text-center font-bold text-sm sm:text-base text-slate-800 uppercase tracking-widest mb-6 py-2 bg-slate-100 border border-slate-300 rounded-lg">
                  --- Teacher / Parent Solutions, Working & Answer Key ---
                </div>
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {answerKeyContent}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
