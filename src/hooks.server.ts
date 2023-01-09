import { PUBLIC_CONFY_SENTRY_DSN } from '$env/static/public';

import { dev } from '$app/environment';
import { TokenJar } from '$lib/server/backend/TokenJar';
import { authjs, guard } from '$lib/server/middleware';
import { Logger } from '$lib/utils';
import * as Sentry from '@sentry/svelte';
import { BrowserTracing } from '@sentry/tracing';
import type { HandleFetch, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
/**
 * Code in hooks.server.ts will run when the application starts up,
 * making them useful for initializing database clients, Sentry and so on.
 */

// TODO: https://github.com/sveltejs/kit/issues/6731

// Setup logger
if (!dev) {
	Logger.enableProductionMode();
}

// for graceful termination
process.on('SIGINT', function () {
	process.exit();
}); // Ctrl+C
process.on('SIGTERM', function () {
	process.exit();
}); // docker stop

// Read: https://github.com/sveltejs/kit/blob/master/documentation/docs/07-hooks.md

// Initialize the Sentry SDK here
if (!dev && PUBLIC_CONFY_SENTRY_DSN) {
	Sentry.init({
		dsn: PUBLIC_CONFY_SENTRY_DSN,
		release: __APP_VERSION__,
		initialScope: {
			tags: { source: 'server' }
		},
		integrations: [new BrowserTracing()],

		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0
	});
}

// Initialize TokenJar
TokenJar.init([
	// {
	// 	endpoint: dynPriEnv.MY_BACKEND_ENDPOINT ?? '',
	// 	authConfig: {
	// 		auth_endpoint: dynPriEnv.MY_BACKEND_AUTH_ENDPOINT ?? '',
	// 		client_id: dynPriEnv.MY_BACKEND_AUTH_CLIENT_ID ?? '',
	// 		client_secret: dynPriEnv.MY_BACKEND_AUTH_CLIENT_SECRET ?? '',
	// 		grant_type: dynPriEnv.MY_BACKEND_AUTH_CLIENT_GRANT_TYPE ?? '',
	// 		scope: dynPriEnv.MY_BACKEND_AUTH_CLIENT_SCOPE
	// 	}
	// }
]);

// Invoked for each endpoint called and initially for SSR router
// export const handle = sequence(setUser, guard, houdini, logger);
export const handle = sequence(authjs, guard);

export const handleServerError = (({ error, event }) => {
	console.error('hooks:server:handleServerError:', error);
	Sentry.setExtra('event', event);
	Sentry.captureException(error);
	const err = error as App.Error;
	return {
		message: err.message ?? 'Whoops!',
		context: err.context
	};
}) satisfies HandleServerError;

export const handleFetch = (async ({ event, request, fetch }) => {
	console.log('hooks.server.ts, HandleFetch: pageUrl:', event.url.toString());

	const token = TokenJar.getToken(request.url);
	if (token) {
		console.debug('hooks.server.ts, HandleFetch: adding token for:', request.url);
		request.headers.set('Authorization', `Bearer ${token}`);
	}
	/*
	if (request.url.startsWith('https://graph.microsoft.com')) {
		request.headers.set('Authorization', `Bearer ${microsoft_token}`);
	}
	if (request.url.startsWith('https://api.yourapp.com/')) {
		// clone the original request, but change the URL
		request = new Request(
			request.url.replace('https://api.yourapp.com/', 'http://localhost:9999/'),
			request
		);
	}
	*/
	return fetch(request);
}) satisfies HandleFetch;
