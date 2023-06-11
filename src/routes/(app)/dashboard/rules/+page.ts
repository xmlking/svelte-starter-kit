import { ruleSearchSchema } from '$lib/models/schema';
import { Logger } from '$lib/utils';
import { zfd } from '$lib/zodfd';
import { error } from '@sveltejs/kit';
import { ZodError } from 'zod';
import type { BeforeLoadEvent, SearchRulesAllVariables as Variables } from './$houdini';
const log = new Logger('rule.browser');

export const _SearchRulesAllVariables: Variables = ({ url }) => {
	const limit = parseInt(url.searchParams.get('limit') ?? '50');
	const offset = parseInt(url.searchParams.get('offset') ?? '0');
	const displayName = url.searchParams.get('displayName') ?? '';

	return {
		limit,
		offset,
		displayName: `%${displayName}%`
	};
};

const searchSchema = zfd.formData(ruleSearchSchema, { empty: 'strip' });

export function _houdini_beforeLoad({ url }: BeforeLoadEvent) {
	try {
		const { displayName, limit, offset } = searchSchema.parse(url.searchParams);
		log.debug(displayName, limit, offset);
	} catch (err) {
		if (err instanceof ZodError) {
			const { formErrors, fieldErrors } = err.flatten();
			return { formErrors, fieldErrors };
		} else {
			log.error('rule:search_houdini_beforeLoad:', err);
			throw error(500, err as Error);
		}
	}
}
