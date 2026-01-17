import { redirect } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').RequestHandler} */
export const GET = (event) => {
	const sneaky = 'teapot%2C%20jane%20austen';
	event.cookies.set('encoding', sneaky, { path: '/cookies/encoding' });
	redirect(303, '/cookies/encoding');
};
