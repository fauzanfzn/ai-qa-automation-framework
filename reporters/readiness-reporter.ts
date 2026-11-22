import type { FullResult, Reporter, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * QA readiness reporter.
 *
 * Turns a test run into the summary a QA lead reports to the team: readiness per
 * area (UI, visual, API, LLM), how many individual checks ran, and what is
 * blocking release. Writes readiness.md and readiness.html next to the HTML report.
 */

interface AreaStats { tests: number; passed: number; failed: number; flaky: number; skipped: number; checks: number }
interface Failure { area: string; title: string; error: string }

const AREA_LABEL: Record<string, string> = {
  ui: 'UI end-to-end',
  visual: 'Visual regression',
  api: 'API contract',
  llm: 'LLM evaluation',
};

function countChecks(steps: TestStep[]): number {
  return steps.reduce((n, s) => n + (s.category === 'expect' ? 1 : 0) + countChecks(s.steps), 0);
}

function pct(part: number, total: number): string {
  return total === 0 ? '-' : `${((part / total) * 100).toFixed(1)}%`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}

export default class ReadinessReporter implements Reporter {
  private areas = new Map<string, AreaStats>();
  private llmByCategory = new Map<string, { passed: number; total: number }>();
  private failures: Failure[] = [];
  private outputDir: string;
  private started = Date.now();

  constructor(options: { outputDir?: string } = {}) {
    this.outputDir = options.outputDir ?? 'playwright-report';
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Count each test once, on its final attempt.
    if (result.retry < test.retries && result.status !== 'passed' && result.status !== 'skipped') return;

    const area = test.parent.project()?.name ?? 'other';
    const s = this.areas.get(area) ?? { tests: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, checks: 0 };
    const outcome = test.outcome();
    s.tests += 1;
    s.checks += countChecks(result.steps);
    if (outcome === 'expected') s.passed += 1;
    else if (outcome === 'flaky') { s.passed += 1; s.flaky += 1; }
    else if (outcome === 'skipped') s.skipped += 1;
    else {
      s.failed += 1;
      const msg = (result.error?.message ?? 'failed').replace(/\u001b\[[0-9;]*m/g, '').split('\n')[0];
      this.failures.push({ area, title: test.title, error: msg.slice(0, 200) });
    }
    this.areas.set(area, s);

    const category = test.annotations.find((a) => a.type === 'category')?.description;
    if (area === 'llm' && category) {
      const c = this.llmByCategory.get(category) ?? { passed: 0, total: 0 };
      c.total += 1;
      if (outcome === 'expected' || outcome === 'flaky') c.passed += 1;
      this.llmByCategory.set(category, c);
    }
  }

  async onEnd(result: FullResult) {
    const all = [...this.areas.values()].reduce(
      (t, s) => ({ tests: t.tests + s.tests, passed: t.passed + s.passed, checks: t.checks + s.checks, failed: t.failed + s.failed }),
      { tests: 0, passed: 0, checks: 0, failed: 0 },
    );
    const ready = all.failed === 0 && result.status === 'passed';
    const minutes = ((Date.now() - this.started) / 60000).toFixed(1);
    const date = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

    const rows = [...this.areas.entries()].map(([area, s]) => ({
      area: AREA_LABEL[area] ?? area,
      tests: s.tests,
      passed: s.passed,
      readiness: pct(s.passed, s.tests),
      checks: s.checks,
      flaky: s.flaky,
    }));

    const md = [
      `# QA readiness report`,
      ``,
      `${date} · ${all.tests} tests · ${all.checks} checks · ${minutes} min · **${ready ? 'READY' : 'NOT READY'}**`,
      ``,
      `| Area | Tests | Passed | Readiness | Checks | Flaky |`,
      `| --- | --- | --- | --- | --- | --- |`,
      ...rows.map((r) => `| ${r.area} | ${r.tests} | ${r.passed} | ${r.readiness} | ${r.checks} | ${r.flaky} |`),
      `| **Total** | ${all.tests} | ${all.passed} | ${pct(all.passed, all.tests)} | ${all.checks} | |`,
      ``,
      ...(this.llmByCategory.size
        ? [`## LLM evaluation by category`, ``, `| Category | Passed |`, `| --- | --- |`,
          ...[...this.llmByCategory.entries()].map(([c, v]) => `| ${c} | ${v.passed}/${v.total} |`), ``]
        : []),
      `## Blockers`,
      ``,
      ...(this.failures.length ? this.failures.map((f) => `- **${AREA_LABEL[f.area] ?? f.area}** · ${f.title}: ${f.error}`) : ['None. All checks passed.']),
      ``,
    ].join('\n');

    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>QA readiness report</title>
<style>
body{font:15px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;margin:0;background:#f5f7fa;color:#14202f}
main{max-width:880px;margin:auto;padding:32px 16px}
h1{margin:0 0 4px;font-size:28px}.mut{color:#5d6878}
.badge{display:inline-block;padding:4px 10px;border-radius:999px;font-weight:700;font-size:13px;background:${ready ? '#e3f3ea' : '#fdecea'};color:${ready ? '#1d7a4d' : '#b42318'}}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0}
.card{background:#fff;border:1px solid #dfe4ea;border-radius:10px;padding:14px}.card b{display:block;font-size:26px}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dfe4ea;border-radius:10px;margin:12px 0}
th,td{padding:8px 10px;border-bottom:1px solid #dfe4ea;text-align:left}th{font-size:12px;text-transform:uppercase;color:#5d6878}
a{color:#1f4e8c}
</style></head><body><main>
<h1>QA readiness report</h1>
<p class="mut">${date} · run time ${minutes} min · <span class="badge">${ready ? 'READY' : 'NOT READY'}</span></p>
<div class="cards">
<div class="card">Tests<b>${all.tests}</b></div>
<div class="card">Checks<b>${all.checks}</b></div>
<div class="card">Readiness<b>${pct(all.passed, all.tests)}</b></div>
<div class="card">Blockers<b>${this.failures.length}</b></div>
</div>
<table><thead><tr><th>Area</th><th>Tests</th><th>Passed</th><th>Readiness</th><th>Checks</th><th>Flaky</th></tr></thead><tbody>
${rows.map((r) => `<tr><td>${escapeHtml(r.area)}</td><td>${r.tests}</td><td>${r.passed}</td><td><b>${r.readiness}</b></td><td>${r.checks}</td><td>${r.flaky}</td></tr>`).join('')}
</tbody></table>
${this.llmByCategory.size ? `<h2>LLM evaluation by category</h2><table><thead><tr><th>Category</th><th>Passed</th></tr></thead><tbody>${[...this.llmByCategory.entries()].map(([c, v]) => `<tr><td>${escapeHtml(c)}</td><td>${v.passed}/${v.total}</td></tr>`).join('')}</tbody></table>` : ''}
<h2>Blockers</h2>
${this.failures.length ? `<ul>${this.failures.map((f) => `<li><b>${escapeHtml(AREA_LABEL[f.area] ?? f.area)}</b> · ${escapeHtml(f.title)}: ${escapeHtml(f.error)}</li>`).join('')}</ul>` : '<p>None. All checks passed.</p>'}
<p><a href="index.html">Open the full Playwright report (traces, screenshots, steps)</a></p>
</main></body></html>`;

    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(path.join(this.outputDir, 'readiness.md'), md);
    fs.writeFileSync(path.join(this.outputDir, 'readiness.html'), html);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
    console.log(`\nQA readiness: ${pct(all.passed, all.tests)} of ${all.tests} tests, ${all.checks} checks, ${ready ? 'READY' : 'NOT READY'}`);
  }

  printsToStdio() {
    return false;
  }
}
