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

    private String month;

    private long totalVisits;
    private List<String> availableMonths;
    private List<CountryTraffic> topCountries;
}
