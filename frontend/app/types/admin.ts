export interface DashboardStats {
  totalUsers: number;
  totalTests: number;
  totalQuestions: number;
  totalClasses: number;
  totalExamsTaken: number;
  completedExams: number;
  totalExamTypes: number;
}

export interface NameValue {
  name?: string;
  value: number;
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
  rate: number;
  newUsers: number;
  visits: number;
  peakHour?: number;
}

export interface DashboardStatsResponse {
  stats?: DashboardStats;
  traffic?: DashboardTraffic;
  statusDistribution?: NameValue[];
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

export interface ContentTestStat {
  testId: string;
  title?: string;
  attempts: number;
  completed: number;
  completionRate: number;
}

export interface ContentInsightsResponse {
  topTests?: ContentTestStat[];
  topPracticeTests?: ContentTestStat[];
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

export interface VisitRequest {
  path?: string;
}
