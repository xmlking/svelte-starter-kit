import { superValidate } from 'sveltekit-superforms/client';
import { createPolicySchema as schema } from '$lib/models/schema';

export const load = async () => {
	// Client API:
	const form = await superValidate(schema);

	// Always return { form } in load and form actions.
	return { schema: schema, form };
};
