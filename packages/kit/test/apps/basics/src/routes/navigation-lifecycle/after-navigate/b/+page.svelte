<script>
	import { afterNavigate } from '$app/navigation';

	/** @type {import('@tg-svelte/kit').NavigationTarget | null} */
	let from;

	/** @type {import('@tg-svelte/kit').NavigationTarget} */
	let to;

	afterNavigate((navigation) => {
		from = navigation.from;
		to = navigation.to;
	});
</script>

<h1>{from?.url.pathname} -> {to?.url.pathname}</h1>
<a href="/navigation-lifecycle/after-navigate/a">/a</a>
