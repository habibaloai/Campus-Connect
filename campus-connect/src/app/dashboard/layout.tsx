'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  Search,
  GraduationCap,
  Wallet,
  Utensils,
  Bus,
  MessageCircle,
  Calendar,
  Heart,
  Bot,
  BookOpen,
  Briefcase,
  Trophy,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import styles from './layout.module.css';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: number;
}

const navSections = [
  {
    title: 'Main',
    items: [
      { id: 'home', label: 'Dashboard', icon: Home, href: '/dashboard' },
      { id: 'search', label: 'Search', icon: Search, href: '/dashboard/search' },
    ],
  },
  {
    title: 'Academic',
    items: [
      { id: 'academics', label: 'Academics', icon: GraduationCap, href: '/dashboard/academics', badge: 2 },
      { id: 'study', label: 'Study Rooms', icon: BookOpen, href: '/dashboard/study' },
      { id: 'ai', label: 'AI Assistant', icon: Bot, href: '/dashboard/ai' },
    ],
  },
  {
    title: 'Campus Life',
    items: [
      { id: 'financial', label: 'Wallet', icon: Wallet, href: '/dashboard/financial' },
      { id: 'dining', label: 'Dining', icon: Utensils, href: '/dashboard/dining' },
      { id: 'transport', label: 'Transport', icon: Bus, href: '/dashboard/transport' },
      { id: 'events', label: 'Events', icon: Calendar, href: '/dashboard/events' },
    ],
  },
  {
    title: 'Social',
    items: [
      { id: 'messages', label: 'Messages', icon: MessageCircle, href: '/dashboard/messages', badge: 15 },
      { id: 'community', label: 'Community', icon: MessageCircle, href: '/dashboard/community' },
    ],
  },
  {
    title: 'Career & Wellness',
    items: [
      { id: 'career', label: 'Career', icon: Briefcase, href: '/dashboard/career' },
      { id: 'wellness', label: 'Wellness', icon: Heart, href: '/dashboard/wellness' },
      { id: 'achievements', label: 'Achievements', icon: Trophy, href: '/dashboard/achievements' },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/dashboard' },
  { id: 'community', label: 'Community', icon: Users, href: '/dashboard/community' },
  { id: 'events', label: 'Events', icon: Calendar, href: '/dashboard/events' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, href: '/dashboard/messages', badge: 15 },
  { id: 'more', label: 'More', icon: Menu, href: '#menu' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState(5);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleNavClick = (href: string) => {
    if (href === '#menu') {
      setSidebarOpen(true);
    } else {
      router.push(href);
      setSidebarOpen(false);
    }
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.overlay}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={styles.sidebar}
            >
              <div className={styles.sidebarHeader}>
                <div className={styles.logoSection}>
                  <div className={styles.logoIcon}>
                    <Sparkles size={20} />
                  </div>
                  <span className={styles.logoText}>Campus Connect</span>
                </div>
                <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <nav className={styles.sidebarNav}>
                {navSections.map((section) => (
                  <div key={section.title} className={styles.navSection}>
                    <h3 className={styles.sectionTitle}>{section.title}</h3>
                    {section.items.map((item) => (
                      <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.98 }}
                        className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                        onClick={() => handleNavClick(item.href)}
                      >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                        {item.badge && <span className={styles.badge}>{item.badge}</span>}
                        <ChevronRight size={16} className={styles.chevron} />
                      </motion.button>
                    ))}
                  </div>
                ))}
              </nav>

              <div className={styles.sidebarFooter}>
                <button className={styles.footerBtn} onClick={() => router.push('/dashboard/settings')}>
                  <Settings size={20} />
                  <span>Settings</span>
                </button>
                <button className={styles.footerBtn} onClick={() => signOut()}>
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.logoIcon}>
              <Image 
                src="/images/tum-logo.png" 
                alt="TUM Logo" 
                width={36} 
                height={36}
                style={{ objectFit: 'contain' }}
              />
            </div>
            <h1 className={styles.headerTitle}>Campus Connect</h1>
          </div>
          <div className={styles.headerRight}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className={styles.iconBtn}
              onClick={() => router.push('/dashboard/notifications')}
            >
              <Bell size={22} />
              {notifications > 0 && <span className={styles.notifBadge}>{notifications}</span>}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav}>
        {bottomNavItems.map((item) => (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.9 }}
            className={`${styles.bottomNavItem} ${isActive(item.href) && item.href !== '#menu' ? styles.active : ''}`}
            onClick={() => handleNavClick(item.href)}
          >
            <div className={styles.bottomNavIcon}>
              {isActive(item.href) && item.href !== '#menu' && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className={styles.activeIndicator}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon size={22} />
              {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
            </div>
            <span className={styles.bottomNavLabel}>{item.label}</span>
          </motion.button>
        ))}
      </nav>
    </div>
  );
}

