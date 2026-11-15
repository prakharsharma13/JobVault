# [BUG-01] Reordering Algorithm Collapses Job Orders to Zero on Upward Drag

- **Severity:** Critical (P0 / Level 1)
- **Labels:** `bug`, `drag-and-drop`, `data-corruption`
- **Affected File:** `lib/actions/job-applications.ts` (Lines 189–227)
- **Related Files:** `scripts/seed.ts` (Line 247), `lib/actions/job-applications.ts` (Line 86)

---

## Description
When reordering cards upward within the same column, the reordering algorithm in `updateJobApplication` causes job `order` values to collapse to zero (`0`). Once multiple jobs share the exact same order value (`0`), array sort stability is broken, causing cards to jump randomly or display in incorrect positions after drag operations or page refresh.

## Steps to Reproduce
1. Seed the database with demo jobs using `npm run seed:jobs` (seeded jobs receive `order: 0, 1, 2, ...`).
2. Navigate to `/dashboard`.
3. Locate a column with 3 or more jobs (e.g., Wish List or Applied).
4. Drag a card from the bottom of the column (e.g., Position 2 or 3) upward to Position 0 or 1.
5. Inspect the MongoDB database documents for the jobs in that column.
6. Refresh the page.

## Root Cause Analysis
In `createJobApplication` (line 86) and `scripts/seed.ts` (line 247), job orders are created with unit increments:
```ts
order: maxOrder ? maxOrder.order + 1 : 0
```
This produces initial orders: `0, 1, 2, 3...`.

However, in `updateJobApplication` (lines 206–224), the upward reorder logic assumes all job orders are spaced in increments of 100 and subtracts 100:
```ts
const newOrderValue = order * 100;

if (order < oldPositionindex) {
  const jobsToShiftDown = otherJobsInColumn.slice(order, oldPositionindex);
  for (const job of jobsToShiftDown) {
    await JobApplication.findByIdAndUpdate(job._id, {
      $set: { order: job.order + 100 },
    });
  }
} else if (order > oldPositionindex) {
  const jobsToShiftUp = otherJobsInColumn.slice(oldPositionindex, order);
  for (const job of jobsToShiftUp) {
    const newOrder = Math.max(0, job.order - 100);
    await JobApplication.findByIdAndUpdate(job._id, {
      $set: { order: newOrder },
    });
  }
}

updatesToApply.order = newOrderValue;
```

When shifting jobs upward:
1. `otherJobsInColumn` contains jobs with orders like `1` and `2`.
2. `newOrder = Math.max(0, job.order - 100)` evaluates `Math.max(0, 1 - 100) = 0` and `Math.max(0, 2 - 100) = 0`.
3. Multiple jobs are assigned `order: 0`.
4. Subsequent sorting via `jobApplications.sort((a, b) => a.order - b.order)` becomes non-deterministic.

## Recommended Fix
1. Standardize job order indexing across the entire lifecycle:
   - When creating jobs, either use consistent unit indexing (`0, 1, 2...`) or index-spaced floating points / ranks.
2. In `updateJobApplication`, re-index the entire column or calculate fractional positions (e.g. `(prevOrder + nextOrder) / 2`), or re-assign consecutive index orders `0, 1, 2, ...` to all jobs in the target column in a single atomic bulk write operation (`bulkWrite`).
