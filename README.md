# pRash Hub — All-in-One Multi-Agent AI Platforms

A personal, production-ready AI chat workspace equipped with specialized agent plugins, zero-downtime model failover cascading, multi-attachment vision & document reasoning, and private zero-training routing.

---

## 🌟 Key Features

### 1. Specialized Agent Plugins (Selectable on the fly in Chat)
* 🌙 **KidStory**: Generates soothing bedtime stories for kids with highlighted vocabulary words, simple definitions, and reading comprehension questions.
* 🎒 **StudyBuddy**: Explains complex school and university topics simply using the Feynman technique, analogies, and quick knowledge-check questions.
* 📝 **Worksheet Generator**: Converts textbook photos or topics/grades into clean, print-ready student worksheets with exercise sections and a toggleable **Answer Key**. Includes an **A4 Print / Save PDF** view.
* 📊 **DataAnalyst**: Senior BI & Data Engineering specialist for Looker Studio calculated fields & blends, Tableau LOD calculations, SQL window functions, Python (Pandas/Polars), and Google Sheets/Excel formulas.
* 🩺 **Doctor (Medical Assistant)**: Deciphers handwritten prescriptions, analyzes CBC/lipid lab reports into clean tables, provides clinical context, strict medical disclaimers, and a checklist of questions to ask your physician.
* 🧠 **Psycho (Mind & Wellness)**: Compassionate, non-judgmental space for emotional check-ins, CBT cognitive reframing, stress/burnout coaching, and 5-4-3-2-1 somatic grounding exercises.
* 🕊️ **Spiritual Guide**: Doubt-solving around existential questions, purpose, inner peace, and karma drawing from the Bhagavad Gita, Stoicism, Zen, and universal ethics.
* ✨ **General Assistant**: Multi-purpose reasoning assistant for writing, code, research, and analysis.

### 2. Multi-Attachment Support (Beyond ChatGPT/Claude Limits)
* **Multiple files simultaneously**: Upload 5, 10, or 20+ attachments at once.
* **Drag-and-Drop & Clipboard Paste**: Drag files directly into the chat or paste screenshots (`Ctrl+V`) instantly.
* **Format support**: Images (JPEG, PNG, WEBP), PDFs, text documents, CSV, JSON, Python, and SQL scripts.

### 3. Smart Cascade Model Routing (Zero Downtime)
* **Primary (Default)**: OpenAI (`gpt-5.4-mini` or `gpt-5.4-nano` / `gpt-4o-mini`).
* **Backup 1**: Google Gemini Flash (`gemini-1.5-flash` or `gemini-2.0-flash`).
* **Backup 2**: NVIDIA NIM (`meta/llama-3.3-70b-instruct`).
* **Backup 3**: Groq Cloud (`llama-3.3-70b-versatile`).
* *Automatic Failover*: If OpenAI hits rate limits (429) or token limits, the query automatically fails over to Gemini ➜ NVIDIA ➜ Groq with a live badge showing the failover chain.

### 4. Zero-Training Privacy Mode
* In standard chat apps, user conversations may be retained for model training.
* Enabling **Privacy Mode / Temporary Chat**:
  * **Strict Route**: Bypasses OpenAI, NVIDIA, and Groq entirely and locks exclusively to your **Google Gemini Paid API Key** (backed by Google Cloud's commercial zero-data-retention terms).
  * **In-Memory Only**: Automatically skips saving the conversation to browser IndexedDB storage.

### 5. Local Storage & Full Data Sovereignty
* All conversations and attachments are saved inside your browser's private **IndexedDB**.
* No remote database required.
* Full **Export to JSON** and **Import from JSON** backup tools in Settings.

---

## 🚀 Getting Started

### Prerequisites
* Node.js v18+ (Node 24 supported)
* npm or pnpm

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. (Optional) Set environment variables in .env.local
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables & In-App Keys

You can configure your API keys in two convenient ways:
1. **Via Environment Variables** (recommended for Vercel/Cloudflare deployments):
   ```env
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL_DEFAULT=gpt-5.4-mini

   GEMINI_API_KEY=AIzaSy...
   GEMINI_MODEL_DEFAULT=gemini-1.5-flash

   NVIDIA_API_KEY=nvapi-...
   NVIDIA_MODEL_DEFAULT=meta/llama-3.3-70b-instruct

   GROQ_API_KEY=gsk_...
   GROQ_MODEL_DEFAULT=llama-3.3-70b-versatile
   ```
2. **Via In-App Settings Modal**:
   * Click **Settings & API Keys** in the bottom left sidebar.
   * Enter or update your keys directly in your browser.
   * Client-provided keys override environment variables.

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. In [Vercel Dashboard](https://vercel.com):
   - Click **Add New Project** and select this repository.
   - Framework preset: **Next.js**.
   - Add your environment variables (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `NVIDIA_API_KEY`, `GROQ_API_KEY`).
   - Click **Deploy**.
3. Your private multi-agent chat hub is live with full serverless streaming and multimodal support!
