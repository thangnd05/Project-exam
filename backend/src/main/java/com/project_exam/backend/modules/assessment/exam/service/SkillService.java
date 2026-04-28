package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.assessment.exam.dto.SkillRequest;
import com.project_exam.backend.modules.assessment.exam.dto.SkillResponse;
import com.project_exam.backend.modules.assessment.exam.domain.Skill;
import com.project_exam.backend.modules.assessment.exam.repository.SkillRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;

    public List<SkillResponse> findAll() {
        return skillRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public SkillResponse findById(String id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Skill không tồn tại"));
        return toResponse(skill);
    }

    public SkillResponse create(SkillRequest request) {
        Skill skill = new Skill();
        skill.setName(request.getName());
        skill.setDescription(request.getDescription());
        skill = skillRepository.save(skill);
        return toResponse(skill);
    }

    public SkillResponse update(String id, SkillRequest request) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Skill không tồn tại"));
        if (request.getName() != null) skill.setName(request.getName());
        if (request.getDescription() != null) skill.setDescription(request.getDescription());
        skill = skillRepository.save(skill);
        return toResponse(skill);
    }

    public void delete(String id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Skill không tồn tại"));
        skillRepository.delete(skill);
    }

    private SkillResponse toResponse(Skill skill) {
        SkillResponse response = new SkillResponse();
        response.setSkillId(skill.getSkillId());
        response.setName(skill.getName());
        response.setDescription(skill.getDescription());
        return response;
    }
}
