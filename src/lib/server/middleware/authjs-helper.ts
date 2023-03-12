import envPri from '$lib/variables/variables.server';
import { decode } from '@auth/core/jwt';
import type { Cookies } from '@sveltejs/kit';
import { SignJWT } from 'jose';

// FIXME: temp workaround. remove when fixed.
// https://github.com/nextauthjs/next-auth/discussions/5595#discussioncomment-4628977

const secureCookie = envPri.NEXTAUTH_URL?.startsWith('https://') ?? envPri.VERCEL;
const cookieName = secureCookie ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
const secret = new TextEncoder().encode(envPri.AUTH_SECRET);
const alg = 'HS256';

export async function getToken(cookies: Cookies, raw = false) {
	const token = cookies.get(cookieName);
	if (raw) return token;
	return await decode({ token, secret: envPri.AUTH_SECRET });
}

export async function getSignedToken(cookies: Cookies) {
	const decodedToken = await getToken(cookies);
	if (decodedToken == null || typeof decodedToken === 'string') return null;
	const signedToken = new SignJWT(decodedToken).setProtectedHeader({ alg }).sign(secret);
	return signedToken;
}
