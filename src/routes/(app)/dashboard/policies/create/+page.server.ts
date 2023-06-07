import { policySchema } from '$lib/models/schema/policy.new.schema';
import { Logger, stripEmptyProperties } from '$lib/utils';
import { redirect } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms/server';

const log = new Logger('policy.create.server');
// export const load = async () => {
// 	// Server API:
// 	const form = await superValidate(policySchema);

// 	// Always return { form } in load and form actions.
// 	return { form };
// };

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, policySchema);

		log.debug({ form });
		// Convenient validation check:
		if (!form.valid) {
			// Again, always return { form } and things will just work.
			return message(form, 'Invalid form');
			// return fail(400, { form });
		}

		log.debug('CREATE action form.data before:', form.data);
		stripEmptyProperties(form.data);
		log.debug('CREATE action form.data after:', form.data);

		// TODO
		// Check if rule is missing
		if (form.data.ruleId == null && form.data.rule == null) {
			return setError(form, 'ruleId', 'Rule is missing');
		}
		await sleep(2000);

		// // Check if a user with that email exists
		// if (await locals.prisma.user.findUnique({ where: { email: form.data.email } })) {
		// 	return message(form, 'A user already exists with the specified email.', {
		// 		status: 409
		// 	});
		// }

		// Redirect to the dashboard
		throw redirect(302, '/dashboard/policies');
	}
};

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
