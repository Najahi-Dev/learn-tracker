# 🧠 MindForge — The Intelligent Study & Skill Tracker

<div align="center">

![MindForge Banner](https://img.shields.io/badge/MindForge-Intelligent%20Learning%20Workspace-6366f1?style=for-the-badge&logo=brain&logoColor=white)

[![Next.js](https://img.shields.io/badge/Next.js-16.3.6-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-1.46.0-orange?style=flat-square&logo=convex&logoColor=white)](https://convex.dev/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=flat-square&logo=clerk&logoColor=white)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Responsive](https://img.shields.io/badge/Design-100%25%20Mobile%20Responsive-emerald?style=flat-square&logo=responsive&logoColor=white)](#)

**MindForge** is an all-in-one personal learning workspace designed to help developers, students, and lifelong learners break down complex subjects into structured milestones, extract actionable study curriculums from PDFs, and master skills effortlessly using spaced repetition and deep work routines.

</div>

---

## ✨ Key Features

### 📄 1. PDF & Syllabus AI Parser
- **Client-Side Text Extraction**: Uses `pdfjs-dist` to parse PDFs in the browser securely without server upload limits.
- **Intelligent Structure Recognition**: Analyzes course outlines, slides, and syllabus documents into structured topics, milestones, and nested subtasks.
- **Interactive Review & Edit Modal**: Preview, adjust titles, cycle priorities, and fine-tune subtasks before one-click bulk import into Convex.

### 🎯 2. Milestone & Subtask Mastery
- **Hierarchical Checklists**: Break down topics into key milestones and nested bite-sized subtasks.
- **Drag & Drop Reordering**: Reorder milestones and subtasks smoothly to organize learning priorities.
- **Inline Editing**: Double-click or tap to edit titles, target deadlines, and priority levels directly on the board.
- **Gamified XP & Confetti Celebrations**: Earn XP and level up as you complete tasks and master entire topics.

### 🔄 3. Scientific Spaced Repetition (SM-2)
- Built-in review engine using the SuperMemo SM-2 algorithm to schedule active recall reviews.
- Automates intervals based on difficulty ratings (Again, Hard, Good, Easy) to lock concepts into long-term memory.

### 📋 4. Flexible Multi-View Workspaces
- **Topic Cards & Detailed Workspace**: Comprehensive topic drill-down with rich Markdown notes, external resource links, and progress trackers.
- **Kanban Board**: Drag & drop workflow across *Not Started*, *Currently Learning*, and *Mastered* columns (includes mobile column quick-filters).
- **Daily Focus Planner**: Queue high-priority milestones for today with single-click scheduling.
- **Knowledge Graph**: Visualize topic relationships and prerequisites interactively.

### ⏱️ 5. Zen Focus Studio & Floating Timer
- **Pomodoro & Stopwatch**: Built-in 25-minute focus intervals and 5-minute break timers.
- **Ambient Soundscapes**: White noise, gentle rain, and calming wave sound generators to boost concentration.
- **Floating Mini-Bar**: Stays on-screen across navigation without interrupting deep work.

### 📊 6. Analytics & Habit Consistency
- **GitHub-style Heatmap**: Real-time activity matrix visualizing daily study volume and completions over 3 months, 6 months, or 1 year.
- **Streak Tracker & Levels**: Tracks current and longest study streaks with level-up progression badges.

### 📱 7. 100% Mobile Responsive
- Optimized for mobile viewports (320px+), tablets, and ultra-wide desktops.
- Slide-out mobile drawer navigation, touch-friendly tap targets, and responsive modal dialogs.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Backend & Realtime Database** | [Convex](https://convex.dev/) (Reactive TypeScript platform) |
| **Authentication** | [Clerk](https://clerk.com/) |
| **Styling & UI Components** | [Tailwind CSS v4](https://tailwindcss.com/), Radix UI, Lucide Icons |
| **PDF Processing** | [PDF.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`) |
| **Rich Text Editor** | [TipTap](https://tiptap.dev/) |
| **Date Pickers & Selectors** | [Flatpickr](https://flatpickr.js.org/), [React Select](https://react-select.com/) |
| **Theme Management** | `next-themes` (Dark / Light mode support) |

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/mindforge.git
cd mindforge
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
# Convex Backend Deployment
CONVEX_DEPLOYMENT=your-convex-deployment-id
NEXT_PUBLIC_CONVEX_URL=https://your-convex-app.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Auth URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Optional: JWT Issuer Domain for Convex Auth
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-instance.clerk.accounts.dev
```

### 4. Run Convex Backend & Next.js Development Server

In one terminal, start the Convex backend watcher:
```bash
npx convex dev
```

In another terminal, start Next.js dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using **MindForge**.

---

## 🌐 Deploy to Vercel

1. Push your repository to **GitHub / GitLab**.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your repository.
4. In the **Environment Variables** section, add all keys from your `.env.local` (ensure `NEXT_PUBLIC_CONVEX_URL` points to your Convex production deployment).
5. Deploy your Convex backend to production:
   ```bash
   npx convex deploy
   ```
6. Add your production Vercel domain to your **Clerk Dashboard** under *Allowed Origins* and *Redirect URLs*.
7. Hit **Deploy** on Vercel!

---

## 📁 Project Structure

```text
mindforge/
├── app/
│   ├── (auth)/                # Clerk Sign-in & Sign-up routes
│   ├── (dashboard)/           # Protected dashboard layout & routes
│   │   ├── dashboard/
│   │   │   ├── graph/         # Knowledge graph visualization
│   │   │   ├── kanban/        # Kanban workflow board
│   │   │   ├── planner/       # Daily focus planner
│   │   │   ├── reviews/       # SM-2 spaced repetition cards
│   │   │   └── topics/[id]/   # Topic detail workspace & tasks
│   ├── layout.tsx             # Root layout with Theme & Convex providers
│   └── page.tsx               # Landing page
├── components/
│   ├── ai/                    # PDF upload dialog, Feynman evaluator & AI dialogs
│   ├── analytics/             # Heatmap, Streak badge, XP cards
│   ├── focus/                 # Zen Focus Studio & Floating timer bar
│   ├── notes/                 # TipTap Markdown notes editor
│   ├── reviews/               # Spaced repetition review card component
│   ├── ui/                    # Reusable UI component primitives (Radix UI)
│   ├── views/                 # Kanban board, Graph views, View switcher
│   └── sidebar-nav.tsx        # Responsive dashboard sidebar & mobile drawer
├── convex/                    # Convex backend schema, queries, mutations & crons
│   ├── schema.ts              # Database schema definitions
│   ├── tasks.ts               # Task/Subtask CRUD, reordering, and PDF bulk import
│   ├── topics.ts              # Topic management & progress aggregation
│   ├── reviews.ts             # SM-2 Spaced repetition engine
│   └── analytics.ts           # Heatmap aggregation & XP calculation
└── lib/
    ├── pdf-parser.ts          # Client-side PDF text extraction & NLP parser
    └── utils.ts               # Styling & class merger utilities
```

---

## 📄 License

This project is licensed under the **MIT License**.
