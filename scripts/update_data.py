#!/usr/bin/env python3
"""Starter ETL for Metro Detroit School Compare.

This script is intentionally conservative:
- It treats Michigan public-school data and College Scorecard data as official inputs.
- It leaves placeholders for private-school profile ingestion, because those metrics are often
  published school by school rather than through one uniform statewide feed.
- It writes a normalized JSON file the front-end can consume.

Environment variables expected for a real deployment:
- COLLEGE_SCORECARD_API_KEY
- METRO_DETROIT_COUNTIES (comma-separated; default Oakland,Wayne,Macomb,Washtenaw)
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
OUTFILE = ROOT / "data" / "schools.generated.json"
COUNTIES = os.getenv("METRO_DETROIT_COUNTIES", "Oakland,Wayne,Macomb,Washtenaw").split(",")
SCORECARD_KEY = os.getenv("COLLEGE_SCORECARD_API_KEY", "")


@dataclass
class SchoolRecord:
    id: str
    name: str
    sector: str
    school_type: str
    county: str
    city: str
    enrollment: int | None = None
    sat_avg: int | None = None
    act_avg: float | None = None
    ap_courses: int | None = None
    ib_offered: bool | None = None
    ap_participation_pct: float | None = None
    ap_pass_pct: float | None = None
    college_4yr_pct: float | None = None
    college_2yr_pct: float | None = None
    trade_or_workforce_pct: float | None = None
    avg_class_size: float | None = None
    student_teacher_ratio: str | None = None
    tuition_usd: int | None = None
    acceptance_proxy: float | None = None
    top_colleges: list[str] | None = None
    data_quality: str = ""
    source_tier: str = "official"


def fetch_college_scorecard_colleges() -> dict[str, dict[str, Any]]:
    """Minimal example of pulling institution-level outcome fields.

    These college outcomes are best used to enrich destination colleges, not to infer earnings
    for a high school itself.
    """
    if not SCORECARD_KEY:
        print("COLLEGE_SCORECARD_API_KEY not set; skipping Scorecard fetch.")
        return {}

    url = "https://api.data.gov/ed/collegescorecard/v1/schools"
    params = {
        "api_key": SCORECARD_KEY,
        "fields": "id,school.name,latest.earnings.10_yrs_after_entry.median,latest.completion.rate_suppressed.overall",
        "per_page": 100,
    }
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    payload = response.json()
    return {
        item["school.name"]: {
            "scorecard_id": item.get("id"),
            "median_earnings_10yr": item.get("latest.earnings.10_yrs_after_entry.median"),
            "completion_rate": item.get("latest.completion.rate_suppressed.overall"),
        }
        for item in payload.get("results", [])
    }


def load_private_school_profiles() -> list[SchoolRecord]:
    """Replace this with a parser for school profile PDFs/HTML or a manual admin upload flow."""
    seed_path = ROOT / "data" / "schools.sample.json"
    if not seed_path.exists():
        return []
    with seed_path.open() as fh:
        raw = json.load(fh)
    return [SchoolRecord(**item) for item in raw if item.get("sector") == "Private"]


def fetch_public_school_records() -> list[SchoolRecord]:
    """Placeholder for a real Michigan public-school ingestion step.

    MI School Data is the primary system of record for Michigan school metrics. In a production
    build, replace this placeholder with either:
    1) an export job from MI School Data / Michigan open data if available, or
    2) a district-by-district normalized import.
    """
    seed_path = ROOT / "data" / "schools.sample.json"
    if not seed_path.exists():
        return []
    with seed_path.open() as fh:
        raw = json.load(fh)
    return [SchoolRecord(**item) for item in raw if item.get("sector") != "Private"]


def main() -> None:
    public_records = fetch_public_school_records()
    private_records = load_private_school_profiles()
    scorecard = fetch_college_scorecard_colleges()

    merged = public_records + private_records
    for school in merged:
        school.top_colleges = school.top_colleges or []
        # Example enrichment to show how destination colleges could be linked to federal outcomes.
        enriched = []
        for college in school.top_colleges:
          if college in scorecard:
              earnings = scorecard[college].get("median_earnings_10yr")
              enriched.append(f"{college} (${earnings:,}/10yr median)" if earnings else college)
          else:
              enriched.append(college)
        school.top_colleges = enriched

    OUTFILE.write_text(json.dumps([asdict(s) for s in merged], indent=2))
    print(f"Wrote {len(merged)} records to {OUTFILE}")


if __name__ == "__main__":
    main()
