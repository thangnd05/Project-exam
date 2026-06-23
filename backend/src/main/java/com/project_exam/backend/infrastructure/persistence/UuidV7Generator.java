package com.project_exam.backend.infrastructure.persistence;

import com.fasterxml.uuid.Generators;
import com.fasterxml.uuid.impl.TimeBasedEpochGenerator;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.generator.BeforeExecutionGenerator;
import org.hibernate.generator.EventType;

import java.util.EnumSet;

/**
 * Sinh UUID phiên bản 7 (time-ordered) cho các khóa chính dạng String.
 *
 * <p>Khác với UUID v4 (random) — giá trị rải ngẫu nhiên gây phân mảnh B-tree khi insert —
 * UUID v7 nhúng timestamp mili-giây ở phần đầu nên giá trị tăng dần theo thời gian tạo.
 * Nhờ đó các bản ghi mới được chèn tuần tự vào cuối index, giảm page-split, index gọn hơn.
 * Dạng chuỗi hex của v7 cũng sắp xếp đúng theo thứ tự thời gian.</p>
 */
public class UuidV7Generator implements BeforeExecutionGenerator {

    private static final TimeBasedEpochGenerator GENERATOR = Generators.timeBasedEpochGenerator();

    @Override
    public Object generate(SharedSessionContractImplementor session, Object owner,
                           Object currentValue, EventType eventType) {
        // Tôn trọng id đã được gán thủ công (vd. ClassEntity tự sinh mã trước khi persist)
        if (currentValue != null) {
            return currentValue;
        }
        return GENERATOR.generate().toString();
    }

    @Override
    public EnumSet<EventType> getEventTypes() {
        return EnumSet.of(EventType.INSERT);
    }
}
