import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.email_service import send_job_email

import schedule
import time
from database import SessionLocal
from models import User, Profile, SeenJob
from services.apify_service import fetch_recent_jobs
from services.ai_service import (
    score_job_for_user,
    summarize_job,
    generate_proposal,
    recommend_portfolio
)
from datetime import datetime

SCORE_THRESHOLD = 70


def get_active_users(db):
    return (
        db.query(User)
        .join(Profile, User.id == Profile.user_id)
        .filter(Profile.is_active == True)
        .filter(Profile.runs_used < Profile.runs_limit)
        .all()
    )


def get_profile(db, user_id):
    return db.query(Profile).filter(Profile.user_id == user_id).first()


def is_job_seen(db, user_id, job_id):
    return db.query(SeenJob).filter(
        SeenJob.user_id == user_id,
        SeenJob.job_id == job_id
    ).first() is not None


def mark_job_seen(db, user_id, job_id):
    seen = SeenJob(user_id=user_id, job_id=job_id)
    db.add(seen)
    db.commit()


def build_profile_dict(user, profile):
    return {
        "name": user.name,
        "email": user.email,
        "skills": profile.skills or [],
        "niche": profile.niche,
        "experience_level": profile.experience_level,
        "preferred_rate_min": profile.preferred_rate_min,
        "preferred_rate_max": profile.preferred_rate_max,
        "keywords_include": profile.keywords_include or [],
        "keywords_exclude": profile.keywords_exclude or [],
        "tone_summary": profile.tone_summary,
        "portfolio": profile.portfolio or []
    }


def process_user(user, profile, jobs, db):
    profile_dict = build_profile_dict(user, profile)
    emails_to_send = []

    for job in jobs:
        job_id = job.get("id", "")

        # Skip if already seen
        if is_job_seen(db, user.id, job_id):
            continue

        # Score the job
        result = score_job_for_user(job, profile_dict)
        score = result.get("score", 0)
        reasons = result.get("reasons", [])

        print(f"  [{user.email}] {job['title'][:40]} → Score: {score}")

        if score >= SCORE_THRESHOLD:
            # Generate proposal and summary
            summary = summarize_job(job)
            proposal = generate_proposal(job, profile_dict, reasons)
            portfolio_picks = recommend_portfolio(job, profile_dict["portfolio"])

            emails_to_send.append({
                "job": job,
                "score": score,
                "reasons": reasons,
                "summary": summary,
                "proposal": proposal,
                "portfolio_picks": portfolio_picks
            })

        # Mark job as seen regardless of score
        mark_job_seen(db, user.id, job_id)

    return emails_to_send


def run_cycle():
    print(f"\n{'='*50}")
    print(f"Cron cycle started: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")

    db = SessionLocal()

    try:
        # Step 1: Check for active users
        active_users = get_active_users(db)
        print(f"Active users: {len(active_users)}")

        if not active_users:
            print("No active users — skipping Apify call")
            return

        # Step 2: ONE shared Apify call for all users
        print("Fetching jobs...")
        jobs = fetch_recent_jobs()
        print(f"Jobs fetched: {len(jobs)}")

        if not jobs:
            print("No jobs returned — ending cycle")
            return

        # Step 3: Process each user
        for user in active_users:
            profile = get_profile(db, user.id)
            if not profile:
                continue

            print(f"\nProcessing: {user.email}")
            matches = process_user(user, profile, jobs, db)

            if matches:
                print(f"  → {len(matches)} match(es) found — sending email")
                
                for m in matches:
                    print(f"  → MATCH: {m['job']['title']} (Score: {m['score']})")
                    print(f"  → Sending email to {user.email} for job: {m['job']['title']}")
                    send_job_email(
                        to_email=user.email,
                        user_name=user.name,
                        job=m["job"],
                        score=m["score"],
                        summary=m["summary"],
                        reasons=m["reasons"],
                        proposal=m["proposal"],
                        portfolio_picks=m["portfolio_picks"],
                        runs_used=profile.runs_used + 1,
                        runs_limit=profile.runs_limit
                    )

            # Increment run counter
            profile.runs_used += 1
            if profile.runs_used >= profile.runs_limit:
                profile.is_active = False
                print(f"  → {user.email} has used all {profile.runs_limit} runs — deactivated")

            db.commit()

    except Exception as e:
        print(f"Cron cycle error: {e}")
        import traceback
        traceback.print_exc()

    finally:
        db.close()

    print(f"Cycle complete: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    print('='*50)


# Run once immediately + schedule every 30 mins
if __name__ == "__main__":
    print("FreelanceRadar Cron Engine starting...")
    run_cycle()  # run immediately on start

    schedule.every(30).minutes.do(run_cycle)
    print("Scheduler running — next cycle in 30 minutes")

    while True:
        schedule.run_pending()
        time.sleep(60)