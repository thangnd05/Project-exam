package com.project_exam.backend.modules.vocabulary.lookup.service;

import com.project_exam.backend.modules.vocabulary.lookup.domain.DictionaryResult;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class DictionaryApiService {
    private final RestTemplate restTemplate = new RestTemplate();

    public DictionaryResult fetchWordInfo(String word) {
        String text = null;
        String audio = null;

        try {

            String url = "https://api.dictionaryapi.dev/api/v2/entries/en/"
                    + URLEncoder.encode(word, StandardCharsets.UTF_8);

            ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode body = response.getBody();

                if (body != null && body.isArray() && body.size() > 0) {
                    JsonNode first = body.get(0);

                    JsonNode phonetics = first.path("phonetics");
                    for (JsonNode phonetic : phonetics) {
                        String textCandidate = phonetic.path("text").asText();
                        if (text == null || text.isEmpty()) {
                            text = textCandidate;
                        }
                    }

                    if (text == null || text.isEmpty()) {
                        text = first.path("phonetic").asText();
                    }
                }
            }
        } catch (Exception e) {

        }

        audio = "https://translate.google.com/translate_tts?ie=UTF-8&q="
                + URLEncoder.encode(word, StandardCharsets.UTF_8)
                + "&tl=en&client=tw-ob";

        return new DictionaryResult(text, audio);
    }
}
