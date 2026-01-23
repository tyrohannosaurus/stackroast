import { z } from "zod";

/**
 * Input validation schemas using Zod
 * Provides comprehensive validation for user inputs across the application
 */

// =====================================================
// REGEX PATTERNS
// =====================================================

// Detects HTML tags (basic XSS prevention)
const HTML_TAG_REGEX = /<[^>]*>/g;

// Detects script tags (XSS prevention)
const SCRIPT_TAG_REGEX = /<script[^>]*>.*?<\/script>/gi;

// Valid slug format (lowercase alphanumeric and hyphens)
const SLUG_REGEX = /^[a-z0-9-]+$/;

// Email validation (more strict than basic)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// GitHub username/repo format
const GITHUB_NAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

// Valid URL format
const URL_REGEX = /^https?:\/\/.+/;

// =====================================================
// CUSTOM VALIDATORS
// =====================================================

const noHtmlTags = (message = "HTML tags are not allowed") =>
  z.string().refine((val) => !HTML_TAG_REGEX.test(val), { message });

const noScriptTags = (message = "Script tags are not allowed") =>
  z.string().refine((val) => !SCRIPT_TAG_REGEX.test(val), { message });

const validSlug = () =>
  z
    .string()
    .min(1, "Slug cannot be empty")
    .max(200, "Slug must be less than 200 characters")
    .regex(SLUG_REGEX, "Slug can only contain lowercase letters, numbers, and hyphens")
    .refine((val) => val === val.toLowerCase(), { message: "Slug must be lowercase" });

const sanitizedString = (minLength = 1, maxLength = 1000) =>
  z
    .string()
    .min(minLength, `Must be at least ${minLength} character(s)`)
    .max(maxLength, `Must be less than ${maxLength} characters`)
    .transform((val) => val.trim())
    .refine((val) => !HTML_TAG_REGEX.test(val), { message: "HTML tags are not allowed" })
    .refine((val) => !SCRIPT_TAG_REGEX.test(val), { message: "Script tags are not allowed" });

// =====================================================
// STACK SCHEMAS
// =====================================================

export const StackNameSchema = z
  .string()
  .min(1, "Stack name is required")
  .max(100, "Stack name must be less than 100 characters")
  .transform((val) => val.trim())
  .refine((val) => !HTML_TAG_REGEX.test(val), {
    message: "Stack name cannot contain HTML tags",
  })
  .refine((val) => val.length > 0, { message: "Stack name cannot be empty" });

export const StackDescriptionSchema = z
  .string()
  .max(1000, "Description must be less than 1000 characters")
  .optional()
  .transform((val) => val?.trim() || "")
  .refine((val) => !SCRIPT_TAG_REGEX.test(val), {
    message: "Description cannot contain script tags",
  });

export const StackSlugSchema = validSlug();

export const CreateStackSchema = z.object({
  name: StackNameSchema,
  description: StackDescriptionSchema,
  slug: StackSlugSchema.optional(),
  isPublic: z.boolean().default(true),
  selectedTools: z
    .array(
      z.object({
        id: z.string().uuid("Invalid tool ID"),
        name: z.string(),
        category: z.string().optional(),
      })
    )
    .min(1, "At least one tool must be selected")
    .max(50, "Cannot add more than 50 tools to a stack"),
});

export type CreateStackInput = z.infer<typeof CreateStackSchema>;

// =====================================================
// COMMENT SCHEMAS
// =====================================================

export const CommentContentSchema = sanitizedString(1, 2000);

export const CreateCommentSchema = z.object({
  roastId: z.string().uuid("Invalid roast ID"),
  content: CommentContentSchema,
  parentId: z.string().uuid().optional(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

// =====================================================
// VOTE SCHEMAS
// =====================================================

export const VoteValueSchema = z.union([z.literal(1), z.literal(-1)], {
  errorMap: () => ({ message: "Vote value must be 1 or -1" }),
});

export const CreateVoteSchema = z.object({
  roastId: z.string().uuid("Invalid roast ID"),
  voteValue: VoteValueSchema,
});

export type CreateVoteInput = z.infer<typeof CreateVoteSchema>;

// =====================================================
// USER PROFILE SCHEMAS
// =====================================================

export const UsernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be less than 30 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
  .transform((val) => val.trim());

export const BioSchema = sanitizedString(0, 500);

export const UpdateProfileSchema = z.object({
  username: UsernameSchema.optional(),
  bio: BioSchema.optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// =====================================================
// EMAIL SCHEMAS
// =====================================================

export const EmailSchema = z
  .string()
  .email("Invalid email address")
  .regex(EMAIL_REGEX, "Invalid email format")
  .max(255, "Email must be less than 255 characters");

export const SendReminderEmailSchema = z.object({
  email: EmailSchema,
  stackName: StackNameSchema,
  stackUrl: z.string().url("Invalid stack URL"),
});

export type SendReminderEmailInput = z.infer<typeof SendReminderEmailSchema>;

// =====================================================
// GITHUB SCHEMAS
// =====================================================

export const GitHubUrlSchema = z
  .string()
  .url("Invalid URL")
  .regex(/^https?:\/\/(www\.)?github\.com\/.+/, "Must be a valid GitHub URL");

export const GitHubRepoSchema = z.object({
  owner: z
    .string()
    .min(1)
    .max(39)
    .regex(GITHUB_NAME_REGEX, "Invalid GitHub username format"),
  repo: z
    .string()
    .min(1)
    .max(100)
    .regex(GITHUB_NAME_REGEX, "Invalid GitHub repository name format"),
});

export type GitHubRepo = z.infer<typeof GitHubRepoSchema>;

// =====================================================
// AI ROAST SCHEMAS
// =====================================================

const ScoreSchema = z
  .number()
  .min(0, "Score must be between 0 and 10")
  .max(10, "Score must be between 0 and 10");

export const AIRoastSchema = z.object({
  stackId: z.string().uuid("Invalid stack ID"),
  roastText: sanitizedString(10, 10000),
  originalityScore: ScoreSchema.optional(),
  practicalityScore: ScoreSchema.optional(),
  hypeScore: ScoreSchema.optional(),
  overallScore: ScoreSchema.optional(),
});

export type AIRoastInput = z.infer<typeof AIRoastSchema>;

// =====================================================
// SEARCH AND FILTER SCHEMAS
// =====================================================

export const SearchQuerySchema = z
  .string()
  .max(100, "Search query must be less than 100 characters")
  .transform((val) => val.trim())
  .refine((val) => !SCRIPT_TAG_REGEX.test(val), {
    message: "Invalid search query",
  });

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).optional(),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

export const SortBySchema = z.enum(["newest", "oldest", "top", "controversial"]).default("newest");

export type SortBy = z.infer<typeof SortBySchema>;

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Sanitize a string by removing HTML tags and trimming
 */
export function sanitizeString(input: string): string {
  return input.replace(HTML_TAG_REGEX, "").replace(SCRIPT_TAG_REGEX, "").trim();
}

/**
 * Validate and sanitize a stack name
 */
export function validateStackName(name: string): { valid: boolean; error?: string; value?: string } {
  try {
    const validated = StackNameSchema.parse(name);
    return { valid: true, value: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: "Invalid stack name" };
  }
}

/**
 * Validate email address
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  try {
    EmailSchema.parse(email);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: "Invalid email" };
  }
}

/**
 * Parse and validate GitHub URL
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    GitHubUrlSchema.parse(url);
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;

    const [, owner, repo] = match;
    const repoName = repo.replace(/\.git$/, ""); // Remove .git suffix if present

    // Block path traversal attempts
    if (owner.includes('..') || repoName.includes('..') ||
        owner.includes('/') || repoName.includes('/')) {
      return null;
    }

    // Validate parsed values
    const validated = GitHubRepoSchema.parse({ owner, repo: repoName });
    return validated;
  } catch {
    return null;
  }
}

/**
 * Generate a URL-safe slug from a string
 */
export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Validate that a string contains no XSS attempts
 */
export function isXssSafe(input: string): boolean {
  return !HTML_TAG_REGEX.test(input) && !SCRIPT_TAG_REGEX.test(input);
}

/**
 * Type guard to check if error is ZodError
 */
export function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}

/**
 * Format Zod errors into a user-friendly message
 */
export function formatZodError(error: z.ZodError): string {
  return error.errors.map((err) => err.message).join(", ");
}
