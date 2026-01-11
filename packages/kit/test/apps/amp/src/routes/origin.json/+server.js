import { json } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').RequestHandler} */
export function GET({ url }) {
	return json({ origin: url.origin });
}
