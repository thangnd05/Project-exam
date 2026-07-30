package com.project_exam.backend.modules.notes.repository;

import com.project_exam.backend.modules.notes.domain.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, String> {

    /** Ghi chú của user, mới sửa gần nhất xếp trước — thứ tự chốt ở BE, FE chỉ render. */
    List<Note> findAllByUserIdOrderByUpdatedAtDesc(String userId);
}
