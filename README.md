# Artisan Brew POS

Modular browser-based coffee POS using HTML, CSS, JavaScript ES modules, Supabase Auth and PostgreSQL.

## Current status
This repository contains the initial frontend/deployment scaffold. The complete POS modules and end-to-end browser validation are still in progress. Do not use this scaffold for live sales until the remaining modules are integrated and tested.

## Technology
- HTML, CSS, JavaScript (ES modules)
- Supabase Auth and PostgreSQL
- Vercel or GitHub Pages for static hosting

## Setup
1. Create or open the Supabase project.
2. In **Project Settings → API Keys**, copy the publishable key.
3. Put it in `js/config/supabase.js` where indicated. Never put a service-role key in browser code.
4. Confirm the database schema and migrations are deployed.
5. Serve this folder over HTTP (for example, VS Code Live Server). Do not open `index.html` directly with `file://`.
6. Open the site and sign in with an account already provisioned in Supabase Auth and assigned an application role.

## Deployment
- **GitHub Pages:** repository Settings → Pages → Source: GitHub Actions. The included workflow deploys the repository root.
- **Vercel:** import this repository, select Framework Preset **Other**, leave Build Command empty, and set Output Directory to `.`.

## Supabase Auth URLs
In Supabase Authentication URL Configuration, add the exact production site URL and local development URL to the allowed redirect URLs. For GitHub Pages, include the project path:
`https://YOUR-USERNAME.github.io/REPOSITORY-NAME/**`

## Security
- Keep Row Level Security enabled.
- Use only the Supabase publishable/anon key in browser code.
- Never commit service-role keys, database passwords, or private credentials.
- Public registration must not grant the Admin role automatically.
