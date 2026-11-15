# [ARCH-02] Application `status` Field Permanently Desynchronized on Column Moves

- **Severity:** Medium (P2 / Level 2)
- **Labels:** `bug`, `data-integrity`, `models`
- **Affected File:** `lib/models/job-application.ts` (Lines 35–39), `lib/actions/job-applications.ts` (Lines 85, 147–188)
- **Related Files:** `scripts/seed.ts` (Line 246)

---

## Description
The `JobApplication` schema defines a required `status` field (e.g. `"wish-list"`, `"applied"`, `"interviewing"`, `"offer"`, `"rejected"`). However, throughout the application's lifecycle:
1. `createJobApplication` always hardcodes `status: "applied"`, regardless of which column the job was created in.
2. When dragging or moving an application between columns, `updateJobApplication` updates `columnId` and `order`, but completely neglects the `status` field.

As a result, a job that moves to "Interviewing", "Offer", or "Rejected" permanently retains `status: "applied"` in the database.

## Steps to Reproduce
1. In the "Wish List" column, click "Add application" and create a role.
2. In MongoDB, inspect the created document:
   - Notice `status` is `"applied"` (not `"wish-list"`).
3. Drag the card across columns to "Offer".
4. In MongoDB, inspect the updated document:
   - Notice `columnId` changed to the Offer column ID, but `status` remains `"applied"`.

## Root Cause Analysis
In `lib/models/job-application.ts`:
```ts
status: {
  type: String,
  required: true,
  default: "applied",
}
```
In `createJobApplication` (`lib/actions/job-applications.ts`, line 85):
```ts
status: "applied",
```
In `updateJobApplication` (`lib/actions/job-applications.ts`, lines 183–185):
```ts
updatesToApply.columnId = newColumnId;
updatesToApply.order = newOrderValue;
// status is not updated
```

In `scripts/seed.ts`, seed data computes `status: columnName.toLowerCase().replace(" ", "-")`. But the primary server action does not adopt this convention or map column names to status codes.

## Recommended Fix
When creating or moving a job application to a column, lookup the target column's name and set `status` accordingly, or allow `status` to be derived directly from `column.name`:
```ts
const targetColumn = await Column.findById(newColumnId);
if (targetColumn) {
  updatesToApply.status = targetColumn.name.toLowerCase().replace(/\s+/g, "-");
}
```
