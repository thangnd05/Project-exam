package com.project_exam.backend.modules.assessment.target.service;

import com.project_exam.backend.modules.assessment.target.domain.ExamTargetMilestone;
import com.project_exam.backend.modules.assessment.target.domain.TargetPartRequirement;
import com.project_exam.backend.modules.assessment.target.dto.*;
import com.project_exam.backend.modules.assessment.target.mapper.MilestoneMapper;
import com.project_exam.backend.modules.assessment.target.repository.ExamTargetMilestoneRepository;
import com.project_exam.backend.modules.assessment.target.repository.TargetPartRequirementRepository;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class MilestoneService {

    private final ExamTargetMilestoneRepository milestoneRepository;
    private final TargetPartRequirementRepository partRequirementRepository;
    private final MilestoneMapper milestoneMapper;

    public List<MilestoneResponse> findByExamTypeId(String examTypeId) {
        return milestoneRepository.findByExamTypeIdOrderByCreatedAtAsc(examTypeId).stream()
                .map(this::toResponse)
                .toList();
    }

    public MilestoneResponse findById(String id) {
        ExamTargetMilestone m = milestoneRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone không tồn tại"));
        return toResponse(m);
    }

    @Transactional
    public MilestoneResponse create(MilestoneRequest request) {
        ExamTargetMilestone m = new ExamTargetMilestone();
        m.setExamTypeId(request.getExamTypeId());
        m.setMilestoneScore(request.getMilestoneScore());
        m.setDescription(request.getDescription());
        m = milestoneRepository.save(m);

        if (request.getPartRequirements() != null) {
            savePartRequirements(m.getExamTargetMilestoneId(), request.getPartRequirements());
        }

        return toResponse(m);
    }

    @Transactional
    public MilestoneResponse update(String id, MilestoneRequest request) {
        ExamTargetMilestone m = milestoneRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone không tồn tại"));

        if (request.getMilestoneScore() != null) m.setMilestoneScore(request.getMilestoneScore());
        if (request.getDescription() != null) m.setDescription(request.getDescription());
        m = milestoneRepository.save(m);

        if (request.getPartRequirements() != null) {
            partRequirementRepository.deleteByExamTargetMilestoneId(id);
            partRequirementRepository.flush();
            savePartRequirements(id, request.getPartRequirements());
        }

        return toResponse(m);
    }

    @Transactional
    public void delete(String id) {
        ExamTargetMilestone m = milestoneRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone không tồn tại"));
        partRequirementRepository.deleteByExamTargetMilestoneId(id);
        milestoneRepository.delete(m);
    }

    private void savePartRequirements(String milestoneId, List<PartRequirementDto> dtos) {
        List<TargetPartRequirement> entities = new ArrayList<>();
        for (PartRequirementDto dto : dtos) {
            TargetPartRequirement r = new TargetPartRequirement();
            r.setExamTargetMilestoneId(milestoneId);
            r.setExamPartId(dto.getExamPartId());
            r.setRequiredPercentage(dto.getRequiredPercentage());
            entities.add(r);
        }
        partRequirementRepository.saveAll(entities);
    }

    private MilestoneResponse toResponse(ExamTargetMilestone m) {
        List<TargetPartRequirement> parts = partRequirementRepository
                .findByExamTargetMilestoneId(m.getExamTargetMilestoneId());
        List<PartRequirementResponse> partResponses = parts.stream()
                .map(milestoneMapper::toPartRequirementResponse)
                .toList();

        return milestoneMapper.toResponse(m, partResponses);
    }
}
