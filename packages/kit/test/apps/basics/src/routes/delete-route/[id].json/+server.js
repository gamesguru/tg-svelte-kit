import { json } from '@tg-svelte/kit';

/** @type {import('./$types').RequestHandler} */
export function DELETE(event) {
	return json({
		id: event.params.id
	});
}
