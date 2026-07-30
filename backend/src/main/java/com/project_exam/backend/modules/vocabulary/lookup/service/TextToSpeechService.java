package com.project_exam.backend.modules.vocabulary.lookup.service;

import org.springframework.stereotype.Service;

@Service
public class TextToSpeechService {

    public String generateAudio(String word) {

        return "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q="
                + word + "&tl=en";
    }
}
