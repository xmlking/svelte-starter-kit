import type { policies_insert_input, policies_set_input, rules_set_input } from '$houdini';
import { CachePolicy, CreatePolicyStore, GetPolicyStore, UpdatePolicyStore } from '$houdini';
import { NotFoundError, PolicyError, handleActionErrors, handleLoadErrors } from '$lib/errors';
import { policyCreateSchema, policyUpdateSchema } from '$lib/models/schema';
import { Logger } from '$lib/utils';
import { uuidSchema } from '$lib/utils/zod.utils';
import { zfd } from '$lib/zodfd';
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
		const policy = {
			id: '00000000-0000-0000-0000-000000000000',
			subjectId: '',
			subjectType: 'user',
			subjectSecondaryId: '',
			subjectDisplayName: '',
			active: true,
			validFrom: null,
			validTo: null,
			displayName: '',
			// tags: ['tz', 'us'],
			// annotations: { 'sumo': 'demo' },
			shared: false,
			source: '',
			sourcePort: '',
			destination: '',
			destinationPort: '',
			protocol: 'Any',
			action: 'block',
			direction: 'egress',
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
		const { rule, ...policyRest } = policy;
		const { id: ruleId, ...ruleRest } = rule;
		const flattenedPolicy = { ...ruleRest, ruleId, ...policyRest };
		return { policy: flattenedPolicy };
	} catch (err) {
		log.error('policies:actions:load:error:', err);
		if (err instanceof PolicyError && err.name === 'GET_POLICY_ERROR') {
			return { loadError: err.toJSON() };
		} else {
			handleLoadErrors(err);
		}
	} finally {
		// TODO report error
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

				const jsonPayload: policies_insert_input = {
					...(payload.active && { active: payload.active }),
					...(payload.validFrom && { validFrom: payload.validFrom }),
					...(payload.validTo && { validTo: payload.validTo }),
					...(payload.weight && { weight: payload.weight }),

					...(payload.subjectDisplayName && { subjectDisplayName: payload.subjectDisplayName }),
					...(payload.subjectId && { subjectId: payload.subjectId }),
					...(payload.subjectSecondaryId && { subjectSecondaryId: payload.subjectSecondaryId }),
					...(payload.subjectType && { subjectType: payload.subjectType }),
					rule: {
						data: {
							...(payload.displayName && { displayName: payload.displayName }),
							...(payload.description && { description: payload.description }),
							...(payload.annotations && { annotations: payload.annotations }),
							...(payload.tags && { tags: `{${payload.tags}}` }),
							...(payload.source && { source: payload.source }),
							...(payload.sourcePort && { sourcePort: payload.sourcePort }),
							...(payload.destination && { destination: payload.destination }),
							...(payload.destinationPort && { destinationPort: payload.destinationPort }),
							...(payload.action && { action: payload.action }),
							...(payload.direction && { direction: payload.direction }),
							...(payload.protocol && { protocol: payload.protocol }),
							...(payload.appId && { appId: payload.appId }),
							...(payload.weight && { weight: payload.weight }),
							...(payload.shared && { shared: payload.shared })
						}
					}
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

				const policyData: policies_set_input = {
					...(payload.active && { active: payload.active }),
					...(payload.validFrom && { validFrom: payload.validFrom }),
					...(payload.validTo && { validTo: payload.validTo }),
					...(payload.weight && { weight: payload.weight })
				};
				const ruleId = payload.ruleId;
				const ruleData: rules_set_input = {
					...(payload.displayName && { displayName: payload.displayName }),
					...(payload.description && { description: payload.description }),
					...(payload.annotations && { annotations: payload.annotations }),
					...(payload.tags && { tags: `{${payload.tags}}` }),
					...(payload.source && { source: payload.source }),
					...(payload.sourcePort && { sourcePort: payload.sourcePort }),
					...(payload.destination && { destination: payload.destination }),
					...(payload.destinationPort && { destinationPort: payload.destinationPort }),
					...(payload.action && { action: payload.action }),
					...(payload.direction && { direction: payload.direction }),
					...(payload.protocol && { protocol: payload.protocol }),
					...(payload.appId && { appId: payload.appId })
					// during update, we only update policy level `weight`
					// ...(payload.weight && { weight: payload.weight })
				};

				const variables = { policyId: id, policyData, ruleId, ruleData };
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
			if (err instanceof ZodError) {
				const { formErrors, fieldErrors } = err.flatten();
				return fail(400, { formErrors, fieldErrors });
			} else if (err instanceof PolicyError) {
				return fail(400, { actionError: err.toJSON() });
			} else {
				return handleActionErrors(err);
			}
		} finally {
			// TODO report error
		}
	}
};
