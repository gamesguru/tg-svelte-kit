import { json } from '@tg-svelte/kit';

export function GET({ cookies }) {
	cookies.set(
		'cache-control-bust-count',
		+(cookies.get('cache-control-bust-count') ?? 0) + 1 + '',
		{ path: '/' }
	);

	return json({});
}
