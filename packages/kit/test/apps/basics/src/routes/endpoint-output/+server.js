/** @type {import('@tg-svelte/kit').RequestHandler} */
export function OPTIONS() {
	return new Response('ok');
}
