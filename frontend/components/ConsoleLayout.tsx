'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppLayout from '@cloudscape-design/components/app-layout';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import BreadcrumbGroup, { BreadcrumbGroupProps } from '@cloudscape-design/components/breadcrumb-group';
import Flashbar from '@cloudscape-design/components/flashbar';
import Spinner from '@cloudscape-design/components/spinner';
import Box from '@cloudscape-design/components/box';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';

interface ConsoleLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbGroupProps.Item[];
  contentType?: 'default' | 'cards' | 'table' | 'form';
}

export default function ConsoleLayout({
  children,
  breadcrumbs = [{ text: 'Route 53', href: '/hosted-zones' }],
  contentType = 'table',
}: ConsoleLayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { notifications } = useNotification();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f3f3' }}>
        <Spinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopNavigation
        identity={{
          href: '/hosted-zones',
          title: 'Amazon Route 53',
        }}
        utilities={[
          {
            type: 'menu-dropdown',
            text: user ? user.username : 'Account',
            description: user ? `Role: ${user.role} (${user.account_id})` : undefined,
            iconName: 'user-profile',
            onItemClick: (e) => {
              if (e.detail.id === 'signout') {
                logout();
              }
            },
            items: [
              { id: 'signout', text: 'Sign out' },
            ],
          },
        ]}
      />
      <AppLayout
        contentType={contentType}
        navigation={
          <SideNavigation
            activeHref={pathname}
            header={{ href: '/hosted-zones', text: 'Route 53' }}
            items={[
              {
                type: 'section',
                text: 'DNS management',
                items: [
                  { type: 'link', text: 'Hosted zones', href: '/hosted-zones' },
                  { type: 'link', text: 'Dashboard', href: '/dashboard' },
                  { type: 'link', text: 'Traffic policies', href: '/traffic-policies' },
                  { type: 'link', text: 'Health checks', href: '/health-checks' },
                  { type: 'link', text: 'Resolver', href: '/resolver' },
                  { type: 'link', text: 'Profiles', href: '/profiles' },
                ],
              },
            ]}
            onFollow={(e) => {
              e.preventDefault();
              router.push(e.detail.href);
            }}
          />
        }
        breadcrumbs={
          <BreadcrumbGroup
            items={breadcrumbs}
            onFollow={(e) => {
              e.preventDefault();
              router.push(e.detail.href);
            }}
          />
        }
        notifications={<Flashbar items={notifications} />}
        content={children}
        toolsHide={true}
      />
    </div>
  );
}
