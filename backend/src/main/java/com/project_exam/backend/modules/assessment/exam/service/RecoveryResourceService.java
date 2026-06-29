package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.infrastructure.cloudinary.CloudinaryService;
import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import com.project_exam.backend.modules.assessment.exam.domain.ResourceTag;
import com.project_exam.backend.modules.assessment.exam.dto.RecoveryResourceRequest;
import com.project_exam.backend.modules.assessment.exam.dto.RecoveryResourceResponse;
import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import com.project_exam.backend.modules.assessment.exam.mapper.RecoveryResourceMapper;
import com.project_exam.backend.modules.assessment.exam.mapper.TagMapper;
import com.project_exam.backend.modules.assessment.exam.repository.RecoveryResourceRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ResourceTagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.TagRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecoveryResourceService {

    private final RecoveryResourceRepository resourceRepository;
    private final ResourceTagRepository resourceTagRepository;
    private final TagRepository tagRepository;
    private final TagService tagService;
    private final TagMapper tagMapper;
    private final RecoveryResourceMapper recoveryResourceMapper;
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

        RecoveryResource resource = new RecoveryResource();
        resource.setTitle(request.getTitle().trim());
        resource.setDescription(request.getDescription());
        resource.setCreatedBy(currentUserId);

        if (file != null && !file.isEmpty()) {
            resource.setOriginalFileName(file.getOriginalFilename());
            String uploadedUrl = uploadFile(file);
            resource.setUrl(uploadedUrl);
            resource.setCloudinaryPublicId(extractPublicId(uploadedUrl));
        } else if (request.getUrl() != null && !request.getUrl().isBlank()) {
            resource.setUrl(request.getUrl().trim());
        } else {
            throw new BadRequestException("Vui lòng upload file hoặc cung cấp URL.");
        }

        resource = resourceRepository.save(resource);
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

        if (file != null && !file.isEmpty()) {
            // Xóa file cũ trên Cloudinary
            if (resource.getCloudinaryPublicId() != null) {
                try { cloudinaryService.deleteFile(resource.getCloudinaryPublicId()); } catch (Exception ignored) {}
            }
            resource.setOriginalFileName(file.getOriginalFilename());
            String uploadedUrl = uploadFile(file);
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

    public List<RecoveryResourceResponse> getResourcesByTagId(String tagId) {
        List<ResourceTag> resourceTags = resourceTagRepository.findByTagId(tagId);
        return resourceTags.stream()
                .map(rt -> resourceRepository.findById(rt.getResourceId()).orElse(null))
                .filter(Objects::nonNull)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ==================== HELPERS ====================

    /**
     * Upload file lên Cloudinary, tự detect loại từ content type.
     */
    private String uploadFile(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType != null && (contentType.startsWith("audio/") || contentType.startsWith("video/"))) {
            return cloudinaryService.uploadAudio(file);
        } else if (contentType != null && contentType.startsWith("image/")) {
            return cloudinaryService.uploadImage(file);
        } else {
            return cloudinaryService.uploadDocument(file);
        }
    }

    @Transactional
    public void syncResourceTags(String resourceId, List<String> tagIds) {
        resourceTagRepository.deleteByResourceId(resourceId);
        resourceTagRepository.flush();

        if (tagIds == null || tagIds.isEmpty()) {
            return;
        }

        LinkedHashSet<String> uniqueTagIds = new LinkedHashSet<>(tagIds);
        for (String tagId : uniqueTagIds) {
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
                .map(t -> tagMapper.toResponse(t, null))
                .collect(Collectors.toList());

        return recoveryResourceMapper.toResponse(resource, tags);
    }

    private String extractPublicId(String url) {
        if (url == null) return null;
        int uploadIdx = url.indexOf("/upload/");
        if (uploadIdx < 0) return null;
        String afterUpload = url.substring(uploadIdx + 8);
        if (afterUpload.matches("^v\\d+/.*")) {
            afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
        }
        int dotIdx = afterUpload.lastIndexOf('.');
        return dotIdx > 0 ? afterUpload.substring(0, dotIdx) : afterUpload;
    }

}
