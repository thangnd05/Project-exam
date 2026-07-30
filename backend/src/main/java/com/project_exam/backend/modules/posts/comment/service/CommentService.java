package com.project_exam.backend.modules.posts.comment.service;

import com.project_exam.backend.modules.posts.comment.dto.CommentRequest;
import com.project_exam.backend.modules.posts.comment.dto.CommentResponse;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.modules.posts.comment.domain.Comment;
import com.project_exam.backend.modules.posts.comment.mapper.CommentMapper;
import com.project_exam.backend.modules.posts.comment.repository.CommentRepository;
import com.project_exam.backend.modules.posts.post.repository.PostRepository;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.gamification.cosmetic.dto.EquippedCosmeticsResponse;
import com.project_exam.backend.modules.gamification.cosmetic.service.CosmeticService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final AuthUtils authUtils;
    private final com.project_exam.backend.modules.users.user.repository.UserRepository userRepository;
    private final CosmeticService cosmeticService;
    private final CommentMapper commentMapper;

    private CommentResponse toResponse(Comment c, List<CommentResponse> replies) {
        var authorOpt = userRepository.findById(c.getUserId());
        String authorName = authorOpt.map(User::getUserName).orElse("Unknown");
        String authorAvatar = authorOpt.map(User::getAvatarUrl).orElse(null);
        EquippedCosmeticsResponse equipped = cosmeticService.getEquipped(c.getUserId());
        return commentMapper.toResponse(c, replies, authorName, authorAvatar, equipped);
    }

    public List<CommentResponse> getCommentsByPost(String postId) {
        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Post không tồn tại");
        }

        List<Comment> allComments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);

        Set<String> authorIds = allComments.stream()
                .map(Comment::getUserId)
                .filter(id -> id != null && !id.isBlank())
                .collect(Collectors.toSet());
        Map<String, User> authorMap = authorIds.isEmpty()
                ? Map.of()
                : userRepository.findAllById(authorIds).stream()
                        .collect(Collectors.toMap(User::getUserId, u -> u));

        Map<String, EquippedCosmeticsResponse> equippedMap = cosmeticService.getEquippedForUsers(authorIds);

        List<CommentResponse> allDtos = allComments.stream()
                .map(c -> {
                    User author = authorMap.get(c.getUserId());
                    String name = author != null ? author.getUserName() : "Unknown";
                    String avatar = author != null ? author.getAvatarUrl() : null;
                    return commentMapper.toResponse(c, new ArrayList<CommentResponse>(), name, avatar,
                            equippedMap.get(c.getUserId()));
                })
                .collect(Collectors.toList());

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

    @Transactional
    public CommentResponse updateComment(String id, CommentRequest request, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Comment không tồn tại"));

        if (!comment.getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền sửa comment này");
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
            throw new ForbiddenException("Bạn không có quyền xóa comment này");
        }
        commentRepository.delete(comment);
    }
}
