import type { Handle } from '@sveltejs/kit';
// import { getToken } from '@auth/core/jwt';
import { setSession } from '$houdini';
// import { getToken } from '$lib/server/middleware/authjs-helper';
import { Logger } from '$lib/utils';

const log = new Logger('middleware:houdini');
export const houdini = (async ({ event, resolve }) => {
	const { locals, cookies } = event;
	const { token } = (await locals.getSession()) ?? {};

	// FIXME: always return null with @auth/core/jwt's getToken
	// const token = await getToken({req: { cookies: event.cookies, headers: event.request.headers },secret: dynPriEnv.AUTH_SECRET,raw: true});
	// const token = await getToken({ req: request, secret: dynPriEnv.AUTH_SECRET, raw: true });
	// const token = await getToken(cookies);
	// const token = await getToken(cookies, true); // raw = true
	log.debug('in houdini middleware.......', token);
	if (token) setSession(event, { token });
	const response = await resolve(event);
	return response;
}) satisfies Handle;
