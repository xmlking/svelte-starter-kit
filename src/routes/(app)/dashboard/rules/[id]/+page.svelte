<script lang="ts">
	import { Logger } from '$lib/utils';
	import { Breadcrumb, BreadcrumbItem, Heading, P } from 'flowbite-svelte';
	import type { PageData } from './$types';

	const log = new Logger('routes:policies:update');
	export let data: PageData;
</script>

<svelte:head>
	<title>Rules | Update</title>
	<meta name="description" content="Update Rule" />
</svelte:head>

<Breadcrumb aria-label="Default breadcrumb example" class="mb-6">
	<BreadcrumbItem href="/dashboard" home>Home</BreadcrumbItem>
	<BreadcrumbItem href="/dashboard/rules">Rules</BreadcrumbItem>
	<BreadcrumbItem>Update Rule</BreadcrumbItem>
</Breadcrumb>

<Heading tag="h4" class="pb-5">Update Rule</Heading>
<P>TODO</P>
