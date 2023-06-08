import { ToastLevel } from '$lib/components/toast';
import { createPolicySchema as schema } from '$lib/models/schema/policy.new.schema';
import { Logger, stripEmptyProperties } from '$lib/utils';
import { fail } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';
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
		if (!form.valid) return fail(400, { form });
		// NOTE: you can add multiple errors and in catch, send all
		// setError(form,  null, ['Rule is missing', 'dddd']);
		// return message(form, 'Invalid form');

		const createData = { ...form.data };
		log.debug('CREATE action createData before strip:', createData);
		stripEmptyProperties(createData);
		log.debug('CREATE action createData after strip:', createData);

		// TODO
		// Check if rule is missing
		if (form.data.ruleId == null && form.data.rule == null) {
			return setError(form, 'ruleId', 'Rule is missing');
		}

		// // Check if a user with that email exists
		// if (await locals.prisma.user.findUnique({ where: { email: form.data.email } })) {
		// 	return message(form, 'A user already exists with the specified email.', {
		// 		status: 409
		// 	});
		// }

		await sleep(2000);
		// if some exception, setMessage or setError and return
		//  setError(form, '', 'Rule is missing');
		//  setError(form, '', 'active is missing');

		// return message(form, 'Policy Created');
		const message = {
			message: `Policy Created: ${createData.rule.displayName}`,
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
