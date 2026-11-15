# [ARCH-03] Top-Level Database Connection at Module Scope Breaks Builds and Edge Runtimes

- **Severity:** Medium (P2 / Level 2)
- **Labels:** `architecture`, `build`, `database`
- **Affected File:** `lib/auth/auth.ts` (Lines 8–11)
- **Related Files:** `lib/db.ts` (Lines 20–50), `proxy.ts` (Lines 1–2)

---

## Description
`lib/auth/auth.ts` executes an immediate, top-level `await connectDB()` and MongoDB client extraction at the module root:
```ts
const mongooseInstance = await connectDB();
const client = mongooseInstance.connection.getClient();
const db = client.db();
```
In Next.js, importing `auth.ts` during build time (e.g. `next build` analyzing routes or static optimization) forces an immediate network connection to MongoDB. If `MONGODB_URI` is not reachable (common in CI/CD, build containers, or staging environments), the build fails. Furthermore, top-level async initialization at module scope risks socket leaks and blocks lazy connection management.

## Steps to Reproduce
1. Unset `MONGODB_URI` in `.env.local` or provide an unreachable test connection string.
2. Run `npm run build`.
3. The build process immediately halts with an unhandled database connection error during route analysis.

## Root Cause Analysis
Top-level await at module scope executes on initial import:
```ts
const mongooseInstance = await connectDB();
const client = mongooseInstance.connection.getClient();
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  ...
});
```
Any file that imports `auth` (including `app/api/auth/[...all]/route.ts`, server actions, or middleware) forces this connection to run synchronously with module loading rather than lazily when requests arrive.

## Recommended Fix
1. Better Auth supports passing a database connection getter or connecting lazily. If using MongoDB directly with Better Auth's adapter, initialize the MongoDB client instance without top-level module blocking:
   ```ts
   import { MongoClient } from "mongodb";

   const client = new MongoClient(process.env.MONGODB_URI!);
   const db = client.db();

   export const auth = betterAuth({
     database: mongodbAdapter(db, { client }),
     ...
   });
   ```
2. Avoid top-level `await connectDB()` across module roots so that database connections remain managed within request lifecycles.
