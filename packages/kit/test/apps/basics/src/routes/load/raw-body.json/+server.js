import { json } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').RequestHandler} */
export async function POST({ request }) {
	const rawBody = await request.text();
	const body = JSON.parse(rawBody);

	return json({
		body,
		rawBody
	});
}
