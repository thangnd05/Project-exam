package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeRequest;
import com.project_exam.backend.modules.assessment.exam.mapper.ExamTypeMapper;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ExamTypeServiceSlugTest {

    private ExamTypeRepository repository;
    private ExamTypeService service;

    @BeforeEach
    void setUp() {
        repository = mock(ExamTypeRepository.class);
        service = new ExamTypeService(repository, new ExamTypeMapper(), mock(ExamPartRepository.class),
                mock(TestRepository.class));
        when(repository.save(any(ExamType.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private static ExamTypeRequest request(String name, String slug) {
        ExamTypeRequest request = new ExamTypeRequest();
        request.setName(name);
        request.setSlug(slug);
        return request;
    }

    private ExamType existing() {
        ExamType type = new ExamType();
        type.setExamTypeId("id-1");
        type.setName("AWS Solutions Architect (SAA-C03)");
        type.setSlug("saa-c03");
        when(repository.findById("id-1")).thenReturn(Optional.of(type));
        return type;
    }

    @Test
    void taoMoiVoiSlugHopLeThiLuuDungSlug() {
        assertEquals("saa-c03", service.create(request("AWS Solutions Architect (SAA-C03)", "saa-c03")).getSlug());
    }

    @Test
    void taoMoiKhongNhapSlugThiBaoLoi() {
        assertThrows(BadRequestException.class, () -> service.create(request("Toeic", null)));
        assertThrows(BadRequestException.class, () -> service.create(request("Toeic", "  ")));
    }

    @Test
    void slugSaiDinhDangThiBaoLoi() {
        assertThrows(BadRequestException.class, () -> service.create(request("Bất kỳ", "SAA-C03")));
        assertThrows(BadRequestException.class, () -> service.create(request("Bất kỳ", "đề thi")));
        assertThrows(BadRequestException.class, () -> service.create(request("Bất kỳ", "-saa--c03-")));
    }

    @Test
    void slugTrungDuongDanHeThongThiBaoLoi() {
        assertThrows(BadRequestException.class, () -> service.create(request("Bất kỳ", "collections")));
    }

    @Test
    void slugDaCoKyThiKhacDungThiBaoTrung() {
        when(repository.existsBySlug("saa-c03")).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.create(request("Đề mới", "saa-c03")));
    }

    @Test
    void suaKhongGuiSlugThiGiuSlugCu() {
        existing();

        assertEquals("saa-c03", service.update("id-1", request("Tên mới (SAA-C04)", null)).getSlug());
    }

    @Test
    void suaVoiSlugMoiThiDoiSlug() {
        existing();

        assertEquals("saa-c04", service.update("id-1", request(null, "saa-c04")).getSlug());
    }

    @Test
    void timTheoSlugKhongPhanBietHoaThuong() {
        ExamType type = existing();
        when(repository.findBySlug("saa-c03")).thenReturn(Optional.of(type));

        assertEquals("id-1", service.findBySlug("SAA-C03").getExamTypeId());
    }
}
