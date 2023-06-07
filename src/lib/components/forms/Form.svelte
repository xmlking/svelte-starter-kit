<script lang="ts">
	import type { ZodValidation } from 'sveltekit-superforms/index';

	import { AdjustmentsHorizontal, ArrowLeft, CloudArrowDown } from 'svelte-heros-v2';

	import { Alert, Button, ButtonGroup, Modal, Spinner } from 'flowbite-svelte';
	import { setContext } from 'svelte';
	import type { SuperForm } from 'sveltekit-superforms/client';
	import type { AnyZodObject } from 'zod';
	import { FORM_KEY, type FormContext } from './forms';

	import type { HTMLFormAttributes } from 'svelte/elements';
	interface $$restProps extends HTMLFormAttributes {}

	// eslint-disable-next-line no-undef
	type T = $$Generic<AnyZodObject>;
	export let superform: SuperForm<ZodValidation<T>, unknown>;
	export let useDefaultSubmitButton = true;
	export let defaultSubmitButtonText = 'Submit';
	export let className = 'space-y-6';

	const { form, errors, enhance, delayed, message, reset, tainted, submitting } = superform;
	setContext<FormContext<T>>(FORM_KEY, { superform });
	const v = $form.valid;

	$: error = Boolean($message) ? $message : $errors._errors ? $errors._errors.join('\n') : '';
</script>

<!-- <form {...$$restProps} use:enhance>  TODO-->
<form class={className} method="post" {...$$restProps} use:enhance>
	<slot />

	{#if error}
		<Alert color="red" accent={false} dismissable>{error}</Alert>
	{/if}

	{#if useDefaultSubmitButton}
		<ButtonGroup>
			<Button outline on:click={() => history.back()}>
				<ArrowLeft size="18" class="mr-2 text-blue-500 dark:text-green-500" />Back
			</Button>
			<Button outline disabled={!$tainted} on:click={() => reset()}>
				<AdjustmentsHorizontal
					size="18"
					class="mr-2 text-blue-500 dark:text-green-500"
				/>Reset
			</Button>
			<!-- <Button outline type="submit" disabled={!$tainted || $errors || $submitting}></Button> -->
			<Button outline type="submit" disabled={!$tainted || $submitting}>
				{#if $submitting}
					<Spinner class="mr-3" size="4" color="white" />Saveing ...
				{:else}
					<CloudArrowDown
						size="18"
						class="mr-2 text-blue-500 dark:text-green-500"
					/>{defaultSubmitButtonText}
				{/if}
			</Button>
		</ButtonGroup>
	{/if}

	{#if $delayed}
		<div class="m-0 p-0">
			<Modal open={$delayed} permanent>
				<Spinner />
			</Modal>
		</div>
	{/if}
</form>
