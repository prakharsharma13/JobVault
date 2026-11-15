# [BUG-04] Concurrency Race Condition Causes Duplicate Boards and Columns

- **Severity:** Critical (P0 / Level 1)
- **Labels:** `bug`, `database`, `auth`, `concurrency`
- **Affected File:** `lib/auth/auth.ts` (Lines 25–35), `lib/init-user-board.ts` (Lines 15–48)
- **Related Files:** `app/dashboard/page.tsx` (Lines 40–43), `lib/models/board.ts` (Lines 11–32)

---

## Description
When a user signs up, two independent execution paths invoke `initializeUserBoard(userId)` concurrently:
1. Better Auth's asynchronous database lifecycle hook `databaseHooks.user.create.after`.
2. The dashboard server component (`app/dashboard/page.tsx`) when the user is immediately redirected to `/dashboard`.

Because `initializeUserBoard` checks for existing boards via a non-atomic `findOne` and `BoardSchema` lacks a unique compound index on `{ userId: 1, name: 1 }`, both execution paths concurrently find no board, create two separate "Job Hunt" boards, and create duplicate sets of columns (resulting in 10 columns across two boards).

## Steps to Reproduce
1. Sign up a new user via `/sign-up`.
2. As soon as signup succeeds, the client router redirects to `/dashboard`.
3. Check the MongoDB database `boards` and `columns` collections for that user:
   ```js
   db.boards.find({ userId: "<new-user-id>" })
   db.columns.find({ boardId: { $in: [...] } })
   ```
4. Observe duplicate board documents and duplicate column sets.

## Root Cause Analysis
In `lib/auth/auth.ts`:
```ts
databaseHooks: {
  user: {
    create: {
      after: async (user) => {
        if (user.id) {
          await initializeUserBoard(user.id);
        }
      },
    },
  },
},
```
In `app/dashboard/page.tsx`:
```ts
if (!board || !board.columns || board.columns.length === 0) {
  await initializeUserBoard(session.user.id);
  board = await getBoard(session.user.id);
}
```
In `lib/init-user-board.ts`:
```ts
let board = await Board.findOne({ userId, name: "Job Hunt" });

if (!board) {
  board = await Board.create({
    name: "Job Hunt",
    userId,
    columns: [],
  });
}
```
Because the check and insertion are non-atomic (Time-of-Check to Time-of-Use race condition), both calls execute simultaneously during the network redirect, generating duplicate boards.

## Recommended Fix
1. Add a unique compound index to `BoardSchema` in `lib/models/board.ts`:
   ```ts
   BoardSchema.index({ userId: 1, name: 1 }, { unique: true });
   ```
2. Use an atomic `findOneAndUpdate` with `upsert: true` and `$setOnInsert` in `initializeUserBoard`:
   ```ts
   let board = await Board.findOneAndUpdate(
     { userId, name: "Job Hunt" },
     { $setOnInsert: { name: "Job Hunt", userId, columns: [] } },
     { upsert: true, new: true, setDefaultsOnInsert: true }
   );
   ```
3. Remove the redundant call from either the signup hook or the dashboard self-healing logic, or safeguard column insertion so that existing columns matching `boardId` are checked before creating new ones.
