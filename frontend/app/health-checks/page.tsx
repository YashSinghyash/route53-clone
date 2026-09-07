'use client';

import React from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import ConsoleLayout from '@/components/ConsoleLayout';

export default function HealthChecksPage() {
  return (
    <ConsoleLayout
      breadcrumbs={[
        { text: 'Route 53', href: '/hosted-zones' },
        { text: 'Health checks', href: '/health-checks' },
      ]}
    >
      <SpaceBetween size="l">
        <Header variant="h1" description="Monitor the health and performance of your web applications and web servers">
          Health checks
        </Header>
        <Container header={<Header variant="h2">Health Check Monitoring</Header>}>
          <Box padding="xxl" textAlign="center" color="inherit">
            <SpaceBetween size="m">
              <b>Coming Soon</b>
              <Box variant="p" color="inherit">
                Route 53 health checking, endpoint status monitoring, and CloudWatch alarm integration features are under development.
              </Box>
            </SpaceBetween>
          </Box>
        </Container>
      </SpaceBetween>
    </ConsoleLayout>
  );
}
