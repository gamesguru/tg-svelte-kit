import { json } from '@tg-svelte/kit';

export function GET() {
	return json({
		answer: 42
	});
}
