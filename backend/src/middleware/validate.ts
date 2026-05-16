import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }
    req.body = result.data;
    next();
  };
}

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createRankingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be at most 100 characters'),
  subcategoryId: z.string().min(1, 'Subcategory is required'),
  periodType: z.enum(['Month', 'Year', 'BetweenMonths', 'BetweenYears']),
  periodStart: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  periodEnd: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  rankingDurationDays: z.number().int().min(1, 'Duration must be at least 1 day').max(365, 'Duration cannot exceed 365 days'),
  pointsPerRank: z.number().int().min(1).max(100).default(20),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const voteSchema = z.object({
  pointsVoted: z.number().int().min(1, 'Minimum 1 point').max(10, 'Maximum 10 points'),
  motivationText: z.string().min(20, 'Motivation text must be at least 20 characters'),
  proofLinks: z
    .array(
      z.string().url().refine(
        (url) => {
          const validHosts = ['youtube.com', 'www.youtube.com', 'youtu.be', 'vimeo.com', 'www.vimeo.com'];
          try {
            const hostname = new URL(url).hostname;
            return validHosts.includes(hostname);
          } catch {
            return false;
          }
        },
        { message: 'Proof links must be YouTube or Vimeo URLs' }
      )
    )
    .min(1, 'At least one proof link is required')
    .max(5, 'Maximum 5 proof links'),
  entityName: z.string().min(1, 'Entity name is required').max(100).optional(),
});

export const commentSchema = z.object({
  commentText: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment must be at most 500 characters'),
});

export const createCheckoutSchema = z.object({
  amountUsd: z.number().min(5, 'Minimum purchase is $5.00'),
});

export const engagementScoreSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  rankingId: z.string().min(1, 'Ranking ID is required'),
  motivationScore: z.number().int().min(0).max(100).optional(),
  finalScore: z.number().min(0).max(100).optional(),
});
