import { env as dynPriEnv } from '$env/dynamic/private';
import { decode } from '@auth/core/jwt';
import type { Cookies } from '@sveltejs/kit';

// FIXME: temp workarround. remove when fixed.
// https://github.com/nextauthjs/next-auth/discussions/5595#discussioncomment-4628977

const secureCookie = dynPriEnv.NEXTAUTH_URL?.startsWith('https://') ?? !!dynPriEnv.VERCEL;
const cookieName = secureCookie ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

export async function getToken(cookies: Cookies, raw = false) {
	const token = cookies.get(cookieName);
	if (raw) return token;
	return await decode({ token, secret: dynPriEnv.AUTH_SECRET });
}
