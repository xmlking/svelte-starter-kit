import fetch from 'cross-fetch';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { endpoints } from '$lib/config';
import type { PageServerLoad, Action } from './$types';
import { createData, MEMBERS } from '$mocks/data/members';

export const load: PageServerLoad = async ({ url }: RequestEvent) => {
	const firstName = url.searchParams.get('firstName') ?? encodeURIComponent('*');
	const lastName = url.searchParams.get('lastName') ?? encodeURIComponent('*');
	const limit = url.searchParams.get('limit') ?? '50';

	try {
		// const resp = await fetch(`${endpoints.api}/accounts?firstName=${firstName}&lastName=${lastName}&limit=${limit}`, {
		// 	method: 'GET',
		// 	headers: { 'Content-Type': 'application/json' }
		// });
		// const response = await resp.json();
		// const members = response.data;

		const members = createData(100);
		return { members };
	} catch (err) {
		console.error(err);
		throw error(404, (err as Error).message);
	}
};
