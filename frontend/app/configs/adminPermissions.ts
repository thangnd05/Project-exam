import { PermissionCode } from '@/app/enums';

export const adminPermissionByPath: Record<string, PermissionCode> = {
  '/admin/dashboard': PermissionCode.DASHBOARD_VIEW,
  '/admin/users': PermissionCode.USER_MANAGE,
  '/admin/roles': PermissionCode.ROLE_MANAGE,
  '/admin/permissions': PermissionCode.ROLE_MANAGE,
  '/admin/skills': PermissionCode.SKILL_MANAGE,
  '/admin/scoring-conversion': PermissionCode.SCORING_CONVERSION_MANAGE,
  '/admin/evaluations': PermissionCode.EVALUATION_MANAGE,
  '/admin/exam-types': PermissionCode.EXAM_TYPE_MANAGE,
  '/admin/exam-types/:examTypeId/layout': PermissionCode.EXAM_TYPE_LAYOUT_MANAGE,
  '/admin/exam-categories': PermissionCode.EXAM_CATEGORY_MANAGE,
  '/admin/exam-parts': PermissionCode.EXAM_PART_MANAGE,
  '/admin/tests': PermissionCode.TEST_MANAGE,
  '/admin/analytics': PermissionCode.DASHBOARD_VIEW,
  '/admin/emails': PermissionCode.EMAIL_MANAGE,
  '/admin/audit-logs': PermissionCode.AUDIT_VIEW,
  '/admin/audit-login': PermissionCode.AUDIT_VIEW,
  '/admin/categories': PermissionCode.POST_CATEGORY_MANAGE,
  '/admin/posts': PermissionCode.POST_MODERATE,
  '/admin/questions': PermissionCode.QUESTION_MANAGE,
  '/admin/question-collections': PermissionCode.QUESTION_COLLECTION_MANAGE,
  '/admin/tags': PermissionCode.TAG_MANAGE,
  '/admin/recovery-resources': PermissionCode.RECOVERY_RESOURCE_MANAGE,
  '/admin/milestones': PermissionCode.MILESTONE_MANAGE,
  '/admin/coins': PermissionCode.COIN_MANAGE,
  '/admin/quests': PermissionCode.QUEST_MANAGE,
  '/admin/cosmetics': PermissionCode.COSMETIC_MANAGE,
  '/admin/streak-recover': PermissionCode.STREAK_CONFIG_MANAGE,
  '/admin/certificates': PermissionCode.CERTIFICATE_MANAGE,
};

export default adminPermissionByPath;

export function findAdminPermission(pathname: string | null | undefined): PermissionCode | undefined {
  if (!pathname) return undefined;
  const direct = adminPermissionByPath[pathname];
  if (direct) return direct;

  for (const [pattern, permission] of Object.entries(adminPermissionByPath)) {
    if (!pattern.includes(':')) continue;
    const regex = new RegExp(
      `^${pattern.replace(/:[^/]+/g, '[^/]+').replace(/\//g, '\\/')}$`,
    );
    if (regex.test(pathname)) return permission;
  }
  return undefined;
}
