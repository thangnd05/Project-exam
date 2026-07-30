

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE public.answers (
    answer_id character varying(255) NOT NULL,
    answer_label character varying(255) NOT NULL,
    answer_text text NOT NULL,
    is_correct boolean NOT NULL,
    question_id character varying(255) NOT NULL
);

CREATE TABLE public.audit_logs (
    audit_log_id character varying(255) NOT NULL,
    action character varying(50) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    endpoint character varying(255) NOT NULL,
    http_method character varying(10) NOT NULL,
    ip_address character varying(45),
    resource character varying(100) NOT NULL,
    resource_id character varying(100),
    status_code integer NOT NULL,
    success boolean NOT NULL,
    user_agent character varying(500),
    user_id character varying(255)
);

CREATE TABLE public.categories (
    id character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(120) NOT NULL
);

CREATE TABLE public.chapters (
    chapter_id character varying(255) NOT NULL,
    class_id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    description text,
    title character varying(255) NOT NULL
);

CREATE TABLE public.class_members (
    id character varying(255) NOT NULL,
    class_id character varying(255) NOT NULL,
    joined_at timestamp(6) without time zone,
    status character varying(10) NOT NULL,
    user_id character varying(255) NOT NULL,
    CONSTRAINT class_members_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying])::text[])))
);

CREATE TABLE public.classes (
    class_id character varying(255) NOT NULL,
    class_name character varying(100) NOT NULL,
    class_qr character varying(12) NOT NULL,
    created_at timestamp(6) without time zone,
    description text,
    teacher_id character varying(255) NOT NULL
);

CREATE TABLE public.comments (
    id character varying(255) NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    parent_id character varying(255),
    post_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL
);

CREATE TABLE public.cosmetics (
    cosmetic_id character varying(255) NOT NULL,
    active boolean NOT NULL,
    asset_value text,
    cost_coins integer NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    display_order integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    frame_style character varying(20),
    image_url text,
    CONSTRAINT cosmetics_type_check CHECK (((type)::text = ANY ((ARRAY['FRAME'::character varying, 'BADGE'::character varying])::text[])))
);

CREATE TABLE public.email_verifications (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    expires_at timestamp(6) without time zone,
    status character varying(255),
    token character varying(255),
    user_id character varying(255) NOT NULL
);

CREATE TABLE public.evaluation (
    id character varying(255) NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) without time zone,
    rating integer NOT NULL,
    user_id character varying(255) NOT NULL
);

CREATE TABLE public.exam_categories (
    exam_category_id character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    display_order integer,
    guest_allowed boolean NOT NULL,
    name character varying(100) NOT NULL
);

CREATE TABLE public.exam_parts (
    exam_part_id character varying(255) NOT NULL,
    default_num_questions integer,
    description text,
    exam_type_id character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    skill_id character varying(255),
    display_order integer DEFAULT 999 NOT NULL
);

CREATE TABLE public.exam_target_milestones (
    exam_target_milestone_id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description character varying(255),
    exam_type_id character varying(255) NOT NULL,
    milestone_score integer NOT NULL
);

CREATE TABLE public.exam_type_layouts (
    layout_id character varying(255) NOT NULL,
    config text,
    created_at timestamp(6) without time zone NOT NULL,
    exam_type_id character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone
);

CREATE TABLE public.exam_types (
    exam_type_id character varying(255) NOT NULL,
    description text,
    duration_minutes integer,
    name character varying(100) NOT NULL,
    scoring_method character varying(50) NOT NULL,
    flexible boolean,
    parent_id character varying(255)
);

CREATE TABLE public.learning_plan_phases (
    phase_id character varying(255) NOT NULL,
    completed_practices integer NOT NULL,
    current_percentage numeric(5,2),
    days_allocated integer NOT NULL,
    exam_part_id character varying(255) NOT NULL,
    learning_plan_id character varying(255) NOT NULL,
    phase_order integer NOT NULL,
    practice_size integer NOT NULL,
    weak_tag_ids text,
    weakness_score numeric(6,2)
);

CREATE TABLE public.learning_plan_session_answers (
    id character varying(255) NOT NULL,
    is_correct boolean NOT NULL,
    question_id character varying(255) NOT NULL,
    selected_answer_id character varying(255),
    session_id character varying(255) NOT NULL,
    selected_answer_ids text
);

CREATE TABLE public.learning_plan_session_questions (
    id character varying(255) NOT NULL,
    display_order integer NOT NULL,
    question_id character varying(255) NOT NULL,
    session_id character varying(255) NOT NULL
);

CREATE TABLE public.learning_plan_sessions (
    session_id character varying(255) NOT NULL,
    accuracy integer,
    learning_plan_id character varying(255) NOT NULL,
    passed boolean,
    plan_stage character varying(20) NOT NULL,
    question_count integer NOT NULL,
    resource_id character varying(255),
    started_at timestamp(6) with time zone NOT NULL,
    status character varying(20) NOT NULL,
    submitted_at timestamp(6) with time zone,
    task_id character varying(255),
    abandoned boolean DEFAULT false NOT NULL,
    CONSTRAINT learning_plan_sessions_plan_stage_check CHECK (((plan_stage)::text = ANY ((ARRAY['FOUNDATION'::character varying, 'MIX'::character varying, 'MOCK'::character varying])::text[]))),
    CONSTRAINT learning_plan_sessions_status_check CHECK (((status)::text = ANY ((ARRAY['IN_PROGRESS'::character varying, 'SUBMITTED'::character varying])::text[])))
);

CREATE TABLE public.learning_plan_tasks (
    task_id character varying(255) NOT NULL,
    attempt_count integer NOT NULL,
    baseline_accuracy numeric(5,2),
    best_accuracy numeric(5,2),
    exam_part_id character varying(255) NOT NULL,
    learning_plan_id character varying(255) NOT NULL,
    pass_accuracy integer NOT NULL,
    passed_at timestamp(6) with time zone,
    status character varying(20) NOT NULL,
    tag_id character varying(255),
    task_order integer NOT NULL,
    priority_score integer DEFAULT 0 NOT NULL,
    wrong_count_at_diagnosis integer,
    task_type character varying(30) DEFAULT 'TAG'::character varying NOT NULL,
    target_question_count integer,
    consecutive_fails integer DEFAULT 0 NOT NULL,
    CONSTRAINT learning_plan_tasks_status_check CHECK (((status)::text = ANY ((ARRAY['LOCKED'::character varying, 'ACTIVE'::character varying, 'PASSED'::character varying, 'SKIPPED'::character varying])::text[])))
);

CREATE TABLE public.learning_plans (
    learning_plan_id character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    baseline_readiness integer,
    deadline_days integer,
    exam_type_id character varying(255) NOT NULL,
    source_user_test_id character varying(255) NOT NULL,
    status character varying(20) NOT NULL,
    target_score integer,
    user_id character varying(255) NOT NULL,
    current_task_id character varying(255),
    user_target_id character varying(255),
    plan_stage character varying(20) DEFAULT 'FOUNDATION'::character varying NOT NULL,
    pass_accuracy_default integer DEFAULT 70 NOT NULL,
    plan_sequence integer,
    replaced_by_plan_id character varying(255),
    CONSTRAINT learning_plans_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'COMPLETED'::character varying, 'ABANDONED'::character varying, 'REPLACED'::character varying])::text[])))
);

CREATE TABLE public.passage_media (
    id character varying(255) NOT NULL,
    media_type character varying(255),
    media_url character varying(255),
    passage_id character varying(255),
    content text,
    CONSTRAINT passage_media_media_type_check CHECK (((media_type)::text = ANY ((ARRAY['IMAGE'::character varying, 'AUDIO'::character varying, 'DOCUMENT'::character varying, 'TEXT'::character varying])::text[])))
);

CREATE TABLE public.passages (
    passage_id character varying(255) NOT NULL,
    content text NOT NULL,
    media_url character varying(255),
    passage_type character varying(255) NOT NULL,
    content_translation text,
    CONSTRAINT passages_passage_type_check CHECK (((passage_type)::text = ANY ((ARRAY['READING'::character varying, 'LISTENING'::character varying])::text[])))
);

CREATE TABLE public.password_reset_tokens (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    token character varying(120) NOT NULL,
    used boolean NOT NULL,
    user_id character varying(255) NOT NULL
);

CREATE TABLE public.permissions (
    permission_id character varying(255) NOT NULL,
    code character varying(100) NOT NULL,
    description character varying(255),
    permission_group character varying(50)
);

CREATE TABLE public.post_category (
    id character varying(255) NOT NULL,
    category_id character varying(255) NOT NULL,
    post_id character varying(255) NOT NULL
);

CREATE TABLE public.posts (
    id character varying(255) NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    status character varying(20) NOT NULL,
    thumbnail_url character varying(500),
    title character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    view_count bigint NOT NULL,
    CONSTRAINT posts_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying])::text[])))
);

CREATE TABLE public.question_collections (
    collection_id character varying(255) NOT NULL,
    description text,
    name character varying(255) NOT NULL,
    parent_id character varying(255),
    exam_type_id character varying(255),
    display_order integer
);

CREATE TABLE public.question_tags (
    id character varying(255) NOT NULL,
    question_id character varying(255) NOT NULL,
    tag_id character varying(255) NOT NULL
);

CREATE TABLE public.questions (
    question_id character varying(255) NOT NULL,
    chapter_id character varying(255),
    class_id character varying(255),
    collection_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    exam_part_id character varying(255) NOT NULL,
    explanation text,
    is_bank boolean,
    passage_id character varying(255),
    question_text text NOT NULL,
    question_type character varying(255) NOT NULL,
    question_number integer,
    CONSTRAINT questions_question_type_check CHECK (((question_type)::text = ANY ((ARRAY['MCQ'::character varying, 'MSQ'::character varying, 'FILL_BLANK'::character varying, 'ESSAY'::character varying])::text[])))
);

CREATE TABLE public.quests (
    quest_id character varying(255) NOT NULL,
    active boolean NOT NULL,
    condition_target integer NOT NULL,
    condition_type character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    end_at timestamp(6) without time zone,
    reward_coins integer NOT NULL,
    start_at timestamp(6) without time zone,
    title character varying(255) NOT NULL,
    CONSTRAINT quests_condition_type_check CHECK (((condition_type)::text = ANY ((ARRAY['NONE'::character varying, 'COMPLETE_TEST'::character varying, 'STREAK_DAYS'::character varying, 'CREATE_LEARNING_PLAN'::character varying, 'COMPLETE_LEARNING_PLAN'::character varying])::text[])))
);

CREATE TABLE public.reacts (
    id character varying(255) NOT NULL,
    post_id character varying(255) NOT NULL,
    type character varying(10) NOT NULL,
    user_id character varying(255) NOT NULL,
    CONSTRAINT reacts_type_check CHECK (((type)::text = ANY ((ARRAY['LIKE'::character varying, 'LOVE'::character varying, 'HAHA'::character varying, 'WOW'::character varying, 'SAD'::character varying, 'ANGRY'::character varying])::text[])))
);

CREATE TABLE public.recovery_resources (
    resource_id character varying(255) NOT NULL,
    cloudinary_public_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    description text,
    original_file_name character varying(255),
    title character varying(255) NOT NULL,
    url character varying(255) NOT NULL
);

CREATE TABLE public.resource_tags (
    id character varying(255) NOT NULL,
    resource_id character varying(255) NOT NULL,
    tag_id character varying(255) NOT NULL
);

CREATE TABLE public.role_permissions (
    id character varying(255) NOT NULL,
    permission_id character varying(255) NOT NULL,
    role_id character varying(255) NOT NULL
);

CREATE TABLE public.roles (
    role_id character varying(255) NOT NULL,
    description character varying(255),
    role_name character varying(50) NOT NULL
);

CREATE TABLE public.saved_posts (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    post_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL
);

CREATE TABLE public.scoring_conversion (
    conversion_id character varying(255) NOT NULL,
    converted_score integer NOT NULL,
    exam_type_id character varying(255) NOT NULL,
    num_correct integer NOT NULL,
    skill_id character varying(255) NOT NULL
);

CREATE TABLE public.skills (
    skill_id character varying(255) NOT NULL,
    description text,
    name character varying(100) NOT NULL
);

CREATE TABLE public.streak_recover_config (
    id character varying(255) NOT NULL,
    active boolean NOT NULL,
    cost_coins integer NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);

CREATE TABLE public.tags (
    tag_id character varying(255) NOT NULL,
    exam_type_id character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    parent_id character varying(255),
    sort_order integer
);

CREATE TABLE public.target_part_requirements (
    target_part_requirement_id character varying(255) NOT NULL,
    exam_part_id character varying(255) NOT NULL,
    exam_target_milestone_id character varying(255) NOT NULL,
    required_percentage integer NOT NULL
);

CREATE TABLE public.test_parts (
    test_part_id character varying(255) NOT NULL,
    exam_part_id character varying(255) NOT NULL,
    num_questions integer NOT NULL,
    test_id character varying(255) NOT NULL
);

CREATE TABLE public.test_questions (
    test_question_id character varying(255) NOT NULL,
    display_order integer,
    question_id character varying(255) NOT NULL,
    test_part_id character varying(255) NOT NULL
);

CREATE TABLE public.tests (
    test_id character varying(255) NOT NULL,
    available_from timestamp(6) without time zone,
    available_to timestamp(6) without time zone,
    banner_url character varying(500),
    chapter_id character varying(255),
    class_id character varying(255),
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    description character varying(255),
    duration_minutes integer,
    exam_category_id character varying(255),
    exam_type_id character varying(255) NOT NULL,
    max_attempts integer,
    title character varying(255) NOT NULL,
    cost_coins integer,
    collection_id character varying(255)
);

CREATE TABLE public.user_answers (
    user_answer_id character varying(255) NOT NULL,
    answer_text text,
    question_id character varying(255) NOT NULL,
    selected_answer_id character varying(255),
    user_test_id character varying(255) NOT NULL,
    selected_answer_ids text
);

CREATE TABLE public.user_coins (
    user_coin_id character varying(255) NOT NULL,
    balance integer NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id character varying(255) NOT NULL
);

CREATE TABLE public.user_cosmetics (
    user_cosmetic_id character varying(255) NOT NULL,
    cosmetic_id character varying(255) NOT NULL,
    equipped boolean NOT NULL,
    owned_at timestamp(6) without time zone NOT NULL,
    user_id character varying(255) NOT NULL
);

CREATE TABLE public.user_quest_claims (
    user_quest_claim_id character varying(255) NOT NULL,
    claimed_at timestamp(6) without time zone NOT NULL,
    quest_id character varying(255) NOT NULL,
    reward_coins integer NOT NULL,
    user_id character varying(255) NOT NULL
);

CREATE TABLE public.user_question_exposures (
    id character varying(255) NOT NULL,
    first_seen_at timestamp(6) with time zone NOT NULL,
    last_seen_at timestamp(6) with time zone NOT NULL,
    question_id character varying(255) NOT NULL,
    times_seen integer NOT NULL,
    user_id character varying(255) NOT NULL
);

CREATE TABLE public.user_streaks (
    user_streak_id character varying(255) NOT NULL,
    current_streak integer NOT NULL,
    last_activity_date date,
    longest_streak integer NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id character varying(255) NOT NULL
);

CREATE TABLE public.user_target_parts (
    user_target_part_id character varying(255) NOT NULL,
    custom_percentage integer NOT NULL,
    exam_part_id character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_target_id character varying(255) NOT NULL,
    current_score numeric(5,2),
    last_user_test_id character varying(255)
);

CREATE TABLE public.user_targets (
    user_target_id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    exam_type_id character varying(255) NOT NULL,
    target_score integer NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id character varying(255) NOT NULL,
    target_readiness integer,
    achieved_at timestamp without time zone
);

CREATE TABLE public.user_test_accesses (
    user_test_access_id character varying(255) NOT NULL,
    purchased_at timestamp(6) without time zone NOT NULL,
    test_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL
);

CREATE TABLE public.user_tests (
    user_test_id character varying(255) NOT NULL,
    finished_at timestamp(6) without time zone,
    guest_session_id character varying(64),
    started_at timestamp(6) without time zone NOT NULL,
    status character varying(20),
    test_id character varying(255) NOT NULL,
    total_score integer,
    user_id character varying(255),
    version bigint,
    mode character varying(20),
    practice_part_ids character varying(500),
    CONSTRAINT user_tests_mode_check CHECK (((mode)::text = ANY ((ARRAY['FULL_TEST'::character varying, 'PRACTICE'::character varying])::text[]))),
    CONSTRAINT user_tests_status_check CHECK (((status)::text = ANY ((ARRAY['IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'EXPIRED'::character varying])::text[])))
);

CREATE TABLE public.user_vocabulary (
    id character varying(255) NOT NULL,
    correct_count integer NOT NULL,
    last_reviewed timestamp(6) without time zone,
    status character varying(255),
    user_id character varying(255) NOT NULL,
    vocab_id character varying(255) NOT NULL,
    CONSTRAINT user_vocabulary_status_check CHECK (((status)::text = ANY ((ARRAY['learning'::character varying, 'mastered'::character varying])::text[])))
);

CREATE TABLE public.users (
    user_id character varying(255) NOT NULL,
    avatar_url character varying(255),
    created_at timestamp(6) without time zone NOT NULL,
    email character varying(100) NOT NULL,
    full_name character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role_id character varying(255) NOT NULL,
    user_name character varying(50) NOT NULL,
    verification_token character varying(255),
    verified boolean
);

CREATE TABLE public.vocabulary (
    vocab_id character varying(255) NOT NULL,
    album_id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    example character varying(255),
    meaning character varying(255) NOT NULL,
    phonetic character varying(255),
    voice_url character varying(255),
    word character varying(100) NOT NULL
);

CREATE TABLE public.vocabulary_album (
    album_id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    description character varying(255),
    name character varying(100) NOT NULL,
    user_id character varying(255) NOT NULL
);

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (answer_id);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (audit_log_id);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_pkey PRIMARY KEY (chapter_id);

ALTER TABLE ONLY public.class_members
    ADD CONSTRAINT class_members_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (class_id);

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cosmetics
    ADD CONSTRAINT cosmetics_pkey PRIMARY KEY (cosmetic_id);

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.evaluation
    ADD CONSTRAINT evaluation_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.exam_categories
    ADD CONSTRAINT exam_categories_pkey PRIMARY KEY (exam_category_id);

ALTER TABLE ONLY public.exam_parts
    ADD CONSTRAINT exam_parts_pkey PRIMARY KEY (exam_part_id);

ALTER TABLE ONLY public.exam_target_milestones
    ADD CONSTRAINT exam_target_milestones_pkey PRIMARY KEY (exam_target_milestone_id);

ALTER TABLE ONLY public.exam_type_layouts
    ADD CONSTRAINT exam_type_layouts_pkey PRIMARY KEY (layout_id);

ALTER TABLE ONLY public.exam_types
    ADD CONSTRAINT exam_types_pkey PRIMARY KEY (exam_type_id);

ALTER TABLE ONLY public.exam_type_layouts
    ADD CONSTRAINT idx_exam_type_layouts_exam_type_id UNIQUE (exam_type_id);

ALTER TABLE ONLY public.learning_plan_phases
    ADD CONSTRAINT learning_plan_phases_pkey PRIMARY KEY (phase_id);

ALTER TABLE ONLY public.learning_plan_session_answers
    ADD CONSTRAINT learning_plan_session_answers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.learning_plan_session_questions
    ADD CONSTRAINT learning_plan_session_questions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.learning_plan_sessions
    ADD CONSTRAINT learning_plan_sessions_pkey PRIMARY KEY (session_id);

ALTER TABLE ONLY public.learning_plan_tasks
    ADD CONSTRAINT learning_plan_tasks_pkey PRIMARY KEY (task_id);

ALTER TABLE ONLY public.learning_plans
    ADD CONSTRAINT learning_plans_pkey PRIMARY KEY (learning_plan_id);

ALTER TABLE ONLY public.passage_media
    ADD CONSTRAINT passage_media_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.passages
    ADD CONSTRAINT passages_pkey PRIMARY KEY (passage_id);

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (permission_id);

ALTER TABLE ONLY public.post_category
    ADD CONSTRAINT post_category_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.question_collections
    ADD CONSTRAINT question_collections_pkey PRIMARY KEY (collection_id);

ALTER TABLE ONLY public.question_tags
    ADD CONSTRAINT question_tags_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (question_id);

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_pkey PRIMARY KEY (quest_id);

ALTER TABLE ONLY public.reacts
    ADD CONSTRAINT reacts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.recovery_resources
    ADD CONSTRAINT recovery_resources_pkey PRIMARY KEY (resource_id);

ALTER TABLE ONLY public.resource_tags
    ADD CONSTRAINT resource_tags_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT saved_posts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.scoring_conversion
    ADD CONSTRAINT scoring_conversion_pkey PRIMARY KEY (conversion_id);

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (skill_id);

ALTER TABLE ONLY public.streak_recover_config
    ADD CONSTRAINT streak_recover_config_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);

ALTER TABLE ONLY public.target_part_requirements
    ADD CONSTRAINT target_part_requirements_pkey PRIMARY KEY (target_part_requirement_id);

ALTER TABLE ONLY public.test_parts
    ADD CONSTRAINT test_parts_pkey PRIMARY KEY (test_part_id);

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_pkey PRIMARY KEY (test_question_id);

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_pkey PRIMARY KEY (test_id);

ALTER TABLE ONLY public.user_cosmetics
    ADD CONSTRAINT uk22n5xk815lmltqxhj8n6c2qt2 UNIQUE (user_id, cosmetic_id);

ALTER TABLE ONLY public.learning_plan_session_answers
    ADD CONSTRAINT uk4fjxy477rsg4td18q8asw4vsu UNIQUE (session_id, question_id);

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT uk5xwk8qmvsk4w7474r38po24wv UNIQUE (class_qr);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);

ALTER TABLE ONLY public.user_target_parts
    ADD CONSTRAINT uk6q5se2jfi0ab3ajh5ibsxut5h UNIQUE (user_target_id, exam_part_id);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT uk716hgxp60ym1lifrdgp67xt5k UNIQUE (role_name);

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT uk71lqwbwtklmljk3qlsugr1mig UNIQUE (token);

ALTER TABLE ONLY public.post_category
    ADD CONSTRAINT uk7cnxodp168tbeg2iabhmy6s4l UNIQUE (post_id, category_id);

ALTER TABLE ONLY public.question_collections
    ADD CONSTRAINT uk7f1f7xl8yg1539enlhmbvrfnu UNIQUE (name);

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT uk7lcb6glmvwlro3p2w2cewxtvd UNIQUE (code);

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT uk85woe63nu9klkk9fa73vf0jd0 UNIQUE (name);

ALTER TABLE ONLY public.exam_target_milestones
    ADD CONSTRAINT uk8n7i1fqt2w0y64kxiurxk7xgf UNIQUE (exam_type_id, milestone_score);

ALTER TABLE ONLY public.question_tags
    ADD CONSTRAINT uk9t4a94ufd5976udsx20t7w2aq UNIQUE (question_id, tag_id);

ALTER TABLE ONLY public.scoring_conversion
    ADD CONSTRAINT uk_scoring UNIQUE (exam_type_id, skill_id, num_correct);

ALTER TABLE ONLY public.user_question_exposures
    ADD CONSTRAINT ukd4q85es1xvpb1fjdrvv2g9gtm UNIQUE (user_id, question_id);

ALTER TABLE ONLY public.reacts
    ADD CONSTRAINT ukd5lb8ey6jhsc5m5r4qwrk5ukk UNIQUE (post_id, user_id);

ALTER TABLE ONLY public.user_targets
    ADD CONSTRAINT uke0blwepqxcjf784pr43fwmucs UNIQUE (user_id, exam_type_id);

ALTER TABLE ONLY public.user_quest_claims
    ADD CONSTRAINT ukf15vrhvpfw6xj6b1io89x6lx3 UNIQUE (user_id, quest_id);

ALTER TABLE ONLY public.learning_plan_session_questions
    ADD CONSTRAINT ukf65xg4dgsb50po0u5spxkjmb5 UNIQUE (session_id, question_id);

ALTER TABLE ONLY public.exam_categories
    ADD CONSTRAINT ukfcopm8fap7smuixmp4acwefa9 UNIQUE (code);

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT ukhfel5swpy9pyu7wryg6w2xpiv UNIQUE (user_test_id, question_id);

ALTER TABLE ONLY public.user_coins
    ADD CONSTRAINT ukhte466vy2ybx7erebgqny0f2 UNIQUE (user_id);

ALTER TABLE ONLY public.resource_tags
    ADD CONSTRAINT uki4b6mqvgfw890rohtr9ytjkqo UNIQUE (resource_id, tag_id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT ukk8d0f2n7n88w1a16yhua64onx UNIQUE (user_name);

ALTER TABLE ONLY public.user_test_accesses
    ADD CONSTRAINT ukltiy1u964hahtpsg84qdv8god UNIQUE (user_id, test_id);

ALTER TABLE ONLY public.target_part_requirements
    ADD CONSTRAINT uknpkptmd2wqlymmn8uf1f4cerv UNIQUE (exam_target_milestone_id, exam_part_id);

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT ukohm7b8slvdgmrmgisi5sg2uye UNIQUE (user_id);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT ukoul14ho7bctbefv8jywp5v3i2 UNIQUE (slug);

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT ukrp4caf9aruyad4113wv29bowp UNIQUE (post_id, user_id);

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT ukt43p6aampim70fxxnkid1mibj UNIQUE (role_id, permission_id);

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT user_answers_pkey PRIMARY KEY (user_answer_id);

ALTER TABLE ONLY public.user_coins
    ADD CONSTRAINT user_coins_pkey PRIMARY KEY (user_coin_id);

ALTER TABLE ONLY public.user_cosmetics
    ADD CONSTRAINT user_cosmetics_pkey PRIMARY KEY (user_cosmetic_id);

ALTER TABLE ONLY public.user_quest_claims
    ADD CONSTRAINT user_quest_claims_pkey PRIMARY KEY (user_quest_claim_id);

ALTER TABLE ONLY public.user_question_exposures
    ADD CONSTRAINT user_question_exposures_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_pkey PRIMARY KEY (user_streak_id);

ALTER TABLE ONLY public.user_target_parts
    ADD CONSTRAINT user_target_parts_pkey PRIMARY KEY (user_target_part_id);

ALTER TABLE ONLY public.user_targets
    ADD CONSTRAINT user_targets_pkey PRIMARY KEY (user_target_id);

ALTER TABLE ONLY public.user_test_accesses
    ADD CONSTRAINT user_test_accesses_pkey PRIMARY KEY (user_test_access_id);

ALTER TABLE ONLY public.user_tests
    ADD CONSTRAINT user_tests_pkey PRIMARY KEY (user_test_id);

ALTER TABLE ONLY public.user_vocabulary
    ADD CONSTRAINT user_vocabulary_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);

ALTER TABLE ONLY public.vocabulary_album
    ADD CONSTRAINT vocabulary_album_pkey PRIMARY KEY (album_id);

ALTER TABLE ONLY public.vocabulary
    ADD CONSTRAINT vocabulary_pkey PRIMARY KEY (vocab_id);

CREATE INDEX idx_answers_question_id ON public.answers USING btree (question_id);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

CREATE INDEX idx_chapters_class_id ON public.chapters USING btree (class_id);

CREATE INDEX idx_class_members_class_id ON public.class_members USING btree (class_id);

CREATE INDEX idx_class_members_user_id ON public.class_members USING btree (user_id);

CREATE INDEX idx_classes_teacher_id ON public.classes USING btree (teacher_id);

CREATE INDEX idx_comments_parent_id ON public.comments USING btree (parent_id);

CREATE INDEX idx_comments_post_id ON public.comments USING btree (post_id);

CREATE INDEX idx_comments_user_id ON public.comments USING btree (user_id);

CREATE INDEX idx_email_verifications_token ON public.email_verifications USING btree (token);

CREATE INDEX idx_email_verifications_user_id ON public.email_verifications USING btree (user_id);

CREATE INDEX idx_evaluation_user_id ON public.evaluation USING btree (user_id);

CREATE INDEX idx_exam_parts_exam_type_id ON public.exam_parts USING btree (exam_type_id);

CREATE INDEX idx_exam_parts_skill_id ON public.exam_parts USING btree (skill_id);

CREATE INDEX idx_exam_types_parent_id ON public.exam_types USING btree (parent_id);

CREATE INDEX idx_learning_plan_phases_exam_part_id ON public.learning_plan_phases USING btree (exam_part_id);

CREATE INDEX idx_learning_plan_phases_learning_plan_id ON public.learning_plan_phases USING btree (learning_plan_id);

CREATE INDEX idx_learning_plan_sessions_plan_status ON public.learning_plan_sessions USING btree (learning_plan_id, status);

CREATE INDEX idx_learning_plan_sessions_resource_id ON public.learning_plan_sessions USING btree (resource_id);

CREATE INDEX idx_learning_plan_sessions_task_id ON public.learning_plan_sessions USING btree (task_id);

CREATE INDEX idx_learning_plan_tasks_exam_part_id ON public.learning_plan_tasks USING btree (exam_part_id);

CREATE INDEX idx_learning_plan_tasks_plan ON public.learning_plan_tasks USING btree (learning_plan_id, task_order);

CREATE INDEX idx_learning_plan_tasks_plan_part ON public.learning_plan_tasks USING btree (learning_plan_id, exam_part_id, task_order);

CREATE INDEX idx_learning_plan_tasks_tag_id ON public.learning_plan_tasks USING btree (tag_id);

CREATE INDEX idx_learning_plans_current_task_id ON public.learning_plans USING btree (current_task_id);

CREATE INDEX idx_learning_plans_exam_type_id ON public.learning_plans USING btree (exam_type_id);

CREATE INDEX idx_learning_plans_replaced_by_plan_id ON public.learning_plans USING btree (replaced_by_plan_id);

CREATE INDEX idx_learning_plans_source_user_test_id ON public.learning_plans USING btree (source_user_test_id);

CREATE INDEX idx_learning_plans_user_id ON public.learning_plans USING btree (user_id);

CREATE INDEX idx_learning_plans_user_target_id ON public.learning_plans USING btree (user_target_id);

CREATE INDEX idx_lps_answers_question_id ON public.learning_plan_session_answers USING btree (question_id);

CREATE INDEX idx_lps_answers_selected_answer_id ON public.learning_plan_session_answers USING btree (selected_answer_id);

CREATE INDEX idx_lps_questions_question_id ON public.learning_plan_session_questions USING btree (question_id);

CREATE INDEX idx_passage_media_passage_id ON public.passage_media USING btree (passage_id);

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);

CREATE INDEX idx_post_category_category_id ON public.post_category USING btree (category_id);

CREATE INDEX idx_posts_user_id ON public.posts USING btree (user_id);

CREATE INDEX idx_question_collections_exam_type_id ON public.question_collections USING btree (exam_type_id);

CREATE INDEX idx_question_collections_parent_id ON public.question_collections USING btree (parent_id);

CREATE INDEX idx_question_tags_tag_id ON public.question_tags USING btree (tag_id);

CREATE INDEX idx_questions_chapter_id ON public.questions USING btree (chapter_id);

CREATE INDEX idx_questions_class_id ON public.questions USING btree (class_id);

CREATE INDEX idx_questions_collection_id ON public.questions USING btree (collection_id);

CREATE INDEX idx_questions_exam_part_id ON public.questions USING btree (exam_part_id);

CREATE INDEX idx_questions_passage_id ON public.questions USING btree (passage_id);

CREATE INDEX idx_reacts_user_id ON public.reacts USING btree (user_id);

CREATE INDEX idx_resource_tags_tag_id ON public.resource_tags USING btree (tag_id);

CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions USING btree (permission_id);

CREATE INDEX idx_saved_posts_user_id ON public.saved_posts USING btree (user_id);

CREATE INDEX idx_scoring_conversion_skill_id ON public.scoring_conversion USING btree (skill_id);

CREATE INDEX idx_tags_exam_type_id ON public.tags USING btree (exam_type_id);

CREATE INDEX idx_tags_parent_id ON public.tags USING btree (parent_id);

CREATE INDEX idx_target_part_requirements_exam_part_id ON public.target_part_requirements USING btree (exam_part_id);

CREATE INDEX idx_test_parts_exam_part_id ON public.test_parts USING btree (exam_part_id);

CREATE INDEX idx_test_parts_test_id ON public.test_parts USING btree (test_id);

CREATE INDEX idx_test_questions_question_id ON public.test_questions USING btree (question_id);

CREATE INDEX idx_test_questions_test_part_id ON public.test_questions USING btree (test_part_id);

CREATE INDEX idx_tests_chapter_id ON public.tests USING btree (chapter_id);

CREATE INDEX idx_tests_class_id ON public.tests USING btree (class_id);

CREATE INDEX idx_tests_collection_id ON public.tests USING btree (collection_id);

CREATE INDEX idx_tests_exam_category_id ON public.tests USING btree (exam_category_id);

CREATE INDEX idx_tests_exam_type_id ON public.tests USING btree (exam_type_id);

CREATE INDEX idx_user_answers_question_id ON public.user_answers USING btree (question_id);

CREATE INDEX idx_user_answers_selected_answer_id ON public.user_answers USING btree (selected_answer_id);

CREATE INDEX idx_user_coins_user_id ON public.user_coins USING btree (user_id);

CREATE INDEX idx_user_cosmetics_cosmetic_id ON public.user_cosmetics USING btree (cosmetic_id);

CREATE INDEX idx_user_quest_claims_quest_id ON public.user_quest_claims USING btree (quest_id);

CREATE INDEX idx_user_question_exposures_question_id ON public.user_question_exposures USING btree (question_id);

CREATE INDEX idx_user_streaks_user_id ON public.user_streaks USING btree (user_id);

CREATE INDEX idx_user_target_parts_exam_part_id ON public.user_target_parts USING btree (exam_part_id);

CREATE INDEX idx_user_target_parts_last_user_test_id ON public.user_target_parts USING btree (last_user_test_id);

CREATE INDEX idx_user_targets_exam_type_id ON public.user_targets USING btree (exam_type_id);

CREATE INDEX idx_user_test_accesses_test_id ON public.user_test_accesses USING btree (test_id);

CREATE INDEX idx_user_tests_test_id ON public.user_tests USING btree (test_id);

CREATE INDEX idx_user_tests_user_id ON public.user_tests USING btree (user_id);

CREATE INDEX idx_user_vocabulary_user_id ON public.user_vocabulary USING btree (user_id);

CREATE INDEX idx_user_vocabulary_vocab_id ON public.user_vocabulary USING btree (vocab_id);

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);

CREATE INDEX idx_vocabulary_album_id ON public.vocabulary USING btree (album_id);

CREATE INDEX idx_vocabulary_album_user_id ON public.vocabulary_album USING btree (user_id);

