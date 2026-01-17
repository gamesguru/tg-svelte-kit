import { redirect } from '@tg-svelte/kit';

export function load() {
	redirect(302, '/shadowed/redirected');
}
