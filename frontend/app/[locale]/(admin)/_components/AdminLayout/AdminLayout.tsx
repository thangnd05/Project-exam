'use client';

import Link, { usePathname } from '@/app/i18n/navigation';
import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import {motion, AnimatePresence} from 'framer-motion';
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
  LogOut,
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
import { useAuth } from '@/app/hooks/useAuth';
import { useTranslations } from 'next-intl';
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

function AdminLayout({children}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const {permissions} = useAuth();
  const t = useTranslations('AdminCommon.layout');

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

  useEffect(() => {
    const mql = window.matchMedia(mediaDown('lg'));
    const sync = () => {
      if (mql.matches) {
        setCollapsed(false);
      }
    };
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <div className={cx('adminWrapper')}>

      <>

        <div
          className={cx('mobileOverlay', {show: mobileOpen})}
          onClick={() => setMobileOpen(false)}
        />

        <aside
          className={cx('sidebar', {collapsed, 'mobile-open': mobileOpen})}
        >

          <div className={cx('logo')}>
            <div className={cx('logoIcon')}>
              <span>E</span>
            </div>
            {!collapsed && <span className={cx('logoText')}>WinDe Manager</span>}
          </div>

          <button
            className={cx('collapseBtn')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <nav className={cx('nav')}>
            {visibleGroups.map((group) => (
              <div key={group.label} className={cx('navSection')}>
                {!collapsed && <span className={cx('navLabel')}>{t(`groups.${group.label}`)}</span>}
                {group.items.map((route) => (
                  <Link
                    key={route.path}
                    href={route.path}
                    className={cx('navItem', {active: isActive(route.path)})}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? t(`items.${route.label}`) : ''}
                  >
                    <span className={cx('navIcon')}>{route.icon}</span>
                    {!collapsed && (
                      <span className={cx('navText')}>{t(`items.${route.label}`)}</span>
                    )}
                    {isActive(route.path) && (
                      <motion.div
                        layoutId="activeNav"
                        className={cx('activeIndicator')}
                        transition={{type: 'spring', stiffness: 500, damping: 30}}
                      />
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          <div className={cx('bottomSection')}>
            <Link
              href={routes.home}
              className={cx('navItem')}
              title={collapsed ? t('backHome') : ''}
            >
              <span className={cx('navIcon')}>
                <LogOut size={20} />
              </span>
              {!collapsed && (
                <span className={cx('navText')}>{t('backHome')}</span>
              )}
            </Link>
          </div>
        </aside>
      </>

      <div className={cx('mainArea', {collapsed})}>

        <main className={cx('content')}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -20}}
              transition={{duration: 0.2}}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
