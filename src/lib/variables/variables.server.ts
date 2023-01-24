import { building } from '$app/environment';
import { env as dynPriEnv } from '$env/dynamic/private';
import * as statPriEnv from '$env/static/private';
import { z } from 'zod';

/**
 * To use any type besides string, you need to use zod's `coerce` method.
 */

const schema = z.object({
	// Add your private env variables here
	AUTH_SECRET: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	}),
	NEXTAUTH_URL: z.string().url().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	}),
	VERCEL: z.coerce.boolean(),
	AZURE_AD_CLIENT_ID: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	}),
	AZURE_AD_CLIENT_SECRET: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	}),
	AZURE_AD_TENANT_ID: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	}),
	GITHUB_ID: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	}),
	GITHUB_SECRET: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	}),
	GOOGLE_ID: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	}),
	GOOGLE_SECRET: z.string().regex(new RegExp('^\\S*$'), {
		message: 'No spaces allowed'
	})
});

if (!building) {
	console.log('not building, TODO: do not process.exit(1)');
}
const parsed = schema.safeParse({ ...statPriEnv, ...dynPriEnv });

if (!parsed.success) {
	console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 4));
	process.exit(1);
}

export default parsed.data;
