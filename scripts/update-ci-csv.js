import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const LOG_DIR = '.tmp';

function getCommitInfo() {
  return execSync('git describe --dirty --always').toString().trim();
}

function parseVitestLog(content) {
  // Tests  345 passed | 45 skipped | 1 todo
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const passedMatches = content.matchAll(/Tests\s+(\d+) passed/g);
  for (const m of passedMatches) passed += parseInt(m[1], 10);

  const failedMatches = content.matchAll(/Tests\s+.*?(\d+) failed/g);
  for (const m of failedMatches) failed += parseInt(m[1], 10);

  const skippedMatches = content.matchAll(/Tests\s+.*?(\d+) skipped/g);
  for (const m of skippedMatches) skipped += parseInt(m[1], 10);

  return { passed, failed, skipped };
}

function parsePlaywrightLog(content) {
  // 55 passed (12.2s)
  // 1 failed
  // 3 skipped
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const passedMatches = content.matchAll(/^\s*(\d+) passed/gm);
  for (const m of passedMatches) passed += parseInt(m[1], 10);

  const failedMatches = content.matchAll(/^\s*(\d+) failed/gm);
  for (const m of failedMatches) failed += parseInt(m[1], 10);

  const skippedMatches = content.matchAll(/^\s*(\d+) skipped/gm);
  for (const m of skippedMatches) skipped += parseInt(m[1], 10);

  return { passed, failed, skipped };
}

function stripAnsi(str) {
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function processLog(category, logFile, parser) {
  const logPath = path.join(LOG_DIR, logFile);
  if (!fs.existsSync(logPath)) return null;

  const content = fs.readFileSync(logPath, 'utf-8');
  return parser(stripAnsi(content));
}

function updateCSV() {
  const commit = getCommitInfo();
  const timestamp = new Date().toISOString();
  
  const entries = [];

  // Lint
  const lintLog = path.join(LOG_DIR, 'lint.log');
  if (fs.existsSync(lintLog)) {
      const content = fs.readFileSync(lintLog, 'utf-8');
      const passed = !content.includes('ELIFECYCLE'); // Simple check
      entries.push({ category: 'Lint', passed: passed ? 1 : 0, failed: passed ? 0 : 1 });
  }

  // Check
  const checkLog = path.join(LOG_DIR, 'check.log');
  if (fs.existsSync(checkLog)) {
      const content = fs.readFileSync(checkLog, 'utf-8');
      const passed = !content.includes('ELIFECYCLE') && !content.includes('error TS');
      entries.push({ category: 'Check', passed: passed ? 1 : 0, failed: passed ? 0 : 1 });
  }

  // Unit via Vitest
  const unitStats = processLog('Unit', 'unit.log', parseVitestLog);
  if (unitStats) entries.push({ category: 'Unit', ...unitStats });

  // SSRR via Playwright
  const ssrrStats = processLog('SSRR', 'ssrr.log', parsePlaywrightLog);
  if (ssrrStats) entries.push({ category: 'SSRR', ...ssrrStats });

  // Async via Playwright
  const asyncStats = processLog('Async', 'async.log', parsePlaywrightLog);
  if (asyncStats) entries.push({ category: 'Async', ...asyncStats });

  // Print to Console (no header, append-friendly)
  if (entries.length > 0) {
      entries.forEach(e => {
        console.log(`${commit},${timestamp},${e.category},${e.passed},${e.failed},${e.skipped || 0}`);
      });
  } else {
      console.error('No logs found to process.');
  }

  // Logs are left in LOG_DIR (.tmp)
}

updateCSV();
