import { env as dynPubEnv } from '$env/dynamic/public';
import { CachePolicy, CreatePolicyStore, GetPolicyStore, UpdatePolicyStore } from '$houdini';
import { handleActionErrors, handleLoadErrors, PolicyError } from '$lib/errors';
import { policyCreateSchema, policyUpdateSchema, type Policy, type PolicySaveResult } from '$lib/models/schema';
import { Logger } from '$lib/utils';
import { arrayToString, mapToString, uuidSchema } from '$lib/utils/zod.utils';
import { zfd } from '$lib/zodfd';
import * as Sentry from '@sentry/svelte';
import { fail, redirect } from '@sveltejs/kit';
import type { GraphQLError } from 'graphql';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { ZodError } from 'zod';
import type { Actions, PageServerLoad } from './$types';

assert.ok(dynPubEnv.PUBLIC_GRAPHQL_ENDPOINT, 'PUBLIC_GRAPHQL_ENDPOINT not configered');
assert.ok(dynPubEnv.PUBLIC_GRAPHQL_TOKEN, 'PUBLIC_GRAPHQL_TOKEN not configered');

const log = new Logger('policy.details.server');

const getPolicyStore = new GetPolicyStore();
const createPolicyStore = new CreatePolicyStore();
const updatePolicyStore = new UpdatePolicyStore();

export const load = (async (event) => {
	const { params, locals, fetch, parent } = event;
	const {
		session: {
			token,
			user: { email }
		}
	} = await parent();

	if (!email) {
		throw redirect(307, '/auth/signin');
	}

	const { id } = params;
	if (id == '00000000-0000-0000-0000-000000000000') {
		const policy: Policy = {
			id: '00000000-0000-0000-0000-000000000000',
			display_name: '',
			// tags: ['tz', 'us'],
			// annotations: { 'sumo': 'demo' },
			valid_from: null,
			valid_to: null,
			subject_id: '6e9bf365-8c09-4dd9-b9b2-83f6ab315618',
			subject_type: 'subject_type_user',
			subject_secondary_id: 'sumo@chintagunta.com',
			subject_display_name: '',
			subject_domain: 'chinthagunta.com',
			disabled: false,
			template: false,
			source_address: '',
			source_port: '',
			destination_address: '',
			destination_port: '',
			protocol: 'Any',
			action: 'action_block',
			direction: 'direction_egress',
			weight: 2000,
			created_at: new Date().toISOString(),
			created_by: email,
			updated_at: new Date().toISOString(),
			updated_by: email
		};
		return { policy };
	}

	try {
		const variables = { id };

		const { errors, data } = await getPolicyStore.fetch({
			event,
			blocking: true,
			policy: CachePolicy.CacheAndNetwork,
			metadata: { backendToken: 'token from TokenVault' },
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

const createSchema = zfd.formData(policyCreateSchema, { empty: 'strip' });
const updateSchema = zfd.formData(policyUpdateSchema, { empty: 'null' });

export const actions = {
	save: async ({ params, request, locals, fetch }) => {
		const {
			token,
			user: { email }
		} = await locals.getSession();

		if (!email) {
			throw redirect(307, '/auth/signin');
		}
		const formData = await request.formData();

		try {
			let actionResult: PolicySaveResult;
			const id = uuidSchema.parse(params.id);

			// CREATE
			if (id == '00000000-0000-0000-0000-000000000000') {
				log.debug('CREATE action formData:', formData);

				formData.set('id', crypto.randomUUID());
				formData.set('created_by', email);
				formData.set('updated_by', email);
				const payload = createSchema.parse(formData);
				log.debug('CREATE action payload:', payload);

				const jsonPayload = {
					...payload,
					...(payload.tags && { tags: arrayToString(payload.tags) }),
					...(payload.annotations && { annotations: mapToString(payload.annotations) })
				};

				const variables = { data: jsonPayload };
				log.debug('CREATE action variables:', variables);

				//const { errors, data } = await createPolicyStore.mutate(variables, {
				const data = await createPolicyStore.mutate(variables, {
					metadata: { backendToken: 'token from tokenStore' },
					fetch
				});

				const actionResult = data.insert_tz_policies_one;

				return { actionResult };
				// throw redirect(303, '/dashboard/policies');
			}

			// UPDATE
			else {
				log.debug('UPDATE action formData:', formData);
				formData.set('updated_by', email);
				const payload = updateSchema.parse(formData);
				log.debug('UPDATE action payload:', payload);

				const jsonPayload = {
					...payload,
					...(payload.tags && { tags: arrayToString(payload.tags) }),
					...(payload.annotations && { annotations: mapToString(payload.annotations) })
				};

				const variables = { id, data: jsonPayload };
				log.debug('UPDATE action variables:', variables);

				//const { errors, data } = await updatePolicyStore.mutate(variables, {
				const data = await updatePolicyStore.mutate(variables, {
					metadata: { backendToken: 'token from tokenStore' },
					fetch
				});

				const actionResult = data.update_tz_policies_by_pk;

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
