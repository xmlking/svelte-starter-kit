import { superValidate } from 'sveltekit-superforms/client';
import { policySchema } from '$lib/models/schema/policy.new.schema';

export const load = async () => {
	// Client API:
	const form = await superValidate(policySchema);

	// Always return { form } in load and form actions.
	return { schema: policySchema, form };
};
