// Admin Module - Export all components and pages
export { default as AdminLayout } from './layouts/AdminLayout';
export { default as AdminDashboard } from './pages/Dashboard';
export { default as UsersManagement } from './pages/Users';
export { default as RolesManagement } from './pages/Roles';
export { default as SkillsManagement } from './pages/Skills';
export { default as ScoringConversionManagement } from './pages/ScoringConversion';
export { default as EvaluationsManagement } from './pages/Evaluations';
export { default as ExamTypesManagement } from './pages/ExamTypes';
export { default as ExamPartsManagement } from './pages/ExamParts';
export { default as QuestionsManagement } from './pages/Questions';
export { default as VocabularyManagement } from './pages/Vocabulary';
export { default as AnalyticsPage } from './pages/Analytics';
export { default as AuditLogs } from './pages/AuditLogs';

// Export fake data for use in components
export * from './data/fakeData';
