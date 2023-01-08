import { browser } from '$app/environment';
import { env as dynPubEnv } from '$env/dynamic/public';
import type { RequestHandlerArgs } from '$houdini';
import { HoudiniClient } from '$houdini';
import { createClient as createWSClient } from 'graphql-ws';

const url = dynPubEnv.PUBLIC_GRAPHQL_ENDPOINT;
// FIXME: remove PUBLIC_API_TOKEN
const adminSecret = dynPubEnv.PUBLIC_API_TOKEN ?? '';

// For Query & Mutation
async function fetchQuery({ fetch, text = '', variables = {}, metadata, session }: RequestHandlerArgs) {
	// metadata usage example
	if (metadata) console.log('metadata', metadata);

	const token = session?.user?.token;

	const result = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			'X-Hasura-Admin-Secret': adminSecret // FIXME: remove me
		},
		body: JSON.stringify({
			query: text,
			variables
		})
	});
	return await result.json();
}

// For subscription (client only)
const socketClient = browser
	? // @ts-expect-error - for using new
	  new createWSClient({
			url: url.replace(/^https?/, 'wss').replace(/^http?/, 'ws')
	  })
	: null;

export default new HoudiniClient(fetchQuery, socketClient);
