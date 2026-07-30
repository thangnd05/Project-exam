

ALTER TABLE audit_logs
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE chapters
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE class_members
    ALTER COLUMN joined_at TYPE timestamptz
        USING joined_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE classes
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE comments
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE cosmetics
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE email_verifications
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE email_verifications
    ALTER COLUMN expires_at TYPE timestamptz
        USING expires_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE evaluation
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE exam_categories
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE exam_target_milestones
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE exam_type_layouts
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE exam_type_layouts
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE notes
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE notes
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE page_visits
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE password_reset_tokens
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE password_reset_tokens
    ALTER COLUMN expires_at TYPE timestamptz
        USING expires_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE posts
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE quests
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE quests
    ALTER COLUMN end_at TYPE timestamptz
        USING end_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE quests
    ALTER COLUMN start_at TYPE timestamptz
        USING start_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE saved_posts
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE streak_recover_config
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE tests
    ALTER COLUMN available_from TYPE timestamptz
        USING available_from AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE tests
    ALTER COLUMN available_to TYPE timestamptz
        USING available_to AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE tests
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE user_coins
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE user_cosmetics
    ALTER COLUMN owned_at TYPE timestamptz
        USING owned_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE user_quest_claims
    ALTER COLUMN claimed_at TYPE timestamptz
        USING claimed_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE user_streaks
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE user_target_parts
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE user_targets
    ALTER COLUMN achieved_at TYPE timestamptz
        USING achieved_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE user_targets
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE user_targets
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE user_test_accesses
    ALTER COLUMN purchased_at TYPE timestamptz
        USING purchased_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE user_tests
    ALTER COLUMN finished_at TYPE timestamptz
        USING finished_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE user_tests
    ALTER COLUMN started_at TYPE timestamptz
        USING started_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE user_vocabulary
    ALTER COLUMN last_reviewed TYPE timestamptz
        USING last_reviewed AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE users
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE vocabulary
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE vocabulary_album
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
