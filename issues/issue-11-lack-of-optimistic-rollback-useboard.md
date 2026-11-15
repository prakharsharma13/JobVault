# [ARCH-04] Lack of Optimistic Rollback and Error Handling in Board State Hook

- **Severity:** Medium (P2 / Level 2)
- **Labels:** `ui`, `state-management`, `ux`
- **Affected File:** `lib/hooks/useBoards.ts` (Lines 23–88)

---

## Description
The `useBoard` custom hook performs an optimistic state update when a card is moved or reordered. However, if the underlying server action (`updateJobApplication`) fails, returns an error object, or rejects, the optimistic UI change is never rolled back. 

The user continues to see the card in its new position on the screen, but the change was never persisted in the database. When the page is reloaded, the card abruptly moves back to its previous position with no prior error message or indication of failure.

## Steps to Reproduce
1. Disconnect network or invalidate the session cookie while on `/dashboard`.
2. Drag a card to a different column.
3. Observe that the card visually remains in the new column.
4. Open the browser developer console:
   - Notice `console.error("Error", ...)` or an unhandled `{ error: "Unauthorized" }` response.
   - No user notification, toast, or rollback occurs.
5. Refresh the page: the card is back in its original column.

## Root Cause Analysis
In `lib/hooks/useBoards.ts` (lines 79–87):
```ts
try {
  const result = await updateJobApplication(jobApplicationId, {
    columnId: newColumnId,
    order: newOrder,
  });
} catch (err) {
  console.error("Error", err);
}
```
1. Server actions in Next.js do not throw on returned error objects (e.g., `{ error: "Unauthorized" }` or `{ error: "Job application not found" }`). The `catch` block is therefore bypassed on operational failures.
2. Even if an exception is caught, there is no snapshot of the previous state saved, so no rollback occurs.
3. The hook does not expose or update its `error` state variable (`const [error, setError] = useState<string | null>(null)` is defined on line 10 but never updated).

## Recommended Fix
1. Snapshot previous columns state before applying optimistic updates.
2. Inspect `result.error` and rollback to the snapshot if an error occurs:
   ```ts
   async function moveJob(
     jobApplicationId: string,
     newColumnId: string,
     newOrder: number
   ) {
     const previousColumns = columns;

     // Optimistic update
     setColumns((prev) => { ... });

     try {
       const result = await updateJobApplication(jobApplicationId, {
         columnId: newColumnId,
         order: newOrder,
       });

       if (result.error) {
         setError(result.error);
         setColumns(previousColumns); // Rollback
       }
     } catch (err) {
       setError("Failed to move job application");
       setColumns(previousColumns); // Rollback
     }
   }
   ```
