<script lang="ts">
	import { browser } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { DeletePolicyStore } from '$houdini';
	import { DataTable, DeleteButton, ErrorMessage, Link } from '$lib/components';
	import GraphQlErrors from '$lib/components/GraphQLErrors.svelte';
	import { ToastLevel, addToast } from '$lib/components/toast';
	import { subjectTypeOptions } from '$lib/models/enums';
	import { Logger } from '$lib/utils';
	import {
		Breadcrumb,
		BreadcrumbItem,
		Button,
		ButtonGroup,
		NavBrand,
		Navbar,
		Select
	} from 'flowbite-svelte';
	import { createRender, createTable } from 'svelte-headless-table';
	import { addPagination, addSortBy, addTableFilter } from 'svelte-headless-table/plugins';
	import {
		DevicePhoneMobile,
		RectangleGroup,
		ShieldCheck,
		User,
		UserCircle,
		UserGroup
	} from 'svelte-heros-v2';
	import { default as SelectFetch } from 'svelte-select';
	import { TimeDistance } from 'svelte-time-distance';
	import { writable } from 'svelte/store';
	import type { PageData } from './$houdini';

	const log = new Logger('routes:policies');

	export let data: PageData;
	$: ({ SearchPolicies, formErrors, fieldErrors } = data);
	$: policies = $SearchPolicies.data?.policies;
	$: policyStore.set(policies ?? []);

	const policyStore = writable(policies ?? []);
	const table = createTable(policyStore, {
		page: addPagination({ initialPageSize: 5 }),
		tableFilter: addTableFilter(),
		sort: addSortBy()
	});

	const columns = table.createColumns([
		table.column({
			header: 'Rule Name',
			accessor: (item) => item,
			id: 'name',
			cell: ({ value }) =>
				createRender(Link, {
					url: `/dashboard/policies/${value.id}`,
					content: value.rule.displayName,
					title: value.rule.description
				}),
			plugins: {
				tableFilter: {
					getFilterValue: ({ rule }) => rule.displayName
				},
				sort: {
					getSortValue: ({ rule }) => rule.displayName
				}
			}
		}),
		table.column({
			header: 'Subject',
			accessor: 'subjectDisplayName'
		}),
		table.column({
			header: 'Updated',
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
			header: 'Source',
			id: 'source',
			accessor: (item) => `${item.rule.source ?? ''}:${item.rule.sourcePort ?? ''}`
		}),
		table.column({
			header: 'Destination',
			id: 'destination',
			accessor: (item) => `${item.rule.destination ?? ''}:${item.rule.destinationPort ?? ''}`
		}),
		table.column({
			header: 'Active',
			accessor: 'active'
		}),
		table.column({
			header: 'Shared',
			id: 'shared',
			accessor: (item) => item.rule.shared
		}),
		table.column({
			header: 'Delete',
			id: 'delete',
			accessor: (item) => item,
			cell: ({ value }) =>
				createRender(DeleteButton).on('click', async () =>
					deletePolicy(value.id, value.rule.id)
				),
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
	let searchForm: HTMLFormElement;
	let subjectId = $page.url.searchParams.get('subjectId') ?? '';
	let subjectType = $page.url.searchParams.get('subjectType') ?? '';
	let subjectDisplayName = $page.url.searchParams.get('subjectDisplayName') ?? '';
	let limit = $page.url.searchParams.get('limit') ?? '50';
	let offset = $page.url.searchParams.get('offset') ?? '0';

	let subject = subjectId
		? {
				id: subjectId,
				displayName: subjectDisplayName,
				secondaryId: ''
		  }
		: null;

	async function fetchSubjects(filterText: string) {
		if (!filterText.length) return Promise.resolve([]);
		const response = await fetch(
			`/api/directory/search?subType=${subjectType}&filter=&search=${filterText}`
		);
		if (!response.ok) throw new Error(`An error has occurred: ${response.status}`);
		const data = await response.json();
		if (!data) throw new Error('no data');
		return data.results;
	}
	async function clearSubject(event: Event) {
		subject = null;
		if (browser) {
			await goto(
				`/dashboard/policies?subjectType=${subjectType}&limit=${limit}&offset=${offset}`
			);
		}
	}

	// delete action
	const deletePolicyStore = new DeletePolicyStore();
	async function deletePolicy(policyId: string, ruleId: string) {
		console.log('in deletePolicy...', policyId, ruleId);
		const deletedAt = new Date();
		const { data } = await deletePolicyStore.mutate(
			{ policyId, ruleId, deletedAt },
			{
				metadata: { logResult: true }
			}
		);
		if (data?.update_policies_by_pk && data?.update_rules?.affected_rows) {
			addToast({
				message: `Policy and associated rule: ${data?.update_rules?.returning[0].displayName} deleted`,
				dismissible: true,
				duration: 10000,
				type: ToastLevel.Info
			});
			await invalidateAll();
		} else if (data?.update_policies_by_pk) {
			addToast({
				message: `Policy ${data?.update_policies_by_pk.id} deleted`,
				dismissible: true,
				duration: 10000,
				type: ToastLevel.Info
			});
			await invalidateAll();
		} else {
			addToast({
				message: `Unable to delete Policy`,
				dismissible: true,
				duration: 50000,
				type: ToastLevel.Error
			});
		}
	}
</script>

<svelte:head>
	<title>Policies</title>
	<meta name="description" content="policies" />
</svelte:head>

<Breadcrumb aria-label="Default breadcrumb example" class="mb-6">
	<BreadcrumbItem href="/dashboard" home>Home</BreadcrumbItem>
	<BreadcrumbItem href="/dashboard/policies">Policy</BreadcrumbItem>
	<BreadcrumbItem>Search Policies</BreadcrumbItem>
</Breadcrumb>

<form data-sveltekit-noscroll bind:this={searchForm}>
	<Navbar border={true} rounded={true}>
		<NavBrand>
			<ShieldCheck />
			<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
				Policies
			</span>
		</NavBrand>
		<ButtonGroup class="w-1/3">
			<Select
				name="subjectType"
				class="!w-fit !rounded-r-none"
				items={subjectTypeOptions}
				bind:value={subjectType}
				on:change={clearSubject}
				placeholder="Select Type"
			/>
			<SelectFetch
				class="w-auto !rounded-l-none !bg-gray-50 !px-2 dark:!bg-gray-700"
				itemId="displayName"
				label="displayName"
				bind:value={subject}
				on:change={() => searchForm.requestSubmit()}
				on:clear={clearSubject}
				loadOptions={fetchSubjects}
				--list-z-index="100"
			>
				<b slot="prepend" class="p-2">
					{#if subjectType == 'group'}
						<UserGroup />
					{:else if subjectType == 'service_account'}
						<UserCircle />
					{:else if subjectType == 'device'}
						<DevicePhoneMobile />
					{:else if subjectType == 'device_pool'}
						<RectangleGroup />
					{:else}
						<User />
					{/if}
				</b>
				<svelte:fragment slot="input-hidden" let:value>
					<input type="hidden" name="subjectId" value={value ? value.id : null} />
					<input
						type="hidden"
						name="subjectDisplayName"
						value={value ? value.displayName : null}
					/>
				</svelte:fragment>
			</SelectFetch>
		</ButtonGroup>
		<Button href="/dashboard/policies/create">Add Policy</Button>
	</Navbar>
	<input type="hidden" name="limit" value={limit} />
	<input type="hidden" name="offset" value={offset} />
	<ErrorMessage error={fieldErrors?.subjectType?.[0]} />
	<ErrorMessage error={fieldErrors?.subjectId?.[0]} />
	<ErrorMessage error={fieldErrors?.limit?.[0]} />
	<ErrorMessage error={fieldErrors?.offset?.[0]} />
</form>

{#if $SearchPolicies.fetching}
	<p>Fetching...</p>
{:else if $SearchPolicies.errors}
	<GraphQlErrors errors={$SearchPolicies.errors} />
{:else}
	<DataTable {tableViewModel} />
{/if}

<style lang="postcss">
	:global(td.matches) {
		background: rgba(46, 196, 182, 0.2);
	}
	:global(.sv-control) {
		--sv-min-height: 48px;
		border-radius: 0.5rem !important;
	}
</style>
