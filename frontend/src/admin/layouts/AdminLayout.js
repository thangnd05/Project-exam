import React, {useEffect, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
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
  Bell,
  Search,
  Menu,
  Folder,
  FileText,
  Library,
  Tag,
  Tags,
  BookOpen,
  Target,
  Coins,
  Sparkles,
  Flame,
} from 'lucide-react';
import routes from '~/config/Routes';
import styles from './AdminLayout.module.scss';

const cx = classNames.bind(styles);

const adminRouteGroups = [
  {
    label: 'Tổng quan',
    items: [
      {path: routes.adminDashboard, icon: <LayoutDashboard size={20} />, label: 'Dashboard'},
      {path: routes.adminAnalytics, icon: <BarChart3 size={20} />, label: 'Thống kê'},
    ],
  },
  {
    label: 'Người dùng',
    items: [
      {path: routes.adminUsers, icon: <Users size={20} />, label: 'Quản lý Users'},
      {path: routes.adminRoles, icon: <ShieldCheck size={20} />, label: 'Quản lý vai trò'},
      {path: routes.adminPermissions, icon: <KeyRound size={20} />, label: 'Phân quyền (RBAC)'},
    ],
  },
  {
    label: 'Hệ thống thi cử',
    items: [
      {path: routes.adminExamTypes, icon: <Layers size={20} />, label: 'Loại kỳ thi'},
      {path: routes.adminTags, icon: <Tags size={20} />, label: 'Tag câu hỏi'},
      {path: routes.adminExamCategories, icon: <Tag size={20} />, label: 'Phân loại bài thi'},
      {path: routes.adminExamParts, icon: <ListChecks size={20} />, label: 'Phần thi'},
      {path: routes.adminSkills, icon: <Brain size={20} />, label: 'Kỹ năng'},
      {path: routes.adminQuestionCollections, icon: <Library size={20} />, label: 'Bộ sưu tập câu hỏi'},
      {path: routes.adminScoringConversion, icon: <Calculator size={20} />, label: 'Quy đổi điểm'},
      {path: routes.adminMilestones, icon: <Target size={20} />, label: 'Mốc điểm mục tiêu'},
    ],
  },
  {
    label: 'Nội dung',
    items: [
      {path: routes.adminTests, icon: <FileStack size={20} />, label: 'Quản lý đề thi'},
      {path: routes.adminRecoveryResources, icon: <BookOpen size={20} />, label: 'Kho tài liệu'},
    ],
  },
  {
    label: 'Cộng đồng',
    items: [
      {path: routes.adminCategories, icon: <Folder size={20} />, label: 'Danh mục'},
      {path: routes.adminPosts, icon: <FileText size={20} />, label: 'Duyệt bài viết'},
      {path: routes.adminEvaluations, icon: <MessageSquareWarning size={20} />, label: 'Duyệt đánh giá'},
    ],
  },
  {
    label: 'Gamification',
    items: [
      {path: routes.adminCoins, icon: <Coins size={20} />, label: 'Quản lý xu'},
      {path: routes.adminQuests, icon: <Target size={20} />, label: 'Quản lý nhiệm vụ'},
      {path: routes.adminCosmetics, icon: <Sparkles size={20} />, label: 'Cửa hàng trang trí'},
      {path: routes.adminStreakRecover, icon: <Flame size={20} />, label: 'Khôi phục chuỗi'},
    ],
  },
  {
    label: 'Bảo mật',
    items: [
      {path: routes.adminAuditLogs, icon: <ShieldAlert size={20} />, label: 'Audit logs'},
      {path: routes.adminLoginAudit, icon: <KeyRound size={20} />, label: 'Audit đăng nhập'},
    ],
  },
];

function AdminLayout({children}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1024px)');
    const sync = () => {
      if (mql.matches) {
        setCollapsed(false);
      }
    };
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);

  const isActive = (path) => location.pathname === path;

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
            {adminRouteGroups.map((group) => (
              <div key={group.label} className={cx('navSection')}>
                {!collapsed && <span className={cx('navLabel')}>{group.label}</span>}
                {group.items.map((route) => (
                  <Link
                    key={route.path}
                    to={route.path}
                    className={cx('navItem', {active: isActive(route.path)})}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? route.label : ''}
                  >
                    <span className={cx('navIcon')}>{route.icon}</span>
                    {!collapsed && (
                      <span className={cx('navText')}>{route.label}</span>
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
              to={routes.home}
              className={cx('navItem')}
              title={collapsed ? 'Về trang chủ' : ''}
            >
              <span className={cx('navIcon')}>
                <LogOut size={20} />
              </span>
              {!collapsed && (
                <span className={cx('navText')}>Về trang chủ</span>
              )}
            </Link>
          </div>
        </aside>
      </>

      <div className={cx('mainArea', {collapsed})}>

        <header className={cx('header')}>
          <div className={cx('headerLeft')}>
            <button
              className={cx('mobileMenuBtn')}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className={cx('searchBox')}>
              <Search size={18} className={cx('searchIcon')} />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className={cx('searchInput')}
              />
            </div>
          </div>
          <div className={cx('headerRight')}>
            <button className={cx('headerBtn')}>
              <Bell size={20} />
              <span className={cx('notificationBadge')}>3</span>
            </button>
            <div className={cx('userInfo')}>
              <div className={cx('userAvatar')}>
                <span>A</span>
              </div>
              <div className={cx('userDetails')}>
                <span className={cx('userName')}>Admin User</span>
                <span className={cx('userRole')}>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <main className={cx('content')}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
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
