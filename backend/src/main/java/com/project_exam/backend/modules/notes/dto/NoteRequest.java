package com.project_exam.backend.modules.notes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NoteRequest {

    @NotBlank(message = "Tiêu đề ghi chú không được để trống.")
    @Size(max = 200, message = "Tiêu đề ghi chú tối đa 200 ký tự.")
    private String title;

    @Size(max = 20000, message = "Nội dung ghi chú tối đa 20.000 ký tự.")
    private String content;
}
