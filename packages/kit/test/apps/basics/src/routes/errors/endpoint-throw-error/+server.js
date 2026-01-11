import { error } from '@tg-svelte/kit';

export function GET() {
	error(401, 'You shall not pass');
}
