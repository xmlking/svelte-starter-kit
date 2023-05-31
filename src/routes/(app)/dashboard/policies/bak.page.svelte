<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Delete, ErrorMessage, Link } from '$lib/components';
	import { ToastLevel, addToast } from '$lib/components/toast';
	import { rows, subjectTypeOptions } from '$lib/models/enums';
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
	import { Render, Subscribe, createRender, createTable } from 'svelte-headless-table';
	import { addPagination, addSortBy, addTableFilter } from 'svelte-headless-table/plugins';
	import {
		ChevronDown,
		ChevronUp,
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

	const log = new Logger('routes:policies');

	export let form;
	$: if (form?.actionResult)
		addToast({
			message: `${form.actionResult.displayName} deleted`,
			dismissible: true,
			duration: 10000,
			type: ToastLevel.Info
		});
	$: if (form?.actionError)
		addToast({
			message: form.actionError.message,
			dismissible: true,
			duration: 10000,
			type: ToastLevel.Error
		});

	export let data;
	$: ({ policies, loadError, formErrors, fieldErrors } = data);
	$: policyStore.set(policies ?? []);

	const policyStore = writable(policies ?? []);
	const table = createTable(policyStore, {
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
			header: 'Created',
			accessor: 'createdAt',
			cell: ({ value }) =>
				createRender(TimeDistance, {
					timestamp: Date.parse(value),
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
			accessor: 'id',
			// cell: ({ value }) => createRender(DeleteButton).on('click', async () => deletePolicy(value))
			cell: ({ value }) => createRender(Delete, { id: value }),
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

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } =
		table.createViewModel(columns);
	const { pageIndex, pageCount, pageSize, hasNextPage, hasPreviousPage } = pluginStates.page;

	// Search Table
	const { filterValue } = pluginStates.tableFilter;
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
</script>

<svelte:head>
	<title>Accounts</title>
	<meta name="description" content="accounts" />
</svelte:head>

<Breadcrumb aria-label="Default breadcrumb example" class="mb-6">
	<BreadcrumbItem href="/dashboard" home>Home</BreadcrumbItem>
	<BreadcrumbItem href="/dashboard/policies">Policy</BreadcrumbItem>
	<BreadcrumbItem>Search Policies</BreadcrumbItem>
</Breadcrumb>

<ErrorMessage error={loadError?.message} />

<form data-sveltekit-noscroll bind:this={searchForm}>
	<Navbar border={true} rounded={true}>
		<NavBrand>
			<ShieldCheck />
			<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
				Policies
			</span>
		</NavBrand>
		<ButtonGroup class="w-1/2">
			<Select
				name="subjectType"
				class="w-auto !rounded-r-none"
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
		<a class="btn" href="/dashboard/policies/00000000-0000-0000-0000-000000000000">Add Policy</a
		>
	</Navbar>
	<input type="hidden" name="limit" value={limit} />
	<input type="hidden" name="offset" value={offset} />
	<ErrorMessage error={fieldErrors?.subjectType?.[0]} />
	<ErrorMessage error={fieldErrors?.subjectId?.[0]} />
	<ErrorMessage error={fieldErrors?.limit?.[0]} />
	<ErrorMessage error={fieldErrors?.offset?.[0]} />
</form>

{#if policies}
	<div class="relative overflow-x-auto shadow-md sm:rounded-lg">
		<div class="flex items-center justify-between p-4">
			<!-- search text -->
			<div class="p-4">
				<label for="table-search" class="sr-only">Search</label>
				<div class="relative mt-1">
					<div
						class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
					>
						<svg
							class="h-5 w-5 text-gray-500 dark:text-gray-400"
							fill="currentColor"
							viewBox="0 0 20 20"
							xmlns="http://www.w3.org/2000/svg"
							><path
								fill-rule="evenodd"
								d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
								clip-rule="evenodd"
							/></svg
						>
					</div>
					<input
						bind:value={$filterValue}
						type="text"
						id="table-search"
						class="block w-80 rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
						placeholder="Search rows..."
					/>
				</div>
			</div>
		</div>

		<table {...$tableAttrs} class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
			<thead
				class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400"
			>
				{#each $headerRows as headerRow (headerRow.id)}
					<Subscribe attrs={headerRow.attrs()} let:attrs>
						<tr {...attrs}>
							{#each headerRow.cells as cell (cell.id)}
								<Subscribe
									attrs={cell.attrs()}
									let:attrs
									props={cell.props()}
									let:props
								>
									<th {...attrs} on:click={props.sort.toggle} class="px-6 py-3">
										<div class="flex items-center">
											<Render of={cell.render()} />
											{#if props.sort.order === 'asc'}
												<ChevronDown
													size="16"
													variation="solid"
													class="ml-1"
												/>
											{:else if props.sort.order === 'desc'}
												<ChevronUp
													size="16"
													variation="solid"
													class="ml-1"
												/>
											{/if}
										</div>
									</th>
								</Subscribe>
							{/each}
						</tr>
					</Subscribe>
				{/each}
			</thead>
			<tbody {...$tableBodyAttrs}>
				{#each $pageRows as row (row.id)}
					<Subscribe attrs={row.attrs()} let:attrs>
						<tr
							{...attrs}
							class="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
						>
							{#each row.cells as cell (cell.id)}
								<Subscribe
									attrs={cell.attrs()}
									let:attrs
									props={cell.props()}
									let:props
								>
									<td
										{...attrs}
										class="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
										class:matches={props.tableFilter.matches}
									>
										<Render of={cell.render()} />
									</td>
								</Subscribe>
							{/each}
						</tr>
					</Subscribe>
				{/each}
			</tbody>
		</table>

		<nav class="flex items-center justify-between p-4" aria-label="Table navigation">
			<span class="flex items-center text-sm text-gray-700 dark:text-gray-400">
				<span class="pr-2">Rows ({$pageSize}): </span>
				<Select items={rows} bind:value={$pageSize} size="sm" class="w-1/6 p-1 text-xs" />
				<span class="pl-4">
					Showing <span class="font-semibold text-gray-900 dark:text-white"
						>{$pageIndex + 1}</span
					>
					out of
					<span class="font-semibold text-gray-900 dark:text-white">{$pageCount}</span> Pages
				</span>
			</span>
			<ButtonGroup>
				<Button on:click={() => $pageIndex--} disabled={!$hasPreviousPage}>Prev</Button>
				<Button on:click={() => $pageIndex++} disabled={!$hasNextPage}>Next</Button>
			</ButtonGroup>
		</nav>
	</div>
{/if}

<style lang="postcss">
	:global(td.matches) {
		background: rgba(46, 196, 182, 0.2);
	}
	:global(.sv-control) {
		--sv-min-height: 48px;
		border-radius: 0.5rem !important;
	}

	/*table {*/
	/*	border-spacing: 0;*/
	/*	border-top: 1px solid black;*/
	/*	border-left: 1px solid black;*/
	/*}*/

	/*th, td {*/
	/*	border-bottom: 1px solid black;*/
	/*	border-right: 1px solid black;*/
	/*	padding: 0.5rem;*/
	/*}*/
</style>
