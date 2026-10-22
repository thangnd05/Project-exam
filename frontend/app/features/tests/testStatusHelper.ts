type TestScheduleLike = {
  testId?: string | number;
  availableFrom?: string | null;
  availableTo?: string | null;
  canDoTest?: boolean | null;
  maxAttempts?: number | null;
  remainingAttempts?: number | null;
};

// Trả key dịch (namespace Tests: status.*, action.*) thay cho nhãn, nơi gọi tự dịch theo ngôn ngữ đang dùng.
export type TestStatusLabelKey = 'live' | 'upcoming' | 'ended' | 'noAttempts';
export type TestStatusButtonKey =
  | 'start'
  | 'opensIn'
  | 'notOpen'
  | 'deadlinePassed'
  | 'attemptsExceeded';

export type TestStatusInfo = {
  status: 'open' | 'locked' | 'expired';
  statusLabelKey: TestStatusLabelKey;
  buttonKey: TestStatusButtonKey;
  // Thời gian còn lại tới lúc mở đề (ms), chỉ có khi buttonKey = 'opensIn'.
  remainingMs?: number;
  canStart: boolean;
};

// Tách mili-giây đếm ngược thành phút/giây cho key Tests.action.countdown.
export const splitCountdown = (ms: number): { minutes: number; seconds: number } => {
    const totalSeconds = Math.floor(ms / 1000);
    return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
};

export const getTestStatus = (
    test: TestScheduleLike,
    now: Date,
    countdowns?: Record<string | number, number> | null,
): TestStatusInfo => {
    const availableFrom = test.availableFrom ? new Date(test.availableFrom) : null;
    const availableTo = test.availableTo ? new Date(test.availableTo) : null;
    const remainingTime = test.testId != null ? countdowns?.[test.testId] : undefined;

    let status: TestStatusInfo['status'] = 'open';
    let statusLabelKey: TestStatusLabelKey = 'live';
    let buttonKey: TestStatusButtonKey = 'start';
    let remainingMs: number | undefined;
    let canStart = true;

    if (availableFrom && now < availableFrom) {
        status = 'locked';
        statusLabelKey = 'upcoming';
        if (remainingTime) {
            buttonKey = 'opensIn';
            remainingMs = remainingTime;
        } else {
            buttonKey = 'notOpen';
        }
        canStart = false;
    } else if (availableTo && now > availableTo) {
        status = 'expired';
        statusLabelKey = 'ended';
        buttonKey = 'deadlinePassed';
        canStart = false;
    } else if (test.canDoTest === false) {
        status = 'expired';
        statusLabelKey = 'noAttempts';
        buttonKey = 'attemptsExceeded';
        canStart = false;
    } else if (test.maxAttempts != null && test.remainingAttempts === 0) {
        status = 'expired';
        statusLabelKey = 'noAttempts';
        buttonKey = 'attemptsExceeded';
        canStart = false;
    }

    return { status, statusLabelKey, buttonKey, remainingMs, canStart };
};
