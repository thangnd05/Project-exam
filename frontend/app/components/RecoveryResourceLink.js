import { getRecoveryResourceLinkProps } from '@/app/utils/recoveryResource';
import { getApiBaseUrl } from '@/app/utils/mediaUrl';

const API_BASE = getApiBaseUrl();

function RecoveryResourceLink({ resource, className, children }) {
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
