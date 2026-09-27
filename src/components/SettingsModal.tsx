'use client';

import React, { useState } from 'react';
import { UserApiKeys } from '@/types/chat';
import { exportAllData, importData, clearAllLocalData } from '@/lib/storage';
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
}

export function SettingsModal({ settings, onSaveSettings, onClose, onDataChanged }: SettingsModalProps) {
  const [formData, setFormData] = useState<UserApiKeys>({ ...settings });
  const [showKeys, setShowKeys] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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

    try {
      const text = await file.text();
      const count = await importData(text);
      setImportStatus(`Successfully restored ${count} chats!`);
      onDataChanged();
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err) {
      alert('Failed to import backup file: ' + err);
    }
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to permanently delete all chats stored on this device? This cannot be undone.')) {
      await clearAllLocalData();
      onDataChanged();
      alert('All local chat sessions cleared.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-slate-100">AI Models & Key Configuration</h2>
              <p className="text-xs text-slate-400">Personal keys are stored locally in your browser</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cascade Explainer Box */}
          <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-slate-300 flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-200">Zero-Downtime Cascade Pipeline</p>
              <p className="text-slate-400 leading-relaxed">
                Queries hit <strong className="text-emerald-300">OpenAI (Default)</strong>. If it fails or encounters rate limits, it automatically fails over to <strong className="text-sky-300">Google Gemini Flash</strong> ➜ <strong className="text-emerald-300">NVIDIA NIM</strong> ➜ <strong className="text-orange-300">Groq Cloud</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Show key characters:</span>
            <button
              type="button"
              onClick={() => setShowKeys(!showKeys)}
              className="text-blue-400 hover:text-blue-300 underline font-medium"
            >
              {showKeys ? 'Hide Keys' : 'Reveal Keys'}
            </button>
          </div>

          {/* Provider 1: OpenAI */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                1. OpenAI (Default Primary)
              </label>
              <span className="text-[10px] text-slate-400">gpt-5.4-mini / gpt-5.4-nano</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={formData.openaiApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="gpt-5.4-mini"
                  value={formData.openaiModel || ''}
                  onChange={(e) => setFormData({ ...formData, openaiModel: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Provider 2: Gemini */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-sky-400 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                2. Google Gemini (Backup 1 & Privacy Mode)
              </label>
              <span className="text-[10px] text-emerald-400 font-medium">Zero-Training Paid Tier</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={formData.geminiApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="gemini-1.5-flash"
                  value={formData.geminiModel || ''}
                  onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Provider 3: NVIDIA NIM */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-green-400 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                3. NVIDIA NIM (Backup 2)
              </label>
              <span className="text-[10px] text-slate-400">meta/llama-3.3-70b-instruct</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  placeholder="nvapi-..."
                  value={formData.nvidiaApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, nvidiaApiKey: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="meta/llama-3.3-70b-instruct"
                  value={formData.nvidiaModel || ''}
                  onChange={(e) => setFormData({ ...formData, nvidiaModel: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Provider 4: Groq Cloud */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-orange-400 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                4. Groq Cloud (Backup 3 - Fast LPU)
              </label>
              <span className="text-[10px] text-slate-400">llama-3.3-70b-versatile</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  placeholder="gsk_..."
                  value={formData.groqApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, groqApiKey: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="llama-3.3-70b-versatile"
                  value={formData.groqModel || ''}
                  onChange={(e) => setFormData({ ...formData, groqModel: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Data Backup & Privacy section */}
          <div className="border-t border-slate-800 pt-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Personal Data & Backup Management
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                Export Chats JSON
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                Import Backup
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-rose-900/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Clear Local Data
              </button>
            </div>

            {importStatus && <p className="text-xs text-emerald-400 font-medium">{importStatus}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {saveStatus ? <span className="text-emerald-400 font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" />{saveStatus}</span> : 'Environment variables act as server defaults if keys are left blank.'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
