import { getAppError, isAppError } from '$lib/errors';
import { createRandomAccount } from '$mocks/data/accounts';
import { error } from '@sveltejs/kit';
import { ZodError } from 'zod';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const { id } = params;
	const payload = { id };
	try {
		const account = createRandomAccount();

		if (!account) throw error(404, { message: 'not found' });
		return { account };
	} catch (err) {
		// err as App.Error
		if (err instanceof ZodError) {
			throw error(400, {
				message: 'Invalid request.',
				context: err.flatten().fieldErrors
			});
		} else if (isAppError(err)) {
			throw error(500, err);
		}
		throw error(500, getAppError(err));
	}
}) satisfies PageServerLoad;
