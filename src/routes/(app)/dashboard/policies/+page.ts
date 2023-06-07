import { order_by, type subject_type_enum$options } from '$houdini';
import { policySearchSchema } from '$lib/models/schema';
import { Logger } from '$lib/utils';
import { zfd } from '$lib/zodfd';
import { error } from '@sveltejs/kit';
import { ZodError } from 'zod';
import type { BeforeLoadEvent, SearchPoliciesVariables as Variables } from './$houdini';

const log = new Logger('policies.browser');

export const _SearchPoliciesVariables: Variables = ({ url }) => {
	const limit = parseInt(url.searchParams.get('limit') ?? '50');
	const offset = parseInt(url.searchParams.get('offset') ?? '0');
	const subjectId = url.searchParams.get('subjectId') ?? undefined;
	const subjectType: subject_type_enum$options = url.searchParams.get('subjectType') ?? undefined;

	const orderBy = [{ updatedAt: order_by.desc_nulls_first }];
	const where = {
		...(subjectType ? { subjectType: { _eq: subjectType } } : {}),
		...(subjectId ? { subjectId: { _eq: subjectId } } : {})
	};

	return {
		where,
		limit,
		offset,
		orderBy
	};
};

const searchSchema = zfd.formData(policySearchSchema, { empty: 'strip' });

export function _houdini_beforeLoad({ url }: BeforeLoadEvent) {
	try {
		const { subjectId, subjectType, limit, offset } = searchSchema.parse(url.searchParams);
		log.debug(subjectId, subjectType, limit, offset);
	} catch (err) {
		if (err instanceof ZodError) {
			const { formErrors, fieldErrors } = err.flatten();
			return { formErrors, fieldErrors };
		} else {
			log.error('pool:search_houdini_beforeLoad:', err);
			throw error(500, err as Error);
		}
	}
}
