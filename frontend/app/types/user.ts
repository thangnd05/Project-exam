export interface UserResponse {
  id: string;
  userName?: string;
  fullName?: string;
  email?: string;
  roleId?: string;
  avatarUrl?: string;
  verified?: boolean;
  isPremium?: boolean;
  roleName?: string;
  permissions?: string[];
}

export interface UserUpsertRequest {
  userName: string;
  fullName?: string;
  email: string;
  password?: string;
  roleId?: string;
  verified?: boolean;
  isPremium?: boolean;
}

export interface ProfileTestStats {
  totalAttempts?: number;
  completedAttempts?: number;
  inProgressAttempts?: number;
  bestScore?: number;
  averageScore?: number;
  lastAttemptAt?: string;
}

export interface ProfileVocabularyStats {
  totalVocabulary?: number;
  learningVocabulary?: number;
  masteredVocabulary?: number;
}

export interface ProfileClassStats {
  approvedClassCount?: number;
  pendingClassCount?: number;
}

export interface ProfileOverviewResponse {
  userId: string;
  userName?: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  verified?: boolean;
  roleId?: string;
  roleName?: string;
  createdAt?: string;
  testStats?: ProfileTestStats;
  vocabularyStats?: ProfileVocabularyStats;
  classStats?: ProfileClassStats;
}

export interface ProfileDayActivity {
  date?: string;
  day: number;
  minutes: number;
}

export interface ProfileMonthTime {
  month?: string;
  minutes: number;
}

export interface ProfileActivityResponse {
  month?: string;
  days?: ProfileDayActivity[];
  totalMinutes: number;
  activeDays: number;
  year?: string;
  monthlyTime?: ProfileMonthTime[];
  availableMonths?: string[];
  availableYears?: string[];
}

export interface PermissionResponse {
  permissionId: string;
  code?: string;
  description?: string;
  groupName?: string;
}

export interface RoleResponse {
  roleId: string;
  roleName?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleRequest {
  roleName?: string;
  description?: string;
}

export interface RolePermissionsRequest {
  codes?: string[];
}
