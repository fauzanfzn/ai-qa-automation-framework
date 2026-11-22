# Prompt: test design from a user story

Use with Claude before writing any code. Output is reviewed by a QA engineer, then automated.

```
You are a senior QA engineer. From the user story below, produce a test design.

User story:
<paste story and acceptance criteria>

Return a table with: ID, scenario, type (positive / negative / boundary / security),
preconditions, steps, expected result, priority (P1-P3), and which layer should own it
(UI E2E, API, visual, or manual exploratory). Prefer the lowest layer that can catch the bug.
List open questions for the product owner separately. Do not invent requirements.
```

Review checklist before automating:
- Every acceptance criterion maps to at least one scenario.
- Negative and boundary cases exist for every input.
- Nothing is tested twice at a higher (slower) layer.
