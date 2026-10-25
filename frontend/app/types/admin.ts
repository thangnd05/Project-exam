export interface DashboardStats {
  totalUsers: number;
  totalTests: number;
  totalQuestions: number;
  totalClasses: number;
  totalExamsTaken: number;
  completedExams: number;
  totalExamTypes: number;
}

export interface DayHours {
  day?: string;
  hours?: number[];
}

export interface CountryTraffic {
  code?: string;
  name?: string;
  value: number;
}

export interface DashboardTraffic {
  visitsToday: number;
  heatmap?: DayHours[];
  topCountries?: CountryTraffic[];
}

export interface MonthPerformance {
  month?: string;
  tests: number;
  newUsers: number;
  visits: number;
  peakHour?: number;
}

export interface DashboardStatsResponse {
  stats?: DashboardStats;
  traffic?: DashboardTraffic;
}

export interface MonthlyPerformanceResponse {
  year: number;
  availableYears?: number[];
  months?: MonthPerformance[];
}

export interface TrafficLocationsResponse {
  month?: string;
  totalVisits: number;
  availableMonths?: string[];
  topCountries?: CountryTraffic[];
}

export interface TestUsageStat {
  testId: string;
  title?: string;
  attempts: number;
  users: number;
}

export interface AuditLogResponse {
  auditLogId: string;
  userId?: string;
  userName?: string;
  fullName?: string;
  httpMethod?: string;
  endpoint?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  success?: boolean;
  details?: string;
  createdAt?: string;
}
