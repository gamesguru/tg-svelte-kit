<script context="module">
	import { browser } from '$app/environment';
	if (browser) {
		document;
	}
</script>

<script>
	import { browser as appBrowser } from '$app/environment';
</script>

{appBrowser ? document : ''}

<p>Works</p>
