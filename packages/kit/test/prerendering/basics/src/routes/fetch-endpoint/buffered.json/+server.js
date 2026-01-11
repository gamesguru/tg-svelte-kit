import { json } from '@tg-svelte/kit';

export async function GET() {
	return json({ answer: 42 });
}
