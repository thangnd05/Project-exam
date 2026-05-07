package com.project_exam.backend.modules.users.service;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.infrastructure.cloudinary.CloudinaryService;
import com.project_exam.backend.modules.users.dto.UserUpsertRequest;
import com.project_exam.backend.modules.users.dto.ProfileOverviewResponse;
import com.project_exam.backend.modules.users.dto.UserPageResponse;
import com.project_exam.backend.modules.users.dto.UserResponse;
import com.project_exam.backend.modules.users.domain.*;
import com.project_exam.backend.modules.posts.domain.*;
import com.project_exam.backend.modules.assessment.exam.domain.*;
import com.project_exam.backend.modules.assessment.test.domain.*;
import com.project_exam.backend.modules.assessment.attempt.domain.*;
import com.project_exam.backend.modules.vocabulary.domain.*;
import com.project_exam.backend.modules.classroom.domain.*;
import com.project_exam.backend.modules.audit.domain.*;
import com.project_exam.backend.modules.users.repository.*;
import com.project_exam.backend.modules.posts.repository.*;
import com.project_exam.backend.modules.assessment.exam.repository.*;
import com.project_exam.backend.modules.assessment.test.repository.*;
import com.project_exam.backend.modules.assessment.attempt.repository.*;
import com.project_exam.backend.modules.vocabulary.repository.*;
import com.project_exam.backend.modules.classroom.repository.*;
import com.project_exam.backend.modules.audit.repository.*;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import java.util.Optional;

@Service
@AllArgsConstructor
public class UserService {
    private UserRepository userRepository;
    private CloudinaryService cloudinaryService;
    private UserTestRepository userTestRepository;
    private UserVocabularyRepository userVocabularyRepository;
    private ClassMemberRepository classMemberRepository;
    private AuthUtils authUtils;
    private RoleRepository roleRepository;
    private PasswordEncoder passwordEncoder;

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getUserId(),
                user.getUserName(),
                user.getFullName(),
                user.getEmail(),
                user.getRoleId(),
                user.getAvatarUrl()
        );
    }

    private User toEntity(UserUpsertRequest request) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password không được để trống");
        }
        User user = new User();
        user.setUserName(request.getUserName());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRoleId(request.getRoleId());
        if (request.getVerified() != null) {
            user.setVerified(request.getVerified());
        }
        return user;
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public List<UserResponse> findAllResponses() {
        return findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public UserPageResponse findAllPaged(Integer page, Integer size, String keyword, String roleId, Boolean verified) {
        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null || size <= 0 ? 20 : Math.min(size, 100);

        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<User> specification = Specification.where(null);

        if (keyword != null && !keyword.trim().isEmpty()) {
            String normalizedKeyword = "%" + keyword.trim().toLowerCase() + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("fullName")), normalizedKeyword),
                    cb.like(cb.lower(root.get("userName")), normalizedKeyword),
                    cb.like(cb.lower(root.get("email")), normalizedKeyword)
            ));
        }

        if (roleId != null && !roleId.trim().isEmpty()) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("roleId"), roleId));
        }

        if (verified != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("verified"), verified));
        }

        Page<User> userPage = userRepository.findAll(specification, pageable);

        UserPageResponse response = new UserPageResponse();
        response.setContent(userPage.getContent().stream().map(this::toResponse).toList());
        response.setCurrentPage(userPage.getNumber());
        response.setSize(userPage.getSize());
        response.setTotalElements(userPage.getTotalElements());
        response.setTotalPages(userPage.getTotalPages());
        response.setHasNext(userPage.hasNext());
        return response;
    }

    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    public Optional<UserResponse> findResponseById(String id) {
        return findById(id).map(this::toResponse);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public User createUser(User user) {

        // ✅ Auto avatar mặc định theo username (giống Google)
        String defaultAvatar =
                "https://ui-avatars.com/api/?name="
                        + user.getUserName()
                        + "&background=random&color=fff";

        user.setAvatarUrl(defaultAvatar);

        return userRepository.save(user);
    }

    public UserResponse createUser(UserUpsertRequest request) {
        return toResponse(createUser(toEntity(request)));
    }

    public User updateUser(String id, User updatedUser, MultipartFile avatar) throws IOException {

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // ✅ Update thông tin profile
        existingUser.setFullName(updatedUser.getFullName());
        existingUser.setUserName(updatedUser.getUserName());
        existingUser.setEmail(updatedUser.getEmail());

        // ✅ Upload avatar nếu có
        if (avatar != null && !avatar.isEmpty()) {
            String avatarUrl = cloudinaryService.uploadImage(avatar);
            existingUser.setAvatarUrl(avatarUrl);
        }

        return userRepository.save(existingUser);
    }

    public UserResponse updateUser(String id, UserUpsertRequest request, MultipartFile avatar) throws IOException {
        User updatedUser = new User();
        updatedUser.setFullName(request.getFullName());
        updatedUser.setUserName(request.getUserName());
        updatedUser.setEmail(request.getEmail());
        return toResponse(updateUser(id, updatedUser, avatar));
    }

    public ProfileOverviewResponse getProfileOverview(String id) {
        String userId = id;
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        long totalAttempts = userTestRepository.countByUserId(userId);
        long completedAttempts = userTestRepository.countByUserIdAndStatus(userId, UserTest.Status.COMPLETED);
        long inProgressAttempts = userTestRepository.countByUserIdAndStatus(userId, UserTest.Status.IN_PROGRESS);

        Role role = roleRepository.findByRoleId(user.getRoleId())
                .orElseThrow(() -> new NotFoundException("Role not found"));

        String roleName = role.getRoleName();

        Integer bestScore = userTestRepository.findTopByUserIdAndStatusOrderByTotalScoreDesc(userId, UserTest.Status.COMPLETED)
                .map(UserTest::getTotalScore)
                .orElse(0);

        Double averageScore = userTestRepository.findAverageScoreByUserIdAndStatus(userId, UserTest.Status.COMPLETED);
        LocalDateTime lastAttemptAt = userTestRepository.findTopByUserIdOrderByStartedAtDesc(userId)
                .map(UserTest::getStartedAt)
                .orElse(null);

        long totalVocabulary = userVocabularyRepository.countByUserId(userId);
        long learningVocabulary = userVocabularyRepository.countByUserIdAndStatus(userId, UserVocabulary.Status.learning);
        long masteredVocabulary = userVocabularyRepository.countByUserIdAndStatus(userId, UserVocabulary.Status.mastered);

        long approvedClassCount = classMemberRepository.countByUserIdAndStatus(userId, ClassMember.MemberStatus.APPROVED);
        long pendingClassCount = classMemberRepository.countByUserIdAndStatus(userId, ClassMember.MemberStatus.PENDING);

        return ProfileOverviewResponse.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .verified(user.getVerified())
                .roleId(user.getRoleId())
                .roleName(roleName)
                .createdAt(user.getCreatedAt())
                .testStats(ProfileOverviewResponse.TestStats.builder()
                        .totalAttempts(totalAttempts)
                        .completedAttempts(completedAttempts)
                        .inProgressAttempts(inProgressAttempts)
                        .bestScore(bestScore)
                        .averageScore(averageScore == null ? 0D : averageScore)
                        .lastAttemptAt(lastAttemptAt)
                        .build())
                .vocabularyStats(ProfileOverviewResponse.VocabularyStats.builder()
                        .totalVocabulary(totalVocabulary)
                        .learningVocabulary(learningVocabulary)
                        .masteredVocabulary(masteredVocabulary)
                        .build())
                .classStats(ProfileOverviewResponse.ClassStats.builder()
                        .approvedClassCount(approvedClassCount)
                        .pendingClassCount(pendingClassCount)
                        .build())
                .build();
    }

    public ProfileOverviewResponse getMyProfileOverview(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return getProfileOverview(userId);
    }

    public Optional<User> getUserCurrent(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return userRepository.findById(userId);
    }

    public Optional<UserResponse> getUserCurrentResponse(HttpServletRequest httpRequest) {
        return getUserCurrent(httpRequest).map(this::toResponse);
    }

    public boolean deleteUser(String id, HttpServletRequest httpRequest) {
        // 🔒 Chỉ admin được xoá user khác. User tự xoá account của mình cũng được.
        String currentUserId = authUtils.getUserId(httpRequest);
        boolean isSelf = currentUserId != null && currentUserId.equals(id);
        if (!isSelf && !authUtils.isAdmin(httpRequest)) {
            throw new ForbiddenException("Bạn không có quyền xoá user này.");
        }
        return userRepository.findById(id).map(user -> {
            userRepository.delete(user);
            return true;
        }).orElse(false);
    }

    /** Guard: chỉ admin được tạo user qua endpoint admin (đăng ký user mới phải qua /api/auth/register). */
    public void requireAdminToManageUsers(HttpServletRequest httpRequest) {
        if (!authUtils.isAdmin(httpRequest)) {
            throw new ForbiddenException("Chỉ admin được thao tác trực tiếp trên user.");
        }
    }

    /** Guard cho update user: cho phép chính chủ hoặc admin. */
    public void requireSelfOrAdminForUser(String targetUserId, HttpServletRequest httpRequest) {
        String currentUserId = authUtils.getUserId(httpRequest);
        boolean isSelf = currentUserId != null && currentUserId.equals(targetUserId);
        if (!isSelf && !authUtils.isAdmin(httpRequest)) {
            throw new ForbiddenException("Bạn chỉ có thể thao tác trên tài khoản của chính mình.");
        }
    }

}
