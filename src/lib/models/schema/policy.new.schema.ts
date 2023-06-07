import { z } from 'zod';

function checkValidStringDates(ctx: z.RefinementCtx, validFrom: string | undefined | null, validTo: string | undefined | null) {
	if (validFrom && validTo && new Date(validTo) < new Date(validFrom)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['validTo'],
			message: 'validTo should be after validFrom'
		});
	}
}

function checkValidDates(ctx: z.RefinementCtx, validFrom: Date | undefined | null, validTo: Date | undefined | null) {
	if (validFrom && validTo && validTo < validFrom) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['validTo'],
			message: 'validTo should be after validFrom'
		});
	}
}
function checkForMissingRule(ctx: z.RefinementCtx, ruleId: string | undefined | null, rule: any) {
	if (ruleId == null && rule == null) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['ruleId'],
			message: 'Rule is required'
		});
	}
}

export const policySchema = z
	.object({
		id: z.string().trim().uuid().optional(),
		// validFrom: z.coerce.date(),
		// validFrom: z.string().datetime({ offset: true }).nullish().catch(null),
		// validTo: z.string().datetime({ offset: true }).nullish().catch(null),
		validFrom: z.date().nullish(),
		validTo: z.date().nullish(),
		weight: z.coerce.number().min(0).max(2000).optional().default(1000),
		subjectDisplayName: z.string().trim().nonempty(),
		subjectId: z.string().trim().nonempty(),
		subjectSecondaryId: z.string().trim().nonempty(),
		subjectType: z.enum(['user', 'group', 'device', 'service_account', 'device_pool']).default('user'),
		active: z.boolean().optional().default(true),
		organization: z.string().trim(),
		ruleId: z.string().trim().uuid().optional(),
		rule: z.object({
			displayName: z.string().trim().min(4).max(256),
			description: z.string().trim().max(256).nullish(),
			tags: z.string().trim().min(2).array().nullish(),
			// annotations: z.preprocess(stringToJSON, z.record(z.string().trim().min(3), z.string().trim().min(3)).nullish()),
			// annotations: z.preprocess(stringToMap, z.map(z.string().trim().min(3), z.string().trim().min(3))).nullish(),
			annotations: z.string().trim().nullish(), // TODO: validate map string
			source: z.string().ip().nullish(),
			sourcePort: z.string().trim().nullish(),
			destination: z.string().ip().nullish(),
			destinationPort: z.string().trim().nullish(),
			protocol: z.enum(['Any', 'IP', 'ICMP', 'IGMP', 'TCP', 'UDP', 'IPV6', 'ICMPV6', 'RM']).default('Any'),
			action: z.enum(['permit', 'block']).default('block'),
			direction: z.enum(['egress', 'ingress']).default('egress'),
			appId: z.string().trim().nullish(),
			weight: z.coerce.number().min(0).max(2000).optional().default(1000),
			shared: z.boolean().optional().default(false)
		})
	})
	.superRefine((data, ctx) => checkValidDates(ctx, data.validFrom, data.validTo))
	.superRefine((data, ctx) => checkForMissingRule(ctx, data.ruleId, data.rule));

export type PolicySchema = typeof policySchema;
export type Policy = z.infer<typeof policySchema>;
export const policyKeys = policySchema.innerType().innerType().keyof().Enum;
