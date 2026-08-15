import { getRecoveryResourceLinkProps } from '@/app/utils/recoveryResource';
import type { RecoveryResourceLike } from '@/app/utils/recoveryResource';
import { getApiBaseUrl } from '@/app/utils/mediaUrl';

const API_BASE = getApiBaseUrl();

type RecoveryResourceLinkProps = {
  resource?: RecoveryResourceLike | null;
  className?: string;
  children?: React.ReactNode;
};

function RecoveryResourceLink({ resource, className, children }: RecoveryResourceLinkProps) {
  const linkProps = getRecoveryResourceLinkProps(resource, API_BASE);
  if (!linkProps) {
    return null;
  }

  return (
    <a
      href={linkProps.href}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export default RecoveryResourceLink;
