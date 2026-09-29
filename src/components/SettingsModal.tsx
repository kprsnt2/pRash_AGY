'use client';

import React, { useState } from 'react';
import { UserApiKeys } from '@/types/chat';
import { exportAllData, importChatBundle, clearAllLocalData } from '@/lib/storage';
import {
  X,
  Key,
  ShieldCheck,
  Download,
  Upload,
  Trash2,
  Check,
  AlertTriangle,
  Layers,
  Cpu,
  Info,
} from 'lucide-react';

interface SettingsModalProps {
  settings: UserApiKeys;
  onSaveSettings: (settings: UserApiKeys) => void;
  onClose: () => void;
  onDataChanged: () => void;
  onImportFile?: (file: File) => void;
  theme?: 'dark' | 'light';
}

export function SettingsModal({
  settings,
  onSaveSettings,
  onClose,
  onDataChanged,
  onImportFile,
  theme = 'dark',
}: SettingsModalProps) {
  const [formData, setFormData] = useState<UserApiKeys>({ ...settings });
  const [showKeys, setShowKeys] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const isLight = theme === 'light';

  const handleSave = () => {
    onSaveSettings(formData);
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleExport = async () => {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prash-chat-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export data: ' + err);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onImportFile) {
      onImportFile(file);
      onClose();
      return;
    }

    try {
      const text = await file.text();
      const result = await importChatBundle(text);
      setImportStatus(`Successfully restored ${result.importedCount} chats!`);
      onDataChanged();
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err) {
      alert('Failed to import backup file: ' + err);
    }
  };

  const handleClear = async () => {
    if (
      confirm(
        'Are you sure you want to permanently delete all chats stored on this device? This cannot be undone.'
      )
    ) {
      await clearAllLocalData();
      onDataChanged();
      alert('All local chat sessions cleared.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`border rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-500">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`font-semibold text-base ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                AI Models & Key Configuration
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Keys and model overrides stored locally in your browser
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isLight
                ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Key visibility toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Stored in client-side localStorage. Never sent to central servers.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowKeys(!showKeys)}
              className="text-xs text-blue-500 hover:underline"
            >
              {showKeys ? 'Hide Keys' : 'Reveal Keys'}
            </button>
          </div>

          {/* Provider 1: OpenAI */}
          <div
            className={`space-y-2 p-3.5 rounded-2xl border ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-800/50 border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                1. OpenAI (Default Primary)
              </label>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                gpt-5.4-mini / gpt-5.4-nano
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={formData.openaiApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-blue-500 font-mono ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500'
                  }`}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="gpt-5.4-mini"
                  value={formData.openaiModel || ''}
                  onChange={(e) => setFormData({ ...formData, openaiModel: e.target.value })}
                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-blue-500 font-mono ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Provider 2: Gemini */}
          <div
            className={`space-y-2 p-3.5 rounded-2xl border ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-800/50 border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                2. Google Gemini (Privacy Tier & Failover)
              </label>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                gemini-flash-latest
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={formData.geminiApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-blue-500 font-mono ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500'
                  }`}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="gemini-flash-latest"
                  value={formData.geminiModel || ''}
                  onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-blue-500 font-mono ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Provider 3: NVIDIA NIM */}
          <div
            className={`space-y-2 p-3.5 rounded-2xl border ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-800/50 border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-600 dark:text-green-400 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                3. NVIDIA NIM (Accelerated Open Frontier)
              </label>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                meta/llama-3.2-90b-vision-instruct
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  placeholder="nvapi-..."
                  value={formData.nvidiaApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, nvidiaApiKey: e.target.value })}
                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-blue-500 font-mono ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500'
                  }`}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="meta/llama-3.2-90b-vision-instruct"
                  value={formData.nvidiaModel || ''}
                  onChange={(e) => setFormData({ ...formData, nvidiaModel: e.target.value })}
                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-blue-500 font-mono ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Provider 4: Groq */}
          <div
            className={`space-y-2 p-3.5 rounded-2xl border ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-800/50 border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                4. Groq Cloud (Ultra-Fast 500+ tok/s)
              </label>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                meta-llama/llama-4-scout-17b-16e-instruct
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  placeholder="gsk_..."
                  value={formData.groqApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, groqApiKey: e.target.value })}
                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-blue-500 font-mono ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500'
                  }`}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="meta-llama/llama-4-scout-17b-16e-instruct"
                  value={formData.groqModel || ''}
                  onChange={(e) => setFormData({ ...formData, groqModel: e.target.value })}
                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-blue-500 font-mono ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Local Data Management (Export & Import) */}
          <div className={`pt-4 border-t space-y-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Data Backup & Portability
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExport}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                  isLight
                    ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                    : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Download className="w-4 h-4 text-blue-500" />
                <span>Export All Chats (JSON)</span>
              </button>

              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  isLight
                    ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                    : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4 text-emerald-500" />
                <span>Restore Backup (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300">
                {importStatus}
              </div>
            )}

            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 pt-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all locally cached chats on this browser</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <div>
            {saveStatus && (
              <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {saveStatus}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
