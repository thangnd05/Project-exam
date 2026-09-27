-- Nhiệm vụ tân thủ: làm bài -> đặt mục tiêu -> tạo lộ trình -> học bài đầu, mỗi bước thưởng xu một lần.
ALTER TABLE gamification.quests DROP CONSTRAINT IF EXISTS quests_condition_type_check;
ALTER TABLE gamification.quests ADD CONSTRAINT quests_condition_type_check CHECK (
    condition_type IN (
        'NONE', 'COMPLETE_TEST', 'STREAK_DAYS', 'CREATE_LEARNING_PLAN', 'COMPLETE_LEARNING_PLAN',
        'SET_TARGET', 'COMPLETE_PLAN_TASK'
    )
);

INSERT INTO gamification.quests
    (quest_id, title, description, reward_coins, condition_type, condition_target, active, created_at)
VALUES
    (gen_random_uuid()::text, 'Làm bài kiểm tra đầu tiên',
     'Làm một bài kiểm tra nhanh để WinDe biết bạn đang ở đâu.',
     20, 'COMPLETE_TEST', 1, true, now()),
    (gen_random_uuid()::text, 'Đặt mục tiêu điểm số',
     'Chọn kỳ thi và mức điểm bạn muốn đạt, WinDe sẽ tính phần còn thiếu.',
     20, 'SET_TARGET', 1, true, now()),
    (gen_random_uuid()::text, 'Tạo lộ trình học',
     'Sinh lộ trình ôn tập riêng theo mục tiêu và kết quả bài làm của bạn.',
     30, 'CREATE_LEARNING_PLAN', 1, true, now()),
    (gen_random_uuid()::text, 'Hoàn thành bài học đầu tiên',
     'Qua một nhiệm vụ trong lộ trình để bắt đầu chuỗi ngày học.',
     50, 'COMPLETE_PLAN_TASK', 1, true, now());
