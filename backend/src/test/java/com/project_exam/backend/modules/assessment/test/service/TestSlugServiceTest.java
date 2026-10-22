package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.dto.TestRefResponse;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.shared.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TestSlugServiceTest {

    private static final String TEST_ID = "01a0ce94-5191-7969-bf8d-cbed3e2dcb5b";

    private TestRepository repository;
    private TestSlugService service;

    @BeforeEach
    void setUp() {
        repository = mock(TestRepository.class);
        service = new TestSlugService(repository);
        when(repository.existsBySlug(anyString())).thenReturn(false);
    }

    private static Test test(String slug) {
        Test test = new Test();
        test.setTestId(TEST_ID);
        test.setSlug(slug);
        return test;
    }

    @org.junit.jupiter.api.Test
    void sinhSlugTuTenCoDauVaMaKyThi() {
        assertEquals("aws-dop-c02-test-1", service.generateUnique("AWS DOP-C02 Test 1"));
        assertEquals("de-thi-thu-so-1-dap-an", service.generateUnique("Đề thi thử số 1 (đáp án)"));
    }

    @org.junit.jupiter.api.Test
    void tenKhongConKyTuHopLeThiDungSlugMacDinh() {
        assertEquals("de-thi", service.generateUnique("!!!"));
        assertEquals("de-thi", service.generateUnique(null));
    }

    @org.junit.jupiter.api.Test
    void slugTrungDuongDanHeThongThiThemHauTo() {
        assertEquals("history-de", service.generateUnique("History"));
        assertEquals("leaderboard-de", service.generateUnique("Leaderboard"));
    }

    @org.junit.jupiter.api.Test
    void slugDaCoDeKhacDungThiThemSoTangDan() {
        when(repository.existsBySlug("aws-dop-c02-test-1")).thenReturn(true);
        when(repository.existsBySlug("aws-dop-c02-test-1-2")).thenReturn(true);
        assertEquals("aws-dop-c02-test-1-3", service.generateUnique("AWS DOP-C02 Test 1"));
    }

    @org.junit.jupiter.api.Test
    void traBangUuidThiTimTheoId() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(test("aws-dop-c02-test-1")));
        TestRefResponse ref = service.resolve(TEST_ID);
        assertEquals(TEST_ID, ref.getTestId());
        assertEquals("aws-dop-c02-test-1", ref.getSlug());
        verify(repository, never()).findBySlug(anyString());
    }

    @org.junit.jupiter.api.Test
    void traBangSlugKhongPhanBietHoaThuong() {
        when(repository.findBySlug("aws-dop-c02-test-1")).thenReturn(Optional.of(test("aws-dop-c02-test-1")));
        assertEquals(TEST_ID, service.resolve("AWS-DOP-C02-Test-1").getTestId());
    }

    @org.junit.jupiter.api.Test
    void khongCoDeThiBaoKhongTimThay() {
        when(repository.findBySlug("khong-ton-tai")).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.resolve("khong-ton-tai"));
    }
}
