'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Form from '@cloudscape-design/components/form';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Spinner from '@cloudscape-design/components/spinner';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/hosted-zones');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError(null);
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

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f3f3' }}>
        <Spinner size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f2f3f3', display: 'flex', flexDirection: 'column' }}>
      <TopNavigation
        identity={{
          href: '/login',
          title: 'Amazon Route 53',
        }}
        utilities={[]}
      />
      <Box padding={{ top: 'xxxl', bottom: 'xxxl' }}>
        <div style={{ maxWidth: '460px', margin: '40px auto 0 auto', padding: '0 16px' }}>
          <form onSubmit={handleSubmit}>
            <Form
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    variant="primary"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    formAction="none"
                    onClick={() => handleSubmit()}
                  >
                    Sign in
                  </Button>
                </SpaceBetween>
              }
              header={
                <Header
                  variant="h1"
                  description="Enter your IAM user credentials to access Amazon Route 53 Management Console."
                >
                  Sign in
                </Header>
              }
            >
              <SpaceBetween size="l">
                {error && (
                  <Alert type="error" dismissible onDismiss={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                <Container header={<Header variant="h2">AWS Account Credentials</Header>}>
                  <SpaceBetween size="m">
                    <FormField label="Username" description="IAM user or account administrator name">
                      <Input
                        value={username}
                        onChange={({ detail }) => setUsername(detail.value)}
                        placeholder="e.g. yash"
                        autoComplete={false}
                      />
                    </FormField>
                    <FormField label="Password">
                      <Input
                        type="password"
                        value={password}
                        onChange={({ detail }) => setPassword(detail.value)}
                        placeholder="Enter your password"
                      />
                    </FormField>
                  </SpaceBetween>
                </Container>
              </SpaceBetween>
            </Form>
          </form>
        </div>
      </Box>
    </div>
  );
}
