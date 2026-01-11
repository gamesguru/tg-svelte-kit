import { redirect } from '@tg-svelte/kit';

export const ssr = false;

export const load = ({ url }) => {
	if (url.pathname === '/redirect') {
		redirect(302, '/');
	}
};
