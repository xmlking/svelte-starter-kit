import type { policies_set_input, rules_set_input } from '$houdini';
import { UpdatePolicyStore } from '$houdini';
import { ToastLevel } from '$lib/components/toast';
import { updatePolicySchema as schema } from '$lib/models/schema/policy.new.schema';
import { Logger, stripEmptyProperties } from '$lib/utils';
import { uuidSchema } from '$lib/utils/zod.utils';
import { fail } from '@sveltejs/kit';
import type { GraphQLError } from 'graphql';
import { redirect } from 'sveltekit-flash-message/server';
import { setError, setMessage, superValidate } from 'sveltekit-superforms/server';

const log = new Logger('policy.update.server');

const updatePolicyStore = new UpdatePolicyStore();
export const actions = {
	default: async (event) => {
		const { params, request, locals } = event;
		const id = uuidSchema.parse(params.id);
		const session = await locals.getSession();
		if (session?.user == undefined) {
			throw redirect(307, `/auth/signin?callbackUrl=/dashboard/policies/${id}`);
		}

		const form = await superValidate(request, schema);
		log.debug({ form });

		// superform validation
		if (!form.valid) return fail(400, { form });

		const dataCopy = { ...form.data };
		log.debug('dataCopy before strip:', dataCopy);
		stripEmptyProperties(dataCopy);
		log.debug('dataCopy after strip:', dataCopy);
		const { ruleId, rule } = dataCopy;

		// TODO: validate incoming data with business rules
		// if (ruleId == null || ruleId == undefined) {
		// 	return setError(form, 'ruleId', 'Rule is missing');
		// }

		const policyData: policies_set_input = {
			...(dataCopy.active && { active: dataCopy.active }),
			...(dataCopy.validFrom && { validFrom: dataCopy.validFrom }),
			...(dataCopy.validTo && { validTo: dataCopy.validTo }),
			...(dataCopy.weight && { weight: dataCopy.weight })
		};
		const ruleData: rules_set_input = {
			...(rule.displayName && { displayName: rule.displayName }),
			...(rule.description && { description: rule.description }),
			...(rule.annotations && { annotations: rule.annotations }),
			...(rule.tags && { tags: `{${rule.tags}}` }),
			...(rule.source && { source: rule.source }),
			...(rule.sourcePort && { sourcePort: rule.sourcePort }),
			...(rule.destination && { destination: rule.destination }),
			...(rule.destinationPort && { destinationPort: rule.destinationPort }),
			...(rule.action && { action: rule.action }),
			...(rule.direction && { direction: rule.direction }),
			...(rule.protocol && { protocol: rule.protocol }),
			...(rule.appId && { appId: rule.appId }),
			...(rule.weight && { weight: rule.weight }),
			// HINT: only allow changing `shared` property from `false` to `true`
			...(rule.shared == false && { shared: rule.shared })
		};

		const variables = rule.shared ? { policyId: id, policyData, ruleId } : { policyId: id, policyData, ruleId, ruleData };
		log.debug('UPDATE action variables:', variables);
		const { errors, data } = await updatePolicyStore.mutate(variables, {
			metadata: { logResult: true },
			event
		});
		if (errors) {
			errors.forEach((error) => {
				log.error('update policy api error', error);
				// NOTE: you can add multiple errors, send all along with a message
				// TODO: Check for displayName conflect and despatch custom error message
				setError(form, '', (error as GraphQLError).message);
			});
			return setMessage(form, 'Update policy failed');
		}

		const { update_policies_by_pk: policyResult, update_rules_by_pk: ruleResult } = data || {};
		if (!policyResult || !ruleResult) return setMessage(form, 'Create policy failed: responce empty', { status: 404 });

		const message = {
			message: `Policy updated for Subject: ${policyResult.subjectDisplayName} with Rule: ${ruleResult.displayName}`,
			dismissible: true,
			duration: 10000,
			type: ToastLevel.Success
		} as const;
		throw redirect(302, '/dashboard/policies', message, event);
	}
};

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
