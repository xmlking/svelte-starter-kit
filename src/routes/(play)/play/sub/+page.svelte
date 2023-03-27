<script lang="ts">
	import { graphql } from '$houdini';
	import { onDestroy, onMount } from 'svelte';

	const schedules = graphql(`
		subscription StreamPolicy {
			tz_policies(order_by: [{ updated_at: desc_nulls_last }], limit: 50, offset: 0, where: { deleted_at: { _is_null: true } })  {
				id
				display_name
			}
		}
	`);

	// const livePolicy = graphql(`
	// 	query LivePolicy {
	// 		tz_policies(order_by: [{ updated_at: desc_nulls_last }], limit: 50, offset: 0, where: { deleted_at: { _is_null: true } }) @live {
	// 			id
	// 			display_name
	// 		}
	// 	}
	// `);

	onMount(() => {
		console.log('sub Mount')
		schedules.listen()
	})
	onDestroy(() => {
		console.log('sub Destroy')
		schedules.unlisten()
	})
	$: console.log('$schedules.data on load:', $schedules.data);
</script>
{#if $schedules.fetching}
loading...
{:else if $schedules.errors?.length}
	{JSON.stringify($schedules)}
{:else}
	{JSON.stringify($schedules.data)}
{/if}

{#if $schedules.data}
	<pre>{JSON.stringify($schedules.data, null, 4)}</pre>
{/if}
