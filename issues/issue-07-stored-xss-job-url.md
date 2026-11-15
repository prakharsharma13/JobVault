# [SEC-02] Stored Cross-Site Scripting (XSS) in Job Posting URL Parameter

- **Severity:** High (P1 / Level 1)
- **Labels:** `security`, `xss`, `vulnerability`
- **Affected File:** `components/job-application-card.tsx` (Lines 198–209)
- **Related Files:** `lib/actions/job-applications.ts` (Lines 36, 106)

---

## Description
A stored Cross-Site Scripting (XSS) vulnerability exists through the `jobUrl` field. The backend server actions (`createJobApplication` and `updateJobApplication`) accept any string without protocol validation or sanitization, and the frontend renders it directly inside an `<a href={job.jobUrl}>` anchor tag.

An attacker or compromised input can supply a `javascript:` pseudo-protocol URL (e.g., `javascript:alert(document.cookie)`), which executes arbitrary JavaScript in the victim's session upon clicking "View posting".

## Steps to Reproduce
1. Open the "Add Job Application" or "Edit Job Application" dialog.
2. In the "Job URL" field, enter:
   `javascript:alert(document.cookie)`
3. Save the job application.
4. On the dashboard card, click the **View posting** link.
5. The JavaScript alert fires in the browser context.

## Root Cause Analysis
In `components/job-application-card.tsx` (lines 198–209):
```tsx
{job.jobUrl && (
  <a
    href={job.jobUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
    onClick={(e) => e.stopPropagation()}
    onPointerDown={(e) => e.stopPropagation()}
  >
    <ExternalLink className="h-3 w-3" />
    View posting
  </a>
)}
```
In React, setting `href` directly with unsanitized user input allows `javascript:` execution. While the input tag has `type="url"` on the client, client-side input attributes can be bypassed easily by invoking the server action directly or submitting via API.

## Recommended Fix
1. Validate and sanitize `jobUrl` on the server in `lib/actions/job-applications.ts`:
   ```ts
   function isValidHttpUrl(stringUrl: string): boolean {
     try {
       const parsed = new URL(stringUrl);
       return parsed.protocol === "http:" || parsed.protocol === "https:";
     } catch (_) {
       return false;
     }
   }
   ```
   Reject or sanitize any URL whose protocol is not `http:` or `https:`.
2. On the client, safeguard the link before rendering:
   ```tsx
   const safeUrl = /^https?:\/\//i.test(job.jobUrl) ? job.jobUrl : null;
   ```
