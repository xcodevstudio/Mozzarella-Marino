# Mozzarella Marino

Landing page for **Mozzarella Marino** — small-batch, handmade Italian cheese.

Static site (HTML + CSS + vanilla JavaScript) with a single Vercel serverless function that delivers contact-form submissions via [Resend](https://resend.com).

---

## Tech stack

- HTML / CSS / vanilla JavaScript — no framework, no build step
- Vercel hosting + serverless functions
- Resend API for transactional email
- Fonts: Cinzel + Montserrat (self-hosted), Playfair Display (Google Fonts)
- Fully responsive (mobile, tablet, desktop)

## Project structure

```
.
├── api/
│   └── contact.js         # Serverless function — receives POST, sends email via Resend
├── css/
│   └── styles.css         # All styles, mobile-first
├── js/
│   └── main.js            # Form handling, mobile menu, scroll reveals
├── assets/
│   ├── fonts/             # Cinzel, Montserrat, Montserrat-Arabic
│   ├── images/            # Products, food, mascot, floating decorations
│   └── logo/              # Brand SVG logo
├── index.html             # Landing page
├── package.json
├── vercel.json
├── .env.example
├── .gitignore
└── README.md
```

## Local development

### Quick static preview (no email backend)

```powershell
python -m http.server 8765
```

Open <http://localhost:8765>. The contact form will fail (no API) but everything else works.

### Full preview with working contact form

```powershell
npm install
npm install -g vercel
copy .env.example .env.local
# Edit .env.local with your Resend API key
vercel dev
```

Open <http://localhost:3000>. Form submissions will be delivered to the configured inbox.

## Environment variables

Required in Vercel (Settings → Environment Variables) and locally in `.env.local`:

| Variable             | Required | Description                                                                                          |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`     | Yes      | API key from <https://resend.com/api-keys>                                                           |
| `CONTACT_TO_EMAIL`   | Yes      | Inbox that receives form submissions (e.g. `marco.m@marinomozzarella.com`)                           |
| `CONTACT_FROM_EMAIL` | No       | Sender address on a verified Resend domain. Defaults to `onboarding@resend.dev` for testing only.    |

## Deployment

1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Add the three environment variables above.
4. Connect a custom domain in Vercel (Settings → Domains).
5. Every push to `main` auto-deploys.

## Email setup (Resend)

1. Sign up at <https://resend.com>.
2. Add and verify the brand domain — Resend supplies 2–3 DNS records to add (in Vercel's DNS panel if the domain is hosted there).
3. Create an API key → set as `RESEND_API_KEY`.
4. Set `CONTACT_FROM_EMAIL` to an address on the verified domain (e.g. `contact@marinomozzarella.com`).
5. Set `CONTACT_TO_EMAIL` to the client's inbox — works with any provider (Gmail, Zoho, Outlook, etc.).

For testing before domain verification, leave `CONTACT_FROM_EMAIL` unset to use Resend's shared `onboarding@resend.dev` sender (emails may land in spam — not for production use).

## Brand assets

Original design source files live alongside the project locally (`Fonts/`, `Website Content/`) but are gitignored — only optimized, production-ready copies in `assets/` are committed.

---

Built with care.
