import { expect } from '@playwright/test';
import { test } from '../../../utils.js';

/** @typedef {import('@playwright/test').Response} Response */

test.describe.configure({ mode: 'parallel' });

test.describe('embed', () => {
	test('serves embedded components in page', async ({ page, javaScriptEnabled }) => {
		page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
		page.on('pageerror', err => console.log('BROWSER ERROR:', err));
		await page.goto('/embed');

		if (javaScriptEnabled) {
			await expect(page.getByTestId('a')).toHaveText('a (browser)');
			await expect(page.getByTestId('b')).toHaveText('b (browser)');
		} else {
			expect(await page.textContent('[data-testid="a"]')).toBe('a (server)');
			expect(await page.textContent('[data-testid="b"]')).toBe('b (server)');
		}
	});
});
