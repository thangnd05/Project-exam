package com.project_exam.backend.modules.users.user.service;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.infrastructure.cloudinary.CloudinaryService;
import com.project_exam.backend.modules.users.user.dto.UserUpsertRequest;
import com.project_exam.backend.modules.users.user.dto.ProfileOverviewResponse;
import com.project_exam.backend.modules.users.user.dto.ProfileActivityResponse;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.users.user.dto.UserResponse;
import com.project_exam.backend.modules.users.user.mapper.UserMapper;
import com.project_exam.backend.modules.users.user.mapper.UserProfileMapper;
import com.project_exam.backend.modules.users.user.domain.*;
import com.project_exam.backend.modules.users.rbac.domain.*;
import com.project_exam.backend.modules.posts.post.domain.*;
import com.project_exam.backend.modules.posts.comment.domain.*;
import com.project_exam.backend.modules.posts.category.domain.*;
import com.project_exam.backend.modules.posts.react.domain.*;
import com.project_exam.backend.modules.posts.saved.domain.*;
import com.project_exam.backend.modules.assessment.exam.domain.*;
import com.project_exam.backend.modules.assessment.test.domain.*;
import com.project_exam.backend.modules.assessment.attempt.domain.*;
import com.project_exam.backend.modules.vocabulary.album.domain.*;
import com.project_exam.backend.modules.vocabulary.word.domain.*;
import com.project_exam.backend.modules.vocabulary.learning.domain.*;
import com.project_exam.backend.modules.vocabulary.lookup.domain.*;
import com.project_exam.backend.modules.classroom.clazz.domain.*;
import com.project_exam.backend.modules.classroom.chapter.domain.*;
import com.project_exam.backend.modules.classroom.member.domain.*;
import com.project_exam.backend.modules.audit.domain.*;
import com.project_exam.backend.modules.users.user.repository.*;
import com.project_exam.backend.modules.users.rbac.repository.*;
import com.project_exam.backend.modules.posts.post.repository.*;
import com.project_exam.backend.modules.posts.comment.repository.*;
import com.project_exam.backend.modules.posts.category.repository.*;
import com.project_exam.backend.modules.posts.react.repository.*;
import com.project_exam.backend.modules.posts.saved.repository.*;
import com.project_exam.backend.modules.assessment.exam.repository.*;
import com.project_exam.backend.modules.assessment.test.repository.*;
import com.project_exam.backend.modules.assessment.attempt.repository.*;
import com.project_exam.backend.modules.vocabulary.album.repository.*;
import com.project_exam.backend.modules.vocabulary.word.repository.*;
import com.project_exam.backend.modules.vocabulary.learning.repository.*;
import com.project_exam.backend.modules.classroom.clazz.repository.*;
import com.project_exam.backend.modules.classroom.chapter.repository.*;
import com.project_exam.backend.modules.classroom.member.repository.*;
import com.project_exam.backend.modules.audit.repository.*;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final UserTestRepository userTestRepository;
    private final TestRepository testRepository;
    private final UserVocabularyRepository userVocabularyRepository;
    private final ClassMemberRepository classMemberRepository;
    private final AuthUtils authUtils;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final UserProfileMapper userProfileMapper;

    private UserResponse toResponse(User user) {
        return userMapper.toResponse(user);
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

    public PageResponse<UserResponse> findAllPaged(Integer page, Integer size, String keyword, String roleId, Boolean verified) {
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

        return PageResponse.from(userPage, this::toResponse);
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

        //  Auto avatar mặc định theo username (giống Google)
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
        return updateUser(id, updatedUser, avatar, null);
    }

    public User updateUser(String id, User updatedUser, MultipartFile avatar, Boolean verifiedOverride)
            throws IOException {

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        //  Update thông tin profile
        String newEmail = updatedUser.getEmail();
        boolean emailChanged = newEmail != null && !newEmail.isBlank()
                && !newEmail.equalsIgnoreCase(existingUser.getEmail());

        existingUser.setFullName(updatedUser.getFullName());
        existingUser.setUserName(updatedUser.getUserName());
        existingUser.setEmail(newEmail);

        //  Đổi sang email mới -> phải xác minh lại (tránh giữ trạng thái verified của email cũ).
        if (emailChanged) {
            existingUser.setVerified(false);
        }

        //  Upload avatar nếu có
        if (avatar != null && !avatar.isEmpty()) {
            String avatarUrl = cloudinaryService.uploadImage(avatar);
            existingUser.setAvatarUrl(avatarUrl);
        }

        //  Admin đổi trạng thái xác thực (đặt sau reset email để lựa chọn của admin thắng).
        if (verifiedOverride != null) {
            existingUser.setVerified(verifiedOverride);
        }

        return userRepository.save(existingUser);
    }

    public UserResponse updateUser(String id, UserUpsertRequest request, MultipartFile avatar) throws IOException {
        User updatedUser = new User();
        updatedUser.setFullName(request.getFullName());
        updatedUser.setUserName(request.getUserName());
        updatedUser.setEmail(request.getEmail());

        //  Chỉ admin (USER_MANAGE) mới được đổi trạng thái xác thực qua endpoint này.
        Boolean verifiedOverride =
                (request.getVerified() != null && authUtils.hasPermission(PermissionCatalog.USER_MANAGE))
                        ? request.getVerified()
                        : null;
        return toResponse(updateUser(id, updatedUser, avatar, verifiedOverride));
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

        return userProfileMapper.toProfileOverview(
                user,
                roleName,
                totalAttempts,
                completedAttempts,
                inProgressAttempts,
                bestScore,
                averageScore == null ? 0D : averageScore,
                lastAttemptAt,
                totalVocabulary,
                learningVocabulary,
                masteredVocabulary,
                approvedClassCount,
                pendingClassCount
        );
    }

    public ProfileOverviewResponse getMyProfileOverview(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return getProfileOverview(userId);
    }

    public ProfileActivityResponse getMyActivity(HttpServletRequest httpRequest, String monthParam, String yearParam) {
        String userId = authUtils.getUserId(httpRequest);

        java.time.YearMonth currentMonth = java.time.YearMonth.now();
        int currentYear = currentMonth.getYear();

        java.time.YearMonth month;
        try {
            month = (monthParam == null || monthParam.isBlank())
                    ? currentMonth
                    : java.time.YearMonth.parse(monthParam);
        } catch (Exception e) {
            month = currentMonth;
        }

        int year;
        try {
            year = (yearParam == null || yearParam.isBlank()) ? currentYear : Integer.parseInt(yearParam.trim());
        } catch (Exception e) {
            year = currentYear;
        }

        // Phạm vi query gộp: bao trùm cả tháng đang xem (biểu đồ ngày) lẫn cả năm đang xem (biểu đồ tháng).
        java.time.LocalDateTime monthStart = month.atDay(1).atStartOfDay();
        java.time.LocalDateTime monthEnd = month.plusMonths(1).atDay(1).atStartOfDay();
        java.time.LocalDateTime yearStart = java.time.LocalDate.of(year, 1, 1).atStartOfDay();
        java.time.LocalDateTime yearEnd = java.time.LocalDate.of(year + 1, 1, 1).atStartOfDay();
        java.time.LocalDateTime rangeStart = monthStart.isBefore(yearStart) ? monthStart : yearStart;
        java.time.LocalDateTime rangeEnd = monthEnd.isAfter(yearEnd) ? monthEnd : yearEnd;

        List<UserTest> attempts = userTestRepository.findByUserIdAndStartedAtRange(userId, rangeStart, rangeEnd);

        // Thời lượng tối đa từng đề để chặn trường hợp mở bài rồi bỏ đó (elapsed bị thổi phồng).
        java.util.Map<String, Integer> durationByTestId = new java.util.HashMap<>();
        List<String> testIds = attempts.stream().map(UserTest::getTestId).distinct().toList();
        if (!testIds.isEmpty()) {
            testRepository.findAllById(testIds)
                    .forEach(t -> durationByTestId.put(t.getTestId(), t.getDurationMinutes()));
        }

        // Cộng dồn thời gian (phút) theo ngày-trong-tháng-xem và theo từng tháng-trong-năm-xem.
        java.util.Map<Integer, Long> minutesByDay = new java.util.HashMap<>();
        long[] minutesByMonthOfYear = new long[13]; // index 1..12
        for (UserTest ut : attempts) {
            long mins = elapsedMinutes(ut, durationByTestId.get(ut.getTestId()));
            if (mins <= 0) continue;
            java.time.LocalDateTime started = ut.getStartedAt();
            if (started.getYear() == year) {
                minutesByMonthOfYear[started.getMonthValue()] += mins;
            }
            if (java.time.YearMonth.from(started).equals(month)) {
                minutesByDay.merge(started.getDayOfMonth(), mins, Long::sum);
            }
        }

        int lengthOfMonth = month.lengthOfMonth();
        List<ProfileActivityResponse.DayActivity> days = new java.util.ArrayList<>();
        long activeDays = 0;
        long totalMinutes = 0;
        for (int d = 1; d <= lengthOfMonth; d++) {
            long m = minutesByDay.getOrDefault(d, 0L);
            if (m > 0) activeDays++;
            totalMinutes += m;
            days.add(ProfileActivityResponse.DayActivity.builder()
                    .date(month.atDay(d).toString())
                    .day(d)
                    .minutes(m)
                    .build());
        }

        // Đủ 12 tháng của năm đang xem (tháng 1 -> 12), điền đủ kể cả tháng 0 phút.
        List<ProfileActivityResponse.MonthTime> monthlyTime = new java.util.ArrayList<>();
        for (int mo = 1; mo <= 12; mo++) {
            monthlyTime.add(ProfileActivityResponse.MonthTime.builder()
                    .month(java.time.YearMonth.of(year, mo).toString())
                    .minutes(minutesByMonthOfYear[mo])
                    .build());
        }

        // Danh sách tháng/năm có thể chọn: từ thời điểm làm bài sớm nhất tới hiện tại (mới nhất trước).
        java.time.LocalDateTime earliest = userTestRepository.findEarliestStartedAt(userId);
        java.time.YearMonth fromMonth = earliest != null ? java.time.YearMonth.from(earliest) : currentMonth;
        if (month.isBefore(fromMonth)) fromMonth = month;
        List<String> availableMonths = new java.util.ArrayList<>();
        for (java.time.YearMonth ym = currentMonth; !ym.isBefore(fromMonth); ym = ym.minusMonths(1)) {
            availableMonths.add(ym.toString());
        }

        int fromYear = Math.min(fromMonth.getYear(), year);
        List<String> availableYears = new java.util.ArrayList<>();
        for (int y = currentYear; y >= fromYear; y--) {
            availableYears.add(String.valueOf(y));
        }

        return ProfileActivityResponse.builder()
                .month(month.toString())
                .days(days)
                .totalMinutes(totalMinutes)
                .activeDays(activeDays)
                .year(String.valueOf(year))
                .monthlyTime(monthlyTime)
                .availableMonths(availableMonths)
                .availableYears(availableYears)
                .build();
    }

    /** Thời gian làm 1 bài (phút) = finishedAt - startedAt, chặn trên theo thời lượng đề. */
    private long elapsedMinutes(UserTest ut, Integer testDurationMinutes) {
        if (ut.getStartedAt() == null || ut.getFinishedAt() == null) return 0;
        long minutes = Math.round(
                java.time.Duration.between(ut.getStartedAt(), ut.getFinishedAt()).getSeconds() / 60.0);
        if (minutes <= 0) minutes = 1; // bài rất nhanh vẫn tính 1 phút
        if (testDurationMinutes != null && testDurationMinutes > 0 && minutes > testDurationMinutes) {
            minutes = testDurationMinutes;
        }
        return minutes;
    }

    public Optional<User> getUserCurrent(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return userRepository.findById(userId);
    }

    public Optional<UserResponse> getUserCurrentResponse(HttpServletRequest httpRequest) {
        return getUserCurrent(httpRequest).map(this::toResponse);
    }

    public boolean deleteUser(String id, HttpServletRequest httpRequest) {
        //  Chỉ admin được xoá user khác. User tự xoá account của mình cũng được.
        String currentUserId = authUtils.getUserId(httpRequest);
        boolean isSelf = currentUserId != null && currentUserId.equals(id);
        if (!isSelf && !authUtils.hasPermission(PermissionCatalog.USER_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền xoá user này.");
        }
        return userRepository.findById(id).map(user -> {
            userRepository.delete(user);
            return true;
        }).orElse(false);
    }

    /** Guard: chỉ admin được tạo user qua endpoint admin (đăng ký user mới phải qua /api/auth/register). */
    public void requireAdminToManageUsers(HttpServletRequest httpRequest) {
        if (!authUtils.hasPermission(PermissionCatalog.USER_MANAGE)) {
            throw new ForbiddenException("Chỉ admin được thao tác trực tiếp trên user.");
        }
    }

    /** Guard cho update user: cho phép chính chủ hoặc admin. */
    public void requireSelfOrAdminForUser(String targetUserId, HttpServletRequest httpRequest) {
        String currentUserId = authUtils.getUserId(httpRequest);
        boolean isSelf = currentUserId != null && currentUserId.equals(targetUserId);
        if (!isSelf && !authUtils.hasPermission(PermissionCatalog.USER_MANAGE)) {
            throw new ForbiddenException("Bạn chỉ có thể thao tác trên tài khoản của chính mình.");
        }
    }

}
