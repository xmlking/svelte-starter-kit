import { dev } from '$app/environment';
import { Logger } from '$lib/utils';
import envPub from '$lib/variables/variables';
import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry, Replay } from '@sentry/sveltekit';
import type { HandleClientError } from '@sveltejs/kit';

// Setup logger
if (!dev) {
	Logger.enableProductionMode();
}

// Initialize the Sentry SDK here
if (!dev && envPub.PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: envPub.PUBLIC_SENTRY_DSN,
		release: __APP_VERSION__,
		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0,

		// This sets the sample rate to be 10%. You may want this to be 100% while
		// in development and sample at a lower rate in production
		replaysSessionSampleRate: 0.1,

		// If the entire session is not sampled, use the below sample rate to sample
		// sessions when an error occurs.
		replaysOnErrorSampleRate: 1.0,

		// If you don't want to use Session Replay, just remove the line below:
		integrations: [new Replay()],

		initialScope: {
			tags: { source: 'client' }
		}
	});
}

export const handleClientError = (({ error, event }) => {
	console.error('hooks:client:handleClientError:', error);
	const err = error as App.Error;
	return {
		message: err.message ?? 'Whoops!',
		context: err.context
	};
}) satisfies HandleClientError;

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry(handleClientError);
