import { env as dynPriEnv } from '$env/dynamic/private';
import { env as dynPubEnv } from '$env/dynamic/public';
import { CachePolicy, DeletePolicyStore, order_by, SearchPoliciesStore } from '$houdini';
import { Logger } from '$lib/utils';
import { getAppError, isAppError, isHttpError } from '$lib/utils/errors';
// import { getToken } from '@auth/core/jwt';
import { getToken } from '$lib/server/middleware/authjs-helper';
import * as Sentry from '@sentry/svelte';
import { error, fail } from '@sveltejs/kit';

import assert from 'node:assert';
import type { Actions, PageServerLoad } from './$types';

assert.ok(dynPubEnv.PUBLIC_GRAPHQL_ENDPOINT, 'PUBLIC_GRAPHQL_ENDPOINT not configered');
assert.ok(dynPriEnv.HASURA_GRAPHQL_ADMIN_SECRET, 'HASURA_GRAPHQL_ADMIN_SECRET not configered');

const log = new Logger('policies.server');

// const query = searchPoliciesStore.artifact.raw;
// const delete_mutation = new DeletePolicyStore().artifact.raw;

const searchPoliciesStore = new SearchPoliciesStore();
const deletePolicyStore = new DeletePolicyStore();

export const load = (async (event) => {
	const { url, setHeaders, parent, request, cookies } = event;
	await parent(); // HINT: to make sure use session is valid

	// FIXME: always return null
	// const token = await getToken({req: { cookies: event.cookies, headers: event.request.headers },secret: dynPriEnv.AUTH_SECRET,raw: true});
	// const token = await getToken({ req: request, secret: dynPriEnv.AUTH_SECRET, raw: true });
	const token = await getToken(cookies);
	log.info('token>>>', token);

	const limit = parseInt(url.searchParams.get('limit') ?? '');
	const offset = parseInt(url.searchParams.get('offset') ?? '');
	const subject_type = url.searchParams.get('subType');
	const display_name = url.searchParams.get('name');

	const orderBy = [{ updated_at: order_by.desc_nulls_first }];
	const where = {
		deleted_at: { _is_null: true },
		...(subject_type ? { subject_type: { _eq: subject_type } } : {}),
		...(display_name ? { display_name: { _like: `%${display_name}%` } } : {})
	};
	const variables = { where, limit, offset, orderBy };
	// const operationName = 'SearchPolicies';

	try {
		const { errors, data } = await searchPoliciesStore.fetch({
			event,
			blocking: true,
			policy: CachePolicy.CacheAndNetwork,
			metadata: { backendToken: 'token from TokenJar' },
			variables
		});

		if (errors) return { loadErrors: errors }; // return invalid(400, {loadErrors: errors });
		if (!data) return { loadErrors: [{ message: 'data null' }] };

		const count = data.counts?.aggregate?.count;
		const policies = data.tz_policies;

		// TIXME: tune: This page will have cache for 5min
		// setHeaders({
		// 	'cache-control': 'public, max-age=300'
		// });

		return { count, policies };
	} catch (err) {
		log.error('accounts:actions:load:error:', err);
		Sentry.setContext('source', { code: 'account' });
		Sentry.captureException(err);

		if (isHttpError(err)) {
			throw error(err.status, err.body);
		}
		if (isAppError(err)) {
			throw error(500, err);
		}
		throw error(500, getAppError(err));
	}
}) satisfies PageServerLoad;

export const actions = {
	delete: async ({ request, fetch }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return fail(400, { id: 'id is required' });
		const variables = { id };

		try {
			const data = await deletePolicyStore.mutate(variables, {
				metadata: { backendToken: 'token from tokenStore' },
				fetch
				// optimisticResponse: {}
			});

			const actionResult = data.delete_tz_policies_by_pk;
			if (!actionResult) return fail(400, { actionErrors: [{ message: 'data null' }] });

			return {
				actionResult
			};
		} catch (err) {
			console.error('account:actions:delete:error:', err);
			Sentry.setContext('source', { code: 'policy.delete' });
			Sentry.captureException(err);

			if (isHttpError(err)) {
				throw error(err.status, err.body);
			}
			if (isAppError(err)) {
				throw error(500, err);
			}
			throw error(500, getAppError(err));
		}
	}
} satisfies Actions;
