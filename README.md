# School Timetable Organiser

A private, owner-only timetable and lesson-planning application for teachers. It combines Today, Day/Week/Fortnight timetable views, lesson planning and history, academic-calendar overlays, reusable day templates, recurring commitments, and one-off events.

## Architecture

- Next.js 16 and React 19, using JavaScript and CSS
- PostgreSQL as the source of truth
- Drizzle ORM and ordered SQL migrations
- Auth.js with Google OpenID Connect and database sessions
- GitHub-to-Railway deployment

Every organiser request resolves the authenticated user on the server. Domain queries and mutations are scoped to that user or to an owned parent record.

## Environment

Production requires these variable names:

```text
DATABASE_URL
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
INITIAL_OWNER_EMAIL
AUTH_TRUST_HOST=true
```

`INITIAL_OWNER_EMAIL` is the single verified Google account allowed into v1. Google OAuth needs the production redirect URI `https://YOUR_HOST/api/auth/callback/google`. `AUTH_URL` is not required by the current Railway configuration because Auth.js trusts the forwarded production host; retain it if an existing deployment needs an explicit canonical URL.

Never commit real values. Local `.env*` files are ignored, except for `.env.example`.

## Local development

```bash
npm install
npm run db:migrate
npm run dev
```

The optional `npm run db:seed` command is only for an empty or disposable development database. **Never run it against a populated production database.**

Useful checks:

```bash
npm run lint
npm run build
npm run db:generate
npm run db:check
npm audit
```

## Railway deployment

Connect the GitHub repository to Railway and configure:

- Pre-deploy command: `npm run db:migrate`
- Start command: `npm start`
- Healthcheck path: `/api/health/database`

The migration command must complete successfully before the new application deployment starts. Do not add a production seed or reset command. Organiser state lives in PostgreSQL; the web service requires no persistent filesystem volume.

## Backup and export

PostgreSQL backup is the primary disaster-recovery mechanism. In Railway, configure scheduled backups or point-in-time recovery from the PostgreSQL service's **Backups** tab, and trigger a manual backup before risky migrations or releases. Railway restores backups into recoverable/staged infrastructure for review before deployment; follow Railway's current [backup](https://docs.railway.com/volumes/backups) or [point-in-time recovery](https://docs.railway.com/volumes/point-in-time-recovery) procedure.

Settings also provides **Export Organiser Data**, an owner-authenticated JSON download containing organiser-domain records and raw Markdown plans. It excludes Auth.js accounts, sessions, OAuth tokens, cookies, and environment secrets. This export supports portability and support snapshots, but it is not a PostgreSQL dump and v1 has no JSON import or automated restore.

## Release checklist

1. Take or verify a current Railway PostgreSQL backup.
2. Run lint, build, schema generation, database check, audit, and `git diff --check`.
3. Deploy with `npm run db:migrate` as the Railway pre-deploy command.
4. Complete the authenticated desktop/mobile smoke test, including existing lesson persistence and JSON export inspection.
5. Confirm sign-out, denied-account behavior, restart persistence, and healthcheck behavior.

## Intentional v1 limitations

- One configured owner; no sharing, invitations, roles, or multi-teacher access
- Google is authentication-only; no Calendar, Classroom, Gmail, or Drive integration
- Lesson movements remain on the same date
- Historical lesson views can reflect current template bell metadata
- No JSON import
- No arbitrary event recurrence outside recurring timetable items
- No notifications, global search, analytics, AI, or student records
