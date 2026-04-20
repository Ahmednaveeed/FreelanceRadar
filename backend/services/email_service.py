import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

# Change this to your real email during testing
FROM_EMAIL = "FreelanceRadar <onboarding@resend.dev>"


def build_email_html(user_name: str, job: dict, score: int,
                     summary: str, reasons: list,
                     proposal: str, portfolio_picks: list,
                     runs_used: int, runs_limit: int) -> str:

    # Build budget string
    if job.get("budget"):
        budget_str = f"${job['budget']['amount']} Fixed"
    elif job.get("hourlyRate"):
        budget_str = f"${job['hourlyRate']['min']}–${job['hourlyRate']['max']}/hr"
    else:
        budget_str = "Not specified"

    # Build client stats
    client_spent = f"${job.get('clientTotalSpent', 0):,}"
    client_hire_rate = f"{job.get('clientHireRate', 0)}%"
    client_rating = job.get('clientRating', 'N/A')
    client_hires = job.get('clientTotalHires', 0)

    # Build requirements
    skills = ", ".join(job.get("skills", []))
    experience = job.get("experienceLevel", "Not specified").capitalize()
    duration = job.get("duration", "Not specified")
    contract = job.get("contractType", "Not specified").capitalize()

    # Build reasons bullets
    reasons_html = "".join([f"<li>{r}</li>" for r in reasons])

    # Build portfolio section
    portfolio_html = ""
    if portfolio_picks:
        portfolio_items = "".join([
            f'<li><strong>{p["title"]}</strong> — {p["reason"]} '
            f'<a href="{p.get("url", "#")}" style="color:#6366f1;">View</a></li>'
            for p in portfolio_picks
        ])
        portfolio_html = f"""
        <div style="background:#f8f9ff;border-left:3px solid #6366f1;padding:12px 16px;margin:16px 0;border-radius:4px;">
            <p style="margin:0 0 8px 0;font-weight:600;color:#374151;">📎 Recommended Portfolio Attachments</p>
            <ul style="margin:0;padding-left:20px;color:#374151;">{portfolio_items}</ul>
        </div>
        """

    # Run counter
    runs_remaining = runs_limit - runs_used
    run_bar = "🟢 " * runs_used + "⚪ " * runs_remaining

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;padding:20px;color:#1f2937;background:#f9fafb;">

  <!-- HEADER -->
  <div style="background:#ffffff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <p style="margin:0 0 4px 0;font-size:13px;color:#6b7280;">Hey {user_name}, we found a job match for you 👇</p>
    <h1 style="margin:0 0 12px 0;font-size:20px;color:#111827;">{job.get('title', '')}</h1>

    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <span style="background:#ecfdf5;color:#065f46;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">💰 {budget_str}</span>
      <span style="background:#eff6ff;color:#1e40af;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">⭐ {score}% Match</span>
    </div>
  </div>

  <!-- JOB SNAPSHOT -->
  <div style="background:#ffffff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <p style="margin:0 0 8px 0;font-weight:700;color:#374151;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">📋 What They Need</p>
    <p style="margin:0 0 20px 0;color:#374151;line-height:1.6;">{summary}</p>

    <p style="margin:0 0 8px 0;font-weight:700;color:#374151;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">👤 Client Stats</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <td style="padding:6px 8px;background:#f3f4f6;border-radius:4px;font-size:13px;">💵 <strong>{client_spent}</strong> total spent</td>
        <td style="padding:6px 8px;background:#f3f4f6;border-radius:4px;font-size:13px;">✅ <strong>{client_hire_rate}</strong> hire rate</td>
      </tr>
      <tr><td style="padding:4px;"></td><td style="padding:4px;"></td></tr>
      <tr>
        <td style="padding:6px 8px;background:#f3f4f6;border-radius:4px;font-size:13px;">⭐ <strong>{client_rating}</strong> rating</td>
        <td style="padding:6px 8px;background:#f3f4f6;border-radius:4px;font-size:13px;">🔁 <strong>{client_hires}</strong> total hires</td>
      </tr>
    </table>

    <p style="margin:0 0 8px 0;font-weight:700;color:#374151;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">📌 Requirements</p>
    <p style="margin:0;font-size:13px;color:#374151;">
      <strong>Level:</strong> {experience} &nbsp;|&nbsp;
      <strong>Skills:</strong> {skills} &nbsp;|&nbsp;
      <strong>Duration:</strong> {duration} &nbsp;|&nbsp;
      <strong>Type:</strong> {contract}
    </p>
  </div>

  <!-- WHY IT FITS -->
  <div style="background:#ffffff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <p style="margin:0 0 8px 0;font-weight:700;color:#374151;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">✅ Why This Fits You</p>
    <ul style="margin:0;padding-left:20px;color:#374151;line-height:1.8;">{reasons_html}</ul>
  </div>

  <!-- PROPOSAL -->
  <div style="background:#ffffff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <p style="margin:0 0 12px 0;font-weight:700;color:#374151;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">📝 Your Ready-To-Use Proposal</p>
    <div style="background:#f8f9ff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;line-height:1.8;color:#1f2937;white-space:pre-wrap;">{proposal}</div>
    {portfolio_html}
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin-bottom:16px;">
    <a href="{job.get('url', '#')}"
       style="background:#6366f1;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
      🔗 View Job on Upwork
    </a>
  </div>

  <!-- FOOTER -->
  <div style="background:#ffffff;border-radius:12px;padding:16px 24px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <p style="margin:0 0 6px 0;font-size:13px;color:#6b7280;">
      {run_bar}
    </p>
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Run {runs_used} of {runs_limit} used &nbsp;·&nbsp;
      <a href="#" style="color:#9ca3af;">Unsubscribe</a> &nbsp;·&nbsp;
      FreelanceRadar
    </p>
  </div>

</body>
</html>
"""


def send_job_email(to_email: str, user_name: str, job: dict, score: int,
                   summary: str, reasons: list, proposal: str,
                   portfolio_picks: list, runs_used: int, runs_limit: int) -> bool:
    try:
        html = build_email_html(
            user_name=user_name,
            job=job,
            score=score,
            summary=summary,
            reasons=reasons,
            proposal=proposal,
            portfolio_picks=portfolio_picks,
            runs_used=runs_used,
            runs_limit=runs_limit
        )

        response = resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to_email,
            "subject": f"⭐ {score}% Match: {job.get('title', 'New Job')} — FreelanceRadar",
            "html": html
        })

        print(f"Email sent to {to_email} | ID: {response.get('id', 'unknown')}")
        return True

    except Exception as e:
        print(f"Email send error: {e}")
        return False