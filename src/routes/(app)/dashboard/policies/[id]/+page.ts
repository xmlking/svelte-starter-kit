import { CachePolicy, GetPolicyStore } from '$houdini';
import { updatePolicySchema as schema } from '$lib/models/schema/policy.new.schema';
import { error } from '@sveltejs/kit';
import type { GraphQLError } from 'graphql';
import { superValidate } from 'sveltekit-superforms/server';

const getPolicyStore = new GetPolicyStore();
export const load = async (event) => {
	const {
		params: { id }
	} = event;
	const variables = { id }; // TODO: validate `id`
	const { errors, data } = await getPolicyStore.fetch({
		event,
		blocking: true,
		policy: CachePolicy.CacheAndNetwork,
		variables
	});
	if (errors) throw error(400, errors[0] as GraphQLError);
	const policy = data?.policies_by_pk;
	if (!policy) throw error(404, 'policy not found');
	const form = await superValidate(policy, schema);
	return { form };
};
