import { queryClient } from '~/shared/config/queryClient';
import { claimGuestTests } from '~/shared/api/userTestApi';
import { getGuestSessionId, clearGuestSessionId } from '~/shared/utils/guestSession';

const OAUTH_REDIRECT_KEY = 'postLoginRedirect';

export const getRedirectTarget = (location, fallback = '/') => {
  const from = location?.state?.from;
  if (from && from.pathname) {
    return `${from.pathname}${from.search || ''}${from.hash || ''}`;
  }
  return fallback;
};

export const saveOAuthRedirect = (target) => {
  if (typeof window === 'undefined' || !target || target === '/') return;
  window.sessionStorage.setItem(OAUTH_REDIRECT_KEY, target);
};

export const takeOAuthRedirect = (fallback = '/') => {
  if (typeof window === 'undefined') return fallback;
  const target = window.sessionStorage.getItem(OAUTH_REDIRECT_KEY);
  window.sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
  return target || fallback;
};

export const claimGuestAfterLogin = async () => {
  const guestSessionId = getGuestSessionId();
  if (!guestSessionId) return 0;
  try {
    const res = await claimGuestTests(guestSessionId);
    clearGuestSessionId();

    queryClient.invalidateQueries();
    return res?.claimed || 0;
  } catch (err) {

    console.error('Claim guest tests failed:', err);
    return 0;
  }
};
