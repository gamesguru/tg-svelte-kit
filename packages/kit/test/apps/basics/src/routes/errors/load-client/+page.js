import { browser } from '$app/environment';

/** @type {import('@tg-svelte/kit').Load} */
export async function load() {
	if (browser) {
		throw new Error('Crashing now');
	}

	return {};
}
