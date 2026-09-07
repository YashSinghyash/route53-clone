'use client';

import React from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import ConsoleLayout from '@/components/ConsoleLayout';

export default function ProfilesPage() {
  return (
    <ConsoleLayout
      breadcrumbs={[
        { text: 'Route 53', href: '/hosted-zones' },
        { text: 'Profiles', href: '/profiles' },
      ]}
    >
      <SpaceBetween size="l">
        <Header variant="h1" description="Manage and apply DNS configurations across multiple VPCs and AWS accounts">
          Profiles
        </Header>
        <Container header={<Header variant="h2">Route 53 Profiles</Header>}>
          <Box padding="xxl" textAlign="center" color="inherit">
            <SpaceBetween size="m">
              <b>Coming Soon</b>
              <Box variant="p" color="inherit">
                Route 53 profile management, resource associations, and cross-VPC DNS configuration sharing features are under development.
              </Box>
            </SpaceBetween>
          </Box>
        </Container>
      </SpaceBetween>
    </ConsoleLayout>
  );
}
