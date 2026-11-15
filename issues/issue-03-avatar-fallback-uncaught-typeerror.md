# [BUG-03] Uncaught TypeError on User Avatar Fallback Crashes Navbar

- **Severity:** Critical (P0 / Level 1)
- **Labels:** `bug`, `crash`, `ui`
- **Affected File:** `components/navbar.tsx` (Line 44)

---

## Description
When an authenticated user has an empty string `""`, `null`, or `undefined` for their `name` property, rendering the user avatar in the navigation bar throws an uncaught JavaScript runtime error:
`TypeError: Cannot read properties of undefined (reading 'toUpperCase')`
Because the navbar is mounted in the root layout (`app/layout.tsx`), this unhandled exception crashes the entire client application for that user.

## Steps to Reproduce
1. Sign up a new user or modify a user record in the MongoDB `user` collection to have `name: ""`.
2. Log in and load any page that renders the `Navbar` component (e.g. `/` or `/dashboard`).
3. The page fails to render and shows Next.js error boundary / unhandled runtime exception.

## Root Cause Analysis
In `components/navbar.tsx` at line 44:
```tsx
<AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
  {session.user.name[0].toUpperCase()}
</AvatarFallback>
```
The expression assumes `session.user.name` is always a non-empty string. If `session.user.name` is `""`, `null`, or `undefined`:
1. `session.user.name[0]` evaluates to `undefined`.
2. Calling `.toUpperCase()` on `undefined` causes a fatal runtime TypeError.

## Recommended Fix
Update the fallback expression to safely check for characters with optional chaining and fallback to the user's email initial or `"U"`:
```tsx
<AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
  {(session.user.name?.[0] || session.user.email?.[0] || "U").toUpperCase()}
</AvatarFallback>
```
