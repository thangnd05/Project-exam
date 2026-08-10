package com.project_exam.backend.modules.admin.dashboard.dto;

import com.project_exam.backend.modules.admin.dashboard.dto.DashboardStatsResponse.CountryTraffic;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrafficLocationsResponse {
    /** Tháng đang xem, định dạng yyyy-MM. */
    private String month;
    /** Tổng lượt truy cập (số phiên) từ IP công cộng trong tháng; bỏ qua truy cập local. */
    private long totalVisits;
    private List<String> availableMonths;
    private List<CountryTraffic> topCountries;
}
