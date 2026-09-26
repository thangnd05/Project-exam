-- Move tables out of public into one schema per backend module.
-- ALTER TABLE ... SET SCHEMA keeps rows, indexes, constraints, FKs and owned sequences.
-- flyway_schema_history stays in public.

CREATE SCHEMA IF NOT EXISTS assessment;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS classroom;
CREATE SCHEMA IF NOT EXISTS gamification;
CREATE SCHEMA IF NOT EXISTS notes;
CREATE SCHEMA IF NOT EXISTS posts;
CREATE SCHEMA IF NOT EXISTS system;
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS vocabulary;

-- assessment
ALTER TABLE IF EXISTS public.answers SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.certificate_templates SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.evaluation SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.exam_categories SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.exam_parts SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.exam_target_milestones SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.exam_type_layouts SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.exam_types SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.learning_plan_session_answers SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.learning_plan_session_questions SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.learning_plan_sessions SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.learning_plan_tasks SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.learning_plans SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.passage_media SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.passages SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.question_collections SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.question_tags SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.questions SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.recovery_resources SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.resource_tags SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.scoring_conversion SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.skills SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.tags SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.target_part_requirements SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.test_parts SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.test_questions SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.tests SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.user_answers SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.user_certificates SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.user_question_exposures SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.user_target_parts SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.user_targets SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.user_test_accesses SET SCHEMA assessment;
ALTER TABLE IF EXISTS public.user_tests SET SCHEMA assessment;

-- auth
ALTER TABLE IF EXISTS public.email_verifications SET SCHEMA auth;
ALTER TABLE IF EXISTS public.password_reset_tokens SET SCHEMA auth;

-- classroom
ALTER TABLE IF EXISTS public.chapters SET SCHEMA classroom;
ALTER TABLE IF EXISTS public.class_members SET SCHEMA classroom;
ALTER TABLE IF EXISTS public.classes SET SCHEMA classroom;

-- gamification
ALTER TABLE IF EXISTS public.cosmetics SET SCHEMA gamification;
ALTER TABLE IF EXISTS public.quests SET SCHEMA gamification;
ALTER TABLE IF EXISTS public.streak_recover_config SET SCHEMA gamification;
ALTER TABLE IF EXISTS public.user_coins SET SCHEMA gamification;
ALTER TABLE IF EXISTS public.user_cosmetics SET SCHEMA gamification;
ALTER TABLE IF EXISTS public.user_quest_claims SET SCHEMA gamification;
ALTER TABLE IF EXISTS public.user_streaks SET SCHEMA gamification;

-- notes
ALTER TABLE IF EXISTS public.notes SET SCHEMA notes;

-- posts
ALTER TABLE IF EXISTS public.categories SET SCHEMA posts;
ALTER TABLE IF EXISTS public.comments SET SCHEMA posts;
ALTER TABLE IF EXISTS public.post_category SET SCHEMA posts;
ALTER TABLE IF EXISTS public.posts SET SCHEMA posts;
ALTER TABLE IF EXISTS public.reacts SET SCHEMA posts;
ALTER TABLE IF EXISTS public.saved_posts SET SCHEMA posts;

-- system
ALTER TABLE IF EXISTS public.audit_logs SET SCHEMA system;
ALTER TABLE IF EXISTS public.email_recipients SET SCHEMA system;
ALTER TABLE IF EXISTS public.emails SET SCHEMA system;
ALTER TABLE IF EXISTS public.page_visits SET SCHEMA system;

-- users
ALTER TABLE IF EXISTS public.permissions SET SCHEMA users;
ALTER TABLE IF EXISTS public.role_permissions SET SCHEMA users;
ALTER TABLE IF EXISTS public.roles SET SCHEMA users;
ALTER TABLE IF EXISTS public.users SET SCHEMA users;

-- vocabulary
ALTER TABLE IF EXISTS public.user_vocabulary SET SCHEMA vocabulary;
ALTER TABLE IF EXISTS public.vocabulary SET SCHEMA vocabulary;
ALTER TABLE IF EXISTS public.vocabulary_album SET SCHEMA vocabulary;
