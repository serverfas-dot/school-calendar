# School Calendar — Digital Academic Planner

A live digital school calendar with an analog clock, monthly calendar, and academic event dates.
Designed to be embedded in Google Sites via an iframe.

## Features

- **Display page** (default): Live clock, monthly calendar with event markers, and upcoming dates list. No clickable areas — clean for embedding.
- **Admin panel** (`#admin`): Sign in to add, edit, and remove calendar dates. Protected by Supabase authentication.

## Deploy to GitHub Pages

### 1. Create a GitHub repository

Create a new repository (e.g. `school-calendar`) and push this code to the `main` branch.

### 2. Add repository secrets

Go to **Settings > Secrets and variables > Actions > New repository secret** and add these two secrets:

| Secret name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://zbngbzoedqexvydplnpn.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpibmdiem9lZHFleHZ5ZHBsbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwODAwODcsImV4cCI6MjEwNjY1NjA4N30.Iu1xUOJ9kR6npbCZ4J4RqQo959S7Wu1s4FEn3nPl4oM` |

### 3. Enable GitHub Pages

Go to **Settings > Pages > Build and deployment** and set **Source** to **GitHub Actions**.

### 4. Auto-deploy

Every push to `main` triggers the workflow in `.github/workflows/deploy.yml`, which builds the site and deploys it to GitHub Pages automatically.

Your site will be live at: `https://YOUR_USERNAME.github.io/school-calendar/`

### 5. Access the admin panel

Open `https://YOUR_USERNAME.github.io/school-calendar/#admin` to sign in and manage calendar dates.

## Embed in Google Sites

1. In Google Sites, click **Insert > Embed**
2. Choose **By URL** and paste your GitHub Pages link
3. Resize the embed to fit your page layout

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (database + auth)
- GitHub Pages (hosting)
