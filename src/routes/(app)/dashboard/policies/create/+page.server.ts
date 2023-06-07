import { policySchema as schema } from '$lib/models/schema/policy.new.schema';
import { Logger, stripEmptyProperties } from '$lib/utils';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms/server';

const log = new Logger('policy.create.server');
// export const load = async () => {
// 	// Server API:
// 	const form = await superValidate(schema);

// 	// Always return { form } in load and form actions.
// 	return { form };
// };

export const actions = {
	default: async (event) => {
		const { request, locals } = event;
		const session = await locals.getSession();
		if (session?.user == undefined) {
			throw redirect(307, '/auth/signin?callbackUrl=/dashboard/policy/create');
		}

		const form = await superValidate(request, schema);
		log.debug({ form });

		// Convenient validation check:
		if (!form.valid) {
			// Again, always return { form } and things will just work.
			return fail(400, { form });
		}

		log.debug('CREATE action form.data before strip:', form.data);
		stripEmptyProperties(form.data);
		log.debug('CREATE action form.data after strip:', form.data);

		// TODO
		// Check if rule is missing
		if (form.data.ruleId == null && form.data.rule == null) {
			return setError(form, 'ruleId', 'Rule is missing');
		}

		try {
		} catch (err) {
			// log.error('policy:actions:save:error:', err);
			// if (err instanceof ZodError) {
			// 	const { formErrors, fieldErrors } = err.flatten();
			// 	return fail(400, { formErrors, fieldErrors });
			// } else if (err instanceof PolicyError) {
			// 	return fail(400, { actionError: err.toJSON() });
			// } else {
			// 	return handleActionErrors(err);
			// }
		} finally {
			// TODO report error
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
