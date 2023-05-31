import { CachePolicy, DeletePolicyStore, order_by, SearchPoliciesStore } from '$houdini';
import { handleActionErrors, handleLoadErrors, NotFoundError, PolicyError } from '$lib/errors';
import { Logger } from '$lib/utils';
import { fail } from '@sveltejs/kit';
import { ZodError } from 'zod';
// import { getToken } from '@auth/core/jwt';
import { policyDeleteSchema, policySearchSchema } from '$lib/models/schema';
import { zfd } from '$lib/zodfd';
import type { GraphQLError } from 'graphql';

const log = new Logger('route:policies');

const searchPoliciesStore = new SearchPoliciesStore();
const deletePolicyStore = new DeletePolicyStore();

const searchSchema = zfd.formData(policySearchSchema, { empty: 'strip' });
/**
 * Loader
 */
export async function load(event) {
	const { url, parent } = event;
	try {
		await parent(); // HINT: to make sure use session is valid

		const { limit, offset, subjectType, subjectId } = searchSchema.parse(url.searchParams);
		log.debug(limit, offset, subjectType, subjectId);

		const orderBy = [{ updatedAt: order_by.desc_nulls_first }];
		const where = {
			...(subjectType ? { subjectType: { _eq: subjectType } } : {}),
			...(subjectId ? { subjectId: { _eq: subjectId } } : {})
		};
		const variables = { where, limit, offset, orderBy };

		const { errors, data } = await searchPoliciesStore.fetch({
			event,
			blocking: true,
			policy: CachePolicy.CacheAndNetwork,
			metadata: { backendToken: 'token from TokenVault', useRole: 'user', logResult: true },
			variables
		});

		if (errors) throw new PolicyError('SEARCH_POLICY_ERROR', 'list policies api error', errors[0] as GraphQLError);
		if (!data) throw new NotFoundError('policies data is null');

		// TODO: tune: This page will have cache for 5min
		// setHeaders({
		// 	'cache-control': 'public, max-age=300'
		// });

		return { policies: data.policies };
	} catch (err) {
		log.error('policies:actions:load:error:', err);

		if (err instanceof ZodError) {
			const { formErrors, fieldErrors } = err.flatten();
			return { formErrors, fieldErrors };
		} else if (err instanceof PolicyError && err.name === 'SEARCH_POLICY_ERROR') {
			return { loadError: err.toJSON() };
		} else {
			handleLoadErrors(err);
		}
	} finally {
		// TODO report error
	}
}

/**
 * Actions
 */
const deleteSchema = zfd.formData(policyDeleteSchema);

export const actions = {
	delete: async (event) => {
		const { request } = event;
		try {
			const formData = await request.formData();
			const { id } = deleteSchema.parse(formData);
			const deletedAt = new Date().toISOString();

			const variables = { id, deletedAt };

			const { errors, data } = await deletePolicyStore.mutate(variables, {
				metadata: { backendToken: 'token from TokenVault', logResult: true },
				event
			});
			if (errors) throw new PolicyError('DELETE_POLICY_ERROR', 'delete policy api error', errors[0] as GraphQLError);

			const actionResult = data?.update_policies_by_pk;
			if (!actionResult) throw new NotFoundError('data is null');

			return {
				actionResult
			};
		} catch (err) {
			log.error('policies:actions:delete:error:', err);
			if (err instanceof PolicyError && err.name === 'DELETE_POLICY_ERROR') {
				return fail(400, { actionError: err.toJSON() });
			} else {
				return handleActionErrors(err);
			}
		} finally {
			// TODO report error
		}
	}
};
