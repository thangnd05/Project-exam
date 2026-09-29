-- Chuyển các bảng nghiệp vụ sang xoá mềm.
--
-- deleted_at IS NULL = đang dùng; khác NULL = đã xoá. Entity tương ứng khai báo
-- @SQLDelete (repository.delete -> UPDATE deleted_at = now()) và
-- @SQLRestriction("deleted_at IS NULL") (mọi query JPQL tự bỏ qua dòng đã xoá).
--
-- Các FK ON DELETE CASCADE / SET NULL giữ nguyên: chúng chỉ còn tác dụng khi xoá
-- thật bằng tay (khôi phục/purge qua SQL). Bảng con (answers, user_answers,
-- question_tags, ...) không có deleted_at, giữ nguyên dòng khi bảng cha bị xoá mềm.

-- ---------------------------------------------------------------------------
-- 1. Cột deleted_at
-- ---------------------------------------------------------------------------
ALTER TABLE assessment.certificate_templates   ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.evaluation              ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.exam_categories         ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.exam_parts              ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.exam_target_milestones  ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.exam_types              ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.learning_plans          ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.passages                ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.question_collections    ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.questions               ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.recovery_resources      ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.scoring_conversion      ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.skills                  ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.tags                    ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.test_parts              ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.tests                   ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.user_certificates       ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.user_targets            ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE assessment.user_tests              ADD COLUMN deleted_at timestamp(6) with time zone;

ALTER TABLE classroom.chapters                 ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE classroom.classes                  ADD COLUMN deleted_at timestamp(6) with time zone;

ALTER TABLE gamification.cosmetics             ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE gamification.quests                ADD COLUMN deleted_at timestamp(6) with time zone;

ALTER TABLE notes.notes                        ADD COLUMN deleted_at timestamp(6) with time zone;

ALTER TABLE posts.categories                   ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE posts.comments                     ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE posts.posts                        ADD COLUMN deleted_at timestamp(6) with time zone;

ALTER TABLE system.emails                      ADD COLUMN deleted_at timestamp(6) with time zone;

ALTER TABLE users.roles                        ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE users.users                        ADD COLUMN deleted_at timestamp(6) with time zone;

ALTER TABLE vocabulary.vocabulary              ADD COLUMN deleted_at timestamp(6) with time zone;
ALTER TABLE vocabulary.vocabulary_album        ADD COLUMN deleted_at timestamp(6) with time zone;

-- ---------------------------------------------------------------------------
-- 2. UNIQUE -> unique một phần (chỉ tính dòng chưa xoá), để tạo lại được
--    bản ghi trùng email/tên/slug/... với một bản ghi đã xoá mềm.
--    Giữ nguyên: uk_user_certificates_code (mã chứng chỉ không bao giờ tái dùng),
--    uk_emails_code (mẫu AUTO không cho xoá).
-- ---------------------------------------------------------------------------
ALTER TABLE users.users DROP CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7;
CREATE UNIQUE INDEX uk_users_email ON users.users (email) WHERE deleted_at IS NULL;

ALTER TABLE users.users DROP CONSTRAINT ukk8d0f2n7n88w1a16yhua64onx;
CREATE UNIQUE INDEX uk_users_user_name ON users.users (user_name) WHERE deleted_at IS NULL;

ALTER TABLE users.roles DROP CONSTRAINT uk716hgxp60ym1lifrdgp67xt5k;
CREATE UNIQUE INDEX uk_roles_role_name ON users.roles (role_name) WHERE deleted_at IS NULL;

ALTER TABLE classroom.classes DROP CONSTRAINT uk5xwk8qmvsk4w7474r38po24wv;
CREATE UNIQUE INDEX uk_classes_class_qr ON classroom.classes (class_qr) WHERE deleted_at IS NULL;

ALTER TABLE posts.categories DROP CONSTRAINT ukoul14ho7bctbefv8jywp5v3i2;
CREATE UNIQUE INDEX uk_categories_slug ON posts.categories (slug) WHERE deleted_at IS NULL;

ALTER TABLE assessment.exam_categories DROP CONSTRAINT ukfcopm8fap7smuixmp4acwefa9;
CREATE UNIQUE INDEX uk_exam_categories_code ON assessment.exam_categories (code) WHERE deleted_at IS NULL;

ALTER TABLE assessment.question_collections DROP CONSTRAINT uk7f1f7xl8yg1539enlhmbvrfnu;
CREATE UNIQUE INDEX uk_question_collections_name ON assessment.question_collections (name) WHERE deleted_at IS NULL;

ALTER TABLE assessment.skills DROP CONSTRAINT uk85woe63nu9klkk9fa73vf0jd0;
CREATE UNIQUE INDEX uk_skills_name ON assessment.skills (name) WHERE deleted_at IS NULL;

ALTER TABLE assessment.exam_target_milestones DROP CONSTRAINT uk8n7i1fqt2w0y64kxiurxk7xgf;
CREATE UNIQUE INDEX uk_exam_target_milestones_type_score
    ON assessment.exam_target_milestones (exam_type_id, milestone_score) WHERE deleted_at IS NULL;

ALTER TABLE assessment.scoring_conversion DROP CONSTRAINT uk_scoring;
CREATE UNIQUE INDEX uk_scoring
    ON assessment.scoring_conversion (exam_type_id, skill_id, num_correct) WHERE deleted_at IS NULL;

ALTER TABLE assessment.user_targets DROP CONSTRAINT uke0blwepqxcjf784pr43fwmucs;
CREATE UNIQUE INDEX uk_user_targets_user_exam_type
    ON assessment.user_targets (user_id, exam_type_id) WHERE deleted_at IS NULL;

ALTER TABLE assessment.certificate_templates DROP CONSTRAINT uk_certificate_templates_exam_type;
CREATE UNIQUE INDEX uk_certificate_templates_exam_type
    ON assessment.certificate_templates (exam_type_id) WHERE deleted_at IS NULL;

DROP INDEX assessment.uk_user_certificates_active_per_exam_type;
CREATE UNIQUE INDEX uk_user_certificates_active_per_exam_type
    ON assessment.user_certificates (user_id, exam_type_id)
    WHERE status = 'ACTIVE' AND deleted_at IS NULL;
