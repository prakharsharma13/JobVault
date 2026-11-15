# [BUG-05] Stale Form State in Edit Modal Reverts Moved Applications to Old Column

- **Severity:** High (P1 / Level 1)
- **Labels:** `bug`, `ui`, `state-management`
- **Affected File:** `components/job-application-card.tsx` (Lines 48–78)

---

## Description
When an application card is moved to another column (e.g. from "Wish List" to "Applied" or "Offer") and the user subsequently edits the application (e.g. updating notes or salary), submitting the edit form inadvertently moves the application back to its original column.

## Steps to Reproduce
1. Navigate to `/dashboard`.
2. Drag any job application card from "Wish List" into "Interviewing".
3. Click the 3-dots menu on that card and select **Edit**.
4. Change any text field (such as adding a note or updating salary) and click **Save Changes**.
5. Observe that upon saving, the card jumps back to "Wish List".

## Root Cause Analysis
In `components/job-application-card.tsx`:
```tsx
const [formData, setFormData] = useState({
  company: job.company,
  position: job.position,
  location: job.location || "",
  notes: job.notes || "",
  salary: job.salary || "",
  jobUrl: job.jobUrl || "",
  columnId: job.columnId || "",
  tags: job.tags?.join(", ") || "",
  description: job.description || "",
});
```
1. `useState` initializes once when the component is mounted.
2. When the user moves the card to a new column, the `job` prop updates (`job.columnId` changes to the new column), but `formData.columnId` retains the stale initial column ID.
3. In `handleUpdate`:
   ```tsx
   const result = await updateJobApplication(job._id, {
     ...formData,
     tags: formData.tags.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0),
   });
   ```
4. `...formData` passes the stale `columnId` to `updateJobApplication`, which executes the column move logic, reverting the job to the old column.

## Recommended Fix
1. Synchronize `formData` with `job` prop changes using a `useEffect` or reset `formData` whenever `isEditing` is toggled open:
   ```tsx
   useEffect(() => {
     if (isEditing) {
       setFormData({
         company: job.company,
         position: job.position,
         location: job.location || "",
         notes: job.notes || "",
         salary: job.salary || "",
         jobUrl: job.jobUrl || "",
         columnId: job.columnId || "",
         tags: job.tags?.join(", ") || "",
         description: job.description || "",
       });
     }
   }, [isEditing, job]);
   ```
2. Do not include `columnId` in the edit modal payload unless the edit modal explicitly contains a column selection dropdown.
