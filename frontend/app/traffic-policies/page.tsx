'use client';

import React from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import ConsoleLayout from '@/components/ConsoleLayout';

export default function TrafficPoliciesPage() {
  return (
    <ConsoleLayout
      breadcrumbs={[
        { text: 'Route 53', href: '/hosted-zones' },
        { text: 'Traffic policies', href: '/traffic-policies' },
      ]}
    >
      <SpaceBetween size="l">
        <Header variant="h1" description="Configure complex DNS routing logic across multiple endpoints">
          Traffic policies
        </Header>
        <Container header={<Header variant="h2">Traffic Flow Management</Header>}>
          <Box padding="xxl" textAlign="center" color="inherit">
            <SpaceBetween size="m">
              <b>Coming Soon</b>
              <Box variant="p" color="inherit">
                Traffic policy creation, visual policy editor, and policy record association features are under development.
              </Box>
            </SpaceBetween>
          </Box>
        </Container>
      </SpaceBetween>
    </ConsoleLayout>
  );
}
