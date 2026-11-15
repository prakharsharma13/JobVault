# [BUILD-01] Vercel Build Failure: Failed to collect page data for /dashboard and /api/auth/[...all]

- **Severity:** Critical (P0 / Build Blocker)
- **Labels:** `build`, `vercel`, `database`, `nextjs`
- **Affected Files:** `lib/auth/auth.ts` (Lines 8–11), `app/api/auth/[...all]/route.ts`, `app/dashboard/page.tsx`

---

## Description
Production deployments on Vercel fail during the `npm run build` phase with the following errors:
```
Error: querySrv ENOTFOUND _mongodb._tcp.cluster0.uk51f01.mongodb.net
Error: Failed to collect configuration for /dashboard
Error: Failed to collect page data for /api/auth/[...all]
Error: [BUILD_UTILS_SPAWN_1] Command "npm run build" exited with 1
```

Next.js 16 Turbopack build also reports:
`⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy`

## Root Cause Analysis
1. **Top-Level Database Evaluation:** `lib/auth/auth.ts` executes `const mongooseInstance = await connectDB();` at the module root. When Next.js analyzes `/api/auth/[...all]` and `/dashboard` during static page data collection, it evaluates `auth.ts`, triggering a live MongoDB SRV DNS lookup (`_mongodb._tcp.cluster0.uk51f01.mongodb.net`) and connection attempt on the Vercel build worker. When the database is unreachable or isolated from build containers, the build fails.
2. **Missing Dynamic Route Directives:** `/dashboard` and `/api/auth/[...all]` are user-dependent dynamic endpoints, but lack `export const dynamic = "force-dynamic"`. Consequently, Next.js tries to pre-render/statically analyze them during build.
3. **Next.js 16 Proxy Convention:** Next.js 16 formalizes `proxy.ts` (with `export default async function proxy(request: NextRequest)`) to replace `middleware.ts`.

## Recommended Fix
1. Remove top-level `await connectDB()` in `lib/auth/auth.ts` and initialize `mongodbAdapter` using a lazy `MongoClient` instance (which does not perform network operations on instantiation) or lazily within request lifecycles.
2. Declare `export const dynamic = "force-dynamic"` in `app/api/auth/[...all]/route.ts` and `app/dashboard/page.tsx`.
3. Standardize `proxy.ts` with the edge-safe session check to eliminate the Next.js 16 deprecation warning.
