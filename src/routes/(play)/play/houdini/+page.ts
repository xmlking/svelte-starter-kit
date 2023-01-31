import { order_by } from '$houdini';
import { error } from '@sveltejs/kit';
import type { AfterLoadEvent, ListPolicies2Variables as Variables, OnErrorEvent } from './$houdini';

// TODO: no need for Variables function with v1.0.0
export const _ListPolicies2Variables: Variables = ({ url }) => {
	const limit = parseInt(url.searchParams.get('limit') ?? '');
	const offset = parseInt(url.searchParams.get('offset') ?? '');

	// jsut to show error handling
	if (offset > 100) throw error(400, 'offset must be between 1 and 100');

	const orderBy = [{ updated_at: order_by.desc_nulls_first }];
	return {
		limit,
		offset,
		orderBy
	};
};

export const _houdini_onError = ({ error, input }: OnErrorEvent) => {
	console.log(error, input);
	return {};
};

export const _houdini_afterLoad = ({ data }: AfterLoadEvent) => {
	const count = data.ListPolicies2.counts.aggregate?.count ?? 0;
	return {
		// ListPolicies2: data.ListPolicies2
		computedValue: count + 100
	};
};
