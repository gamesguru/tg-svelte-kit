import { redirect } from '@tg-svelte/kit';

export function load() {
	redirect(307, encodeURI('苗条'));
}
