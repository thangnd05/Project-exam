import { PERMISSIONS as P, type PermissionCode } from './permissions';

/**
 * Quyền tối thiểu để mở từng trang admin — đúng quyền mà backend đòi ở API của trang đó,
 * để một vai trò tự tạo (không phải ADMIN) vẫn vào được đúng phần được giao.
 *
 * Dùng ở hai nơi: layout của nhóm (admin) để chặn truy cập, và AdminLayout để ẩn mục
 * sidebar mà người dùng không mở được. Thêm trang admin mới thì khai ở đây, nếu không
 * trang đó sẽ KHÔNG bị chặn quyền.
 */
export const adminPermissionByPath: Record<string, PermissionCode> = {
  '/admin/dashboard': P.DASHBOARD_VIEW,
  '/admin/users': P.USER_MANAGE,
  '/admin/roles': P.ROLE_MANAGE,
  '/admin/permissions': P.ROLE_MANAGE,
  '/admin/skills': P.SKILL_MANAGE,
  '/admin/scoring-conversion': P.SCORING_CONVERSION_MANAGE,
  '/admin/evaluations': P.EVALUATION_MANAGE,
  '/admin/exam-types': P.EXAM_TYPE_MANAGE,
  '/admin/exam-types/:examTypeId/layout': P.EXAM_TYPE_LAYOUT_MANAGE,
  '/admin/exam-categories': P.EXAM_CATEGORY_MANAGE,
  '/admin/exam-parts': P.EXAM_PART_MANAGE,
  '/admin/tests': P.TEST_MANAGE,
  '/admin/analytics': P.DASHBOARD_VIEW,
  '/admin/emails': P.EMAIL_MANAGE,
  '/admin/audit-logs': P.AUDIT_VIEW,
  '/admin/audit-login': P.AUDIT_VIEW,
  '/admin/categories': P.POST_CATEGORY_MANAGE,
  '/admin/posts': P.POST_MODERATE,
  '/admin/question-collections': P.QUESTION_COLLECTION_MANAGE,
  '/admin/tags': P.TAG_MANAGE,
  '/admin/recovery-resources': P.RECOVERY_RESOURCE_MANAGE,
  '/admin/milestones': P.MILESTONE_MANAGE,
  '/admin/coins': P.COIN_MANAGE,
  '/admin/quests': P.QUEST_MANAGE,
  '/admin/cosmetics': P.COSMETIC_MANAGE,
  '/admin/streak-recover': P.STREAK_CONFIG_MANAGE,
  '/admin/certificates': P.CERTIFICATE_MANAGE,
};

export default adminPermissionByPath;

/**
 * Tra quyền theo pathname THẬT của trình duyệt.
 *
 * Không dùng tra khoá trực tiếp được vì có route động: khoá là '/admin/exam-types/:examTypeId/layout'
 * còn pathname là '/admin/exam-types/abc-123/layout'. Tra thẳng sẽ trả undefined ⇒ trang đó
 * mất luôn lớp kiểm quyền, nên phải so khớp theo mẫu.
 */
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
