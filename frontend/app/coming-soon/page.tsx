'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Spinner from '@cloudscape-design/components/spinner';
import ConsoleLayout from '@/components/ConsoleLayout';

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const title = searchParams?.get('title') || 'Feature';

  return (
    <ConsoleLayout
      breadcrumbs={[
        { text: 'Route 53', href: '/hosted-zones' },
        { text: title, href: `/coming-soon?title=${encodeURIComponent(title)}` },
      ]}
    >
      <SpaceBetween size="l">
        <Header variant="h1" description={`Manage and configure ${title} for Amazon Route 53.`}>
          {title}
        </Header>
        <Container header={<Header variant="h2">{title}</Header>}>
          <Box padding="xxl" textAlign="center" color="inherit">
            <SpaceBetween size="m">
              <b>Coming Soon</b>
              <Box variant="p" color="inherit">
                {title} features are under development and will be available in a future update.
              </Box>
            </SpaceBetween>
          </Box>
        </Container>
      </SpaceBetween>
    </ConsoleLayout>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f3f3' }}>
          <Spinner size="large" />
        </div>
      }
    >
      <ComingSoonContent />
    </Suspense>
  );
}
