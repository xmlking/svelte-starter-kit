<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { ErrorMessage, FloatingLabelField, Tags } from '$lib/components';
	// import {default as TagInput } from '$lib/components/TagInput.svelte';
	import type { policies_insert_input } from '$houdini';
	import { DateInput } from '$lib/components/form';
	import { addToast, ToastLevel } from '$lib/components/toast';
	import {
		actionOptions,
		directionOptions,
		protocols,
		subjectTypeOptions2
	} from '$lib/models/enums';
	import { policyClientSchema } from '$lib/models/schema';
	import type { Subject } from '$lib/models/types/subject';
	import { Logger } from '$lib/utils';
	import { validator } from '@felte/validator-zod';
	import type { Snapshot } from '@sveltejs/kit';
	import { createForm } from 'felte';
	import {
		Breadcrumb,
		BreadcrumbItem,
		Button,
		ButtonGroup,
		Helper,
		Spinner,
		UserCircle
	} from 'flowbite-svelte';
	import { tick } from 'svelte';
	import {
		AdjustmentsHorizontal,
		ArrowLeft,
		CloudArrowDown,
		DevicePhoneMobile,
		RectangleGroup,
		User,
		UserGroup
	} from 'svelte-heros-v2';
	import Select from 'svelte-select';

	const log = new Logger('routes:policies:item');

	export let form;
	let { actionResult, actionError, formErrors, fieldErrors } = form || {};
	$: if (form) ({ actionResult, actionError, formErrors, fieldErrors } = form);
	$: if (actionResult) {
		addToast({
			message: `${actionResult.displayName} saved`,
			dismissible: true,
			duration: 10000,
			type: ToastLevel.Info
		});
		goto('/dashboard/policies');
	}
	$: if (actionError)
		addToast({
			message: actionError.message,
			dismissible: true,
			duration: 10000,
			type: ToastLevel.Error
		});

	export let data;
	let { policy, loadError } = data;
	$: ({ policy, loadError } = data);
	let editMode = policy?.id != '00000000-0000-0000-0000-000000000000';

	// TODO: Snapshot helps to recover form state, if navigated without submitting
	export const snapshot: Snapshot = {
		capture: () => 'hello',
		restore: (message) => log.debug(message)
	};

	async function goBack() {
		history.back();
	}

	// Felte
	// const schema = editMode ? policyBaseSchema : policyCreateBaseSchema
	const schema = policyClientSchema;
	const {
		form: fForm,
		data: fData,
		errors: fErrors,
		isSubmitting,
		isDirty,
		isValid,
		reset
	} = createForm<policies_insert_input>({
		initialValues: policy ?? {},
		extend: validator({ schema }),
		// this is dummy submit method for felte, sveltekit's `Form Action` really submit the form.
		onSubmit: async (values, context) => {
			await tick();
			log.debug(values);
			log.debug(new FormData(context.form));
		}
	});
	log.debug('fData', $fData);

	//Form
	// select settings
	let subject = policy?.subjectId
		? {
				id: policy.subjectId,
				displayName: policy.subjectDisplayName,
				secondaryId: policy.subjectSecondaryId
		  }
		: null;
	async function fetchSubjects(filterText: string) {
		if (!filterText.length) return Promise.resolve([]);
		const response = await fetch(
			`/api/directory/search?subType=${$fData.subjectType}&filter=&search=${filterText}`
		);
		if (!response.ok) throw new Error(`An error has occurred: ${response.status}`);
		const data = await response.json();
		if (!data) throw new Error('no data');
		return data.results as Subject[];
	}
	async function onSubjectChange(changedSubject: CustomEvent) {
		log.debug('onSubjectChange', changedSubject.detail);
		if (browser) {
			if (changedSubject?.detail) {
				$fData.subjectId = changedSubject.detail.id;
				$fData.subjectDisplayName = changedSubject.detail.displayName;
				$fData.subjectSecondaryId = changedSubject.detail.secondaryId;
			} else {
				$fData.subjectId = '';
				$fData.subjectDisplayName = '';
				$fData.subjectSecondaryId = '';
			}
		}
	}
	function onSubjectClear(event: CustomEvent) {
		// reset Selected ???
		log.debug('onSubjectClear', event.detail);
		if (browser) {
			subject = null;
			$fData.subjectId = '';
			$fData.subjectDisplayName = '';
			$fData.subjectSecondaryId = '';
		}
	}
</script>

<svelte:head>
	<title>Account</title>
	<meta name="description" content="Account" />
</svelte:head>

<Breadcrumb aria-label="Default breadcrumb example" class="mb-6">
	<BreadcrumbItem href="/dashboard" home>Home</BreadcrumbItem>
	<BreadcrumbItem href="/dashboard/policies">Policy</BreadcrumbItem>
	<BreadcrumbItem>Edit Policy</BreadcrumbItem>
</Breadcrumb>

<ErrorMessage error={loadError?.message} />

<form class="space-y-6" method="POST" action="?/save" use:fForm use:enhance>
	{#if policy}
		<div class="mb-6 grid gap-6 md:grid-cols-3 lg:grid-cols-6">
			<div class="col-span-2">
				<FloatingLabelField
					name="displayName"
					style="outlined"
					label="Display Name"
					error={fieldErrors?.displayName?.[0] || $fErrors?.displayName?.[0]}
				/>
			</div>
			<div class="col-span-4">
				<FloatingLabelField
					name="description"
					style="outlined"
					label="Description"
					error={fieldErrors?.description?.[0] || $fErrors?.description?.[0]}
				/>
			</div>
			<div class="my-tag col-span-3">
				<Tags
					bind:tags={$fData.tags}
					onlyUnique={true}
					minChars={3}
					placeholder={'Enter tags...'}
					labelText={'Tags'}
					labelShow
				/>
				<input data-felte-ignore type="hidden" name="tags" bind:value={$fData.tags} />
				<!-- <TagInput bind:tags={$fData.tags}  name="tags" /> <span>{tags}</span> -->
				<ErrorMessage
					id="tags_help"
					error={fieldErrors?.tags?.[0] || $fErrors?.tags?.[0]}
				/>
			</div>
			<div class="col-span-3">
				<FloatingLabelField
					name="annotations"
					style="outlined"
					label="Annotations"
					error={fieldErrors?.annotations?.[0] || $fErrors?.annotations?.[0]}
				/>
				<Helper class="mt-2 text-sm italic"
					>Format: key1=>value1 (or) "key2" => "value2 with space"</Helper
				>
			</div>

			<div class="col-span-3">
				<div class="btn-group">
					{#each subjectTypeOptions2 as opt}
						<input
							type="radio"
							name="subjectType"
							on:change={onSubjectClear}
							value={opt.value}
							data-title={opt.label}
							class="btn"
							disabled={editMode}
						/>
					{/each}
				</div>
				<ErrorMessage
					id="subjectType_help"
					error={fieldErrors?.subjectType?.[0] || $fErrors?.subjectType?.[0]}
				/>
			</div>
			<div class="col-span-3">
				<Select
					itemId="displayName"
					label="displayName"
					bind:value={subject}
					on:change={onSubjectChange}
					on:clear={onSubjectClear}
					disabled={editMode}
					loadOptions={fetchSubjects}
				>
					<b slot="prepend" class="p-2">
						{#if $fData.subjectType == 'subject_type_group'}
							<UserGroup />
						{:else if $fData.subjectType == 'subject_type_service_account'}
							<UserCircle />
						{:else if $fData.subjectType == 'subject_type_device'}
							<DevicePhoneMobile />
						{:else if $fData.subjectType == 'subject_type_device_pool'}
							<RectangleGroup />
						{:else}
							<User />
						{/if}
					</b>
					<svelte:fragment slot="input-hidden" let:value>
						<input
							type="hidden"
							name="subjectDisplayName"
							disabled={editMode}
							value={value ? value.displayName : null}
						/>
					</svelte:fragment>
				</Select>
			</div>
			<input
				type="hidden"
				name="subjectId"
				disabled={editMode}
				bind:value={$fData.subjectId}
			/>
			<input
				type="hidden"
				name="subjectSecondaryId"
				disabled={editMode}
				bind:value={$fData.subjectSecondaryId}
			/>
			<input
				type="hidden"
				name="organization"
				disabled={editMode}
				bind:value={$fData.organization}
			/>
			<div class="col-span-3">
				<FloatingLabelField
					name="sourceAddress"
					style="outlined"
					label="Source"
					error={fieldErrors?.sourceAddress?.[0] || $fErrors?.sourceAddress?.[0]}
				/>
			</div>
			<div class="col-span-3">
				<FloatingLabelField
					name="sourcePort"
					style="outlined"
					label="Source port"
					error={fieldErrors?.sourcePort?.[0] || $fErrors?.sourcePort?.[0]}
				/>
			</div>
			<div class="col-span-3">
				<FloatingLabelField
					name="destinationAddress"
					style="outlined"
					label="Destination"
					error={fieldErrors?.destinationAddress?.[0] ||
						$fErrors?.destinationAddress?.[0]}
				/>
			</div>
			<div class="col-span-3">
				<FloatingLabelField
					name="destinationPort"
					style="outlined"
					label="Destination port"
					error={fieldErrors?.destinationPort?.[0] || $fErrors?.destinationPort?.[0]}
				/>
			</div>
			<div>
				<select name="protocol" class="select-bordered select w-full focus:outline-none">
					{#each protocols as protocol}
						<option value={protocol.value}>
							{protocol.name}
						</option>
					{/each}
				</select>
			</div>
			<div class="col-span-2">
				<div class="btn-group">
					{#each actionOptions as opt}
						<input
							type="radio"
							name="action"
							value={opt.value}
							data-title={opt.label}
							class="btn"
						/>
					{/each}
				</div>
			</div>
			<div class="col-span-2">
				<div class="btn-group">
					{#each directionOptions as opt}
						<input
							type="radio"
							name="direction"
							value={opt.value}
							data-title={opt.label}
							class="btn"
						/>
					{/each}
				</div>
			</div>
			<div>
				<FloatingLabelField
					name="weight"
					style="outlined"
					type="number"
					label="Weight"
					error={fieldErrors?.weight?.[0] || $fErrors?.weight?.[0]}
				/>
			</div>

			<div class="col-span-6">
				<FloatingLabelField
					name="appId"
					style="outlined"
					label="App id"
					error={fieldErrors?.appId?.[0] || $fErrors?.appId?.[0]}
				/>
			</div>

			<div>
				<label class="label cursor-pointer">
					<span class="label-text">Disabled</span>
					<input
						name="disabled"
						type="checkbox"
						value={$fData.disabled}
						checked={$fData.disabled}
						class="toggle-secondary toggle"
					/>
				</label>
				<ErrorMessage
					error={fieldErrors?.disabled?.[0] || JSON.stringify($fErrors?.disabled?.[0])}
				/>
			</div>
			<div>
				<label class="label cursor-pointer">
					<span class="label-text">Template</span>
					<input
						name="template"
						type="checkbox"
						value={$fData.template}
						checked={$fData.template}
						class="toggle-accent toggle"
						disabled={editMode}
					/>
				</label>
				<ErrorMessage
					error={fieldErrors?.template?.[0] || JSON.stringify($fErrors?.template?.[0])}
				/>
			</div>
			<div class="col-start-5">
				<!-- <FloatingLabelField type="datetime-local" name="validFrom" value={$fData.validFrom} error="{fieldErrors?.validFrom?.[0] || $fErrors?.validFrom?.[0]}" label="Valid From" /> -->
				<DateInput
					name="validFrom"
					style="outlined"
					label="Valid From"
					value={$fData.validFrom}
					error={fieldErrors?.validFrom?.[0] || $fErrors?.validFrom?.[0]}
				/>
			</div>
			<div class="col-end-auto">
				<!-- <FloatingLabelField type="datetime-local" name="validTo"  value={$fData.validTo} error="{fieldErrors?.validTo?.[0] || $fErrors?.validTo?.[0]}" label="Valid To" /> -->
				<DateInput
					name="validTo"
					style="outlined"
					label="Valid To"
					value={$fData.validTo}
					error={fieldErrors?.validTo?.[0] || $fErrors?.validTo?.[0]}
				/>
			</div>
		</div>
	{/if}

	<ButtonGroup>
		<Button outline on:click={goBack}>
			<ArrowLeft size="18" class="mr-2 text-blue-500 dark:text-green-500" />Back
		</Button>
		{#if editMode}
			<Button outline on:click={reset} disabled={!$isDirty}>
				<AdjustmentsHorizontal
					size="18"
					class="mr-2 text-blue-500 dark:text-green-500"
				/>Reset
			</Button>
			<Button outline type="submit" disabled={!$isValid || $isSubmitting}>
				{#if $isSubmitting}
					<Spinner class="mr-3" size="4" color="white" />Saveing ...
				{:else}
					<CloudArrowDown size="18" class="mr-2 text-blue-500 dark:text-green-500" />Save
				{/if}
			</Button>
		{:else}
			<Button outline type="submit" disabled={!$isValid || $isSubmitting}>
				{#if $isSubmitting}
					<Spinner class="mr-3" size="4" color="white" />Createing ...
				{:else}
					<AdjustmentsHorizontal
						size="18"
						class="mr-2 text-blue-500 dark:text-green-500"
					/>Create
				{/if}
			</Button>
		{/if}
	</ButtonGroup>
</form>

<!-- debug -->
<!-- {@debug isValid, fData, fErrors} -->
<!--
<pre class="p-4">$isValid: {$isValid}</pre>
<pre class="p-4">$fData: {JSON.stringify($fData, null, 4)}</pre>
<pre class="p-4">$fErrors: {JSON.stringify($fErrors, null, 4)}</pre>
-->
<style lang="postcss">
	:global(.sv-control) {
		border-radius: 0.5rem !important;
		--sv-min-height: 48px;
		--sv-disabled-bg: rgb(249 250 251 / var(--tw-bg-opacity));
		--sv-disabled-border-color: border-gray-900;
		/*--sv-border-color: border-gray-900;*/
	}

	.my-tag :global(.svelte-tags-input-layout.sti-layout-disable),
	.my-tag :global(.svelte-tags-input:disabled) {
		background: rgb(249 250 251 / var(--tw-bg-opacity));
		cursor: not-allowed;
	}

	/*override svelte-tags-input default styles*/
	.my-tag :global(.svelte-tags-input-tag-remove) {
		cursor: pointer;
		padding-left: 1rem;
		font-size: 1rem;
		color: red;
	}

	.my-tag :global(.svelte-tags-input-layout) {
		@apply relative  rounded-lg  text-gray-900;
	}

	.my-tag :global(.svelte-tags-input-layout label) {
		/* eslint-disable */
		@apply absolute left-1 top-0.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-white px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-blue-600 dark:bg-gray-900 dark:text-gray-400 peer-focus:dark:text-blue-500;
	}

	.my-tag :global(.svelte-tags-input) {
		@apply block w-full appearance-none rounded-lg border-gray-300 bg-transparent p-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500;
	}

	.my-tag :global(.svelte-tags-input-layout:focus-within) {
		outline: -webkit-focus-ring-color;
	}
</style>
