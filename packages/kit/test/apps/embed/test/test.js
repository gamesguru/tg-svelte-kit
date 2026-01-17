import { expect } from '@playwright/test';
import { test } from '../../../utils.js';

/** @typedef {import('@playwright/test').Response} Response */

test.describe.configure({ mode: 'parallel' });

test.describe('embed', () => {
	test('serves embedded components in page', async ({ page, javaScriptEnabled }) => {
		// Capture logs to file
		page.on('console', (msg) => console.log(msg.text()));

		await page.goto('/embed');

		if (javaScriptEnabled) {
			try {
				await expect(page.getByTestId('a').first()).toHaveText('a (browser)');
				await expect(page.getByTestId('b').first()).toHaveText('b (browser)');
			} catch (e) {
				console.log('PAGE CONTENT DUMP:', await page.content());
				throw e;
			}
		} else {
			expect(await page.textContent('[data-testid="a"]')).toBe('a (server)');
			expect(await page.textContent('[data-testid="b"]')).toBe('b (server)');
		}
	});
});
