<script lang="ts">
	// https://github.com/dyne/starters/blob/main/saas/%7B%7Bcookiecutter.project_name%7D%7D/webapp/src/routes/(nru)/register/%2Bpage.svelte
	// nested https://github.com/velut/pic2grid/blob/5fb1217150c3f6cf70e40d1e2aad7ded9b6e5d2f/src/lib/components/RenderOptionsForm.svelte
	// dateProxy https://github.com/malcolmseyd/lockers/blob/main/src/routes/admin/edit/%2Bpage.svelte
	// action https://github.com/malcolmseyd/lockers/blob/main/src/routes/admin/delete/%2Bpage.server.ts
	// local data: https://github.com/malcolmseyd/lockers/blob/main/src/routes/admin/edit/%2Bpage.server.ts
	import { browser } from '$app/environment';
	import { CachePolicy, SearchRulesStore, order_by } from '$houdini';
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
	import { policyKeys as keys } from '$lib/models/schema/policy.new.schema';
	import type { Subject } from '$lib/models/types/subject';
	import { Logger } from '$lib/utils';
	import { Breadcrumb, BreadcrumbItem, Heading, Helper, UserCircle } from 'flowbite-svelte';
	import {
		DevicePhoneMobile,
		MagnifyingGlass,
		RectangleGroup,
		User,
		UserGroup
	} from 'svelte-heros-v2';
	import Select from 'svelte-select';
	import { superForm } from 'sveltekit-superforms/client';
	import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
	import type { PageData } from './$types';

	const log = new Logger('routes:policies:item');
	export let data: PageData;
	// Client API:
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

	// TODO: reset buttom should also reset `subject & rule search inputs`
	// subject settings
	let subject = $form?.subjectId
		? {
				id: $form.subjectId,
				displayName: $form.subjectDisplayName,
				secondaryId: $form.subjectSecondaryId
		  }
		: null;
	/**
	 * Search Subjects by displayName
	 * Note: min filterText length is set to '3'
	 */
	async function fetchSubjects(filterText: string) {
		if (filterText.length < 3) return [];
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
	function clearSubject(event: CustomEvent | Event) {
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

	// rule settings
	let rule = $form?.ruleId
		? {
				id: $form.ruleId,
				displayName: $form.rule.displayName
		  }
		: null;

	// $: disabled=$form.rule.shared
	$: disabled = rule != null;

	/**
	 * Search Rules by displayName
	 * Note: min filterText length is set to '3'
	 */
	const searchRulesStore = new SearchRulesStore();
	const orderBy = [{ updatedAt: order_by.desc_nulls_first }];
	async function fetchRule(filterText: string) {
		if (filterText.length < 3) return [];
		const where = {
			displayName: { _like: `%${filterText}%` }
		};
		const variables = { where, orderBy };
		const { errors, data } = await searchRulesStore.fetch({
			blocking: true,
			policy: CachePolicy.CacheAndNetwork,
			metadata: { useRole: 'user', logResult: true },
			variables
		});
		if (errors) throw new Error(`An error has occurred: ${errors}`);

		if (!data) throw new Error('no data');
		return data.rules;
	}
	async function onRuleChange(changedSubject: CustomEvent) {
		log.debug('onRuleChange', changedSubject.detail);
		if (browser) {
			if (changedSubject?.detail) {
				$form.ruleId = changedSubject.detail.id;
				$form.rule.shared = changedSubject.detail.shared;
				$form.rule.displayName = changedSubject.detail.displayName;
				$form.rule.description = changedSubject.detail.description;
				$form.rule.tags = changedSubject.detail.tags;
				$form.rule.annotations = changedSubject.detail.annotations;
				$form.rule.source = changedSubject.detail.source;
				$form.rule.sourcePort = changedSubject.detail.sourcePort;
				$form.rule.destination = changedSubject.detail.destination;
				$form.rule.destinationPort = changedSubject.detail.destinationPort;
				$form.rule.protocol = changedSubject.detail.protocol;
				$form.rule.direction = changedSubject.detail.direction;
				$form.rule.action = changedSubject.detail.action;
				$form.rule.appId = changedSubject.detail.appId;
				$form.rule.weight = changedSubject.detail.weight;
				// HINT: we copy `rule.weight` to `policy.weight` initially and let users overwrite weightage afterwords.
				$form.weight = changedSubject.detail.weight;
			} else {
				$form.ruleId = undefined;
				$form.rule.shared = false;
				$form.rule.displayName = '';
				$form.rule.description = undefined;
				$form.rule.tags = undefined;
				$form.rule.annotations = undefined;
				$form.rule.source = undefined;
				$form.rule.sourcePort = undefined;
				$form.rule.destination = undefined;
				$form.rule.destinationPort = undefined;
				$form.rule.protocol = 'Any';
				$form.rule.direction = 'egress';
				$form.rule.action = 'block';
				$form.rule.appId = undefined;
				$form.rule.weight = 2000;
			}
		}
	}
	function clearRule(event: Event) {
		log.debug('onRuleClear', event.target);
		if (browser) {
			rule = null;
			$form.ruleId = undefined;
			$form.rule.shared = false;
			$form.rule.displayName = '';
			$form.rule.description = undefined;
			$form.rule.tags = undefined;
			$form.rule.annotations = undefined;
			$form.rule.source = undefined;
			$form.rule.sourcePort = undefined;
			$form.rule.destination = undefined;
			$form.rule.destinationPort = undefined;
			$form.rule.protocol = 'Any';
			$form.rule.direction = 'egress';
			$form.rule.action = 'block';
			$form.rule.appId = undefined;
			$form.rule.weight = 2000;
		}
	}
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
	<input type="hidden" name="ruleId" bind:value={$form.ruleId} />

	<div class="mb-6 grid gap-6 md:grid-cols-3 lg:grid-cols-6">
		<div class="col-span-2">
			<Radio field={keys.subjectType} items={subjectTypeOptions2} on:change={clearSubject} />
		</div>
		<div class="col-span-2">
			<Select
				class="input"
				itemId="displayName"
				label="displayName"
				placeholder="Type to select subject"
				bind:value={subject}
				on:change={onSubjectChange}
				on:clear={clearSubject}
				loadOptions={fetchSubjects}
				--list-z-index="100"
			>
				<b slot="prepend">
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
						value={value ? value.displayName : null}
					/>
				</svelte:fragment>
			</Select>
			{#if $errors.subjectId || $errors.subjectSecondaryId || $errors.subjectDisplayName}
				<Helper class="mt-2" color="red">Subject is required</Helper>
			{/if}
		</div>
		<div class="col-span-2">
			<Select
				class="input"
				itemId="id"
				label="displayName"
				placeholder="Type to select rule"
				bind:value={rule}
				on:change={onRuleChange}
				on:clear={clearRule}
				loadOptions={fetchRule}
			>
				<b slot="prepend">
					<MagnifyingGlass />
				</b>
				<svelte:fragment slot="input-hidden" let:value>
					<input
						type="hidden"
						name="ruleDisplayName"
						value={value ? value.displayName : null}
					/>
				</svelte:fragment>
			</Select>
			{#if $errors.ruleId}
				<Helper class="mt-2" color="red">Rule is required</Helper>
			{/if}
		</div>
		<div class="col-span-2">
			<FloatingTextInput field="rule.displayName" label="Display Name" {disabled} />
		</div>
		<div class="col-span-4">
			<FloatingTextInput field="rule.description" label="Description" {disabled} />
		</div>
		<div class="col-span-3">
			<TagsInput field="rule.tags" label="Tags" placeholder={'Enter tags...'} {disabled} />
		</div>
		<div class="col-span-3">
			<FloatingTextInput field="rule.annotations" label="Annotations" {disabled} />
			<Helper class="mt-2 text-sm italic"
				>Format: key1=>value1 (or) "key2" => "value2 with space"</Helper
			>
		</div>
		<div class="col-span-3">
			<FloatingTextInput field="rule.source" label="Source" {disabled} />
		</div>
		<div class="col-span-3">
			<FloatingTextInput field="rule.sourcePort" label="Source port" {disabled} />
		</div>
		<div class="col-span-3">
			<FloatingTextInput field="rule.destination" label="Destination" {disabled} />
		</div>
		<div class="col-span-3">
			<FloatingTextInput field="rule.destinationPort" label="Destination port" {disabled} />
		</div>
		<div>
			<FormSelect field="rule.protocol" items={protocols} {disabled} />
		</div>
		<div>
			<Radio field="rule.action" items={actionOptions} {disabled} />
		</div>
		<div>
			<Radio field="rule.direction" items={directionOptions} {disabled} />
		</div>
		<div class="col-start-5 flex justify-end">
			<Checkbox
				field="rule.shared"
				class="toggle-secondary toggle"
				labelPosition="before"
				{disabled}>Shared</Checkbox
			>
		</div>
		<div class="col-end-7">
			<FloatingTextInput field={keys.weight} type="number" label="Weight" />
		</div>

		<div class="col-span-6">
			<FloatingTextInput field="rule.appId" label="App id" {disabled} />
		</div>

		<div class="flex justify-start">
			<Checkbox field={keys.active} class="toggle-secondary toggle" labelPosition="before"
				>Active</Checkbox
			>
		</div>
		<div class="col-start-5">
			<DateInput type="datetime-local" field={keys.validFrom} label="Valid From" />
		</div>
		<div class="col-end-auto">
			<DateInput type="datetime-local" field={keys.validTo} label="Valid To" />
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
