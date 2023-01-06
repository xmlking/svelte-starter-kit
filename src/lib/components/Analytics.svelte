<!--
USAGEL: in your +layout.svelte:
Ref: https://joyofcode.xyz/sveltekit-google-analytics

<script lang="ts">
	import { dev } from '$app/environment';
	import { PUBLIC_GOOGLE_ANALYTICS_TARGET_ID } from '$env/static/public';
	import { Analytics } from '$lib/components';
</script>

{#if !dev && PUBLIC_GOOGLE_ANALYTICS_TARGET_ID}
	<Analytics TARGET_ID={PUBLIC_GOOGLE_ANALYTICS_TARGET_ID} />
{/if}

<slot />
-->
<script lang="ts">
	import { page } from '$app/stores';

	export let TARGET_ID: string;

	const src = `https://www.googletagmanager.com/gtag/js?id=${TARGET_ID}`;

	$: {
		if (typeof gtag !== 'undefined') {
			// eslint-disable-next-line no-undef
			gtag('config', TARGET_ID, {
				page_title: document.title,
				page_path: $page.url.pathname
			});
		}
	}
</script>

<svelte:head>
	<!-- Global site tag (gtag.js) - Google Analytics -->
	<script async {src}></script>
	<script {TARGET_ID}>
		window.dataLayer = window.dataLayer || [];

		function gtag() {
			dataLayer.push(arguments);
		}

		gtag('js', new Date());
		gtag('config',  document.currentScript.getAttribute('TARGET_ID'), { send_page_view: false });
	</script>
</svelte:head>
