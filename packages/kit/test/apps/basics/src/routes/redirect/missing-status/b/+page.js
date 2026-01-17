import { redirect } from '@tg-svelte/kit';

export function load() {
	// @ts-ignore
	redirect(555, './a');
}
