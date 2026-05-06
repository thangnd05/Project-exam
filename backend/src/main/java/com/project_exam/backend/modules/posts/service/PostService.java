package com.project_exam.backend.modules.posts.service;

import com.project_exam.backend.infrastructure.cloudinary.CloudinaryService;
import com.project_exam.backend.modules.posts.domain.Category;
import com.project_exam.backend.modules.posts.domain.Post;
import com.project_exam.backend.modules.posts.domain.PostCategory;
import com.project_exam.backend.modules.posts.domain.PostImage;
import com.project_exam.backend.modules.posts.domain.React;
import com.project_exam.backend.modules.posts.dto.PostUpsertRequest;
import com.project_exam.backend.modules.posts.dto.CategoryResponse;
import com.project_exam.backend.modules.posts.dto.PostPageResponse;
import com.project_exam.backend.modules.posts.dto.PostResponse;
import com.project_exam.backend.modules.posts.dto.PostSummaryResponse;
import com.project_exam.backend.modules.posts.repository.CategoryRepository;
import com.project_exam.backend.modules.posts.repository.CommentRepository;
import com.project_exam.backend.modules.posts.repository.PostCategoryRepository;
import com.project_exam.backend.modules.posts.repository.PostImageRepository;
import com.project_exam.backend.modules.posts.repository.PostRepository;
import com.project_exam.backend.modules.posts.repository.ReactRepository;
import com.project_exam.backend.modules.users.domain.User;
import com.project_exam.backend.modules.users.repository.UserRepository;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final PostCategoryRepository postCategoryRepository;
    private final CategoryRepository categoryRepository;
    private final CommentRepository commentRepository;
    private final ReactRepository reactRepository;
    private final CloudinaryService cloudinaryService;
    private final AuthUtils authUtils;
    private final UserRepository userRepository;
    private final PostViewThrottleService postViewThrottleService;

    // ─────────────────────────────────────────────
    // MAPPING
    // ─────────────────────────────────────────────

    private CategoryResponse toCategoryResponse(Category c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .build();
    }

    private List<CategoryResponse> getCategoryResponses(String postId) {
        return postCategoryRepository.findByPostId(postId).stream()
                .map(pc -> categoryRepository.findById(pc.getCategoryId()))
                .filter(Optional::isPresent)
                .map(opt -> toCategoryResponse(opt.get()))
                .collect(Collectors.toList());
    }

    private List<PostResponse.PostImageResponse> getImageResponses(String postId) {
        return postImageRepository.findByPostIdOrderByOrder(postId).stream()
                .map(img -> PostResponse.PostImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .order(img.getOrder())
                        .build())
                .collect(Collectors.toList());
    }

    private Map<String, Long> buildReactCounts(String postId) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (React.ReactType type : React.ReactType.values()) {
            long count = reactRepository.countByPostIdAndType(postId, type);
            if (count > 0) counts.put(type.name(), count);
        }
        return counts;
    }

    public PostResponse toFullResponse(Post post, String currentUserId) {
        List<PostResponse.PostImageResponse> images = getImageResponses(post.getId());
        List<CategoryResponse> categories = getCategoryResponses(post.getId());
        Map<String, Long> reactCounts = buildReactCounts(post.getId());
        long commentCount = commentRepository.countByPostId(post.getId());

        String currentUserReactType = null;
        if (currentUserId != null) {
            currentUserReactType = reactRepository.findByPostIdAndUserId(post.getId(), currentUserId)
                    .map(r -> r.getType().name())
                    .orElse(null);
        }

        String authorName = "Unknown";
        String authorAvatar = null;
        Optional<User> authorOpt = userRepository.findById(post.getUserId());
        if (authorOpt.isPresent()) {
            authorName = authorOpt.get().getUserName();
            authorAvatar = authorOpt.get().getAvatarUrl();
        }

        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .authorName(authorName)
                .authorAvatar(authorAvatar)
                .title(post.getTitle())
                .content(post.getContent())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .thumbnailUrl(post.getThumbnailUrl())
                .images(images)
                .categories(categories)
                .reactCounts(reactCounts)
                .currentUserReactType(currentUserReactType)
                .commentCount(commentCount)
                .viewCount(post.getViewCount() == null ? 0L : post.getViewCount())
                .build();
    }

    private PostSummaryResponse toSummaryResponse(Post post) {
        List<PostResponse.PostImageResponse> images = getImageResponses(post.getId());
        String thumbnailUrl = post.getThumbnailUrl();
        if (thumbnailUrl == null || thumbnailUrl.isBlank()) {
            thumbnailUrl = images.isEmpty() ? null : images.get(0).getImageUrl();
        }

        List<CategoryResponse> categories = getCategoryResponses(post.getId());
        long commentCount = commentRepository.countByPostId(post.getId());
        long totalReacts = reactRepository.findByPostId(post.getId()).size();

        String authorName = "Unknown";
        String authorAvatar = null;
        Optional<User> authorOpt = userRepository.findById(post.getUserId());
        if (authorOpt.isPresent()) {
            authorName = authorOpt.get().getUserName();
            authorAvatar = authorOpt.get().getAvatarUrl();
        }

        return PostSummaryResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .authorName(authorName)
                .authorAvatar(authorAvatar)
                .title(post.getTitle())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .thumbnailUrl(thumbnailUrl)
                .categories(categories)
                .commentCount(commentCount)
                .totalReacts(totalReacts)
                .viewCount(post.getViewCount() == null ? 0L : post.getViewCount())
                .build();
    }

    // ─────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────

    @Transactional
    public PostResponse createPost(PostUpsertRequest request,
                                   MultipartFile thumbnailFile,
                                   HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        Post.PostStatus initialStatus = authUtils.isAdmin(httpRequest)
                ? Post.PostStatus.APPROVED
                : Post.PostStatus.PENDING;

        Post post = Post.builder()
                .userId(userId)
                .title(request.getTitle())
                .content(request.getContent())
                .thumbnailUrl(request.getThumbnailUrl())
                .status(initialStatus)
                .build();
                
        if (thumbnailFile != null && !thumbnailFile.isEmpty()) {
            try {
                String url = cloudinaryService.uploadImage(thumbnailFile);
                post.setThumbnailUrl(url);
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi upload ảnh bìa");
            }
        }

        post = postRepository.save(post);

        // Gán categories
        saveCategories(post.getId(), request.getCategoryIds());

        return toFullResponse(post, userId);
    }

    @Transactional
    public PostResponse updatePost(String id, PostUpsertRequest request,
                                   MultipartFile thumbnailFile,
                                   HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post không tồn tại"));

        if (!post.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền sửa post này");
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        if (request.getThumbnailUrl() != null && !request.getThumbnailUrl().isBlank()) {
            post.setThumbnailUrl(request.getThumbnailUrl());
        }
        
        if (thumbnailFile != null && !thumbnailFile.isEmpty()) {
            try {
                String url = cloudinaryService.uploadImage(thumbnailFile);
                post.setThumbnailUrl(url);
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi upload ảnh bìa");
            }
        }

        if (request.getStatus() != null) post.setStatus(request.getStatus());
        postRepository.save(post);

        // Cập nhật categories
        if (request.getCategoryIds() != null) {
            postCategoryRepository.deleteByPostId(id);
            saveCategories(id, request.getCategoryIds());
        }

        return toFullResponse(post, userId);
    }

    @Transactional
    public PostResponse updatePostStatus(String id, Post.PostStatus status, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        if (!authUtils.isAdmin(httpRequest)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ admin được duyệt/từ chối bài viết");
        }
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không được để trống");
        }

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post không tồn tại"));

        post.setStatus(status);
        postRepository.save(post);

        return toFullResponse(post, userId);
    }

    @Transactional
    public void deletePost(String id, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post không tồn tại"));

        boolean isOwner = post.getUserId().equals(userId);
        boolean isAdmin = authUtils.isAdmin(httpRequest);
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa post này");
        }

        postImageRepository.deleteByPostId(id);
        postCategoryRepository.deleteByPostId(id);
        commentRepository.deleteByPostId(id);
        reactRepository.findByPostId(id).forEach(reactRepository::delete);
        postRepository.delete(post);
    }

    @Transactional
    public PostResponse getPostById(String id, HttpServletRequest httpRequest) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post không tồn tại"));
        String currentUserId = tryGetUserId(httpRequest);

        if (post.getStatus() != Post.PostStatus.APPROVED) {
            boolean isOwner = currentUserId != null && currentUserId.equals(post.getUserId());
            boolean isAdmin = currentUserId != null && authUtils.isAdmin(httpRequest);
            if (!isOwner && !isAdmin) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post không tồn tại");
            }
        }

        boolean shouldCountView = postViewThrottleService.shouldCountView(id, currentUserId, httpRequest);
        if (shouldCountView) {
            long currentViews = post.getViewCount() == null ? 0L : post.getViewCount();
            post.setViewCount(currentViews + 1);
            postRepository.save(post);
        }

        return toFullResponse(post, currentUserId);
    }

    public PostPageResponse getPostsPaged(int page, int size, String keyword,
                                          Post.PostStatus status, String categoryId,
                                          HttpServletRequest httpRequest) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 10 : Math.min(size, 100);

        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<Post> spec = Specification.where(null);

        // User thường chỉ thấy bài APPROVED. Admin có thể xem mọi status hoặc lọc theo status truyền vào.
        Post.PostStatus effectiveStatus = status;
        if (!authUtils.isAdmin(httpRequest)) {
            effectiveStatus = Post.PostStatus.APPROVED;
        }

        if (keyword != null && !keyword.isBlank()) {
            String like = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("title")), like));
        }
        if (effectiveStatus != null) {
            final Post.PostStatus finalStatus = effectiveStatus;
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), finalStatus));
        }
        if (categoryId != null && !categoryId.isBlank()) {
            List<String> postIds = postCategoryRepository.findByCategoryId(categoryId)
                    .stream().map(PostCategory::getPostId).collect(Collectors.toList());
            if (postIds.isEmpty()) {
                PostPageResponse empty = new PostPageResponse();
                empty.setContent(Collections.emptyList());
                empty.setTotalElements(0);
                empty.setTotalPages(0);
                empty.setHasNext(false);
                return empty;
            }
            spec = spec.and((root, query, cb) -> root.get("id").in(postIds));
        }

        Page<Post> postPage = postRepository.findAll(spec, pageable);

        PostPageResponse response = new PostPageResponse();
        response.setContent(postPage.getContent().stream().map(this::toSummaryResponse).toList());
        response.setCurrentPage(postPage.getNumber());
        response.setSize(postPage.getSize());
        response.setTotalElements(postPage.getTotalElements());
        response.setTotalPages(postPage.getTotalPages());
        response.setHasNext(postPage.hasNext());
        return response;
    }

    public List<PostSummaryResponse> getMyPosts(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return postRepository.findByUserId(userId).stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────

    private void saveImages(String postId, List<MultipartFile> images) throws IOException {
        if (images == null || images.isEmpty()) return;
        for (int i = 0; i < images.size(); i++) {
            MultipartFile file = images.get(i);
            if (file == null || file.isEmpty()) continue;
            String url = cloudinaryService.uploadImage(file);
            PostImage img = PostImage.builder()
                    .postId(postId)
                    .imageUrl(url)
                    .order(i)
                    .build();
            postImageRepository.save(img);
        }
    }

    private void saveCategories(String postId, List<String> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) return;
        for (String catId : categoryIds) {
            if (!postCategoryRepository.existsByPostIdAndCategoryId(postId, catId)) {
                PostCategory pc = PostCategory.builder()
                        .postId(postId)
                        .categoryId(catId)
                        .build();
                postCategoryRepository.save(pc);
            }
        }
    }

    private String tryGetUserId(HttpServletRequest httpRequest) {
        try {
            return authUtils.getUserId(httpRequest);
        } catch (Exception e) {
            return null;
        }
    }

    public String uploadImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File không hợp lệ");
        }
        return cloudinaryService.uploadImage(file);
    }
}
