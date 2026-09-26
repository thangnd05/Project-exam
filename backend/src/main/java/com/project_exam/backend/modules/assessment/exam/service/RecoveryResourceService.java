package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.infrastructure.cloudinary.CloudinaryService;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import com.project_exam.backend.modules.assessment.exam.domain.ResourceTag;
import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import com.project_exam.backend.modules.assessment.exam.dto.RecoveryResourceRequest;
import com.project_exam.backend.modules.assessment.exam.dto.RecoveryResourceResponse;
import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import com.project_exam.backend.modules.assessment.exam.mapper.RecoveryResourceMapper;
import com.project_exam.backend.modules.assessment.exam.mapper.TagMapper;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.modules.assessment.exam.repository.RecoveryResourceRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ResourceTagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.TagRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.NotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecoveryResourceService {

    private final RecoveryResourceRepository resourceRepository;
    private final ResourceTagRepository resourceTagRepository;
    private final TagRepository tagRepository;
    private final ExamPartRepository examPartRepository;
    private final ExamTypeRepository examTypeRepository;
    private final TagMapper tagMapper;
    private final RecoveryResourceMapper recoveryResourceMapper;
    private final CloudinaryService cloudinaryService;

    @Transactional
    public RecoveryResourceResponse createResource(
            RecoveryResourceRequest request,
            MultipartFile file,
            String currentUserId
    ) throws IOException {
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

        applyExamType(resource, request.getExamTypeId(), request.getTagIds());

        resource = resourceRepository.save(resource);
        syncResourceTags(resource.getResourceId(), request.getTagIds());

        return toResponse(resource);
    }

    @Transactional
    public RecoveryResourceResponse updateResource(
            String resourceId,
            RecoveryResourceRequest request,
            MultipartFile file
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

        if (request.getExamTypeId() != null || request.getTagIds() != null) {
            String examTypeId = request.getExamTypeId() != null ? request.getExamTypeId() : resource.getExamTypeId();
            List<String> tagIds = request.getTagIds() != null ? request.getTagIds()
                    : resourceTagRepository.findByResourceId(resourceId).stream().map(ResourceTag::getTagId).toList();
            applyExamType(resource, examTypeId, tagIds);
        }

        resource = resourceRepository.save(resource);

        if (request.getTagIds() != null) {
            syncResourceTags(resource.getResourceId(), request.getTagIds());
        }

        return toResponse(resource);
    }

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

    public List<RecoveryResourceResponse> getAllResources() {
        return orderByTagOrder(resourceRepository.findAll(), null).stream()
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
        return orderByTagOrder(resourceRepository.findAllById(resourceIds), null).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<RecoveryResourceResponse> getResourcesByTagId(String tagId) {
        List<String> resourceIds = resourceTagRepository.findByTagId(tagId).stream()
                .map(ResourceTag::getResourceId)
                .toList();
        return orderByTagOrder(resourceRepository.findAllById(resourceIds), null).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<RecoveryResourceResponse> getResourcesByExamPartId(String examPartId) {
        return getResourcesByExamPartIds(List.of(examPartId));
    }

    /** Tài liệu có ít nhất một tag thuộc các phần thi đã cho. */
    public List<RecoveryResourceResponse> getResourcesByExamPartIds(List<String> examPartIds) {
        if (examPartIds == null || examPartIds.isEmpty()) {
            return List.of();
        }
        Set<String> resourceIds = resourceTagRepository.findResourcePartPairs(examPartIds).stream()
                .map(row -> (String) row[0])
                .collect(Collectors.toSet());
        if (resourceIds.isEmpty()) {
            return List.of();
        }
        return orderByTagOrder(resourceRepository.findAllById(resourceIds), Set.copyOf(examPartIds)).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Xếp tài liệu theo kỳ thi, rồi theo tag đứng đầu mà nó gắn (thứ tự phần thi, sortOrder của tag), rồi tiêu đề.
     * {@code onlyPartIds} != null thì chỉ xét tag thuộc các phần thi đó. Tài liệu không có tag xếp cuối.
     */
    private List<RecoveryResource> orderByTagOrder(List<RecoveryResource> resources, Set<String> onlyPartIds) {
        if (resources.size() < 2) return resources;
        Set<String> resourceIds = resources.stream().map(RecoveryResource::getResourceId).collect(Collectors.toSet());
        List<ResourceTag> links = resourceTagRepository.findByResourceIdIn(resourceIds);
        Map<String, Tag> tagsById = tagRepository.findAllById(links.stream().map(ResourceTag::getTagId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Tag::getTagId, t -> t));
        Map<String, Integer> partOrder = examPartRepository.findAllById(tagsById.values().stream()
                        .map(Tag::getExamPartId).filter(Objects::nonNull).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(ExamPart::getExamPartId,
                        p -> p.getDisplayOrder() != null ? p.getDisplayOrder() : Integer.MAX_VALUE));

        Comparator<Tag> tagOrder = Comparator
                .comparing((Tag t) -> t.getExamPartId() == null ? Integer.MAX_VALUE : partOrder.getOrDefault(t.getExamPartId(), Integer.MAX_VALUE))
                .thenComparing(Tag::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder()));
        Map<String, Tag> firstTagByResource = new HashMap<>();
        for (ResourceTag link : links) {
            Tag tag = tagsById.get(link.getTagId());
            if (tag == null || (onlyPartIds != null && !onlyPartIds.contains(tag.getExamPartId()))) continue;
            firstTagByResource.merge(link.getResourceId(), tag, (a, b) -> tagOrder.compare(a, b) <= 0 ? a : b);
        }

        List<RecoveryResource> sorted = new ArrayList<>(resources);
        sorted.sort(Comparator
                .comparing(RecoveryResource::getExamTypeId, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing((RecoveryResource r) -> firstTagByResource.get(r.getResourceId()), Comparator.nullsLast(tagOrder))
                .thenComparing(RecoveryResource::getTitle, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));
        return sorted;
    }

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

    /** Kỳ thi của tài liệu: lấy theo request, nếu trống thì suy từ tag; mọi tag phải cùng kỳ thi. */
    private void applyExamType(RecoveryResource resource, String examTypeId, List<String> tagIds) {
        String requested = (examTypeId == null || examTypeId.isBlank()) ? null : examTypeId.trim();
        Set<String> tagExamTypes = tagIds == null || tagIds.isEmpty() ? Set.of()
                : tagRepository.findAllById(tagIds).stream().map(Tag::getExamTypeId).collect(Collectors.toSet());
        if (tagExamTypes.size() > 1) {
            throw new BadRequestException("Các tag của tài liệu phải thuộc cùng một loại kỳ thi.");
        }
        String fromTags = tagExamTypes.isEmpty() ? null : tagExamTypes.iterator().next();
        if (requested != null && fromTags != null && !requested.equals(fromTags)) {
            throw new BadRequestException("Tag không thuộc loại kỳ thi của tài liệu.");
        }
        String resolved = requested != null ? requested : fromTags;
        if (resolved != null && !examTypeRepository.existsById(resolved)) {
            throw new NotFoundException("Loại kỳ thi không tồn tại: " + resolved);
        }
        resource.setExamTypeId(resolved);
    }

    private RecoveryResourceResponse toResponse(RecoveryResource resource) {
        List<Tag> tagEntities = resourceTagRepository.findByResourceId(resource.getResourceId())
                .stream()
                .map(rt -> tagRepository.findById(rt.getTagId()).orElse(null))
                .filter(Objects::nonNull)
                .toList();

        Set<String> partIds = tagEntities.stream()
                .map(Tag::getExamPartId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        List<ExamPart> parts = partIds.isEmpty() ? List.of()
                : examPartRepository.findAllById(partIds).stream()
                        .sorted(Comparator.comparing(ExamPart::getDisplayOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                        .toList();
        Map<String, String> partNames = parts.stream()
                .collect(Collectors.toMap(ExamPart::getExamPartId, ExamPart::getName));
        List<TagResponse> tags = tagEntities.stream()
                .map(t -> tagMapper.toResponse(t, partNames.get(t.getExamPartId())))
                .collect(Collectors.toList());

        String examTypeName = resource.getExamTypeId() == null ? null
                : examTypeRepository.findById(resource.getExamTypeId()).map(t -> t.getName()).orElse(null);

        return recoveryResourceMapper.toResponse(resource, tags, examTypeName, parts);
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
