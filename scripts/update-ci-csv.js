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

function parseGranularLog(content, categoryPrefix) {
	const lines = content.split('\n');
	const packageStats = {};
	let currentPackage = null;
	let currentStats = { passed: 0, failed: 0, skipped: 0, unknown: 0 };

	const commitPackageStats = () => {
		if (currentPackage) {
			if (!packageStats[currentPackage])
				packageStats[currentPackage] = { passed: 0, failed: 0, skipped: 0, unknown: 0 };

			let totalFound = currentStats.passed + currentStats.failed + currentStats.skipped;
			if (currentStats.expected !== undefined && currentStats.expected > totalFound) {
				currentStats.unknown += currentStats.expected - totalFound;
			} else if (totalFound === 0 && currentStats.expected === undefined) {
				// No results found and no "Running X tests" - implies crash or empty
				currentStats.unknown += 1;
			}

			packageStats[currentPackage].passed += currentStats.passed;
			packageStats[currentPackage].failed += currentStats.failed;
			packageStats[currentPackage].skipped += currentStats.skipped;
			packageStats[currentPackage].unknown += currentStats.unknown;
		}
	};

	for (let line of lines) {
		line = line.trim();
		if (!line) continue;

		// Header: > package@version script
		const headerMatch = line.match(/^> ([@\w/-]+)@[\w.-]+ ([^\s]+)/);
		if (headerMatch) {
			commitPackageStats();
			const pkgName = headerMatch[1];
			const scriptName = headerMatch[2];
			currentPackage = `${pkgName} (${scriptName})`;
			currentStats = { passed: 0, failed: 0, skipped: 0, unknown: 0 };
			continue;
		}

		if (currentPackage) {
			// Vitest: Tests  345 passed | ...
			const vitestTestsMatch = line.match(/Tests\s+.*?(\d+) passed/);
			if (vitestTestsMatch) {
				currentStats.passed += parseInt(vitestTestsMatch[1], 10);
				const f = line.match(/(\d+) failed/);
				if (f) currentStats.failed += parseInt(f[1], 10);
				const s = line.match(/(\d+) skipped/);
				if (s) currentStats.skipped += parseInt(s[1], 10);
				continue;
			}

			// Vitest Files: Test Files ... (Ignore to avoid double counting if regex was loose)
			if (line.includes('Test Files ')) continue;

			// Playwright/Vitest Individual Lines (for incomplete runs)
			const linePassed = line.match(/^\s*[✓✔]\s+/);
			if (linePassed) {
				currentStats.passed++;
				continue;
			}
			const lineFailed = line.match(/^\s*[✘✖]\s+/);
			if (lineFailed) {
				currentStats.failed++;
				continue;
			}

			// Playwright: 256 passed (50.1s)
			// Look for digits at start of line followed by " passed"
			const pwPassed = line.match(/^(\d+) passed/);
			if (pwPassed) currentStats.passed = Math.max(currentStats.passed, parseInt(pwPassed[1], 10));

			const pwFailed = line.match(/^(\d+) failed/);
			if (pwFailed) currentStats.failed = Math.max(currentStats.failed, parseInt(pwFailed[1], 10));

			const pwSkipped = line.match(/^(\d+) skipped/);
			if (pwSkipped)
				currentStats.skipped = Math.max(currentStats.skipped, parseInt(pwSkipped[1], 10));

			const runningMatch = line.match(/^Running (\d+) tests/);
			if (runningMatch) {
				currentStats.expected = parseInt(runningMatch[1], 10);
			}
		}
	}
	commitPackageStats();

	const entries = [];
	// Individual Rows
	if (Object.keys(packageStats).length > 0) {
		for (const [pkg, stats] of Object.entries(packageStats)) {
			entries.push({ category: `${categoryPrefix} - ${pkg}`, ...stats });
		}
		// Total Row
		const totalStats = Object.values(packageStats).reduce(
			(acc, curr) => ({
				passed: acc.passed + curr.passed,
				failed: acc.failed + curr.failed,
				skipped: acc.skipped + curr.skipped,
				unknown: (acc.unknown || 0) + (curr.unknown || 0)
			}),
			{ passed: 0, failed: 0, skipped: 0, unknown: 0 }
		);
		entries.push({ category: `${categoryPrefix} Total`, ...totalStats });
	} else {
		// Fallback: Parse entire content as mixed log if no headers found
		const mixed = parseMixedLog(content);
		if (mixed.passed > 0 || mixed.failed > 0 || mixed.skipped > 0) {
			entries.push({ category: `${categoryPrefix} (Unparsed)`, ...mixed, unknown: 0 });
		}
	}
	return entries;
}

function updateCSV() {
	const commit = getCommitInfo();
	const timestamp = new Date().toISOString();

	const entries = [];

	// Lint
	const lintLog = path.join(LOG_DIR, 'lint.log');
	if (fs.existsSync(lintLog)) {
		const content = stripAnsi(fs.readFileSync(lintLog, 'utf-8'));
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

	// Kit Integration via Granular Parser
	const kitIntegrationLog = path.join(LOG_DIR, 'kit-integration.log');
	if (fs.existsSync(kitIntegrationLog)) {
		const content = stripAnsi(fs.readFileSync(kitIntegrationLog, 'utf-8'));
		entries.push(...parseGranularLog(content, 'Kit Integration'));
	}

	// SSRR via Granular Parser
	const ssrrLog = path.join(LOG_DIR, 'ssrr.log');
	if (fs.existsSync(ssrrLog)) {
		const content = stripAnsi(fs.readFileSync(ssrrLog, 'utf-8'));
		entries.push(...parseGranularLog(content, 'SSRR'));
	}

	// Async via Granular Parser
	const asyncLog = path.join(LOG_DIR, 'async.log');
	if (fs.existsSync(asyncLog)) {
		const content = stripAnsi(fs.readFileSync(asyncLog, 'utf-8'));
		entries.push(...parseGranularLog(content, 'Async'));
	}

	// Kit Tests (Unit + Integration) via Mixed
	const kitStats = processLog('Kit', 'kit.log', parseMixedLog);
	if (kitStats) entries.push({ category: 'Kit', ...kitStats });

	// Cross-Platform via Granular Parser (Mixed Playwright + Vitest)
	const crossLog = path.join(LOG_DIR, 'cross.log');
	if (fs.existsSync(crossLog)) {
		const content = stripAnsi(fs.readFileSync(crossLog, 'utf-8'));
		entries.push(...parseGranularLog(content, 'Cross'));
	}

	// Others via Granular Parser
	const othersLog = path.join(LOG_DIR, 'others.log');
	if (fs.existsSync(othersLog)) {
		const content = stripAnsi(fs.readFileSync(othersLog, 'utf-8'));
		entries.push(...parseGranularLog(content, 'Others'));
	}

	// Legacy Template via Granular Parser
	const legacyLog = path.join(LOG_DIR, 'legacy.log');
	if (fs.existsSync(legacyLog)) {
		const content = stripAnsi(fs.readFileSync(legacyLog, 'utf-8'));
		entries.push(...parseGranularLog(content, 'Legacy'));
	}

	// Print to Console (no header check unless -t passed)
	if (process.argv.includes('-t')) {
		console.log('Commit,Timestamp,Category,Passed,Failed,Skipped,Unknown');
	}

	if (entries.length > 0) {
		entries.forEach((e) => {
			console.log(
				`${commit},${timestamp},${e.category},${e.passed},${e.failed},${e.skipped || 0},${
					e.unknown || 0
				}`
			);
		});
	} else {
		console.error('No logs found to process.');
	}

	// Logs are left in LOG_DIR (.tmp)
}

updateCSV();
