# Prompt: explore a flow with Playwright MCP and generate tests

Requires the Playwright MCP server connected to Claude.

```
Using the Playwright browser tools, open <URL> and walk through: <flow, e.g. login -> add 2 items -> checkout>.
For every page you visit:
1. List the interactive elements and their data-test attributes.
2. Note anything that looks broken, slow, or different from the design reference <link or screenshot>.

Then, following CLAUDE.md:
- create or extend the page objects in pages/
- write the spec in tests/ui/ with one test per expected behaviour
- run it with `npx playwright test --project=ui -g "<name>"` and fix flaky waits
Report what you found as candidate issues. Do not mark anything as a bug until I confirm it.
```
