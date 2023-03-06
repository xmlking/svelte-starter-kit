import { emptyToNull } from '$lib/utils/zod.utils';
import { z } from 'zod';

function checkValidDates(ctx: z.RefinementCtx, valid_from: string | undefined | null, valid_to: string | undefined | null) {
	if (valid_from && valid_to && new Date(valid_to) < new Date(valid_from)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['valid_to'],
			message: 'valid_to should be after valid_from'
		});
	}
}

export const policyClientSchema = z
	.object({
		display_name: z.string().trim().min(4).max(256),
		description: z.string().trim().max(256).nullish(),
		// tags: z.preprocess(stringToArray, z.array(z.string().trim().min(2)).optional()),
		tags: z.string().trim().min(2).array().nullish(),
		// annotations: z.preprocess(stringToJSON, z.record(z.string().trim().min(3), z.string().trim().min(3)).nullish()),
		// annotations: z.preprocess(stringToMap, z.map(z.string().trim().min(3), z.string().trim().min(3))).nullish(),
		annotations: z.string().trim().nullish(), // TODO: validate map string
		disabled: z.boolean().optional().default(false),
		template: z.boolean().optional().default(false),
		// valid_from: z.string().datetime({ offset: true }).nullish().catch(null),
		// valid_to: z.string().datetime({ offset: true }).nullish().catch(null),
		valid_from: z.preprocess(emptyToNull, z.string().datetime({ offset: true }).nullish()),
		valid_to: z.preprocess(emptyToNull, z.string().datetime({ offset: true }).nullish()),
		source_address: z.string().ip().nullish(),
		source_port: z.string().trim().nullish(),
		destination_address: z.string().ip().nullish(),
		destination_port: z.string().trim().nullish(),
		protocol: z.enum(['Any', 'IP', 'ICMP', 'IGMP', 'TCP', 'UDP', 'IPV6', 'ICMPV6', 'RM']),
		action: z.enum(['action_permit', 'action_block']),
		direction: z.enum(['direction_egress', 'direction_ingress']),
		app_id: z.string().trim().nullish(),
		weight: z.number().min(0).max(2000).optional().default(1000)
	})
	.superRefine((data, ctx) => checkValidDates(ctx, data.valid_from, data.valid_to));

export const policyBaseSchema = z.object({
	display_name: z.string().trim().min(4).max(256),
	description: z.string().trim().max(256).nullish(),
	// TODO: validate comma separated string /^\w(\s*,?\s*\w)*$/
	tags: z
		.string()
		.trim()
		.regex(/^\w+(,\w+)*$/)
		.nullish(),
	// annotations: z.preprocess(stringToJSON, z.record(z.string().trim().min(3), z.string().trim().min(3)).nullish()),
	// annotations: z.preprocess(stringToMap, z.map(z.string().trim().min(3), z.string().trim().min(3)).nullish()),
	annotations: z.string().trim().nullish(), // TODO: validate map string
	disabled: z.coerce.boolean().optional().default(false),
	valid_from: z.string().datetime({ offset: true }).nullish().catch(null),
	// valid_from: z.string().datetime({ offset: true }).nullish()
	// 	.catch((ctx) => {
	// 		ctx.error; // ZodError
	// 		return null;
	// 	}),
	valid_to: z.string().datetime({ offset: true }).nullish().catch(null),
	source_address: z.string().ip().nullish(),
	source_port: z.string().trim().nullish(),
	destination_address: z.string().ip().nullish(),
	destination_port: z.string().trim().nullish(),
	protocol: z.enum(['Any', 'IP', 'ICMP', 'IGMP', 'TCP', 'UDP', 'IPV6', 'ICMPV6', 'RM']),
	action: z.enum(['action_permit', 'action_block']),
	direction: z.enum(['direction_egress', 'direction_ingress']),
	app_id: z.string().trim().nullish(),
	weight: z.coerce.number().min(0).max(2000).catch(1000)
});

export const policyCreateBaseSchema = policyBaseSchema.extend({
	id: z.string().trim().uuid(),
	subject_display_name: z.string().trim(),
	subject_id: z.string().trim(),
	subject_secondary_id: z.string().trim(),
	subject_type: z.enum(['subject_type_user', 'subject_type_group', 'subject_type_device', 'subject_type_service_account']),
	template: z.coerce.boolean().optional().default(false)
});

/**
 * system generated data
 */
const policyExtraSchema = z.object({
	created_at: z.string().datetime({ offset: true }),
	created_by: z.string(),
	updated_at: z.string().datetime({ offset: true }),
	updated_by: z.string(),
	deleted_at: z.string().datetime({ offset: true }).nullish()
});

/**
 * for search time validation
 */
export const policySearchSchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(10),
	offset: z.coerce.number().min(0).default(0),
	subject_type: z.enum(['subject_type_user', 'subject_type_group', 'subject_type_device', 'subject_type_service_account']).optional(),
	display_name: z.string().trim().min(4).max(256).optional()
});

/**
 * for update time validation
 */
export const policyUpdateSchema = policyBaseSchema.superRefine((data, ctx) => checkValidDates(ctx, data.valid_from, data.valid_to));

/**
 * for create time validation
 */
export const policyCreateSchema = policyCreateBaseSchema.superRefine((data, ctx) => checkValidDates(ctx, data.valid_from, data.valid_to));

/**
 * for delete time validation
 */
export const policyDeleteSchema = z.object({
	id: z.string().trim().uuid()
});

/**
 * for API return value validation and to extract the inferred type
 */
export const policySchema = policyCreateBaseSchema.merge(policyExtraSchema);

export type Policy = z.infer<typeof policySchema>;
