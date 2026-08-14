-- ============================================================================
-- Thêm toàn bộ khoá ngoại cho schema.
--
-- Trước migration này DB không có một FK nào: 59 bảng, ~101 cột *_id trỏ lẫn
-- nhau nhưng không ràng buộc. Hậu quả đã xảy ra thật  khảo sát ngày 30/07/2026
-- tìm thấy 120 dòng `answers` và 41 dòng `question_tags` trỏ tới question đã bị
-- xoá. Các service vốn đã cascade thủ công đúng (QuestionService, TagService,
-- TestCommandService...); FK ở đây là lưới an toàn cho những đường xoá bị sót.
--
-- Quy ước ON DELETE:
--   CASCADE  (69)  cột NOT NULL: con không thể tồn tại thiếu cha (answers ->
--                   questions, test_parts -> tests, bảng nối, dữ liệu gamification
--                   theo user...). Khớp đúng hành vi cascade thủ công hiện có.
--   SET NULL (27)  cột nullable: con vẫn có nghĩa khi mất cha (user_tests của
--                   guest, learning_plans.user_target_id, các parent_id tự trỏ...).
--   RESTRICT  (5)  dữ liệu danh mục / lịch sử không được biến mất khi còn bị
--                   tham chiếu: roles, skills, exam_categories, quests.
--
-- Tên FK theo mẫu fk_<bang_con>_<cot>.
--
-- 3 cột *_id KHÔNG phải khoá ngoại nên cố ý bỏ qua:
--   audit_logs.resource_id              đa hình, cặp với cột `resource`
--   recovery_resources.cloudinary_public_id  id bên ngoài (Cloudinary)
--   user_tests.guest_session_id         token phiên khách, không có bảng cha
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Bước 1: dọn dữ liệu mồ côi.
-- Lặp tới khi ổn định vì xoá mồ côi ở bảng này có thể sinh mồ côi ở bảng khác
-- (xoá question mồ côi -> answers trỏ tới nó thành mồ côi theo).
-- Cột NOT NULL -> xoá dòng; cột nullable -> set NULL (giữ lại dòng).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    fk   record;
    n    bigint;
    pass integer := 0;
    tot  bigint;
BEGIN
    LOOP
        pass := pass + 1;
        tot  := 0;
        FOR fk IN
            SELECT * FROM (VALUES
                ('answers','question_id','questions','question_id',false),
                ('audit_logs','user_id','users','user_id',true),
                ('chapters','class_id','classes','class_id',false),
                ('class_members','class_id','classes','class_id',false),
                ('class_members','user_id','users','user_id',false),
                ('classes','teacher_id','users','user_id',false),
                ('comments','parent_id','comments','id',true),
                ('comments','post_id','posts','id',false),
                ('comments','user_id','users','user_id',false),
                ('email_verifications','user_id','users','user_id',false),
                ('evaluation','user_id','users','user_id',false),
                ('exam_parts','exam_type_id','exam_types','exam_type_id',false),
                ('exam_parts','skill_id','skills','skill_id',true),
                ('exam_target_milestones','exam_type_id','exam_types','exam_type_id',false),
                ('exam_type_layouts','exam_type_id','exam_types','exam_type_id',false),
                ('exam_types','parent_id','exam_types','exam_type_id',true),
                ('learning_plan_phases','exam_part_id','exam_parts','exam_part_id',false),
                ('learning_plan_phases','learning_plan_id','learning_plans','learning_plan_id',false),
                ('learning_plan_session_answers','question_id','questions','question_id',false),
                ('learning_plan_session_answers','selected_answer_id','answers','answer_id',true),
                ('learning_plan_session_answers','session_id','learning_plan_sessions','session_id',false),
                ('learning_plan_session_questions','question_id','questions','question_id',false),
                ('learning_plan_session_questions','session_id','learning_plan_sessions','session_id',false),
                ('learning_plan_sessions','learning_plan_id','learning_plans','learning_plan_id',false),
                ('learning_plan_sessions','resource_id','recovery_resources','resource_id',true),
                ('learning_plan_sessions','task_id','learning_plan_tasks','task_id',true),
                ('learning_plan_tasks','exam_part_id','exam_parts','exam_part_id',false),
                ('learning_plan_tasks','learning_plan_id','learning_plans','learning_plan_id',false),
                ('learning_plan_tasks','tag_id','tags','tag_id',true),
                ('learning_plans','current_task_id','learning_plan_tasks','task_id',true),
                ('learning_plans','exam_type_id','exam_types','exam_type_id',false),
                ('learning_plans','replaced_by_plan_id','learning_plans','learning_plan_id',true),
                ('learning_plans','source_user_test_id','user_tests','user_test_id',false),
                ('learning_plans','user_id','users','user_id',false),
                ('learning_plans','user_target_id','user_targets','user_target_id',true),
                ('notes','user_id','users','user_id',false),
                ('page_visits','user_id','users','user_id',true),
                ('passage_media','passage_id','passages','passage_id',true),
                ('password_reset_tokens','user_id','users','user_id',false),
                ('post_category','category_id','categories','id',false),
                ('post_category','post_id','posts','id',false),
                ('posts','user_id','users','user_id',false),
                ('question_collections','exam_type_id','exam_types','exam_type_id',true),
                ('question_collections','parent_id','question_collections','collection_id',true),
                ('question_tags','question_id','questions','question_id',false),
                ('question_tags','tag_id','tags','tag_id',false),
                ('questions','chapter_id','chapters','chapter_id',true),
                ('questions','class_id','classes','class_id',true),
                ('questions','collection_id','question_collections','collection_id',true),
                ('questions','exam_part_id','exam_parts','exam_part_id',false),
                ('questions','passage_id','passages','passage_id',true),
                ('reacts','post_id','posts','id',false),
                ('reacts','user_id','users','user_id',false),
                ('recovery_resources','exam_part_id','exam_parts','exam_part_id',true),
                ('recovery_resources','exam_type_id','exam_types','exam_type_id',true),
                ('resource_tags','resource_id','recovery_resources','resource_id',false),
                ('resource_tags','tag_id','tags','tag_id',false),
                ('role_permissions','permission_id','permissions','permission_id',false),
                ('role_permissions','role_id','roles','role_id',false),
                ('saved_posts','post_id','posts','id',false),
                ('saved_posts','user_id','users','user_id',false),
                ('scoring_conversion','exam_type_id','exam_types','exam_type_id',false),
                ('scoring_conversion','skill_id','skills','skill_id',false),
                ('tags','exam_type_id','exam_types','exam_type_id',false),
                ('tags','parent_id','tags','tag_id',true),
                ('target_part_requirements','exam_part_id','exam_parts','exam_part_id',false),
                ('target_part_requirements','exam_target_milestone_id','exam_target_milestones','exam_target_milestone_id',false),
                ('test_parts','exam_part_id','exam_parts','exam_part_id',false),
                ('test_parts','test_id','tests','test_id',false),
                ('test_questions','question_id','questions','question_id',false),
                ('test_questions','test_part_id','test_parts','test_part_id',false),
                ('tests','chapter_id','chapters','chapter_id',true),
                ('tests','class_id','classes','class_id',true),
                ('tests','collection_id','question_collections','collection_id',true),
                ('tests','exam_category_id','exam_categories','exam_category_id',true),
                ('tests','exam_type_id','exam_types','exam_type_id',false),
                ('user_answers','question_id','questions','question_id',false),
                ('user_answers','selected_answer_id','answers','answer_id',true),
                ('user_answers','user_test_id','user_tests','user_test_id',false),
                ('user_coins','user_id','users','user_id',false),
                ('user_cosmetics','cosmetic_id','cosmetics','cosmetic_id',false),
                ('user_cosmetics','user_id','users','user_id',false),
                ('user_quest_claims','quest_id','quests','quest_id',false),
                ('user_quest_claims','user_id','users','user_id',false),
                ('user_question_exposures','question_id','questions','question_id',false),
                ('user_question_exposures','user_id','users','user_id',false),
                ('user_streaks','user_id','users','user_id',false),
                ('user_target_parts','exam_part_id','exam_parts','exam_part_id',false),
                ('user_target_parts','last_user_test_id','user_tests','user_test_id',true),
                ('user_target_parts','user_target_id','user_targets','user_target_id',false),
                ('user_targets','exam_type_id','exam_types','exam_type_id',false),
                ('user_targets','user_id','users','user_id',false),
                ('user_test_accesses','test_id','tests','test_id',false),
                ('user_test_accesses','user_id','users','user_id',false),
                ('user_tests','test_id','tests','test_id',false),
                ('user_tests','user_id','users','user_id',true),
                ('user_vocabulary','user_id','users','user_id',false),
                ('user_vocabulary','vocab_id','vocabulary','vocab_id',false),
                ('users','role_id','roles','role_id',false),
                ('vocabulary','album_id','vocabulary_album','album_id',false),
                ('vocabulary_album','user_id','users','user_id',false)
            ) AS v(child, col, parent, pcol, nullable)
        LOOP
            IF fk.nullable THEN
                EXECUTE format(
                    'UPDATE %I SET %I = NULL WHERE %I IS NOT NULL
                       AND NOT EXISTS (SELECT 1 FROM %I p WHERE p.%I = %I.%I)',
                    fk.child, fk.col, fk.col, fk.parent, fk.pcol, fk.child, fk.col);
            ELSE
                EXECUTE format(
                    'DELETE FROM %I WHERE %I IS NOT NULL
                       AND NOT EXISTS (SELECT 1 FROM %I p WHERE p.%I = %I.%I)',
                    fk.child, fk.col, fk.parent, fk.pcol, fk.child, fk.col);
            END IF;
            GET DIAGNOSTICS n = ROW_COUNT;
            IF n > 0 THEN
                RAISE NOTICE 'don mo coi [luot %]: %.% -> % dong', pass, fk.child, fk.col, n;
                tot := tot + n;
            END IF;
        END LOOP;
        EXIT WHEN tot = 0;
        IF pass >= 20 THEN
            RAISE EXCEPTION 'Don mo coi khong hoi tu sau 20 luot - can kiem tra thu cong';
        END IF;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Bước 2: thêm khoá ngoại.
-- ---------------------------------------------------------------------------

-- answers
ALTER TABLE answers
    ADD CONSTRAINT fk_answers_question_id FOREIGN KEY (question_id)
    REFERENCES questions(question_id) ON DELETE CASCADE;

-- audit_logs
ALTER TABLE audit_logs
    ADD CONSTRAINT fk_audit_logs_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE SET NULL;

-- chapters
ALTER TABLE chapters
    ADD CONSTRAINT fk_chapters_class_id FOREIGN KEY (class_id)
    REFERENCES classes(class_id) ON DELETE CASCADE;

-- class_members
ALTER TABLE class_members
    ADD CONSTRAINT fk_class_members_class_id FOREIGN KEY (class_id)
    REFERENCES classes(class_id) ON DELETE CASCADE;
ALTER TABLE class_members
    ADD CONSTRAINT fk_class_members_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- classes
ALTER TABLE classes
    ADD CONSTRAINT fk_classes_teacher_id FOREIGN KEY (teacher_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- comments
ALTER TABLE comments
    ADD CONSTRAINT fk_comments_parent_id FOREIGN KEY (parent_id)
    REFERENCES comments(id) ON DELETE SET NULL;
ALTER TABLE comments
    ADD CONSTRAINT fk_comments_post_id FOREIGN KEY (post_id)
    REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE comments
    ADD CONSTRAINT fk_comments_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- email_verifications
ALTER TABLE email_verifications
    ADD CONSTRAINT fk_email_verifications_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- evaluation
ALTER TABLE evaluation
    ADD CONSTRAINT fk_evaluation_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- exam_parts
ALTER TABLE exam_parts
    ADD CONSTRAINT fk_exam_parts_exam_type_id FOREIGN KEY (exam_type_id)
    REFERENCES exam_types(exam_type_id) ON DELETE CASCADE;
ALTER TABLE exam_parts
    ADD CONSTRAINT fk_exam_parts_skill_id FOREIGN KEY (skill_id)
    REFERENCES skills(skill_id) ON DELETE RESTRICT;

-- exam_target_milestones
ALTER TABLE exam_target_milestones
    ADD CONSTRAINT fk_exam_target_milestones_exam_type_id FOREIGN KEY (exam_type_id)
    REFERENCES exam_types(exam_type_id) ON DELETE CASCADE;

-- exam_type_layouts
ALTER TABLE exam_type_layouts
    ADD CONSTRAINT fk_exam_type_layouts_exam_type_id FOREIGN KEY (exam_type_id)
    REFERENCES exam_types(exam_type_id) ON DELETE CASCADE;

-- exam_types
ALTER TABLE exam_types
    ADD CONSTRAINT fk_exam_types_parent_id FOREIGN KEY (parent_id)
    REFERENCES exam_types(exam_type_id) ON DELETE SET NULL;

-- learning_plan_phases
ALTER TABLE learning_plan_phases
    ADD CONSTRAINT fk_learning_plan_phases_exam_part_id FOREIGN KEY (exam_part_id)
    REFERENCES exam_parts(exam_part_id) ON DELETE CASCADE;
ALTER TABLE learning_plan_phases
    ADD CONSTRAINT fk_learning_plan_phases_learning_plan_id FOREIGN KEY (learning_plan_id)
    REFERENCES learning_plans(learning_plan_id) ON DELETE CASCADE;

-- learning_plan_session_answers
ALTER TABLE learning_plan_session_answers
    ADD CONSTRAINT fk_learning_plan_session_answers_question_id FOREIGN KEY (question_id)
    REFERENCES questions(question_id) ON DELETE CASCADE;
ALTER TABLE learning_plan_session_answers
    ADD CONSTRAINT fk_learning_plan_session_answers_selected_answer_id FOREIGN KEY (selected_answer_id)
    REFERENCES answers(answer_id) ON DELETE SET NULL;
ALTER TABLE learning_plan_session_answers
    ADD CONSTRAINT fk_learning_plan_session_answers_session_id FOREIGN KEY (session_id)
    REFERENCES learning_plan_sessions(session_id) ON DELETE CASCADE;

-- learning_plan_session_questions
ALTER TABLE learning_plan_session_questions
    ADD CONSTRAINT fk_learning_plan_session_questions_question_id FOREIGN KEY (question_id)
    REFERENCES questions(question_id) ON DELETE CASCADE;
ALTER TABLE learning_plan_session_questions
    ADD CONSTRAINT fk_learning_plan_session_questions_session_id FOREIGN KEY (session_id)
    REFERENCES learning_plan_sessions(session_id) ON DELETE CASCADE;

-- learning_plan_sessions
ALTER TABLE learning_plan_sessions
    ADD CONSTRAINT fk_learning_plan_sessions_learning_plan_id FOREIGN KEY (learning_plan_id)
    REFERENCES learning_plans(learning_plan_id) ON DELETE CASCADE;
ALTER TABLE learning_plan_sessions
    ADD CONSTRAINT fk_learning_plan_sessions_resource_id FOREIGN KEY (resource_id)
    REFERENCES recovery_resources(resource_id) ON DELETE SET NULL;
ALTER TABLE learning_plan_sessions
    ADD CONSTRAINT fk_learning_plan_sessions_task_id FOREIGN KEY (task_id)
    REFERENCES learning_plan_tasks(task_id) ON DELETE SET NULL;

-- learning_plan_tasks
ALTER TABLE learning_plan_tasks
    ADD CONSTRAINT fk_learning_plan_tasks_exam_part_id FOREIGN KEY (exam_part_id)
    REFERENCES exam_parts(exam_part_id) ON DELETE CASCADE;
ALTER TABLE learning_plan_tasks
    ADD CONSTRAINT fk_learning_plan_tasks_learning_plan_id FOREIGN KEY (learning_plan_id)
    REFERENCES learning_plans(learning_plan_id) ON DELETE CASCADE;
ALTER TABLE learning_plan_tasks
    ADD CONSTRAINT fk_learning_plan_tasks_tag_id FOREIGN KEY (tag_id)
    REFERENCES tags(tag_id) ON DELETE SET NULL;

-- learning_plans
ALTER TABLE learning_plans
    ADD CONSTRAINT fk_learning_plans_current_task_id FOREIGN KEY (current_task_id)
    REFERENCES learning_plan_tasks(task_id) ON DELETE SET NULL;
ALTER TABLE learning_plans
    ADD CONSTRAINT fk_learning_plans_exam_type_id FOREIGN KEY (exam_type_id)
    REFERENCES exam_types(exam_type_id) ON DELETE CASCADE;
ALTER TABLE learning_plans
    ADD CONSTRAINT fk_learning_plans_replaced_by_plan_id FOREIGN KEY (replaced_by_plan_id)
    REFERENCES learning_plans(learning_plan_id) ON DELETE SET NULL;
ALTER TABLE learning_plans
    ADD CONSTRAINT fk_learning_plans_source_user_test_id FOREIGN KEY (source_user_test_id)
    REFERENCES user_tests(user_test_id) ON DELETE CASCADE;
ALTER TABLE learning_plans
    ADD CONSTRAINT fk_learning_plans_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE learning_plans
    ADD CONSTRAINT fk_learning_plans_user_target_id FOREIGN KEY (user_target_id)
    REFERENCES user_targets(user_target_id) ON DELETE SET NULL;

-- notes
ALTER TABLE notes
    ADD CONSTRAINT fk_notes_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- page_visits
ALTER TABLE page_visits
    ADD CONSTRAINT fk_page_visits_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE SET NULL;

-- passage_media
ALTER TABLE passage_media
    ADD CONSTRAINT fk_passage_media_passage_id FOREIGN KEY (passage_id)
    REFERENCES passages(passage_id) ON DELETE SET NULL;

-- password_reset_tokens
ALTER TABLE password_reset_tokens
    ADD CONSTRAINT fk_password_reset_tokens_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- post_category
ALTER TABLE post_category
    ADD CONSTRAINT fk_post_category_category_id FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE post_category
    ADD CONSTRAINT fk_post_category_post_id FOREIGN KEY (post_id)
    REFERENCES posts(id) ON DELETE CASCADE;

-- posts
ALTER TABLE posts
    ADD CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- question_collections
ALTER TABLE question_collections
    ADD CONSTRAINT fk_question_collections_exam_type_id FOREIGN KEY (exam_type_id)
    REFERENCES exam_types(exam_type_id) ON DELETE SET NULL;
ALTER TABLE question_collections
    ADD CONSTRAINT fk_question_collections_parent_id FOREIGN KEY (parent_id)
    REFERENCES question_collections(collection_id) ON DELETE SET NULL;

-- question_tags
ALTER TABLE question_tags
    ADD CONSTRAINT fk_question_tags_question_id FOREIGN KEY (question_id)
    REFERENCES questions(question_id) ON DELETE CASCADE;
ALTER TABLE question_tags
    ADD CONSTRAINT fk_question_tags_tag_id FOREIGN KEY (tag_id)
    REFERENCES tags(tag_id) ON DELETE CASCADE;

-- questions
ALTER TABLE questions
    ADD CONSTRAINT fk_questions_chapter_id FOREIGN KEY (chapter_id)
    REFERENCES chapters(chapter_id) ON DELETE SET NULL;
ALTER TABLE questions
    ADD CONSTRAINT fk_questions_class_id FOREIGN KEY (class_id)
    REFERENCES classes(class_id) ON DELETE SET NULL;
ALTER TABLE questions
    ADD CONSTRAINT fk_questions_collection_id FOREIGN KEY (collection_id)
    REFERENCES question_collections(collection_id) ON DELETE SET NULL;
ALTER TABLE questions
    ADD CONSTRAINT fk_questions_exam_part_id FOREIGN KEY (exam_part_id)
    REFERENCES exam_parts(exam_part_id) ON DELETE CASCADE;
ALTER TABLE questions
    ADD CONSTRAINT fk_questions_passage_id FOREIGN KEY (passage_id)
    REFERENCES passages(passage_id) ON DELETE SET NULL;

-- reacts
ALTER TABLE reacts
    ADD CONSTRAINT fk_reacts_post_id FOREIGN KEY (post_id)
    REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE reacts
    ADD CONSTRAINT fk_reacts_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- recovery_resources
ALTER TABLE recovery_resources
    ADD CONSTRAINT fk_recovery_resources_exam_part_id FOREIGN KEY (exam_part_id)
    REFERENCES exam_parts(exam_part_id) ON DELETE SET NULL;
ALTER TABLE recovery_resources
    ADD CONSTRAINT fk_recovery_resources_exam_type_id FOREIGN KEY (exam_type_id)
    REFERENCES exam_types(exam_type_id) ON DELETE SET NULL;

-- resource_tags
ALTER TABLE resource_tags
    ADD CONSTRAINT fk_resource_tags_resource_id FOREIGN KEY (resource_id)
    REFERENCES recovery_resources(resource_id) ON DELETE CASCADE;
ALTER TABLE resource_tags
    ADD CONSTRAINT fk_resource_tags_tag_id FOREIGN KEY (tag_id)
    REFERENCES tags(tag_id) ON DELETE CASCADE;

-- role_permissions
ALTER TABLE role_permissions
    ADD CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id)
    REFERENCES permissions(permission_id) ON DELETE CASCADE;
ALTER TABLE role_permissions
    ADD CONSTRAINT fk_role_permissions_role_id FOREIGN KEY (role_id)
    REFERENCES roles(role_id) ON DELETE CASCADE;

-- saved_posts
ALTER TABLE saved_posts
    ADD CONSTRAINT fk_saved_posts_post_id FOREIGN KEY (post_id)
    REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE saved_posts
    ADD CONSTRAINT fk_saved_posts_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- scoring_conversion
ALTER TABLE scoring_conversion
    ADD CONSTRAINT fk_scoring_conversion_exam_type_id FOREIGN KEY (exam_type_id)
    REFERENCES exam_types(exam_type_id) ON DELETE CASCADE;
ALTER TABLE scoring_conversion
    ADD CONSTRAINT fk_scoring_conversion_skill_id FOREIGN KEY (skill_id)
    REFERENCES skills(skill_id) ON DELETE RESTRICT;

-- tags
ALTER TABLE tags
    ADD CONSTRAINT fk_tags_exam_type_id FOREIGN KEY (exam_type_id)
    REFERENCES exam_types(exam_type_id) ON DELETE CASCADE;
ALTER TABLE tags
    ADD CONSTRAINT fk_tags_parent_id FOREIGN KEY (parent_id)
    REFERENCES tags(tag_id) ON DELETE SET NULL;

-- target_part_requirements
ALTER TABLE target_part_requirements
    ADD CONSTRAINT fk_target_part_requirements_exam_part_id FOREIGN KEY (exam_part_id)
    REFERENCES exam_parts(exam_part_id) ON DELETE CASCADE;
ALTER TABLE target_part_requirements
    ADD CONSTRAINT fk_target_part_requirements_exam_target_milestone_id FOREIGN KEY (exam_target_milestone_id)
    REFERENCES exam_target_milestones(exam_target_milestone_id) ON DELETE CASCADE;

-- test_parts
ALTER TABLE test_parts
    ADD CONSTRAINT fk_test_parts_exam_part_id FOREIGN KEY (exam_part_id)
    REFERENCES exam_parts(exam_part_id) ON DELETE CASCADE;
ALTER TABLE test_parts
    ADD CONSTRAINT fk_test_parts_test_id FOREIGN KEY (test_id)
    REFERENCES tests(test_id) ON DELETE CASCADE;

-- test_questions
ALTER TABLE test_questions
    ADD CONSTRAINT fk_test_questions_question_id FOREIGN KEY (question_id)
    REFERENCES questions(question_id) ON DELETE CASCADE;
ALTER TABLE test_questions
    ADD CONSTRAINT fk_test_questions_test_part_id FOREIGN KEY (test_part_id)
    REFERENCES test_parts(test_part_id) ON DELETE CASCADE;

-- tests
ALTER TABLE tests
    ADD CONSTRAINT fk_tests_chapter_id FOREIGN KEY (chapter_id)
    REFERENCES chapters(chapter_id) ON DELETE SET NULL;
ALTER TABLE tests
    ADD CONSTRAINT fk_tests_class_id FOREIGN KEY (class_id)
    REFERENCES classes(class_id) ON DELETE SET NULL;
ALTER TABLE tests
    ADD CONSTRAINT fk_tests_collection_id FOREIGN KEY (collection_id)
    REFERENCES question_collections(collection_id) ON DELETE SET NULL;
ALTER TABLE tests
    ADD CONSTRAINT fk_tests_exam_category_id FOREIGN KEY (exam_category_id)
    REFERENCES exam_categories(exam_category_id) ON DELETE RESTRICT;
ALTER TABLE tests
    ADD CONSTRAINT fk_tests_exam_type_id FOREIGN KEY (exam_type_id)
    REFERENCES exam_types(exam_type_id) ON DELETE CASCADE;

-- user_answers
ALTER TABLE user_answers
    ADD CONSTRAINT fk_user_answers_question_id FOREIGN KEY (question_id)
    REFERENCES questions(question_id) ON DELETE CASCADE;
ALTER TABLE user_answers
    ADD CONSTRAINT fk_user_answers_selected_answer_id FOREIGN KEY (selected_answer_id)
    REFERENCES answers(answer_id) ON DELETE SET NULL;
ALTER TABLE user_answers
    ADD CONSTRAINT fk_user_answers_user_test_id FOREIGN KEY (user_test_id)
    REFERENCES user_tests(user_test_id) ON DELETE CASCADE;

-- user_coins
ALTER TABLE user_coins
    ADD CONSTRAINT fk_user_coins_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- user_cosmetics
ALTER TABLE user_cosmetics
    ADD CONSTRAINT fk_user_cosmetics_cosmetic_id FOREIGN KEY (cosmetic_id)
    REFERENCES cosmetics(cosmetic_id) ON DELETE CASCADE;
ALTER TABLE user_cosmetics
    ADD CONSTRAINT fk_user_cosmetics_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- user_quest_claims
ALTER TABLE user_quest_claims
    ADD CONSTRAINT fk_user_quest_claims_quest_id FOREIGN KEY (quest_id)
    REFERENCES quests(quest_id) ON DELETE RESTRICT;
ALTER TABLE user_quest_claims
    ADD CONSTRAINT fk_user_quest_claims_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- user_question_exposures
ALTER TABLE user_question_exposures
    ADD CONSTRAINT fk_user_question_exposures_question_id FOREIGN KEY (question_id)
    REFERENCES questions(question_id) ON DELETE CASCADE;
ALTER TABLE user_question_exposures
    ADD CONSTRAINT fk_user_question_exposures_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- user_streaks
ALTER TABLE user_streaks
    ADD CONSTRAINT fk_user_streaks_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- user_target_parts
ALTER TABLE user_target_parts
    ADD CONSTRAINT fk_user_target_parts_exam_part_id FOREIGN KEY (exam_part_id)
    REFERENCES exam_parts(exam_part_id) ON DELETE CASCADE;
ALTER TABLE user_target_parts
    ADD CONSTRAINT fk_user_target_parts_last_user_test_id FOREIGN KEY (last_user_test_id)
    REFERENCES user_tests(user_test_id) ON DELETE SET NULL;
ALTER TABLE user_target_parts
    ADD CONSTRAINT fk_user_target_parts_user_target_id FOREIGN KEY (user_target_id)
    REFERENCES user_targets(user_target_id) ON DELETE CASCADE;

-- user_targets
ALTER TABLE user_targets
    ADD CONSTRAINT fk_user_targets_exam_type_id FOREIGN KEY (exam_type_id)
    REFERENCES exam_types(exam_type_id) ON DELETE CASCADE;
ALTER TABLE user_targets
    ADD CONSTRAINT fk_user_targets_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- user_test_accesses
ALTER TABLE user_test_accesses
    ADD CONSTRAINT fk_user_test_accesses_test_id FOREIGN KEY (test_id)
    REFERENCES tests(test_id) ON DELETE CASCADE;
ALTER TABLE user_test_accesses
    ADD CONSTRAINT fk_user_test_accesses_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;

-- user_tests
ALTER TABLE user_tests
    ADD CONSTRAINT fk_user_tests_test_id FOREIGN KEY (test_id)
    REFERENCES tests(test_id) ON DELETE CASCADE;
ALTER TABLE user_tests
    ADD CONSTRAINT fk_user_tests_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE SET NULL;

-- user_vocabulary
ALTER TABLE user_vocabulary
    ADD CONSTRAINT fk_user_vocabulary_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE user_vocabulary
    ADD CONSTRAINT fk_user_vocabulary_vocab_id FOREIGN KEY (vocab_id)
    REFERENCES vocabulary(vocab_id) ON DELETE CASCADE;

-- users
ALTER TABLE users
    ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id)
    REFERENCES roles(role_id) ON DELETE RESTRICT;

-- vocabulary
ALTER TABLE vocabulary
    ADD CONSTRAINT fk_vocabulary_album_id FOREIGN KEY (album_id)
    REFERENCES vocabulary_album(album_id) ON DELETE CASCADE;

-- vocabulary_album
ALTER TABLE vocabulary_album
    ADD CONSTRAINT fk_vocabulary_album_user_id FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE;
