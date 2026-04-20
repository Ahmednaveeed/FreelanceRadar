# FreelanceRadar — Development Roadmap v2
### Updated with Cost-Optimized Architecture — April 2026

---

## Overview

This roadmap reflects the final optimized architecture:
- **One shared Apify call per cycle** (not per user)
- **3-run limit per user** to control costs
- **Skip cycle if no active users** — Apify never called unnecessarily
- **Cron job** as the core engine running every 30 minutes

**Total estimated time to live MVP: 3–5 weeks (with AI-assisted coding)**

---

## Architecture Recap (Before Building)

```
Every 30 mins — Cron Wakes Up
        ↓
Check DB → any users with runs_used < 3?
        ↓
       YES                        NO
        ↓                          ↓
ONE Apify call               Go back to sleep
Fetch last 30 mins           Cost = $0
Max 10 jobs returned
        ↓
Loop through each active user:
  → Filter jobs matching their skills/niche
  → AI scores each match (0–100)
  → If score > 70 → generate proposal
  → Pick portfolio recommendations
  → Send email
  → Increment runs_used
        ↓
All users processed → back to sleep
```

---

## Phase 1 — Project Setup & Foundation
**Estimated time: 2–4 days**

Get the skeleton running. No AI features yet — just solid infrastructure that won't break later.

### Tasks

| Task | Details | Tech |
|---|---|---|
| Initialize repo | GitHub repo, folder structure `/frontend` + `/backend` | GitHub |
| Frontend scaffold | Create Next.js app with TypeScript | `npx create-next-app` |
| Backend scaffold | Set up FastAPI (Python) or Express (Node.js) | FastAPI / Express |
| Database setup | PostgreSQL instance, connect to backend | PostgreSQL + Prisma or SQLAlchemy |
| Environment config | `.env` file with placeholders for Apify, OpenAI, Resend keys | dotenv |
| Deploy backend | Push to Railway so it runs 24/7 (cron needs a live server) | Railway |
| Deploy frontend | Push to Vercel | Vercel |
| Connect frontend ↔ backend | Basic API call works end to end | REST API |

### Copilot Tip
Ask Copilot to scaffold all API route files upfront even if empty — saves restructuring later.

---

## Phase 2 — User Onboarding & Profile System
**Estimated time: 4–6 days**

This is the data collection layer. Every downstream feature depends on a clean, complete profile.

### Database Schema — Design This First

```
Users Table
  - id (UUID, primary key)
  - email (unique)
  - name
  - created_at
  - updated_at

Profiles Table
  - user_id (FK → Users)
  - skills (text array)
  - niche (text)
  - experience_level (junior / mid / senior)
  - preferred_rate_min (integer)
  - preferred_rate_max (integer)
  - preferred_job_type (fixed / hourly / both)
  - preferred_job_size (small / medium / large)
  - writing_samples (text — user pastes 2–3 old proposals)
  - portfolio (JSON array of {title, url, description})
  - keywords_include (text array)
  - keywords_exclude (text array)
  - runs_used (integer, default 0)
  - runs_limit (integer, default 3)
  - is_active (boolean, default true)
  - updated_at

Seen Jobs Table
  - user_id (FK → Users)
  - job_id (string — Upwork job ID from Apify)
  - seen_at
  UNIQUE constraint: (user_id + job_id) ← prevents duplicate emails
```

### Tasks

| Task | Details |
|---|---|
| Auth system | Email/password signup + login (use NextAuth or Supabase Auth) |
| Onboarding Step 1 | Name, email, niche, experience level |
| Onboarding Step 2 | Skills input (tag-style), keywords to include/exclude |
| Onboarding Step 3 | Rate preferences, job size, job type (fixed/hourly/both) |
| Onboarding Step 4 | Writing samples — paste 2–3 old proposals for tone learning |
| Onboarding Step 5 | Portfolio projects — title + URL + description, add multiple |
| Profile edit page | User can return and update any field at any time |
| Run counter display | Show user "Run 1 of 3 completed" on their profile page |
| API endpoints | `POST /profile`, `GET /profile`, `PUT /profile` |
| Validation | All required fields validated before saving |

### Copilot Tip
Prompt: *"Generate a multi-step React form with state management for these fields: [paste schema]"*

---

## Phase 3 — The Cron Engine (Core of the Product)
**Estimated time: 7–10 days**

This is the heart of FreelanceRadar. The cron job IS the product.

### 3A — Cron Job Setup

Set up the scheduler that runs every 30 minutes on your backend server.

```javascript
// Node.js example using node-cron
const cron = require('node-cron')

cron.schedule('*/30 * * * *', async () => {

  // Step 1: Check if any active users exist
  const activeUsers = await db.getUsers({ runs_used_lt: 3 })

  if (activeUsers.length === 0) {
    console.log('No active users — skipping cycle')
    return  // Apify NOT called — $0 cost
  }

  // Step 2: ONE shared Apify call for all users
  const jobs = await apify.fetchRecentJobs({
    postedAfter: '30 minutes ago',
    maxResults: 10
  })

  // Step 3: Process each active user against the same job list
  for (const user of activeUsers) {
    await processUser(user, jobs)
  }

})
```

| Task | Details |
|---|---|
| Install node-cron | `npm install node-cron` (Node) or Celery (Python) |
| Write cron shell | Basic scheduler that logs "woke up" every 30 mins |
| Active user query | DB query: get all users where `runs_used < runs_limit` |
| Skip logic | If 0 active users → return early, no Apify call |
| Error handling | If any user fails, log it and continue to next user |
| Run logging | Log every cycle: active users count, jobs fetched, emails sent |

### 3B — Apify Integration

ONE call per cycle, shared across all users.

```python
def fetch_recent_jobs():
    response = apify_client.actor("upwork-job-scraper").call(
        run_input={
            "maxResults": 10,
            "publishedDate": "last30Minutes"
        }
    )
    return response.jobs  # list of job objects
```

| Task | Details |
|---|---|
| Apify account + API key | Sign up at apify.com, get API token |
| Install Apify SDK | `npm install apify-client` |
| Write fetch function | Calls actor, returns clean list of job objects |
| Parse Apify response | Extract: id, url, title, description, publishedAt, budget, clientTotalSpent, clientHireRate, clientRating, clientTotalHires, experienceLevel, skills, contractType, duration |
| Test with mock data | Save one real Apify response as `mock_jobs.json` — use this during dev to avoid burning credits |

```python
# Use mock data during development
DEV_MODE = True

def fetch_jobs():
    if DEV_MODE:
        with open('mock_jobs.json') as f:
            return json.load(f)
    else:
        return apify.fetch_recent_jobs()  # real call
```

### 3C — Per-User Job Matching & Scoring

After the single Apify call, loop through each user locally.

```python
def process_user(user, jobs):

    # Step 1: Filter jobs by user's keywords/skills
    relevant_jobs = [
        job for job in jobs
        if any(skill.lower() in job['description'].lower()
               for skill in user.skills)
        and job not in get_seen_jobs(user.id)  # deduplication
    ]

    if not relevant_jobs:
        return  # nothing new for this user

    # Step 2: AI scoring for each relevant job
    for job in relevant_jobs:
        score = ai_score_job(job, user)  # returns 0–100

        if score >= 70:
            proposal = ai_generate_proposal(job, user)
            portfolio_picks = match_portfolio(job, user)
            send_email(user.email, job, score, proposal, portfolio_picks)
            mark_job_seen(user.id, job['id'])

    # Step 3: Increment run counter
    db.increment(user.id, 'runs_used')

    # Step 4: Deactivate if limit reached
    if user.runs_used + 1 >= user.runs_limit:
        db.set(user.id, 'is_active', False)
```

| Task | Details |
|---|---|
| Keyword filter | Check user skills/keywords against job title + description |
| Budget filter | Skip jobs outside user's preferred rate range |
| Deduplication check | Query Seen Jobs table — skip if already sent |
| AI scorer (GPT-4o-mini) | Send job + profile → get score 0–100 + reasons (use mini for cost) |
| Threshold filter | Only proceed if score ≥ 70 |
| Mark as seen | Insert into Seen Jobs after processing |
| Increment runs_used | After processing all jobs for this user |
| Deactivate if done | Set is_active = false when runs_used reaches runs_limit |

**AI Scoring Prompt:**
```
Score how well this job fits this freelancer on a scale of 0–100.

FREELANCER: Skills: {skills}, Niche: {niche}, Rate: ${min}–${max}
JOB: Title: {title}, Description: {description}, Budget: {budget}, Skills needed: {skills}

Return JSON only: { "score": 85, "reasons": ["reason 1", "reason 2", "reason 3"] }
```

### 3D — Proposal Generation

Only runs when score ≥ 70 — uses full GPT-4o for quality.

| Task | Details |
|---|---|
| Job summarizer | GPT-4o-mini → 2–3 line plain English summary of job description |
| Tone extractor | GPT-4o-mini reads user's writing samples → extracts tone descriptor |
| Proposal generator | GPT-4o → full personalized proposal using tone + job + user profile |
| Portfolio matcher | Compare job keywords against user portfolio descriptions → pick top 1–3 with one-line reason each |

**Proposal Generation Prompt:**
```
Write a winning Upwork proposal for this freelancer. Sound human and specific.

FREELANCER: Name: {name}, Skills: {skills}, Niche: {niche},
            Style: {tone_from_samples}, Portfolio: {portfolio_titles}
JOB: Title: {title}, Description: {description}, Budget: {budget}

Rules:
- Under 200 words
- Reference 1–2 specific details from the job
- Do not use words like "passionate" or "dedicated"
- End with a clear call to action
- Sound like it was written by this specific person, not an AI
```

---

## Phase 4 — Email System
**Estimated time: 3–4 days**

Package everything into one clean, scannable email.

### Email Structure

```
────────────────────────────────────────────
 [Job Title]                    💰 $800 Fixed
 ⭐ 94% Match                   ⏱ Posted 18 mins ago
────────────────────────────────────────────
 📋 WHAT THEY NEED
 2–3 line AI summary of the job description

 👤 CLIENT STATS
 💵 $14,200 spent  ✅ 91% hire rate
 ⭐ 4.9 rating      🔁 17 hires made

 📌 REQUIREMENTS
 Level: Intermediate | Skills: React, Node.js
 Duration: 1–2 months | Type: Fixed Price
────────────────────────────────────────────
 ✅ WHY THIS FITS YOU
 • React + Node.js match your top listed skills
 • Budget fits your preferred range
 • Client has strong hiring history
────────────────────────────────────────────
 📝 YOUR READY-TO-USE PROPOSAL
 [Full proposal text — copy and paste ready]

 📎 Attach: "Admin Dashboard" — directly relevant
            to the React + data viz requirement
────────────────────────────────────────────
 [ 🔗 VIEW JOB ON UPWORK ]

 Run 2 of 3 used. 1 remaining.
 Unsubscribe
────────────────────────────────────────────
```

### Tasks

| Task | Details |
|---|---|
| Resend account + API key | Sign up at resend.com, verify your domain |
| HTML email template | Build responsive HTML email with all 5 sections above |
| Dynamic data injection | Populate template with real job + proposal + user data |
| Run counter in footer | Show "Run X of 3 used" in every email |
| Unsubscribe link | One-click unsubscribe — legally required in all emails |
| Test email flow | Sign up as test user, trigger manually, verify email looks correct |

---

## Phase 5 — UI Polish & Launch
**Estimated time: 2–3 days**

### Tasks

| Task | Details |
|---|---|
| Landing page | One-page site: what FreelanceRadar does + signup CTA |
| Run status page | After signup, show user "Run 1 of 3 — pending / sent / completed" |
| Waitlist CTA | After 3 runs used, show "Join waitlist for unlimited access" |
| End-to-end test | Full flow from signup → cron → email with real data |
| Set Apify spending cap | Apify dashboard → Billing → hard cap at $5/month |
| OpenAI usage alerts | Set alert at $5 spend in OpenAI dashboard |
| Error alerting | Email yourself when cron job crashes |
| LinkedIn post | Post the project with signup link |

---

## Full Timeline

| Phase | What Gets Built | Duration |
|---|---|---|
| **Phase 1** | Repo, frontend + backend scaffold, deployed | 2–4 days |
| **Phase 2** | Signup, multi-step onboarding form, profile + run counter in DB | 4–6 days |
| **Phase 3** | Cron engine, Apify integration, AI matching, proposal generation | 7–10 days |
| **Phase 4** | Email template, Resend integration, end-to-end test | 3–4 days |
| **Phase 5** | UI polish, landing page, safety caps, LinkedIn launch | 2–3 days |
| **Total** | | **18–27 days (~3–4 weeks)** |

---

## Cost Safety Checklist Before Going Live

- [ ] Apify monthly spending cap set to $5 in billing settings
- [ ] OpenAI usage alert set at $5
- [ ] `DEV_MODE = false` only when ready for live testing
- [ ] Skip-if-no-active-users logic confirmed working
- [ ] 3-run limit confirmed decrementing correctly in DB
- [ ] Seen Jobs deduplication confirmed (no repeat emails)
- [ ] Unsubscribe link working in emails

---

## Cost Summary (100 LinkedIn Users, 3 Runs Each)

| Service | Usage | Cost |
|---|---|---|
| Apify | ~3 real cycles total (batched) | ~$0 (free tier) |
| OpenAI GPT-4o-mini | Scoring all matches | ~$0.20 |
| OpenAI GPT-4o | ~600 proposals | ~$1.50 |
| Resend | ~900 emails | $0 (free tier) |
| Railway | Backend hosting | $5/mo |
| Vercel | Frontend | $0 |
| **Total** | | **~$7 total** |

---

## V2 Features (After Competition)

- Tone learning — deeper style matching from writing samples over time
- User feedback loop — mark jobs as Good/Bad Match to improve scoring
- Waitlist → paid Pro tier ($15–25/month)
- Slack / WhatsApp notification option
- Dashboard — view match history, proposal archive

---

*FreelanceRadar Development Roadmap v2 — April 2026*
