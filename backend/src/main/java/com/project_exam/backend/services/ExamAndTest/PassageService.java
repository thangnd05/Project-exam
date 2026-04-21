package com.project_exam.backend.services.ExamAndTest;

import com.project_exam.backend.models.Passage;
import com.project_exam.backend.repositories.PassageRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PassageService {

    private final PassageRepository passageRepository;

    public PassageService(PassageRepository passageRepository) {
        this.passageRepository = passageRepository;
    }

    public List<Passage> findAll() {
        return passageRepository.findAll();
    }

    public Optional<Passage> findById(String id) {
        return passageRepository.findById(id);
    }

    public Passage save(Passage passage) {
        return passageRepository.save(passage);
    }

    public void deleteById(String id) {
        passageRepository.deleteById(id);
    }
}
