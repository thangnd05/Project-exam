package com.project_exam.backend.modules.analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class GeoIpService {

    private final Map<String, Country> cache = new ConcurrentHashMap<>();

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public record Country(String code, String name) {
        static final Country UNKNOWN = new Country(null, null);
        static final Country LOCAL = new Country("LO", "Local");
    }

    public Country resolve(String ip) {
        if (ip == null || ip.isBlank()) return Country.UNKNOWN;
        Country cached = cache.get(ip);
        if (cached != null) return cached;

        Country resolved = lookup(ip);

        if (resolved.code() != null) {
            cache.put(ip, resolved);
        }
        return resolved;
    }

    private Country lookup(String ip) {
        if (isInternal(ip)) return Country.LOCAL;
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://ip-api.com/json/" + ip + "?fields=status,countryCode,country"))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode node = objectMapper.readTree(response.body());
            if ("success".equals(node.path("status").asText())) {
                return new Country(node.path("countryCode").asText(null), node.path("country").asText(null));
            }
        } catch (Exception e) {
            log.debug("Geo-IP lookup thất bại cho {}: {}", ip, e.getMessage());
        }
        return Country.UNKNOWN;
    }

    private boolean isInternal(String ip) {
        try {
            InetAddress addr = InetAddress.getByName(ip);
            return addr.isLoopbackAddress() || addr.isAnyLocalAddress()
                    || addr.isSiteLocalAddress() || addr.isLinkLocalAddress();
        } catch (Exception e) {
            return true;
        }
    }
}
