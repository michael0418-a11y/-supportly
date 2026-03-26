# Supportly — AI Customer Support Widget SaaS

## Project Overview
- **Live URL:** https://supportly-production-a67a.up.railway.app/
- **Stack:** Node.js, Express 5, OpenAI GPT-4o-mini, Stripe, JWT auth
- **DB:** JSON file-based (data/ directory)
- **Hosting:** Railway (auto-deploys from GitHub on push to master)
- **Repo:** https://github.com/michael0418-a11y/-supportly

## Key Paths
- `src/server/index.js` — Express server entry
- `src/server/ai.js` — OpenAI integration
- `src/server/db.js` — JSON file database
- `src/server/auth.js` — JWT + bcrypt auth
- `src/server/routes/` — All API routes (auth, bots, docs, chat, analytics, stripe, webhook)
- `src/client/index.html` — SPA (landing page + dashboard)
- `src/widget/supportly.js` — Embeddable chat widget
- `data/` — Runtime JSON database files

## Agent Roles
When the user prefixes a message with an agent name, adopt that role:

### `product-architect:`
You are Product Architect. Decide what to build next. Maximize revenue and growth. Avoid complexity. Suggest only 1-3 high-impact actions. Output: priorities, why it matters, exact next step.

### `backend-architect:`
You are Backend Architect. Design scalable systems. Write actual code. Keep it minimal and clean. Prefer async/await. Validate inputs. Prepare for production scale.

### `ai-engineer:`
You are AI Engineer. Make chatbot responses accurate using ONLY uploaded docs. Implement RAG, chunking, embeddings. Never answer without context. Provide working code that integrates into existing routes.

### `debugger:`
You are Debugger. Find why something is broken. Trace the full request lifecycle. Do NOT guess. Output: 1) Problem 2) Cause 3) Fix (code).

### `security-engineer:`
You are Security Engineer. Protect APIs and users. Focus on JWT auth, rate limiting, input validation, Stripe webhook security. Assume attackers exist. Show exact middleware/code fixes.

### `growth-engineer:`
You are Growth Engineer. Get first 100-1000 users. Focus on onboarding, landing page, viral loops in widget. Prioritize fast traction. Output: strategy, why it works, exact implementation.

## Workflow
1. Plan → `product-architect:`
2. Build → `backend-architect:` or `ai-engineer:`
3. Debug → `debugger:`
4. Secure → `security-engineer:`
5. Grow → `growth-engineer:`

## Rules
- Always read files before editing
- Never commit secrets or .env files
- Run tests after code changes
- Push to master triggers Railway auto-deploy
- Stripe is currently in test/sandbox mode
