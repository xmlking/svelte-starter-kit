import { dev } from '$app/environment';
import { Logger } from '$lib/utils';
import envPub from '$lib/variables/variables';
import envPri from '$lib/variables/variables.server';
import type { Provider } from '@auth/core/providers';
import AzureAD from '@auth/core/providers/azure-ad';
import GitHub from '@auth/core/providers/github';
import Google from '@auth/core/providers/google';
import { SvelteKitAuth } from '@auth/sveltekit';
import type { Handle } from '@sveltejs/kit';
import { SignJWT } from 'jose';
import { appRoles } from './role-mapper';
// import { HasuraAdapter } from 'next-auth-hasura-adapter';

// TODO: https://hasura.io/learn/graphql/hasura-authentication/integrations/nextjs-auth/
// https://github.com/yaroslavnosenko/recode-ui/blob/main/pages/api/auth/%5B...nextauth%5D.ts
// https://github.com/artizen-fund/artizen-frontend/blob/main/src/lib/apollo/apolloClient.ts

const log = new Logger('middleware:auth');

const secret = new TextEncoder().encode(envPri.AUTH_SECRET);
const alg = 'HS256';

export const authjs = SvelteKitAuth({
	debug: dev,
	trustHost: true,
	// adapter: HasuraAdapter({
	// 	endpoint: HASURA_GRAPHQL_ENDPOINT,
	// 	adminSecret: HASURA_GRAPHQL_ADMIN_SECRET
	// }),
	providers: [
		Google({
			clientId: envPri.GOOGLE_ID,
			clientSecret: envPri.GOOGLE_SECRET,
			authorization: { params: { prompt: 'consent' } }
		}),
		AzureAD({
			clientId: envPri.AZURE_AD_CLIENT_ID,
			clientSecret: envPri.AZURE_AD_CLIENT_SECRET,
			tenantId: envPri.AZURE_AD_TENANT_ID,
			authorization: { params: { scope: 'openid profile User.Read email' } }
			// client: {},
		}),
		GitHub({ clientId: envPri.GITHUB_ID, clientSecret: envPri.GITHUB_SECRET })
	] as Provider[],
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
				token.roles ??= appRoles(profile.roles ?? profile.groups);

				const hasuraToken = {
					'https://hasura.io/jwt/claims': {
						'x-hasura-allowed-roles': token.roles,
						'x-hasura-default-role': 'self',
						'x-hasura-org-id': envPub.PUBLIC_TENANT_ID,
						'x-hasura-user-id': token.email // token.sub
					}
				};
				// `scp` or `scope` is required for Spring Security.
				const scp = Array.isArray(token.roles) ? token.roles.join(' ') : undefined;
				// TODO: use asymmetric keys for signing, so we can share public key with API providers
				token.token = await new SignJWT({ ...hasuraToken, scp })
					.setProtectedHeader({ alg })
					.setIssuedAt()
					.setSubject(token.email ?? '')
					.setIssuer('svelte-starter-kit')
					.setAudience('hasura')
					.setExpirationTime('24h') // TODO: account?.expires_in
					.sign(secret);

				// token.accessToken = account.access_token; // account.id_token

				// FIXME: for Azure AD picture is base64 and it is too big to fit in cookie.
				// will through `431 Request Header Fields Too Large` unless we remove it.
				// if (token.picture?.startsWith('data:')) delete token.picture;
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
