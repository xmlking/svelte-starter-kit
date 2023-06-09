import type { policies_set_input, rules_set_input } from '$houdini';
import { UpdatePolicyStore } from '$houdini';
import { NotFoundError, PolicyError } from '$lib/errors';
import { policyUpdateSchema } from '$lib/models/schema';
import { Logger } from '$lib/utils';
import { uuidSchema } from '$lib/utils/zod.utils';
import { zfd } from '$lib/zodfd';
import { redirect } from '@sveltejs/kit';
import type { GraphQLError } from 'graphql';

const log = new Logger('policy.details.server');

const updatePolicyStore = new UpdatePolicyStore();
const updateSchema = zfd.formData(policyUpdateSchema, { empty: 'null' });

export const actions = {
	save: async (event) => {
		const { params, request, locals } = event;
		const session = await locals.getSession();
		if (session?.user == undefined) {
			throw redirect(307, '/auth/signin?callbackUrl=/dashboard/policy');
		}

		const formData = await request.formData();
		const id = uuidSchema.parse(params.id);

		// UPDATE

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
};
