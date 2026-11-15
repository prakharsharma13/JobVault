# [ARCH-01] Dual Source of Truth Desynchronization Between `Column.jobApplications` and `JobApplication.order`

- **Severity:** High (P1 / Level 2)
- **Labels:** `architecture`, `data-integrity`, `database`
- **Affected File:** `lib/models/column.ts` (Lines 31–36), `lib/actions/job-applications.ts` (Lines 150–226)
- **Related Files:** `app/dashboard/page.tsx` (Lines 15–20), `components/kanban-board.tsx` (Lines 71–73)

---

## Description
Job ordering and membership in a column are maintained redundantly across two distinct data stores:
1. An array of ObjectIds in `Column.jobApplications`.
2. A foreign key `JobApplication.columnId` and numerical rank `JobApplication.order`.

When jobs are moved or reordered, these two structures drift out of sync. For example, moving a job into a column appends the ID to the end of `Column.jobApplications` via `$push`, even when its `order` is 0 (the top). Furthermore, reordering within the same column never updates the order of IDs in `Column.jobApplications`.

When `getBoard` loads columns via `.populate({ path: "jobApplications" })`, Mongoose returns them in the order of the ObjectId array. If the client does not sort or if order numbers become corrupted, the order displayed to the user differs completely from the database representation.

## Steps to Reproduce
1. Create 3 jobs in "Wish List".
2. Move Job 3 from Position 2 to Position 0.
3. Inspect `Column.jobApplications` in MongoDB:
   - Notice the IDs remain `[Job1_id, Job2_id, Job3_id]`.
4. Inspect `JobApplication` documents:
   - Notice Job 3 has `order: 0`, Job 1 has `order: 100`, Job 2 has `order: 200`.
5. Now move a job to another column and inspect `newColumn.jobApplications`:
   - It is appended to the tail of `jobApplications` via `$push`.

## Root Cause Analysis
In `lib/models/column.ts`:
```ts
jobApplications: [
  {
    type: Schema.Types.ObjectId,
    ref: "JobApplication",
  },
]
```
In `lib/actions/job-applications.ts`:
```ts
await Column.findByIdAndUpdate(newColumnId, {
  $push: { jobApplications: id },
});
```
Having an explicit reference array on `Column` as well as a `columnId` on `JobApplication` creates a dual source of truth. Any failure or omission in syncing both sides results in:
- Orphaned ObjectIds in `Column.jobApplications` if an application is deleted or moved without cleaning up.
- Conflicting ordering between the populated array and the `order` attribute.

## Recommended Fix
Choose a single source of truth for relationships:
1. **Option A (Relational via foreign keys - Recommended):** Remove the `jobApplications` array from `ColumnSchema`. Query job applications directly by `columnId` sorted by `order: 1`:
   ```ts
   const columns = await Column.find({ boardId }).sort({ order: 1 }).lean();
   const jobs = await JobApplication.find({ boardId }).sort({ order: 1 }).lean();
   ```
   Group jobs into their respective columns in memory before passing them to the board.
2. **Option B (Document Reference Array):** If keeping the array, ensure that `order` is dropped from `JobApplication` and array index is the sole determinant of order, keeping `Column.jobApplications` updated atomically on every drag/reorder.
