import { json } from '@tg-svelte/kit';

export const prerender = true;

export function GET() {
	return json({ message: 'Im prerendered and called from a non-prerendered +page.server.js' });
}
