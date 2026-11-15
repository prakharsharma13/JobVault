# Issue Tracker: Level 1 and Level 2 Technical Issues

This directory contains filed issue reports detailing critical functional bugs (Level 1) and data integrity & architectural issues (Level 2) identified in the JobVault codebase.

---

## Issue Registry

### Level 1: Critical Functional Bugs & Logic Errors

| Issue ID | Title | Severity | Affected Component | Status |
| :--- | :--- | :--- | :--- | :--- |
| [ISSUE-01](./issue-01-reordering-algorithm-collapse.md) | Reordering Algorithm Collapses Job Orders to Zero on Upward Drag | Critical (P0) | `lib/actions/job-applications.ts` | Open |
| [ISSUE-02](./issue-02-proxy-middleware-misnamed-and-crash.md) | Next.js Middleware Misnamed as `proxy.ts` and Crashes on Headers | Critical (P0) | `proxy.ts`, `lib/auth/auth.ts` | Open |
| [ISSUE-03](./issue-03-avatar-fallback-uncaught-typeerror.md) | Uncaught TypeError on User Avatar Fallback Crashes Navbar | Critical (P0) | `components/navbar.tsx` | Open |
| [ISSUE-04](./issue-04-signup-board-creation-race-condition.md) | Concurrency Race Condition Causes Duplicate Boards and Columns | Critical (P0) | `lib/auth/auth.ts`, `lib/init-user-board.ts` | Open |
| [ISSUE-05](./issue-05-stale-edit-form-column-reversion.md) | Stale Form State in Edit Modal Reverts Moved Applications to Old Column | High (P1) | `components/job-application-card.tsx` | Open |
| [ISSUE-06](./issue-06-idor-unauthorized-column-move.md) | IDOR Vulnerability Allows Moving Applications to Arbitrary Columns | High (P1) | `lib/actions/job-applications.ts` | Open |
| [ISSUE-07](./issue-07-stored-xss-job-url.md) | Stored Cross-Site Scripting (XSS) in Job Posting URL Parameter | High (P1) | `components/job-application-card.tsx`, `lib/actions/job-applications.ts` | Open |

---

### Level 2: Data Integrity & Architectural Issues

| Issue ID | Title | Severity | Affected Component | Status |
| :--- | :--- | :--- | :--- | :--- |
| [ISSUE-08](./issue-08-dual-source-of-truth-job-applications.md) | Dual Source of Truth Desynchronization Between `Column.jobApplications` and `JobApplication.order` | High (P1) | `lib/models/column.ts`, `lib/actions/job-applications.ts` | Open |
| [ISSUE-09](./issue-09-status-field-desynchronization.md) | Application `status` Field Permanently Desynchronized on Column Moves | Medium (P2) | `lib/models/job-application.ts`, `lib/actions/job-applications.ts` | Open |
| [ISSUE-10](./issue-10-top-level-db-connection-build-failure.md) | Top-Level Database Connection at Module Scope Breaks Builds and Edge Runtimes | Medium (P2) | `lib/auth/auth.ts`, `lib/db.ts` | Open |
| [ISSUE-11](./issue-11-lack-of-optimistic-rollback-useboard.md) | Lack of Optimistic Rollback and Error Handling in Board State Hook | Medium (P2) | `lib/hooks/useBoards.ts` | Open |
