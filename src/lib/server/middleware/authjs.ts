import { dev } from '$app/environment';
import { Logger } from '$lib/utils';
import envPri from '$lib/variables/variables.server';
import AzureAD from '@auth/core/providers/azure-ad';
import GitHub from '@auth/core/providers/github';
import Google from '@auth/core/providers/google';
import { SvelteKitAuth } from '@auth/sveltekit';
import type { Handle } from '@sveltejs/kit';
import * as jsonwebtoken from 'jsonwebtoken';
// import { HasuraAdapter } from 'next-auth-hasura-adapter';

// TODO: https://hasura.io/learn/graphql/hasura-authentication/integrations/nextjs-auth/
// https://github.com/yaroslavnosenko/recode-ui/blob/main/pages/api/auth/%5B...nextauth%5D.ts
// https://github.com/artizen-fund/artizen-frontend/blob/main/src/lib/apollo/apolloClient.ts

const log = new Logger('middleware:auth');
export const authjs = SvelteKitAuth({
	debug: dev,
	// adapter: HasuraAdapter({
	// 	endpoint: HASURA_GRAPHQL_ENDPOINT,
	// 	adminSecret: HASURA_GRAPHQL_ADMIN_SECRET
	// }),
	providers: [
		//@ts-expect-error issue https://github.com/nextauthjs/next-auth/issues/6174
		Google({
			clientId: envPri.GOOGLE_ID,
			clientSecret: envPri.GOOGLE_SECRET,
			authorization: { params: { prompt: 'consent' } }
		}),
		//@ts-expect-error issue https://github.com/nextauthjs/next-auth/issues/6174
		AzureAD({
			clientId: envPri.AZURE_AD_CLIENT_ID,
			clientSecret: envPri.AZURE_AD_CLIENT_SECRET,
			tenantId: envPri.AZURE_AD_TENANT_ID,
			authorization: { params: { scope: 'openid profile User.Read email' } }
			// client: {},
		}),
		//@ts-expect-error issue https://github.com/nextauthjs/next-auth/issues/6174
		GitHub({ clientId: envPri.GITHUB_ID, clientSecret: envPri.GITHUB_SECRET })
	],
	callbacks: {
		async redirect({ url, baseUrl }) {
			// Allows relative callback URLs
			if (url.startsWith('/')) return `${baseUrl}${url}`;
			// Allows callback URLs on the same origin
			else if (new URL(url).origin === baseUrl) return url;
			return baseUrl;
		},
		// pages: {
		// 	signIn: '/login'
		// },
		async jwt({ token, user, account, profile, isNewUser }) {
			// log.debug('token>>>', token);
			// log.debug('user>>>', user);
			// log.debug('account>>>', account);
			// log.debug('profile>>>', profile);
			// log.debug('isNewUser>>>', isNewUser);
			const isSignIn = !!(user && profile && account);
			if (isSignIn) {
				log.debug('in isSignIn');
				token.email ??= profile.upn;
				token.roles ??= profile.roles;

				const hasuraToken = {
					//  role can be temporarily or permanently applied to a user to give the user bulk permissions for a task.
					'https://hasura.io/jwt/claims': {
						'X-Hasura-Allowed-Roles': ['viewer', 'editor', 'moderator', 'supervisor'], // user.roles,
						'X-Hasura-Default-Role': 'viewer', // user.roles[0],
						'X-Hasura-Org-Id': 'chinthagunta.com',
						'X-Hasura-User-Id': token.email // token.sub
					}
				};
				token.token = jsonwebtoken.sign(hasuraToken, envPri.AUTH_SECRET, {
					algorithm: 'HS256',
					issuer: 'svelte-starter-kit',
					expiresIn: account?.expires_in
				});
				// token.accessToken = account.access_token; // account.id_token
				// FIXME: for Azure AD picture is base64 and it is too big to fit in cookie.
				// will through `431 Request Header Fields Too Large` unless we remove it.
				if (token.picture?.startsWith('data:')) delete token.picture;
			}
			return token;
		},
		async session({ session, token }) {
			// log.debug('in session, token, session>>>', token, session);
			session.token = token.token;
			session.roles = token.roles;
			if (session.user) session.user.id ??= token.sub;
			// log.debug('in session, session>>>>', session);
			return session;
		}
	}
}) satisfies Handle;
