package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionResponse;
import com.project_exam.backend.modules.assessment.exam.domain.QuestionCollection;
import com.project_exam.backend.modules.assessment.exam.mapper.QuestionCollectionMapper;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionCollectionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QuestionCollectionService {

    private final QuestionCollectionRepository collectionRepository;
    private final QuestionRepository questionRepository;
    private final QuestionCollectionMapper questionCollectionMapper;

    public List<QuestionCollectionResponse> findAll() {
        // Base order: displayOrder tăng dần (chưa đặt = null → xuống cuối), rồi theo tên.
        // FE vẫn sắp lại numeric-aware ("ETS 2026 2" trước "ETS 2026 10") khi dựng cây.
        Comparator<QuestionCollection> byOrderThenName = Comparator
                .comparing(QuestionCollection::getDisplayOrder,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(c -> c.getName() == null ? "" : c.getName(),
                        String.CASE_INSENSITIVE_ORDER);
        return collectionRepository.findAll().stream()
                .sorted(byOrderThenName)
                .map(this::toResponse)
                .toList();
    }

    public QuestionCollectionResponse findById(String id) {
        QuestionCollection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Bộ sưu tập câu hỏi không tồn tại"));
        return toResponse(collection);
    }

    @Transactional
    public QuestionCollectionResponse create(QuestionCollectionRequest request) {
        String name = normalize(request.getName());
        if (name == null) {
            throw new BadRequestException("Tên bộ sưu tập không được để trống.");
        }
        // 🔒 Chống trùng tên (case-insensitive). DB cũng có unique constraint, nhưng kiểm tra
        // trước để trả về thông báo rõ ràng thay vì SQLException.
        collectionRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            throw new ConflictException("Tên bộ sưu tập đã tồn tại.");
        });
        QuestionCollection collection = new QuestionCollection();
        collection.setName(name);
        collection.setDescription(trimOrNull(request.getDescription()));
        // Gán cha (nếu có). Khi tạo mới collection chưa có con nên chỉ cần validate cha hợp lệ.
        String parentId = resolveParentId(request.getParentId(), null);
        collection.setParentId(parentId);
        // Cha: examType lấy từ request; con: kế thừa examType của cha.
        collection.setExamTypeId(resolveExamTypeId(parentId, request.getExamTypeId()));
        // Vị trí sắp xếp (tùy chọn). null = chưa đặt → FE sắp theo tên numeric-aware.
        collection.setDisplayOrder(request.getDisplayOrder());
        collection = collectionRepository.save(collection);
        return toResponse(collection);
    }

    @Transactional
    public QuestionCollectionResponse update(String id, QuestionCollectionRequest request) {
        QuestionCollection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Bộ sưu tập câu hỏi không tồn tại"));

        if (request.getName() != null) {
            String newName = normalize(request.getName());
            if (newName == null) {
                throw new BadRequestException("Tên bộ sưu tập không được để trống.");
            }
            // Chỉ check trùng nếu đổi sang tên khác.
            if (!newName.equalsIgnoreCase(collection.getName())) {
                Optional<QuestionCollection> dup = collectionRepository.findByNameIgnoreCase(newName);
                if (dup.isPresent() && !dup.get().getCollectionId().equals(id)) {
                    throw new ConflictException("Tên bộ sưu tập đã tồn tại.");
                }
            }
            collection.setName(newName);
        }

        if (request.getDescription() != null) {
            collection.setDescription(trimOrNull(request.getDescription()));
        }

        // parentId == null trong request nghĩa là "không đụng tới". Để gỡ cha, FE gửi chuỗi rỗng.
        if (request.getParentId() != null) {
            collection.setParentId(resolveParentId(request.getParentId(), id));
        }

        // Xác định examTypeId sau khi parentId đã chốt.
        if (collection.getParentId() != null) {
            // Là con → luôn kế thừa examType của cha.
            collection.setExamTypeId(resolveExamTypeId(collection.getParentId(), null));
        } else if (request.getExamTypeId() != null) {
            // Là cha và request có gửi examTypeId → cập nhật, đồng thời lan truyền xuống các con.
            String newExamTypeId = normalize(request.getExamTypeId());
            collection.setExamTypeId(newExamTypeId);
            List<QuestionCollection> children = collectionRepository.findByParentId(id);
            children.forEach(c -> c.setExamTypeId(newExamTypeId));
            if (!children.isEmpty()) collectionRepository.saveAll(children);
        }

        // displayOrder: chỉ cập nhật khi request có gửi (khác null) — để trống = giữ nguyên vị trí cũ.
        if (request.getDisplayOrder() != null) {
            collection.setDisplayOrder(request.getDisplayOrder());
        }

        collection = collectionRepository.save(collection);
        return toResponse(collection);
    }

    @Transactional
    public void delete(String id) {
        QuestionCollection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Bộ sưu tập câu hỏi không tồn tại"));
        // 🔒 Chặn xoá khi đang có câu hỏi gắn vào — tránh orphan reference.
        long inUse = questionRepository.countByCollectionId(id);
        if (inUse > 0) {
            throw new ConflictException(
                    "Không thể xoá: bộ sưu tập đang có " + inUse + " câu hỏi. " +
                            "Hãy bỏ liên kết các câu hỏi trước khi xoá."
            );
        }
        // 🔒 Chặn xoá collection cha khi còn collection con — tránh con bị mồ côi.
        long childCount = collectionRepository.countByParentId(id);
        if (childCount > 0) {
            throw new ConflictException(
                    "Không thể xoá: bộ sưu tập đang chứa " + childCount + " bộ sưu tập con. " +
                            "Hãy xoá hoặc tách các bộ sưu tập con trước."
            );
        }
        collectionRepository.delete(collection);
    }

    private QuestionCollectionResponse toResponse(QuestionCollection collection) {
        String id = collection.getCollectionId();
        // Số câu gắn trực tiếp.
        Long questionCount = questionRepository.countByCollectionId(id);

        // Tên cha (nếu là collection con).
        String parentName = null;
        if (collection.getParentId() != null) {
            parentName = collectionRepository.findById(collection.getParentId())
                    .map(QuestionCollection::getName)
                    .orElse(null);
        }

        // Con trực tiếp + tổng câu gộp con-cháu (chỉ 2 cấp nên con không có cháu).
        List<QuestionCollection> children = collectionRepository.findByParentId(id);
        Long childCount = (long) children.size();
        Long totalQuestionCount = questionCount;
        if (!children.isEmpty()) {
            List<String> ids = new ArrayList<>();
            ids.add(id);
            children.forEach(c -> ids.add(c.getCollectionId()));
            totalQuestionCount = questionRepository.countByCollectionIdIn(ids);
        }

        return questionCollectionMapper.toResponse(
                collection, questionCount, parentName, childCount, totalQuestionCount);
    }

    /**
     * Chuẩn hoá & validate parentId khi gán cho collection {@code selfId} (null khi tạo mới).
     * Trả về parentId hợp lệ, hoặc null nếu là collection cấp 1.
     * Quy tắc: cha phải tồn tại, không tự trỏ chính mình, cha phải là cấp 1 (tối đa 2 cấp),
     * và bản thân collection không được đang có con (nếu không sẽ thành 3 cấp).
     */
    private String resolveParentId(String rawParentId, String selfId) {
        String parentId = normalize(rawParentId);
        if (parentId == null) {
            return null; // collection cấp 1
        }
        if (parentId.equals(selfId)) {
            throw new BadRequestException("Bộ sưu tập không thể là cha của chính nó.");
        }
        QuestionCollection parent = collectionRepository.findById(parentId)
                .orElseThrow(() -> new BadRequestException("Bộ sưu tập cha không tồn tại."));
        if (parent.getParentId() != null) {
            throw new BadRequestException(
                    "Chỉ hỗ trợ 2 cấp: không thể chọn một bộ sưu tập con làm cha.");
        }
        if (selfId != null && collectionRepository.existsByParentId(selfId)) {
            throw new BadRequestException(
                    "Bộ sưu tập này đang chứa bộ sưu tập con nên không thể trở thành con của bộ khác.");
        }
        return parentId;
    }

    /**
     * examTypeId hiệu lực: collection cha lấy từ request; collection con kế thừa từ cha.
     */
    private String resolveExamTypeId(String parentId, String rawExamTypeId) {
        if (parentId == null) {
            return normalize(rawExamTypeId);
        }
        return collectionRepository.findById(parentId)
                .map(QuestionCollection::getExamTypeId)
                .orElse(null);
    }

    private String normalize(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String trimOrNull(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
