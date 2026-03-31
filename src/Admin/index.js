// Admin Module - Export all components and pages
export { default as AdminLayout } from './layouts/AdminLayout';
export { default as AdminDashboard } from './pages/Dashboard';
export { default as UsersManagement } from './pages/Users';
export { default as ClassesManagement } from './pages/Classes';
export { default as TestsManagement } from './pages/Tests';
export { default as QuestionsManagement } from './pages/Questions';
export { default as VocabularyManagement } from './pages/Vocabulary';
export { default as AnalyticsPage } from './pages/Analytics';

// Export fake data for use in components
export * from './data/fakeData';
