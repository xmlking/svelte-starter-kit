import type { tz_policies_insert_input } from '$houdini';
import { CachePolicy, CreatePolicyStore, GetPolicyStore, UpdatePolicyStore } from '$houdini';
import { handleActionErrors, handleLoadErrors, NotFoundError, PolicyError } from '$lib/errors';
import { policyCreateSchema, policyUpdateSchema } from '$lib/models/schema';
import { Logger } from '$lib/utils';
import { uuidSchema } from '$lib/utils/zod.utils';
import envPub from '$lib/variables/variables';
import { zfd } from '$lib/zodfd';
import * as Sentry from '@sentry/svelte';
import { fail, redirect } from '@sveltejs/kit';
import type { GraphQLError } from 'graphql';
import crypto from 'node:crypto';
import { ZodError } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const log = new Logger('policy.details.server');

const getPolicyStore = new GetPolicyStore();
const createPolicyStore = new CreatePolicyStore();
const updatePolicyStore = new UpdatePolicyStore();
/**
 * loaders
 */
export const load = (async (event) => {
	const { params, parent } = event;
	const { session } = await parent();

	if (session?.user == undefined) {
		throw redirect(307, '/auth/signin?callbackUrl=/dashboard/policy');
	}

	const { id } = params;
	if (id == '00000000-0000-0000-0000-000000000000') {
		const policy: tz_policies_insert_input = {
			id: '00000000-0000-0000-0000-000000000000',
			display_name: '',
			// tags: ['tz', 'us'],
			// annotations: { 'sumo': 'demo' },
			valid_from: null,
			valid_to: null,
			subject_id: '6e9bf365-8c09-4dd9-b9b2-83f6ab315618',
			subject_type: 'subject_type_user',
			subject_secondary_id: 'sumo@chinthagunta.com',
			subject_display_name: '',
			subject_domain: envPub.PUBLIC_TENANT_ID,
			disabled: false,
			template: false,
			source_address: '',
			source_port: '',
			destination_address: '',
			destination_port: '',
			protocol: 'Any',
			action: 'action_block',
			direction: 'direction_egress',
			weight: 2000
		};
		return { policy };
	}

	try {
		const variables = { id };

		const { errors, data } = await getPolicyStore.fetch({
			event,
			blocking: true,
			policy: CachePolicy.CacheAndNetwork,
			metadata: { backendToken: 'token from TokenVault', useRole: 'editor' },
			variables
		});

		const policy = data?.tz_policies_by_pk;
		const loadError = errors?.[0] as GraphQLError;
		return { loadError, policy };
	} catch (err) {
		console.error('account:actions:load:error:', err);
		Sentry.setContext('source', { code: 'account' });
		Sentry.captureException(err);
		handleLoadErrors(err);
	}
}) satisfies PageServerLoad;

/**
 * actions
 */
const createSchema = zfd.formData(policyCreateSchema, { empty: 'strip' });
const updateSchema = zfd.formData(policyUpdateSchema, { empty: 'null' });

export const actions = {
	save: async (event) => {
		const { params, request, locals } = event;
		const session = await locals.getSession();
		if (session?.user == undefined) {
			throw redirect(307, '/auth/signin?callbackUrl=/dashboard/policy');
		}

		try {
			const formData = await request.formData();
			const id = uuidSchema.parse(params.id);

			// CREATE
			if (id == '00000000-0000-0000-0000-000000000000') {
				log.debug('CREATE action formData:', formData);

				formData.set('id', crypto.randomUUID());
				const payload = createSchema.parse(formData);
				log.debug('CREATE action payload:', payload);

				const jsonPayload = {
					...payload,
					...(payload.tags && { tags: `{${payload.tags}}` })
				};

				const variables = { data: jsonPayload };
				log.debug('CREATE action variables:', variables);

				//const { errors, data } = await createPolicyStore.mutate(variables, {
				const data = await createPolicyStore.mutate(variables, {
					metadata: { backendToken: 'token from TokenVault', useRole: 'editor' },
					event
				});

				const actionResult = data.insert_tz_policies_one;

				return { actionResult };
				// throw redirect(303, '/dashboard/policies');
			}

			// UPDATE
			else {
				log.debug('UPDATE action formData:', formData);
				const payload = updateSchema.parse(formData);
				log.debug('UPDATE action payload:', payload);

				const jsonPayload = {
					...payload,
					...(payload.tags && { tags: `{${payload.tags}}` })
				};

				const variables = { id, data: jsonPayload };
				log.debug('UPDATE action variables:', variables);

				//const { errors, data } = await updatePolicyStore.mutate(variables, {
				const data = await updatePolicyStore.mutate(variables, {
					metadata: { backendToken: 'token from TokenVault', useRole: 'editor', logResult: true },
					event
				});

				const actionResult = data.update_tz_policies_by_pk;
				if (!actionResult) throw new NotFoundError('user not authorized to update');

				return { actionResult };
				// throw redirect(303, '/dashboard/policies');
			}
		} catch (err) {
			console.error('policy:actions:save:error:', err);
			Sentry.setContext('source', { code: 'policy.save' });
			Sentry.captureException(err);

			if (err instanceof ZodError) {
				const { formErrors, fieldErrors } = err.flatten();
				return fail(400, { formErrors, fieldErrors });
			} else if (Array.isArray(err)) {
				// err[0] is GraphQLError
				// TODO: wrap GraphQLError at source as PolicyError<CREATE_POLICY_ERROR> and catch here.
				const delErr = new PolicyError('CREATE_POLICY_ERROR', 'create policy api error', err[0] as GraphQLError);
				return fail(400, { actionError: delErr.toJSON() });
			} else {
				return handleActionErrors(err);
			}
		}
	}
} satisfies Actions;
