'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Alert from '@cloudscape-design/components/alert';
import Spinner from '@cloudscape-design/components/spinner';
import Tiles from '@cloudscape-design/components/tiles';
import Button from '@cloudscape-design/components/button';
import Flashbar from '@cloudscape-design/components/flashbar';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const { addNotification, clearNotifications, notifications } = useNotification();
  const router = useRouter();

  const notifyNotImplemented = (_itemName?: string) => {
    addNotification({
      type: 'info',
      content: 'Coming soon',
    });
  };

  const handleSignUpClick = () => {
    addNotification({
      type: 'info',
      content: "Sign up isn't available in this demo — use the Admin or ReadOnly credentials above to sign in.",
    });
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/hosted-zones');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('autofill') === 'admin') {
        fillAdminCredentials();
      }
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError(null);
    clearNotifications();
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Login failed. Please check your credentials.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillAdminCredentials = () => {
    setUsername('yash');
    setPassword('password123');
    setError(null);
  };

  const fillReadOnlyCredentials = () => {
    setUsername('guest');
    setPassword('guestpass');
    setError(null);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <Spinner size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: '"Amazon Ember", "Helvetica Neue", Roboto, Arial, sans-serif',
      }}
    >
      {/* Background Isometric Cube Watermarks */}
      <div
        style={{
          position: 'absolute',
          left: '-20px',
          top: '15%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <svg width="260" height="300" viewBox="0 0 240 280" fill="none" opacity="0.08" xmlns="http://www.w3.org/2000/svg">
          <path d="M60 0L120 35V105L60 70V0Z" fill="#D5DBDB" stroke="#879596" />
          <path d="M60 0L0 35V105L60 70V0Z" fill="#EAECEE" stroke="#879596" />
          <path d="M60 70L120 105L60 140L0 105L60 70Z" fill="#BDC3C7" stroke="#879596" />
          <path d="M180 70L240 105V175L180 140V70Z" fill="#D5DBDB" stroke="#879596" />
          <path d="M180 70L120 105V175L180 140V70Z" fill="#EAECEE" stroke="#879596" />
          <path d="M180 140L240 175L180 210L120 175L180 140Z" fill="#BDC3C7" stroke="#879596" />
          <path d="M60 140L120 175V245L60 210V140Z" fill="#D5DBDB" stroke="#879596" />
          <path d="M60 140L0 175V245L60 210V140Z" fill="#EAECEE" stroke="#879596" />
          <path d="M60 210L120 245L60 280L0 245L60 210Z" fill="#BDC3C7" stroke="#879596" />
        </svg>
      </div>

      <div
        style={{
          position: 'absolute',
          right: '-20px',
          bottom: '10%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <svg width="260" height="300" viewBox="0 0 240 280" fill="none" opacity="0.08" xmlns="http://www.w3.org/2000/svg">
          <path d="M60 0L120 35V105L60 70V0Z" fill="#D5DBDB" stroke="#879596" />
          <path d="M60 0L0 35V105L60 70V0Z" fill="#EAECEE" stroke="#879596" />
          <path d="M60 70L120 105L60 140L0 105L60 70Z" fill="#BDC3C7" stroke="#879596" />
          <path d="M180 70L240 105V175L180 140V70Z" fill="#D5DBDB" stroke="#879596" />
          <path d="M180 70L120 105V175L180 140V70Z" fill="#EAECEE" stroke="#879596" />
          <path d="M180 140L240 175L180 210L120 175L180 140Z" fill="#BDC3C7" stroke="#879596" />
          <path d="M60 140L120 175V245L60 210V140Z" fill="#D5DBDB" stroke="#879596" />
          <path d="M60 140L0 175V245L60 210V140Z" fill="#EAECEE" stroke="#879596" />
          <path d="M60 210L120 245L60 280L0 245L60 210Z" fill="#BDC3C7" stroke="#879596" />
        </svg>
      </div>

      {/* Top Header Utilities Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '24px',
          padding: '14px 28px',
          fontSize: '12px',
          color: '#0972d3',
          zIndex: 1,
        }}
      >
        <span onClick={() => notifyNotImplemented('Provide feedback')} style={{ cursor: 'pointer' }}>Provide feedback</span>
        <span onClick={() => notifyNotImplemented('Multi-session options')} style={{ color: '#16191f', cursor: 'pointer' }}>
          Multi-session disabled <span style={{ fontSize: '9px' }}>▼</span>
        </span>
        <span onClick={() => notifyNotImplemented('Language selector')} style={{ color: '#16191f', cursor: 'pointer' }}>
          English <span style={{ fontSize: '9px' }}>▼</span>
        </span>
      </header>

      {/* Centered Logo */}
      <div style={{ textAlign: 'center', margin: '10px 0 24px 0', zIndex: 1 }}>
        <img
          src="/aws-login-logo.png"
          alt="AWS Logo"
          style={{ width: '72px', height: 'auto', display: 'inline-block' }}
        />
      </div>

      {/* Main Single Centered Sign In Form Container */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 20px 40px 20px', zIndex: 1 }}>
        <div style={{ maxWidth: '440px', width: '100%' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #d5dbdb',
              borderRadius: '8px',
              padding: '32px 36px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            }}
          >
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#16191f', margin: '0 0 4px 0' }}>Sign In</h1>
            <p style={{ fontSize: '13px', color: '#545b64', margin: '0 0 20px 0' }}>Access your AWS account by user credentials.</p>

            {notifications.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Flashbar items={notifications} />
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {error && (
                <Alert type="error" dismissible onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <FormField label="Username">
                <Input
                  value={username}
                  onChange={({ detail }) => setUsername(detail.value)}
                  placeholder="Enter your username"
                />
              </FormField>

              <FormField label="Password">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={({ detail }) => setPassword(detail.value)}
                  placeholder="Enter your password"
                  suffix={
                    <Button
                      variant="inline-icon"
                      formAction="none"
                      ariaLabel={showPassword ? 'Hide password' : 'Show password'}
                      iconName={showPassword ? 'unlocked' : 'lock-private'}
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  }
                />
              </FormField>

              {/* Demo Accounts Quick-Select Tiles */}
              <FormField label="Demo accounts:">
                <Tiles
                  columns={2}
                  value={username === 'yash' ? 'admin' : username === 'guest' ? 'readonly' : null}
                  onChange={({ detail }) => {
                    if (detail.value === 'admin') fillAdminCredentials();
                    if (detail.value === 'readonly') fillReadOnlyCredentials();
                  }}
                  items={[
                    {
                      value: 'admin',
                      label: 'Admin',
                      description: 'yash / full access',
                    },
                    {
                      value: 'readonly',
                      label: 'ReadOnly',
                      description: 'guest / view only',
                    },
                  ]}
                />
              </FormField>

              <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    height: '38px',
                    backgroundColor: '#ec7211',
                    backgroundImage: 'linear-gradient(to bottom, #ff9900, #ec7211)',
                    border: '1px solid #d58200',
                    borderRadius: '20px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eb5f07')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ec7211')}
                >
                  {isSubmitting ? <Spinner size="normal" /> : 'Sign in'}
                </button>

                <button
                  type="button"
                  onClick={handleSignUpClick}
                  style={{
                    width: '100%',
                    height: '38px',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgb(0, 108, 224)',
                    borderRadius: '20px',
                    color: 'rgb(0, 108, 224)',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 108, 224, 0.05)';
                    e.currentTarget.style.borderColor = 'rgb(0, 108, 224)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = 'rgb(0, 108, 224)';
                  }}
                >
                  New to AWS? Sign up
                </button>
              </div>
            </form>
          </div>

          {/* Muted Footer Agreement below Single Card */}
          <div style={{ marginTop: '16px', fontSize: '11px', color: '#545b64', lineHeight: '1.4', textAlign: 'center' }}>
            By continuing, you agree to the <span onClick={() => notifyNotImplemented('AWS Customer Agreement')} style={{ color: '#0972d3', cursor: 'pointer' }}>AWS Customer Agreement</span> or other agreement for AWS services, and the <span onClick={() => notifyNotImplemented('Privacy Notice')} style={{ color: '#0972d3', cursor: 'pointer' }}>Privacy Notice</span>. This site uses essential cookies. See our <span onClick={() => notifyNotImplemented('Cookie Notice')} style={{ color: '#0972d3', cursor: 'pointer' }}>Cookie Notice</span> for more information.
          </div>
        </div>
      </main>
    </div>
  );
}
