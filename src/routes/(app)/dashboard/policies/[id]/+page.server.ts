import { CachePolicy, CreatePolicyStore, GetPolicyStore, UpdatePolicyStore, type policies_insert_input } from '$houdini';
import { NotFoundError, PolicyError, handleActionErrors, handleLoadErrors } from '$lib/errors';
import { policyCreateSchema, policyUpdateSchema } from '$lib/models/schema';
import { Logger } from '$lib/utils';
import { uuidSchema } from '$lib/utils/zod.utils';
import envPub from '$lib/variables/variables';
import { zfd } from '$lib/zodfd';
import * as Sentry from '@sentry/svelte';
import { fail, redirect } from '@sveltejs/kit';
import type { GraphQLError } from 'graphql';
import { ZodError } from 'zod';

const log = new Logger('policy.details.server');

const getPolicyStore = new GetPolicyStore();
const createPolicyStore = new CreatePolicyStore();
const updatePolicyStore = new UpdatePolicyStore();
/**
 * loaders
 */
export async function load(event) {
	const { params, parent } = event;
	const { session } = await parent();

	if (session?.user == undefined) {
		throw redirect(307, '/auth/signin?callbackUrl=/dashboard/policy');
	}

	const { id } = params;
	if (id == '00000000-0000-0000-0000-000000000000') {
		const policy: policies_insert_input = {
			id: '00000000-0000-0000-0000-000000000000',
			displayName: '',
			// tags: ['tz', 'us'],
			// annotations: { 'sumo': 'demo' },
			validFrom: null,
			validTo: null,
			subjectId: '6e9bf365-8c09-4dd9-b9b2-83f6ab315618',
			subjectType: 'subject_type_user',
			subjectSecondaryId: 'sumo@chinthagunta.com',
			subjectDisplayName: '',
			organization: envPub.PUBLIC_ORGANIZATION,
			disabled: false,
			template: false,
			sourceAddress: '',
			sourcePort: '',
			destinationAddress: '',
			destinationPort: '',
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
			metadata: { backendToken: 'token from TokenVault', useRole: 'user', logResult: true },
			variables
		});

		if (errors) throw new PolicyError('GET_POLICY_ERROR', 'get policy api error', errors[0] as GraphQLError);
		const policy = data?.policies_by_pk;
		if (!policy) throw new NotFoundError('policy not found');
		return { policy };
	} catch (err) {
		log.error('policies:actions:load:error:', err);
		Sentry.setContext('source', { code: 'policy' });
		Sentry.captureException(err);
		if (err instanceof PolicyError && err.name === 'GET_POLICY_ERROR') {
			return { loadError: err.toJSON() };
		} else {
			handleLoadErrors(err);
		}
	}
}

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
				const payload = createSchema.parse(formData);
				log.debug('CREATE action payload:', payload);

				const jsonPayload = {
					...payload,
					...(payload.tags && { tags: `{${payload.tags}}` })
				};

				const variables = { data: jsonPayload };
				log.debug('CREATE action variables:', variables);

				const { errors, data } = await createPolicyStore.mutate(variables, {
					metadata: { backendToken: 'token from TokenVault', logResult: true },
					event
				});
				if (errors) throw new PolicyError('CREATE_POLICY_ERROR', 'create policy api error', errors[0] as GraphQLError);

				const actionResult = data?.insert_policies_one;
				if (!actionResult) throw new NotFoundError('data is null');

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

				const { errors, data } = await updatePolicyStore.mutate(variables, {
					metadata: { backendToken: 'token from TokenVault', logResult: true },
					event
				});
				if (errors) throw new PolicyError('UPDATE_POLICY_ERROR', 'update policy api error', errors[0] as GraphQLError);

				const actionResult = data?.update_policies_by_pk;
				if (!actionResult) throw new NotFoundError('data is null');

				return { actionResult };
				// throw redirect(303, '/dashboard/policies');
			}
		} catch (err) {
			log.error('policy:actions:save:error:', err);
			Sentry.setContext('source', { code: 'policy.save' });
			Sentry.captureException(err);

			if (err instanceof ZodError) {
				const { formErrors, fieldErrors } = err.flatten();
				return fail(400, { formErrors, fieldErrors });
			} else if (err instanceof PolicyError) {
				return fail(400, { actionError: err.toJSON() });
			} else {
				return handleActionErrors(err);
			}
		}
	}
};
