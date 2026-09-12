package com.project_exam.backend.modules.system.mail.service;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class MailTemplateRenderer {

    private static final Pattern VARIABLE = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_]+)\\s*}}");

    public String render(String template, Map<String, String> variables) {
        if (template == null || template.isBlank()) {
            return "";
        }
        Matcher matcher = VARIABLE.matcher(template);
        StringBuilder result = new StringBuilder();
        while (matcher.find()) {
            String value = variables.get(matcher.group(1));

            matcher.appendReplacement(result, Matcher.quoteReplacement(value != null ? value : matcher.group(0)));
        }
        matcher.appendTail(result);
        return result.toString();
    }
}
