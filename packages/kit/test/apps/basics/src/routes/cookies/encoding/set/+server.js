import { redirect } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').RequestHandler} */
export const GET = (event) => {
	const needsEncoding = 'teapot, jane austen';
	event.cookies.set('encoding', needsEncoding, { path: '/cookies/encoding' });
	redirect(303, '/cookies/encoding');
};
