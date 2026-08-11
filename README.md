# STUDYLINE — QCAA Study Platform

Single-user study platform for Year 12 QCAA General: Mathematical Methods, Biology,
Psychology, English, Physical Education. Spaced repetition, progressive topic
unlocking, RAG tracking, an AI tutor, past-paper marking, and a recommendation
engine that tells you what to study each day.

Runs entirely on your own machine. No cloud, no hosting, no account.

See `PROGRESS.md` for build status.

## Stack

- Next.js (App Router) + TypeScript
- SQLite via Prisma — one file, `prisma/dev.db`
- Local passphrase sign-in (scrypt hash in `data/local-auth.json`)
- Tailwind CSS + shadcn/ui
- TanStack Query

## Running it

1. `npm install`
2. Copy `.env.example` to `.env.local`, then set `APP_SESSION_SECRET`:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. `npx prisma migrate dev`
4. `npm run dev` → http://localhost:3000

On first visit you'll be asked to create a passphrase. That's stored only on
this machine and is never sent anywhere.

## Using it on your laptop too

There are two ways, and they are **not** equivalent — pick deliberately.

### 1. Over your home network (recommended)

The database stays on this machine; the laptop just opens it in a browser.
One copy of your data, nothing to sync, nothing to lose.

```
npm run share
```

prints the address, e.g. `http://DESKTOP-QO36PJN:3000`. Open that on the
laptop while this machine is running `npm run dev`, sign in with the same
passphrase, and everything is there — same cards, same schedule, same
ratings, live.

Prefer the **name** over the numeric address: your router hands out IPs by
DHCP, so the number can change after a reboot.

Nothing is exposed to the internet. This only works for devices on the same
Wi-Fi, and there's no port forwarding involved.

Requires: this machine on, dev server running, both devices on the same
network.

### 2. Copy it across (for when this machine is off)

```
npm run backup
```

writes a timestamped bundle to `../STUDYLINE-backups/` containing the whole
database, your uploads, your passphrase, and a portable `export.json`. Copy
that folder to the laptop, then there:

```
npm install
npm run restore -- "<path to the bundle>"          # dry run, reports only
npm run restore -- "<path to the bundle>" --write  # actually restores
```

**The catch:** this gives you two independent copies. Study on both and they
drift apart with no way to merge — whichever you restore from next silently
wins and the other machine's work is gone. Use this for backups and for
moving machines, not as a substitute for option 1.

`restore` moves any existing database aside to `dev.db.replaced-<timestamp>`
rather than deleting it, so a restore run by mistake is recoverable.

### Why not put the folder in OneDrive/Drive?

You can, but don't run the app from two machines against a synced SQLite
file. Cloud sync copies the file whole and has no idea a database is
mid-write; two machines open on it, or one sync landing at the wrong moment,
corrupts it. Sync the **backup bundles** instead — those are snapshots, and
snapshots are safe to sync.

## Checking it still works on a phone

```
npm run audit:mobile            # needs `npm run dev` running
npm run audit:mobile -- --shot  # also saves full-page screenshots
```

Loads 12 pages at a real 390×844 viewport and fails on horizontal overflow,
overlapping text, or any tap target under 24px — naming the element in each
case. Worth running after any layout change; it catches things that look
fine on a 2560px monitor.

## Backups

`npm run backup` any time. The bundle covers all 27 user-scoped tables —
cards, scheduling, review history, RAG ratings, mistakes, lessons, calendar,
timetable, past papers, uploads.

`src/lib/export.test.ts` reads `schema.prisma` and fails if a user-scoped
model exists that the export doesn't cover. That test exists because the
export previously dropped four tables silently — the entire Mistake Folder,
every written lesson, the mapped videos and the daily question sets — which
is the worst way for a backup to be wrong.

There's also a `GET /api/export` route for a JSON download from the browser.

## Config-driven values

Nothing that should be tunable lives hardcoded in components. See:

- `config/subjects.ts` — subject priority weights
- `config/srs.ts` — SM-2 defaults, daily caps, leech threshold
- `config/recommendation.ts` — priority-score coefficients
- `config/rag.ts` — stale-green decay window, mastery thresholds
- `config/mistakes.ts` — mistake categories and their repairs
- `config/diagrams.ts` — ids of the diagrams lessons may embed
