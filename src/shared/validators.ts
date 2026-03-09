import { z } from 'zod';

// === Website Forms ===

export const auditRequestSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  company: z.string().min(2, 'Unternehmen muss mindestens 2 Zeichen haben').max(100),
  storeCount: z.string().min(1, 'Bitte Store-Anzahl angeben'),
  challenge: z.string().min(10, 'Bitte beschreiben Sie Ihre Herausforderung (min. 10 Zeichen)').max(1000),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
});

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  company: z.string().max(100).optional(),
  message: z.string().min(10, 'Nachricht muss mindestens 10 Zeichen haben').max(2000),
});

// === Auth ===

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// === Courses (Train) ===

export const courseCreateSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  estimatedMins: z.number().int().min(1).max(600).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const moduleCreateSchema = z.object({
  title: z.string().min(2).max(100),
  order: z.number().int().min(0),
});

export const lessonCreateSchema = z.object({
  title: z.string().min(2).max(100),
  type: z.enum(['VIDEO', 'TEXT', 'QUIZ', 'CHECKLIST']),
  content: z.record(z.unknown()),
  order: z.number().int().min(0),
  durationMins: z.number().int().min(1).max(120).optional(),
});

// === KPI (Pulse) ===

export const kpiEntrySchema = z.object({
  storeId: z.string().cuid(),
  date: z.string().date(),
  revenue: z.number().min(0),
  transactions: z.number().int().min(0),
  footfall: z.number().int().min(0).optional(),
  unitsSold: z.number().int().min(0).optional(),
  staffHours: z.number().min(0).optional(),
});

// === Tenant Management (Dashboard) ===

export const tenantCreateSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  slug: z
    .string()
    .min(2, 'Slug muss mindestens 2 Zeichen haben')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten'),
  contactEmail: z.string().email('Bitte gültige E-Mail-Adresse eingeben').optional().or(z.literal('')),
  contactName: z.string().max(100).optional().or(z.literal('')),
  contactPhone: z.string().max(30).optional().or(z.literal('')),
  maxUsers: z.number().int().min(1).max(10000).optional(),
});

export const tenantUpdateSchema = tenantCreateSchema.partial();

// === Store Management ===

export const storeCreateSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  city: z.string().max(100).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
});

export const storeUpdateSchema = storeCreateSchema.omit({ tenantId: true }).partial();

export const storeToolAssignSchema = z.object({
  storeId: z.string().min(1),
  toolId: z.string().min(1),
});

// === User Management ===

const userRoleEnum = z.enum([
  'kore_admin',
  'tenant_admin',
  'regional_manager',
  'multisite_manager',
  'store_manager',
  'learner',
]);

export const userCreateSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  email: z.string().email('Bitte gültige E-Mail-Adresse eingeben'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
  role: userRoleEnum,
  tenantId: z.string().min(1).optional(), // Required für alle außer kore_admin
  storeIds: z.array(z.string().min(1)).optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: userRoleEnum.optional(),
  isActive: z.boolean().optional(),
  storeIds: z.array(z.string().min(1)).optional(),
});

export const userStoreAssignSchema = z.object({
  storeIds: z.array(z.string().min(1)),
});

export const storeUserAssignSchema = z.object({
  userIds: z.array(z.string().min(1)),
});

// ============================================================
// Store Excellence Audit — Validators
// ============================================================

export const auditCriterionSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
  photoRequired: z.boolean().optional(),
});

export const auditCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  weight: z.number().min(0).max(100).optional(),
  criteria: z.array(auditCriterionSchema).optional(),
});

export const auditTemplateCreateSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  description: z.string().max(500).optional(),
  categories: z.array(auditCategorySchema).optional(),
});

export const auditTemplateUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const auditSessionCreateSchema = z.object({
  storeId: z.string().min(1, 'Store muss ausgewählt werden'),
  templateId: z.string().min(1, 'Template muss ausgewählt werden'),
  storeLocation: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const auditResponseSchema = z.object({
  scorePercent: z.number().int().min(0).max(100).optional().nullable(),
  passed: z.boolean().optional().nullable(),
  comment: z.string().max(1000).optional().nullable(),
});

// === Type Exports ===

export type AuditRequestInput = z.infer<typeof auditRequestSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type KPIEntryInput = z.infer<typeof kpiEntrySchema>;
export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
export type StoreCreateInput = z.infer<typeof storeCreateSchema>;
export type StoreUpdateInput = z.infer<typeof storeUpdateSchema>;
export type StoreToolAssignInput = z.infer<typeof storeToolAssignSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserStoreAssignInput = z.infer<typeof userStoreAssignSchema>;
export type StoreUserAssignInput = z.infer<typeof storeUserAssignSchema>;
export type AuditTemplateCreateInput = z.infer<typeof auditTemplateCreateSchema>;
export type AuditTemplateUpdateInput = z.infer<typeof auditTemplateUpdateSchema>;
export type AuditSessionCreateInput = z.infer<typeof auditSessionCreateSchema>;
export type AuditResponseInput = z.infer<typeof auditResponseSchema>;

// === Audit Scoring ===

export interface ScoredCategory {
  categoryId: string;
  categoryName: string;
  weight: number;
  criteriaCount: number;
  scoredCount: number;
  averagePercent: number;
  passCount: number;
  failCount: number;
  passRate: number;
}

export interface AuditScoreResult {
  overallScore: number;
  overallPassRate: number;
  categories: ScoredCategory[];
}

interface CategoryInput {
  id: string;
  name: string;
  weight: number;
  criteria: Array<{
    id: string;
    isRequired: boolean;
  }>;
}

interface ResponseInput {
  criterionId: string;
  scorePercent: number | null;
  passed: boolean | null;
}

/**
 * Berechnet den gewichteten Gesamtscore eines Audits.
 * Jede Kategorie hat ein Gewicht (weight), der Gesamtscore ist der gewichtete Durchschnitt.
 */
export function calculateAuditScore(
  categories: CategoryInput[],
  responses: ResponseInput[],
): AuditScoreResult {
  const responseMap = new Map(responses.map((r) => [r.criterionId, r]));

  let totalWeight = 0;
  let weightedScoreSum = 0;
  let totalPassed = 0;
  let totalEvaluated = 0;

  const scoredCategories: ScoredCategory[] = categories.map((cat) => {
    let catScoreSum = 0;
    let catScored = 0;
    let catPassed = 0;
    let catFailed = 0;

    for (const crit of cat.criteria) {
      const resp = responseMap.get(crit.id);
      if (resp) {
        if (resp.scorePercent !== null && resp.scorePercent !== undefined) {
          catScoreSum += resp.scorePercent;
          catScored++;
        }
        if (resp.passed === true) {
          catPassed++;
          totalPassed++;
          totalEvaluated++;
        } else if (resp.passed === false) {
          catFailed++;
          totalEvaluated++;
        }
      }
    }

    const avgPercent = catScored > 0 ? catScoreSum / catScored : 0;
    const passRate =
      catPassed + catFailed > 0 ? (catPassed / (catPassed + catFailed)) * 100 : 0;

    totalWeight += cat.weight;
    weightedScoreSum += avgPercent * cat.weight;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      weight: cat.weight,
      criteriaCount: cat.criteria.length,
      scoredCount: catScored,
      averagePercent: Math.round(avgPercent * 10) / 10,
      passCount: catPassed,
      failCount: catFailed,
      passRate: Math.round(passRate * 10) / 10,
    };
  });

  const overallScore =
    totalWeight > 0 ? Math.round((weightedScoreSum / totalWeight) * 10) / 10 : 0;
  const overallPassRate =
    totalEvaluated > 0 ? Math.round((totalPassed / totalEvaluated) * 1000) / 10 : 0;

  return { overallScore, overallPassRate, categories: scoredCategories };
}
