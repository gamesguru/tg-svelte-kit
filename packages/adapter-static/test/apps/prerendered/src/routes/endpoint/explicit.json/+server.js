import { json } from '@tg-svelte/kit';

export const prerender = true;

/** @type {import('./$types').RequestHandler} */
export function GET() {
	return json({ answer: 42 });
}
