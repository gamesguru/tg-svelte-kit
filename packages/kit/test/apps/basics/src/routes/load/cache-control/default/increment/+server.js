import { json } from '@tg-svelte/kit';

export function GET({ cookies }) {
	cookies.set(
		'cache-control-default-count',
		+(cookies.get('cache-control-default-count') ?? 0) + 1 + '',
		{ path: '/' }
	);

	return json({});
}
