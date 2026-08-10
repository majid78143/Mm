# MJ DEVELOPER — Premium Custom Development Studio

## Setup

```bash
npm install
cp .env.example .env
# edit .env: set ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET
npm start
```

Visit `http://localhost:3000`.

Firebase config is already filled into `.env.example` from your project
(`connecto-5814d`) — copy it into `.env` as-is, or replace with different
values later. These are public Web SDK values, safe to ship to the browser.

## Firebase Console setup (one-time, in the Firebase project)

1. Authentication → Sign-in method → enable **Email/Password** and **Google**.
2. Authentication → Settings → Authorized domains → add your live domain when you deploy.
3. Realtime Database → create the database (production mode).
4. Realtime Database → Rules → paste the contents of `database.rules.json`.
5. (Optional) Storage → enable, for profile photos later.

## What's built in this pass

- **Homepage** (`templates/index.html`) — full premium design: cinematic hero,
  animated trust counters, interactive service explorer, project-fit checker,
  scroll-driven 5-step process, work showcase, reviews, footer with legal
  modals and admin-editable contact/social placeholders.
- **Customer login** (`templates/login.html` + `static/auth.js`) — Google
  sign-in, username-or-email + password sign-in (with a `usernames/` →
  Firebase-email mapping in Realtime Database, since Firebase Auth itself
  only supports email/password), registration, and forgot-password.
- **Admin login** (`templates/admin-login.html`) — separate page, checked
  server-side against `ADMIN_EMAIL` / `ADMIN_PASSWORD` env variables (not a
  Firebase account). A signed session cookie is issued on success.
- **Admin dashboard shell** (`templates/admin-dashboard.html`) — stat cards,
  new-requests panel, activity panel, wired to read live counts from
  Realtime Database. Full order management, messaging, delivery and Private
  Page manager UIs are the next build phase.
- **Customer dashboard shell** (`templates/dashboard.html`) — placeholder
  landing spot after login; the full project list/order wizard is next.
- **Legal pages**: `/privacy`, `/terms`, `/refund-policy`, `/payment-delivery`
  — presentation-ready summaries, flagged for jurisdiction-specific legal
  review before launch.
- **Error pages**: 403 / 404 / 429 / 500 / 503, styled to match the brand.
- **Security rules** (`database.rules.json`) — users can only read/write
  their own profile, orders and notifications; `settings`/`services` are
  public-read/admin-write only; `adminData` and private-page content are
  locked from direct client access.

## Important security note — admin writes

Because admin login is **not** a Firebase account (it's an env-variable
check), the admin panel cannot write to Realtime Database using the
client-side rules above — those rules only trust Firebase-authenticated
users. To let the admin manage orders, private pages, settings, etc., the
next phase should add authenticated **server routes** (protected by
`requireAdmin` in `server.js`) that use the **Firebase Admin SDK** with a
service account key on the server. That key must never be shipped to the
browser or committed to source control — store it as an environment
variable / secret file outside the repo.

## Not yet built (next phase, per the full spec)

- Full order wizard (multi-step: project type → requirements → advanced
  questions → review → submit) with file attachments.
- Order tracking timeline + status history on the customer side.
- Admin order detail page (accept/reject/notes/price/deadline/status/URLs).
- Customer ↔ admin project messaging (text, files, images, read state).
- Private HTML Pages system (upload, access-key gate, admin auto-preview).
- Notification center (customer + admin, real-time listeners).
- Profile editing (photo, bio, username, social links, security).
- Admin settings screens (branding, services, contact/social, maintenance mode).

Ask for any of these next and they'll be built into this same structure —
no folder reorganization needed.
