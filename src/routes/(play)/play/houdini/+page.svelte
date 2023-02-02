<script lang="ts">
	import { CachePolicy } from '$houdini';
	import type { PageData } from './$houdini';

	export let data: PageData;
	$: ({ ListPolicies2 } = data);
</script>

<button class="btn" on:click={() => ListPolicies2.loadNextPage()}>load more</button>
<button class="btn-accent btn" on:click={() => ListPolicies2.fetch({ policy: CachePolicy.NetworkOnly })}>refetch</button>

{#if $ListPolicies2.fetching}
	Loading...
{:else}
	<details>
		<summary>raw data with @cache(policy: CacheAndNetwork)</summary>
		<pre>
    	{JSON.stringify($ListPolicies2.data, null, 2)}
  	</pre>
	</details>
{/if}

<div>
	created_at: {$ListPolicies2.data?.tz_policies?.[0].created_at} // if created_at is date type, use .toISOString() .toLocaleString()
</div>

<pre>
    errors: {JSON.stringify($ListPolicies2.errors, null, 2)}
</pre>
<pre>
    fetching: {JSON.stringify($ListPolicies2.fetching, null, 2)}
</pre>
<pre>
    partial: {JSON.stringify($ListPolicies2.partial, null, 2)}
</pre>
<pre>
    variables: {JSON.stringify($ListPolicies2.variables, null, 2)}
</pre>
<pre>
    source: {JSON.stringify($ListPolicies2.source, null, 2)}
</pre>
