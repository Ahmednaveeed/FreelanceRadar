import os
import json
from dotenv import load_dotenv

load_dotenv()

DEV_MODE = os.getenv("DEV_MODE", "true").lower() == "true"
APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN")

def fetch_recent_jobs(keywords: list = None) -> list:
    """
    Fetch recent Upwork jobs.
    In DEV_MODE: reads from mock_jobs.json
    In PROD: calls Apify actor
    """
    if DEV_MODE:
        print("DEV_MODE: Loading mock jobs from file")
        mock_path = os.path.join(os.path.dirname(__file__), '..', 'mock_jobs.json')
        with open(mock_path, 'r') as f:
            return json.load(f)

    # PRODUCTION — real Apify call
    try:
        from apify_client import ApifyClient
        client = ApifyClient(APIFY_API_TOKEN)

        run_input = {
            "maxResults": 10,
            "publishedDate": "last30Minutes"
        }

        print("Calling Apify — fetching recent Upwork jobs...")
        run = client.actor("apify/upwork-scraper").call(run_input=run_input)

        jobs = []
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            jobs.append(item)

        print(f"Apify returned {len(jobs)} jobs")
        return jobs

    except Exception as e:
        print(f"Apify error: {e}")
        return []