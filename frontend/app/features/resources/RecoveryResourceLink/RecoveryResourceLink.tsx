'use client';

import { getRecoveryResourceLinkProps } from '@/app/features/resources/recoveryResource';
import type { RecoveryResourceLike } from '@/app/features/resources/recoveryResource';
import { useLocalizeHref } from '@/app/i18n/navigation';
import { getApiBaseUrl } from '@/app/utils/mediaUrl';

const API_BASE = getApiBaseUrl();

type RecoveryResourceLinkProps = {
  resource?: RecoveryResourceLike | null;
  className?: string;
  children?: React.ReactNode;
};

function RecoveryResourceLink({ resource, className, children }: RecoveryResourceLinkProps) {
  const localizeHref = useLocalizeHref();
  const linkProps = getRecoveryResourceLinkProps(resource, API_BASE);
  if (!linkProps) {
    return null;
  }

  return (
    <a
      href={localizeHref(linkProps.href)}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export default RecoveryResourceLink;
