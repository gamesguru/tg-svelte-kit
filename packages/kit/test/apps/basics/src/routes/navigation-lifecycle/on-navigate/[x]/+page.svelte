<script>
	import { onNavigate } from '$app/navigation';

	/** @type {import('@tg-svelte/kit').NavigationTarget} */
	let from;

	/** @type {import('@tg-svelte/kit').NavigationTarget} */
	let to;

	/** @type {Omit<import('@tg-svelte/kit').NavigationType, 'enter' | 'leave'>} */
	let type;

	let called_return = false;

	onNavigate((navigation) => {
		from = navigation.from;
		to = navigation.to;
		type = navigation.type;
	});

	onNavigate(() => {
		return () => {
			called_return = true;
		};
	});
</script>

<h1>{`${from?.url.pathname} -> ${to?.url.pathname}`} ({type ?? '...'}) {called_return}</h1>
<a href="/navigation-lifecycle/on-navigate/b">/b</a>
