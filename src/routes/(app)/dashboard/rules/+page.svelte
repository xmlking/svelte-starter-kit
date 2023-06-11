<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { DeleteRuleStore } from '$houdini';
	import { DataTable, DeleteButton, ErrorMessage, Link } from '$lib/components';
	import GraphQlErrors from '$lib/components/GraphQLErrors.svelte';
	import { ToastLevel, addToast } from '$lib/components/toast';
	import { Logger } from '$lib/utils';
	import {
		Breadcrumb,
		BreadcrumbItem,
		Button,
		ButtonGroup,
		Input,
		NavBrand,
		Navbar
	} from 'flowbite-svelte';
	import { createRender, createTable } from 'svelte-headless-table';
	import { addPagination, addSortBy, addTableFilter } from 'svelte-headless-table/plugins';
	import { MagnifyingGlass, RectangleGroup } from 'svelte-heros-v2';
	import { TimeDistance } from 'svelte-time-distance';
	import { writable } from 'svelte/store';
	import type { PageData } from './$houdini';

	const log = new Logger('routes:rules');

	export let data: PageData;
	$: ({ SearchSharedRules, formErrors, fieldErrors } = data);
	$: rules = $SearchSharedRules.data?.rules;
	$: ruleStore.set(rules ?? []);

	const ruleStore = writable(rules ?? []);
	const table = createTable(ruleStore, {
		page: addPagination({ initialPageSize: 5 }),
		tableFilter: addTableFilter(),
		sort: addSortBy()
	});

	const columns = table.createColumns([
		table.column({
			header: 'Name',
			accessor: (item) => item,
			id: 'name',
			cell: ({ value }) =>
				createRender(Link, {
					url: `/dashboard/rules/${value.id}`,
					content: value.displayName,
					title: value.description
				}),
			plugins: {
				tableFilter: {
					getFilterValue: ({ displayName }) => displayName
				},
				sort: {
					getSortValue: ({ displayName }) => displayName
				}
			}
		}),
		table.column({
			header: 'Updated At',
			accessor: 'updatedAt',
			cell: ({ value }) =>
				createRender(TimeDistance, {
					timestamp: value,
					class: 'decoration-solid'
				}),
			plugins: {
				tableFilter: {
					exclude: true
				},
				sort: {
					getSortValue: (value) => value
				}
			}
		}),
		table.column({
			header: 'Updated By',
			accessor: 'updatedBy'
		}),
		table.column({
			header: 'Tags',
			accessor: 'tags'
		}),
		table.column({
			header: 'Delete',
			id: 'delete',
			accessor: 'id',
			cell: ({ value }) =>
				createRender(DeleteButton).on('click', async () => deleteRule(value)),
			// cell: ({ value }) => createRender(Delete, { id: value }),
			plugins: {
				tableFilter: {
					exclude: true
				},
				sort: {
					disable: true
				}
			}
		})
	]);

	const tableViewModel = table.createViewModel(columns);

	// Search form
	let displayName = $page.url.searchParams.get('displayName') ?? '';
	let limit = $page.url.searchParams.get('limit') ?? '50';
	let offset = $page.url.searchParams.get('offset') ?? '0';
	// delete action
	const deleteRuleStore = new DeleteRuleStore();
	async function deleteRule(id: string) {
		console.log('in deleteRule...', id);
		const deletedAt = new Date();
		const { data } = await deleteRuleStore.mutate(
			{ id, deletedAt },
			{
				metadata: { logResult: true }
			}
		);
		if (data?.update_rules_by_pk?.displayName) {
			addToast({
				message: `Rule: ${data?.update_rules_by_pk?.displayName} deleted`,
				dismissible: true,
				duration: 10000,
				type: ToastLevel.Info
			});
			// invalidate('/dashboard/rules');
			await invalidateAll();
		} else {
			addToast({
				message: `Cannot delete: ${id}`,
				dismissible: true,
				duration: 10000,
				type: ToastLevel.Error
			});
		}
	}
</script>

<svelte:head>
	<title>Rules</title>
	<meta name="description" content="rules" />
</svelte:head>

<Breadcrumb aria-label="Default breadcrumb example" class="mb-6">
	<BreadcrumbItem href="/dashboard" home>Home</BreadcrumbItem>
	<BreadcrumbItem href="/dashboard/rules">Rules</BreadcrumbItem>
	<BreadcrumbItem>Search Rules</BreadcrumbItem>
</Breadcrumb>

<!-- <ErrorMessage error={loadError?.message} /> -->

<form data-sveltekit-noscroll>
	<Navbar border={true} rounded={true}>
		<NavBrand>
			<RectangleGroup />
			<span class="self-center whitespace-nowrap px-1 text-xl font-semibold dark:text-white">
				Golden Rules
			</span>
		</NavBrand>
		<ButtonGroup class="w-1/2">
			<Input
				name="displayName"
				value={displayName}
				autofocus
				class="input !rounded-r-none focus:outline-none"
				placeholder="Display Name"
			/>
			<!-- <Select
				name="limit"
				items={limits}
				value={limit}
				class="w-16 !rounded-none border-l-0"
			/> -->
			<input name="limit" value={limit} type="hidden" />
			<input name="offset" value={offset} type="hidden" />
			<Button type="submit" color="primary" class="!p-2.5"
				><MagnifyingGlass size="20" /></Button
			>
		</ButtonGroup>
		<Button href="/dashboard/rules/create">Add Rule</Button>
	</Navbar>
	<ErrorMessage error={fieldErrors?.displayName?.[0]} />
	<ErrorMessage error={fieldErrors?.limit?.[0]} />
	<ErrorMessage error={fieldErrors?.offset?.[0]} />
</form>

{#if $SearchSharedRules.fetching}
	<p>Fetching...</p>
{:else if $SearchSharedRules.errors}
	<GraphQlErrors errors={$SearchSharedRules.errors} />
{:else}
	<DataTable {tableViewModel} />
{/if}
