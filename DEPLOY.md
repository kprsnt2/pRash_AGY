# 🚀 Deployment & Configuration Guide — pRash Hub

This guide covers everything you need to deploy **pRash Hub** to **Vercel** or **Cloudflare Pages**, configure API keys, and leverage the multi-agent cascade and zero-training privacy mode.

---

## 📋 Table of Contents
1. [Quick Deploy to Vercel (Recommended)](#1-quick-deploy-to-vercel-recommended)
2. [Deploy to Cloudflare Pages](#2-deploy-to-cloudflare-pages)
3. [Environment Variables Reference](#3-environment-variables-reference)
4. [Smart Model Cascade & Failover Order](#4-smart-model-cascade--failover-order)
5. [Zero-Training Privacy Mode (Gemini Paid Key)](#5-zero-training-privacy-mode-gemini-paid-key)
6. [Agent Plugin Catalog (14 Specialized Agents)](#6-agent-plugin-catalog-14-specialized-agents)
7. [Running Locally](#7-running-locally)

---

## 1. Quick Deploy to Vercel (Recommended)

Vercel natively supports Next.js 14 App Router, Server-Sent Events (SSE) streaming, and high payload limits.

### Step 1: Connect GitHub Repository
1. Log in to your [Vercel Dashboard](https://vercel.com/new).
2. Click **Import** next to your repository:
   ```
   kprsnt2/pRash_AGY
   ```
3. Framework Preset: Automatically detected as **Next.js**.
4. Root Directory: `./` (leave default).

### Step 2: Configure Environment Variables in Vercel
In the **Environment Variables** section on Vercel, add the following (or leave them blank and enter them securely in the in-app Settings modal):

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | `sk-proj-...` | Primary default model provider |
| `OPENAI_MODEL_DEFAULT` | `gpt-5.4-mini` | Default OpenAI model (`gpt-5.4-mini` or `gpt-5.4-nano`) |
| `GEMINI_API_KEY` | `AIzaSy...` | Backup 1 & Zero-Training Privacy Mode key |
| `GEMINI_MODEL_DEFAULT` | `gemini-1.5-flash` | Gemini model (`gemini-1.5-flash` or `gemini-2.0-flash`) |
| `NVIDIA_API_KEY` | `nvapi-...` | Backup 2 (NVIDIA NIM) |
| `NVIDIA_MODEL_DEFAULT` | `meta/llama-3.3-70b-instruct` | NVIDIA model |
| `GROQ_API_KEY` | `gsk_...` | Backup 3 (Groq Cloud ultra-fast LPU) |
| `GROQ_MODEL_DEFAULT` | `llama-3.3-70b-versatile` | Groq model |

### Step 3: Click Deploy
* Hit **Deploy**. In under 60 seconds, your personal multi-agent hub will be live with a free `https://*.vercel.app` URL and automatic SSL.

---

## 2. Deploy to Cloudflare Pages

1. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), navigate to **Workers & Pages** ➜ **Create application** ➜ **Pages** ➜ **Connect to Git**.
2. Select `kprsnt2/pRash_AGY`.
3. Build Settings:
   * **Framework Preset**: Next.js
   * **Build command**: `npx @cloudflare/next-on-pages@1` or `npm run build`
   * **Output directory**: `.vercel/output/static` or `.next`
   * **Node.js Compatibility Flag**: Add environment variable `NODE_VERSION = 20` or `NODE_VERSION = 24`.
4. Add your API key environment variables under **Settings** ➜ **Environment variables**.

---

## 3. Environment Variables Reference

A pre-configured template is included in [`.env.example`](file:///.env.example):

```env
# 1. Primary Model: OpenAI
OPENAI_API_KEY=
OPENAI_MODEL_DEFAULT=gpt-5.4-mini

# 2. Backup 1 & Privacy Mode: Google Gemini (Paid Key - Zero Data Training)
GEMINI_API_KEY=
GEMINI_MODEL_DEFAULT=gemini-1.5-flash

# 3. Backup 2: NVIDIA NIM
NVIDIA_API_KEY=
NVIDIA_MODEL_DEFAULT=meta/llama-3.3-70b-instruct
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

# 4. Backup 3: Groq Cloud (Ultra-Fast Failover)
GROQ_API_KEY=
GROQ_MODEL_DEFAULT=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

> **Note**: Even after deploying, you can override or enter any of these API keys directly in your browser using the **Settings & API Keys** modal (stored securely in browser `localStorage`).

---

## 4. Smart Model Cascade & Failover Order

To guarantee zero downtime and uninterrupted responses:

```
User Query + Attachments
         │
         ▼
┌──────────────────┐      Error / Rate Limit
│   1. OpenAI      │ ─────────────────────────┐
│ (gpt-5.4-mini)   │                          │
└────────┬─────────┘                          │
         │ Success                            ▼
         │                         ┌──────────────────┐
         │                         │ 2. Google Gemini │
         │                         │ (gemini-1.5-flash)│
         │                         └────────┬─────────┘
         │                                  │ Error / Quota
         │                                  ▼
         │                         ┌──────────────────┐
         │                         │  3. NVIDIA NIM   │
         │                         │ (Llama 3.3 70B)  │
         │                         └────────┬─────────┘
         │                                  │ Error
         │                                  ▼
         │                         ┌──────────────────┐
         │                         │  4. Groq Cloud   │
         │                         │ (Llama 3.3 70B)  │
         │                         └────────┬─────────┘
         ▼                                  ▼
    Assistant Response Stream (With Cascade Badge & Failover Log)
```

---

## 5. Zero-Training Privacy Mode (Gemini Paid Key)

When you toggle **Zero-Training Privacy Mode** in the chat header or sidebar:
1. **Strict Routing**: OpenAI, NVIDIA, and Groq are completely bypassed. All requests are routed **strictly to Google Gemini** using your paid API key (which guarantees zero data retention for training).
2. **In-Memory Isolation**: The conversation is kept only in browser memory and is **never saved to IndexedDB**. Closing the tab wipes the conversation cleanly.

---

## 6. Agent Plugin Catalog (14 Specialized Agents)

Switch between any of these agents inside the chat like plugins:

| Agent Name | Emoji | Specialty | Key Daily Use Case |
| :--- | :---: | :--- | :--- |
| **SlumberSpun** | 🌙 | Bedtime Magician & Phonics Wizard | Bedtime stories for kids with highlighted vocabulary & reading questions |
| **FeynmanForge** | 🎒 | Jargon-Shattering Explainer | Demolishes complex topics simply using the Feynman technique & analogies |
| **PrintNova** | 📝 | Worksheet Alchemist | Converts textbook photos/topics into print-ready school worksheets with Answer Keys |
| **MetricMancer** | 📊 | BI, Tableau & SQL Sorcerer | Looker Studio calculated fields & blends, Tableau LODs, SQL CTEs, Python Pandas |
| **RxSleuth** | 🩺 | Prescription & Lab Decryptor | Deciphers doctor handwriting, analyzes CBC/lipid blood tests, questions for physician |
| **CogniCalm** | 🧠 | Empathetic CBT & Mind Restorer | Emotional check-ins, CBT cognitive reframing, burnout recovery, 5-4-3-2-1 grounding |
| **ZenQuasar** | 🕊️ | Existential & Cosmic Wisdom | Bhagavad Gita karma yoga, Stoic dichotomy of control, Zen mindfulness |
| **FridgePhantom** | 🍳 | Pantry Scavenger & Chef | Upload fridge/pantry photos to invent instant gourmet recipes from whatever you have |
| **GhostDiplomat** | ✍️ | Executive Ghostwriter & Negotiator | Drafts tactful emails, salary negotiations, firm boundary-setting, client de-escalation |
| **ClauseCracker** | ⚖️ | Contract & Fine Print Sleuth | Audits rental leases, job offers, terms of service for hidden fees & trap clauses |
| **PennyPulse** | 💳 | Wealth & Expense Detective | Audits receipts, itemizes expenses, builds 50/30/20 budgets, tax optimization (80C) |
| **SyntaxSorcerer** | ⚡ | Code Reviewer & Bug Exorcist | Fullstack debugging, stack trace root cause analysis, regex wizardry, API architecture |
| **IronMorph** | 🏋️ | Biomechanics & Workout Crafter | Tailored home/gym workout routines, posture fixes, macro estimates from meal photos |
| **RoamRover** | ✈️ | Itinerary Architect & Logistics | Day-by-day travel itineraries, flight layover risk inspection, minimalist packing lists |

---

## 7. Running Locally

```bash
# Clone the repository
git clone https://github.com/kprsnt2/pRash_AGY.git
cd pRash_AGY

# Install dependencies
npm install

# (Optional) Setup environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.
