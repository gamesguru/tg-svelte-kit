import { redirect } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').Load} */
export function load() {
	redirect(301, 'https://example.com/</' + 'script>alert("pwned")');
}
