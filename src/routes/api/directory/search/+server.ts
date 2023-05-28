import { CachePolicy, SearchDevicesStore, SearchPoolsStore, order_by } from '$houdini';
import { DeviceError, NotFoundError } from '$lib/errors';
import type { Subject } from '$lib/models/types/subject';
import { Logger } from '$lib/utils';
import { json } from '@sveltejs/kit';
import type { GraphQLError } from 'graphql';
import type { RequestHandler } from './$types';

const fakeUsers = [
	{
		id: 'f26ea26d-400d-4fdd-aaa2-a0cc4e183667',
		displayName: 'Fake User 1',
		secondaryId: 'fake-user-1@user.com'
	},
	{
		id: '4efa08b7-3133-4f99-ad21-0ade7b3e14ed',
		displayName: 'Fake User 2',
		secondaryId: 'fake-user-2@user.com'
	},
	{
		id: '5c782443-6646-4562-97c5-3328b7506025',
		displayName: 'Fake User 3',
		secondaryId: 'fake-user-3@user.com'
	},
	{
		id: '746186f9-7a0f-4bb4-b3cc-e0a0d5bbab05',
		displayName: 'Fake User 4',
		secondaryId: 'fake-user-4@user.com'
	}
];
const fakeGroups = [
	{
		id: '1a287029-e970-44bb-aec5-c144eaac551d',
		displayName: 'Fake Group 1',
		secondaryId: 'fake-group-1@group.com'
	},
	{
		id: '2674a722-7e8b-4d8e-a7c3-4bf65c645ab9',
		displayName: 'Fake Group 2',
		secondaryId: 'fake-group-2@group.com'
	},
	{
		id: 'b4fbb586-fee3-4342-a7c2-13151a2b467f',
		displayName: 'Fake Group 3',
		secondaryId: 'fake-group-3@group.com'
	},
	{
		id: 'f493a151-7dc6-4e58-a700-89cfd9a772f1',
		displayName: 'Fake Group 4',
		secondaryId: 'fake-group-4@group.com'
	}
];

const log = new Logger('api:directory:search');
const searchDevicesStore = new SearchDevicesStore();
const searchPoolsStore = new SearchPoolsStore();
const limit = 10;
const orderBy = [{ updatedAt: order_by.desc_nulls_last }];

// GET /api/users/search?subType=subject_type_user&search=sumo
export const GET: RequestHandler = async (event) => {
	const { url } = event;
	const urlParams = new URLSearchParams(url.searchParams);
	const subType = urlParams.get('subType') ?? 'subject_type_unspecified';
	const search = urlParams.get('search') ?? '';
	// log.debug(subType, filter, search);
	const where = {
		displayName: { _like: `%${search}%` }
	};
	const variables = { where, limit, orderBy };
	let results: Subject[] = [];
	if (search == undefined) return json({ results });

	try {
		switch (subType) {
			case 'subject_type_user':
			case 'subject_type_service_account':
			case 'subject_type_unspecified':
				// TODO: implement hasura users table
				results = fakeUsers;
				break;
			case 'subject_type_group':
				// TODO: implement hasura groups table
				results = fakeGroups;
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
