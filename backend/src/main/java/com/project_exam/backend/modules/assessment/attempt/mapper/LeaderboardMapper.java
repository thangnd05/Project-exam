package com.project_exam.backend.modules.assessment.attempt.mapper;

import com.project_exam.backend.modules.assessment.attempt.dto.TestLeaderboardResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.UserTestResponse;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Mapper thuần cho bảng xếp hạng (sub-module ASSESSMENT/ATTEMPT).
 * entries/me/totalParticipants do service tính (xếp hạng, tìm hạng người xem, cắt top)
 * rồi truyền vào.
 */
@Component
public class LeaderboardMapper {

    /** Shape rỗng: chưa được phép xem điểm (entries=[], me=null, totalParticipants=0). */
    public TestLeaderboardResponse toEmpty() {
        return TestLeaderboardResponse.builder()
                .entries(Collections.emptyList())
                .me(null)
                .totalParticipants(0)
                .build();
    }

    /** Shape đầy đủ: entries (đã cắt top), me (hạng người xem, có thể null), tổng số người. */
    public TestLeaderboardResponse toResponse(
            List<UserTestResponse> entries,
            TestLeaderboardResponse.MyRank me,
            int totalParticipants) {
        return TestLeaderboardResponse.builder()
                .entries(entries)
                .me(me)
                .totalParticipants(totalParticipants)
                .build();
    }

    public TestLeaderboardResponse.MyRank toMyRank(
            int rank,
            String userTestId,
            Integer totalScore,
            Long durationTaken) {
        return TestLeaderboardResponse.MyRank.builder()
                .rank(rank)
                .userTestId(userTestId)
                .totalScore(totalScore)
                .durationTaken(durationTaken)
                .build();
    }
}
