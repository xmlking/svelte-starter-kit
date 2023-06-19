import { z } from 'zod';

export const poolSearchSchema = z.object({
	displayName: z.string().trim().min(3).max(100).optional(),
	limit: z.number().int().min(5).max(100).default(10),
	offset: z.number().int().min(0).default(0)
});
