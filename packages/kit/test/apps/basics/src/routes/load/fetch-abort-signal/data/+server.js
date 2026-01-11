import { json } from '@tg-svelte/kit';

export async function GET() {
	return json({ message: 'success', timestamp: Date.now() });
}
