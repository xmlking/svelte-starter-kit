import { env as dynPubEnv } from '$env/dynamic/public';
import * as statPubEnv from '$env/static/public';
import { z } from 'zod';

/**
 * To use any type besides string, you need to use zod's `coerce` method.
 */

const schema = z.object({
	// Add your public env variables here
	PUBLIC_BASE_URL: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	}),
	PUBLIC_GRAPHQL_ENDPOINT: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	}),
	PUBLIC_GRAPHQL_TOKEN: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	}),
	PUBLIC_GOOGLE_ANALYTICS_TARGET_ID: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	}),
	PUBLIC_SENTRY_DSN: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	})
});

const parsed = schema.safeParse({ ...statPubEnv, ...dynPubEnv });

if (!parsed.success) {
	console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 4));
	process.exit(1);
}

export default parsed.data;
