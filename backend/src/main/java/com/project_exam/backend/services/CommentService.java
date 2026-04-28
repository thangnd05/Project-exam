package com.project_exam.backend.services;

import com.project_exam.backend.dto.request.CommentRequest;
import com.project_exam.backend.dto.response.CommentResponse;
import com.project_exam.backend.exception.NotFoundException;
import com.project_exam.backend.models.Comment;
import com.project_exam.backend.repositories.CommentRepository;
import com.project_exam.backend.repositories.PostRepository;
import com.project_exam.backend.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final AuthUtils authUtils;

    private CommentResponse toResponse(Comment c, List<CommentResponse> replies) {
        return CommentResponse.builder()
                .id(c.getId())
                .postId(c.getPostId())
                .userId(c.getUserId())
                .parentId(c.getParentId())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .replies(replies)
                .build();
    }

    /**
     * Lấy comments dạng tree: top-level + replies lồng vào nhau (1 cấp)
     */
    public List<CommentResponse> getCommentsByPost(String postId) {
        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Post không tồn tại");
        }

        List<Comment> topLevel = commentRepository
                .findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(postId);

        return topLevel.stream().map(comment -> {
            List<CommentResponse> replies = commentRepository
                    .findByParentIdOrderByCreatedAtAsc(comment.getId())
                    .stream()
                    .map(reply -> toResponse(reply, null))
                    .collect(Collectors.toList());
            return toResponse(comment, replies);
        }).collect(Collectors.toList());
    }

    public CommentResponse addComment(String postId, CommentRequest request,
                                      HttpServletRequest httpRequest) {
        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Post không tồn tại");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung comment không được trống");
        }

        // Nếu là reply, kiểm tra parent comment tồn tại
        if (request.getParentId() != null && !request.getParentId().isBlank()) {
            Comment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new NotFoundException("Comment cha không tồn tại"));
            if (!parent.getPostId().equals(postId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment cha không thuộc post này");
            }
        }

        String userId = authUtils.getUserId(httpRequest);
        Comment comment = Comment.builder()
                .postId(postId)
                .userId(userId)
                .parentId((request.getParentId() != null && !request.getParentId().isBlank())
                        ? request.getParentId() : null)
                .content(request.getContent().trim())
                .build();

        comment = commentRepository.save(comment);
        return toResponse(comment, null);
    }

    public void deleteComment(String id, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Comment không tồn tại"));

        if (!comment.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa comment này");
        }
        commentRepository.delete(comment);
    }
}
