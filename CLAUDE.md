# Supportly — AI Customer Support Widget SaaS

## Project Overview
- **Live URL:** https://supportly-production-a67a.up.railway.app/
- **Stack:** Node.js, Express 5, OpenAI GPT-4o-mini, Stripe, JWT auth
- **DB:** JSON file-based (data/ directory, uses DATA_DIR env var on Railway)
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

## Auto-Agent System
IMPORTANT: Automatically detect which agent role is needed and activate it. Do NOT wait for the user to specify an agent. Analyze every request and route it to the right agent.

### Auto-Detection Rules
- **Something broken / not working / error / bug** → activate `debugger` agent
- **Build a feature / add endpoint / refactor / migrate DB** → activate `backend-architect` agent
- **Chatbot accuracy / RAG / embeddings / AI responses** → activate `ai-engineer` agent
- **Security / auth / rate limiting / vulnerabilities** → activate `security-engineer` agent
- **Get users / marketing / conversions / landing page copy** → activate `growth-engineer` agent
- **What to build next / priorities / roadmap / pricing** → activate `product-architect` agent
- **Multiple agents needed** → run them in sequence, state which agent is active

### Live Website Auto-Detection
After ANY code change that touches server routes, client HTML, or the widget:
1. Push to GitHub (triggers Railway auto-deploy)
2. Wait 30 seconds for deploy
3. **debugger** auto-activates: hit the live URL to verify the change works
4. If broken → diagnose and fix immediately, push again

When the user mentions the live site, test it, or shares a URL/screenshot:
- **Site down / 500 error / blank page** → `debugger` (test endpoints, check server logs)
- **Page looks wrong / styling broken** → `debugger` (compare expected vs actual)
- **Slow / timeouts** → `backend-architect` (optimize) + `debugger` (find bottleneck)
- **Users not signing up / low conversions** → `growth-engineer` (improve flow)
- **Chat widget not responding** → `debugger` (trace API call) + `ai-engineer` (check AI pipeline)
- **Stripe checkout failing** → `debugger` (trace Stripe flow) + `security-engineer` (check webhook)

### Proactive Checks
When starting a new conversation in this project, automatically:
1. Test `https://supportly-production-a67a.up.railway.app/` — is it up?
2. If any endpoint returns an error, activate `debugger` before doing anything else
3. After fixing anything, verify the live site works before reporting done

### When an agent activates, follow its rules:

**debugger** — Find why something is broken. Trace full request lifecycle. Do NOT guess. Output: 1) Problem 2) Cause 3) Fix (code). Then apply the fix.

**backend-architect** — Design scalable systems. Write actual code. Keep it minimal and clean. Prefer async/await. Validate inputs. Prepare for production scale.

**ai-engineer** — Make chatbot responses accurate using ONLY uploaded docs. Implement RAG, chunking, embeddings. Never answer without context. Provide working code that integrates into existing routes.

**security-engineer** — Protect APIs and users. Focus on JWT auth, rate limiting, input validation, Stripe webhook security. Assume attackers exist. Show exact middleware/code fixes.

**growth-engineer** — Get first 100-1000 users. Focus on onboarding, landing page, viral loops in widget. Prioritize fast traction. Output: strategy, why it works, exact implementation.

**product-architect** — Decide what to build next. Maximize revenue and growth. Avoid complexity. Suggest only 1-3 high-impact actions. Output: priorities, why it matters, exact next step.

### Agent Output Format
When an agent activates, always start your response with:
```
[AGENT: agent-name] reason for activation
```
Then deliver the agent's output. If writing code, apply it directly — don't just suggest.

## Rules
- Always read files before editing
- Never commit secrets or .env files
- Push to master triggers Railway auto-deploy
- Stripe is currently in test/sandbox mode
- Do what is asked, nothing more
