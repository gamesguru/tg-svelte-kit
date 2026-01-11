import { to_pojo } from './utils.js';

/** @type {import('@tg-svelte/kit').Load} */
export function load({ url }) {
	return {
		values: to_pojo(url.searchParams)
	};
}
