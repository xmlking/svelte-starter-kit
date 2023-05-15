import { HoudiniClient, type ClientPlugin } from '$houdini';
import { Logger } from '$lib/utils';
import envPub from '$lib/variables/variables';

import { browser } from '$app/environment';
import { subscription } from '$houdini/plugins';
import { createClient as createWSClient } from 'graphql-ws';

const url = envPub.PUBLIC_GRAPHQL_ENDPOINT;

const log = new Logger('houdini.client');

// in order to verify that we send metadata, we need something that will log the metadata after
const logMetadata: ClientPlugin = () => ({
	end(ctx, { resolve, value }) {
		if (ctx.metadata?.logResult === true) {
			log.info(JSON.stringify(value));
		}

		resolve(ctx);
	}
});
const subClient: ClientPlugin = subscription(({ session }) =>
	createWSClient({
		url: url.replace('https://', 'wss://').replace('http://', 'ws://'),
		connectionParams: () => {
			return {
				headers: {
					Authorization: `Bearer ${session?.token}`
				}
			};
		}
	})
);

// Export the Houdini client
export default new HoudiniClient({
	url,
	fetchParams({ session, metadata }) {
		if (metadata) {
			log.debug('metadata...', metadata);
		}
		if (session) {
			log.debug('session...', session);
		}
		const token = session?.token;
		const backendToken = metadata?.backendToken;
		const useRole = metadata?.useRole;

		return {
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...(useRole ? { 'x-hasura-role': useRole } : { 'x-hasura-role': 'self' }),
				...(backendToken ? { backendToken } : {})
			}
		};
	},
	// throwOnError: {
	// 	operations: ['all'],
	// 	error: (errors) => error(500, errors.map((error) => error.message).join('. ') + '.')
	// },
	plugins: [subClient, ...(browser ? [logMetadata] : [])]
});
