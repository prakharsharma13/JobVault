# [SEC-01] IDOR Vulnerability Allows Moving Applications to Arbitrary Columns Across Users

- **Severity:** High (P1 / Level 1)
- **Labels:** `security`, `authorization`, `idor`
- **Affected File:** `lib/actions/job-applications.ts` (Lines 119–189)

---

## Description
An Insecure Direct Object Reference (IDOR) exists in the `updateJobApplication` server action. While the action verifies that the job application document belongs to the authenticated user, it fails to verify that the destination `columnId` belongs to the authenticated user's board.

An authenticated attacker can supply any arbitrary `columnId` (including column IDs belonging to other users or non-existent columns) to move applications into another user's board or alter the sorting order of another user's columns.

## Steps to Reproduce
1. Authenticate as User A and create a job application.
2. Obtain a valid `columnId` belonging to User B's board.
3. Call `updateJobApplication(userAJobId, { columnId: userBColumnId })`.
4. Observe that the action succeeds without error:
   - User A's job application is moved into User B's column.
   - User B's column document has User A's job ID appended to its `jobApplications` array.
   - User B's column jobs are shifted via `JobApplication.findByIdAndUpdate`.

## Root Cause Analysis
In `lib/actions/job-applications.ts`:
```ts
const jobApplication = await JobApplication.findById(id);

if (!jobApplication) {
  return { error: "Job application not found" };
}

if (jobApplication.userId !== session.user.id) {
  return { error: "Unauthorized" };
}
```
The check verifies that `jobApplication.userId === session.user.id`.

However, on line 145:
```ts
const isMovingToDifferentColumn = newColumnId && newColumnId !== currentColumnId;

if (isMovingToDifferentColumn) {
  await Column.findByIdAndUpdate(currentColumnId, {
    $pull: { jobApplications: id },
  });

  const jobsInTargetColumn = await JobApplication.find({
    columnId: newColumnId,
    _id: { $ne: id },
  }).sort({ order: 1 }).lean();
  ...
  await Column.findByIdAndUpdate(newColumnId, {
    $push: { jobApplications: id },
  });
}
```
There is no validation confirming that `newColumnId` exists on a board owned by `session.user.id`. In contrast, `createJobApplication` properly validates board ownership and column-board association (lines 48–66).

## Recommended Fix
Validate that the target column belongs to a board owned by the authenticated user before executing any update:
```ts
if (isMovingToDifferentColumn) {
  const targetColumn = await Column.findById(newColumnId);
  if (!targetColumn) {
    return { error: "Target column not found" };
  }

  const userBoard = await Board.findOne({
    _id: targetColumn.boardId,
    userId: session.user.id,
  });

  if (!userBoard) {
    return { error: "Unauthorized: target column does not belong to user" };
  }
  ...
}
```
