import {
	AZURE_AD_CLIENT_ID,
	AZURE_AD_CLIENT_SECRET,
	AZURE_AD_TENANT_ID,
	GITHUB_ID,
	GITHUB_SECRET,
	GOOGLE_ID,
	GOOGLE_SECRET
} from '$env/static/private';
import AzureAD from '@auth/core/providers/azure-ad';
import GitHub from '@auth/core/providers/github';
import Google from '@auth/core/providers/google';
import SvelteKitAuth from '@auth/sveltekit';
import type { Handle } from '@sveltejs/kit';

// TODO: https://hasura.io/learn/graphql/hasura-authentication/integrations/nextjs-auth/

export const authjs = SvelteKitAuth({
	providers: [
		Google({
			clientId: GOOGLE_ID,
			clientSecret: GOOGLE_SECRET,
			authorization: { params: { prompt: 'consent' } }
		}),
		AzureAD({
			clientId: AZURE_AD_CLIENT_ID,
			clientSecret: AZURE_AD_CLIENT_SECRET,
			tenantId: AZURE_AD_TENANT_ID
			// HINT: https://github.com/nextauthjs/next-auth/issues/6138
			// token: `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
			// userinfo: 'https://graph.microsoft.com/oidc/userinfo',
			// authorization: {
			// 	url: `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`,
			// 	params: { scope: 'openid profile User.Read email' }
			// }
		}),
		GitHub({ clientId: GITHUB_ID, clientSecret: GITHUB_SECRET })
	],
	callbacks: {
		async jwt({ token, account, profile }) {
			if (account) {
				token.token = account.access_token; // account.id_token
			}
			if (profile) {
				token.email ??= profile.upn;
				token.roles ??= profile.roles;
			}
			// FIXME: for Azure AD picture is base64 and it is too big to fit in cookie.
			// will through `431 Request Header Fields Too Large` unless we remove it.
			if (token.picture?.startsWith('data:')) delete token.picture;
			return token;
		},
		async session({ session, token }) {
			session.token = token.token;
			session.roles = token.roles;
			return session;
		}
	}
}) satisfies Handle;
