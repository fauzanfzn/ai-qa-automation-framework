# Prompt: triage a failed run

```
Here is playwright-report/readiness.md and the failing test output: <paste>.
For each failure:
1. Classify it: product bug, test bug, environment/data issue, or expected change (design updated).
2. Show the evidence: the assertion, the actual value, and the trace or screenshot it comes from.
3. For product bugs, write a ticket: title, steps to reproduce, expected vs actual,
   severity, and the owning team (FE, BE, data).
4. For API failures, reproduce with a direct GET/POST and paste the raw response.
Group duplicates: one root cause = one ticket, even if it fails many tests.
```

This is the step that keeps false positives out of the report shared with the team.
