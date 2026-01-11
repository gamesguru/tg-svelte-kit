import { redirect } from '@tg-svelte/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	await fetch('/shadowed/redirect-get-with-cookie-from-fetch/endpoint');
	redirect(302, '/shadowed/redirected');
}
