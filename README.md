[README.md](https://github.com/user-attachments/files/26247045/README.md)
# Metro Detroit School Compare

This starter project includes:
- a responsive front-end for comparing public and private high schools
- client-side review submission for local testing
- a dispute-email workflow
- a scheduled ETL scaffold for refreshing public data and enriching destination-college outcomes
- serverless endpoint templates for production review/dispute handling

## Local preview

Open `index.html` in a static server. For example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Suggested production architecture

- **Front-end**: static hosting (Cloudflare Pages, Netlify, Vercel, GitHub Pages)
- **Reviews**: database-backed endpoint with moderation and rate limiting
- **Disputes**: serverless function that sends email or creates a support ticket
- **Auto-update**: GitHub Action or cron job that runs `scripts/update_data.py`
- **Private school data**: admin upload workflow for annual school profiles / PDFs / manually verified fields

## Important modeling notes

1. Public-school metrics are usually more standardized than private-school metrics.
2. College destination lists are often school-reported for private schools.
3. Earnings should be attributed to postsecondary institutions or fields of study, not directly to a high school, unless you have a separate verified dataset.
4. Trade-school/workforce rates are often incomplete unless a school or state reports them explicitly.

## Files

- `index.html` – UI shell
- `styles.css` – styling
- `app.js` – filtering, comparison, charts, reviews, dispute-email behavior
- `data/schools.sample.json` – seeded demo data
- `scripts/update_data.py` – ETL scaffold
- `.github/workflows/update-data.yml` – scheduled refresh job template
- `functions/submit-review.js` – example review endpoint
- `functions/submit-dispute.js` – example dispute endpoint
