import { base, assets } from '$app/paths';

/** @type {import('@tg-svelte/kit').Load} */
export async function load() {
	return {
		paths: {
			base,
			assets
		}
	};
}
