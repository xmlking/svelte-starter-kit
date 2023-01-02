import { browser } from '$app/environment';
import { env as dynPriEnv } from '$env/dynamic/private';
import { env as dynPubEnv } from '$env/dynamic/public';
import type { RequestHandlerArgs } from '$houdini';
import { HoudiniClient } from '$houdini';
import { createClient as createWSClient } from 'graphql-ws';

const url = dynPubEnv.PUBLIC_GRAPHQL_ENDPOINT;
// FIXME: remove HASURA_GRAPHQL_ADMIN_SECRET
const adminSecret = dynPriEnv.HASURA_GRAPHQL_ADMIN_SECRET;
console.log('HASURA_GRAPHQL_ADMIN_SECRET', adminSecret);
// For Query & Mutation
async function fetchQuery({ fetch, text = '', variables = {}, metadata, session }: RequestHandlerArgs) {
	const token = session?.user?.token;
	console.log('HASURA_GRAPHQL_ADMIN_SECRET, token', adminSecret, token);
	const result = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			'X-Hasura-Admin-Secret': adminSecret // FIXME: remove
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
