// @ts-nocheck: ignore JS-like code
/** @type {import('@tg-svelte/kit').Reroute} */
export function reroute({ url }) {
	if (url.hash === '#/reroute-a') {
		// works with leading hash...
		return '#/rerouted';
	}

	if (url.hash === '#/reroute-b') {
		// ...and without
		return '/rerouted';
	}
}
