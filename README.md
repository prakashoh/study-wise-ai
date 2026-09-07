# StudyFlow AI

🎓 StudyMate AI — AI-Powered Student Learning Assistant

Complete Build Prompt for Lovable

Build a full-featured, visually polished web application called "StudyMate AI" — an intelligent learning platform where students upload notes/PDFs and interact with an AI tutor to ask questions, generate summaries, create quizzes, build flashcards, and track their study progress with analytics.

🎯 Product Vision

A personal AI tutor that turns hours of textbook searching into seconds of instant, personalized answers — helping students prepare for exams faster and smarter.

🛠️ Tech Stack

Layer Technology Frontend React.js, Tailwind CSS, Framer Motion (animations) Backend Node.js, Express.js Database MongoDB AI Integration OpenAI API / Gemini API File Storage Cloudinary PDF Processing pdf-parse Auth JWT-based authentication Deployment Vercel (frontend), Render/Railway (backend) Version Control Git & GitHub

🎨 Design Direction

Modern education-tech aesthetic — feels premium, calm, and focused, not childish.

Primary color: Indigo/blue (#4F46E5 range) — trust & focus.

Accent color: Teal or amber for highlights and success states.

Rounded-xl cards, soft shadows, subtle hover/scale animations, smooth page transitions.

Generous white space, clear typographic hierarchy (large bold headings, readable body text).

Fully responsive: mobile, tablet, desktop.

Support light/dark mode toggle.

Use icons (lucide-react style) throughout for visual clarity — not just text.

🏠 1. Header Section (Navbar + Hero)

Navbar

Logo: "🎓 StudyMate AI"

Links: Home, Features, How It Works, Pricing (optional), Login/Signup

CTA button: "Get Started Free" (gradient indigo-to-teal button)

Sticky navbar with subtle blur/shadow on scroll

Hero Section

Badge above headline: "✨ Powered by AI"

Headline: "Your Personal AI Tutor — Study Smarter, Not Harder"

Subheadline: "Upload your notes and PDFs, ask questions, generate quizzes, and track your progress — all in one AI-powered workspace."

Primary CTA: "Upload Your Notes →"

Secondary CTA: "Watch Demo"

Hero visual: mockup of the AI chat interface or an animated illustration of a student + AI assistant

Trust strip below hero: "Trusted for exam prep by students across 50+ colleges" (or similar social proof line)

Feature Highlight Cards (6-card grid, icon + title + one-line description)

📄 Smart Upload — Upload PDFs, notes, and DOCX files instantly

🤖 AI Q&A Chat — Ask anything, get answers from your own notes

📝 Auto Summaries — Long chapters condensed into key points

🎯 AI-Generated Quizzes — Test yourself with auto-created MCQs

🗂️ Smart Flashcards — Auto-built flashcards for quick revision

📊 Progress Analytics — Visual insights into your study habits

🧩 Core Modules

Module 1: User Authentication

Student registration, login, logout

JWT-secured sessions

Editable profile (name, email, avatar, study goals)

Password reset flow

Module 2: Notes & PDF Upload System

Drag-and-drop upload for PDF, TXT, DOCX

"My Library" grid view with file thumbnails, upload date, size, tags/subject labels

Search and filter documents by subject/name

Delete/rename documents

Module 3: PDF Content Extraction

Auto-extract text on upload (pdf-parse)

Store extracted text chunks linked to each document for AI context retrieval

Show extraction status (Processing → Ready) with a progress indicator

Module 4: AI Question & Answer System

Chat-style interface, document selector (single doc or "All Notes")

Context-aware answers grounded in uploaded material (RAG-style retrieval)

Chat history saved per document

"Explain like I'm 5" toggle for simplified answers

Module 5: Learning Dashboard

Summary cards: documents uploaded, questions asked, quizzes taken, current streak

Recent activity feed

Weekly study time chart

🚀 Advanced Features (What Makes This Stand Out)

🧠 AI Summary Generator

Auto-generate concise chapter/topic summaries from any uploaded document — one-click "Summarize This" button with adjustable summary length (short/medium/detailed).

🎯 AI Quiz Generator

Automatically generate multiple-choice and short-answer quizzes from uploaded notes. Instant scoring, correct-answer explanations, and a "retry weak areas" option.

🗂️ Smart Flashcards

AI auto-generates flashcards (term/definition or Q&A style) from notes. Includes a spaced-repetition style review mode (swipe/flip cards, "Know it" / "Review again").

📊 Progress Analytics Dashboard

Visual charts (using Recharts) showing:

Study time trends over the week/month

Quiz performance by subject

Topics mastered vs. topics needing review

Daily study streak tracker with streak badges

🔊 Voice Input for Questions

Let students ask questions via voice (Web Speech API) instead of typing — great for hands-free revision.

🏆 Gamification

XP points for uploading notes, completing quizzes, maintaining streaks

Achievement badges (e.g., "7-Day Streak," "Quiz Master")

Optional leaderboard for friendly competition among classmates

🌐 Multi-Document Cross-Referencing

Ask a question that pulls context from multiple uploaded documents at once — e.g., "Compare the definitions of X across my Chemistry and Biology notes."

🌙 Light/Dark Mode

Full theme toggle with smooth transition, persisted per user.

📤 Export & Share

Export AI-generated summaries, quizzes, or flashcard sets as PDF to share with classmates or print for offline study.

📄 Pages Summary

Landing Page — Header/Hero + Features + How It Works + CTA footer

Signup / Login

Dashboard — post-login home with stats and activity

My Library — upload & manage documents

AI Chat — ask questions, get grounded answers

Summaries — view/generate document summaries

Quizzes — take AI-generated quizzes, view scores

Flashcards — review mode with flip/swipe cards

Analytics — charts and progress insights

Profile & Settings — account, theme, preferences

✅ Build Priorities (End-to-End Flow to Get Working First)

Signup/Login → 2. Upload PDF → 3. Extract text → 4. Ask AI a question → 5. Get grounded answer → 6. Generate a quiz from the same doc → 7. Reflect activity on Dashboard & Analytics

💡 Notes for Lovable

Keep the color scheme (indigo + teal) and card-based layout consistent across every page.

Use smooth micro-animations (hover states, page transitions, loading skeletons) to make the app feel premium.

Prioritize a polished, demo-ready landing page and dashboard — these are what judges see first.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dda703bf-2b12-4273-a1fa-3f5601de973d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
