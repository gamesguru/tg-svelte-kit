import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const LOG_DIR = '.tmp/ci-logs/latest';

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

function parseMixedLog(content) {
	const v = parseVitestLog(content);
	const p = parsePlaywrightLog(content);
	return {
		passed: v.passed + p.passed,
		failed: v.failed + p.failed,
		skipped: v.skipped + p.skipped
	};
}

function stripAnsi(str) {
	return str.replace(
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
		''
	);
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

	// Kit Unit via Vitest
	const kitUnitStats = processLog('Kit Unit', 'kit-unit.log', parseVitestLog);
	if (kitUnitStats) entries.push({ category: 'Kit Unit', ...kitUnitStats });

	// Kit Integration via Playwright (Split by package)
	const kitIntegrationLog = path.join(LOG_DIR, 'kit-integration.log');
	if (fs.existsSync(kitIntegrationLog)) {
		const content = stripAnsi(fs.readFileSync(kitIntegrationLog, 'utf-8'));
		// Regex to find package headers: > package-name@version command path
		// We want to capture the package name.
		// Example: > test-embed@0.0.1 test:dev ...

		// Split by lines starting with "> " (headers)
		// Note: We use a lookahead or just standard split.
		// The file usually starts with a header or newline-header.
		// We'll splits on "\n> " to be safe towards content.
		// Split by newline and process line by line to be robust against split failures
		const lines = content.split('\n');
		const packageStats = {};
		let currentPackage = null;

		// Temporary stats accumulator for current package
		let currentStats = { passed: 0, failed: 0, skipped: 0 };

		for (let line of lines) {
			line = line.trim();
			if (!line) continue;

			// Check for package header: > package-name@version script path
			// We ignore "> command" lines like "> DEV=true..." by enforcing the @version pattern
			// Regex: > package@version script
			const headerMatch = line.match(/^> ([@\w/-]+)@[\w.-]+ ([^\s]+)/);
			if (headerMatch) {
				// Found a new package header.
				// Save stats for previous package if it existed
				if (
					currentPackage &&
					(currentStats.passed > 0 || currentStats.failed > 0 || currentStats.skipped > 0)
				) {
					if (!packageStats[currentPackage])
						packageStats[currentPackage] = { passed: 0, failed: 0, skipped: 0 };
					packageStats[currentPackage].passed += currentStats.passed;
					packageStats[currentPackage].failed += currentStats.failed;
					packageStats[currentPackage].skipped += currentStats.skipped;
				}

				const pkgName = headerMatch[1];
				const scriptName = headerMatch[2];
				// Use composite key: "package (script)"
				currentPackage = `${pkgName} (${scriptName})`;

				// Reset accumulator for new package
				currentStats = { passed: 0, failed: 0, skipped: 0 };
				continue; // Done with this line
			}

			// If inside a package/section, check for stats patterns
			if (currentPackage) {
				// Parse specific line patterns for Playwright stats
				// Stats might be on separate lines or same lines.
				// Regexes from parsePlaywrightLog:
				// ^\s*(\d+) passed
				// ^\s*(\d+) failed
				// ^\s*(\d+) skipped

				const passedMatch = line.match(/(\d+) passed/);
				if (passedMatch) currentStats.passed += parseInt(passedMatch[1], 10);

				const failedMatch = line.match(/(\d+) failed/);
				if (failedMatch) currentStats.failed += parseInt(failedMatch[1], 10);

				const skippedMatch = line.match(/(\d+) skipped/);
				if (skippedMatch) currentStats.skipped += parseInt(skippedMatch[1], 10);
			}
		}

		// Commit last package stats
		if (
			currentPackage &&
			(currentStats.passed > 0 || currentStats.failed > 0 || currentStats.skipped > 0)
		) {
			if (!packageStats[currentPackage])
				packageStats[currentPackage] = { passed: 0, failed: 0, skipped: 0 };
			packageStats[currentPackage].passed += currentStats.passed;
			packageStats[currentPackage].failed += currentStats.failed;
			packageStats[currentPackage].skipped += currentStats.skipped;
		}

		// Add entries for each package
		if (Object.keys(packageStats).length > 0) {
			for (const [pkg, stats] of Object.entries(packageStats)) {
				entries.push({ category: `Kit Integration - ${pkg}`, ...stats });
			}
			// Also extract a "Total" for reference? Maybe user doesn't need it if we have granular.
			// Or keep the "Kit Integration" total as well?
			// User said "capture each section". Granular is better.
			// Let's add a Total row too for backward compat/summary.
			const totalStats = Object.values(packageStats).reduce(
				(acc, curr) => ({
					passed: acc.passed + curr.passed,
					failed: acc.failed + curr.failed,
					skipped: acc.skipped + curr.skipped
				}),
				{ passed: 0, failed: 0, skipped: 0 }
			);

			entries.push({ category: 'Kit Integration Total', ...totalStats });
		} else {
			// Fallback if regex fails (e.g. no headers found), just parse whole file?
			// Or maybe it's just empty.
			// Let's try parsing whole file just in case the split failed.
			const totalStats = parsePlaywrightLog(content);
			if (totalStats.passed > 0 || totalStats.failed > 0 || totalStats.skipped > 0) {
				entries.push({ category: 'Kit Integration (Unparsed)', ...totalStats });
			}
		}
	}

	// SSRR via Playwright
	const ssrrStats = processLog('SSRR', 'ssrr.log', parsePlaywrightLog);
	if (ssrrStats) entries.push({ category: 'SSRR', ...ssrrStats });

	// Async via Playwright
	const asyncStats = processLog('Async', 'async.log', parsePlaywrightLog);
	if (asyncStats) entries.push({ category: 'Async', ...asyncStats });

	// Kit Tests (Unit + Integration) via Mixed
	const kitStats = processLog('Kit', 'kit.log', parseMixedLog);
	if (kitStats) entries.push({ category: 'Kit', ...kitStats });

	// Cross-Platform via Mixed (Playwright + Vitest)
	const crossStats = processLog('Cross', 'cross.log', parseMixedLog);
	if (crossStats) entries.push({ category: 'Cross', ...crossStats });

	// Others via Vitest (Adapter tests) and Playwright (E2E)
	const othersStats = processLog('Others', 'others.log', parseMixedLog);
	if (othersStats) entries.push({ category: 'Others', ...othersStats });

	// Legacy Template via Playwright
	const legacyStats = processLog('Legacy', 'legacy.log', parsePlaywrightLog);
	if (legacyStats) entries.push({ category: 'Legacy', ...legacyStats });

	// Print to Console (no header check unless -t passed)
	if (process.argv.includes('-t')) {
		console.log('Commit,Timestamp,Category,Passed,Failed,Skipped');
	}

	if (entries.length > 0) {
		entries.forEach((e) => {
			console.log(`${commit},${timestamp},${e.category},${e.passed},${e.failed},${e.skipped || 0}`);
		});
	} else {
		console.error('No logs found to process.');
	}

	// Logs are left in LOG_DIR (.tmp)
}

updateCSV();
