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


## Final system testing checklist

Run these tests in a non-production/demo dataset before using the POS for real transactions.

| Test | Expected result |
|---|---|
| Admin login | Admin can access all administration pages |
| Manager login | Manager can access management pages but not user administration |
| Cashier login | Cashier can access POS and permitted sales functions only |
| Product creation | Product is saved and appears in the catalogue |
| Stock adjustment | Inventory and stock movement update together |
| POS checkout | Sale, sale items, payment and inventory deduction commit together |
| Receipt | Invoice number, item lines, tax and total match the saved sale |
| VAT | Inclusive and exclusive tax calculations match the configured rules |
| Sales report | Date range returns the matching saved sales |
| CSV export | CSV opens in spreadsheet software and values are correctly escaped |
| Unauthorized access | Disallowed operations are rejected by RLS/database functions |

### Test setup prerequisites

1. Create an Auth user for each role using Supabase Authentication.
2. Confirm each user has an active row in public.users.
3. Assign roles in public.user_roles using the matching public.roles.id.
4. Create at least one active branch, category and product.
5. Add opening stock using the inventory adjustment function.
6. Configure a test VAT rate; do not assume a sample rate is a Cambodian statutory rate.
7. Run a small-value test checkout and verify sales, sale_items, payments, stock_movements and sale_tax_details.
8. Remove or void test transactions according to the business's audit policy; do not directly delete financial records from production.

### Security and deployment notes

- Keep Row Level Security enabled.
- Never place a Supabase service_role or secret key in frontend code.
- The browser may use only the project's public publishable key.
- GitHub Pages requires the repository owner/admin to enable Settings → Pages → Build and deployment → Source: GitHub Actions. The workflow cannot enable Pages with its current GitHub Actions token permissions.
- GitHub Pages publishes this repository as a public static website. Do not store credentials, customer secrets, or private data in the repository.
