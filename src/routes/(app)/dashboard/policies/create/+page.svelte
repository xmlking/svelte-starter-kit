<script lang="ts">
	import { browser } from '$app/environment';
	import {
		Checkbox,
		DateInput,
		FloatingTextInput,
		Form,
		Select as FormSelect,
		Radio,
		TagsInput
	} from '$lib/components/forms';
	import {
		actionOptions,
		directionOptions,
		protocols,
		subjectTypeOptions2
	} from '$lib/models/enums';
	import { policySchema } from '$lib/models/schema/policy.new.schema';
	import type { Subject } from '$lib/models/types/subject';
	import { Logger } from '$lib/utils';
	import { Breadcrumb, BreadcrumbItem, Heading, Helper, UserCircle } from 'flowbite-svelte';
	import { DevicePhoneMobile, RectangleGroup, User, UserGroup } from 'svelte-heros-v2';
	import Select from 'svelte-select';
	import { superForm } from 'sveltekit-superforms/client';
	import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
	import type { PageData } from './$types';

	const log = new Logger('routes:policies:item');

	export let data: PageData;
	const superform = superForm(data.form, {
		dataType: 'json',
		taintedMessage: null
	});
	const {
		form,
		delayed,
		enhance,
		errors,
		constraints,
		message,
		tainted,
		reset,
		submitting,
		capture,
		restore
	} = superform;
	export const snapshot = { capture, restore };
	// const validFrom = dateProxy(form, "validFrom", { format: "datetime-utc" });
	// const validTo = dateProxy(form, "validTo", { format: "datetime-utc" });

	// https://github.com/dyne/starters/blob/main/saas/%7B%7Bcookiecutter.project_name%7D%7D/webapp/src/routes/(nru)/register/%2Bpage.svelte
	// nested https://github.com/velut/pic2grid/blob/5fb1217150c3f6cf70e40d1e2aad7ded9b6e5d2f/src/lib/components/RenderOptionsForm.svelte
	// dateProxy https://github.com/malcolmseyd/lockers/blob/main/src/routes/admin/edit/%2Bpage.svelte
	// action https://github.com/malcolmseyd/lockers/blob/main/src/routes/admin/delete/%2Bpage.server.ts
	// local data: https://github.com/malcolmseyd/lockers/blob/main/src/routes/admin/edit/%2Bpage.server.ts

	const keys = policySchema.innerType().keyof().Enum;
	//Form
	// select settings
	let subject = $form?.subjectId
		? {
				id: $form.subjectId,
				displayName: $form.subjectDisplayName,
				secondaryId: $form.subjectSecondaryId
		  }
		: null;
	async function fetchSubjects(filterText: string) {
		if (!filterText.length) return Promise.resolve([]);
		const response = await fetch(
			`/api/directory/search?subType=${$form.subjectType}&filter=&search=${filterText}`
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
				$form.subjectId = changedSubject.detail.id;
				$form.subjectDisplayName = changedSubject.detail.displayName;
				$form.subjectSecondaryId = changedSubject.detail.secondaryId;
			} else {
				$form.subjectId = '';
				$form.subjectDisplayName = '';
				$form.subjectSecondaryId = '';
			}
		}
	}
	function onSubjectTypeChange(event: CustomEvent | Event) {
		// reset Selected ???
		// log.debug('onSubjectTypeChange1',event.target?.value);
		// log.debug('onSubjectTypeChange', event.detail);
		if (browser) {
			subject = null;
			$form.subjectId = '';
			$form.subjectDisplayName = '';
			$form.subjectSecondaryId = '';
		}
	}
	const editMode = false;
</script>

<svelte:head>
	<title>Policies | Create</title>
	<meta name="description" content="Create Policy" />
</svelte:head>

<Breadcrumb aria-label="Default breadcrumb example" class="mb-6">
	<BreadcrumbItem href="/dashboard" home>Home</BreadcrumbItem>
	<BreadcrumbItem href="/dashboard/policies">Policy</BreadcrumbItem>
	<BreadcrumbItem>Create Policy</BreadcrumbItem>
</Breadcrumb>

<Heading tag="h4" class="pb-5">Create policy</Heading>

<Form {superform} defaultSubmitButtonText="Create" class="space-y-6">
	<div class="mb-6 grid gap-6 md:grid-cols-3 lg:grid-cols-6">
		<div class="col-span-2">
			<FloatingTextInput field={keys.displayName} label="Display Name" />
		</div>
		<div class="col-span-4">
			<FloatingTextInput field={keys.description} label="Description" />
		</div>
		<div class="  col-span-3">
			<TagsInput field={keys.tags} label="Tags" placeholder={'Enter tags...'} />
		</div>
		<div class="col-span-3">
			<FloatingTextInput field={keys.annotations} label="Annotations" />
			<Helper class="mt-2 text-sm italic"
				>Format: key1=>value1 (or) "key2" => "value2 with space"</Helper
			>
		</div>
		<div class="col-span-3">
			<Radio
				field={keys.subjectType}
				items={subjectTypeOptions2}
				on:change={onSubjectTypeChange}
				disabled={editMode}
			/>
		</div>
		<div class="col-span-3">
			<Select
				class="input"
				itemId="displayName"
				label="displayName"
				placeholder="Type to select"
				bind:value={subject}
				on:change={onSubjectChange}
				on:clear={onSubjectTypeChange}
				disabled={editMode}
				loadOptions={fetchSubjects}
			>
				<b slot="prepend" class="p-2">
					{#if $form.subjectType == 'group'}
						<UserGroup />
					{:else if $form.subjectType == 'service_account'}
						<UserCircle />
					{:else if $form.subjectType == 'device'}
						<DevicePhoneMobile />
					{:else if $form.subjectType == 'device_pool'}
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
			{#if $errors.subjectId || $errors.subjectSecondaryId || $errors.subjectDisplayName}
				<Helper class="mt-2" color="red">Subject is required</Helper>
			{/if}
		</div>
		<div class="col-span-3">
			<FloatingTextInput field="rule.source" label="Source" />
		</div>
		<div class="col-span-3">
			<FloatingTextInput field="rule.sourcePort" label="Source port" />
		</div>
		<div class="col-span-3">
			<FloatingTextInput field="rule.destination" label="Destination" />
		</div>
		<div class="col-span-3">
			<FloatingTextInput field="rule.destinationPort" label="Destination port" />
		</div>
		<div>
			<FormSelect field="rule.protocol" items={protocols} />
		</div>
		<div>
			<Radio field="rule.action" items={actionOptions} />
		</div>
		<div>
			<Radio field="rule.direction" items={directionOptions} />
		</div>
		<div class="col-end-7">
			<FloatingTextInput field={keys.weight} type="number" label="Weight" />
		</div>

		<div class="col-span-6">
			<FloatingTextInput field="rule.appId" label="App id" />
		</div>

		<div class="flex justify-start">
			<Checkbox
				field={keys.active}
				class="toggle-secondary toggle"
				labelPosition="before"
				disabled={editMode}>Active</Checkbox
			>
		</div>
		<div class="flex justify-start">
			<Checkbox
				field={keys.shared}
				class="toggle-secondary toggle"
				labelPosition="before"
				disabled={editMode}>Shared</Checkbox
			>
		</div>
		<div class="col-start-5">
			<DateInput type="datetime-local" field={keys.validFrom} label="Valid From" />
			<!-- <input type="datetime-local" bind:value={$validFrom} name="validFrom" /> -->
		</div>
		<div class="col-end-auto">
			<DateInput type="datetime-local" field={keys.validTo} label="Valid To" />
			<!-- <input type="datetime-local" bind:value={$validTo} name="validTo" /> -->
		</div>
	</div>
</Form>

<br />
<SuperDebug
	label="Miscellaneous"
	status={false}
	data={{ message, submitting, delayed, constraints }}
/>
<br />
<SuperDebug label="Form" data={$form} />
<br />
<SuperDebug label="Tainted" status={false} data={$tainted} />
<br />
<SuperDebug label="Errors" status={false} data={$errors} />
<!-- <br />
 <SuperDebug label="$page data" status={false} data={$page} /> -->
