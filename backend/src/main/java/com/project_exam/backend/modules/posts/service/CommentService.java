package com.project_exam.backend.modules.posts.service;

import com.project_exam.backend.modules.posts.dto.CommentRequest;
import com.project_exam.backend.modules.posts.dto.CommentResponse;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.modules.posts.domain.Comment;
import com.project_exam.backend.modules.posts.repository.CommentRepository;
import com.project_exam.backend.modules.posts.repository.PostRepository;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final AuthUtils authUtils;
    private final com.project_exam.backend.modules.users.repository.UserRepository userRepository;

    private CommentResponse toResponse(Comment c, List<CommentResponse> replies) {
        String authorName = "Unknown";
        String authorAvatar = null;
        
        var authorOpt = userRepository.findById(c.getUserId());
        if (authorOpt.isPresent()) {
            authorName = authorOpt.get().getFullName();
            authorAvatar = authorOpt.get().getAvatarUrl();
        }

        return CommentResponse.builder()
                .id(c.getId())
                .postId(c.getPostId())
                .userId(c.getUserId())
                .authorName(authorName)
                .authorAvatar(authorAvatar)
                .parentId(c.getParentId())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .replies(replies)
                .build();
    }

    /**
     * Lấy toàn bộ comments của post và xây dựng cấu trúc cây (đa cấp)
     */
    public List<CommentResponse> getCommentsByPost(String postId) {
        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Post không tồn tại");
        }

        // 1. Lấy tất cả comments của post
        List<Comment> allComments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        
        // 2. Chuyển sang DTO (chưa có replies)
        List<CommentResponse> allDtos = allComments.stream()
                .map(c -> toResponse(c, new ArrayList<CommentResponse>()))
                .collect(Collectors.toList());

        // 3. Xây dựng cây bằng Map để đạt hiệu năng O(N)
        Map<String, CommentResponse> dtoMap = allDtos.stream()
                .collect(Collectors.toMap(CommentResponse::getId, dto -> dto));

        List<CommentResponse> rootComments = new ArrayList<>();
        for (CommentResponse dto : allDtos) {
            if (dto.getParentId() == null || dto.getParentId().isBlank()) {
                rootComments.add(dto);
            } else {
                CommentResponse parent = dtoMap.get(dto.getParentId());
                if (parent != null) {
                    if (parent.getReplies() == null) parent.setReplies(new ArrayList<CommentResponse>());
                    parent.getReplies().add(dto);
                }
            }
        }

        return rootComments;
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

    @jakarta.transaction.Transactional
    public CommentResponse updateComment(String id, CommentRequest request, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Comment không tồn tại"));

        if (!comment.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền sửa comment này");
        }

        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung comment không được trống");
        }

        comment.setContent(request.getContent().trim());
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
