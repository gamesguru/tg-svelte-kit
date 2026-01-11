import { redirect } from '@tg-svelte/kit';
import { COOKIE_NAME } from '../shared';

/** @type {import('@tg-svelte/kit').RequestHandler} */
export const GET = (event) => {
	event.cookies.delete(COOKIE_NAME, { path: '/cookies' });
	redirect(303, '/cookies');
};
