-- ============================================================================
-- Chuyển nốt toàn bộ cột thời gian sang timestamptz.
--
-- Trước migration này schema trộn 2 kiểu: 6 cột timestamptz (do V202607161 đổi
-- một phần) và 41 cột `timestamp without time zone`. Cùng lúc đó tầng Java trộn
-- Instant (8 field) với LocalDateTime (42 field). Trộn timezone-aware và naive
-- trong cùng một DB là nguồn lỗi thật khi deploy khác múi giờ.
--
-- Nay thống nhất: mọi field entity là java.time.Instant, mọi cột là timestamptz.
-- Việc quy đổi sang lịch địa phương (báo cáo theo ngày/tháng, chuỗi streak) dồn
-- về một chỗ duy nhất: shared/util/AppTime.java.
--
-- Wall-time đang lưu là GIỜ VN  cùng kết luận đã xác minh thực nghiệm ở
-- V202607161 (JVM tz Asia/Ho_Chi_Minh -> pgjdbc cast timestamptz về wall VN khi
-- ghi vào cột timestamp). Vì vậy convert bằng AT TIME ZONE 'Asia/Ho_Chi_Minh'
-- để giữ nguyên thời điểm thật. VN không có DST nên an toàn tuyệt đối.
-- ============================================================================


-- audit_logs
ALTER TABLE audit_logs
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- chapters
ALTER TABLE chapters
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- class_members
ALTER TABLE class_members
    ALTER COLUMN joined_at TYPE timestamptz
        USING joined_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- classes
ALTER TABLE classes
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- comments
ALTER TABLE comments
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- cosmetics
ALTER TABLE cosmetics
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- email_verifications
ALTER TABLE email_verifications
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE email_verifications
    ALTER COLUMN expires_at TYPE timestamptz
        USING expires_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- evaluation
ALTER TABLE evaluation
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- exam_categories
ALTER TABLE exam_categories
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- exam_target_milestones
ALTER TABLE exam_target_milestones
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- exam_type_layouts
ALTER TABLE exam_type_layouts
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE exam_type_layouts
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- notes
ALTER TABLE notes
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE notes
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- page_visits
ALTER TABLE page_visits
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- password_reset_tokens
ALTER TABLE password_reset_tokens
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE password_reset_tokens
    ALTER COLUMN expires_at TYPE timestamptz
        USING expires_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- posts
ALTER TABLE posts
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- quests
ALTER TABLE quests
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE quests
    ALTER COLUMN end_at TYPE timestamptz
        USING end_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE quests
    ALTER COLUMN start_at TYPE timestamptz
        USING start_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- saved_posts
ALTER TABLE saved_posts
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- streak_recover_config
ALTER TABLE streak_recover_config
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- tests
ALTER TABLE tests
    ALTER COLUMN available_from TYPE timestamptz
        USING available_from AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE tests
    ALTER COLUMN available_to TYPE timestamptz
        USING available_to AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE tests
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- user_coins
ALTER TABLE user_coins
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- user_cosmetics
ALTER TABLE user_cosmetics
    ALTER COLUMN owned_at TYPE timestamptz
        USING owned_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- user_quest_claims
ALTER TABLE user_quest_claims
    ALTER COLUMN claimed_at TYPE timestamptz
        USING claimed_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- user_streaks
ALTER TABLE user_streaks
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- user_target_parts
ALTER TABLE user_target_parts
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- user_targets
ALTER TABLE user_targets
    ALTER COLUMN achieved_at TYPE timestamptz
        USING achieved_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE user_targets
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE user_targets
    ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- user_test_accesses
ALTER TABLE user_test_accesses
    ALTER COLUMN purchased_at TYPE timestamptz
        USING purchased_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- user_tests
ALTER TABLE user_tests
    ALTER COLUMN finished_at TYPE timestamptz
        USING finished_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
ALTER TABLE user_tests
    ALTER COLUMN started_at TYPE timestamptz
        USING started_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- user_vocabulary
ALTER TABLE user_vocabulary
    ALTER COLUMN last_reviewed TYPE timestamptz
        USING last_reviewed AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- users
ALTER TABLE users
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- vocabulary
ALTER TABLE vocabulary
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- vocabulary_album
ALTER TABLE vocabulary_album
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
