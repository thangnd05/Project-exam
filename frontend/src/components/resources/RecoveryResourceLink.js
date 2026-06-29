import React from 'react';
import { Link } from 'react-router-dom';
import { getRecoveryResourceLinkProps } from '~/utils/recoveryResource';

const API_BASE = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

function RecoveryResourceLink({ resource, className, children }) {
  const linkProps = getRecoveryResourceLinkProps(resource, API_BASE);
  if (!linkProps) {
    return null;
  }

  if (!linkProps.external) {
    return (
      <Link to={linkProps.to} className={className}>
        {children}
      </Link>
    );
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
