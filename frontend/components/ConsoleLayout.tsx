'use client';

import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppLayout from '@cloudscape-design/components/app-layout';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import BreadcrumbGroup, { BreadcrumbGroupProps } from '@cloudscape-design/components/breadcrumb-group';
import Flashbar from '@cloudscape-design/components/flashbar';
import Spinner from '@cloudscape-design/components/spinner';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';

interface ConsoleLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbGroupProps.Item[];
  contentType?: 'default' | 'cards' | 'table' | 'form';
}

function HeaderNav() {
  const { user, logout } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [globalMenuOpen, setGlobalMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
        setGlobalMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user
    ? user.username === 'yash'
      ? 'Yash Pratap Singh'
      : user.username
    : 'Yash Pratap Singh';
  const accountId = user?.account_id || '546702454177';

  return (
    <header
      ref={menuRef}
      className="aws-header-nav"
      style={{
        backgroundColor: '#0f1b2a',
        borderBottom: '1px solid #2e3846',
        height: '44px',
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#ffffff',
        fontSize: '14px',
        fontFamily: '"Amazon Ember", "Helvetica Neue", Roboto, Arial, sans-serif',
        boxSizing: 'border-box',
        userSelect: 'none',
        zIndex: 1000,
        position: 'relative',
      }}
    >
      {/* Left side: Logo & Icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* AWS Logo */}
        <a href="/hosted-zones" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src="/aws-header-logo.png"
            alt="AWS Logo"
            style={{ width: '38px', height: '22px', display: 'block' }}
          />
        </a>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', backgroundColor: '#384556', margin: '0 4px' }} />

        {/* Colorful App / Builder ID Icon */}
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '5px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 6px rgba(99, 102, 241, 0.5)',
            cursor: 'pointer',
          }}
          title="AWS Builder ID"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 2a6 6 0 100 12A6 6 0 008 2z" stroke="#ffffff" strokeWidth="2" />
            <path d="M8 5a3 3 0 100 6 3 3 0 000-6z" fill="#ffffff" />
          </svg>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', backgroundColor: '#384556', margin: '0 4px' }} />

        {/* 3x3 Grid Icon */}
        <div
          title="Console Home / Services"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 3.5px)',
            gap: '3px',
            padding: '4px',
            cursor: 'pointer',
          }}
        >
          {[...Array(9)].map((_, i) => (
            <div key={i} style={{ width: '3.5px', height: '3.5px', backgroundColor: '#d1d5db', borderRadius: '0.5px' }} />
          ))}
        </div>
      </div>

      {/* Search Input Box */}
      <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: '560px', margin: '0 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            backgroundColor: '#0b131e',
            border: '1px solid #414d5c',
            borderRadius: '6px',
            padding: '3px 8px 3px 12px',
            color: '#9ba7b6',
            fontSize: '14px',
            gap: '10px',
            height: '30px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5" stroke="#9ba7b6" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontStyle: 'italic', flexGrow: 1, color: '#9ba7b6', fontSize: '14px' }}>Search</span>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: '#1c2838',
              padding: '2px 6px',
              borderRadius: '4px',
              color: '#9ba7b6',
              border: '1px solid #334155',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
            }}
          >
            [Option+S]
          </span>
          <div
            style={{
              fontSize: '12px',
              backgroundColor: '#111d2e',
              border: '1px solid #3b82f6',
              padding: '2px 9px',
              borderRadius: '12px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '11px',
                height: '11px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #c084fc, #38bdf8)',
                display: 'inline-block',
              }}
            ></span>
            Ask Amazon Q
          </div>
        </div>
      </div>

      {/* Right side: Account & Utilities */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* User Account Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            style={{
              background: '#1c2838',
              border: '1px solid #384556',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span>{`${displayName} (${accountId})`}</span>
            <span style={{ fontSize: '10px', color: '#aab7c4' }}>▼</span>
          </button>
          {accountMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: '#16191f',
                border: '1px solid #414d5c',
                borderRadius: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 1001,
                minWidth: '230px',
                padding: '8px 0',
              }}
            >
              <div style={{ padding: '8px 16px', borderBottom: '1px solid #2e3846', color: '#eaedd1', fontSize: '14px' }}>
                <strong style={{ color: '#ffffff' }}>{displayName}</strong>
                <div style={{ fontSize: '12px', color: '#9ba7b6', marginTop: '2px' }}>AWS Account: {accountId}</div>
              </div>
              <button
                onClick={() => {
                  setAccountMenuOpen(false);
                  logout();
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#232f3e')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* CloudShell button */}
        <div
          title="CloudShell"
          style={{
            border: '1px solid #414d5c',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: '#ffffff',
            cursor: 'pointer',
            backgroundColor: '#0f1b2a',
            lineHeight: '1.2',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {`>_`}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', backgroundColor: '#384556' }} />

        {/* Notification Bell */}
        <div title="Notifications" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', backgroundColor: '#384556' }} />

        {/* Help */}
        <div title="Help" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', backgroundColor: '#384556' }} />

        {/* Settings */}
        <div title="Settings" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', backgroundColor: '#384556' }} />

        {/* Global Region Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setGlobalMenuOpen(!globalMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#d1d5db',
              fontSize: '13px',
              fontWeight: 500,
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <span>Global</span>
            <span style={{ fontSize: '10px', color: '#aab7c4' }}>▼</span>
          </button>
          {globalMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: '#16191f',
                border: '1px solid #414d5c',
                borderRadius: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 1001,
                padding: '8px 12px',
                color: '#9ba7b6',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
            >
              Route 53 is a Global Service.
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function FooterNav() {
  return (
    <footer
      className="aws-header-nav"
      style={{
        backgroundColor: '#0f1b2a',
        borderTop: '1px solid #2e3846',
        height: '28px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#d1d5db',
        fontSize: '12px',
        fontFamily: '"Amazon Ember", "Helvetica Neue", Roboto, Arial, sans-serif',
        boxSizing: 'border-box',
        userSelect: 'none',
        zIndex: 1000,
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      {/* Left side items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {/* CloudShell */}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#d1d5db',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
        >
          <span
            style={{
              border: '1px solid #414d5c',
              borderRadius: '3px',
              padding: '0 4px',
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              lineHeight: '1.2',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {`>_`}
          </span>
          <span>CloudShell</span>
        </a>

        {/* Agent Toolkit for AWS */}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#d1d5db',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <span>Agent Toolkit for AWS</span>
        </a>

        {/* Feedback */}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{
            color: '#d1d5db',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
        >
          Feedback
        </a>

        {/* Console Mobile App */}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#d1d5db',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
          <span>Console Mobile App</span>
        </a>
      </div>

      {/* Right side items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <span>© 2026, Amazon Web Services, Inc. or its affiliates.</span>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{ color: '#d1d5db', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
        >
          Privacy
        </a>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{ color: '#d1d5db', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
        >
          Terms
        </a>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{ color: '#d1d5db', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
        >
          Cookie preferences
        </a>
      </div>
    </footer>
  );
}

export default function ConsoleLayout({
  children,
  breadcrumbs = [{ text: 'Route 53', href: '/hosted-zones' }],
  contentType = 'table',
}: ConsoleLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '28px' }}>
      <HeaderNav />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                      info: (
                        <span style={{ color: '#0972d3', fontWeight: 700, borderBottom: '1.5px dashed #0972d3', fontSize: '13px' }}>
                          New
                        </span>
                      ),
                    },
                    {
                      type: 'link',
                      text: 'Shared DNS views',
                      href: '/coming-soon?title=Shared%20DNS%20views',
                      info: (
                        <span style={{ color: '#0972d3', fontWeight: 700, borderBottom: '1.5px dashed #0972d3', fontSize: '13px' }}>
                          New
                        </span>
                      ),
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
      <FooterNav />
    </div>
  );
}

