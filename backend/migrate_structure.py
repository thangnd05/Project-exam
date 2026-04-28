#!/usr/bin/env python3
"""
Migration script: Layer-by-Layer → Folder-by-Feature
Structure: shared/ + infrastructure/ + modules/
"""

import os
import shutil
import re

BASE_DIR = "/home/thangnd05/Project-exam/backend/src/main/java/com/project_exam/backend"
BASE_PKG = "com.project_exam.backend"

# Map: old_relative_path → new_package_suffix (after BASE_PKG)
FILE_MIGRATIONS = {

    # ══════════════════════════════════════════════════════
    # SHARED
    # ══════════════════════════════════════════════════════
    "exception/GlobalExceptionHandler.java":    "shared.exception",
    "exception/ApiErrorResponse.java":          "shared.exception",
    "exception/AppException.java":              "shared.exception",
    "exception/BadRequestException.java":       "shared.exception",
    "exception/ConflictException.java":         "shared.exception",
    "exception/ForbiddenException.java":        "shared.exception",
    "exception/NotFoundException.java":         "shared.exception",
    "exception/UnauthorizedException.java":     "shared.exception",

    "util/AuthUtils.java":                      "shared.util",
    "util/EmailUtil.java":                      "shared.util",
    "util/EmailUtils.java":                     "shared.util",
    "util/OtpUtil.java":                        "shared.util",

    # ══════════════════════════════════════════════════════
    # INFRASTRUCTURE
    # ══════════════════════════════════════════════════════
    "config/SecurityConfig.java":               "infrastructure.security",
    "config/PasswordEncoderConfig.java":        "infrastructure.security",
    "config/CustomUserDetailsService.java":     "infrastructure.security",
    "security/JwtService.java":                 "infrastructure.security",
    "security/JwtAuthenticationFilter.java":    "infrastructure.security",

    "config/WebConfig.java":                    "infrastructure.web",
    "config/OpenApiConfig.java":                "infrastructure.web",
    "config/AuditLogInterceptor.java":          "infrastructure.web",

    "cloudinary/CloudinaryService.java":        "infrastructure.cloudinary",

    "vnpay/Config.java":                        "infrastructure.vnpay",
    "vnpay/VNPayController.java":               "infrastructure.vnpay",

    "scheduler/UserCleanupScheduler.java":      "infrastructure.scheduler",
    "loader/DataLoader.java":                   "infrastructure.loader",

    # ══════════════════════════════════════════════════════
    # MODULE: AUTH
    # ══════════════════════════════════════════════════════
    "security/AuthService.java":                "modules.auth.service",
    "controllers/AuthController.java":          "modules.auth.controller",

    "dto/auth/UserTokenInfo.java":              "modules.auth.dto",
    "dto/request/LoginRequest.java":            "modules.auth.dto",
    "dto/request/RegisterRequest.java":         "modules.auth.dto",
    "dto/request/ForgotPasswordRequest.java":   "modules.auth.dto",
    "dto/request/ResetPasswordRequest.java":    "modules.auth.dto",
    "dto/request/ChangePasswordRequest.java":   "modules.auth.dto",
    "dto/response/AuthResponse.java":           "modules.auth.dto",
    "dto/response/AuthMessageResponse.java":    "modules.auth.dto",

    # ══════════════════════════════════════════════════════
    # MODULE: USERS
    # ══════════════════════════════════════════════════════
    "models/User.java":                         "modules.users.domain",
    "models/Role.java":                         "modules.users.domain",
    "models/EmailVerification.java":            "modules.users.domain",
    "models/PasswordResetToken.java":           "modules.users.domain",

    "repositories/UserRepository.java":         "modules.users.repository",
    "repositories/RoleRepository.java":         "modules.users.repository",
    "repositories/EmailVerificationRepository.java":    "modules.users.repository",
    "repositories/PasswordResetTokenRepository.java":   "modules.users.repository",

    "services/UserService.java":                "modules.users.service",
    "services/RoleService.java":                "modules.users.service",
    "services/EmailVerificationService.java":   "modules.users.service",

    "controllers/UserController.java":          "modules.users.controller",
    "controllers/RoleController.java":          "modules.users.controller",

    "dto/request/UserUpsertRequest.java":       "modules.users.dto",
    "dto/request/RoleRequest.java":             "modules.users.dto",
    "dto/response/UserResponse.java":           "modules.users.dto",
    "dto/response/UserPageResponse.java":       "modules.users.dto",
    "dto/response/RoleResponse.java":           "modules.users.dto",
    "dto/response/ProfileOverviewResponse.java":"modules.users.dto",

    # ══════════════════════════════════════════════════════
    # MODULE: POSTS
    # ══════════════════════════════════════════════════════
    "models/Post.java":                         "modules.posts.domain",
    "models/PostImage.java":                    "modules.posts.domain",
    "models/PostCategory.java":                 "modules.posts.domain",
    "models/Category.java":                     "modules.posts.domain",
    "models/Comment.java":                      "modules.posts.domain",
    "models/React.java":                        "modules.posts.domain",

    "repositories/PostRepository.java":         "modules.posts.repository",
    "repositories/PostImageRepository.java":    "modules.posts.repository",
    "repositories/PostCategoryRepository.java": "modules.posts.repository",
    "repositories/CategoryRepository.java":     "modules.posts.repository",
    "repositories/CommentRepository.java":      "modules.posts.repository",
    "repositories/ReactRepository.java":        "modules.posts.repository",

    "services/PostService.java":                "modules.posts.service",
    "services/CategoryService.java":            "modules.posts.service",
    "services/CommentService.java":             "modules.posts.service",
    "services/ReactService.java":               "modules.posts.service",

    "controllers/PostController.java":          "modules.posts.controller",
    "controllers/CategoryController.java":      "modules.posts.controller",
    "controllers/CommentController.java":       "modules.posts.controller",
    "controllers/ReactController.java":         "modules.posts.controller",

    "dto/request/PostUpsertRequest.java":       "modules.posts.dto",
    "dto/request/CategoryRequest.java":         "modules.posts.dto",
    "dto/request/CommentRequest.java":          "modules.posts.dto",
    "dto/request/ReactRequest.java":            "modules.posts.dto",
    "dto/response/PostResponse.java":           "modules.posts.dto",
    "dto/response/PostSummaryResponse.java":    "modules.posts.dto",
    "dto/response/PostPageResponse.java":       "modules.posts.dto",
    "dto/response/CategoryResponse.java":       "modules.posts.dto",
    "dto/response/CommentResponse.java":        "modules.posts.dto",
    "dto/response/ReactSummaryResponse.java":   "modules.posts.dto",

    # ══════════════════════════════════════════════════════
    # MODULE: ASSESSMENT → EXAM
    # ══════════════════════════════════════════════════════
    "models/ExamType.java":                     "modules.assessment.exam.domain",
    "models/Skill.java":                        "modules.assessment.exam.domain",
    "models/ExamPart.java":                     "modules.assessment.exam.domain",
    "models/Question.java":                     "modules.assessment.exam.domain",
    "models/Answer.java":                       "modules.assessment.exam.domain",
    "models/Passage.java":                      "modules.assessment.exam.domain",
    "models/PassageMedia.java":                 "modules.assessment.exam.domain",
    "models/ScoringConversion.java":            "modules.assessment.exam.domain",

    "repositories/ExamTypeRepository.java":     "modules.assessment.exam.repository",
    "repositories/SkillRepository.java":        "modules.assessment.exam.repository",
    "repositories/ExamPartRepository.java":     "modules.assessment.exam.repository",
    "repositories/QuestionRepository.java":     "modules.assessment.exam.repository",
    "repositories/AnswerRepository.java":       "modules.assessment.exam.repository",
    "repositories/PassageRepository.java":      "modules.assessment.exam.repository",
    "repositories/PassageMediaRepository.java": "modules.assessment.exam.repository",
    "repositories/ScoringConversionRepository.java": "modules.assessment.exam.repository",

    "services/ExamAndTest/ExamTypeService.java":    "modules.assessment.exam.service",
    "services/ExamAndTest/SkillService.java":        "modules.assessment.exam.service",
    "services/ExamAndTest/ExamPartService.java":     "modules.assessment.exam.service",
    "services/ExamAndTest/QuestionService.java":     "modules.assessment.exam.service",
    "services/ExamAndTest/AnswerService.java":        "modules.assessment.exam.service",
    "services/ExamAndTest/PassageService.java":       "modules.assessment.exam.service",
    "services/PassageMediaService.java":             "modules.assessment.exam.service",
    "services/ExamAndTest/ScoringConversionService.java": "modules.assessment.exam.service",
    "services/ExamAndTest/QuestionDocumentImportService.java": "modules.assessment.exam.service",

    "controllers/ExamTypeController.java":      "modules.assessment.exam.controller",
    "controllers/SkillController.java":         "modules.assessment.exam.controller",
    "controllers/ExamPartController.java":      "modules.assessment.exam.controller",
    "controllers/QuestionController.java":      "modules.assessment.exam.controller",
    "controllers/AnswerController.java":        "modules.assessment.exam.controller",
    "controllers/PassageController.java":       "modules.assessment.exam.controller",
    "controllers/PassageMediaController.java":  "modules.assessment.exam.controller",
    "controllers/ScoringConversionController.java": "modules.assessment.exam.controller",

    "dto/request/ExamTypeRequest.java":         "modules.assessment.exam.dto",
    "dto/request/SkillRequest.java":            "modules.assessment.exam.dto",
    "dto/request/ExamPartRequest.java":         "modules.assessment.exam.dto",
    "dto/request/QuestionCreateRequest.java":   "modules.assessment.exam.dto",
    "dto/request/NormalQuestionRequest.java":   "modules.assessment.exam.dto",
    "dto/request/AnswerRequest.java":           "modules.assessment.exam.dto",
    "dto/request/PassageRequest.java":          "modules.assessment.exam.dto",
    "dto/request/PassageMediaRequest.java":     "modules.assessment.exam.dto",
    "dto/request/BulkCreateQuestionsToBankRequest.java": "modules.assessment.exam.dto",
    "dto/request/BulkPassageGroupRequest.java": "modules.assessment.exam.dto",
    "dto/request/BulkQuestionWithPassageRequest.java": "modules.assessment.exam.dto",
    "dto/request/CreateQuestionAndAttachRequest.java": "modules.assessment.exam.dto",
    "dto/request/PassageQuestionGroup.java":    "modules.assessment.exam.dto",
    "dto/request/ScoringConversionRequest.java": "modules.assessment.exam.dto",
    "dto/response/ExamTypeResponse.java":       "modules.assessment.exam.dto",
    "dto/response/SkillResponse.java":          "modules.assessment.exam.dto",
    "dto/response/ExamPartResponse.java":       "modules.assessment.exam.dto",
    "dto/response/PartResponse.java":           "modules.assessment.exam.dto",
    "dto/response/PassageResponse.java":        "modules.assessment.exam.dto",
    "dto/response/PassageMediaResponse.java":   "modules.assessment.exam.dto",
    "dto/response/ScoringConversionResponse.java": "modules.assessment.exam.dto",
    "dto/response/AddRandomQuestionsResponse.java": "modules.assessment.exam.dto",
    "dto/response/admin/AnswerAdminResponse.java":       "modules.assessment.exam.dto",
    "dto/response/admin/QuestionAdminResponse.java":     "modules.assessment.exam.dto",
    "dto/response/admin/QuestionGroupAdminResponse.java": "modules.assessment.exam.dto",
    "dto/response/admin/TestAdminResponse.java":         "modules.assessment.test.dto",
    "dto/response/admin/TestPartAdminResponse.java":     "modules.assessment.test.dto",

    # ══════════════════════════════════════════════════════
    # MODULE: ASSESSMENT → TEST
    # ══════════════════════════════════════════════════════
    "models/Test.java":                         "modules.assessment.test.domain",
    "models/TestPart.java":                     "modules.assessment.test.domain",
    "models/TestQuestion.java":                 "modules.assessment.test.domain",
    "models/TestStatus.java":                   "modules.assessment.test.domain",

    "repositories/TestRepository.java":         "modules.assessment.test.repository",
    "repositories/TestPartRepository.java":     "modules.assessment.test.repository",
    "repositories/TestQuestionRepository.java": "modules.assessment.test.repository",

    "services/ExamAndTest/TestService.java":     "modules.assessment.test.service",
    "services/ExamAndTest/TestPartService.java": "modules.assessment.test.service",
    "services/ExamAndTest/TestQuestionService.java": "modules.assessment.test.service",

    "controllers/TestController.java":          "modules.assessment.test.controller",
    "controllers/TestPartController.java":      "modules.assessment.test.controller",
    "controllers/TestQuestionController.java":  "modules.assessment.test.controller",

    "dto/request/CreateTestRequest.java":       "modules.assessment.test.dto",
    "dto/request/TestPartRequest.java":         "modules.assessment.test.dto",
    "dto/request/TestQuestionRequest.java":     "modules.assessment.test.dto",
    "dto/request/AddQuestionsToTestRequest.java": "modules.assessment.test.dto",
    "dto/request/AddRandomQuestionsToTestRequest.java": "modules.assessment.test.dto",
    "dto/response/TestPartSimpleResponse.java": "modules.assessment.test.dto",
    "dto/response/TestQuestionResponse.java":   "modules.assessment.test.dto",
    "dto/response/user/AnswerResponse.java":    "modules.assessment.test.dto",
    "dto/response/user/QuestionGroupResponse.java": "modules.assessment.test.dto",
    "dto/response/user/QuestionResponse.java":  "modules.assessment.test.dto",
    "dto/response/user/TestPartResponse.java":  "modules.assessment.test.dto",
    "dto/response/user/TestResponse.java":      "modules.assessment.test.dto",

    # ══════════════════════════════════════════════════════
    # MODULE: ASSESSMENT → ATTEMPT (UserTest)
    # ══════════════════════════════════════════════════════
    "models/UserTest.java":                     "modules.assessment.attempt.domain",
    "models/UserAnswer.java":                   "modules.assessment.attempt.domain",
    "models/Evaluation.java":                   "modules.assessment.attempt.domain",

    "repositories/UserTestRepository.java":     "modules.assessment.attempt.repository",
    "repositories/UserAnswerRepository.java":   "modules.assessment.attempt.repository",
    "repositories/EvaluationRepository.java":   "modules.assessment.attempt.repository",

    "services/ExamAndTest/UserTestService.java":  "modules.assessment.attempt.service",
    "services/ExamAndTest/UserAnswerService.java": "modules.assessment.attempt.service",
    "services/EvaluationService.java":           "modules.assessment.attempt.service",

    "controllers/UserTestController.java":      "modules.assessment.attempt.controller",
    "controllers/UserAnswerController.java":    "modules.assessment.attempt.controller",
    "controllers/EvaluationController.java":   "modules.assessment.attempt.controller",

    "dto/request/StartUserTestRequest.java":    "modules.assessment.attempt.dto",
    "dto/request/UserAnswerRequest.java":       "modules.assessment.attempt.dto",
    "dto/request/UserTestUpdateRequest.java":   "modules.assessment.attempt.dto",
    "dto/request/EvaluationRequest.java":       "modules.assessment.attempt.dto",
    "dto/request/PracticeCheckRequest.java":    "modules.assessment.attempt.dto",
    "dto/response/UserTestResponse.java":       "modules.assessment.attempt.dto",
    "dto/response/UserAnswerResponse.java":     "modules.assessment.attempt.dto",
    "dto/response/EvaluationResponse.java":     "modules.assessment.attempt.dto",
    "dto/response/EvaluationPageResponse.java": "modules.assessment.attempt.dto",
    "dto/response/PracticeCheckResponse.java":  "modules.assessment.attempt.dto",
    "dto/response/PracticeOptionResponse.java": "modules.assessment.attempt.dto",
    "dto/response/PracticeQuestionResponse.java": "modules.assessment.attempt.dto",
    "dto/response/ResultSummaryDto.java":       "modules.assessment.attempt.dto",

    # ══════════════════════════════════════════════════════
    # MODULE: VOCABULARY
    # ══════════════════════════════════════════════════════
    "models/VocabularyAlbum.java":              "modules.vocabulary.domain",
    "models/Vocabulary.java":                   "modules.vocabulary.domain",
    "models/UserVocabulary.java":               "modules.vocabulary.domain",
    "models/DictionaryResult.java":             "modules.vocabulary.domain",

    "repositories/VocabularyAlbumRepository.java": "modules.vocabulary.repository",
    "repositories/VocabularyRepository.java":   "modules.vocabulary.repository",
    "repositories/UserVocabularyRepository.java": "modules.vocabulary.repository",

    "services/LearningVoca/VocabularyAlbumService.java": "modules.vocabulary.service",
    "services/LearningVoca/VocabularyService.java":      "modules.vocabulary.service",
    "services/LearningVoca/UserVocabularyService.java":  "modules.vocabulary.service",
    "services/LearningVoca/PracticeService.java":        "modules.vocabulary.service",
    "services/ApiExtend/TextToSpeechService.java":       "modules.vocabulary.service",
    "services/ApiExtend/DictionaryApiService.java":      "modules.vocabulary.service",
    "services/ApiExtend/GeminiService.java":             "modules.vocabulary.service",

    "controllers/VocabularyAlbumController.java": "modules.vocabulary.controller",
    "controllers/VocabularyController.java":    "modules.vocabulary.controller",
    "controllers/UserVocabularyController.java": "modules.vocabulary.controller",
    "controllers/PracticeController.java":      "modules.vocabulary.controller",
    "controllers/TtsController.java":           "modules.vocabulary.controller",

    "dto/request/VocabularyAlbumRequest.java":  "modules.vocabulary.dto",
    "dto/request/VocabularyRequest.java":       "modules.vocabulary.dto",
    "dto/request/UserVocabularyRequest.java":   "modules.vocabulary.dto",
    "dto/response/VocabularyAlbumResponse.java": "modules.vocabulary.dto",
    "dto/response/VocabularyResponse.java":     "modules.vocabulary.dto",
    "dto/response/UserVocabularyResponse.java": "modules.vocabulary.dto",

    # ══════════════════════════════════════════════════════
    # MODULE: CLASSROOM
    # ══════════════════════════════════════════════════════
    "models/ClassEntity.java":                  "modules.classroom.domain",
    "models/ClassMember.java":                  "modules.classroom.domain",
    "models/Chapter.java":                      "modules.classroom.domain",

    "repositories/ClassRepository.java":        "modules.classroom.repository",
    "repositories/ClassMemberRepository.java":  "modules.classroom.repository",
    "repositories/ChapterRepository.java":      "modules.classroom.repository",

    "services/ClassService.java":               "modules.classroom.service",
    "services/ClassMemberService.java":         "modules.classroom.service",
    "services/ChapterService.java":             "modules.classroom.service",

    "controllers/ClassController.java":         "modules.classroom.controller",
    "controllers/ClassMemberController.java":   "modules.classroom.controller",
    "controllers/ChapterController.java":       "modules.classroom.controller",

    "dto/request/ClassRequest.java":            "modules.classroom.dto",
    "dto/request/ClassMemberActionRequest.java": "modules.classroom.dto",
    "dto/request/ClassMemberJoinRequest.java":  "modules.classroom.dto",
    "dto/request/ChapterRequest.java":          "modules.classroom.dto",
    "dto/response/ClassResponse.java":          "modules.classroom.dto",
    "dto/response/ClassSimpleResponse.java":    "modules.classroom.dto",
    "dto/response/ClassMemberResponse.java":    "modules.classroom.dto",
    "dto/response/ClassStudentResponse.java":   "modules.classroom.dto",
    "dto/response/ChapterResponse.java":        "modules.classroom.dto",

    # ══════════════════════════════════════════════════════
    # MODULE: AUDIT
    # ══════════════════════════════════════════════════════
    "models/AuditLog.java":                     "modules.audit.domain",
    "repositories/AuditLogRepository.java":     "modules.audit.repository",
    "services/AuditLogService.java":            "modules.audit.service",
    "controllers/AuditLogController.java":      "modules.audit.controller",
    "dto/response/AuditLogResponse.java":       "modules.audit.dto",
    "dto/response/AuditLogPageResponse.java":   "modules.audit.dto",
}


def pkg_to_path(pkg_suffix: str) -> str:
    """Convert package suffix to directory path."""
    return pkg_suffix.replace(".", "/")


def build_import_replacements() -> list[tuple[str, str]]:
    """Build list of (old_import_prefix, new_import_prefix) tuples."""
    replacements = []

    # Group files by their class name to build import map
    for rel_path, new_pkg_suffix in FILE_MIGRATIONS.items():
        class_name = os.path.basename(rel_path).replace(".java", "")
        # Compute old package from rel_path
        old_pkg_parts = os.path.dirname(rel_path).replace("/", ".")
        old_pkg = f"{BASE_PKG}.{old_pkg_parts}" if old_pkg_parts else BASE_PKG
        new_pkg = f"{BASE_PKG}.{new_pkg_suffix}"

        old_import = f"{old_pkg}.{class_name}"
        new_import = f"{new_pkg}.{class_name}"
        if old_import != new_import:
            replacements.append((old_import, new_import))

    return replacements


def update_package_declaration(content: str, new_pkg_suffix: str) -> str:
    new_pkg = f"{BASE_PKG}.{new_pkg_suffix}"
    return re.sub(r"^package\s+[\w.]+;", f"package {new_pkg};", content, count=1, flags=re.MULTILINE)


def update_imports(content: str, replacements: list[tuple[str, str]]) -> str:
    for old_import, new_import in replacements:
        content = content.replace(f"import {old_import};", f"import {new_import};")
    return content


def migrate():
    import_replacements = build_import_replacements()

    # Step 1: Copy files to new locations with updated package declarations
    print("=" * 60)
    print("STEP 1: Copying files to new locations...")
    print("=" * 60)
    copied = 0
    skipped = 0
    for rel_path, new_pkg_suffix in FILE_MIGRATIONS.items():
        src = os.path.join(BASE_DIR, rel_path)
        if not os.path.exists(src):
            print(f"  [SKIP] Not found: {rel_path}")
            skipped += 1
            continue

        dest_dir = os.path.join(BASE_DIR, pkg_to_path(new_pkg_suffix))
        os.makedirs(dest_dir, exist_ok=True)
        dest = os.path.join(dest_dir, os.path.basename(rel_path))

        with open(src, "r", encoding="utf-8") as f:
            content = f.read()

        content = update_package_declaration(content, new_pkg_suffix)
        with open(dest, "w", encoding="utf-8") as f:
            f.write(content)

        print(f"  [OK] {rel_path} → {new_pkg_suffix}")
        copied += 1

    print(f"\nCopied: {copied}, Skipped: {skipped}\n")

    # Step 2: Update imports in ALL Java files in new locations
    print("=" * 60)
    print("STEP 2: Updating import statements in all Java files...")
    print("=" * 60)
    updated_files = 0
    for root, dirs, files in os.walk(BASE_DIR):
        # Skip old directories (they still exist at this point)
        for fname in files:
            if not fname.endswith(".java"):
                continue
            fpath = os.path.join(root, fname)
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
            new_content = update_imports(content, import_replacements)
            if new_content != content:
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                updated_files += 1
                print(f"  [UPDATED] {fpath[len(BASE_DIR)+1:]}")

    print(f"\nUpdated imports in: {updated_files} files\n")

    # Step 3: Remove old source files
    print("=" * 60)
    print("STEP 3: Removing old source files...")
    print("=" * 60)
    OLD_DIRS = [
        "controllers", "services", "repositories", "models",
        "dto", "config", "security", "exception",
        "util", "cloudinary", "vnpay", "scheduler", "loader",
    ]
    for d in OLD_DIRS:
        old_path = os.path.join(BASE_DIR, d)
        if os.path.exists(old_path):
            shutil.rmtree(old_path)
            print(f"  [REMOVED] {d}/")

    print("\n✅ Migration complete!")
    print("Next step: Run `mvn clean compile` to verify.")


if __name__ == "__main__":
    migrate()
