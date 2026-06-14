# JobVault

A better way to track your job search. JobVault is a clean, Kanban-style job
application tracker — capture every opportunity, drag it through each stage of
your search, and keep notes, salaries, links, and tags for each role in one
focused workspace.

Built with Next.js 16, React 19, Tailwind CSS v4, MongoDB, and a monochrome,
Vercel-inspired UI.

---

## Features

- 🗂️ **Kanban board** — five default stages (Wish List, Applied, Interviewing,
  Offer, Rejected) with a card per application.
- 🖱️ **Drag & drop** — reorder cards within a column or move them between
  columns, powered by `@dnd-kit`.
- ✏️ **Full CRUD** — create, edit, move, and delete applications, each with
  company, position, location, salary, job URL, tags, description, and notes.
- 🔐 **Email/password auth** — secure sessions via `better-auth`.
- 🪄 **Auto-provisioned board** — every new account gets a "Job Hunt" board with
  the default columns, and the dashboard self-heals if columns are ever missing.
- 🎨 **Modern UI** — accessible Radix primitives, shadcn/ui components, a
  monochrome design system, and responsive layouts.
- 🌱 **Seed script** — populate a demo board with sample applications in seconds.

---

## Tech stack

| Area            | Technology                                            |
| --------------- | ----------------------------------------------------- |
| Framework       | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI library      | [React 19](https://react.dev)                         |
| Styling         | [Tailwind CSS v4](https://tailwindcss.com)            |
| Components       | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) |
| Icons           | [lucide-react](https://lucide.dev)                    |
| Drag & drop     | [@dnd-kit](https://dndkit.com)                        |
| Auth            | [better-auth](https://www.better-auth.com)            |
| Database        | [MongoDB](https://www.mongodb.com) via [Mongoose](https://mongoosejs.com) |
| Language        | [TypeScript](https://www.typescriptlang.org)          |

---

## Getting started

### Prerequisites

- **Node.js** 20.9+ (required by Next.js 16)
- A **MongoDB** database — a free [MongoDB Atlas](https://www.mongodb.com/atlas)
  cluster works well, or a local `mongod` instance.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
# MongoDB connection string (include the database name at the end)
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>

# A long random secret used to sign sessions (e.g. `openssl rand -base64 32`)
BETTER_AUTH_SECRET=replace-with-a-secure-random-string

# Base URL of the app
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Optional: only used by the seed script (see "Seeding demo data")
SEED_USER_ID=
```

| Variable                      | Required | Description                                                  |
| ----------------------------- | -------- | ------------------------------------------------------------ |
| `MONGODB_URI`                 | ✅       | MongoDB connection string, with the target database name.    |
| `BETTER_AUTH_SECRET`          | ✅       | Secret used by better-auth to sign sessions.                 |
| `BETTER_AUTH_URL`             | ✅       | Server-side base URL of the app.                             |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | ✅       | Client-side base URL of the app.                             |
| `SEED_USER_ID`                | ⚙️       | User id to seed/clear demo data for. Only read by the seed script. |

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and
you'll be redirected to your dashboard with an empty board ready to use.

---

## Available scripts

| Script              | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Start the development server (Turbopack).                |
| `npm run build`     | Create an optimized production build.                    |
| `npm run start`     | Run the production build.                                |
| `npm run lint`      | Lint the codebase with ESLint.                           |
| `npm run seed:jobs` | Seed sample job applications (see below).                |

---

## Seeding demo data

The seed script populates a user's board with 15 sample applications spread
across all five columns.

> ⚠️ The seed script **deletes the target user's existing job applications**
> before inserting samples — treat it as "reset to demo data."

1. Sign up / sign in so the user (and their board) exist.
2. Find your user id — it's the `_id` of your document in the `user` collection:
   ```js
   db.user.findOne({ email: "you@example.com" }, { _id: 1 })
   ```
3. Set it in `.env.local`:
   ```bash
   SEED_USER_ID=<your-user-id>
   ```
4. Run the seed:
   ```bash
   npm run seed:jobs
   ```

---

## Project structure

```
job-application-tracker/
├── app/
│   ├── api/auth/[...all]/route.ts   # better-auth route handler
│   ├── dashboard/page.tsx           # Kanban dashboard (auth-protected)
│   ├── sign-in/page.tsx             # Sign-in page
│   ├── sign-up/page.tsx             # Sign-up page
│   ├── layout.tsx                   # Root layout + navbar + metadata
│   ├── page.tsx                     # Marketing landing page
│   └── globals.css                  # Design tokens & global styles
├── components/
│   ├── ui/                          # shadcn/ui primitives (button, card, dialog, …)
│   ├── kanban-board.tsx             # Board + drag-and-drop logic
│   ├── job-application-card.tsx     # Application card + edit dialog
│   ├── create-job-dialog.tsx        # "Add application" dialog
│   ├── navbar.tsx                   # Top navigation
│   ├── hero-cta.tsx                 # Auth-aware landing CTA
│   └── image-tabs.tsx               # Landing feature tabs
├── lib/
│   ├── actions/job-applications.ts  # Server actions (create/update/delete)
│   ├── auth/                        # better-auth server & client config
│   ├── hooks/useBoards.ts           # Client-side board state + optimistic moves
│   ├── models/                      # Mongoose schemas (Board, Column, JobApplication)
│   ├── db.ts                        # Cached Mongoose connection
│   ├── init-user-board.ts           # Creates/backfills a user's default board
│   └── utils.ts                     # `cn` class helper
├── scripts/seed.ts                  # Demo data seeder
└── public/hero-images/              # Landing screenshots
```

---

## Data model

```
Board (1) ──< Column (many) ──< JobApplication (many)
```

- **Board** — `{ name, userId, columns[] }`. One "Job Hunt" board per user.
- **Column** — `{ name, order, boardId, jobApplications[] }`. The five stages.
- **JobApplication** — `{ company, position, location, salary, jobUrl, tags[],
  description, notes, status, order, columnId, boardId, userId }`.

On sign-up, a `databaseHooks.user.create.after` hook calls
`initializeUserBoard`, which creates the board and its default columns. The
dashboard also self-heals: if a board or its columns are missing, it backfills
them on load.

---

## How it works

- **Auth** — `better-auth` with the MongoDB adapter handles email/password
  sign-up, sign-in, and sessions. The dashboard redirects unauthenticated users
  to `/sign-in`.
- **Server actions** — all writes (create/update/delete/move) run as server
  actions in `lib/actions/job-applications.ts`, which verify ownership and call
  `revalidatePath('/dashboard')`.
- **Drag & drop** — `kanban-board.tsx` computes the target column and order on
  drop, optimistically updates local state via `useBoard`, and persists the
  move with `updateJobApplication`.

---

## Deployment

JobVault deploys cleanly to [Vercel](https://vercel.com):

1. Push the repo to a Git provider and import it into Vercel.
2. Add the environment variables from `.env.local` to the project settings
   (set `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` to your production
   domain).
3. Ensure your MongoDB cluster allows connections from Vercel (e.g. allowlist
   `0.0.0.0/0` on Atlas, or use a private connection).
4. Deploy.

---

## License

This project is provided as-is for personal and educational use.
