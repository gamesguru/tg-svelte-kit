import { redirect } from '@tg-svelte/kit';

export function GET() {
	redirect(302, '/');
}
