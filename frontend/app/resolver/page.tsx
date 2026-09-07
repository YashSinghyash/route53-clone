'use client';

import React from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import ConsoleLayout from '@/components/ConsoleLayout';

export default function ResolverPage() {
  return (
    <ConsoleLayout
      breadcrumbs={[
        { text: 'Route 53', href: '/hosted-zones' },
        { text: 'Resolver', href: '/resolver' },
      ]}
    >
      <SpaceBetween size="l">
        <Header variant="h1" description="Configure hybrid cloud DNS resolution across VPCs and on-premises networks">
          Resolver
        </Header>
        <Container header={<Header variant="h2">Route 53 Resolver</Header>}>
          <Box padding="xxl" textAlign="center" color="inherit">
            <SpaceBetween size="m">
              <b>Coming Soon</b>
              <Box variant="p" color="inherit">
                Resolver inbound/outbound endpoints, forwarding rules, and VPC association features are under development.
              </Box>
            </SpaceBetween>
          </Box>
        </Container>
      </SpaceBetween>
    </ConsoleLayout>
  );
}
