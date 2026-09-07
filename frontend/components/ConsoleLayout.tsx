'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppLayout from '@cloudscape-design/components/app-layout';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import BreadcrumbGroup, { BreadcrumbGroupProps } from '@cloudscape-design/components/breadcrumb-group';
import Flashbar from '@cloudscape-design/components/flashbar';
import Spinner from '@cloudscape-design/components/spinner';
import Input from '@cloudscape-design/components/input';
import Badge from '@cloudscape-design/components/badge';
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
        search={
          <Input
            type="search"
            placeholder="Search"
            ariaLabel="Search"
            value=""
            onChange={() => {}}
          />
        }
        utilities={[
          {
            type: 'button',
            iconName: 'notification',
            ariaLabel: 'Notifications',
          },
          {
            type: 'button',
            iconName: 'status-info',
            ariaLabel: 'Help',
          },
          {
            type: 'button',
            iconName: 'settings',
            ariaLabel: 'Settings',
          },
          {
            type: 'menu-dropdown',
            text: 'Global',
            items: [],
          },
          {
            type: 'menu-dropdown',
            text: user ? `${user.username} (${user.account_id})` : 'Account',
            description: user ? user.username : undefined,
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
              { type: 'link', text: 'Dashboard', href: '/dashboard' },
              { type: 'link', text: 'Hosted zones', href: '/hosted-zones' },
              { type: 'link', text: 'Health checks', href: '/health-checks' },
              { type: 'link', text: 'Profiles', href: '/profiles' },
              {
                type: 'section',
                text: 'Global Resolver',
                defaultExpanded: true,
                items: [
                  {
                    type: 'link',
                    text: 'Global resolvers',
                    href: '/coming-soon?title=Global%20resolvers',
                    info: <Badge color="blue">New</Badge>,
                  },
                  {
                    type: 'link',
                    text: 'Shared DNS views',
                    href: '/coming-soon?title=Shared%20DNS%20views',
                    info: <Badge color="blue">New</Badge>,
                  },
                ],
              },
              {
                type: 'section',
                text: 'VPC Resolver',
                defaultExpanded: true,
                items: [
                  { type: 'link', text: 'VPCs', href: '/coming-soon?title=VPCs' },
                  { type: 'link', text: 'Inbound endpoints', href: '/coming-soon?title=Inbound%20endpoints' },
                  { type: 'link', text: 'Outbound endpoints', href: '/coming-soon?title=Outbound%20endpoints' },
                  { type: 'link', text: 'Rules', href: '/coming-soon?title=Rules' },
                  { type: 'link', text: 'Query logging', href: '/coming-soon?title=Query%20logging' },
                  { type: 'link', text: 'Outposts', href: '/coming-soon?title=Outposts' },
                ],
              },
              {
                type: 'section',
                text: 'Domains',
                defaultExpanded: true,
                items: [
                  { type: 'link', text: 'Registered domains', href: '/coming-soon?title=Registered%20domains' },
                  { type: 'link', text: 'Requests', href: '/coming-soon?title=Requests' },
                ],
              },
              {
                type: 'section',
                text: 'IP-based routing',
                defaultExpanded: true,
                items: [
                  { type: 'link', text: 'CIDR collections', href: '/coming-soon?title=CIDR%20collections' },
                ],
              },
              {
                type: 'section',
                text: 'Traffic flow',
                defaultExpanded: true,
                items: [
                  { type: 'link', text: 'Traffic policies', href: '/traffic-policies' },
                  { type: 'link', text: 'Policy records', href: '/coming-soon?title=Policy%20records' },
                ],
              },
              { type: 'divider' },
              {
                type: 'link',
                text: 'DNS Firewall',
                href: '/coming-soon?title=DNS%20Firewall',
                external: true,
              },
              {
                type: 'link',
                text: 'Application Recovery Controller',
                href: '/coming-soon?title=Application%20Recovery%20Controller',
                external: true,
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
