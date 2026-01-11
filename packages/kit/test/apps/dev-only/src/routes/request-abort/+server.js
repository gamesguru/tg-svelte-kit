import { json } from '@tg-svelte/kit';

let aborted = false;

/** @type {import('@tg-svelte/kit').RequestHandler} */
export function GET() {
	return json({ aborted });
}

/** @type {import('@tg-svelte/kit').RequestHandler} */
export async function POST({ request }) {
	request.signal.addEventListener('abort', () => (aborted = true));
	await new Promise((r) => setTimeout(r, 1000));
	return json({ ok: true });
}
