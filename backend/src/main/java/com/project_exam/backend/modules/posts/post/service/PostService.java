package com.project_exam.backend.modules.posts.post.service;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.infrastructure.cloudinary.CloudinaryService;
import com.project_exam.backend.modules.posts.category.domain.Category;
import com.project_exam.backend.modules.posts.post.domain.Post;
import com.project_exam.backend.modules.posts.post.domain.PostCategory;
import com.project_exam.backend.modules.posts.react.domain.React;
import com.project_exam.backend.modules.posts.post.dto.PostUpsertRequest;
import com.project_exam.backend.modules.posts.category.dto.CategoryResponse;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.posts.post.dto.PostResponse;
import com.project_exam.backend.modules.posts.post.dto.PostSummaryResponse;
import com.project_exam.backend.modules.posts.category.mapper.CategoryMapper;
import com.project_exam.backend.modules.posts.post.mapper.PostMapper;
import com.project_exam.backend.modules.posts.category.repository.CategoryRepository;
import com.project_exam.backend.modules.posts.comment.repository.CommentRepository;
import com.project_exam.backend.modules.posts.post.repository.PostCategoryRepository;
import com.project_exam.backend.modules.posts.post.repository.PostRepository;
import com.project_exam.backend.modules.posts.react.repository.ReactRepository;
import com.project_exam.backend.modules.posts.saved.repository.SavedPostRepository;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.InternalServerException;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostCategoryRepository postCategoryRepository;
    private final CategoryRepository categoryRepository;
    private final CommentRepository commentRepository;
    private final ReactRepository reactRepository;
    private final SavedPostRepository savedPostRepository;
    private final CloudinaryService cloudinaryService;
    private final AuthUtils authUtils;
    private final UserRepository userRepository;
    private final PostViewThrottleService postViewThrottleService;
    private final com.project_exam.backend.modules.gamification.cosmetic.service.CosmeticService cosmeticService;
    private final CategoryMapper categoryMapper;
    private final PostMapper postMapper;

    private CategoryResponse toCategoryResponse(Category c) {
        return categoryMapper.toResponse(c);
    }

    private List<CategoryResponse> getCategoryResponses(String postId) {
        List<String> categoryIds = postCategoryRepository.findByPostId(postId).stream()
                .map(PostCategory::getCategoryId)
                .filter(Objects::nonNull)
                .toList();
        if (categoryIds.isEmpty()) {
            return List.of();
        }
        Map<String, Category> categoryMap = categoryRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));
        return categoryIds.stream()
                .map(categoryMap::get)
                .filter(Objects::nonNull)
                .map(this::toCategoryResponse)
                .collect(Collectors.toList());
    }

    private Map<String, Long> buildReactCounts(String postId) {
        Map<React.ReactType, Long> byType = new EnumMap<>(React.ReactType.class);
        for (Object[] row : reactRepository.countGroupedByTypeForPost(postId)) {
            byType.put((React.ReactType) row[0], ((Number) row[1]).longValue());
        }
        // Giữ nguyên thứ tự khai báo enum và bỏ type có count = 0, như bản cũ.
        Map<String, Long> counts = new LinkedHashMap<>();
        for (React.ReactType type : React.ReactType.values()) {
            long count = byType.getOrDefault(type, 0L);
            if (count > 0) counts.put(type.name(), count);
        }
        return counts;
    }

    public PostResponse toFullResponse(Post post, String currentUserId) {
        List<CategoryResponse> categories = getCategoryResponses(post.getId());
        Map<String, Long> reactCounts = buildReactCounts(post.getId());
        long commentCount = commentRepository.countByPostId(post.getId());

        String currentUserReactType = null;
        boolean currentUserSaved = false;
        if (currentUserId != null) {
            currentUserReactType = reactRepository.findByPostIdAndUserId(post.getId(), currentUserId)
                    .map(r -> r.getType().name())
                    .orElse(null);
            currentUserSaved = savedPostRepository.existsByPostIdAndUserId(post.getId(), currentUserId);
        }
        long saveCount = savedPostRepository.countByPostId(post.getId());

        String authorName = "Unknown";
        String authorAvatar = null;
        Optional<User> authorOpt = userRepository.findById(post.getUserId());
        if (authorOpt.isPresent()) {
            authorName = authorOpt.get().getUserName();
            authorAvatar = authorOpt.get().getAvatarUrl();
        }
        var authorCosmetics = cosmeticService.getEquipped(post.getUserId());

        return postMapper.toFullResponse(post, authorName, authorAvatar, authorCosmetics,
                categories, reactCounts, currentUserReactType, commentCount, saveCount,
                currentUserSaved);
    }

    @Transactional
    public PostResponse createPost(PostUpsertRequest request,
                                   MultipartFile thumbnailFile,
                                   HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        Post.PostStatus initialStatus = authUtils.hasPermission(PermissionCatalog.POST_MODERATE)
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
                throw new InternalServerException("Lỗi upload ảnh bìa");
            }
        }

        post = postRepository.save(post);

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
            throw new ForbiddenException("Bạn không có quyền sửa post này");
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
                throw new InternalServerException("Lỗi upload ảnh bìa");
            }
        }

        if (request.getStatus() != null) post.setStatus(request.getStatus());
        postRepository.save(post);

        if (request.getCategoryIds() != null) {
            postCategoryRepository.deleteByPostId(id);
            saveCategories(id, request.getCategoryIds());
        }

        return toFullResponse(post, userId);
    }

    @Transactional
    public PostResponse updatePostStatus(String id, Post.PostStatus status, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        if (!authUtils.hasPermission(PermissionCatalog.POST_MODERATE)) {
            throw new ForbiddenException("Chỉ admin được duyệt/từ chối bài viết");
        }
        if (status == null) {
            throw new BadRequestException("Trạng thái không được để trống");
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
        boolean isAdmin = authUtils.hasPermission(PermissionCatalog.POST_MODERATE);
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Bạn không có quyền xóa post này");
        }

        postCategoryRepository.deleteByPostId(id);
        commentRepository.deleteByPostId(id);
        reactRepository.findByPostId(id).forEach(reactRepository::delete);
        savedPostRepository.deleteByPostId(id);
        postRepository.delete(post);
    }

    @Transactional
    public PostResponse getPostById(String id, HttpServletRequest httpRequest) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post không tồn tại"));
        String currentUserId = tryGetUserId(httpRequest);

        if (post.getStatus() != Post.PostStatus.APPROVED) {
            boolean isOwner = currentUserId != null && currentUserId.equals(post.getUserId());
            boolean isAdmin = currentUserId != null && authUtils.hasPermission(PermissionCatalog.POST_MODERATE);
            if (!isOwner && !isAdmin) {
                throw new NotFoundException("Post không tồn tại");
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

    public PageResponse<PostSummaryResponse> getPostsPaged(int page, int size, String keyword,
                                          Post.PostStatus status, String categoryId,
                                          HttpServletRequest httpRequest) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 10 : Math.min(size, 100);

        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<Post> spec = Specification.where(null);

        Post.PostStatus effectiveStatus = status;
        if (!authUtils.hasPermission(PermissionCatalog.POST_MODERATE)) {
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
                return PageResponse.empty(safePage, safeSize);
            }
            spec = spec.and((root, query, cb) -> root.get("id").in(postIds));
        }

        Page<Post> postPage = postRepository.findAll(spec, pageable);

        return PageResponse.from(postPage, buildSummaryResponses(postPage.getContent()));
    }

    public PageResponse<PostSummaryResponse> getMyPosts(int page, int size, String keyword,
                                                        Post.PostStatus status,
                                                        HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 10 : Math.min(size, 100);

        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Post> spec = (root, query, cb) -> cb.equal(root.get("userId"), userId);
        if (keyword != null && !keyword.isBlank()) {
            String like = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("title")), like));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        Page<Post> postPage = postRepository.findAll(spec, pageable);

        return PageResponse.from(postPage, buildSummaryResponses(postPage.getContent()));
    }

    public List<PostSummaryResponse> buildSummaryResponses(List<Post> posts) {
        if (posts == null || posts.isEmpty()) return List.of();

        List<String> postIds = posts.stream().map(Post::getId).toList();
        Set<String> authorIds = posts.stream()
                .map(Post::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, User> authorMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getUserId, u -> u));

        var equippedMap = cosmeticService.getEquippedForUsers(authorIds);

        List<PostCategory> postCategories = postCategoryRepository.findByPostIdIn(postIds);
        Set<String> categoryIds = postCategories.stream()
                .map(PostCategory::getCategoryId)
                .collect(Collectors.toSet());
        Map<String, Category> categoryMap = categoryRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(Category::getId, c -> c));
        Map<String, List<CategoryResponse>> categoriesByPostId = new HashMap<>();
        for (PostCategory pc : postCategories) {
            Category cat = categoryMap.get(pc.getCategoryId());
            if (cat == null) continue;
            categoriesByPostId
                    .computeIfAbsent(pc.getPostId(), k -> new ArrayList<>())
                    .add(toCategoryResponse(cat));
        }

        Map<String, Long> commentCountMap = toCountMap(commentRepository.countGroupedByPostIdIn(postIds));
        Map<String, Long> reactCountMap = toCountMap(reactRepository.countGroupedByPostIdIn(postIds));
        Map<String, Long> saveCountMap = toCountMap(savedPostRepository.countGroupedByPostIdIn(postIds));

        return posts.stream().map(post -> {
            User author = authorMap.get(post.getUserId());
            String authorName = author != null ? author.getUserName() : "Unknown";
            String authorAvatar = author != null ? author.getAvatarUrl() : null;
            var authorCosmetics = equippedMap.get(post.getUserId());

            return postMapper.toSummaryResponse(post, authorName, authorAvatar, authorCosmetics,
                    post.getThumbnailUrl(),
                    categoriesByPostId.getOrDefault(post.getId(), List.of()),
                    commentCountMap.getOrDefault(post.getId(), 0L),
                    reactCountMap.getOrDefault(post.getId(), 0L),
                    saveCountMap.getOrDefault(post.getId(), 0L));
        }).collect(Collectors.toList());
    }

    private Map<String, Long> toCountMap(List<Object[]> rows) {
        Map<String, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((String) row[0], ((Number) row[1]).longValue());
        }
        return map;
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
