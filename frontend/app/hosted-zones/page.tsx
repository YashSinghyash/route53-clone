'use client';

import React from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import ConsoleLayout from '@/components/ConsoleLayout';

export default function HostedZonesPage() {
  return (
    <ConsoleLayout
      breadcrumbs={[
        { text: 'Route 53', href: '/hosted-zones' },
        { text: 'Hosted zones', href: '/hosted-zones' },
      ]}
    >
      <SpaceBetween size="l">
        <Header variant="h1">Hosted zones</Header>
        <Container>
          <Box padding="l" textAlign="center" color="inherit">
            Hosted zones list view will be fully built in Phase 2.
          </Box>
        </Container>
      </SpaceBetween>
    </ConsoleLayout>
  );
}
