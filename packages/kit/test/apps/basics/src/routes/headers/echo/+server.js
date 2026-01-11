import { json } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').RequestHandler} */
export function GET({ request }) {
	/** @type {Record<string, string>} */
	const headers = {};
	request.headers.forEach((value, key) => {
		if (key !== 'cookie') {
			headers[key] = value;
		}
	});

	return json(headers);
}
