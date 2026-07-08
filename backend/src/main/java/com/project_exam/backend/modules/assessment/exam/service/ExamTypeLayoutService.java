package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.domain.ExamTypeLayout;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeLayoutRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeLayoutResponse;
import com.project_exam.backend.modules.assessment.exam.mapper.ExamTypeLayoutMapper;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeLayoutRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ExamTypeLayoutService {

    private final ExamTypeLayoutRepository layoutRepository;
    private final ExamTypeRepository examTypeRepository;
    private final ExamTypeLayoutMapper layoutMapper;

    /**
     * Layout dùng cho trang làm bài: lấy của examType lá; nếu chưa có thì fallback lên examType cha.
     * Trả null khi không cấu hình ở cả 2 cấp -> FE dùng layout mặc định.
     */
    public ExamTypeLayoutResponse getResolved(String examTypeId) {
        ExamType examType = examTypeRepository.findById(examTypeId)
                .orElseThrow(() -> new NotFoundException("Loại đề không tồn tại"));

        Optional<ExamTypeLayout> own = layoutRepository.findByExamTypeId(examTypeId);
        if (own.isPresent() && hasConfig(own.get())) {
            return layoutMapper.toResponse(own.get());
        }

        if (examType.getParentId() != null) {
            Optional<ExamTypeLayout> parent = layoutRepository.findByExamTypeId(examType.getParentId());
            if (parent.isPresent() && hasConfig(parent.get())) {
                return layoutMapper.toResponse(parent.get());
            }
        }
        return null;
    }

    /** Layout gắn TRỰC TIẾP vào examType (không fallback) — dùng cho editor admin. */
    public ExamTypeLayoutResponse getOwn(String examTypeId) {
        return layoutRepository.findByExamTypeId(examTypeId)
                .map(layoutMapper::toResponse)
                .orElse(null);
    }

    public ExamTypeLayoutResponse upsert(String examTypeId, ExamTypeLayoutRequest request) {
        if (!examTypeRepository.existsById(examTypeId)) {
            throw new NotFoundException("Loại đề không tồn tại");
        }
        ExamTypeLayout layout = layoutRepository.findByExamTypeId(examTypeId)
                .orElseGet(() -> {
                    ExamTypeLayout created = new ExamTypeLayout();
                    created.setExamTypeId(examTypeId);
                    created.setCreatedAt(LocalDateTime.now());
                    return created;
                });
        layout.setConfig(request.getConfig());
        layout.setUpdatedAt(LocalDateTime.now());
        return layoutMapper.toResponse(layoutRepository.save(layout));
    }

    private boolean hasConfig(ExamTypeLayout layout) {
        return layout.getConfig() != null && !layout.getConfig().isBlank();
    }
}
