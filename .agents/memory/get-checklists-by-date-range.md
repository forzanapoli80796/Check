---
name: getChecklistsByDateRange broken
description: storage.getChecklistsByDateRange returns ALL checklists regardless of date params — use inline filter of allChecklists in routes.ts instead
---

**The rule:** Never call `storage.getChecklistsByDateRange(start, end)` in route handlers. It ignores the date range parameters and returns all checklists (marked `// Simplified for now` in storage.ts).

**Why:** The missing-checklists route had special handlers for MHD-Check (Saturday checks Friday) and TS17 Montagsliste (Wednesday checks Tuesday) that both used this broken method. Because ALL historic checklists were returned, the `submitted` check always found old submissions and never reported anything as missing.

**How to apply:** In routes.ts, filter the already-loaded `allChecklists` array directly:
```typescript
const fridayChecklists = allChecklists.filter(c => {
  if (!c.submittedAt) return false;
  const d = new Date(c.submittedAt);
  return d >= fridayStart && d <= fridayEnd;
});
```
Use `new Date(yr, mo - 1, dy - 1)` (local date) for the previous day, not `new Date(targetDate)` with setDate (UTC vs local timezone risk).
