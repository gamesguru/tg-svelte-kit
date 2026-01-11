import { redirect } from '@tg-svelte/kit';

export const load = () => {
	return redirect(302, '/goto/testfinish');
};
