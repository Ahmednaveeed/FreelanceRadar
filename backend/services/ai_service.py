import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def score_job_for_user(job: dict, profile: dict) -> dict:
    """
    Score how well a job fits a user profile.
    Uses GPT-4o-mini (cheap) — returns score 0-100 + reasons
    """
    # Build budget string
    if job.get("budget"):
        budget_str = f"${job['budget']['amount']} fixed"
    elif job.get("hourlyRate"):
        budget_str = f"${job['hourlyRate']['min']}–${job['hourlyRate']['max']}/hr"
    else:
        budget_str = "Not specified"

    prompt = f"""
You are a job matching assistant for freelancers.
Score how well this job fits this freelancer on a scale of 0-100.

FREELANCER PROFILE:
- Skills: {', '.join(profile.get('skills', []))}
- Niche: {profile.get('niche', '')}
- Experience level: {profile.get('experience_level', '')}
- Preferred rate: ${profile.get('preferred_rate_min', 0)}–${profile.get('preferred_rate_max', 999)}/hr or fixed
- Keywords to include: {', '.join(profile.get('keywords_include', []))}
- Keywords to exclude: {', '.join(profile.get('keywords_exclude', []))}

JOB LISTING:
- Title: {job.get('title', '')}
- Description: {job.get('description', '')}
- Budget: {budget_str}
- Required skills: {', '.join(job.get('skills', []))}
- Experience needed: {job.get('experienceLevel', '')}

Scoring rules:
- 80-100: Excellent match, skills align perfectly
- 60-79: Good match, most skills align
- 40-59: Partial match, some relevant skills
- 0-39: Poor match, skills don't align or excluded keywords present

Return ONLY valid JSON, nothing else:
{{"score": 85, "reasons": ["reason 1", "reason 2", "reason 3"]}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        result = json.loads(response.choices[0].message.content.strip())
        return result

    except Exception as e:
        print(f"Scoring error: {e}")
        return {"score": 0, "reasons": ["Scoring failed"]}


def generate_tone_summary(writing_samples: str) -> str:
    """
    One-time call when user signs up.
    Extracts writing style from samples — stored as tone_summary.
    """
    prompt = f"""
Analyze these freelancer proposal writing samples and describe their writing style 
in 3 concise sentences. Focus on: tone (formal/casual), sentence structure, 
how they open proposals, and how they present their skills.

WRITING SAMPLES:
{writing_samples}

Return only the 3-sentence style description, nothing else.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Tone extraction error: {e}")
        return "Professional and direct writing style."


def summarize_job(job: dict) -> str:
    """
    Summarize job description into 2-3 plain English lines.
    """
    prompt = f"""
Summarize this Upwork job in 2-3 sentences. Be plain and direct.
Focus on: what the client needs, key skills required, and deliverable.

JOB TITLE: {job.get('title', '')}
JOB DESCRIPTION: {job.get('description', '')}

Return only the summary, nothing else.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Summarization error: {e}")
        return job.get('description', '')[:200]


def generate_proposal(job: dict, profile: dict, match_reasons: list) -> str:
    """
    Generate a personalized proposal using GPT-4o.
    Uses tone_summary so it sounds like the user.
    """

    # Build budget string
    if job.get("budget"):
        budget_str = f"${job['budget']['amount']} fixed"
    elif job.get("hourlyRate"):
        budget_str = f"${job['hourlyRate']['min']}–${job['hourlyRate']['max']}/hr"
    else:
        budget_str = "Not specified"

    tone = profile.get('tone_summary') or "Professional, direct, and confident writing style."

    prompt = f"""
You are a professional proposal writer for Upwork freelancers.
Write a winning proposal that sounds EXACTLY like this specific freelancer wrote it.

FREELANCER:
- Name: {profile.get('name', 'the freelancer')}
- Skills: {', '.join(profile.get('skills', []))}
- Niche: {profile.get('niche', '')}
- Experience: {profile.get('experience_level', '')}
- Writing style: {tone}

JOB:
- Title: {job.get('title', '')}
- Description: {job.get('description', '')}
- Budget: {budget_str}

WHY THEY'RE A GOOD FIT:
{chr(10).join(f'- {r}' for r in match_reasons)}

STRICT RULES:
- Maximum 180 words
- Reference 1-2 SPECIFIC details from the job description
- Never use words: passionate, dedicated, hardworking, excited, perfect fit
- Do NOT start with "I am" or "My name is"
- Sound human — not like an AI wrote it
- End with a clear, specific call to action
- Match the freelancer's writing style exactly

Write only the proposal text, nothing else.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Proposal generation error: {e}")
        return "Proposal generation failed. Please try again."


def recommend_portfolio(job: dict, portfolio: list) -> list:
    """
    Pick top 1-3 portfolio items relevant to this job.
    Returns list of {title, url, reason}
    """
    if not portfolio:
        return []

    portfolio_text = "\n".join([
        f"- {item['title']}: {item['description']}"
        for item in portfolio
    ])

    prompt = f"""
A freelancer is applying for this job:
Title: {job.get('title', '')}
Skills needed: {', '.join(job.get('skills', []))}
Description summary: {job.get('description', '')[:300]}

Their portfolio projects:
{portfolio_text}

Pick the 1-3 most relevant portfolio projects to attach to this application.
For each, give a one-line reason why it's relevant.

Return ONLY valid JSON, nothing else:
[
  {{"title": "Project Name", "reason": "one-line reason why relevant"}},
  {{"title": "Project Name 2", "reason": "one-line reason"}}
]

If no projects are relevant, return an empty array: []
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        result = json.loads(response.choices[0].message.content.strip())
        # Add URL from original portfolio
        for item in result:
            match = next((p for p in portfolio if p['title'] == item['title']), None)
            if match:
                item['url'] = match.get('url', '')
        return result

    except Exception as e:
        print(f"Portfolio recommendation error: {e}")
        return []