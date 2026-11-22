# Working agreement for AI agents in this repo

This file tells Claude (or any coding agent) how to work on this framework. It is the same
setup I use at work: the agent drafts and runs tests, a human reviews every finding.

## Stack
- Playwright Test + TypeScript. Page objects in `pages/`, fixtures in `fixtures/`.
- Projects: `ui`, `visual`, `api`, `llm` (see `playwright.config.ts`).
- API contracts live in `fixtures/schemas.ts` (zod). LLM eval cases live in `fixtures/llm/cases.ts`.

## Rules
1. Locators: use `data-test` attributes through a page object. Never put raw selectors in a spec.
2. Every new test states its expected result in the test name.
3. API tests validate the response against a schema, not only the status code.
4. Test data comes from `fixtures/data.ts` so parallel runs never collide.
5. Do not update visual baselines to make a test pass. Report the diff and let a human decide.
6. An automated failure is a *candidate* bug. Reproduce it manually (screenshot or direct API call)
   before it goes into a report. False positives are removed, not reported.
7. Run `npm run typecheck` and the affected project before proposing a change.

## Useful commands
- `npx playwright test --project=api` – one suite
- `npx playwright test -g "checkout"` – by name
- `npx playwright show-report` – HTML report; `playwright-report/readiness.html` – readiness summary

## MCP
With the Playwright MCP server connected, the agent can open the app in a real browser,
explore a flow, and turn what it sees into a page object and spec. Prompts for that are in `prompts/`.
