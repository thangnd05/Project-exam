package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.infrastructure.cloudinary.CloudinaryService;
import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import com.project_exam.backend.modules.assessment.exam.domain.ResourceTag;
import com.project_exam.backend.modules.assessment.exam.dto.RecoveryResourceRequest;
import com.project_exam.backend.modules.assessment.exam.dto.RecoveryResourceResponse;
import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import com.project_exam.backend.modules.assessment.exam.repository.RecoveryResourceRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ResourceTagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.TagRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class RecoveryResourceService {

    private final RecoveryResourceRepository resourceRepository;
    private final ResourceTagRepository resourceTagRepository;
    private final TagRepository tagRepository;
    private final TagService tagService;
    private final CloudinaryService cloudinaryService;
    private final AuthUtils authUtils;

    // ==================== CREATE ====================

    @Transactional
    public RecoveryResourceResponse createResource(
            RecoveryResourceRequest request,
            MultipartFile file,
            HttpServletRequest httpRequest
    ) throws IOException {
        String currentUserId = authUtils.getUserId(httpRequest);
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BadRequestException("Tiêu đề không được để trống.");
        }
        if (request.getResourceType() == null) {
            throw new BadRequestException("Loại tài liệu không được để trống.");
        }

        RecoveryResource resource = new RecoveryResource();
        resource.setTitle(request.getTitle().trim());
        resource.setDescription(request.getDescription());
        resource.setResourceType(request.getResourceType());
        resource.setCreatedBy(currentUserId);

        // Upload file hoặc dùng URL
        if (file != null && !file.isEmpty()) {
            String uploadedUrl;
            String publicId;
            switch (request.getResourceType()) {
                case VIDEO -> {
                    uploadedUrl = cloudinaryService.uploadAudio(file);
                    publicId = extractPublicId(uploadedUrl);
                }
                case DOCUMENT -> {
                    uploadedUrl = cloudinaryService.uploadDocument(file);
                    publicId = extractPublicId(uploadedUrl);
                }
                default -> {
                    uploadedUrl = cloudinaryService.uploadDocument(file);
                    publicId = extractPublicId(uploadedUrl);
                }
            }
            resource.setUrl(uploadedUrl);
            resource.setCloudinaryPublicId(publicId);
        } else if (request.getUrl() != null && !request.getUrl().isBlank()) {
            resource.setUrl(request.getUrl().trim());
        } else {
            throw new BadRequestException("Vui lòng upload file hoặc cung cấp URL.");
        }

        resource = resourceRepository.save(resource);

        // Gắn tags
        syncResourceTags(resource.getResourceId(), request.getTagIds());

        return toResponse(resource);
    }

    // ==================== UPDATE ====================

    @Transactional
    public RecoveryResourceResponse updateResource(
            String resourceId,
            RecoveryResourceRequest request,
            MultipartFile file,
            HttpServletRequest httpRequest
    ) throws IOException {
        RecoveryResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("Tài liệu không tồn tại: " + resourceId));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            resource.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            resource.setDescription(request.getDescription());
        }
        if (request.getResourceType() != null) {
            resource.setResourceType(request.getResourceType());
        }

        // Upload file mới -> xóa file cũ trên Cloudinary
        if (file != null && !file.isEmpty()) {
            if (resource.getCloudinaryPublicId() != null) {
                try { cloudinaryService.deleteFile(resource.getCloudinaryPublicId()); } catch (Exception ignored) {}
            }
            String uploadedUrl;
            switch (resource.getResourceType()) {
                case VIDEO -> uploadedUrl = cloudinaryService.uploadAudio(file);
                case DOCUMENT -> uploadedUrl = cloudinaryService.uploadDocument(file);
                default -> uploadedUrl = cloudinaryService.uploadDocument(file);
            }
            resource.setUrl(uploadedUrl);
            resource.setCloudinaryPublicId(extractPublicId(uploadedUrl));
        } else if (request.getUrl() != null && !request.getUrl().isBlank()) {
            resource.setUrl(request.getUrl().trim());
        }

        resource = resourceRepository.save(resource);

        if (request.getTagIds() != null) {
            syncResourceTags(resource.getResourceId(), request.getTagIds());
        }

        return toResponse(resource);
    }

    // ==================== DELETE ====================

    @Transactional
    public void deleteResource(String resourceId) {
        RecoveryResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("Tài liệu không tồn tại: " + resourceId));

        // Xóa file trên Cloudinary
        if (resource.getCloudinaryPublicId() != null) {
            try { cloudinaryService.deleteFile(resource.getCloudinaryPublicId()); } catch (Exception ignored) {}
        }

        resourceTagRepository.deleteByResourceId(resourceId);
        resourceRepository.deleteById(resourceId);
    }

    // ==================== QUERY ====================

    public List<RecoveryResourceResponse> getAllResources() {
        return resourceRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public RecoveryResourceResponse getResourceById(String resourceId) {
        RecoveryResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("Tài liệu không tồn tại: " + resourceId));
        return toResponse(resource);
    }

    /**
     * Tìm tài liệu theo danh sách tagIds (phải match TẤT CẢ tags).
     */
    public List<RecoveryResourceResponse> getResourcesByTags(List<String> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return getAllResources();
        }
        List<String> resourceIds = resourceTagRepository.findResourceIdsMatchingAllTags(tagIds, tagIds.size());
        return resourceIds.stream()
                .map(id -> resourceRepository.findById(id).orElse(null))
                .filter(Objects::nonNull)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Tìm tài liệu theo 1 tag (dùng cho chẩn đoán: tag nào yếu -> gợi ý tài liệu).
     */
    public List<RecoveryResourceResponse> getResourcesByTagId(String tagId) {
        List<ResourceTag> resourceTags = resourceTagRepository.findByTagId(tagId);
        return resourceTags.stream()
                .map(rt -> resourceRepository.findById(rt.getResourceId()).orElse(null))
                .filter(Objects::nonNull)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ==================== HELPERS ====================

    @Transactional
    public void syncResourceTags(String resourceId, List<String> tagIds) {
        resourceTagRepository.deleteByResourceId(resourceId);
        if (tagIds == null || tagIds.isEmpty()) return;

        for (String tagId : tagIds) {
            tagRepository.findById(tagId)
                    .orElseThrow(() -> new NotFoundException("Tag không tồn tại: " + tagId));
            ResourceTag rt = new ResourceTag();
            rt.setResourceId(resourceId);
            rt.setTagId(tagId);
            resourceTagRepository.save(rt);
        }
    }

    private RecoveryResourceResponse toResponse(RecoveryResource resource) {
        List<TagResponse> tags = resourceTagRepository.findByResourceId(resource.getResourceId())
                .stream()
                .map(rt -> tagRepository.findById(rt.getTagId()).orElse(null))
                .filter(Objects::nonNull)
                .map(t -> TagResponse.builder()
                        .tagId(t.getTagId())
                        .name(t.getName())
                        .examTypeId(t.getExamTypeId())
                        .parentId(t.getParentId())
                        .children(null)
                        .build())
                .collect(Collectors.toList());

        return RecoveryResourceResponse.builder()
                .resourceId(resource.getResourceId())
                .title(resource.getTitle())
                .description(resource.getDescription())
                .resourceType(resource.getResourceType())
                .url(resource.getUrl())
                .createdBy(resource.getCreatedBy())
                .createdAt(resource.getCreatedAt())
                .tags(tags)
                .build();
    }

    private String extractPublicId(String url) {
        if (url == null) return null;
        // Cloudinary URL: .../upload/v123456/folder/filename.ext
        int uploadIdx = url.indexOf("/upload/");
        if (uploadIdx < 0) return null;
        String afterUpload = url.substring(uploadIdx + 8);
        // Bỏ version prefix (v123456/)
        if (afterUpload.matches("^v\\d+/.*")) {
            afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
        }
        // Bỏ extension
        int dotIdx = afterUpload.lastIndexOf('.');
        return dotIdx > 0 ? afterUpload.substring(0, dotIdx) : afterUpload;
    }

}
