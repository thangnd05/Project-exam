'use client';

import Link, { usePathname, useRouter } from '@/app/i18n/navigation';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import classNames from 'classnames/bind';
import {motion} from 'framer-motion';
import {Dropdown} from 'react-bootstrap';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  BarChart3,
  Brain,
  Calculator,
  MessageSquareWarning,
  Layers,
  ListChecks,
  ShieldAlert,
  KeyRound,
  FileStack,
  ChevronLeft,
  ChevronRight,
  House,
  Menu,
  X,
  Folder,
  FileText,
  FileQuestion,
  Library,
  Tag,
  Tags,
  BookOpen,
  Target,
  Coins,
  Sparkles,
  Flame,
  Award,
  Mail,
} from 'lucide-react';
import routes from '@/app/configs/Routes';
import { adminPermissionByPath } from '@/app/configs/adminPermissions';
import { mediaDown } from '@/app/assets/styles/breakpoints';
import images, {imageAssets} from '@/app/assets/images';
import { useAuth } from '@/app/hooks/useAuth';
import { useTranslations } from 'next-intl';
import AvatarWithCosmetic from '@/app/features/gamification/cosmetic/AvatarWithCosmetic';
import {useCosmetics} from '@/app/features/gamification/cosmetic/hooks/useCosmetics';
import SettingsModal from '@/app/components/layouts/Header/ThemeToggle/SettingsModal';
import styles from '@/app/[locale]/(admin)/_components/AdminLayout/AdminLayout.module.scss';

const cx = classNames.bind(styles);

type AdminNavGroupKey =
  | 'overview'
  | 'users'
  | 'examSystem'
  | 'content'
  | 'community'
  | 'gamification'
  | 'system'
  | 'security';

type AdminNavItemKey =
  | 'dashboard'
  | 'analytics'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'examTypes'
  | 'tags'
  | 'examCategories'
  | 'examParts'
  | 'skills'
  | 'questions'
  | 'questionCollections'
  | 'scoringConversion'
  | 'milestones'
  | 'tests'
  | 'recoveryResources'
  | 'certificates'
  | 'categories'
  | 'posts'
  | 'evaluations'
  | 'coins'
  | 'quests'
  | 'cosmetics'
  | 'streakRecover'
  | 'emails'
  | 'auditLogs'
  | 'loginAudit';

type AdminRouteGroup = {
  label: AdminNavGroupKey;
  items: {path: string; icon: React.ReactNode; label: AdminNavItemKey}[];
};

const adminRouteGroups: AdminRouteGroup[] = [
  {
    label: 'overview',
    items: [
      {path: routes.adminDashboard, icon: <LayoutDashboard size={20} />, label: 'dashboard'},
      {path: routes.adminAnalytics, icon: <BarChart3 size={20} />, label: 'analytics'},
    ],
  },
  {
    label: 'users',
    items: [
      {path: routes.adminUsers, icon: <Users size={20} />, label: 'users'},
      {path: routes.adminRoles, icon: <ShieldCheck size={20} />, label: 'roles'},
      {path: routes.adminPermissions, icon: <KeyRound size={20} />, label: 'permissions'},
    ],
  },
  {
    label: 'examSystem',
    items: [
      {path: routes.adminExamTypes, icon: <Layers size={20} />, label: 'examTypes'},
      {path: routes.adminTags, icon: <Tags size={20} />, label: 'tags'},
      {path: routes.adminExamCategories, icon: <Tag size={20} />, label: 'examCategories'},
      {path: routes.adminExamParts, icon: <ListChecks size={20} />, label: 'examParts'},
      {path: routes.adminSkills, icon: <Brain size={20} />, label: 'skills'},
      {path: routes.adminQuestions, icon: <FileQuestion size={20} />, label: 'questions'},
      {path: routes.adminQuestionCollections, icon: <Library size={20} />, label: 'questionCollections'},
      {path: routes.adminScoringConversion, icon: <Calculator size={20} />, label: 'scoringConversion'},
      {path: routes.adminMilestones, icon: <Target size={20} />, label: 'milestones'},
    ],
  },
  {
    label: 'content',
    items: [
      {path: routes.adminTests, icon: <FileStack size={20} />, label: 'tests'},
      {path: routes.adminRecoveryResources, icon: <BookOpen size={20} />, label: 'recoveryResources'},
      {path: routes.adminCertificates, icon: <Award size={20} />, label: 'certificates'},
    ],
  },
  {
    label: 'community',
    items: [
      {path: routes.adminCategories, icon: <Folder size={20} />, label: 'categories'},
      {path: routes.adminPosts, icon: <FileText size={20} />, label: 'posts'},
      {path: routes.adminEvaluations, icon: <MessageSquareWarning size={20} />, label: 'evaluations'},
    ],
  },
  {
    label: 'gamification',
    items: [
      {path: routes.adminCoins, icon: <Coins size={20} />, label: 'coins'},
      {path: routes.adminQuests, icon: <Target size={20} />, label: 'quests'},
      {path: routes.adminCosmetics, icon: <Sparkles size={20} />, label: 'cosmetics'},
      {path: routes.adminStreakRecover, icon: <Flame size={20} />, label: 'streakRecover'},
    ],
  },
  {
    label: 'system',
    items: [
      {path: routes.adminEmails, icon: <Mail size={20} />, label: 'emails'},
    ],
  },
  {
    label: 'security',
    items: [
      {path: routes.adminAuditLogs, icon: <ShieldAlert size={20} />, label: 'auditLogs'},
      {path: routes.adminLoginAudit, icon: <KeyRound size={20} />, label: 'loginAudit'},
    ],
  },
];

type AdminLayoutProps = {
  children?: React.ReactNode;
};

// Trang con (vd. /admin/exam-types/12/layout) vẫn sáng mục cha trên sidebar.
const matchesPath = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

function AdminLayout({children}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const {user, permissions, logout} = useAuth();
  const {frame: cosmeticFrame, badge: cosmeticBadge} = useCosmetics();
  const t = useTranslations('AdminCommon.layout');
  const tNav = useTranslations('Layout.nav');

  const visibleGroups = useMemo(() => {
    const allowed = Array.isArray(permissions) ? permissions : [];
    return adminRouteGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const required = adminPermissionByPath[item.path];
          return !required || allowed.includes(required);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [permissions]);

  const activeGroup = adminRouteGroups.find((group) =>
    group.items.some((route) => matchesPath(pathname, route.path)),
  );
  const activeItem = activeGroup?.items.find((route) => matchesPath(pathname, route.path));

  useEffect(() => {
    const mql = window.matchMedia(mediaDown('lg'));
    const sync = () => {
      if (mql.matches) {
        setCollapsed(false);
      } else {
        setMobileOpen(false);
      }
    };
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    router.push(routes.home);
  };

  return (
    <div className={cx('adminWrapper')}>
      <div
        className={cx('mobileOverlay', {show: mobileOpen})}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside className={cx('sidebar', {collapsed, 'mobile-open': mobileOpen})}>
        <div className={cx('logo')}>
          <Link href={routes.adminDashboard} className={cx('brand')} onClick={() => setMobileOpen(false)}>
            {collapsed ? (
              <span className={cx('brandMark')}>
                <Image src={imageAssets.frostscopeFavicon} alt="FrostScope" width={28} height={28} />
              </span>
            ) : (
              <>
                <Image
                  src={imageAssets.frostscopeLogoWhite}
                  alt="FrostScope"
                  width={133}
                  height={28}
                  priority
                  className={cx('brandLogo')}
                />
                <span className={cx('brandBadge')}>{t('badge')}</span>
              </>
            )}
          </Link>
          <button
            type="button"
            className={cx('closeBtn')}
            onClick={() => setMobileOpen(false)}
            aria-label={t('closeMenu')}
          >
            <X size={20} />
          </button>
        </div>

        <nav className={cx('nav')} aria-label={t('navigation')}>
          {visibleGroups.map((group) => (
            <div key={group.label} className={cx('navSection')}>
              {!collapsed && <span className={cx('navLabel')}>{t(`groups.${group.label}`)}</span>}
              {group.items.map((route) => {
                const active = matchesPath(pathname, route.path);
                return (
                  <Link
                    key={route.path}
                    href={route.path}
                    className={cx('navItem', {active})}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? t(`items.${route.label}`) : undefined}
                  >
                    {active && (
                      <motion.span
                        layoutId="adminActiveNav"
                        className={cx('activeIndicator')}
                        transition={{type: 'spring', stiffness: 500, damping: 36}}
                      />
                    )}
                    <span className={cx('navIcon')}>{route.icon}</span>
                    {!collapsed && (
                      <span className={cx('navText')}>{t(`items.${route.label}`)}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={cx('bottomSection')}>
          <Link
            href={routes.home}
            className={cx('navItem')}
            title={collapsed ? t('backHome') : undefined}
          >
            <span className={cx('navIcon')}>
              <House size={20} />
            </span>
            {!collapsed && <span className={cx('navText')}>{t('backHome')}</span>}
          </Link>
        </div>

        <button
          type="button"
          className={cx('collapseBtn')}
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t('expand') : t('collapse')}
          title={collapsed ? t('expand') : t('collapse')}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      <div className={cx('mainArea', {collapsed})}>
        <header className={cx('topbar')}>
          <div className={cx('topbarPill')}>
            <div className={cx('topbarLeft')}>
              <button
                type="button"
                className={cx('menuBtn')}
                onClick={() => setMobileOpen(true)}
                aria-label={t('openMenu')}
                aria-expanded={mobileOpen}
              >
                <Menu size={20} />
              </button>
              {activeGroup && activeItem && (
                <div className={cx('crumbs')}>
                  <span className={cx('crumbGroup')}>{t(`groups.${activeGroup.label}`)}</span>
                  <span className={cx('crumbSep')} aria-hidden="true">/</span>
                  <span className={cx('crumbCurrent')}>{t(`items.${activeItem.label}`)}</span>
                </div>
              )}
            </div>

            <div className={cx('topbarRight')}>
              <Link href={routes.home} className={cx('siteLink')}>
                {t('backHome')}
              </Link>
              {user && (
                <Dropdown>
                  <Dropdown.Toggle
                    as="div"
                    className={cx('userInfo')}
                    role="button"
                    tabIndex={0}
                    aria-label={tNav('account', {name: user.userName || ''})}
                  >
                    <AvatarWithCosmetic
                      src={user.avatarUrl}
                      fallbackSrc={images.avtImage}
                      name={user.userName || user.fullName}
                      size={32}
                      frame={cosmeticFrame}
                      badge={cosmeticBadge}
                    />
                    <span className={cx('username')}>{user.userName}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end" className={cx('userDropdown')}>
                    <div className={cx('dropdownHead')}>
                      <p className={cx('dropdownName')}>{user.fullName || user.userName}</p>
                      {user.email && <p className={cx('dropdownEmail')}>{user.email}</p>}
                    </div>
                    <Dropdown.Item as={Link} href={routes.dashboard}>
                      {tNav('profile')}
                    </Dropdown.Item>
                    <Dropdown.Item as="button" type="button" onClick={() => setShowSettings(true)}>
                      {tNav('settings')}
                    </Dropdown.Item>
                    <Dropdown.Divider className={cx('dropdownDivider')} />
                    <Dropdown.Item onClick={handleLogout} className={cx('logoutItem')}>
                      {tNav('logout')}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </div>
          </div>
        </header>

        <main className={cx('content')}>
          <motion.div
            key={pathname}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.2, ease: 'easeOut'}}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <SettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default AdminLayout;
