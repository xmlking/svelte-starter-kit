import { browser } from '$app/environment';
import type { RequestHandlerArgs } from '$houdini';
import { HoudiniClient } from '$houdini';
import envPub from '$lib/variables/variables';
import { createClient as createWSClient } from 'graphql-ws';

const url = envPub.PUBLIC_GRAPHQL_ENDPOINT;
// FIXME: remove PUBLIC_GRAPHQL_TOKEN
const adminSecret = envPub.PUBLIC_GRAPHQL_TOKEN;

// For Query & Mutation
async function fetchQuery({ fetch, text = '', variables = {}, metadata, session }: RequestHandlerArgs) {
	// metadata usage example
	if (metadata) {
		console.log('metadata...', metadata);
	}
	if (session) {
		console.log('session...', session);
	}

	const token = session?.token;
	const backendToken = metadata?.backendToken;

	const result = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : { 'x-hasura-admin-secret': adminSecret }), // FIXME: remove adminSecret
			'x-hasura-role': 'editor',
			...(backendToken ? { backendToken } : {})
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
