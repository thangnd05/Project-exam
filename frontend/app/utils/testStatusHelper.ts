type TestScheduleLike = {
  testId?: string | number;
  availableFrom?: string | null;
  availableTo?: string | null;
  canDoTest?: boolean | null;
  maxAttempts?: number | null;
  remainingAttempts?: number | null;
  durationMinutes?: number | null;
};

export type TestStatusInfo = {
  status: 'open' | 'locked' | 'expired';
  statusLabel: string;
  buttonText: string;
  canStart: boolean;
};

export const formatCountdown = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}p ${s}s`;
};

export const formatDateTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatFullDateTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
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
    let statusLabel = 'Đang diễn ra';
    let buttonText = 'Bắt đầu';
    let canStart = true;

    if (availableFrom && now < availableFrom) {
        status = 'locked';
        statusLabel = 'Sắp mở';
        buttonText = remainingTime
            ? `Mở sau ${formatCountdown(remainingTime)}`
            : 'Chưa mở';
        canStart = false;
    } else if (availableTo && now > availableTo) {
        status = 'expired';
        statusLabel = 'Đã kết thúc';
        buttonText = 'Hết hạn nộp';
        canStart = false;
    } else if (test.canDoTest === false) {
        status = 'expired';
        statusLabel = 'Hết lượt';
        buttonText = 'Vượt quá lượt làm';
        canStart = false;
    } else if (test.maxAttempts != null && test.remainingAttempts === 0) {
        status = 'expired';
        statusLabel = 'Hết lượt';
        buttonText = 'Vượt quá lượt làm';
        canStart = false;
    }

    return { status, statusLabel, buttonText, canStart };
};

export const calculateAllowedTime = (test: TestScheduleLike): number | null => {
    const now = new Date();
    const availableTo = test.availableTo ? new Date(test.availableTo) : null;

    if (!test.durationMinutes || test.durationMinutes <= 0) {
        return null;
    }

    let allowedTime = test.durationMinutes * 60;

    if (availableTo) {
        const timeUntilClose = Math.floor((availableTo.getTime() - now.getTime()) / 1000);
        if (timeUntilClose < allowedTime) {
            allowedTime = timeUntilClose;
        }
    }

    return allowedTime;
};
