import { redirect } from '@tg-svelte/kit';

export function load() {
	redirect(undefined, './b');
}
