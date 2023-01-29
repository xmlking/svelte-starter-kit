<script lang="ts">
  import { graphql } from '$houdini';
	const store = graphql(`
		query allOrders1 @load {
			customer(limit: 2) {
				email
				first_name
			}
		}
	`);
</script>

<a href="./route_2">route_2</a>

<pre>{JSON.stringify($store, null, 2)}</pre>
