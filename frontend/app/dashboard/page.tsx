'use client';

import React from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import ConsoleLayout from '@/components/ConsoleLayout';

export default function DashboardPage() {
  return (
    <ConsoleLayout
      breadcrumbs={[
        { text: 'Route 53', href: '/hosted-zones' },
        { text: 'Dashboard', href: '/dashboard' },
      ]}
    >
      <SpaceBetween size="l">
        <Header variant="h1" description="Overview of your DNS resources and domain activity">
          Dashboard
        </Header>
        <Container header={<Header variant="h2">Route 53 Dashboard</Header>}>
          <Box padding="xxl" textAlign="center" color="inherit">
            <SpaceBetween size="m">
              <b>Coming Soon</b>
              <Box variant="p" color="inherit">
                Route 53 dashboard metrics, domain statistics, and resource summary features are under development.
              </Box>
            </SpaceBetween>
          </Box>
        </Container>
      </SpaceBetween>
    </ConsoleLayout>
  );
}
