import { createPolicySchema as schema } from '$lib/models/schema/policy.new.schema';
import { error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';

const policies = [];
export const load = async ({ url }) => {
	const id = url.searchParams.get('id');
	const policy = id ? policies.find((u) => u.id == id) : null;

	if (id && !policy) throw error(404, 'Policy not found.');

	const form = await superValidate(policy, schema);
	return { form, policies };
};
