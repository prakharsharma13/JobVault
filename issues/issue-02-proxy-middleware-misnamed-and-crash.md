# [BUG-02] Next.js Middleware Misnamed as `proxy.ts` and Crashes on Headers

- **Severity:** Critical (P0 / Level 1)
- **Labels:** `bug`, `routing`, `auth`, `security`
- **Affected File:** `proxy.ts` (Lines 1–15)
- **Related Files:** `lib/auth/auth.ts` (Lines 8–11, 38–44)

---

## Description
The Next.js route middleware file is named `proxy.ts` instead of `middleware.ts`. Next.js does not recognize `proxy.ts`, so it is completely bypassed and never executed. Consequently, authenticated users visiting `/sign-in` or `/sign-up` are never redirected to `/dashboard` at the routing boundary.

Furthermore, if the file is renamed to `middleware.ts`, it immediately crashes at runtime because it invokes database connections and Server Component APIs (`next/headers`) that are forbidden within Next.js Middleware.

## Steps to Reproduce
1. Start the development server (`npm run dev`).
2. Log into the application.
3. Manually navigate in the browser URL bar to `http://localhost:3000/sign-in`.
4. Observe that the user is not redirected to `/dashboard` by middleware.
5. Rename `proxy.ts` to `middleware.ts`.
6. Load any route in the application and observe runtime crash.

## Root Cause Analysis
1. **File Convention Error:** Next.js requires the middleware file to be located at the root of the workspace named `middleware.ts` (or `src/middleware.ts`). `proxy.ts` has no special meaning in Next.js.
2. **Runtime Incompatibility:**
   In `proxy.ts`:
   ```ts
   import { getSession } from "./lib/auth/auth";
   ```
   `lib/auth/auth.ts` contains:
   - Line 8: `const mongooseInstance = await connectDB();`
   - Line 38: `export async function getSession() { const result = await auth.api.getSession({ headers: await headers() }); return result; }`
   `headers()` from `next/headers` is exclusively for Server Components, Server Actions, and Route Handlers. Middleware receives `request.headers` on the `NextRequest` object and throws an error if `next/headers` is called. Additionally, Mongoose relies on Node.js net/tls sockets that cannot execute in edge middleware runtimes.
3. **Missing Route Protection:** `proxy.ts` only checked `/sign-in` and `/sign-up`, completely omitting route protection for `/dashboard`.

## Recommended Fix
1. Rename `proxy.ts` to `middleware.ts`.
2. Extract lightweight session verification for middleware using Better Auth's cookie session check or middleware plugin rather than importing the entire Mongoose/database instance:
   ```ts
   import { NextRequest, NextResponse } from "next/server";

   export async function middleware(request: NextRequest) {
     const sessionCookie = request.cookies.get("better-auth.session_token") || 
                           request.cookies.get("__Secure-better-auth.session_token");

     const isAuthPage = request.nextUrl.pathname.startsWith("/sign-in") || 
                        request.nextUrl.pathname.startsWith("/sign-up");
     const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

     if (isAuthPage && sessionCookie) {
       return NextResponse.redirect(new URL("/dashboard", request.url));
     }

     if (isDashboard && !sessionCookie) {
       return NextResponse.redirect(new URL("/sign-in", request.url));
     }

     return NextResponse.next();
   }

   export const config = {
     matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
   };
   ```
