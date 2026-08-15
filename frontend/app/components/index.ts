/**
 * Đầu mối import cho component dùng chung.
 *
 * Chỉ gom các component ĐƠN LẺ. Các nhóm theo lĩnh vực (admin/, tests/, layouts/, modal/,
 * gamification/, learning-plans/, exam-layout/, icons/, Review/, Notes/, Recaptcha/) vẫn import
 * theo đường dẫn — gom cả vào đây sẽ kéo hàng chục component client vào mọi chỗ chỉ cần một cái.
 */
export { default as AuthGuard } from './AuthGuard/AuthGuard';
export { default as CertificateCanvas } from './CertificateCanvas/CertificateCanvas';
export { default as CreateClassModal } from './CreateClassModal/CreateClassModal';
export { default as CreatePostModal } from './CreatePostModal/CreatePostModal';
export { default as ErrorBoundary } from './ErrorBoundary/ErrorBoundary';
export { default as ErrorView } from './ErrorView/ErrorView';
export { default as InfoTip } from './InfoTip/InfoTip';
export { default as JoinClassModal } from './JoinClassModal/JoinClassModal';
export { default as Loading } from './Loading/Loading';
export { default as NotFound } from './NotFound/NotFound';
export { default as PageHeader } from './PageHeader/PageHeader';
export { default as Pagination } from './Pagination/Pagination';
export { default as ProfileSectionModal } from './ProfileSectionModal/ProfileSectionModal';
export { default as RecoveryResourceLink } from './RecoveryResourceLink/RecoveryResourceLink';
export { default as RichTextEditor } from './RichTextEditor/RichTextEditor';
export { default as TagSelector } from './TagSelector/TagSelector';
export { default as TargetPlanTabs } from './TargetPlanTabs/TargetPlanTabs';
export { default as BackgroundDecor } from './BackgroundDecor/index';
export { default as ButtonPrime } from './Button/ButtonPrime';
export { default as MotionSection } from './MotionSection/index';
