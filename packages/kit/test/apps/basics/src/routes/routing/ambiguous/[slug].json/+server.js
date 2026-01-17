/** @type {import('@tg-svelte/kit').RequestHandler} */
export function GET(req) {
	return new Response(req.params.slug);
}
