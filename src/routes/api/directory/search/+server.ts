import { CachePolicy, SearchDevicesStore, SearchPoolsStore, order_by } from '$houdini';
import { DeviceError, NotFoundError } from '$lib/errors';
import type { Subject } from '$lib/models/types/subject';
import { Logger } from '$lib/utils';
import { json } from '@sveltejs/kit';
import type { GraphQLError } from 'graphql';
import type { RequestHandler } from './$types';

const log = new Logger('api:directory:search');
const searchDevicesStore = new SearchDevicesStore();
const searchPoolsStore = new SearchPoolsStore();
const limit = 10;
const orderBy = [{ updatedAt: order_by.desc_nulls_last }];

// GET /api/users/search?subType=0filter=
export const GET: RequestHandler = async (event) => {
	const { url } = event;
	const urlParams = new URLSearchParams(url.searchParams);
	const subType = urlParams.get('subType') ?? 'subject_type_unspecified';
	const filter = urlParams.get('filter');
	const search = urlParams.get('search') ?? '';
	// log.debug(subType, filter, search);
	const where = {
		displayName: { _like: `%${search.slice(12)}%` }
	};
	const variables = { where, limit, orderBy };
	let results: Subject[] = [];
	if (filter == undefined && search == undefined) return json({ results });

	try {
		switch (subType) {
			case 'subject_type_user':
			case 'subject_type_service_account':
			case 'subject_type_unspecified':
				results = [];
				break;
			case 'subject_type_group':
				results = [];
				break;
			case 'subject_type_device':
				const { errors: deviceErrors, data: deviceData } = await searchDevicesStore.fetch({
					event,
					blocking: true,
					policy: CachePolicy.CacheAndNetwork,
					metadata: { backendToken: 'token from TokenVault', useRole: 'manager', logResult: true },
					variables
				});
				if (deviceErrors) throw new DeviceError('SEARCH_DEVICE_ERROR', 'list devices api error', deviceErrors[0] as GraphQLError);
				if (!deviceData) throw new NotFoundError('devices data is null');
				results = deviceData.devices.map((obj) => {
					return {
						id: obj.id,
						displayName: obj.displayName,
						secondaryId: obj.displayName
					};
				});
				break;
			case 'subject_type_device_pool':
				const { errors: poolErrors, data: poolData } = await searchPoolsStore.fetch({
					event,
					blocking: true,
					policy: CachePolicy.CacheAndNetwork,
					metadata: { backendToken: 'token from TokenVault', useRole: 'manager', logResult: true },
					variables
				});
				if (poolErrors) throw new DeviceError('SEARCH_DEVICE_ERROR', 'list devices api error', poolErrors[0] as GraphQLError);
				if (!poolData) throw new NotFoundError('devices data is null');
				results = poolData.pools.map((obj) => {
					return {
						id: obj.id,
						displayName: obj.displayName,
						secondaryId: obj.displayName
					};
				});
				break;
			default:
				throw new Error(`Unknown Subject Type: ${subType}`, { cause: Error(`${subType}`) });
		}
		log.debug('results....', results);
		return json({ results });
	} catch (error) {
		log.error(error);
		return json(
			{ error },
			{
				status: 404
			}
		);
	}
};
