// utils/testStatusHelper.js

export const formatCountdown = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}p ${s}s`;
};

export const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const getTestStatus = (test, now, countdowns) => {
    const availableFrom = test.availableFrom ? new Date(test.availableFrom) : null;
    const availableTo = test.availableTo ? new Date(test.availableTo) : null;
    const remainingTime = countdowns?.[test.testId];

    let status = 'open';
    let statusLabel = 'Đang diễn ra';
    let buttonText = 'Bắt đầu làm bài';
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

export const calculateAllowedTime = (test) => {
    const now = new Date();
    const availableTo = test.availableTo ? new Date(test.availableTo) : null;

    // Nếu không giới hạn thời gian
    if (!test.durationMinutes || test.durationMinutes <= 0) {
        return null;   // ← QUAN TRỌNG
    }

    let allowedTime = test.durationMinutes * 60;

    if (availableTo) {
        const timeUntilClose = Math.floor((availableTo - now) / 1000);
        if (timeUntilClose < allowedTime) {
            allowedTime = timeUntilClose;
        }
    }

    return allowedTime;
};