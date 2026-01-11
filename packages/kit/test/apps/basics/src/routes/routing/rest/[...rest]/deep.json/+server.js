/** @type {import('@tg-svelte/kit').RequestHandler} */
export function GET({ params }) {
	return new Response(params.rest);
}
