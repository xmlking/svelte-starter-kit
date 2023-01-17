<script lang="ts">
	import type { GraphQLError } from "graphql";


	export let error: GraphQLError | undefined;
</script>

{#if error}
	<!-- <pre>{JSON.stringify(errors)}</pre> -->
	<p><span class="font-bold">Message:</span> <span class="text-ellipsis">{error?.message}</span></p>
	<p><span class="font-bold">Extensions:</span> <span class="text-ellipsis">{JSON.stringify(error?.extensions)}</span></p>
{/if}
