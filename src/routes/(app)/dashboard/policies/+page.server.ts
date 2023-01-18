import { env as dynPubEnv } from '$env/dynamic/public';
import { CachePolicy, DeletePolicyStore, order_by, SearchPoliciesStore } from '$houdini';
import { handleActionErrors, handleLoadErrors, NotFoundError, PolicyError } from '$lib/errors';
import { Logger } from '$lib/utils';
import { fail } from '@sveltejs/kit';
import { ZodError } from 'zod';
// import { getToken } from '@auth/core/jwt';
import { building } from '$app/environment';
import { policyDeleteSchema, policySearchSchema } from '$lib/models/schema';
import { zfd } from '$lib/zodfd';
import * as Sentry from '@sentry/svelte';
import type { GraphQLError } from 'graphql';
import assert from 'node:assert';
import type { Actions, PageServerLoad } from './$types';

if (!building) {
	assert.ok(dynPubEnv.PUBLIC_GRAPHQL_ENDPOINT, 'PUBLIC_GRAPHQL_ENDPOINT not configured');
	assert.ok(dynPubEnv.PUBLIC_GRAPHQL_TOKEN, 'PUBLIC_GRAPHQL_TOKEN not configured');
}
const log = new Logger('policies.server');

const searchPoliciesStore = new SearchPoliciesStore();
const deletePolicyStore = new DeletePolicyStore();

const searchSchema = zfd.formData(policySearchSchema, { empty: 'strip' });
/**
 * Loader
 */
export const load = (async (event) => {
	const { url, parent } = event;
	try {
		await parent(); // HINT: to make sure use session is valid

		const { limit, offset, subject_type, display_name } = searchSchema.parse(url.searchParams);
		console.log(limit, offset, subject_type, display_name);

		const orderBy = [{ updated_at: order_by.desc_nulls_first }];
		const where = {
			deleted_at: { _is_null: true },
			...(subject_type ? { subject_type: { _eq: subject_type } } : {}),
			...(display_name ? { display_name: { _like: `%${display_name}%` } } : {})
		};
		const variables = { where, limit, offset, orderBy };

		const { errors, data } = await searchPoliciesStore.fetch({
			event,
			blocking: true,
			policy: CachePolicy.CacheAndNetwork,
			metadata: { backendToken: 'token from TokenVault' },
			variables
		});

		if (errors) throw new PolicyError('SEARCH_POLICY_ERROR', 'list policies api error', errors[0] as GraphQLError);
		if (!data) throw new NotFoundError('policies data is null');

		const {
			counts: { aggregate: count },
			tz_policies: policies
		} = data;

		// TODO: tune: This page will have cache for 5min
		// setHeaders({
		// 	'cache-control': 'public, max-age=300'
		// });

		return { count, policies };
	} catch (err) {
		log.error('policies:actions:load:error:', err);
		Sentry.setContext('source', { code: 'policy' });
		Sentry.captureException(err);

		if (err instanceof ZodError) {
			const { formErrors, fieldErrors } = err.flatten();
			return { formErrors, fieldErrors };
		} else if (err instanceof PolicyError && err.name === 'SEARCH_POLICY_ERROR') {
			return { loadError: err.cause };
		} else {
			handleLoadErrors(err);
		}
	}
}) satisfies PageServerLoad;

/**
 * Actions
 */
const deleteSchema = zfd.formData(policyDeleteSchema);

export const actions = {
	delete: async ({ request, fetch }) => {
		try {
			const formData = await request.formData();
			const { id } = deleteSchema.parse(formData);

			const variables = { id };

			//const { errors, data } = await deletePolicyStore.mutate(variables, {
			const data = await deletePolicyStore.mutate(variables, {
				metadata: { backendToken: 'token from tokenStore' },
				fetch
			});

			const actionResult = data.delete_tz_policies_by_pk;
			if (!actionResult) throw new NotFoundError('policy not found');

			return {
				actionResult
			};
		} catch (err) {
			console.error('policies:actions:delete:error:', err);
			Sentry.setContext('source', { code: 'policy.delete' });
			Sentry.captureException(err);

			// err[0] is GraphQLError
			if (Array.isArray(err)) {
				// TODO: wrap GraphQLError at source as PolicyError<DELETE_POLICY_ERROR> and catch here.
				const delErr = new PolicyError('DELETE_POLICY_ERROR', 'delete policy api error', err[0] as GraphQLError);
				return fail(400, { actionError: delErr.toJSON() });
			} else {
				return handleActionErrors(err);
			}
		}
	}
} satisfies Actions;
