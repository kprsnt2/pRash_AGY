'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Printer, X, Eye, EyeOff, Copy, Check, Download } from 'lucide-react';

interface WorksheetPrintModalProps {
  content: string;
  onClose: () => void;
}

export function WorksheetPrintModal({ content, onClose }: WorksheetPrintModalProps) {
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [copied, setCopied] = useState(false);

  // Split content if it has answer key divider
  const answerKeyDividers = [
    '--- [ANSWER KEY] ---',
    '--- ANSWER KEY ---',
    '## Answer Key',
    '### Answer Key',
    '**Answer Key**',
  ];

  let mainContent = content;
  let answerKeyContent = '';

  for (const divider of answerKeyDividers) {
    if (content.includes(divider)) {
      const parts = content.split(divider);
      mainContent = parts[0];
      answerKeyContent = parts.slice(1).join(divider);
      break;
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">📝</span>
            <div>
              <h2 className="font-semibold text-base text-slate-100">Worksheet Print Preview</h2>
              <p className="text-xs text-slate-400">Ready for school, home study, or PDF export</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Answer Key */}
            {answerKeyContent && (
              <button
                type="button"
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                {showAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showAnswerKey ? 'Hide Answer Key' : 'Show Answer Key'}
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Worksheet Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-900 worksheet-printable-area">
          {/* Printable Student Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex flex-wrap items-center justify-between text-sm font-semibold gap-4 text-slate-800 mb-3">
              <div>
                Name: <span className="inline-block border-b border-dotted border-slate-800 w-48 sm:w-64 ml-1" />
              </div>
              <div>
                Date: <span className="inline-block border-b border-dotted border-slate-800 w-28 sm:w-36 ml-1" />
              </div>
              <div>
                Score: <span className="inline-block border-b border-dotted border-slate-800 w-20 ml-1" />
              </div>
            </div>
          </div>

          {/* Main Worksheet Body */}
          <div className="prose prose-slate max-w-none text-slate-900 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {mainContent}
            </ReactMarkdown>

            {/* Answer Key on Separate Page if print */}
            {answerKeyContent && showAnswerKey && (
              <div className="worksheet-page-break mt-12 pt-8 border-t-2 border-dashed border-slate-400">
                <div className="text-center font-bold text-lg text-slate-700 uppercase tracking-widest mb-4">
                  --- Teacher / Parent Answer Key ---
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
