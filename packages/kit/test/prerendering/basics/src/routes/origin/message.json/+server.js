import { json } from '@tg-svelte/kit';

// TODO remove this when we're able to replace the global `fetch` call in the
// neighbouring `+page.server.js` with SvelteKit's `fetch`
export const prerender = true;

export function GET() {
	return json({
		message: 'hello'
	});
}
