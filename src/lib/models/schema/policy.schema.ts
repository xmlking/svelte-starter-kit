import { emptyToNull } from '$lib/utils/zod.utils';
import { z } from 'zod';

function checkValidDates(ctx: z.RefinementCtx, validFrom: string | undefined | null, validTo: string | undefined | null) {
	if (validFrom && validTo && new Date(validTo) < new Date(validFrom)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['validTo'],
			message: 'validTo should be after validFrom'
		});
	}
}

export const policyClientSchema = z
	.object({
		displayName: z.string().trim().min(4).max(256),
		description: z.string().trim().max(256).nullish(),
		// tags: z.preprocess(stringToArray, z.array(z.string().trim().min(2)).optional()),
		tags: z.string().trim().min(2).array().nullish(),
		// annotations: z.preprocess(stringToJSON, z.record(z.string().trim().min(3), z.string().trim().min(3)).nullish()),
		// annotations: z.preprocess(stringToMap, z.map(z.string().trim().min(3), z.string().trim().min(3))).nullish(),
		annotations: z.string().trim().nullish(), // TODO: validate map string
		disabled: z.boolean().optional().default(false),
		template: z.boolean().optional().default(false),
		// validFrom: z.string().datetime({ offset: true }).nullish().catch(null),
		// validTo: z.string().datetime({ offset: true }).nullish().catch(null),
		validFrom: z.preprocess(emptyToNull, z.string().datetime({ offset: true }).nullish()),
		validTo: z.preprocess(emptyToNull, z.string().datetime({ offset: true }).nullish()),
		sourceAddress: z.string().ip().nullish(),
		sourcePort: z.string().trim().nullish(),
		destinationAddress: z.string().ip().nullish(),
		destinationPort: z.string().trim().nullish(),
		protocol: z.enum(['Any', 'IP', 'ICMP', 'IGMP', 'TCP', 'UDP', 'IPV6', 'ICMPV6', 'RM']),
		action: z.enum(['action_permit', 'action_block']),
		direction: z.enum(['direction_egress', 'direction_ingress']),
		appId: z.string().trim().nullish(),
		weight: z.number().min(0).max(2000).optional().default(1000)
	})
	.superRefine((data, ctx) => checkValidDates(ctx, data.validFrom, data.validTo));

export const policyBaseSchema = z.object({
	displayName: z.string().trim().min(4).max(256),
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
	validFrom: z.string().datetime({ offset: true }).nullish().catch(null),
	// validFrom: z.string().datetime({ offset: true }).nullish()
	// 	.catch((ctx) => {
	// 		ctx.error; // ZodError
	// 		return null;
	// 	}),
	validTo: z.string().datetime({ offset: true }).nullish().catch(null),
	sourceAddress: z.string().ip().nullish(),
	sourcePort: z.string().trim().nullish(),
	destinationAddress: z.string().ip().nullish(),
	destinationPort: z.string().trim().nullish(),
	protocol: z.enum(['Any', 'IP', 'ICMP', 'IGMP', 'TCP', 'UDP', 'IPV6', 'ICMPV6', 'RM']),
	action: z.enum(['action_permit', 'action_block']),
	direction: z.enum(['direction_egress', 'direction_ingress']),
	appId: z.string().trim().nullish(),
	weight: z.coerce.number().min(0).max(2000).catch(1000)
});

export const policyCreateBaseSchema = policyBaseSchema.extend({
	subjectDisplayName: z.string().trim(),
	subjectId: z.string().trim(),
	subjectSecondaryId: z.string().trim(),
	subjectType: z.enum([
		'subject_type_user',
		'subject_type_group',
		'subject_type_device',
		'subject_type_service_account',
		'subject_type_device_pool'
	]),
	template: z.coerce.boolean().optional().default(false)
});

/**
 * system generated data
 */
const policyExtraSchema = z.object({
	createdAt: z.string().datetime({ offset: true }),
	createdBy: z.string(),
	updatedAt: z.string().datetime({ offset: true }),
	updatedBy: z.string(),
	deletedAt: z.string().datetime({ offset: true }).nullish()
});

/**
 * for search time validation
 */
export const policySearchSchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(10),
	offset: z.coerce.number().min(0).default(0),
	// TODO use subject_type_enum
	subjectType: z
		.enum([
			'subject_type_user',
			'subject_type_group',
			'subject_type_device',
			'subject_type_service_account',
			'subject_type_device_pool'
		])
		.optional(),
	subjectId: z.string().trim().uuid().optional()
});

/**
 * for update time validation
 */
export const policyUpdateSchema = policyBaseSchema.superRefine((data, ctx) => checkValidDates(ctx, data.validFrom, data.validTo));

/**
 * for create time validation
 */
export const policyCreateSchema = policyCreateBaseSchema.superRefine((data, ctx) => checkValidDates(ctx, data.validFrom, data.validTo));

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
